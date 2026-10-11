import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


export const dynamic =
  "force-dynamic";


// =====================================================
// GET PEMBIMBING
// =====================================================

export async function GET(
  request: Request
) {
  try {
    // =================================================
    // AUTH
    // =================================================

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


    // =================================================
    // PEMBIMBING
    // =================================================

    const {
      data:
        pembimbingRows,
      error:
        pembimbingError,
    } =
      await supabase
        .from(
          "pembimbing"
        )
        .select(`
          id,
          user_id,
          nip,
          divisi,
          created_at
        `)
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );


    if (
      pembimbingError
    ) {
      console.error(
        "GET pembimbing error:",
        pembimbingError
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal mengambil data pembimbing",
        },
        {
          status:
            500,
        }
      );
    }


    const pembimbing =
      pembimbingRows ??
      [];


    if (
      pembimbing.length ===
      0
    ) {
      return NextResponse.json({
        success:
          true,

        data:
          [],
      });
    }


    // =================================================
    // USER IDS
    // =================================================

    const userIds = [
      ...new Set(
        pembimbing.map(
          (
            item
          ) =>
            item.user_id
        )
      ),
    ];


    // =================================================
    // PEMBIMBING IDS
    // =================================================

    const pembimbingIds =
      pembimbing.map(
        (
          item
        ) =>
          item.id
      );


    // =================================================
    // PROFILE + PENEMPATAN
    // =================================================

    const [
      profileResult,
      placementResult,
    ] =
      await Promise.all([

        supabase
          .from(
            "profiles"
          )
          .select(`
            id,
            nama_lengkap,
            email,
            nomor_hp,
            foto_url
          `)
          .in(
            "id",
            userIds
          ),


        supabase
          .from(
            "penempatan"
          )
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
            "pembimbing_id",
            pembimbingIds
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          ),
      ]);


    if (
      profileResult.error
    ) {
      console.error(
        "Profile pembimbing error:",
        profileResult.error
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal mengambil profil pembimbing",
        },
        {
          status:
            500,
        }
      );
    }


    if (
      placementResult.error
    ) {
      console.error(
        "Penempatan pembimbing error:",
        placementResult.error
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal mengambil penempatan pembimbing",
        },
        {
          status:
            500,
        }
      );
    }


    // =================================================
    // PROFILE MAP
    // =================================================

    const profileMap =
      new Map<
        string,
        {
          nama:
            string;

          email:
            string;

          nomorHp:
            string;

          fotoUrl:
            string | null;
        }
      >();


    for (
      const profile
      of profileResult.data ??
      []
    ) {
      profileMap.set(
        profile.id,
        {
          nama:
            profile
              .nama_lengkap ??
            "-",

          email:
            profile.email ??
            "-",

          nomorHp:
            profile
              .nomor_hp ??
            "-",

          fotoUrl:
            profile
              .foto_url ??
            null,
        }
      );
    }


    // =================================================
    // PENEMPATAN TERBARU PER PESERTA
    //
    // Agar peserta yang punya history penempatan
    // tidak dihitung dua kali.
    // =================================================

    const latestPlacementByPeserta =
      new Map<
        string,
        {
          peserta_id:
            string;

          pembimbing_id:
            string | null;

          posisi:
            string | null;

          divisi:
            string | null;

          tanggal_mulai:
            string;

          tanggal_selesai:
            string | null;
        }
      >();


    for (
      const placement
      of placementResult.data ??
      []
    ) {
      if (
        !latestPlacementByPeserta.has(
          placement.peserta_id
        )
      ) {
        latestPlacementByPeserta.set(
          placement.peserta_id,
          placement
        );
      }
    }


    // =================================================
    // PESERTA IDS YANG MASIH TERHUBUNG
    // =================================================

    const pesertaIds = [
      ...latestPlacementByPeserta.keys(),
    ];


    const pesertaMap =
      new Map<
        string,
        {
          nama:
            string;

          status:
            string;

          nomorPeserta:
            string;
        }
      >();


    if (
      pesertaIds.length >
      0
    ) {
      const {
        data:
          pesertaRows,
        error:
          pesertaError,
      } =
        await supabase
          .from(
            "peserta"
          )
          .select(`
            id,
            nama_lengkap,
            nomor_peserta,
            status
          `)
          .in(
            "id",
            pesertaIds
          );


      if (
        pesertaError
      ) {
        console.error(
          "Peserta pembimbing error:",
          pesertaError
        );
      } else {
        for (
          const peserta
          of pesertaRows ??
          []
        ) {
          pesertaMap.set(
            peserta.id,
            {
              nama:
                peserta
                  .nama_lengkap ??
                "Peserta",

              status:
                peserta.status,

              nomorPeserta:
                peserta
                  .nomor_peserta ??
                "-",
            }
          );
        }
      }
    }


    // =================================================
    // RESPONSE
    // =================================================

    const result =
      pembimbing.map(
        (
          item
        ) => {
          const profile =
            profileMap.get(
              item.user_id
            );


          const assignments =
            Array.from(
              latestPlacementByPeserta.values()
            )
              .filter(
                (
                  placement
                ) =>
                  placement
                    .pembimbing_id ===
                  item.id
              )
              .map(
                (
                  placement
                ) => {
                  const peserta =
                    pesertaMap.get(
                      placement
                        .peserta_id
                    );


                  return {
                    pesertaId:
                      placement
                        .peserta_id,

                    nama:
                      peserta?.nama ??
                      "Peserta",

                    nomorPeserta:
                      peserta
                        ?.nomorPeserta ??
                      "-",

                    status:
                      peserta?.status ??
                      "-",

                    posisi:
                      placement
                        .posisi ??
                      "-",

                    divisi:
                      placement
                        .divisi ??
                      "-",

                    tanggalMulai:
                      placement
                        .tanggal_mulai,

                    tanggalSelesai:
                      placement
                        .tanggal_selesai,
                  };
                }
              );


          const activeCount =
            assignments.filter(
              (
                assignment
              ) =>
                assignment.status ===
                "aktif"
            ).length;


          return {
            id:
              item.id,

            userId:
              item.user_id,

            nama:
              profile?.nama ??
              "-",

            email:
              profile?.email ??
              "-",

            nomorHp:
              profile?.nomorHp ??
              "-",

            fotoUrl:
              profile?.fotoUrl ??
              null,

            nip:
              item.nip ??
              "-",

            divisi:
              item.divisi ??
              "-",

            totalPeserta:
              assignments.length,

            pesertaAktif:
              activeCount,

            participants:
              assignments,

            createdAt:
              item.created_at,
          };
        }
      );


    return NextResponse.json({
      success:
        true,

      data:
        result,
    });

  } catch (error) {
    console.error(
      "GET /api/admin/pembimbing:",
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