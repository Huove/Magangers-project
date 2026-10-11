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
      { message: "Missing params.id" },
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
  } = body;

  const admin = supabaseAdmin();

  // ==========================================
  // RESCHEDULE
  // ==========================================
  if (action === "reschedule") {
    if (!tanggal || !jam) {
      return NextResponse.json(
        { message: "tanggal & jam wajib" },
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
          message: "Reschedule error",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Jadwal berhasil diubah",
    });
  }

  // ==========================================
  // LULUS / TIDAK LULUS
  // ==========================================
  if (action === "lulus" || action === "tidak_lulus") {
    const newStatus = "Selesai";

    // ------------------------------------------
    // 1. Selesaikan jadwal wawancara
    // ------------------------------------------
    const {
      data: jadwal,
      error: jErr,
    } = await admin
      .from("jadwal_wawancara")
      .update({
        status: newStatus,
        catatan: catatan ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("peserta_id")
      .single();

    if (jErr) {
      return NextResponse.json(
        {
          message: "Update jadwal error",
          detail: jErr.message,
        },
        { status: 500 }
      );
    }

    if (!jadwal?.peserta_id) {
      return NextResponse.json(
        {
          message: "Peserta pada jadwal tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // ------------------------------------------
    // 2. Tentukan status peserta
    // ------------------------------------------
    const pesertaStatus =
      action === "lulus" ? "diterima" : "ditolak";

    // ------------------------------------------
    // 3. Update status peserta
    // ------------------------------------------
    const { error: pErr } = await admin
      .from("peserta")
      .update({
        status: pesertaStatus,
      })
      .eq("id", jadwal.peserta_id);

    if (pErr) {
      return NextResponse.json(
        {
          message: "Update peserta error",
          detail: pErr.message,
        },
        { status: 500 }
      );
    }

    // ------------------------------------------
    // 4. Cari pengajuan terbaru peserta
    // ------------------------------------------
    const {
      data: pengajuan,
      error: pengajuanFindError,
    } = await admin
      .from("pengajuan_magang")
      .select("id, status, tanggal_pengajuan")
      .eq("peserta_id", jadwal.peserta_id)
      .order("tanggal_pengajuan", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (pengajuanFindError) {
      return NextResponse.json(
        {
          message: "Gagal mencari pengajuan peserta",
          detail: pengajuanFindError.message,
        },
        { status: 500 }
      );
    }

    if (!pengajuan) {
      return NextResponse.json(
        {
          message:
            "Status peserta berhasil diubah, tetapi pengajuan peserta tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // ------------------------------------------
    // 5. Update status pengajuan
    // ------------------------------------------
    const { error: pengajuanUpdateError } = await admin
      .from("pengajuan_magang")
      .update({
        status: pesertaStatus,
      })
      .eq("id", pengajuan.id);

    if (pengajuanUpdateError) {
      return NextResponse.json(
        {
          message: "Update status pengajuan error",
          detail: pengajuanUpdateError.message,
        },
        { status: 500 }
      );
    }

    // ------------------------------------------
    // SELESAI
    // ------------------------------------------
    return NextResponse.json({
      message:
        action === "lulus"
          ? "Peserta berhasil dinyatakan lulus wawancara dan diterima."
          : "Peserta berhasil dinyatakan tidak lulus wawancara.",
      peserta_status: pesertaStatus,
      pengajuan_status: pesertaStatus,
      jadwal_status: newStatus,
    });
  }

  return NextResponse.json(
    {
      message: "Action tidak valid",
    },
    {
      status: 400,
    }
  );
}