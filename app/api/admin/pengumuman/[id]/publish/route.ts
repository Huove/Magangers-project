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
// POST PUBLISH
// =====================================================

export async function POST(
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


    const { id } =
      await context.params;


    // =================================================
    // CURRENT
    // =================================================

    const {
      data: current,
      error: currentError,
    } =
      await supabase
        .from("pengumuman")
        .select(`
          id,
          judul,
          status,
          published_at
        `)
        .eq(
          "id",
          id
        )
        .single();


    if (
      currentError ||
      !current
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pengumuman tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }


    if (
      current.status ===
        "dipublikasikan"
    ) {
      return NextResponse.json({
        success: true,

        message:
          "Pengumuman sudah dipublikasikan",

        data:
          current,
      });
    }


    // =================================================
    // PUBLISH
    // =================================================

    const publishedAt =
      new Date()
        .toISOString();


    const {
      data: updated,
      error: updateError,
    } =
      await supabase
        .from("pengumuman")
        .update({
          status:
            "dipublikasikan",

          published_at:
            publishedAt,
        })
        .eq(
          "id",
          id
        )
        .select(`
          id,
          judul,
          status,
          published_at
        `)
        .single();


    if (
      updateError ||
      !updated
    ) {
      console.error(
        "Publish error:",
        updateError
      );


      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mempublikasikan pengumuman",
        },
        {
          status: 500,
        }
      );
    }


    return NextResponse.json({
      success: true,

      message:
        "Pengumuman berhasil dipublikasikan",

      data:
        updated,
    });

  } catch (error) {
    console.error(
      "POST publish pengumuman:",
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