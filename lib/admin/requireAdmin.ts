import {
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

import { NextResponse } from "next/server";

import {
  createAuthenticatedSupabaseClient,
} from "@/lib/supabaseServer";

type AdminSuccess = {
  ok: true;
  supabase: SupabaseClient;
  user: User;
};

type AdminFailure = {
  ok: false;
  response: NextResponse;
};

export type AdminAuthResult =
  | AdminSuccess
  | AdminFailure;

function getBearerToken(
  request: Request
): string | null {
  const authorization =
    request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const match =
    authorization.match(
      /^Bearer\s+(.+)$/i
    );

  if (!match) {
    return null;
  }

  return match[1];
}

export async function requireAdmin(
  request: Request
): Promise<AdminAuthResult> {
  try {
    const accessToken =
      getBearerToken(request);

    if (!accessToken) {
      return {
        ok: false,

        response: NextResponse.json(
          {
            success: false,
            message:
              "Token autentikasi tidak ditemukan",
          },
          {
            status: 401,
          }
        ),
      };
    }

    const supabase =
      createAuthenticatedSupabaseClient(
        accessToken
      );

    // ==========================================
    // VALIDASI TOKEN KE SUPABASE AUTH
    // ==========================================

    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !userData.user
    ) {
      return {
        ok: false,

        response: NextResponse.json(
          {
            success: false,
            message:
              "Sesi tidak valid atau sudah berakhir",
          },
          {
            status: 401,
          }
        ),
      };
    }

    const user =
      userData.user;

    // ==========================================
    // CEK ROLE
    // ==========================================

    const {
      data: profile,
      error: profileError,
    } =
      await supabase
        .from("profiles")
        .select("role")
        .eq(
          "id",
          user.id
        )
        .single();

    if (profileError) {
      console.error(
        "Gagal membaca role user:",
        profileError
      );

      return {
        ok: false,

        response: NextResponse.json(
          {
            success: false,
            message:
              "Gagal memverifikasi akses Admin",
          },
          {
            status: 500,
          }
        ),
      };
    }

    if (
      !profile ||
      profile.role !== "admin"
    ) {
      return {
        ok: false,

        response: NextResponse.json(
          {
            success: false,
            message:
              "Akses ditolak. Hanya Admin yang diizinkan.",
          },
          {
            status: 403,
          }
        ),
      };
    }

    return {
      ok: true,
      supabase,
      user,
    };
  } catch (error) {
    console.error(
      "requireAdmin error:",
      error
    );

    return {
      ok: false,

      response: NextResponse.json(
        {
          success: false,
          message:
            "Terjadi kesalahan saat memverifikasi Admin",
        },
        {
          status: 500,
        }
      ),
    };
  }
}