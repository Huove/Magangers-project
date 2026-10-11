import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ensurePesertaByUserId } from "@/lib/ensurePeserta";

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));
  const admin = supabaseAdmin();


  const peserta = await ensurePesertaByUserId(auth.user.id);

  const payload = {
    nama_lengkap: body?.nama ?? null,
    email: body?.email ?? null,
    nomor_hp: body?.hp ?? null,

    nik: body?.nik ?? null,
    tempat_lahir: body?.tempat ?? null,
    tanggal_lahir: body?.tanggal ? body.tanggal : null,
    jenis_kelamin: body?.gender ?? null,

    alamat: body?.alamat ?? null,
    kota: body?.kota ?? null,
    provinsi: body?.provinsi ?? null,

    jenjang: body?.jenjang ?? null,
    sekolah: body?.sekolah ?? null,
    jurusan: body?.jurusan ?? null,
    kelas: body?.kelas ?? null,
    nisn: body?.nisn ?? null,

    pembimbing: body?.pembimbing ?? null,
    hp_pembimbing: body?.hpPembimbing ?? null,
  };

  const { error: upErr } = await admin
    .from("peserta")
    .update(payload)
    .eq("id", peserta.id);

  if (upErr) {
    return NextResponse.json(
      { message: "Update data diri error", detail: upErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "OK" }, { status: 200 });
}