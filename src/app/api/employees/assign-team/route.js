// src/app/api/employees/assign-team/route.js
import { connectToDatabase } from "../../../../app/lib/mongodb.js";

export async function PUT(req) {
  try {
    const body = await req.json();
    const { employeeName, assignedTeam, assignedTeams } = body;

    if (!employeeName) {
      return new Response(
        JSON.stringify({ error: "Thiếu tên nhân viên" }),
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();

    // Chuẩn hóa dữ liệu: hỗ trợ cả assignedTeam (string) và assignedTeams (mảng)
    let teamsArray = [];
    if (Array.isArray(assignedTeams)) {
      teamsArray = assignedTeams.filter((t) => t && t.trim() !== "");
    } else if (typeof assignedTeam === "string" && assignedTeam.trim() !== "") {
      teamsArray = [assignedTeam.trim()];
    }

    const update = {
      assignedTeams: teamsArray,
      assignedTeam: teamsArray[0] || "",
      // Đồng bộ team_id theo team đầu tiên trong danh sách để các logic filter khác
      // (lọc page theo team_id của nhân viên) hoạt động chính xác.
      team_id: teamsArray[0] || null,
    };

    const result = await db
      .collection("employees")
      .updateOne({ name: employeeName }, { $set: update });

    if (result.matchedCount === 0) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy nhân viên" }),
        { status: 404 },
      );
    }

    return new Response(
      JSON.stringify({
        message: `Đã gắn ${teamsArray.length} team cho ${employeeName}`,
        success: true,
        data: {
          assignedTeams: teamsArray,
          assignedTeam: teamsArray[0] || "",
          team_id: teamsArray[0] || null,
        },
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi PUT /api/employees/assign-team:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    const { db } = await connectToDatabase();

    if (teamId) {
      const sales = await db
        .collection("employees")
        .find({
          position: "salenhapdon",
          $or: [{ assignedTeam: teamId }, { assignedTeams: teamId }],
        })
        .toArray();

      return new Response(
        JSON.stringify({
          message: "Lấy danh sách sale thành công",
          data: sales,
        }),
        { status: 200 },
      );
    }

    const sales = await db
      .collection("employees")
      .find({ position: "salenhapdon" })
      .toArray();

    return new Response(
      JSON.stringify({
        message: "Lấy danh sách sale thành công",
        data: sales,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi GET /api/employees/assign-team:", error);
    return new Response(JSON.stringify({ error: "Lỗi server nội bộ" }), {
      status: 500,
    });
  }
}
