import { NextResponse } from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";

export const dynamic = "force-dynamic";


// =====================================================
// GET ALL PESERTA
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
    // PESERTA
    // =================================================

    const {
      data: pesertaData,
      error: pesertaError,
    } = await supabase
      .from("peserta")
      .select(`
        id,
        user_id,
        nomor_peserta,
        nama_lengkap,
        email,
        nomor_hp,
        status,
        tanggal_mulai,
        tanggal_selesai,
        created_at
      `)
      .in(
        "status",
        [
          "diterima",
          "aktif",
          "selesai",
        ]
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (pesertaError) {
      console.error(
        "Peserta query error:",
        pesertaError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data peserta",
        },
        {
          status: 500,
        }
      );
    }


    const peserta =
      pesertaData ?? [];

    const pesertaIds =
      peserta.map(
        (item) => item.id
      );


    if (pesertaIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }


    // =================================================
    // PENDIDIKAN + PENEMPATAN
    // =================================================

    const [
      pendidikanResult,
      penempatanResult,
    ] = await Promise.all([

      supabase
        .from("pendidikan")
        .select(`
          id,
          peserta_id,
          sekolah,
          jurusan,
          kelas,
          created_at
        `)
        .in(
          "peserta_id",
          pesertaIds
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        ),

      supabase
        .from("penempatan")
        .select(`
          id,
          peserta_id,
          pembimbing_id,
          divisi,
          posisi,
          tanggal_mulai,
          tanggal_selesai,
          created_at
        `)
        .in(
          "peserta_id",
          pesertaIds
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        ),
    ]);


    if (pendidikanResult.error) {
      console.error(
        "Pendidikan error:",
        pendidikanResult.error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data pendidikan",
        },
        {
          status: 500,
        }
      );
    }


    if (penempatanResult.error) {
      console.error(
        "Penempatan error:",
        penempatanResult.error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil data penempatan",
        },
        {
          status: 500,
        }
      );
    }


    // =================================================
    // AMBIL PENEMPATAN TERBARU
    // =================================================

    const latestPlacement =
      new Map<
        string,
        {
          id: string;
          peserta_id: string;
          pembimbing_id:
            | string
            | null;
          divisi:
            | string
            | null;
          posisi:
            | string
            | null;
          tanggal_mulai:
            | string
            | null;
          tanggal_selesai:
            | string
            | null;
        }
      >();


    for (
      const item
      of penempatanResult.data ?? []
    ) {
      if (
        !latestPlacement.has(
          item.peserta_id
        )
      ) {
        latestPlacement.set(
          item.peserta_id,
          item
        );
      }
    }


    // =================================================
    // PENDIDIKAN TERBARU
    // =================================================

    const latestEducation =
      new Map<
        string,
        {
          sekolah:
            | string
            | null;
          jurusan:
            | string
            | null;
          kelas:
            | string
            | null;
        }
      >();


    for (
      const item
      of pendidikanResult.data ?? []
    ) {
      if (
        !latestEducation.has(
          item.peserta_id
        )
      ) {
        latestEducation.set(
          item.peserta_id,
          item
        );
      }
    }


    // =================================================
    // PEMBIMBING
    // =================================================

    const pembimbingIds =
      [
        ...new Set(
          Array.from(
            latestPlacement.values()
          )
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


    const pembimbingName =
      new Map<
        string,
        string
      >();


    if (
      pembimbingIds.length > 0
    ) {
      const {
        data: pembimbingRows,
        error: pembimbingError,
      } = await supabase
        .from("pembimbing")
        .select(`
          id,
          user_id
        `)
        .in(
          "id",
          pembimbingIds
        );


      if (pembimbingError) {
        console.error(
          "Pembimbing error:",
          pembimbingError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "Gagal mengambil pembimbing",
          },
          {
            status: 500,
          }
        );
      }


      const userIds =
        [
          ...new Set(
            (
              pembimbingRows ?? []
            ).map(
              (item) =>
                item.user_id
            )
          ),
        ];


      if (userIds.length > 0) {
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
            userIds
          );


        if (profileError) {
          console.error(
            "Profile pembimbing error:",
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


        const profileMap =
          new Map(
            (
              profiles ?? []
            ).map(
              (profile) => [
                profile.id,
                profile.nama_lengkap,
              ]
            )
          );


        for (
          const pembimbing
          of pembimbingRows ?? []
        ) {
          pembimbingName.set(
            pembimbing.id,
            profileMap.get(
              pembimbing.user_id
            ) ?? "-"
          );
        }
      }
    }


    // =================================================
    // FORMAT RESPONSE
    // =================================================

    const result =
      peserta.map(
        (item) => {
          const education =
            latestEducation.get(
              item.id
            );

          const placement =
            latestPlacement.get(
              item.id
            );

          return {
            id: item.id,

            userId:
              item.user_id,

            nomorPeserta:
              item.nomor_peserta,

            nama:
              item.nama_lengkap ??
              "-",

            email:
              item.email ??
              "-",

            nomorHp:
              item.nomor_hp ??
              "-",

            sekolah:
              education?.sekolah ??
              "-",

            jurusan:
              education?.jurusan ??
              "-",

            posisi:
              placement?.posisi ??
              "-",

            divisi:
              placement?.divisi ??
              "-",

            pembimbingId:
              placement
                ?.pembimbing_id ??
              null,

            pembimbing:
              placement
                ?.pembimbing_id
                ? pembimbingName.get(
                    placement
                      .pembimbing_id
                  ) ?? "-"
                : "-",

            tanggalMulai:
              placement
                ?.tanggal_mulai ??
              item.tanggal_mulai ??
              "",

            tanggalSelesai:
              placement
                ?.tanggal_selesai ??
              item.tanggal_selesai ??
              "",

            status:
              item.status,
          };
        }
      );


    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error(
      "GET /api/admin/peserta:",
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