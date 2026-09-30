import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const BUCKET = "dokumen-peserta";
const ALLOWED_JENIS = ["kartuPelajar", "ktp", "cv", "suratPengantar", "pasFoto"] as const;

function isAllowedJenis(x: any): x is (typeof ALLOWED_JENIS)[number] {
  return ALLOWED_JENIS.includes(x);
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.res;

  const form = await req.formData();
  const jenis = form.get("jenis");
  const file = form.get("file");

  if (!isAllowedJenis(jenis)) {
    return NextResponse.json(
      { message: "Jenis dokumen tidak valid" },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "File tidak ditemukan" },
      { status: 400 }
    );
  }

  // validasi tipe file (opsional tapi bagus)
  const allowedMime = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
  if (file.type && !allowedMime.includes(file.type)) {
    return NextResponse.json(
      { message: "Format file tidak didukung", detail: `mime=${file.type}` },
      { status: 400 }
    );
  }

  // validasi size (misal max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { message: "Ukuran file terlalu besar (maks 5MB)" },
      { status: 400 }
    );
  }

  const admin = supabaseAdmin();

  // ambil peserta_id dari user login
  const { data: peserta, error: pErr } = await admin
    .from("peserta")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (pErr) {
    return NextResponse.json(
      { message: "Query peserta error", detail: pErr.message },
      { status: 500 }
    );
  }
  if (!peserta) {
    return NextResponse.json(
      { message: "Peserta belum ada", detail: "Buat row peserta dulu untuk user ini" },
      { status: 400 }
    );
  }

  // tentukan extension (sekadar rapi)
  const originalName = file.name || "file";
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "bin";

  const path = `${peserta.id}/${jenis}-${Date.now()}.${ext}`;

  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });

  if (upErr) {
    return NextResponse.json(
      { message: "Upload storage error", detail: upErr.message },
      { status: 500 }
    );
  }

  // simpan metadata (upsert by peserta_id+jenis)
  const { error: dbErr } = await admin
    .from("dokumen_peserta")
    .upsert(
      {
        peserta_id: peserta.id,
        jenis,
        path,
        mime_type: file.type || null,
        size: file.size,
      },
      { onConflict: "peserta_id,jenis" }
    );

  if (dbErr) {
    return NextResponse.json(
      { message: "Simpan metadata error", detail: dbErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "OK", jenis, path }, { status: 200 });
}