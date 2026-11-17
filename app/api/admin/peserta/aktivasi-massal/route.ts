
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";

export async function POST(
  request: NextRequest
) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { supabase, user } = auth;

    const body = await request.json() as {
      pesertaIds?: string[];
    };

    const pesertaIds = [
      ...new Set(
        (body.pesertaIds ?? [])
          .filter(
            (id): id is string =>
              typeof id === "string" &&
              id.trim().length > 0
          )
          .map((id) => id.trim())
      ),
    ];

    if (pesertaIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Pilih minimal satu peserta.",
        },
        { status: 400 }
      );
    }

    if (pesertaIds.length > 200) {
      return NextResponse.json(
        {
          success: false,
          message: "Maksimal 200 peserta per proses.",
        },
        { status: 400 }
      );
    }

    const {
      data: peserta,
      error: pesertaError,
    } = await supabase
      .from("peserta")
      .select("id, status")
      .in("id", pesertaIds);

    if (pesertaError) {
      console.error(
        "Baca peserta untuk aktivasi massal:",
        pesertaError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal memeriksa data peserta.",
        },
        { status: 500 }
      );
    }

    if (peserta.length !== pesertaIds.length) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Sebagian peserta tidak ditemukan. Muat ulang halaman, lalu coba lagi.",
        },
        { status: 400 }
      );
    }

    const eligible = peserta.filter(
      (item) => item.status === "diterima"
    );

    if (eligible.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Tidak ada peserta berstatus diterima yang dapat diaktifkan.",
        },
        { status: 400 }
      );
    }

    const eligibleIds = eligible.map(
      (item) => item.id
    );

    const {
      data: updated,
      error: updateError,
    } = await supabase
      .from("peserta")
      .update({
        status: "aktif",
      })
      .in("id", eligibleIds)
      .eq("status", "diterima")
      .select("id");

    if (updateError) {
      console.error(
        "Aktivasi massal gagal:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengaktifkan peserta.",
        },
        { status: 500 }
      );
    }

    const updatedIds = (updated ?? []).map(
      (item) => item.id
    );

    if (updatedIds.length > 0) {
      const historyRows = updatedIds.map(
        (id) => ({
          peserta_id: id,
          entity: "peserta",
          entity_id: id,
          from_status: "diterima",
          to_status: "aktif",
          note:
            "Status diaktifkan melalui aktivasi massal admin.",
          changed_by: user.id,
        })
      );

      const {
        error: historyError,
      } = await supabase
        .from("status_history")
        .insert(historyRows);

      if (historyError) {
        console.error(
          "Pencatatan riwayat aktivasi massal gagal:",
          historyError
        );
      }
    }

    return NextResponse.json({
      success: true,
      message:
        `${updatedIds.length} peserta berhasil diaktifkan.`,
      data: {
        activatedIds: updatedIds,
        activatedCount: updatedIds.length,
        skippedCount:
          pesertaIds.length - updatedIds.length,
      },
    });
  } catch (error) {
    console.error(
      "POST aktivasi massal:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}
