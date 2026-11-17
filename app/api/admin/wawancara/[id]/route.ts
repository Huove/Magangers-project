
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);

  if (!auth.ok) {
    return auth.res;
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { message: "ID tidak ditemukan." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const {
    action,
    tanggal,
    jam,
    interviewer,
    metode,
    lokasi,
    catatan,
    alasan_blacklist,
  } = body;

  const admin = supabaseAdmin();

  // ==========================================
  // BLACKLIST PESERTA
  // ID yang digunakan adalah ID PESERTA.
  // ==========================================
  if (action === "blacklist") {
    const alasan = String(alasan_blacklist ?? "").trim();

    if (!alasan) {
      return NextResponse.json(
        { message: "Alasan blacklist wajib diisi." },
        { status: 400 }
      );
    }

    // Periksa apakah peserta tersedia.
    const { data: peserta, error: pesertaFindError } = await admin
      .from("peserta")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (pesertaFindError) {
      return NextResponse.json(
        {
          message: "Gagal mencari peserta.",
          detail: pesertaFindError.message,
        },
        { status: 500 }
      );
    }

    if (!peserta) {
      return NextResponse.json(
        { message: "Peserta tidak ditemukan." },
        { status: 404 }
      );
    }

    if (peserta.status === "blacklist") {
      return NextResponse.json(
        { message: "Peserta sudah masuk blacklist." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    // Ubah status peserta dan simpan alasan blacklist.
    // Tidak mengubah atau menghapus jadwal wawancara.
    const { data: pesertaUpdated, error: blacklistError } = await admin
      .from("peserta")
      .update({
        status: "blacklist",
        alasan_blacklist: alasan,
        blacklist_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .neq("status", "blacklist")
      .select("id")
      .maybeSingle();

    if (blacklistError) {
      return NextResponse.json(
        {
          message: "Gagal melakukan blacklist peserta.",
          detail: blacklistError.message,
        },
        { status: 500 }
      );
    }

    if (!pesertaUpdated) {
      return NextResponse.json(
        { message: "Peserta sudah masuk blacklist atau statusnya berubah." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: "Peserta berhasil dimasukkan ke blacklist.",
      peserta_id: id,
      peserta_status: "blacklist",
    });
  }

  // ==========================================
  // VALIDASI AKSI SELAIN BLACKLIST
  // Untuk aksi ini, ID adalah ID JADWAL.
  // ==========================================
  if (
    action !== "reschedule" &&
    action !== "lulus" &&
    action !== "tidak_lulus"
  ) {
    return NextResponse.json(
      { message: "Action tidak valid." },
      { status: 400 }
    );
  }

  // Cari jadwal berdasarkan ID jadwal.
  const { data: jadwalAwal, error: jadwalAwalError } = await admin
    .from("jadwal_wawancara")
    .select("id, peserta_id")
    .eq("id", id)
    .maybeSingle();

  if (jadwalAwalError) {
    return NextResponse.json(
      {
        message: "Gagal mencari jadwal wawancara.",
        detail: jadwalAwalError.message,
      },
      { status: 500 }
    );
  }

  if (!jadwalAwal) {
    return NextResponse.json(
      { message: "Jadwal wawancara tidak ditemukan." },
      { status: 404 }
    );
  }

  // Pastikan peserta belum masuk blacklist.
  const { data: pesertaAwal, error: pesertaAwalError } = await admin
    .from("peserta")
    .select("id, status")
    .eq("id", jadwalAwal.peserta_id)
    .maybeSingle();

  if (pesertaAwalError) {
    return NextResponse.json(
      {
        message: "Gagal memeriksa status peserta.",
        detail: pesertaAwalError.message,
      },
      { status: 500 }
    );
  }

  if (!pesertaAwal || pesertaAwal.status === "blacklist") {
    return NextResponse.json(
      {
        message: "Peserta tidak dapat diproses karena masuk blacklist.",
      },
      { status: 409 }
    );
  }

  // ==========================================
  // RESCHEDULE
  // ==========================================
  if (action === "reschedule") {
    if (!tanggal || !jam) {
      return NextResponse.json(
        { message: "Tanggal dan jam wajib diisi." },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from("jadwal_wawancara")
      .update({
        interviewer: interviewer ?? undefined,
        tanggal,
        jam,
        metode: metode ?? undefined,
        lokasi: lokasi ?? undefined,
        status: "Dijadwalkan",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        {
          message: "Gagal mengubah jadwal.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Jadwal berhasil diubah.",
    });
  }

  // ==========================================
  // LULUS / TIDAK LULUS
  // ==========================================
  if (action === "lulus" || action === "tidak_lulus") {
    const pesertaStatus =
      action === "lulus" ? "diterima" : "ditolak";

    const now = new Date().toISOString();

    // Perbarui status jadwal menjadi selesai.
    const { error: jadwalUpdateError } = await admin
      .from("jadwal_wawancara")
      .update({
        status: "Selesai",
        catatan: catatan ?? null,
        updated_at: now,
      })
      .eq("id", id);

    if (jadwalUpdateError) {
      return NextResponse.json(
        {
          message: "Gagal menyelesaikan jadwal wawancara.",
          detail: jadwalUpdateError.message,
        },
        { status: 500 }
      );
    }

    // Perbarui status peserta.
    const { data: pesertaUpdated, error: pesertaUpdateError } = await admin
      .from("peserta")
      .update({
        status: pesertaStatus,
        updated_at: now,
      })
      .eq("id", jadwalAwal.peserta_id)
      .neq("status", "blacklist")
      .select("id")
      .maybeSingle();

    if (pesertaUpdateError) {
      return NextResponse.json(
        {
          message: "Gagal memperbarui status peserta.",
          detail: pesertaUpdateError.message,
        },
        { status: 500 }
      );
    }

    if (!pesertaUpdated) {
      return NextResponse.json(
        {
          message: "Status peserta berubah atau peserta masuk blacklist.",
        },
        { status: 409 }
      );
    }

    // Cari pengajuan magang terbaru milik peserta.
    const { data: pengajuan, error: pengajuanFindError } = await admin
      .from("pengajuan_magang")
      .select("id")
      .eq("peserta_id", jadwalAwal.peserta_id)
      .order("tanggal_pengajuan", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pengajuanFindError) {
      return NextResponse.json(
        {
          message: "Gagal mencari pengajuan peserta.",
          detail: pengajuanFindError.message,
        },
        { status: 500 }
      );
    }

    if (!pengajuan) {
      return NextResponse.json(
        {
          message:
            "Status peserta telah diperbarui, tetapi pengajuan magang tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // Perbarui status pengajuan magang.
    const { error: pengajuanUpdateError } = await admin
      .from("pengajuan_magang")
      .update({
        status: pesertaStatus,
      })
      .eq("id", pengajuan.id);

    if (pengajuanUpdateError) {
      return NextResponse.json(
        {
          message: "Gagal memperbarui status pengajuan.",
          detail: pengajuanUpdateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        action === "lulus"
          ? "Peserta berhasil dinyatakan lulus wawancara dan diterima."
          : "Peserta berhasil dinyatakan tidak lulus wawancara.",
      peserta_status: pesertaStatus,
      pengajuan_status: pesertaStatus,
      jadwal_status: "Selesai",
    });
  }
}
