import { connectToDatabase } from "../../../../lib/mongodb.js";

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
 * API cập nhật thông tin vận chuyển theo STT.
 *
 * Có thể truyền qua query params:
 * PUT /api/partner/shipping/kho2/update-shippin-g-from-sheet?stt=123&shippingDate1=2026-08-04&trackingCode=ABC123&deliveryStatus=ĐÃ GỬI HÀNG&shippingDate2=2026-08-05%2010:30:00
 *   ?stt=123
 *   &shippingDate1=2026-08-04
 *   &trackingCode=ABC123
 *   &deliveryStatus=ĐÃ GỬI HÀNG
 *   &shippingDate2=2026-08-05 10:30:00
 *
 * Hoặc truyền JSON body:
 * {
 *   "stt": 123,
 *   "shippingDate1": "2026-08-04",
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

    // Chuẩn hóa chuỗi, nhưng vẫn cho phép truyền "" để xóa dữ liệu.
    for (const field of ALLOWED_FIELDS) {
      if (
        Object.prototype.hasOwnProperty.call(updateData, field) &&
        typeof updateData[field] === "string"
      ) {
        updateData[field] = updateData[field].trim();
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