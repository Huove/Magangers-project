import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


// =====================================================
// CONTEXT
// =====================================================

type RouteContext = {
  params:
    Promise<{
      id:
        string;
    }>;
};


// =====================================================
// DB TYPES
// =====================================================

interface HistoryRow {
  id:
    string;

  peserta_id:
    string;

  jenis_event:
    string;

  tanggal_event:
    string;


  dari_pembimbing_id:
    string | null;

  dari_divisi:
    string | null;

  dari_posisi:
    string | null;

  dari_tanggal_mulai:
    string | null;

  dari_tanggal_selesai_rencana:
    string | null;


  ke_pembimbing_id:
    string | null;

  ke_divisi:
    string | null;

  ke_posisi:
    string | null;

  ke_tanggal_mulai:
    string | null;

  ke_tanggal_selesai_rencana:
    string | null;


  alasan:
    string | null;

  dibuat_oleh:
    string | null;

  created_at:
    string;
}


interface SupervisorRow {
  id:
    string;

  user_id:
    string;
}


interface ProfileRow {
  id:
    string;

  nama_lengkap:
    string | null;
}


// =====================================================
// GET
// =====================================================

export async function GET(
  request:
    NextRequest,

  context:
    RouteContext
) {
  try {
    // =================================================
    // ADMIN
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
    } =
      auth;


    // =================================================
    // ID
    // =================================================

    const {
      id,
    } =
      await context.params;


    if (!id) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "ID peserta tidak valid.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // CHECK PARTICIPANT
    // =================================================

    const {
      data:
        participant,

      error:
        participantError,
    } =
      await supabase
        .from(
          "peserta"
        )
        .select(`
          id,
          nomor_peserta,
          status
        `)
        .eq(
          "id",
          id
        )
        .maybeSingle();


    if (
      participantError
    ) {
      throw participantError;
    }


    if (!participant) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Peserta tidak ditemukan.",
        },
        {
          status:
            404,
        }
      );
    }


    // =================================================
    // HISTORY
    // =================================================

    const {
      data:
        historyData,

      error:
        historyError,
    } =
      await supabase
        .from(
          "riwayat_kerja"
        )
        .select(`
          id,
          peserta_id,
          jenis_event,
          tanggal_event,

          dari_pembimbing_id,
          dari_divisi,
          dari_posisi,
          dari_tanggal_mulai,
          dari_tanggal_selesai_rencana,

          ke_pembimbing_id,
          ke_divisi,
          ke_posisi,
          ke_tanggal_mulai,
          ke_tanggal_selesai_rencana,

          alasan,
          dibuat_oleh,
          created_at
        `)
        .eq(
          "peserta_id",
          id
        )
        .order(
          "tanggal_event",
          {
            ascending:
              false,
          }
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        );


    if (
      historyError
    ) {
      throw historyError;
    }


    const history =
      (
        historyData ??
        []
      ) as HistoryRow[];


    // =================================================
    // SUPERVISOR IDS
    // =================================================

    const supervisorIds = [
      ...new Set(
        history
          .flatMap(
            (
              item
            ) => [
              item
                .dari_pembimbing_id,

              item
                .ke_pembimbing_id,
            ]
          )
          .filter(
            (
              value
            ): value is string =>
              Boolean(
                value
              )
          )
      ),
    ];


    // =================================================
    // MAP NAMES
    // =================================================

    const supervisorNameMap =
      new Map<
        string,
        string
      >();


    if (
      supervisorIds.length >
      0
    ) {
      // ===============================================
      // PEMBIMBING
      // ===============================================

      const {
        data:
          supervisorData,

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
            supervisorIds
          );


      if (
        supervisorError
      ) {
        throw supervisorError;
      }


      const supervisors =
        (
          supervisorData ??
          []
        ) as SupervisorRow[];


      // ===============================================
      // USER IDS
      // ===============================================

      const userIds = [
        ...new Set(
          supervisors.map(
            (
              item
            ) =>
              item.user_id
          )
        ),
      ];


      // ===============================================
      // PROFILES
      // ===============================================

      let profiles:
        ProfileRow[] =
        [];


      if (
        userIds.length >
        0
      ) {
        const {
          data:
            profileData,

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
              userIds
            );


        if (
          profileError
        ) {
          throw profileError;
        }


        profiles =
          (
            profileData ??
            []
          ) as ProfileRow[];
      }


      // ===============================================
      // PROFILE MAP
      // ===============================================

      const profileMap =
        new Map<
          string,
          string
        >();


      profiles.forEach(
        (
          profile
        ) => {
          profileMap.set(
            profile.id,

            profile
              .nama_lengkap ??
              "-"
          );
        }
      );


      // ===============================================
      // SUPERVISOR MAP
      // ===============================================

      supervisors.forEach(
        (
          supervisor
        ) => {
          supervisorNameMap.set(
            supervisor.id,

            profileMap.get(
              supervisor.user_id
            ) ??
            "-"
          );
        }
      );
    }


    // =================================================
    // FORMAT
    // =================================================

    const result =
      history.map(
        (
          item
        ) => ({
          id:
            item.id,

          pesertaId:
            item.peserta_id,

          jenisEvent:
            item.jenis_event,

          tanggalEvent:
            item.tanggal_event,


          dari: {
            pembimbingId:
              item
                .dari_pembimbing_id,

            pembimbingNama:
              item
                .dari_pembimbing_id
                ? supervisorNameMap.get(
                    item
                      .dari_pembimbing_id
                  ) ??
                  "-"
                : "-",

            divisi:
              item.dari_divisi,

            posisi:
              item.dari_posisi,

            tanggalMulai:
              item
                .dari_tanggal_mulai,

            tanggalSelesaiRencana:
              item
                .dari_tanggal_selesai_rencana,
          },


          ke: {
            pembimbingId:
              item
                .ke_pembimbing_id,

            pembimbingNama:
              item
                .ke_pembimbing_id
                ? supervisorNameMap.get(
                    item
                      .ke_pembimbing_id
                  ) ??
                  "-"
                : "-",

            divisi:
              item.ke_divisi,

            posisi:
              item.ke_posisi,

            tanggalMulai:
              item
                .ke_tanggal_mulai,

            tanggalSelesaiRencana:
              item
                .ke_tanggal_selesai_rencana,
          },


          alasan:
            item.alasan,

          dibuatOleh:
            item.dibuat_oleh,

          createdAt:
            item.created_at,
        })
      );


    // =================================================
    // RESPONSE
    // =================================================

    return NextResponse.json({
      success:
        true,

      data: {
        participant: {
          id:
            participant.id,

          nomorPeserta:
            participant
              .nomor_peserta,

          status:
            participant.status,
        },

        history:
          result,
      },
    });

  } catch (
    error
  ) {
    console.error(
      "GET /api/admin/peserta/[id]/riwayat:",
      error
    );


    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server.",
      },
      {
        status:
          500,
      }
    );
  }
}