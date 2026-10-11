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

interface TerminationBody {
  tanggalBerhenti?:
    string;

  alasan?:
    string;
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
// POST
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
      ) as TerminationBody;


    // =================================================
    // DATE
    // =================================================

    const tanggalBerhenti =
      body.tanggalBerhenti
        ?.trim();


    if (!tanggalBerhenti) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Tanggal pemberhentian wajib diisi.",
        },
        {
          status:
            400,
        }
      );
    }


    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        tanggalBerhenti
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Format tanggal pemberhentian tidak valid.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // REASON
    // =================================================

    const alasan =
      body.alasan
        ?.trim();


    if (!alasan) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Alasan pemberhentian wajib diisi.",
        },
        {
          status:
            400,
        }
      );
    }


    if (
      alasan.length <
      5
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Alasan pemberhentian terlalu singkat.",
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
        terminationError,
    } =
      await supabase.rpc(
        "admin_berhentikan_peserta",
        {
          target_peserta_id:
            id,

          target_tanggal_berhenti:
            tanggalBerhenti,

          target_alasan:
            alasan,
        }
      );


    if (
      terminationError
    ) {
      console.error(
        "TERMINATION RPC ERROR:",
        terminationError
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            terminationError.message ||
            "Gagal memberhentikan peserta.",
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
        "Peserta berhasil diberhentikan.",

      data: {
        historyId,
      },
    });

  } catch (
    error
  ) {
    console.error(
      "POST /api/admin/peserta/[id]/berhentikan:",
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