import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "raffles";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "File is required." },
      { status: 400 }
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image uploads are supported." },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop() ?? "jpg";
  const filePath = `raffles/${crypto.randomUUID()}.${ext}`;

  const supabase = supabaseAdmin();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[upload] failed:", error.message);
    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return NextResponse.json({ url: publicUrl }, { status: 200 });
}

