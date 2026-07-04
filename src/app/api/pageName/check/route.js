import { connectToDatabase } from "../../../lib/mongodb.js";

function normalizeText(text = "") {
  return text.toString().toLowerCase().trim().replace(/\s+/g, " ");
}

export async function GET(req) {
  try {
    const { db } = await connectToDatabase();
    const url = new URL(req.url);
    const pageName = url.searchParams.get("pageName");

    if (!pageName) {
      return new Response(JSON.stringify({ error: "Thiếu tên page" }), {
        status: 400,
      });
    }

    const searchName = normalizeText(pageName);

    const pages = await db.collection("pageName").find({}).toArray();

    const matched = pages.find((p) => {
      const dbName = normalizeText(p.pageName);
      return (
        dbName === searchName ||
        dbName.includes(searchName) ||
        searchName.includes(dbName)
      );
    });

    return new Response(
      JSON.stringify({
        isDuplicate: !!matched,
        data: matched || null,
        message: matched
          ? `Page này đã có trong công ty: ${matched.employee}`
          : "Page chưa có, có thể chạy",
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi check page:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi server khi check page" }),
      { status: 500 },
    );
  }
}
