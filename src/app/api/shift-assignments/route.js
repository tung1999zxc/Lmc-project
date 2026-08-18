// src/app/api/shift-assignments/route.js
// Lưu phân công Sale theo ngày + ca cho team MKT
// Collection: shiftAssignments
// Doc shape: { date: "YYYY-MM-DD", shift: "morning" | ... , sale: "<tên sale>", teamsMKT: ["SON","HIEP"] }
import { connectToDatabase } from "../../../app/lib/mongodb.js";

const VALID_SHIFTS = new Set([
  "morning",
  "noon",
  "office",
  "evening",
  "sunday-morning",
  "sunday-afternoon",
  "sunday-evening",
]);

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = {};
    if (date) {
      query = { date };
    } else if (from || to) {
      const range = {};
      if (from) range.$gte = from;
      if (to) range.$lte = to;
      query = { date: range };
    } else {
      // Mặc định: lấy 1 tuần gần nhất tính từ hôm nay (giờ VN)
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 1); // hôm qua
      const end = new Date(now);
      end.setDate(end.getDate() + 7);     // +7 ngày

      const fmt = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      query = {
        date: { $gte: fmt(start), $lte: fmt(end) },
      };
    }

    const docs = await db
      .collection("shiftAssignments")
      .find(query)
      .toArray();
    return new Response(
      JSON.stringify({ message: "OK", data: docs }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi GET /api/shift-assignments:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}

// PUT body: { assignments: [{ date, shift, sale, teamsMKT: [] }, ...] }
// Mỗi (date, shift, sale) là 1 doc duy nhất — upsert.
// Hỗ trợ legacy: nếu client gửi 'teamMKT' (string) sẽ tự chuyển thành mảng 1 phần tử.
export async function PUT(req) {
  try {
    const body = await req.json();
    const { assignments } = body || {};
    if (!Array.isArray(assignments)) {
      return new Response(
        JSON.stringify({ error: "assignments phải là mảng" }),
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const ops = [];
    for (const a of assignments) {
      const { date, shift, sale, teamMKT, teamsMKT } = a || {};
      if (!date || !shift || !sale || !VALID_SHIFTS.has(shift)) continue;

      let teams = [];
      if (Array.isArray(teamsMKT)) {
        teams = teamsMKT.filter((t) => t && String(t).trim() !== "");
      } else if (typeof teamMKT === "string" && teamMKT.trim() !== "") {
        teams = [teamMKT.trim()];
      }

      ops.push({
        updateOne: {
          filter: { date, shift, sale },
          update: {
            $set: {
              date,
              shift,
              sale,
              teamsMKT: teams,
              updatedAt: new Date(),
            },
          },
          upsert: true,
        },
      });
    }

    if (ops.length === 0) {
      return new Response(
        JSON.stringify({ message: "Không có assignment hợp lệ" }),
        { status: 200 },
      );
    }

    const result = await db.collection("shiftAssignments").bulkWrite(ops);
    return new Response(
      JSON.stringify({
        message: `Đã lưu ${ops.length} phân công`,
        success: true,
        data: { upserted: result.upsertedCount, modified: result.modifiedCount },
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi PUT /api/shift-assignments:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}

// DELETE body: { date, shift, sale? }
// - Nếu có 'sale'   → xoá đúng 1 doc (date,shift,sale)
// - Nếu không 'sale'→ xoá tất cả doc của (date,shift)
export async function DELETE(req) {
  try {
    const body = await req.json();
    const { date, shift, sale } = body || {};
    if (!date || !shift) {
      return new Response(
        JSON.stringify({ error: "Thiếu date hoặc shift" }),
        { status: 400 },
      );
    }
    const { db } = await connectToDatabase();
    const filter = { date, shift };
    if (sale) filter.sale = sale;
    const result = await db.collection("shiftAssignments").deleteMany(filter);
    return new Response(
      JSON.stringify({
        message: `Đã xoá ${result.deletedCount} phân công`,
        success: true,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi DELETE /api/shift-assignments:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
