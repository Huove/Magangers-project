import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.res;

  const admin = supabaseAdmin();

  const { data: peserta, error } = await admin
    .from("peserta")
    .select(`
      id,
      user_id,
      status,
      nama_lengkap,
      email,
      nomor_hp,
      nik,
      tempat_lahir,
      tanggal_lahir,
      jenis_kelamin,
      alamat,
      kota,
      provinsi,
      jenjang,
      sekolah,
      jurusan,
      kelas,
      nisn,
      pembimbing,
      hp_pembimbing
    `)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { message: "Query peserta error", detail: error.message },
      { status: 500 }
    );
  }

  // kalau belum ada row peserta
  if (!peserta) {
    return NextResponse.json({ peserta: null }, { status: 200 });
  }

  return NextResponse.json({ peserta }, { status: 200 });
}