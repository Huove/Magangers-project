
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);

  if (!auth.ok) {
    return auth.res;
  }

  const admin = supabaseAdmin();

  // Ambil peserta beserta pengajuan dan jadwalnya.
  // Peserta yang belum dijadwalkan tetap bisa ditemukan.
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
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        message: "Query peserta dan jadwal error",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  const items = (data ?? [])
    .map((row: any) => {
      const pengajuanArr = Array.isArray(row.pengajuan_magang)
        ? row.pengajuan_magang
        : [];

      const latestPengajuan =
        [...pengajuanArr].sort(
          (a: any, b: any) =>
            new Date(b.tanggal_pengajuan ?? 0).getTime() -
            new Date(a.tanggal_pengajuan ?? 0).getTime()
        )[0] ?? null;

      // Hanya pengajuan yang sudah diproses atau diterima
      // yang bisa masuk daftar penjadwalan.
      if (
        !latestPengajuan ||
        !["diproses", "diterima"].includes(latestPengajuan.status)
      ) {
        return null;
      }

      const jadwalArr = Array.isArray(row.jadwal_wawancara)
        ? row.jadwal_wawancara
        : [];

      const jadwal =
        [...jadwalArr].sort(
          (a: any, b: any) =>
            new Date(b.tanggal ?? 0).getTime() -
            new Date(a.tanggal ?? 0).getTime()
        )[0] ?? null;

      return {
        id: row.id,
        peserta_id: row.id,
        jadwal_id: jadwal?.id ?? null,
        nama: row.nama_lengkap ?? "-",
        email: row.email ?? "-",
        sekolah: row.sekolah ?? "-",
        posisi: latestPengajuan.posisi ?? "-",
        interviewer: jadwal?.interviewer ?? "",
        tanggal: jadwal?.tanggal ?? "",
        jam: jadwal?.jam ?? "",
        metode: jadwal?.metode ?? "Offline",
        lokasi: jadwal?.lokasi ?? "",
        status: jadwal?.status ?? "Belum Dijadwalkan",
      };
    })
    .filter(Boolean);

  return NextResponse.json({ data: items });
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

  if (
    !peserta_id ||
    !interviewer ||
    !tanggal ||
    !jam
  ) {
    return NextResponse.json(
      { message: "Data jadwal tidak lengkap" },
      { status: 400 }
    );
  }

  const admin = supabaseAdmin();

  // 1. Periksa peserta.
  const { data: peserta, error: pesertaError } = await admin
    .from("peserta")
    .select("id, status")
    .eq("id", peserta_id)
    .maybeSingle();

  if (pesertaError) {
    return NextResponse.json(
      {
        message: "Gagal mengecek peserta",
        detail: pesertaError.message,
      },
      { status: 500 }
    );
  }

  if (!peserta) {
    return NextResponse.json(
      { message: "Peserta tidak ditemukan" },
      { status: 404 }
    );
  }

  // 2. Pastikan pengajuan terbaru sudah diproses.
  const { data: pengajuan, error: pengajuanError } = await admin
    .from("pengajuan_magang")
    .select("id, status, tanggal_pengajuan")
    .eq("peserta_id", peserta_id)
    .order("tanggal_pengajuan", { ascending: false })
    .limit(1);

  if (pengajuanError) {
    return NextResponse.json(
      {
        message: "Gagal mengecek pengajuan",
        detail: pengajuanError.message,
      },
      { status: 500 }
    );
  }

  const latestPengajuan = pengajuan?.[0];

  if (
    !latestPengajuan ||
    !["diproses", "diterima"].includes(latestPengajuan.status)
  ) {
    return NextResponse.json(
      {
        message:
          "Pengajuan peserta harus diproses sebelum wawancara dijadwalkan.",
      },
      { status: 400 }
    );
  }

  // 3. Periksa apakah jadwal sudah tersedia.
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

  const scheduleData = {
    interviewer,
    tanggal,
    jam,
    metode: metode ?? "Offline",
    lokasi: lokasi ?? null,
    status: "Dijadwalkan",
    updated_at: new Date().toISOString(),
  };

  let jadwalId: string | number;

  // 4. Simpan jadwal terlebih dahulu.
  if (existing?.id) {
    const { data: saved, error: updateError } = await admin
      .from("jadwal_wawancara")
      .update(scheduleData)
      .eq("id", existing.id)
      .select("id")
      .single();

    if (updateError) {
      return NextResponse.json(
        {
          message: "Update jadwal error",
          detail: updateError.message,
        },
        { status: 500 }
      );
    }

    jadwalId = saved.id;
  } else {
    const { data: saved, error: insertError } = await admin
      .from("jadwal_wawancara")
      .insert({
        peserta_id,
        ...scheduleData,
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          message: "Insert jadwal error",
          detail: insertError.message,
        },
        { status: 500 }
      );
    }

    jadwalId = saved.id;
  }

  // 5. Setelah jadwal tersimpan, baru ubah status peserta.
  if (peserta.status !== "wawancara") {
    const { data: updatedPeserta, error: statusError } = await admin
      .from("peserta")
      .update({
        status: "wawancara",
      })
      .eq("id", peserta_id)
      .eq("status", peserta.status)
      .select("id")
      .maybeSingle();

    if (statusError || !updatedPeserta) {
      console.error(
        "Gagal memperbarui status peserta:",
        statusError
      );

      return NextResponse.json(
        {
          message:
            "Jadwal berhasil disimpan, tetapi status peserta belum berhasil diperbarui. Silakan muat ulang dan periksa status peserta.",
          detail: statusError?.message ?? "Status peserta berubah atau tidak berhasil diperbarui.",
          jadwal_id: jadwalId,
        },
        { status: 500 }
      );
    }

    // 6. Catat perubahan status untuk timeline.
    const { error: historyError } = await admin
      .from("status_history")
      .insert({
        peserta_id,
        entity: "peserta",
        entity_id: peserta_id,
        from_status: peserta.status,
        to_status: "wawancara",
        note: "Peserta masuk tahap wawancara setelah jadwal berhasil disimpan oleh admin.",
        changed_by: auth.user.id,
      });

    // Riwayat gagal tidak membatalkan jadwal yang sudah tersimpan.
    if (historyError) {
      console.error(
        "Jadwal tersimpan, tetapi riwayat status gagal dicatat:",
        historyError
      );
    }
  }

  return NextResponse.json({
    message: existing?.id
      ? "Jadwal wawancara berhasil diperbarui"
      : "Jadwal wawancara berhasil dibuat",
    id: jadwalId,
  });
}
