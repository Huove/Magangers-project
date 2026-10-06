import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const auth = await requireUser(req);

  if (!auth.ok) {
    return auth.res;
  }

  const admin = supabaseAdmin();

  // ==========================================
  // AMBIL DATA PESERTA
  // ==========================================
  const {
    data: peserta,
    error: pErr,
  } = await admin
    .from("peserta")
    .select("id, status")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (pErr) {
    return NextResponse.json(
      {
        message: "Query peserta error",
        detail: pErr.message,
      },
      { status: 500 }
    );
  }

  // ==========================================
  // JIKA PESERTA BELUM DITEMUKAN
  // ==========================================
  if (!peserta) {
    return NextResponse.json({
      status: "tidak_aktif",
      latest_pengajuan_status: null,
      revisi_note: null,
      latest_pengajuan_id: null,
      jadwal_wawancara: null,
    });
  }

  // ==========================================
  // AMBIL PENGAJUAN TERBARU
  // ==========================================
  const {
    data: latest,
    error: lErr,
  } = await admin
    .from("pengajuan_magang")
    .select(
      "id, status, catatan, tanggal_pengajuan"
    )
    .eq("peserta_id", peserta.id)
    .order("tanggal_pengajuan", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (lErr) {
    return NextResponse.json(
      {
        message: "Query pengajuan error",
        detail: lErr.message,
      },
      { status: 500 }
    );
  }

  // ==========================================
  // AMBIL JADWAL WAWANCARA TERBARU
  // ==========================================
  const {
    data: jadwal,
  } = await admin
    .from("jadwal_wawancara")
    .select(
      "id, interviewer, tanggal, jam, metode, lokasi, status, catatan"
    )
    .eq("peserta_id", peserta.id)
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  const latestStatus = latest?.status ?? null;

  // ==========================================
  // TENTUKAN STATUS EFEKTIF
  // ==========================================
  let effectiveStatus: string = peserta.status;

  // ==========================================
  // PESERTA AKTIF
  // ==========================================
  // Jika status peserta sudah aktif,
  // jangan pernah diubah kembali menjadi
  // verifikasi/mengajukan/ditolak hanya karena
  // status pengajuan lama.
  // ==========================================
  if (effectiveStatus === "aktif") {
    effectiveStatus = "aktif";
  } else {
    // ==========================================
    // STATUS REVISI
    // ==========================================
    if (effectiveStatus === "revisi") {
      effectiveStatus = "mengajukan";
    }

    if (latestStatus === "revisi") {
      effectiveStatus = "mengajukan";
    }

    // ==========================================
    // PENGAJUAN DITERIMA
    // ==========================================
    if (
      latestStatus === "diterima" &&
      (
        effectiveStatus === "mengajukan" ||
        effectiveStatus === "tidak_aktif"
      )
    ) {
      effectiveStatus = "verifikasi";
    }

    // ==========================================
    // PENGAJUAN DITOLAK
    // ==========================================
    if (latestStatus === "ditolak") {
      effectiveStatus = "ditolak";
    }
  }

  // ==========================================
  // RESPONSE
  // ==========================================
  return NextResponse.json({
    status: effectiveStatus,
    latest_pengajuan_status: latestStatus,
    revisi_note:
      latestStatus === "revisi"
        ? latest?.catatan ?? null
        : null,
    latest_pengajuan_id:
      latest?.id ?? null,
    jadwal_wawancara:
      jadwal ?? null,
  });
}