// ============================================================================
// CALLBACK FACEBOOK — NHẬN TOKEN & LƯU VÀO DB
// ----------------------------------------------------------------------------
// GET /api/care-camp/facebook/callback?code=...&state=...
//   - Kiểm tra state (chống CSRF).
//   - Đổi code -> access token 60 ngày.
//   - Lấy danh sách tài khoản QC user có quyền.
//   - LƯU token + tài khoản vào `careCampEmployees` (theo nhân viên).
//   - Redirect về trang Care Camp kèm kết quả (success/error).
//
// Lưu ý: cookie `fb_oauth_employee` được đặt ở /api/care-camp/facebook/login
// ============================================================================

import { connectToDatabase } from "../../../../lib/mongodb.js";
import { saveEmployeeSettings } from "../../../../lib/careCamp.mjs";
import {
  completeOAuthFlow,
  getAppOrigin,
  getFbAppConfig,
  readOAuthState,
} from "../../../../lib/facebookOAuth.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

function readCookie(req, name) {
  const raw = req.headers.get("cookie") || "";
  const match = raw.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : "";
}

/** Trang kết quả (đóng popup, báo lỗi nếu có). */
function resultHtml(origin, ok, message, extra = {}) {
  const payload = JSON.stringify({ ok, message, ...extra }).replace(
    /</g,
    "\\u003c",
  );
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8">
<title>${ok ? "✅ Lấy token thành công" : "❌ Lỗi lấy token"}</title>
<style>
  body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#f4f6fa;margin:0;padding:40px;text-align:center}
  .box{max-width:520px;margin:auto;background:#fff;padding:32px;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.08)}
  h1{color:${ok ? "#1877f2" : "#c0392b"};margin:0 0 14px;font-size:22px}
  p{color:#555;line-height:1.7;font-size:14px}
  .btn{display:inline-block;background:#1877f2;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;margin-top:16px;font-weight:600;font-size:14px}
  code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px}
</style></head>
<body><div class="box">
<h1>${ok ? "✅ Đã lấy được Access Token" : "❌ Không lấy được token"}</h1>
<p>${message}</p>
<a class="btn" href="${origin}/care-camp">Về trang Care Camp</a>
</div>
<script>
(function(){
  var data = ${payload};
  // Báo về tab cha (nếu mở bằng popup)
  try {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: "FB_TOKEN_RESULT", payload: data }, "*");
      setTimeout(function(){ window.close(); }, 1200);
    }
  } catch(e){}
  // Lưu cờ để trang Care Camp có thể refresh
  try { localStorage.setItem("fbTokenResult", JSON.stringify(data)); } catch(e){}
})();
</script>
</body></html>`;
}

export async function GET(req) {
  const url = new URL(req.url);
  const origin = getAppOrigin(req) || new URL(req.url).origin;

  const error = url.searchParams.get("error");
  const errorDesc = url.searchParams.get("error_description");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (error) {
    return new Response(
      resultHtml(
        origin,
        false,
        `Facebook báo lỗi: <b>${error}</b>${errorDesc ? ` — ${errorDesc}` : ""}`,
      ),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  if (!code) {
    return new Response(
      resultHtml(origin, false, "Không nhận được mã <code>code</code> từ Facebook."),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  // Kiểm tra state
  const savedState = readOAuthState(req);
  if (savedState && state && savedState !== state) {
    return new Response(
      resultHtml(
        origin,
        false,
        "State không khớp (có thể phiên đăng nhập đã hết hạn). Hãy thử lại.",
      ),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const { appId, appSecret, configured } = getFbAppConfig();
  if (!configured) {
    return new Response(
      resultHtml(
        origin,
        false,
        "Chưa cấu hình FB_APP_ID / FB_APP_SECRET trên server.",
      ),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const employeeName = readCookie(req, "fb_oauth_employee");

  try {
    const result = await completeOAuthFlow(code, {
      appId,
      appSecret,
      redirectUri: `${origin}/api/care-camp/facebook/callback`,
    });

    // Lưu vào DB nếu biết nhân viên nào đang đăng nhập.
    // CHỈ lưu token — KHÔNG tự chọn tài khoản QC.
    // Nhân viên tự bấm chọn tài khoản trên giao diện.
    if (employeeName) {
      const { db } = await connectToDatabase();
      await saveEmployeeSettings(db, employeeName, {
        token: result.token,
      });
    }

    const accSummary = result.accounts.length
      ? `<br/>Nick này có quyền với <b>${result.accounts.length}</b> tài khoản QC — hãy bấm "Lấy TK QC" ở trang Care Camp để chọn.`
      : "";

    return new Response(
      resultHtml(
        origin,
        true,
        `Token đã được lưu${
          employeeName ? ` cho <b>${employeeName}</b>` : ""
        }.${accSummary}`,
        {
          employeeName,
          token: result.token,
          expiresAt: result.expiresAt,
          accounts: result.accounts,
        },
      ),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  } catch (err) {
    console.error("Lỗi callback Facebook OAuth:", err);
    return new Response(
      resultHtml(origin, false, `Lỗi: ${err?.message || "không xác định"}`),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}
