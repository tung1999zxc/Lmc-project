// ============================================================================
// BẮT ĐẦU ĐĂNG NHẬP FACEBOOK (LẤY TOKEN TỰ ĐỘNG)
// ----------------------------------------------------------------------------
// GET /api/care-camp/facebook/login
//   - Tạo state chống CSRF, redirect sang Facebook Login.
//   - Facebook tự nhận diện phiên đăng nhập sẵn có (nick FB đang đăng nhập).
//   - Sau khi đồng ý, Facebook redirect về
//     /api/care-camp/facebook/callback?code=...&state=...
//
//   ?employee=Nguyễn Văn A   tên nhân viên (để callback biết lưu cho ai)
// ============================================================================

import {
  buildLoginUrl,
  createOAuthState,
  getAppOrigin,
  getFbAppConfig,
} from "../../../../lib/facebookOAuth.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req) {
  const { appId, configured } = getFbAppConfig();

  if (!configured) {
    return Response.json(
      {
        error:
          "Chưa cấu hình Facebook App. Thêm FB_APP_ID và FB_APP_SECRET vào .env.local",
        needSetup: true,
      },
      { status: 400 },
    );
  }

  const url = new URL(req.url);
  const employeeName = (url.searchParams.get("employee") || "").trim();
  const origin = getAppOrigin(req);
  const redirectUri = `${origin}/api/care-camp/facebook/callback`;

  const { state, cookie } = createOAuthState();

  // Lưu employee + state trong cookie để callback dùng lại
  const extraCookies = employeeName
    ? `fb_oauth_employee=${encodeURIComponent(employeeName)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`
    : "";

  const loginUrl = buildLoginUrl({ appId, redirectUri, state });

  return new Response(null, {
    status: 302,
    headers: {
      Location: loginUrl,
      "Set-Cookie": [cookie, extraCookies].filter(Boolean).join(", "),
      "Cache-Control": "no-store",
    },
  });
}
