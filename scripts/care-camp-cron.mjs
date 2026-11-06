// ============================================================================
// SCRIPT CARE CAMP — GOM CHỈ SỐ & LƯU BÁO CÁO NHÂN VIÊN HÀNG NGÀY
// ----------------------------------------------------------------------------
// Dùng cho Task Scheduler Windows (chạy nền, mỗi 10 phút):
//   1. Task Scheduler -> Create Task -> Trigger: Daily 00:00
//      Program:    node.exe
//      Arguments:  "<path>\scripts\care-camp-cron.mjs" --log=logs\care-camp.log
//      Start in:   "<path>\lmc\Lmc-project"
//
// Script tự:
//   - Nạp .env.local
//   - Mỗi 10 phút: gom chỉ số Meta của TỪNG nhân viên (theo tài khoản họ đã
//     nhập trên web) -> tự động tắt nhóm vượt ngưỡng -> lưu báo cáo ngày.
//   - Ghi log ra file (dùng --log)
//   - Ctrl+C để dừng
//
// Usage:
//   node scripts/care-camp-cron.mjs
//   node scripts/care-camp-cron.mjs --once            (chạy 1 lần rồi thoát)
//   node scripts/care-camp-cron.mjs --date=2026-10-31  (ngày cụ thể)
//   node scripts/care-camp-cron.mjs --interval=5       (chu kỳ 5 phút)
//   node scripts/care-camp-cron.mjs --log=logs/care-camp.log
// ============================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Nạp .env.local vào process.env
// ---------------------------------------------------------------------------
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const raw = fs.readFileSync(file, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(ROOT, ".env.local"));
loadEnvFile(path.join(ROOT, ".env"));

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const getArg = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : null;
};
const runOnce = args.includes("--once");
const dateArg = getArg("date");
const intervalArg = Number(getArg("interval"));
const INTERVAL_MIN =
  Number.isFinite(intervalArg) && intervalArg > 0 ? intervalArg : 10;
const logArg = getArg("log");

if (logArg) {
  const logPath = path.isAbsolute(logArg) ? logArg : path.join(ROOT, logArg);
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(
      logPath,
      `\n===== ${new Date().toISOString()} =====\n`,
      "utf8",
    );
    const origWrite = process.stdout.write.bind(process.stdout);
    const origErrWrite = process.stderr.write.bind(process.stderr);
    const toFile =
      (stream, orig) =>
      (chunk, ...rest) => {
        try {
          fs.appendFileSync(logPath, chunk);
        } catch {}
        return orig(chunk, ...rest);
      };
    process.stdout.write = toFile(process.stdout, origWrite);
    process.stderr.write = toFile(process.stderr, origErrWrite);
  } catch (e) {
    console.error("[care-camp] Không ghi được log file:", e?.message);
  }
}

// ---------------------------------------------------------------------------
// Import lõi logic (sau khi nạp env)
// ---------------------------------------------------------------------------
const {
  autoPauseAll,
  buildAndSaveDailyReports,
  fetchAdItems,
  getEmployeeSettings,
  getVnDateStr,
  listTrackedEmployees,
  recordEmployeeSamples,
} = await import("../src/app/lib/careCamp.mjs");
const { connectToDatabase } = await import("../src/app/lib/mongodb.mjs");

const { db } = await connectToDatabase();

async function tick(dateStr) {
  const date = dateStr || getVnDateStr();
  console.log(
    `[care-camp] ===== Chạy lúc ${new Date().toLocaleString("vi-VN")} =====`,
  );

  // ----- 1. Gom chỉ số từng nhân viên -----
  const employees = await listTrackedEmployees(db);
  let okCount = 0;
  let totalAdsets = 0;

  for (const emp of employees) {
    const settings = await getEmployeeSettings(db, emp.employeeName);
    if (!settings) continue;

    if (!settings.token) {
      console.warn(`  ⚠ ${emp.employeeName}: chưa có Access Token — bỏ qua.`);
      continue;
    }
    if (!settings.accounts.length) {
      console.warn(
        `  ⚠ ${emp.employeeName}: chưa nhập tài khoản QC — bỏ qua.`,
      );
      continue;
    }

    try {
      const accountIds = settings.accounts.map((a) => a.id);
      const data = await fetchAdItems(
        accountIds,
        settings.token,
        date,
        "adsets",
      );
      const allItems = data.flatMap((acc) =>
        (acc.items || []).map((it) => ({ ...it, accountId: acc.accountId })),
      );
      await recordEmployeeSamples(db, settings, allItems, date);

      const errs = data.filter((d) => d.error);
      if (errs.length === 0) okCount += 1;
      totalAdsets += allItems.length;
      console.log(
        `  ✓ ${emp.employeeName}: ${allItems.length} nhóm / ${accountIds.length} tài khoản${
          errs.length ? ` — LỖI: ${errs[0].error}` : ""
        }`,
      );
    } catch (err) {
      console.error(`  ✗ ${emp.employeeName}: ${err?.message || err}`);
    }
  }

  console.log(
    `[care-camp] Gom chỉ số: ${okCount}/${employees.length} nhân viên OK, ${totalAdsets} nhóm.`,
  );

  // ----- 2. Tự động tắt nhóm vượt ngưỡng -----
  try {
    const actions = await autoPauseAll(db);
    const paused = actions.filter((a) => a.type === "pause").length;
    console.log(
      `[care-camp] Auto-pause: ${paused} nhóm bị tắt, ${actions.length} hành động.`,
    );
    actions
      .filter((a) => a.type === "pause")
      .forEach((a) => console.log(`    ✂ ${a.message}`));
  } catch (err) {
    console.error("[care-camp] Lỗi auto-pause:", err?.message || err);
  }

  // ----- 3. Dựng + lưu báo cáo ngày -----
  const reports = await buildAndSaveDailyReports(db, date);
  console.log(
    `[care-camp] Đã lưu ${(reports.saved || []).length} báo cáo ngày ${date}.`,
  );
  (reports.errors || []).forEach((e) => {
    console.error(`  ✗ ${e.employeeName}: ${e.error}`);
  });
  (reports.saved || []).forEach((s) => {
    console.log(
      `  ✓ ${s.employeeName}: ${s.totalAdsets} nhóm (${s.activeAdsets} chạy), tiêu ${Math.round(
        s.totalSpend,
      ).toLocaleString("vi-VN")}đ, KQ ${s.totalResults}`,
    );
  });
}

const fixedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateArg || "") ? dateArg : null;

try {
  await tick(fixedDate);
} catch (err) {
  console.error("[care-camp] Lỗi lần chạy đầu:", err?.message || err);
}

if (runOnce) {
  process.exit(0);
}

console.log(
  `[care-camp] Đang chạy nền, chu kỳ mỗi ${INTERVAL_MIN} phút. Ctrl+C để dừng.`,
);

const timer = setInterval(async () => {
  try {
    await tick(null);
  } catch (err) {
    console.error("[care-camp] Lỗi chu kỳ:", err?.message || err);
  }
}, INTERVAL_MIN * 60 * 1000);

process.on("SIGINT", () => {
  console.log("\n[care-camp] Đang dừng...");
  clearInterval(timer);
  process.exit(0);
});

process.on("SIGTERM", () => {
  clearInterval(timer);
  process.exit(0);
});
