import { NextResponse } from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";


// =====================================================
// GET ALL LAPORAN
// =====================================================

export async function GET(
  request: Request
) {
  try {
    const auth =
      await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const { supabase } = auth;


    // =================================================
    // LAPORAN
    // =================================================

    const {
      data: laporanData,
      error: laporanError,
    } = await supabase
      .from("laporan")
      .select(`
        id,
        peserta_id,
        pembimbing_id,
        tipe,
        judul,
        periode,
        deskripsi,
        file_url,
        status,
        catatan_admin,
        ditinjau_oleh,
        ditinjau_at,
        created_at
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      );


    if (laporanError) {
      console.error(
        "Laporan query error:",
        laporanError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data laporan",
        },
        {
          status: 500,
        }
      );
    }


    const laporan =
      laporanData ?? [];


    if (laporan.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }


    // =================================================
    // IDS
    // =================================================

    const pesertaIds = [
      ...new Set(
        laporan
          .map(
            (item) =>
              item.peserta_id
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      ),
    ];


    const pembimbingIds = [
      ...new Set(
        laporan
          .map(
            (item) =>
              item.pembimbing_id
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      ),
    ];


    // =================================================
    // PESERTA + PEMBIMBING
    // =================================================

    const [
      pesertaResult,
      pembimbingResult,
    ] = await Promise.all([

      pesertaIds.length > 0
        ? supabase
            .from("peserta")
            .select(`
              id,
              nama_lengkap
            `)
            .in(
              "id",
              pesertaIds
            )

        : Promise.resolve({
            data: [],
            error: null,
          }),


      pembimbingIds.length > 0
        ? supabase
            .from("pembimbing")
            .select(`
              id,
              user_id
            `)
            .in(
              "id",
              pembimbingIds
            )

        : Promise.resolve({
            data: [],
            error: null,
          }),
    ]);


    if (pesertaResult.error) {
      console.error(
        "Peserta laporan error:",
        pesertaResult.error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil peserta laporan",
        },
        {
          status: 500,
        }
      );
    }


    if (pembimbingResult.error) {
      console.error(
        "Pembimbing laporan error:",
        pembimbingResult.error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil pembimbing laporan",
        },
        {
          status: 500,
        }
      );
    }


    // =================================================
    // MAP PESERTA
    // =================================================

    const pesertaMap =
      new Map<
        string,
        string
      >(
        (
          pesertaResult.data ?? []
        ).map(
          (item) => [
            item.id,
            item.nama_lengkap ?? "-",
          ]
        )
      );


    // =================================================
    // PROFILE PEMBIMBING
    // =================================================

    const pembimbingRows =
      pembimbingResult.data ?? [];


    const pembimbingUserIds = [
      ...new Set(
        pembimbingRows
          .map(
            (item) =>
              item.user_id
          )
          .filter(Boolean)
      ),
    ];


    const profileMap =
      new Map<
        string,
        string
      >();


    if (
      pembimbingUserIds.length >
      0
    ) {
      const {
        data: profiles,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          nama_lengkap
        `)
        .in(
          "id",
          pembimbingUserIds
        );


      if (profileError) {
        console.error(
          "Profile pembimbing laporan error:",
          profileError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Gagal mengambil profil pembimbing",
          },
          {
            status: 500,
          }
        );
      }


      for (
        const profile
        of profiles ?? []
      ) {
        profileMap.set(
          profile.id,
          profile.nama_lengkap ??
          "-"
        );
      }
    }


    // =================================================
    // PEMBIMBING ID → NAMA
    // =================================================

    const pembimbingMap =
      new Map<
        string,
        string
      >();


    for (
      const pembimbing
      of pembimbingRows
    ) {
      pembimbingMap.set(
        pembimbing.id,

        profileMap.get(
          pembimbing.user_id
        ) ?? "-"
      );
    }


    // =================================================
    // RESPONSE
    // =================================================

    const result =
      laporan.map(
        (item) => ({
          id:
            item.id,

          pesertaId:
            item.peserta_id,

          peserta:
            pesertaMap.get(
              item.peserta_id
            ) ?? "-",

          pembimbingId:
            item.pembimbing_id ??
            null,

          pembimbing:
            item.pembimbing_id
              ? pembimbingMap.get(
                  item.pembimbing_id
                ) ?? "-"
              : "-",

          judul:
            item.judul ??
            "-",

          tipe:
            item.tipe ??
            "-",

          periode:
            item.periode ??
            "-",

          deskripsi:
            item.deskripsi ??
            "",

          status:
            item.status,

          catatan:
            item.catatan_admin ??
            "",

          fileUrl:
            item.file_url ??
            null,

          fileName:
            getFileName(
              item.file_url
            ),

          createdAt:
            item.created_at,

          ditinjauAt:
            item.ditinjau_at ??
            null,

          ditinjauOleh:
            item.ditinjau_oleh ??
            null,
        })
      );


    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error(
      "GET /api/admin/laporan:",
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


// =====================================================
// FILE NAME
// =====================================================

function getFileName(
  value: string | null
) {
  if (!value) {
    return null;
  }

  try {
    const clean =
      value.split("?")[0];

    const parts =
      clean.split("/");

    const last =
      parts[
        parts.length - 1
      ];

    return decodeURIComponent(
      last || "Lampiran"
    );

  } catch {
    return "Lampiran";
  }
}