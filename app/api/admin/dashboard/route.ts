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
    // AUTH ADMIN
    // ==========================================

    const auth =
      await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const {
      supabase,
    } = auth;

    // ==========================================
    // DATABASE RPC
    // Query 8
    // ==========================================

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "admin_dashboard_ringkasan"
      );

    if (error) {
      console.error(
        "Dashboard RPC error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil ringkasan dashboard",
        },
        {
          status: 500,
        }
      );
    }

    const summary =
      Array.isArray(data)
        ? data[0] ?? null
        : data;

    return NextResponse.json(
      {
        success: true,
        data: summary,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET /api/admin/dashboard:",
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