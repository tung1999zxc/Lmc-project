// src/app/api/rulesCompany/item/[id]/route.js
import { connectToDatabase } from "../../../../lib/mongodb.js";

/**
 * PUT    /api/rulesCompany/item/[id]   -> cập nhật 1 nội quy theo id
 * DELETE /api/rulesCompany/item/[id]   -> xoá (hoặc soft-delete) 1 nội quy theo id
 *                                        query ?hard=1 để xóa thật khỏi DB
 *
 * Collection: rulesCompany
 *
 * Lưu ý: route được đặt trong thư mục `item/[id]` (không phải `[id]`)
 *        để tránh xung đột routing với `ack/[id]`.
 */

const VALID_CATS = ["general", "work", "time", "security", "discipline"];
const VALID_COLORS = ["red", "yellow", "green"];

function parseId(raw) {
  if (raw === null || raw === undefined) return null;
  const cleaned = String(raw).replace(/[^0-9]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function PUT(req, { params }) {
  try {
    // Next.js 15: params là Promise, cần await trước khi truy cập
    const resolvedParams = await params;
    console.log(
      "[api/rulesCompany/item/[id]] PUT params =",
      JSON.stringify(resolvedParams)
    );
    const id = parseId(resolvedParams?.id);
    if (id === null) {
      return new Response(
        JSON.stringify({
          error: "ID nội quy không hợp lệ",
          received: resolvedParams?.id,
        }),
        { status: 400 }
      );
    }

    const body = await req.json();
    const allowed = [
      "cat",
      "title",
      "desc",
      "tag",
      "color",
      "body",
      "order",
      "active",
      "important",
    ];
    const update = {};
    for (const k of allowed) {
      if (body[k] !== undefined) update[k] = body[k];
    }

    if (update.cat !== undefined && !VALID_CATS.includes(update.cat)) {
      return new Response(
        JSON.stringify({
          error: `Danh mục không hợp lệ. Chỉ chấp nhận: ${VALID_CATS.join(", ")}`,
        }),
        { status: 400 }
      );
    }
    if (update.color !== undefined && !VALID_COLORS.includes(update.color)) {
      return new Response(
        JSON.stringify({
          error: `Màu không hợp lệ. Chỉ chấp nhận: ${VALID_COLORS.join(", ")}`,
        }),
        { status: 400 }
      );
    }
    if (update.title !== undefined) {
      if (typeof update.title !== "string" || !update.title.trim()) {
        return new Response(
          JSON.stringify({ error: "Tiêu đề không được để trống" }),
          { status: 400 }
        );
      }
      update.title = update.title.trim();
    }
    if (update.desc !== undefined) update.desc = String(update.desc || "").trim();
    if (update.tag !== undefined) update.tag = String(update.tag || "NỘI QUY").trim();

    const { db } = await connectToDatabase();
    update.updatedAt = new Date();

    const result = await db
      .collection("rulesCompany")
      .findOneAndUpdate(
        { id },
        { $set: update },
        { returnDocument: "after" }
      );

    const updated = result && result.value !== undefined ? result.value : result;

    if (!updated) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy nội quy" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Cập nhật nội quy thành công",
        data: updated,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi PUT /api/rulesCompany/item/[id]:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    // Next.js 15: params là Promise, cần await trước khi truy cập
    const resolvedParams = await params;
    const id = parseId(resolvedParams?.id);
    if (id === null) {
      return new Response(
        JSON.stringify({
          error: "ID nội quy không hợp lệ",
          received: resolvedParams?.id,
        }),
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const hard = searchParams.get("hard") === "1";

    const { db } = await connectToDatabase();
    let result;

    if (hard) {
      result = await db.collection("rulesCompany").deleteOne({ id });
      await db.collection("rulesCompanyAck").deleteMany({ ruleId: id });

      if (result.deletedCount === 0) {
        return new Response(
          JSON.stringify({ error: "Không tìm thấy nội quy để xóa" }),
          { status: 404 }
        );
      }
      return new Response(
        JSON.stringify({
          message: "Đã xóa vĩnh viễn nội quy",
          data: { id, hard: true },
        }),
        { status: 200 }
      );
    }

    result = await db
      .collection("rulesCompany")
      .findOneAndUpdate(
        { id },
        { $set: { active: false, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
    const updated = result && result.value !== undefined ? result.value : result;

    if (!updated) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy nội quy" }),
        { status: 404 }
      );
    }
    return new Response(
      JSON.stringify({
        message: "Đã ẩn nội quy (soft-delete)",
        data: updated,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi DELETE /api/rulesCompany/item/[id]:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}