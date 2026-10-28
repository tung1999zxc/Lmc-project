// ============================================================================
// API BÁO CÁO NGÀY
// ----------------------------------------------------------------------------
// GET /api/report/daily
//   ?date=YYYY-MM-DD   ngày cần báo cáo (mặc định: hôm nay theo giờ VN)
//   ?force=1           bỏ qua cache, tính lại từ đầu
//   ?send=1            gửi tin nhắn Telegram kèm theo (luôn gửi, không chống trùng)
//   ?secret=xxx        bắt buộc khi send=1 (nếu đã cấu hình REPORT_SECRET)
//   hoặc header: x-report-secret: xxx
//
// Ví dụ dùng cho Task Scheduler:
//   curl "http://localhost:3000/api/report/daily?send=1&secret=XXX"
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

export async function GET(request) {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const force = url.searchParams.get("force") === "1";
  const wantSend = url.searchParams.get("send") === "1";

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
              "Secret không hợp lệ. Dùng header x-report-secret hoặc ?secret=",
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
        const text = formatTelegramMessage(payload);
        // Ưu tiên rich message (bảng native nền sáng). Nếu server chưa hỗ trợ
        // thì sendTelegramMessage tự fallback sang sendMessage + HTML.
        const richMessage = buildTelegramRichMessage(payload);
        try {
          const sendResult = await sendTelegramMessage(text, { richMessage });
          await markReportSent(db, date);
          telegram = {
            sent: true,
            sentAt: new Date().toISOString(),
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
