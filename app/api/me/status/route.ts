import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.res;

  const admin = supabaseAdmin();

  const { data: peserta } = await admin
    .from("peserta")
    .select("id,status,nomor_peserta,nama_lengkap,email,nomor_hp")
    .eq("user_id", auth.user.id)
    .single();

  if (!peserta) return NextResponse.json({ message: "Peserta tidak ditemukan" }, { status: 404 });

  // pengajuan terakhir
  const { data: lastPengajuan } = await admin
    .from("pengajuan_magang")
    .select("id,status,catatan,tanggal_pengajuan")
    .eq("peserta_id", peserta.id)
    .order("tanggal_pengajuan", { ascending: false })
    .limit(1)
    .maybeSingle();

  // computed UI status
  let ui_status = peserta.status; // default

  if (lastPengajuan?.status === "revisi") ui_status = "revisi";
  if (lastPengajuan?.status === "diproses") ui_status = "wawancara";
  if (lastPengajuan?.status === "diajukan") ui_status = "mengajukan";

  return NextResponse.json({
    peserta,
    lastPengajuan,
    ui_status,
    revisi_note: lastPengajuan?.status === "revisi" ? lastPengajuan?.catatan : null,
  });
}