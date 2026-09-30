import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


export const dynamic =
  "force-dynamic";


// =====================================================
// NEXT.JS 16 ROUTE CONTEXT
// =====================================================

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


// =====================================================
// REQUEST BODY
// =====================================================

interface ReactivateParticipantBody {
  tanggalMulai?: string;

  pembimbingId?:
    | string
    | null;

  divisi?:
    | string
    | null;

  posisi?:
    | string
    | null;

  tanggalSelesai?:
    | string
    | null;

  alasan?:
    | string
    | null;
}


// =====================================================
// UUID
// =====================================================

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


// =====================================================
// DATE VALIDATION
// =====================================================

function isValidDate(
  value: string
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return false;
  }


  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);


  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );


  return (
    date.getUTCFullYear() ===
      year &&
    date.getUTCMonth() ===
      month - 1 &&
    date.getUTCDate() ===
      day
  );
}


// =====================================================
// POST
// AKTIFKAN KEMBALI PESERTA
// =====================================================

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {

    // =================================================
    // 1. AUTH ADMIN
    // =================================================

    const auth =
      await requireAdmin(
        request
      );


    if (!auth.ok) {
      return auth.response;
    }


    const {
      supabase,
    } = auth;


    // =================================================
    // 2. PESERTA ID
    // =================================================

    const {
      id,
    } =
      await context.params;


    if (
      !id ||
      !UUID_REGEX.test(
        id
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "ID peserta tidak valid.",

          data:
            null,
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // 3. BODY
    // =================================================

    let body:
      ReactivateParticipantBody;


    try {

      body =
        (
          await request.json()
        ) as ReactivateParticipantBody;

    } catch {

      return NextResponse.json(
        {
          success:
            false,

          message:
            "Body request tidak valid.",

          data:
            null,
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // 4. NORMALIZE
    // =================================================

    const tanggalMulai =
      body.tanggalMulai
        ?.trim() ??
      "";


    const pembimbingId =
      body.pembimbingId
        ?.trim() ??
      "";


    const divisi =
      body.divisi
        ?.trim() ??
      "";


    const posisi =
      body.posisi
        ?.trim() ??
      "";


    const tanggalSelesai =
      body.tanggalSelesai
        ?.trim() ||
      null;


    const alasan =
      body.alasan
        ?.trim() ??
      "";


    // =================================================
    // 5. VALIDASI TANGGAL MULAI
    // =================================================

    if (
      !tanggalMulai ||
      !isValidDate(
        tanggalMulai
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Tanggal mulai baru tidak valid.",

          data:
            null,
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // 6. VALIDASI PEMBIMBING
    // =================================================

    if (
      !pembimbingId ||
      !UUID_REGEX.test(
        pembimbingId
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Pembimbing wajib dipilih.",

          data:
            null,
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // 7. VALIDASI DIVISI
    // =================================================

    if (!divisi) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Divisi wajib dipilih.",

          data:
            null,
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // 8. VALIDASI POSISI
    // =================================================

    if (!posisi) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Posisi wajib dipilih.",

          data:
            null,
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // 9. VALIDASI TANGGAL SELESAI
    // =================================================

    if (
      tanggalSelesai &&
      !isValidDate(
        tanggalSelesai
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Tanggal selesai tidak valid.",

          data:
            null,
        },
        {
          status:
            400,
        }
      );
    }


    if (
      tanggalSelesai &&
      tanggalSelesai <
        tanggalMulai
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Tanggal selesai tidak boleh sebelum tanggal mulai.",

          data:
            null,
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // 10. VALIDASI ALASAN
    // =================================================

    if (
      alasan.length <
      5
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Alasan aktivasi kembali minimal 5 karakter.",

          data:
            null,
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // 11. CEK PESERTA
    // =================================================

    const {
      data:
        participant,

      error:
        participantError,
    } =
      await supabase
        .from(
          "peserta"
        )
        .select(`
          id,
          status,
          tanggal_mulai,
          tanggal_selesai
        `)
        .eq(
          "id",
          id
        )
        .maybeSingle();


    if (
      participantError
    ) {
      console.error(
        "READ REACTIVATE PARTICIPANT ERROR:",
        participantError
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal membaca data peserta.",

          data:
            null,
        },
        {
          status:
            500,
        }
      );
    }


    if (
      !participant
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Peserta tidak ditemukan.",

          data:
            null,
        },
        {
          status:
            404,
        }
      );
    }


    // =================================================
    // 12. HARUS DIBERHENTIKAN
    // =================================================

    if (
      participant.status !==
      "diberhentikan"
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Hanya peserta yang telah diberhentikan yang dapat diaktifkan kembali.",

          data:
            null,
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // 13. RPC
    // =================================================

    const {
      data:
        historyId,

      error:
        reactivateError,
    } =
      await supabase.rpc(
        "admin_aktifkan_kembali_peserta",
        {
          target_peserta_id:
            id,

          target_tanggal_mulai:
            tanggalMulai,

          target_pembimbing_id:
            pembimbingId,

          target_divisi:
            divisi,

          target_posisi:
            posisi,

          target_tanggal_selesai:
            tanggalSelesai,

          target_alasan:
            alasan,
        }
      );


    if (
      reactivateError
    ) {
      console.error(
        "REACTIVATE PARTICIPANT RPC ERROR:",
        reactivateError
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            reactivateError.message ||
            "Gagal mengaktifkan kembali peserta.",

          data:
            null,
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // 14. SUCCESS
    // =================================================

    return NextResponse.json({
      success:
        true,

      message:
        "Peserta berhasil diaktifkan kembali.",

      data: {
        historyId,
      },
    });

  } catch (
    error
  ) {
    console.error(
      "POST /api/admin/peserta/[id]/aktifkan-kembali:",
      error
    );


    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",

        data:
          null,
      },
      {
        status:
          500,
      }
    );
  }
}