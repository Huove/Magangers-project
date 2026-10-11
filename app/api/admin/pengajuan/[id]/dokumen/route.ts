import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const BUCKET = "dokumen-peserta";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const { id } = await ctx.params;
  const admin = supabaseAdmin();

  // cari peserta_id dari pengajuan
  const { data: pengajuan, error: pErr } = await admin
    .from("pengajuan_magang")
    .select("id,peserta_id")
    .eq("id", id)
    .single();

  if (pErr || !pengajuan) {
    return NextResponse.json(
      { message: "Pengajuan tidak ditemukan", detail: pErr?.message },
      { status: 404 }
    );
  }

  const { data: rows, error } = await admin
    .from("dokumen_peserta")
    .select("jenis,path,mime_type,size,uploaded_at")
    .eq("peserta_id", pengajuan.peserta_id);

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

  const withUrl = await Promise.all(
    (rows ?? []).map(async (r) => {
      const { data: signed } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(r.path, 60 * 60);

      return { ...r, url: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json({ data: withUrl }, { status: 200 });
}