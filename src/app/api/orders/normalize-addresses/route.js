import { connectToDatabase } from "../../../../app/lib/mongodb.js";

export const maxDuration = 300;

/**
 * Gọi lại API /api/address để chuẩn hóa 1 địa chỉ.
 * Tận dụng logic đã chạy ổn định ở OrderForm (gpt-5 + kakao, ~5–10s/đơn).
 */
async function normalizeViaAddressApi(input) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.APP_BASE_URL ||
    `http://127.0.0.1:${process.env.PORT || 3000}`;

  const url = `${baseUrl.replace(/\/$/, "")}/api/address`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`address API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  if (!data?.exists || !data?.normalizedAddress) {
    return { ok: false, normalizedAddress: "", reason: "kakao_not_found" };
  }
  return {
    ok: true,
    normalizedAddress: String(data.normalizedAddress).trim(),
    reason: "ok",
  };
}

export async function POST(req) {
  try {
    const { orderIds, concurrency = 3 } = await req.json();
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return Response.json(
        { success: false, message: "orderIds phải là mảng không rỗng" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("orders");

    // Sub-task: chuẩn hóa 1 đơn (lookup + gọi api + update db)
    const tasks = orderIds.map((id) => async () => {
      const order = await collection.findOne({ id });
      if (!order) {
        return {
          id,
          ok: false,
          reason: "not_found",
          message: "Không tìm thấy đơn",
        };
      }

      const cleanAddr = String(order.address || "").trim();
      if (!cleanAddr) {
        return {
          id,
          ok: false,
          reason: "empty",
          message: "Đơn rỗng địa chỉ",
        };
      }

      try {
        const { ok, normalizedAddress, reason } =
          await normalizeViaAddressApi(cleanAddr);

        if (ok && normalizedAddress) {
          // Chỉ lưu normalizedAddress — KHÔNG ghi đè address (giữ text gốc)
          await collection.updateOne(
            { id },
            {
              $set: {
                normalizedAddress,
                updatedAt: new Date(),
              },
            },
          );
          return {
            id,
            ok: true,
            oldAddress: cleanAddr,
            newNormalizedAddress: normalizedAddress,
            reason: "updated",
          };
        }
        return {
          id,
          ok: false,
          oldAddress: cleanAddr,
          reason: reason || "unknown",
          message: "Không chuẩn hóa được",
        };
      } catch (err) {
        console.error("Lỗi chuẩn hóa đơn", id, err?.message);
        return {
          id,
          ok: false,
          oldAddress: cleanAddr,
          reason: "error",
          message: err?.message || "Lỗi mạng/server",
        };
      }
    });

    // Chạy với giới hạn concurrency (mặc định 2) — tránh OpenAI rate limit
    const results = [];
    const limit = Math.max(1, Math.min(5, Number(concurrency) || 2));

    for (let i = 0; i < tasks.length; i += limit) {
      const batch = tasks.slice(i, i + limit).map((t) => t());
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);

      // Nghỉ giữa các batch để tránh OpenAI 429 (TPM rate limit)
      if (i + limit < tasks.length) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    const successCount = results.filter((r) => r.ok).length;
    const failCount = results.length - successCount;

    return Response.json({
      success: true,
      total: orderIds.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error("Lỗi /api/orders/normalize-addresses:", error);
    return Response.json(
      {
        success: false,
        message: "Lỗi server",
        error: error?.message,
      },
      { status: 500 },
    );
  }
}
