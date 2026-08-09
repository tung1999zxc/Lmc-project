// src/app/api/orders/analyze-failed-addresses/route.js
// Phân tích địa chỉ Hàn Quốc bị lỗi sau khi Kakao fail → chỉ ra field thiếu
// KHÔNG sửa, KHÔNG gợi ý, chỉ báo thiếu gì để user hỏi khách.
import { connectToDatabase } from "../../../../app/lib/mongodb.js";

export const maxDuration = 300;

const ANALYZE_PROMPT = `Bạn là chuyên gia phân tích địa chỉ Hàn Quốc bị lỗi.

NHIỆM VỤ:
- Nhận 1 địa chỉ Hàn Quốc (có thể bị OCR sai, thiếu thông tin, hoặc viết tắt)
- Kiểm tra địa chỉ có đủ 5 field bắt buộc không
- Trả về JSON ghi rõ field nào THIẤU và lý do vì sao (giải thích để user hỏi khách)

5 FIELD BẮT BUỘC của địa chỉ đầy đủ:
1. streetName: tên đường + suffix (로/길/대로) — vd: 펜타힐즈로, 군청로, 대로 중앙로
2. buildingNumber: số nhà chính (chỉ phần số đứng trước 동/호) — vd: 60, 23, 318-4
3. apartmentName: tên 단지 (chỉ khi có tòa + số phòng) — vd: 펜타힐즈, 번암주공아파트
4. building: số tòa (동) — vd: 105동, 106동
5. room: số phòng (호) — vd: 1302호, 209호

QUY TẮC PHÂN TÍCH:
- Địa chỉ dạng "city + dong + apartment + ho" (không có tên đường) → thiếu streetName, buildingNumber
- Địa chỉ dạng "city + road + number" (không có apartment/dong/ho) → có thể đủ nếu là nhà riêng, không thiếu
- Nếu input chỉ có POI (tên quán, tên công ty) → thiếu streetName, buildingNumber
- Phone, tên khách, postal code → BỎ QUA, không tính là field địa chỉ

CÁC KÝ TỰ KHÔNG PHẢI ĐỊA CHỈ (BỎ):
- Số điện thoại Hàn: 010-XXXX-XXXX, 010XXXXXXXX
- Tên khách ALL-CAPS Latin: "NGUYEN VAN A", "SRIPRATHAN SITTHICHOED"
- "room NNN", "Rm NNN", "호 NNN" — thường là số phòng nội bộ
- Postal code 5 số (riêng): 30100, 12345

ĐẦU RA (JSON duy nhất, không markdown):
{
  "missingFields": ["<field1>", "<field2>"],  // mảng rỗng [] nếu đủ
  "reason": "<1 câu giải thích tại sao địa chỉ này fail Kakao>",
  "hasCustomerName": true | false,  // có tên khách ALL-CAPS Latin lẫn vào không
  "hasPhone": true | false,  // có SĐT lẫn vào không
  "explanation": "<1 dòng tóm tắt>"
}

VÍ DỤ:

Input: "경산시 펜타힐즈 1302호"
→ missingFields: ["streetName", "buildingNumber"]
→ reason: "Có 단지 + số phòng, nhưng KHÔNG có tên đường + số nhà — Kakao không match được vì thiếu địa chỉ đường"
→ hasCustomerName: false
→ hasPhone: false
→ explanation: "Thiếu tên đường (펜타힐즈로) và số nhà (vd: 60)"

Input: "세종 조치원읍 근청로 23 106동 105호"
→ missingFields: []
→ reason: "Đủ 5 field: streetName(군청로) + buildingNumber(23) + apartmentName(번암주공 implied) + building(106) + room(105)"
→ hasCustomerName: false
→ hasPhone: false
→ explanation: "Đầy đủ thông tin (có thể OCR sai '근청로' → '군청로' nhưng vẫn đủ field)"

Input: "노원국 할글비석로318 01026098776 SRIPRATHAN SITTHICHOED"
→ missingFields: ["building", "room", "apartmentName"]
→ reason: "Có tên đường + số nhà, nhưng không có số tòa (동) và số phòng (호)"
→ hasCustomerName: true
→ hasPhone: true
→ explanation: "Bỏ phone + tên khách. Thiếu 동 + 호 + tên 단지 (nếu là apartment)"

Input: "경북 구미시 인동 동부로 53"
→ missingFields: []
→ reason: "Đủ: streetName(동부로) + buildingNumber(53). Nhà riêng nên không cần 동/호"
→ hasCustomerName: false
→ hasPhone: false
→ explanation: "Đủ cho địa chỉ nhà riêng"

Input: "kt gwanghwamun"
→ missingFields: ["streetName", "buildingNumber", "apartmentName", "building", "room"]
→ reason: "Chỉ có POI (tên cửa hàng), không có địa chỉ đường cụ thể"
→ hasCustomerName: false
→ hasPhone: false
→ explanation: "Chỉ có tên POI, không phải địa chỉ — cần hỏi khách địa chỉ cụ thể"

Bây giờ hãy phân tích địa chỉ sau (trả JSON duy nhất):
`;

/**
 * Gọi OpenAI gpt-4o-mini để phân tích địa chỉ lỗi.
 * Trả về { missingFields, reason, hasCustomerName, hasPhone, explanation } hoặc null nếu lỗi.
 */
async function analyzeViaOpenAI(address) {
  if (!address || !process.env.OPENAI_API_KEY) {
    throw new Error("Thiếu OPENAI_API_KEY");
  }

  const body = JSON.stringify({
    model: "gpt-4o-mini",
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: ANALYZE_PROMPT },
          { type: "input_text", text: `Input: ${JSON.stringify(address)}` },
        ],
      },
    ],
  });

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text}`);
  }

  const data = await res.json();
  const out =
    data?.output_text ||
    data?.output?.[0]?.content?.find((c) => c?.type === "output_text")?.text ||
    "";

  if (!out) throw new Error("OpenAI không trả về nội dung.");

  const jsonMatch = out.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Output không phải JSON: " + out.slice(0, 200));

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const missingList = Array.isArray(parsed.missingFields)
      ? parsed.missingFields.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const missingMap = {
      streetName: "tên đường",
      buildingNumber: "số nhà",
      apartmentName: "tên tòa nhà / 단지",
      building: "số tòa (동)",
      room: "số phòng (호)",
    };
    const addressMissing = missingList.length
      ? missingList.map((m) => missingMap[m] || m).join(", ")
      : "";
    return {
      missingFields: missingList,
      addressMissing,
      reason: String(parsed.reason || "").trim(),
      hasCustomerName: !!parsed.hasCustomerName,
      hasPhone: !!parsed.hasPhone,
      explanation: String(parsed.explanation || "").trim(),
    };
  } catch (e) {
    throw new Error("Parse JSON lỗi: " + e.message);
  }
}

export async function POST(req) {
  try {
    const { orderIds } = await req.json();
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return Response.json(
        { success: false, message: "orderIds phải là mảng không rỗng" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("orders");

    // Lấy các đơn fail
    const orders = await collection
      .find({ id: { $in: orderIds } })
      .project({ id: 1, address: 1 })
      .toArray();

    const results = [];
    for (const order of orders) {
      const oldAddress = String(order.address || "").trim();
      if (!oldAddress) {
        results.push({
          id: order.id,
          ok: false,
          reason: "empty",
          message: "Đơn rỗng địa chỉ",
        });
        continue;
      }

      try {
        const analysis = await analyzeViaOpenAI(oldAddress);
        // Lưu vào DB: addressMissing (string human-readable) + addressError (JSON raw)
        const setUpdate = {
          addressMissing: analysis.addressMissing, // string rỗng nếu đủ
          addressError: JSON.stringify({
            missingFields: analysis.missingFields,
            reason: analysis.reason,
            hasCustomerName: analysis.hasCustomerName,
            hasPhone: analysis.hasPhone,
            explanation: analysis.explanation,
          }),
          updatedAt: new Date(),
        };
        await collection.updateOne({ id: order.id }, { $set: setUpdate });
        results.push({
          id: order.id,
          ok: true,
          oldAddress,
          missingFields: analysis.missingFields,
          addressMissing: analysis.addressMissing,
          reason: analysis.reason,
          hasCustomerName: analysis.hasCustomerName,
          hasPhone: analysis.hasPhone,
          explanation: analysis.explanation,
        });
      } catch (err) {
        console.error(
          "[analyze-failed-addresses] Lỗi đơn",
          order.id,
          err?.message,
        );
        results.push({
          id: order.id,
          ok: false,
          oldAddress,
          reason: "openai_error",
          message: err?.message || "Lỗi OpenAI",
        });
      }
    }

    return Response.json({
      success: true,
      total: orderIds.length,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Lỗi trong POST /api/orders/analyze-failed-addresses:", error);
    return Response.json(
      { success: false, message: "Lỗi server nội bộ" },
      { status: 500 },
    );
  }
}
