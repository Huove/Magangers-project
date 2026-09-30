import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function mapStatus(appStatus: string) {
  if (appStatus === "diajukan") return "Menunggu";
  if (appStatus === "diproses") return "Diperiksa";
  if (appStatus === "revisi") return "Revisi";
  if (appStatus === "diterima") return "Diterima";
  if (appStatus === "ditolak") return "Ditolak";
  if (appStatus === "draft") return "Draft";
  return appStatus;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const admin = supabaseAdmin();

  const { data, error } = await admin
    .from("v_admin_pelamar")
    .select(`
      peserta_id,
      nama_lengkap,
      email,
      nomor_hp,
      sekolah,
      jurusan,
      alamat,
      pengajuan_id,
      posisi,
      catatan,
      pengajuan_status,
      tanggal_pengajuan,
      total_pengajuan
    `)
    .order("tanggal_pengajuan", { ascending: false });

  if (error) {
    return NextResponse.json({ message: "Query error", detail: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((row: any) => ({
    // ✅ id sekarang = peserta_id (biar 1 peserta 1 row)
    id: row.peserta_id,

    // ✅ pengajuan terbaru (buat approve/reject/revisi + dokumen)
    pengajuan_id: row.pengajuan_id,

    total_pengajuan: row.total_pengajuan ?? 1,

    nama: row.nama_lengkap ?? "-",
    email: row.email ?? "-",
    sekolah: row.sekolah ?? "-",
    jurusan: row.jurusan ?? "-",
    posisi: row.posisi ?? "-",
    alamat: row.alamat ?? "-",
    nohp: row.nomor_hp ?? "-",
    tanggal: row.tanggal_pengajuan,
    status: mapStatus(row.pengajuan_status),
    raw_status: row.pengajuan_status,
    catatan: row.catatan ?? null,
  }));

  return NextResponse.json({ data: items });
}