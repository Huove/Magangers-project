import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


interface RouteContext {
  params: Promise<{
    pesertaId:
      string;
  }>;
}


interface PlacementBody {
  pembimbingId:
    string | null;

  divisi:
    string | null;

  posisi:
    string | null;

  tanggalMulai:
    string;

  tanggalSelesai:
    string | null;
}


// =====================================================
// PUT
// =====================================================

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
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


    const {
      pesertaId,
    } =
      await context.params;


    const body =
      (
        await request.json()
      ) as PlacementBody;


    // =================================================
    // VALIDATION
    // =================================================

    if (
      !pesertaId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "ID peserta tidak valid",
        },
        {
          status:
            400,
        }
      );
    }


    if (
      !body.tanggalMulai
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Tanggal mulai wajib diisi",
        },
        {
          status:
            400,
        }
      );
    }


    if (
      body.tanggalSelesai &&
      body.tanggalSelesai <
        body.tanggalMulai
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Tanggal selesai tidak boleh sebelum tanggal mulai",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // RPC QUERY 5
    // =================================================

    const {
      data:
        placementData,
      error:
        placementError,
    } =
      await supabase.rpc(
        "admin_simpan_penempatan",
        {
          target_peserta_id:
            pesertaId,

          target_pembimbing_id:
            body.pembimbingId ??
            null,

          target_divisi:
            cleanNullable(
              body.divisi
            ),

          target_posisi:
            cleanNullable(
              body.posisi
            ),

          target_tanggal_mulai:
            body.tanggalMulai,

          target_tanggal_selesai:
            body.tanggalSelesai ||
            null,
        }
      );


    if (
      placementError
    ) {
      console.error(
        "RPC penempatan error:",
        placementError
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            placementError.message ||
            "Gagal menyimpan penempatan",
        },
        {
          status:
            500,
        }
      );
    }


    return NextResponse.json({
      success:
        true,

      message:
        "Penempatan peserta berhasil disimpan",

      data:
        placementData,
    });

  } catch (error) {
    console.error(
      "PUT /api/admin/penempatan/[pesertaId]:",
      error
    );


    return NextResponse.json(
      {
        success:
          false,

        message:
          "Terjadi kesalahan pada server",
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
    string | null
) {
  if (!value) {
    return null;
  }


  const result =
    value.trim();


  return result ||
    null;
}