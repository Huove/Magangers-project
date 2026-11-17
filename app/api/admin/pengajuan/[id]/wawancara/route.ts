import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/requireAdmin";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { supabase } = auth;
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID pengajuan wajib diisi.",
        },
        { status: 400 }
      );
    }

    // ==========================================
    // AMBIL DATA PENGAJUAN
    // ==========================================
    const { data: pengajuan, error: pengajuanError } =
      await supabase
        .from("pengajuan_magang")
        .select("id, peserta_id, status")
        .eq("id", id)
        .single();

    if (pengajuanError || !pengajuan) {
      return NextResponse.json(
        {
          success: false,
          message: "Pengajuan tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    // ==========================================
    // VALIDASI STATUS PENGAJUAN
    // ==========================================
    const allowedStatuses = [
      "diajukan",
      "diproses",
      "diterima",
    ];

    if (!allowedStatuses.includes(pengajuan.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Pengajuan tidak dapat diproses dari status "${pengajuan.status}".`,
        },
        { status: 400 }
      );
    }

    // ==========================================
    // AMBIL ADMIN YANG MEMPROSES
    // ==========================================
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ==========================================
    // PROSES PENGAJUAN SAJA
    // STATUS PESERTA TIDAK DIUBAH DI SINI
    // ==========================================
    const { data, error } = await supabase
      .from("pengajuan_magang")
      .update({
        status: "diproses",
        diproses_oleh: user?.id ?? null,
        diproses_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        "id, peserta_id, status, diproses_oleh, diproses_at"
      )
      .single();

    if (error) {
      console.error(
        "POST /api/admin/pengajuan/[id]/wawancara:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            error.message ||
            "Gagal memproses pengajuan.",
        },
        { status: 500 }
      );
    }

    // ==========================================
    // BERHASIL
    // PESERTA BELUM DIUBAH MENJADI WAWANCARA
    // ==========================================
    return NextResponse.json({
      success: true,
      message:
        "Pengajuan berhasil diproses. Status peserta belum diubah; status wawancara akan ditetapkan setelah jadwal berhasil dibuat.",
      data,
    });
  } catch (error) {
    console.error("Wawancara API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
