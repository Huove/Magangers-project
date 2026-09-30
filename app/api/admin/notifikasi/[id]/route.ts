import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


// =====================================================
// DELETE NOTIFIKASI
// =====================================================

export async function DELETE(
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
      id,
    } =
      await context.params;


    if (!id) {
      return NextResponse.json(
        {
          success: false,

          message:
            "ID notifikasi tidak valid",
        },
        {
          status: 400,
        }
      );
    }


    // =================================================
    // CEK DATA
    // =================================================

    const {
      data:
        current,
      error:
        currentError,
    } =
      await supabase
        .from(
          "notifikasi"
        )
        .select(`
          id,
          judul
        `)
        .eq(
          "id",
          id
        )
        .maybeSingle();


    if (
      currentError
    ) {
      console.error(
        "Check notification error:",
        currentError
      );


      return NextResponse.json(
        {
          success: false,

          message:
            "Gagal membaca notifikasi",
        },
        {
          status: 500,
        }
      );
    }


    if (!current) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Notifikasi tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }


    // =================================================
    // DELETE
    // =================================================

    const {
      error:
        deleteError,
    } =
      await supabase
        .from(
          "notifikasi"
        )
        .delete()
        .eq(
          "id",
          id
        );


    if (
      deleteError
    ) {
      console.error(
        "Delete notification error:",
        deleteError
      );


      return NextResponse.json(
        {
          success: false,

          message:
            "Gagal menghapus notifikasi",
        },
        {
          status: 500,
        }
      );
    }


    return NextResponse.json({
      success:
        true,

      message:
        "Notifikasi berhasil dihapus",
    });

  } catch (error) {
    console.error(
      "DELETE /api/admin/notifikasi/[id]:",
      error
    );


    return NextResponse.json(
      {
        success: false,

        message:
          "Terjadi kesalahan pada server",
      },
      {
        status: 500,
      }
    );
  }
}