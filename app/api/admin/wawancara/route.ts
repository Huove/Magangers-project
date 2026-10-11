import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);

  if (!auth.ok) {
    return auth.res;
  }

  const admin = supabaseAdmin();

  // Hanya ambil peserta yang sudah masuk tahap wawancara.
  // Peserta yang belum dijadwalkan tetap akan muncul di sini.
  const { data, error } = await admin
    .from("peserta")
    .select(`
      id,
      status,
      nama_lengkap,
      email,
      sekolah,
      jurusan,
      pengajuan_magang (
        id,
        posisi,
        status,
        tanggal_pengajuan
      ),
      jadwal_wawancara (
        id,
        interviewer,
        tanggal,
        jam,
        metode,
        lokasi,
        status,
        catatan
      )
    `)
    .eq("status", "wawancara")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        message: "Query error",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  const items = (data ?? []).map((row: any) => {
    // ==============================
    // PENGAJUAN TERBARU
    // ==============================
    const pengajuanArr = Array.isArray(row.pengajuan_magang)
      ? row.pengajuan_magang
      : [];

    const latestPengajuan =
      pengajuanArr
        .sort(
          (a: any, b: any) =>
            new Date(b.tanggal_pengajuan).getTime() -
            new Date(a.tanggal_pengajuan).getTime()
        )[0] ?? null;

    // ==============================
    // JADWAL WAWANCARA TERBARU
    // ==============================
    const jadwalArr = Array.isArray(row.jadwal_wawancara)
      ? row.jadwal_wawancara
      : [];

    const jadwal =
      jadwalArr
        .sort(
          (a: any, b: any) => {
            const dateA = a?.tanggal
              ? new Date(a.tanggal).getTime()
              : 0;

            const dateB = b?.tanggal
              ? new Date(b.tanggal).getTime()
              : 0;

            return dateB - dateA;
          }
        )[0] ?? null;

    return {
      id: row.id,
      peserta_id: row.id,

      // Kalau belum punya jadwal → null
      jadwal_id: jadwal?.id ?? null,

      nama: row.nama_lengkap ?? "-",
      email: row.email ?? "-",
      sekolah: row.sekolah ?? "-",
      posisi: latestPengajuan?.posisi ?? "-",

      interviewer: jadwal?.interviewer ?? "-",
      tanggal: jadwal?.tanggal ?? "",
      jam: jadwal?.jam ?? "",
      metode: jadwal?.metode ?? "Offline",
      lokasi: jadwal?.lokasi ?? "",

      // Kalau belum punya jadwal:
      // "Belum Dijadwalkan"
      //
      // Kalau sudah punya jadwal:
      // gunakan status dari jadwal
      status: jadwal?.status ?? "Belum Dijadwalkan",
    };
  });

  return NextResponse.json({
    data: items,
  });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);

  if (!auth.ok) {
    return auth.res;
  }

  const body = await req.json().catch(() => ({}));

  const {
    peserta_id,
    interviewer,
    tanggal,
    jam,
    metode,
    lokasi,
  } = body;

  // ==============================
  // VALIDASI DATA
  // ==============================
  if (!peserta_id || !interviewer || !tanggal || !jam) {
    return NextResponse.json(
      {
        message: "Data jadwal tidak lengkap",
      },
      { status: 400 }
    );
  }

  const admin = supabaseAdmin();

  // ==============================
  // PASTIKAN PESERTA SUDAH
  // MASUK TAHAP WAWANCARA
  // ==============================
  const { data: peserta, error: pesertaCheckError } = await admin
    .from("peserta")
    .select("id, status")
    .eq("id", peserta_id)
    .maybeSingle();

  if (pesertaCheckError) {
    return NextResponse.json(
      {
        message: "Gagal mengecek peserta",
        detail: pesertaCheckError.message,
      },
      { status: 500 }
    );
  }

  if (!peserta) {
    return NextResponse.json(
      {
        message: "Peserta tidak ditemukan",
      },
      { status: 404 }
    );
  }

  if (peserta.status !== "wawancara") {
    return NextResponse.json(
      {
        message:
          "Peserta belum berada pada tahap wawancara.",
      },
      { status: 400 }
    );
  }

  // ==============================
  // CEK APAKAH SUDAH ADA JADWAL
  // ==============================
  const { data: existing, error: existingError } = await admin
    .from("jadwal_wawancara")
    .select("id")
    .eq("peserta_id", peserta_id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      {
        message: "Gagal mengecek jadwal wawancara",
        detail: existingError.message,
      },
      { status: 500 }
    );
  }

  // ==============================
  // UPDATE JADWAL YANG SUDAH ADA
  // ==============================
  if (existing?.id) {
    const { error } = await admin
      .from("jadwal_wawancara")
      .update({
        interviewer,
        tanggal,
        jam,
        metode: metode ?? "Offline",
        lokasi: lokasi ?? null,
        status: "Dijadwalkan",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json(
        {
          message: "Update jadwal error",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Jadwal wawancara berhasil diperbarui",
      id: existing.id,
    });
  }

  // ==============================
  // BUAT JADWAL BARU
  // ==============================
  const { data, error } = await admin
    .from("jadwal_wawancara")
    .insert({
      peserta_id,
      interviewer,
      tanggal,
      jam,
      metode: metode ?? "Offline",
      lokasi: lokasi ?? null,
      status: "Dijadwalkan",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      {
        message: "Insert jadwal error",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Jadwal wawancara berhasil dibuat",
    id: data.id,
  });
}