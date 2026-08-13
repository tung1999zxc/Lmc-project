import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "Không có file nào được upload" }),
        { status: 400 },
      );
    }

    const uploadResults = [];

    for (const file of files) {
      if (!file || typeof file === "string") continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "xoa-don",
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        uploadStream.end(buffer);
      });

      uploadResults.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Upload thành công",
        urls: uploadResults,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Lỗi upload Cloudinary:", error);
    return new Response(
      JSON.stringify({ error: "Lỗi khi upload ảnh lên Cloudinary" }),
      { status: 500 },
    );
  }
}
