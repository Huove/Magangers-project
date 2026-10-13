
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ensurePesertaByUserId } from "@/lib/ensurePeserta";

export const runtime = "nodejs";

type DataDiriBody = {
  nama?: string | null;
  email?: string | null;
  hp?: string | null;
  nik?: string | null;
  tempat?: string | null;
  tanggal?: string | null;
  gender?: string | null;
  alamat?: string | null;
  kota?: string | null;
  provinsi?: string | null;
  jenjang?: string | null;
  sekolah?: string | null;
  jurusan?: string | null;
  kelas?: string | null;
  nisn?: string | null;
  pembimbing?: string | null;
  hpPembimbing?: string | null;
};

function nullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(req: Request) {
  try {
    // ==========================================
    // AUTENTIKASI PENGGUNA
    // ==========================================
    const auth = await requireUser(req);

    if (!auth.ok) {
      return auth.res;
    }

    // ==========================================
    // BACA BODY REQUEST
    // ==========================================
    let body: DataDiriBody;

    try {
      body = (await req.json()) as DataDiriBody;
    } catch {
      return NextResponse.json(
        { message: "Data yang dikirim tidak valid." },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin();

    // ==========================================
    // PASTIKAN DATA PESERTA TERSEDIA
    // ==========================================
    const peserta = await ensurePesertaByUserId(auth.user.id);

    if (!peserta?.id) {
      return NextResponse.json(
        { message: "Data peserta tidak ditemukan." },
        { status: 404 }
      );
    }

    // ==========================================
    // SIAPKAN DATA PROFIL
    // ==========================================
    const payload = {
      nama_lengkap: nullableString(body.nama),
      email: nullableString(body.email),
      nomor_hp: nullableString(body.hp),

      nik: nullableString(body.nik),
      tempat_lahir: nullableString(body.tempat),
      tanggal_lahir: nullableString(body.tanggal),
      jenis_kelamin: nullableString(body.gender),

      alamat: nullableString(body.alamat),
      kota: nullableString(body.kota),
      provinsi: nullableString(body.provinsi),

      jenjang: nullableString(body.jenjang),
      sekolah: nullableString(body.sekolah),
      jurusan: nullableString(body.jurusan),
      kelas: nullableString(body.kelas),
      nisn: nullableString(body.nisn),

      // Data pembimbing sekolah
      pembimbing: nullableString(body.pembimbing),
      hp_pembimbing: nullableString(body.hpPembimbing),
    };

    // ==========================================
    // SIMPAN DATA KE DATABASE
    // ==========================================
    const { data, error } = await admin
      .from("peserta")
      .update(payload)
      .eq("id", peserta.id)
      .select("id, pembimbing, hp_pembimbing")
      .maybeSingle();

    if (error) {
      console.error("UPDATE DATA DIRI ERROR:", error);

      return NextResponse.json(
        {
          message: "Gagal menyimpan data diri.",
          detail: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { message: "Data peserta tidak berhasil diperbarui." },
        { status: 404 }
      );
    }

    // ==========================================
    // BERHASIL
    // ==========================================
    return NextResponse.json(
      {
        message: "Data diri berhasil disimpan.",
        data: {
          pembimbing: data.pembimbing,
          hp_pembimbing: data.hp_pembimbing,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/pendaftar/data-diri ERROR:", error);

    return NextResponse.json(
      {
        message: "Terjadi kesalahan pada server.",
        detail:
          error instanceof Error
            ? error.message
            : "Kesalahan tidak diketahui.",
      },
      { status: 500 }
    );
  }
}
