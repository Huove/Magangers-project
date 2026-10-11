import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const COOKIE_NAME = "magangers_utm";

type UtmData = {
  utm_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  landing_page?: string | null;
  referrer?: string | null;
};

function cleanValue(
  value: unknown,
  maxLength = 200
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, maxLength);
}

function parseCookie(
  req: NextRequest
): UtmData | null {
  const raw = req.cookies.get(
    COOKIE_NAME
  )?.value;

  if (!raw) {
    return null;
  }

  try {
    const decoded =
      decodeURIComponent(raw);

    const parsed =
      JSON.parse(decoded);

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      return null;
    }

    return {
      utm_id: cleanValue(
        parsed.utm_id
      ),

      utm_source: cleanValue(
        parsed.utm_source
      ),

      utm_medium: cleanValue(
        parsed.utm_medium
      ),

      utm_campaign: cleanValue(
        parsed.utm_campaign
      ),

      utm_term: cleanValue(
        parsed.utm_term
      ),

      utm_content: cleanValue(
        parsed.utm_content
      ),

      landing_page: cleanValue(
        parsed.landing_page,
        1000
      ),

      referrer: cleanValue(
        parsed.referrer,
        1000
      ),
    };
  } catch {
    return null;
  }
}

function clearUtmCookie(
  response: NextResponse
) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
  });
}

export async function POST(
  req: NextRequest
) {
  try {
    const auth =
      await requireUser(req);

    if (!auth.ok) {
      return auth.res;
    }

    const utm =
      parseCookie(req);

    if (!utm) {
      return NextResponse.json({
        success: true,
        attached: false,
        message:
          "Tidak ada data UTM.",
      });
    }

    const admin =
      supabaseAdmin();

    // ==========================================
    // CARI PESERTA BERDASARKAN USER LOGIN
    // ==========================================
    const {
      data: peserta,
      error: pesertaError,
    } = await admin
      .from("peserta")
      .select("id")
      .eq(
        "user_id",
        auth.user.id
      )
      .maybeSingle();

    if (pesertaError) {
      console.error(
        "UTM PESERTA ERROR:",
        pesertaError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mencari peserta.",
          detail:
            pesertaError.message,
        },
        { status: 500 }
      );
    }

    // Peserta mungkin belum dibuat
    // oleh trigger database.
    if (!peserta) {
      return NextResponse.json({
        success: true,
        attached: false,
        message:
          "Data peserta belum tersedia.",
      });
    }

    // ==========================================
    // CEK APAKAH SUDAH ADA ATTRIBUTION
    // ==========================================
    const {
      data: existing,
      error: existingError,
    } = await admin
      .from("marketing_attribution")
      .select("id")
      .eq(
        "peserta_id",
        peserta.id
      )
      .maybeSingle();

    if (existingError) {
      console.error(
        "UTM EXISTING ERROR:",
        existingError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengecek attribution.",
          detail:
            existingError.message,
        },
        { status: 500 }
      );
    }

    // ==========================================
    // SUDAH ADA
    // ==========================================
    if (existing) {
      const response =
        NextResponse.json({
          success: true,
          attached: false,
          message:
            "Attribution sudah tersimpan.",
        });

      clearUtmCookie(response);

      return response;
    }

    // ==========================================
    // SIMPAN ATTRIBUTION
    // ==========================================
    const {
      data: attribution,
      error: insertError,
    } = await admin
      .from("marketing_attribution")
      .insert({
        peserta_id:
          peserta.id,

        utm_id:
          utm.utm_id,

        utm_source:
          utm.utm_source,

        utm_medium:
          utm.utm_medium,

        utm_campaign:
          utm.utm_campaign,

        utm_term:
          utm.utm_term,

        utm_content:
          utm.utm_content,

        landing_page:
          utm.landing_page,

        referrer:
          utm.referrer,
      })
      .select(
        "id, peserta_id, utm_source, utm_medium, utm_campaign"
      )
      .single();

    if (insertError) {
      console.error(
        "UTM INSERT ERROR:",
        insertError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal menyimpan attribution.",
          detail:
            insertError.message,
        },
        { status: 500 }
      );
    }

    const response =
      NextResponse.json({
        success: true,
        attached: true,
        data: attribution,
      });

    clearUtmCookie(response);

    return response;
  } catch (error) {
    console.error(
      "UTM ATTACH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat menyimpan UTM.",
      },
      { status: 500 }
    );
  }
}