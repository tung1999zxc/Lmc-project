// ============================================================================
// KIỂM TRA CẤU HÌNH FACEBOOK APP CHO CARE CAMP
// ----------------------------------------------------------------------------
// Chạy:  node scripts/check-fb-app.mjs
//
// Kiểm tra:
//   1. FB_APP_ID / FB_APP_SECRET có trong .env.local chưa
//   2. App có truy cập được không (gọi /me với app token)
//   3. Nếu có token nhân viên -> thử gọi /me/adaccounts
// ============================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

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

const appId = (process.env.FB_APP_ID || "").trim();
const appSecret = (process.env.FB_APP_SECRET || "").trim();

console.log("========== KIỂM TRA CẤU HÌNH FACEBOOK APP ==========\n");

// ---- 1. Biến môi trường ----
if (!appId || !appSecret) {
  console.log("❌ Thiếu FB_APP_ID / FB_APP_SECRET trong .env.local");
  console.log("\nCÁCH LẤY:");
  console.log("  1. https://developers.facebook.com -> Create App -> Business");
  console.log("  2. Thêm sản phẩm 'Facebook Login'");
  console.log("  3. Settings -> Valid OAuth Redirect URIs, thêm:");
  console.log("       http://localhost:3000/api/care-camp/facebook/callback");
  console.log("       https://<domain-cua-ban>/api/care-camp/facebook/callback");
  console.log("  4. Settings -> Basic -> copy App ID + App Secret");
  console.log("  5. Dán vào .env.local rồi chạy lại script này");
  process.exit(1);
}

console.log(`✅ FB_APP_ID      : ${appId}`);
console.log(`✅ FB_APP_SECRET  : ${appSecret.slice(0, 6)}•••• (đã có)`);
console.log(
  `ℹ️  APP_URL        : ${(process.env.NEXT_PUBLIC_APP_URL || "(tự suy ra)").trim()}\n`,
);

// ---- 2. Kiểm tra App có hoạt động ----
try {
  const url = new URL("https://graph.facebook.com/v20.0/me");
  url.searchParams.set("access_token", `${appId}|${appSecret}`);
  const res = await fetch(url.toString());
  const body = await res.json();

  if (body?.error) {
    console.log("❌ App token không hợp lệ:");
    console.log(`   ${body.error.message}`);
    console.log(
      "   -> Kiểm tra lại App ID / App Secret trong .env.local và trạng thái App.",
    );
    process.exit(1);
  }
  console.log("✅ App token hợp lệ (App hoạt động bình thường)\n");
} catch (err) {
  console.log(`❌ Không gọi được Facebook API: ${err?.message}`);
  process.exit(1);
}

// ---- 3. Kiểm tra token nhân viên đã lưu ----
try {
  const { connectToDatabase } = await import("../src/app/lib/mongodb.mjs");
  const { listTrackedEmployees, getEmployeeSettings } = await import(
    "../src/app/lib/careCamp.mjs"
  );

  const { db } = await connectToDatabase();
  const employees = await listTrackedEmployees(db);

  console.log(`📋 Nhân viên đã dùng Care Camp: ${employees.length}`);

  let valid = 0;
  for (const emp of employees) {
    const settings = await getEmployeeSettings(db, emp.employeeName);
    if (!settings?.token) continue;

    const url = new URL("https://graph.facebook.com/v20.0/me/adaccounts");
    url.searchParams.set("fields", "id,name");
    url.searchParams.set("limit", "1");
    url.searchParams.set("access_token", settings.token);
    const res = await fetch(url.toString());
    const body = await res.json();

    if (body?.error) {
      console.log(
        `  ❌ ${emp.employeeName}: token lỗi — ${body.error.message}`,
      );
    } else {
      valid += 1;
      console.log(
        `  ✅ ${emp.employeeName}: token OK (${(body?.data || []).length}+ tài khoản QC)`,
      );
    }
  }

  console.log(
    `\n📊 Kết quả: ${valid}/${employees.length} token hợp lệ.`,
  );
  console.log(
    valid > 0
      ? "✅ Sẵn sàng lấy token tự động trên trang /care-camp."
      : "ℹ️  Chưa có token nhân viên nào. Nhân viên dùng nút 'Lấy token tự động'.",
  );
  process.exit(0);
} catch (err) {
  console.log(`\n⚠️  Không kiểm tra được token nhân viên: ${err?.message}`);
  process.exit(0);
}
