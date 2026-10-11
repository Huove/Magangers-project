import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


// =====================================================
// BODY
// =====================================================

interface MutationBody {
  tanggalMutasi?:
    string;

  pembimbingId?:
    string | null;

  divisi?:
    string | null;

  posisi?:
    string | null;

  tanggalSelesai?:
    string | null;

  alasan?:
    string | null;
}


// =====================================================
// CONTEXT
// =====================================================

type RouteContext = {
  params:
    Promise<{
      id:
        string;
    }>;
};


// =====================================================
// POST MUTASI
// =====================================================

export async function POST(
  request:
    NextRequest,

  context:
    RouteContext
) {
  try {
    // =================================================
    // ADMIN
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
    } =
      auth;


    // =================================================
    // ID
    // =================================================

    const {
      id,
    } =
      await context.params;


    if (!id) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "ID peserta tidak valid.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // BODY
    // =================================================

    const body =
      (
        await request.json()
      ) as MutationBody;


    // =================================================
    // DATE
    // =================================================

    const tanggalMutasi =
      body.tanggalMutasi
        ?.trim();


    if (!tanggalMutasi) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Tanggal mutasi wajib diisi.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // VALID DATE
    // =================================================

    if (
      !isDateValue(
        tanggalMutasi
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Format tanggal mutasi tidak valid.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // END DATE
    // =================================================

    const tanggalSelesai =
      cleanNullable(
        body.tanggalSelesai
      );


    if (
      tanggalSelesai &&
      !isDateValue(
        tanggalSelesai
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Format tanggal selesai tidak valid.",
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
        tanggalMutasi
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Tanggal selesai tidak boleh sebelum tanggal mutasi.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // RPC
    // =================================================

    const {
      data:
        historyId,

      error:
        mutationError,
    } =
      await supabase.rpc(
        "admin_mutasi_peserta",
        {
          target_peserta_id:
            id,

          target_tanggal_mutasi:
            tanggalMutasi,

          target_pembimbing_id:
            cleanNullable(
              body.pembimbingId
            ),

          target_divisi:
            cleanNullable(
              body.divisi
            ),

          target_posisi:
            cleanNullable(
              body.posisi
            ),

          target_tanggal_selesai:
            tanggalSelesai,

          target_alasan:
            cleanNullable(
              body.alasan
            ),
        }
      );


    if (
      mutationError
    ) {
      console.error(
        "MUTATION RPC ERROR:",
        mutationError
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            mutationError.message ||
            "Gagal melakukan mutasi peserta.",
        },
        {
          status:
            500,
        }
      );
    }


    // =================================================
    // RESPONSE
    // =================================================

    return NextResponse.json({
      success:
        true,

      message:
        "Peserta berhasil dimutasi.",

      data: {
        historyId,
      },
    });

  } catch (
    error
  ) {
    console.error(
      "POST /api/admin/peserta/[id]/mutasi:",
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
      },
      {
        status:
          500,
      }
    );
  }
}


// =====================================================
// CLEAN
// =====================================================

function cleanNullable(
  value:
    string |
    null |
    undefined
):
string | null {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return null;
  }


  const result =
    value.trim();


  return (
    result ||
    null
  );
}


// =====================================================
// DATE
// =====================================================

function isDateValue(
  value:
    string
) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    value
  );
}