// ============================================================================
// API BÁO CÁO NGÀY
// ----------------------------------------------------------------------------
// GET /api/report/daily
//   ?date=YYYY-MM-DD   ngày cần báo cáo (mặc định: hôm nay theo giờ VN)
//   ?slot=noon|end     "noon" = báo cáo trưa 12h, "end" = báo cáo tổng kết 21h.
//                      Bỏ trống -> tự suy ra theo giờ VN lúc chạy, hoặc theo
//                      header "x-vercel-cron-schedule" của Vercel Cron.
//   ?force=1           bỏ qua cache, tính lại từ đầu
//   ?send=1            gửi tin nhắn Telegram kèm theo (luôn gửi, không chống trùng)
//   ?secret=xxx        bắt buộc khi send=1 (nếu đã cấu hình REPORT_SECRET)
// hoặc header: x-report-secret: xxx
// hoặc header: Authorization: Bearer <CRON_SECRET>  (Vercel Cron gửi header này)
//
// Ví dụ dùng cho Task Scheduler:
//   curl "http://localhost:3000/api/report/daily?send=1&secret=XXX"
//
// Vercel Cron (luôn dùng UTC):
//   12:00 VN = 05:00 UTC  -> /api/report/daily?send=1&slot=noon&force=1
//   21:00 VN = 14:00 UTC  -> /api/report/daily?send=1&slot=end&force=1
//
// Lưu ý bảo mật: các API route khác của app hiện CHƯA có auth, nên endpoint
// này dùng secret riêng để tránh bị gọi/gửi Telegram bởi người ngoài.
// ============================================================================

import {
  buildTelegramRichMessage,
  checkReportSecret,
  formatTelegramMessage,
  getOrBuildDailyReport,
  getVnToday,
  markReportSent,
  sendTelegramMessage,
  withReportDb,
} from "../../../lib/report/dailyReport.mjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Báo cáo tổng kết 21:00 query nhiều collection -> dễ vượt timeout mặc định
// (10s) của Vercel Hobby. Cho phép tối đa 300s (giới hạn của Hobby).
export const maxDuration = 300;
export const runtime = "nodejs";

/**
 * Suy ra slot báo cáo (noon / end) khi request không chỉ định rõ.
 *
 * Thứ tự ưu tiên:
 *  1. Header "x-vercel-cron-schedule" của Vercel Cron (VD: "0 5 * * *" = 12:00 VN,
 *     "0 14 * * *" = 21:00 VN). Đây là tín hiệu đáng tin cậy nhất vì Vercel
 *     luôn chạy cron theo UTC.
 *  2. Giờ hiện tại theo múi giờ Việt Nam (fallback khi gọi tay).
 */
function resolveSlot(request, url) {
  const explicit = url.searchParams.get("slot");
  if (explicit === "noon" || explicit === "end") return explicit;

  const schedule = request.headers.get("x-vercel-cron-schedule");
  if (schedule) {
    // Cron UTC: giờ VN = giờ UTC + 7
    const hourMatch = schedule.trim().split(/\s+/)[1];
    const hourUtc = Number(hourMatch);
    if (Number.isInteger(hourUtc)) {
      const hourVn = (hourUtc + 7) % 24;
      return hourVn >= 15 || hourVn < 11 ? "end" : "noon";
    }
  }

  const hourVn = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(new Date()),
  );
  return hourVn >= 15 || hourVn < 11 ? "end" : "noon";
}

export async function GET(request) {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const force = url.searchParams.get("force") === "1";
  const wantSend = url.searchParams.get("send") === "1";
  const slot = resolveSlot(request, url);

  // Ngày mặc định = hôm nay theo giờ Việt Nam
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam || "")
    ? dateParam
    : getVnToday();

  try {
    // Chỉ kiểm tra secret khi thực sự gửi Telegram
    if (wantSend) {
      const auth = checkReportSecret(request);
      if (!auth.ok) {
        return new Response(
          JSON.stringify({
            ok: false,
            error:
              "Secret không hợp lệ. Dùng header x-report-secret, Authorization: Bearer hoặc ?secret=",
          }),
          { status: 401 },
        );
      }
    }

    const result = await withReportDb(async (db) => {
      const { payload, cached } = await getOrBuildDailyReport(db, date, {
        force,
      });

      let telegram = null;

      if (wantSend) {
        // Không chống gửi trùng: bấm là gửi ngay, luôn luôn.
        const text = formatTelegramMessage(payload, { slot });
        // Ưu tiên rich message (bảng native nền sáng). Nếu server chưa hỗ trợ
        // thì sendTelegramMessage tự fallback sang sendMessage + HTML.
        const richMessage = buildTelegramRichMessage(payload, { slot });
        try {
          const sendResult = await sendTelegramMessage(text, { richMessage });
          await markReportSent(db, date);
          telegram = {
            sent: true,
            sentAt: new Date().toISOString(),
            slot,
            chatCount: sendResult?.sent ?? 0,
            failedCount: sendResult?.failed ?? 0,
            mode: sendResult?.results?.[0]?.mode ?? "html",
            results: sendResult?.results ?? [],
            errors: sendResult?.errors ?? [],
          };
        } catch (sendErr) {
          // Lỗi gửi Telegram KHÔNG làm mất dữ liệu báo cáo.
          telegram = {
            sent: false,
            slot,
            error: sendErr?.message || "Không gửi được Telegram",
          };
          console.error("Lỗi gửi Telegram:", sendErr);
        }
      }

      return { payload, cached, telegram };
    });

    return new Response(
      JSON.stringify({
        ok: true,
        date,
        slot,
        cached: result.cached,
        data: result.payload,
        telegram: result.telegram,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi GET /api/report/daily:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Lỗi server nội bộ",
        detail: error?.message,
      }),
      { status: 500 },
    );
  }
}
