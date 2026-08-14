// src/app/api/employees/sync-team-id/route.js
// Đồng bộ team_id cho tất cả nhân viên dựa trên assignedTeams[0]
import { connectToDatabase } from "../../../../app/lib/mongodb.js";

export async function POST() {
  try {
    const { db } = await connectToDatabase();

    const cursor = db.collection("employees").find({
      assignedTeams: { $exists: true, $ne: [] },
    });

    let updated = 0;
    const details = [];

    for await (const emp of cursor) {
      const nextTeamId = Array.isArray(emp.assignedTeams) && emp.assignedTeams.length > 0
        ? emp.assignedTeams[0]
        : null;

      if (emp.team_id !== nextTeamId) {
        await db.collection("employees").updateOne(
          { _id: emp._id },
          { $set: { team_id: nextTeamId } }
        );
        updated++;
        details.push({ name: emp.name, oldTeamId: emp.team_id, newTeamId: nextTeamId });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Đã đồng bộ team_id cho ${updated} nhân viên`,
        updated,
        details,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Lỗi sync-team-id:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server nội bộ" }),
      { status: 500 }
    );
  }
}