import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeStatus(status?: string | null) {
  return (status ?? "").trim().toLowerCase();
}

function mapStatus(
  appStatus?: string | null,
  pesertaStatus?: string | null
) {
  const peserta = normalizeStatus(pesertaStatus);
  const pengajuan = normalizeStatus(appStatus);

  // ==========================================
  // STATUS PESERTA = PRIORITAS UTAMA
  // ==========================================

  if (peserta === "diterima") {
    return "Diterima";
  }

  if (peserta === "ditolak") {
    return "Ditolak";
  }

  if (peserta === "wawancara") {
    return "Wawancara";
  }

  // ==========================================
  // JIKA STATUS PESERTA BELUM MENENTUKAN
  // GUNAKAN STATUS PENGAJUAN
  // ==========================================

  if (pengajuan === "diajukan") {
    return "Menunggu";
  }

  if (pengajuan === "diproses") {
    return "Diperiksa";
  }

  if (pengajuan === "revisi") {
    return "Revisi";
  }

  if (pengajuan === "diterima") {
    return "Diterima";
  }

  if (pengajuan === "ditolak") {
    return "Ditolak";
  }

  if (pengajuan === "draft") {
    return "Draft";
  }

  return appStatus ?? "-";
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);

  if (!auth.ok) {
    return auth.res;
  }

  const admin = supabaseAdmin();

  // ==========================================
  // 1. AMBIL DATA PELAMAR
  // ==========================================

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
    .order("tanggal_pengajuan", {
      ascending: false,
    });

  if (error) {
    return NextResponse.json(
      {
        message: "Query error",
        detail: error.message,
      },
      {
        status: 500,
      }
    );
  }

  // ==========================================
  // 2. AMBIL ID PESERTA
  // ==========================================

  const pesertaIds = [
    ...new Set(
      (data ?? [])
        .map((row: any) => row.peserta_id)
        .filter(Boolean)
    ),
  ];

  // ==========================================
  // 3. AMBIL STATUS PESERTA
  // ==========================================

  let pesertaStatusMap = new Map<string, string>();

  if (pesertaIds.length > 0) {
    const {
      data: pesertaData,
      error: pesertaError,
    } = await admin
      .from("peserta")
      .select("id, status")
      .in("id", pesertaIds);

    if (pesertaError) {
      return NextResponse.json(
        {
          message: "Gagal mengambil status peserta",
          detail: pesertaError.message,
        },
        {
          status: 500,
        }
      );
    }

    pesertaStatusMap = new Map(
      (pesertaData ?? []).map((peserta: any) => [
        peserta.id,
        peserta.status,
      ])
    );
  }

  // ==========================================
  // 4. GABUNGKAN DATA
  // ==========================================

  const items = (data ?? []).map((row: any) => {
    const pesertaStatus =
      pesertaStatusMap.get(row.peserta_id) ?? null;

    const statusUI = mapStatus(
      row.pengajuan_status,
      pesertaStatus
    );

    return {
      // ID peserta
      id: row.peserta_id,

      // ID pengajuan terbaru
      pengajuan_id: row.pengajuan_id,

      total_pengajuan: row.total_pengajuan ?? 1,

      // DATA PESERTA
      nama: row.nama_lengkap ?? "-",
      email: row.email ?? "-",
      sekolah: row.sekolah ?? "-",
      jurusan: row.jurusan ?? "-",
      posisi: row.posisi ?? "-",
      alamat: row.alamat ?? "-",
      nohp: row.nomor_hp ?? "-",

      tanggal: row.tanggal_pengajuan,

      // ======================================
      // STATUS UNTUK UI
      // ======================================
      status: statusUI,

      // ======================================
      // STATUS ASLI DATABASE
      // ======================================
      raw_status: row.pengajuan_status,

      peserta_status: pesertaStatus,

      catatan: row.catatan ?? null,
    };
  });

  // ==========================================
  // 5. RESPONSE TANPA CACHE
  // ==========================================

  return NextResponse.json(
    {
      data: items,
    },
    {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}