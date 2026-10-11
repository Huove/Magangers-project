import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";

export const dynamic =
  "force-dynamic";

export async function GET(
  request: Request
) {
  try {
    // ==========================================
    // AUTH
    // ==========================================

    const auth =
      await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const {
      supabase,
    } = auth;

    const url =
      new URL(request.url);

    const includeDetail =
      url.searchParams.get(
        "detail"
      ) === "true";

    // ==========================================
    // SUMMARY
    //
    // Query 13 + Query 14
    // ==========================================

    const [
      completenessResult,
      consistencyResult,
    ] =
      await Promise.all([
        supabase.rpc(
          "admin_ringkasan_kelengkapan_peserta"
        ),

        supabase.rpc(
          "admin_ringkasan_konsistensi_peserta"
        ),
      ]);

    if (
      completenessResult.error
    ) {
      console.error(
        "Completeness RPC error:",
        completenessResult.error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal memeriksa kelengkapan data peserta",
        },
        {
          status: 500,
        }
      );
    }

    if (
      consistencyResult.error
    ) {
      console.error(
        "Consistency RPC error:",
        consistencyResult.error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal memeriksa konsistensi data peserta",
        },
        {
          status: 500,
        }
      );
    }

    const completeness =
      Array.isArray(
        completenessResult.data
      )
        ? completenessResult
            .data[0] ?? null
        : completenessResult.data;

    const consistency =
      Array.isArray(
        consistencyResult.data
      )
        ? consistencyResult
            .data[0] ?? null
        : consistencyResult.data;

    // ==========================================
    // JIKA TIDAK MEMINTA DETAIL
    // ==========================================

    if (!includeDetail) {
      return NextResponse.json(
        {
          success: true,

          data: {
            completeness,
            consistency,
          },
        },
        {
          status: 200,
        }
      );
    }

    // ==========================================
    // DETAIL
    // ==========================================

    const [
      completenessDetailResult,
      consistencyDetailResult,
    ] =
      await Promise.all([
        supabase.rpc(
          "admin_cek_kelengkapan_peserta"
        ),

        supabase.rpc(
          "admin_cek_konsistensi_peserta"
        ),
      ]);

    if (
      completenessDetailResult.error
    ) {
      console.error(
        "Completeness detail error:",
        completenessDetailResult.error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil detail kelengkapan peserta",
        },
        {
          status: 500,
        }
      );
    }

    if (
      consistencyDetailResult.error
    ) {
      console.error(
        "Consistency detail error:",
        consistencyDetailResult.error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil detail konsistensi peserta",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        data: {
          completeness,
          consistency,

          detail: {
            completeness:
              completenessDetailResult.data ??
              [],

            consistency:
              consistencyDetailResult.data ??
              [],
          },
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET /api/admin/health:",
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