import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LaporanDatabase = {
  id: string;
  peserta_id: string;
  pembimbing_id: string;
  tipe: string | null;
  judul: string | null;
  periode: string | null;
  deskripsi: string | null;
  file_url: string | null;
  status: string | null;
  catatan_admin: string | null;
  ditinjau_at: string | null;
  tampil_ke_peserta: boolean | null;
  tampil_di_laporan: boolean | null;
  tampil_di_dashboard: boolean | null;
  created_at: string;
  updated_at: string;
};

function normalizeStatus(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeTipe(value: string | null) {
  const tipe = String(value ?? "")
    .trim()
    .toLowerCase();

  switch (tipe) {
    case "mingguan":
    case "laporan mingguan":
      return "Laporan Mingguan";

    case "bulanan":
    case "laporan bulanan":
      return "Laporan Bulanan";

    case "akhir":
    case "laporan akhir":
      return "Laporan Akhir";

    case "rekap jurnal":
      return "Rekap Jurnal";

    case "rekap tugas":
      return "Rekap Tugas";

    case "rekap absensi":
      return "Rekap Absensi";

    default:
      return value ?? "Laporan";
  }
}

export async function GET(request: Request) {
  try {
    // ==========================================
    // AUTENTIKASI PESERTA
    // ==========================================

    const auth = await requireUser(request);

    if (!auth.ok) {
      return auth.res;
    }

    const admin = supabaseAdmin();

    // ==========================================
    // AMBIL DATA PESERTA BERDASARKAN USER LOGIN
    // ==========================================

    const {
      data: peserta,
      error: pesertaError,
    } = await admin
      .from("peserta")
      .select("id")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (pesertaError) {
      console.error(
        "GET LAPORAN PESERTA - QUERY PESERTA:",
        pesertaError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data peserta.",
          detail: pesertaError.message,
        },
        { status: 500 }
      );
    }

    if (!peserta) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          message: "Data peserta belum tersedia.",
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        }
      );
    }

    // ==========================================
    // AMBIL LAPORAN MILIK PESERTA
    // ==========================================

    const {
      data: laporan,
      error: laporanError,
    } = await admin
      .from("laporan")
      .select(`
        id,
        peserta_id,
        pembimbing_id,
        tipe,
        judul,
        periode,
        deskripsi,
        file_url,
        status,
        catatan_admin,
        ditinjau_at,
        tampil_ke_peserta,
        tampil_di_laporan,
        tampil_di_dashboard,
        created_at,
        updated_at
      `)
      .eq("peserta_id", peserta.id)
      .order("created_at", {
        ascending: false,
      });

    if (laporanError) {
      console.error(
        "GET LAPORAN PESERTA - QUERY LAPORAN:",
        laporanError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil laporan peserta.",
          detail: laporanError.message,
        },
        { status: 500 }
      );
    }

    // ==========================================
    // FILTER LAPORAN
    //
    // Hanya laporan yang:
    // 1. Sudah disetujui admin.
    // 2. Diizinkan tampil kepada peserta.
    // 3. Diatur untuk tampil di halaman laporan.
    // ==========================================

    const laporanTampil = (
      (laporan ?? []) as LaporanDatabase[]
    )
      .filter((item) => {
        const status = normalizeStatus(item.status);

        return (
          status === "disetujui" &&
          item.tampil_ke_peserta === true &&
          item.tampil_di_laporan === true
        );
      })
      .map((item) => ({
        ...item,
        tipe: normalizeTipe(item.tipe),
      }));

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json(
      {
        success: true,
        data: laporanTampil,
        total: laporanTampil.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/aktif/laporan:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil laporan.",
        detail:
          error instanceof Error
            ? error.message
            : "Kesalahan tidak diketahui.",
      },
      { status: 500 }
    );
  }
}