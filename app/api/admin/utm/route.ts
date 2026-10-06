import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/requireAdmin";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  req: NextRequest
) {
  try {
    const auth =
      await requireAdmin(req);

    if (!auth.ok) {
      return auth.response;
    }

    const admin =
      supabaseAdmin();

    // ==========================================
    // AMBIL ATTRIBUTION
    // ==========================================
    const {
      data: rows,
      error: rowsError,
    } = await admin
      .from(
        "marketing_attribution"
      )
      .select(`
        id,
        peserta_id,
        utm_id,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        landing_page,
        referrer,
        created_at
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (rowsError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data UTM.",
          detail:
            rowsError.message,
        },
        { status: 500 }
      );
    }

    const attribution =
      rows ?? [];

    // ==========================================
    // AMBIL STATUS PESERTA
    // ==========================================
    const pesertaIds = [
      ...new Set(
        attribution
          .map(
            (item) =>
              item.peserta_id
          )
          .filter(Boolean)
      ),
    ];

    const statusMap =
      new Map<string, string>();

    if (
      pesertaIds.length > 0
    ) {
      const {
        data: pesertaRows,
        error: pesertaError,
      } = await admin
        .from("peserta")
        .select(
          "id,status"
        )
        .in(
          "id",
          pesertaIds
        );

      if (pesertaError) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Gagal mengambil status peserta.",
            detail:
              pesertaError.message,
          },
          { status: 500 }
        );
      }

      for (
        const peserta of
          pesertaRows ?? []
      ) {
        statusMap.set(
          peserta.id,
          peserta.status
        );
      }
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    const bySource =
      new Map<string, any>();

    const byMedium =
      new Map<string, any>();

    const byCampaign =
      new Map<string, any>();

    function createBucket(
      key: string
    ) {
      return {
        key,
        total: 0,
        aktif: 0,
        diterima: 0,
        wawancara: 0,
        ditolak: 0,
        selesai: 0,
      };
    }

    function addToBucket(
      map: Map<string, any>,
      key: string,
      status: string
    ) {
      if (!map.has(key)) {
        map.set(
          key,
          createBucket(key)
        );
      }

      const bucket =
        map.get(key);

      bucket.total += 1;

      if (
        status === "aktif"
      ) {
        bucket.aktif += 1;
      }

      if (
        status === "diterima"
      ) {
        bucket.diterima += 1;
      }

      if (
        status === "wawancara"
      ) {
        bucket.wawancara += 1;
      }

      if (
        status === "ditolak"
      ) {
        bucket.ditolak += 1;
      }

      if (
        status === "selesai"
      ) {
        bucket.selesai += 1;
      }
    }

    for (
      const item of attribution
    ) {
      const status =
        statusMap.get(
          item.peserta_id
        ) ?? "tidak_aktif";

      addToBucket(
        bySource,
        item.utm_source ??
          "(unknown)",
        status
      );

      addToBucket(
        byMedium,
        item.utm_medium ??
          "(unknown)",
        status
      );

      addToBucket(
        byCampaign,
        item.utm_campaign ??
          "(unknown)",
        status
      );
    }

    return NextResponse.json(
      {
        success: true,

        data: {
          total:
            attribution.length,

          by_source:
            Array.from(
              bySource.values()
            ).sort(
              (a, b) =>
                b.total - a.total
            ),

          by_medium:
            Array.from(
              byMedium.values()
            ).sort(
              (a, b) =>
                b.total - a.total
            ),

          by_campaign:
            Array.from(
              byCampaign.values()
            ).sort(
              (a, b) =>
                b.total - a.total
            ),

          rows: attribution.map(
            (item) => ({
              ...item,
              peserta_status:
                statusMap.get(
                  item.peserta_id
                ) ??
                "tidak_aktif",
            })
          ),
        },
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "ADMIN UTM ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Terjadi kesalahan saat mengambil data UTM.",
      },
      { status: 500 }
    );
  }
}