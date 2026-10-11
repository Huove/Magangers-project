import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


export const dynamic =
  "force-dynamic";


// =====================================================
// GET PENEMPATAN
// =====================================================

export async function GET(
  request: Request
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


    // =================================================
    // SEMUA PESERTA YANG RELEVAN
    // =================================================

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
            ascending:
              false,
          }
        );


    if (
      pesertaError
    ) {
      console.error(
        "GET peserta penempatan:",
        pesertaError
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal mengambil peserta",
        },
        {
          status:
            500,
        }
      );
    }


    const peserta =
      pesertaRows ??
      [];


    if (
      peserta.length ===
      0
    ) {
      return NextResponse.json({
        success:
          true,

        data:
          [],
      });
    }


    const pesertaIds =
      peserta.map(
        (
          item
        ) =>
          item.id
      );


    // =================================================
    // SEMUA PENEMPATAN PESERTA
    // =================================================

    const {
      data:
        placementRows,
      error:
        placementError,
    } =
      await supabase
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
          "peserta_id",
          pesertaIds
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );


    if (
      placementError
    ) {
      console.error(
        "GET penempatan error:",
        placementError
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal mengambil data penempatan",
        },
        {
          status:
            500,
        }
      );
    }


    // =================================================
    // LATEST PLACEMENT PER PESERTA
    // =================================================

    const latestPlacement =
      new Map<
        string,
        {
          id:
            string;

          peserta_id:
            string;

          pembimbing_id:
            string | null;

          divisi:
            string | null;

          posisi:
            string | null;

          tanggal_mulai:
            string;

          tanggal_selesai:
            string | null;

          created_at:
            string;
        }
      >();


    for (
      const item
      of placementRows ??
      []
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
    // PEMBIMBING IDS
    // =================================================

    const pembimbingIds = [
      ...new Set(
        Array.from(
          latestPlacement.values()
        )
          .map(
            (
              item
            ) =>
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
    // PEMBIMBING
    // =================================================

    const supervisorNameMap =
      new Map<
        string,
        string
      >();


    if (
      pembimbingIds.length >
      0
    ) {
      const {
        data:
          supervisorRows,
        error:
          supervisorError,
      } =
        await supabase
          .from(
            "pembimbing"
          )
          .select(`
            id,
            user_id
          `)
          .in(
            "id",
            pembimbingIds
          );


      if (
        supervisorError
      ) {
        console.error(
          "GET supervisor penempatan:",
          supervisorError
        );


        return NextResponse.json(
          {
            success:
              false,

            message:
              "Gagal mengambil pembimbing",
          },
          {
            status:
              500,
          }
        );
      }


      const supervisors =
        supervisorRows ??
        [];


      const supervisorUserIds = [
        ...new Set(
          supervisors.map(
            (
              item
            ) =>
              item.user_id
          )
        ),
      ];


      const profileMap =
        new Map<
          string,
          string
        >();


      if (
        supervisorUserIds.length >
        0
      ) {
        const {
          data:
            profiles,
          error:
            profileError,
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(`
              id,
              nama_lengkap
            `)
            .in(
              "id",
              supervisorUserIds
            );


        if (
          profileError
        ) {
          console.error(
            "Profile supervisor:",
            profileError
          );
        } else {
          for (
            const profile
            of profiles ??
            []
          ) {
            profileMap.set(
              profile.id,
              profile
                .nama_lengkap ??
              "-"
            );
          }
        }
      }


      for (
        const supervisor
        of supervisors
      ) {
        supervisorNameMap.set(
          supervisor.id,
          profileMap.get(
            supervisor.user_id
          ) ??
          "-"
        );
      }
    }


    // =================================================
    // RESPONSE
    // =================================================

    const result =
      peserta.map(
        (
          item
        ) => {
          const placement =
            latestPlacement.get(
              item.id
            );


          return {
            id:
              placement?.id ??
              null,

            pesertaId:
              item.id,

            peserta:
              item.nama_lengkap ??
              "Peserta",

            nomorPeserta:
              item.nomor_peserta ??
              "-",

            statusPeserta:
              item.status,

            hasPlacement:
              Boolean(
                placement
              ),

            pembimbingId:
              placement
                ?.pembimbing_id ??
              null,

            pembimbing:
              placement
                ?.pembimbing_id
                ? supervisorNameMap.get(
                    placement
                      .pembimbing_id
                  ) ??
                  "-"
                : "-",

            divisi:
              placement
                ?.divisi ??
              "-",

            posisi:
              placement
                ?.posisi ??
              "-",

            tanggalMulai:
              placement
                ?.tanggal_mulai ??
              item.tanggal_mulai ??
              "",

            tanggalSelesai:
              placement
                ?.tanggal_selesai ??
              item.tanggal_selesai ??
              null,

            createdAt:
              placement
                ?.created_at ??
              null,
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
      "GET /api/admin/penempatan:",
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