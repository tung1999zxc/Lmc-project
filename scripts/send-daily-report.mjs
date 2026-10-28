// ============================================================================
// SCRIPT GỬI BÁO CÁO NGÀY QUA TELEGRAM (chạy độc lập, không cần Next.js)
// ----------------------------------------------------------------------------
// Dùng cho Task Scheduler Windows:
//   1. Đặt file .bat cạnh script này (xem send-daily-report.bat)
//   2. Task Scheduler -> Create Task -> Trigger: Daily 21:00
//      Program: node.exe
//      Arguments: "C:\...\lmc\Lmc-project\scripts\send-daily-report.mjs"
//      Start in:    "C:\...\lmc\Lmc-project"
//
// Script tự:
//   - Nạp .env.local
//   - Tính báo cáo cho "hôm nay" (giờ Việt Nam)
//   - Gửi Telegram (luôn gửi, không chống trùng)
//   - Thoát luôn -> tốn 0 tài nguyên khi không chạy
//
// Usage:
//   node scripts/send-daily-report.mjs
//   node scripts/send-daily-report.mjs --date=2026-10-24
//   node scripts/send-daily-report.mjs --slot=noon   (báo cáo trưa 12h)
//   node scripts/send-daily-report.mjs --slot=end    (báo cáo tổng kết 21h)
//   node scripts/send-daily-report.mjs --dry-run   (chỉ in ra nội dung)
//   node scripts/send-daily-report.mjs --log=logs/x.log  (ghi thêm ra file)
//
// Khi chạy từ Task Scheduler, stdout bị bỏ qua -> dùng --log để lưu lại
// lịch sử gửi (giống cách redirect của file .bat).
// ============================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Nạp .env.local vào process.env (không dùng dotenv để tránh phụ thuộc)
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
    // Bỏ dấu nháy bao quanh nếu có
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
const dryRun = args.includes("--dry-run");
const dateArg = getArg("date");
const slotArg = getArg("slot");
const logArg = getArg("log");

// ---------------------------------------------------------------------------
// Ghi log ra file (dùng khi chạy từ Task Scheduler, stdout không được giữ)
// ---------------------------------------------------------------------------
if (logArg) {
  const logPath = path.isAbsolute(logArg)
    ? logArg
    : path.join(ROOT, logArg);
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(
      logPath,
      `\n===== ${new Date().toISOString()} =====\n`,
      "utf8",
    );
    // Tee stdout/stderr vào file log
    const origWrite = process.stdout.write.bind(process.stdout);
    const origErrWrite = process.stderr.write.bind(process.stderr);
    const toFile = (stream, orig) => (chunk, ...rest) => {
      try {
        fs.appendFileSync(logPath, chunk);
      } catch {}
      return orig(chunk, ...rest);
    };
    process.stdout.write = toFile(process.stdout, origWrite);
    process.stderr.write = toFile(process.stderr, origErrWrite);
  } catch (e) {
    console.error("[daily-report] Không ghi được log file:", e?.message);
  }
}

// ---------------------------------------------------------------------------
// Import lõi logic (sau khi đã nạp env vì lib/mongodb.js đọc process.env lúc import)
// ---------------------------------------------------------------------------
const {
  buildDailyReport,
  buildTelegramRichMessage,
  formatTelegramMessage,
  getVnToday,
  markReportSent,
  sendTelegramMessage,
} = await import("../src/app/lib/report/dailyReport.mjs");
const { connectToDatabase } = await import("../src/app/lib/mongodb.mjs");

const date = /^\d{4}-\d{2}-\d{2}$/.test(dateArg || "") ? dateArg : getVnToday();
const slot = ["noon", "end"].includes(slotArg) ? slotArg : null;

console.log(`[daily-report] Ngày: ${date}${slot ? ` | slot: ${slot}` : ""}`);

const { db } = await connectToDatabase();

// Không chống gửi trùng: chạy là gửi ngay.

const payload = await buildDailyReport(db, date);
const text = formatTelegramMessage(payload, { slot });
// Rich message -> bảng native nền sáng (Bot API 10.1+)
const richMessage = buildTelegramRichMessage(payload, { slot });

console.log("----------------------------------------");
console.log(text);
console.log("----------------------------------------");

if (dryRun) {
  console.log("[daily-report] --dry-run: không gửi Telegram.");
  console.log("----------------------------------------");
  console.log("Rich message blocks (dùng khi gửi thật):");
  console.log(JSON.stringify(richMessage, null, 2));
  console.log("----------------------------------------");
  process.exit(0);
}

try {
  const sendResult = await sendTelegramMessage(text, { richMessage });
  await markReportSent(db, date);
  const modes = [...new Set((sendResult.results || []).map((r) => r.mode))];
  console.log(
    `[daily-report] Đã gửi Telegram cho ngày ${date} — thành công ${sendResult.sent} chat, thất bại ${sendResult.failed} chat.`,
  );
  console.log(`[daily-report] Chế độ gửi: ${modes.join(", ") || "n/a"}`);
  if (sendResult.errors?.length) {
    sendResult.errors.forEach((e) =>
      console.error(`  ✗ ${e.chatId}: ${e.error}`),
    );
  }
} catch (err) {
  console.error("[daily-report] Lỗi gửi Telegram:", err?.message || err);
  process.exit(1);
}

process.exit(0);
