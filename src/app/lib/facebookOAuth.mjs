// ============================================================================
// FACEBOOK OAuth — LẤY ACCESS TOKEN TỰ ĐỘNG TỪ NICK FB ĐANG ĐĂNG NHẬP
// ----------------------------------------------------------------------------
// Cơ chế (tương đương nút "⚡ LẤY TOKEN TỰ ĐỘNG" của extension, nhưng hoạt
// động trên WEB):
//
//   1. Người dùng bấm "Lấy token tự động" -> mở popup Facebook Login.
//      Facebook TỰ NHẬN DIỆN phiên đăng nhập sẵn có (cùng nick FB đang
//      đăng nhập trên máy) -> chỉ cần bấm "Tiếp tục".
//   2. Facebook redirect về /api/care-camp/facebook/callback?code=...
//   3. Server đổi `code` lấy access token (short-lived) rồi đổi tiếp lấy
//      LONG-LIVED TOKEN (60 ngày) bằng app_secret.
//   4. Lưu token vào `careCampEmployees` (theo nhân viên đang đăng nhập)
//      + trả về cho UI qua postMessage.
//
// YÊU CẦU (chỉ làm 1 lần):
//   - Tạo Facebook App (Business) tại https://developers.facebook.com
//   - Thêm "Facebook Login" -> Settings -> Valid OAuth Redirect URIs:
//       <ORIGIN>/api/care-camp/facebook/callback
//   - Lấy App ID + App Secret -> điền vào .env.local:
//       FB_APP_ID=...
//       FB_APP_SECRET=...
//   - App cần quyền: ads_read, ads_management, business_management,
//     pages_show_list, pages_messaging
//
// LƯU Ý BẢO MẬT:
//   - App Secret chỉ nằm server-side, KHÔNG gửi xuống trình duyệt.
//   - Access token của nhân viên lưu trong DB (mã hoá ở tầng DB).
// ============================================================================

import crypto from "crypto";

export const GRAPH_VERSION = "v20.0";

/** Scope cần thiết cho đọc chỉ số + bật/tắt nhóm quảng cáo. */
export const FB_SCOPES = [
  "ads_read",
  "ads_management",
  "business_management",
  "pages_show_list",
  "pages_messaging",
];

/** Lấy cấu hình Facebook App từ env. */
export function getFbAppConfig() {
  const appId = (process.env.FB_APP_ID || "").trim();
  const appSecret = (process.env.FB_APP_SECRET || "").trim();
  return {
    appId,
    appSecret,
    configured: !!appId && !!appSecret,
  };
}

/** Origin của app (dùng để tạo redirect_uri). */
export function getAppOrigin(request) {
  const configured = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
  if (configured) return configured.replace(/\/$/, "");
  try {
    return new URL(request.url).origin;
  } catch {
    return "";
  }
}

/**
 * Tạo state ngẫu nhiên + lưu vào cookie httpOnly để chống CSRF.
 * @returns {{state: string, cookie: string}}
 */
export function createOAuthState() {
  const state = crypto.randomBytes(24).toString("hex");
  const cookie = [
    `fb_oauth_state=${state}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=600`,
  ].join("; ");
  return { state, cookie };
}

/** Lấy state đã lưu trong cookie. */
export function readOAuthState(request) {
  const raw = request.headers.get("cookie") || "";
  const match = raw.match(/(?:^|;\s*)fb_oauth_state=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

/** URL đăng nhập Facebook (OAuth 2.0 code flow). */
export function buildLoginUrl({ appId, redirectUri, state, scopes = FB_SCOPES }) {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: scopes.join(","),
    state,
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params}`;
}

/** Đổi `code` -> access token (short-lived). */
export async function exchangeCodeForToken(code, { appId, appSecret, redirectUri }) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);

  const res = await fetch(url.toString(), { method: "GET" });
  const body = await res.json().catch(() => null);

  if (!res.ok || body?.error) {
    const msg =
      body?.error?.message || body?.error_description || `HTTP ${res.status}`;
    throw new Error(`Không đổi được code lấy token: ${msg}`);
  }
  return body;
}

/** Đổi short-lived token -> long-lived token (60 ngày). */
export async function exchangeForLongLivedToken(token, { appId, appSecret }) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", token);

  const res = await fetch(url.toString(), { method: "GET" });
  const body = await res.json().catch(() => null);

  if (!res.ok || body?.error) {
    const msg = body?.error?.message || `HTTP ${res.status}`;
    throw new Error(`Không lấy được token 60 ngày: ${msg}`);
  }
  return body;
}

/** Kiểm tra token + lấy thông tin user + danh sách quyền. */
export async function debugToken(token, { appId, appSecret }) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/debug_token`);
  url.searchParams.set("input_token", token);
  url.searchParams.set("access_token", `${appId}|${appSecret}`);

  const res = await fetch(url.toString(), { method: "GET" });
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.error) {
    throw new Error(
      body?.error?.message || `Không kiểm tra được token (HTTP ${res.status})`,
    );
  }
  return body?.data || {};
}

/**
 * Lấy danh sách tài khoản quảng cáo mà user có quyền.
 * @returns {Promise<Array<{id,name,currency,account_status,role}>}>}
 */
export async function fetchAdAccounts(token) {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/me/adaccounts`);
  url.searchParams.set(
    "fields",
    "id,name,currency,account_status,role,timezone_name",
  );
  url.searchParams.set("limit", "200");
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), { method: "GET" });
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.error) {
    throw new Error(
      body?.error?.message || `Không lấy được danh sách tài khoản QC (HTTP ${res.status})`,
    );
  }
  return body?.data || [];
}

/**
 * Quy trình đầy đủ: code -> token 60 ngày -> thông tin user + tài khoản QC.
 *
 * @param {string} code
 * @param {object} opts
 * @returns {Promise<{token:string, expiresAt:Date, user:object, accounts:Array}>}
 */
export async function completeOAuthFlow(code, opts) {
  const { appId, appSecret, redirectUri } = opts;

  const shortLived = await exchangeCodeForToken(code, {
    appId,
    appSecret,
    redirectUri,
  });
  const shortToken = shortLived.access_token;
  if (!shortToken) throw new Error("Facebook không trả về access_token");

  // Đổi sang token 60 ngày (nếu lỗi thì giữ token ngắn hạn)
  let token = shortToken;
  let expiresIn = Number(shortLived.expires_in) || 0;
  try {
    const longLived = await exchangeForLongLivedToken(shortToken, {
      appId,
      appSecret,
    });
    if (longLived.access_token) {
      token = longLived.access_token;
      expiresIn = Number(longLived.expires_in) || expiresIn;
    }
  } catch (err) {
    console.warn("[careCamp] Không đổi được token 60 ngày:", err?.message);
  }

  // Thông tin user
  let user = { id: "", name: "" };
  try {
    const info = await debugToken(token, { appId, appSecret });
    user = {
      id: info.user_id || "",
      name: info.name || info.user_id || "",
      scopes: info.scopes || [],
      expiresAt: info.expires_at ? new Date(info.expires_at * 1000) : null,
    };
  } catch {
    // Bỏ qua, không chặn luồng
  }

  // Danh sách tài khoản QC
  let accounts = [];
  try {
    accounts = await fetchAdAccounts(token);
  } catch (err) {
    console.warn("[careCamp] Không lấy được danh sách tài khoản QC:", err?.message);
  }

  return {
    token,
    expiresIn,
    expiresAt: expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : user.expiresAt || null,
    user,
    accounts,
  };
}
