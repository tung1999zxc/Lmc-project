import { connectToDatabase } from "../../../../../lib/mongodb.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_FIELDS = [
  "shippingDate1",
  "trackingCode",
  "deliveryStatus",
  "shippingDate2",
];

function createJsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

/**
 * Chuẩn hóa ngày tháng về yyyy-MM-dd.
 *
 * Hỗ trợ:
 * 2026-08-05
 * 2026-08-05 10:30:00
 * 2026-08-05T10:30:00.000Z
 * 05/08/2026
 * 05-08-2026
 *
 * Truyền chuỗi rỗng "" thì giữ nguyên để xóa dữ liệu.
 */
function formatDateToYMD(value) {
  if (value === null || value === undefined) {
    return value;
  }

  const rawValue = String(value).trim();

  // Cho phép gửi chuỗi rỗng để xóa dữ liệu.
  if (rawValue === "") {
    return "";
  }

  // Trường hợp yyyy-MM-dd hoặc yyyy-MM-dd HH:mm:ss.
  const yearFirstMatch = rawValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (yearFirstMatch) {
    const year = Number(yearFirstMatch[1]);
    const month = Number(yearFirstMatch[2]);
    const day = Number(yearFirstMatch[3]);

    if (!isValidDateParts(year, month, day)) {
      throw new Error(`Ngày không hợp lệ: ${rawValue}`);
    }

    return `${String(year).padStart(4, "0")}-${String(month).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`;
  }

  // Trường hợp dd/MM/yyyy hoặc dd-MM-yyyy.
  const dayFirstMatch = rawValue.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (dayFirstMatch) {
    const day = Number(dayFirstMatch[1]);
    const month = Number(dayFirstMatch[2]);
    const year = Number(dayFirstMatch[3]);

    if (!isValidDateParts(year, month, day)) {
      throw new Error(`Ngày không hợp lệ: ${rawValue}`);
    }

    return `${String(year).padStart(4, "0")}-${String(month).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`;
  }

  // Thử xử lý các chuỗi ngày ISO hoặc định dạng Date hợp lệ khác.
  const parsedDate = new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Không thể chuyển đổi ngày: ${rawValue}`);
  }

  // Dùng UTC để tránh bị lệch ngày khi nhận chuỗi có múi giờ.
  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Kiểm tra ngày có thực sự tồn tại hay không.
 * Ví dụ 2026-02-30 sẽ không hợp lệ.
 */
function isValidDateParts(year, month, day) {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * API cập nhật thông tin vận chuyển theo STT.
 *
 * Có thể truyền qua query params:
 *
 * PUT /api/partner/shipping/kho2/update-shippin-g-from-sheet
 *   ?stt=123
 *   &shippingDate1=05/08/2026
 *   &trackingCode=ABC123
 *   &deliveryStatus=ĐÃ GỬI HÀNG
 *   &shippingDate2=2026-08-05 10:30:00
 *
 * Hoặc truyền JSON body:
 * {
 *   "stt": 123,
 *   "shippingDate1": "05/08/2026",
 *   "trackingCode": "ABC123",
 *   "deliveryStatus": "ĐÃ GỬI HÀNG",
 *   "shippingDate2": "2026-08-05 10:30:00"
 * }
 */
export async function PUT(req) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);

    let body = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Ưu tiên dữ liệu trong body, nếu không có thì lấy từ URL query.
    const rawStt = body.stt ?? searchParams.get("stt");
    const stt = Number(rawStt);

    if (!rawStt || !Number.isInteger(stt) || stt <= 0) {
      return createJsonResponse(
        {
          ok: false,
          message: "STT không hợp lệ",
        },
        400,
      );
    }

    const updateData = {};

    for (const field of ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updateData[field] = body[field];
        continue;
      }

      if (searchParams.has(field)) {
        updateData[field] = searchParams.get(field);
      }
    }

    if (Object.keys(updateData).length === 0) {
      return createJsonResponse(
        {
          ok: false,
          message: "Không có dữ liệu vận chuyển cần cập nhật",
          allowedFields: ALLOWED_FIELDS,
        },
        400,
      );
    }

    // Chuẩn hóa các giá trị dạng chuỗi.
    // Vẫn cho phép truyền "" để xóa dữ liệu.
    for (const field of ALLOWED_FIELDS) {
      if (
        Object.prototype.hasOwnProperty.call(updateData, field) &&
        typeof updateData[field] === "string"
      ) {
        updateData[field] = updateData[field].trim();
      }
    }

    // =========================================================
    // CHỖ CẦN SỬA: chuẩn hóa 2 trường ngày về yyyy-MM-dd
    // =========================================================
    try {
      if (Object.prototype.hasOwnProperty.call(updateData, "shippingDate1")) {
        updateData.shippingDate1 = formatDateToYMD(updateData.shippingDate1);
      }

      if (Object.prototype.hasOwnProperty.call(updateData, "shippingDate2")) {
        updateData.shippingDate2 = formatDateToYMD(updateData.shippingDate2);
      }
    } catch (dateError) {
      return createJsonResponse(
        {
          ok: false,
          message: dateError.message,
          requiredDateFormat: "yyyy-MM-dd",
        },
        400,
      );
    }
    // =========================================================

    // Chuẩn hóa deliveryStatus theo yêu cầu
    if (
      Object.prototype.hasOwnProperty.call(updateData, "deliveryStatus") &&
      updateData.deliveryStatus !== ""
    ) {
      if (updateData.deliveryStatus === "Đã nhận hàng") {
        updateData.deliveryStatus = "GIAO THÀNH CÔNG";
      } else {
        updateData.deliveryStatus = "ĐÃ GỬI HÀNG";
        // Chỉ xóa shippingDate2 khi deliveryStatus KHÔNG phải "ĐÃ NHẬN HÀNG"
        delete updateData.shippingDate2;
      }
    }

    updateData.updatedAt = new Date();

    const result = await db.collection("orders").updateOne(
      {
        stt,
      },
      {
        $set: updateData,
      },
    );

    if (result.matchedCount === 0) {
      return createJsonResponse(
        {
          ok: false,
          message: `Không tìm thấy đơn hàng có STT ${stt}`,
        },
        404,
      );
    }

    return createJsonResponse({
      ok: true,
      message: "Cập nhật thông tin vận chuyển thành công",
      stt,
      updatedFields: updateData,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Lỗi cập nhật vận chuyển theo STT:", error);

    return createJsonResponse(
      {
        ok: false,
        message: "Lỗi server",
        error: error.message,
      },
      500,
    );
  }
}

// Cho phép gọi bằng POST nếu phía Google Apps Script khó gửi PUT.
export async function POST(req) {
  return PUT(req);
}

export async function GET(req) {
  return PUT(req);
}
