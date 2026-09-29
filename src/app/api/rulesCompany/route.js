// src/app/api/rulesCompany/route.js
import { connectToDatabase } from "../../lib/mongodb.js";

/**
 * Collection: rulesCompany
 * Mỗi document:
 *   {
 *     id:        Number,           // timestamp làm khóa chính
 *     cat:       String,           // general | work | time | security | discipline
 *     title:     String,           // tiêu đề nội quy
 *     desc:      String,           // mô tả ngắn
 *     tag:       String,           // nhãn hiển thị (VD: QUAN TRỌNG)
 *     color:     String,           // red | yellow | green
 *     body:      String,           // nội dung HTML chi tiết
 *     order:     Number,           // thứ tự hiển thị (mặc định = id)
 *     active:    Boolean,          // còn áp dụng hay không
 *     important: Boolean,          // nội quy quan trọng (đếm "Bắt buộc tuân thủ")
 *     createdAt: Date,
 *     updatedAt: Date,
 *     createdBy: String,           // username/employee_code người tạo
 *   }
 *
 * GET  /api/rulesCompany            -> lấy toàn bộ nội quy (chỉ active=true trừ khi ?all=1)
 * POST /api/rulesCompany            -> thêm nội quy mới
 */

const VALID_CATS = ["general", "work", "time", "security", "discipline"];
const VALID_COLORS = ["red", "yellow", "green"];

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get("all") === "1";

    const query = showAll ? {} : { active: { $ne: false } };
    const items = await db
      .collection("rulesCompany")
      .find(query)
      .sort({ order: 1, id: 1 })
      .toArray();

    return new Response(
      JSON.stringify({
        message: "Lấy danh sách nội quy thành công",
        data: items,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi GET /api/rulesCompany:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      cat,
      title,
      desc = "",
      tag = "NỘI QUY",
      color = "green",
      body: detailBody = "",
      order,
      important = false,
      createdBy = "",
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return new Response(
        JSON.stringify({ error: "Thiếu tiêu đề nội quy" }),
        { status: 400 }
      );
    }
    if (!cat || !VALID_CATS.includes(cat)) {
      return new Response(
        JSON.stringify({
          error: `Danh mục không hợp lệ. Chỉ chấp nhận: ${VALID_CATS.join(", ")}`,
        }),
        { status: 400 }
      );
    }
    if (color && !VALID_COLORS.includes(color)) {
      return new Response(
        JSON.stringify({
          error: `Màu không hợp lệ. Chỉ chấp nhận: ${VALID_COLORS.join(", ")}`,
        }),
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const id = Date.now();
    const now = new Date();

    const newRule = {
      id,
      cat,
      title: title.trim(),
      desc: (desc || "").trim(),
      tag: (tag || "NỘI QUY").trim(),
      color,
      body: detailBody || "",
      order: typeof order === "number" ? order : id,
      active: true,
      important: Boolean(important),
      createdAt: now,
      updatedAt: now,
      createdBy,
    };

    await db.collection("rulesCompany").insertOne(newRule);

    return new Response(
      JSON.stringify({
        message: "Thêm nội quy thành công",
        data: newRule,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi POST /api/rulesCompany:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}