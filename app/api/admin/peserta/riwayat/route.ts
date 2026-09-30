import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


export const dynamic =
  "force-dynamic";


// =====================================================
// TYPES
// =====================================================

interface ParticipantRow {
  id:
    string;

  user_id:
    string;

  nomor_peserta:
    string | null;

  status:
    string;

  tanggal_mulai:
    string | null;

  tanggal_selesai:
    string | null;
}


interface ProfileRow {
  id:
    string;

  nama_lengkap:
    string | null;

  email:
    string | null;

  nomor_hp:
    string | null;

  foto_url:
    string | null;
}


interface EducationRow {
  peserta_id:
    string;

  sekolah:
    string | null;

  jurusan:
    string | null;
}


interface PlacementRow {
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
}


interface SupervisorRow {
  id:
    string;

  user_id:
    string;
}


interface TerminationHistoryRow {
  id:
    string;

  peserta_id:
    string;

  tanggal_event:
    string;

  alasan:
    string | null;
}


// =====================================================
// GET
// RIWAYAT / ARSIP PESERTA
// =====================================================

export async function GET(
  request: Request
) {
  try {

    // =================================================
    // 1. AUTH ADMIN
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
    // 2. PESERTA ARSIP
    // =================================================

    const {
      data:
        participantData,

      error:
        participantError,
    } =
      await supabase
        .from(
          "peserta"
        )
        .select(`
          id,
          user_id,
          nomor_peserta,
          status,
          tanggal_mulai,
          tanggal_selesai
        `)
        .in(
          "status",
          [
            "selesai",
            "diberhentikan",
          ]
        )
        .order(
          "tanggal_selesai",
          {
            ascending:
              false,

            nullsFirst:
              false,
          }
        );


    if (
      participantError
    ) {
      console.error(
        "GET PARTICIPANT ARCHIVE ERROR:",
        participantError
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal mengambil riwayat peserta.",

          data:
            [],
        },
        {
          status:
            500,
        }
      );
    }


    const participants =
      (
        participantData ??
        []
      ) as ParticipantRow[];


    if (
      participants.length ===
      0
    ) {
      return NextResponse.json({
        success:
          true,

        data:
          [],
      });
    }


    const participantIds =
      participants.map(
        (
          item
        ) =>
          item.id
      );


    const userIds =
      participants.map(
        (
          item
        ) =>
          item.user_id
      );


    // =================================================
    // 3. DATA PENDUKUNG
    // =================================================

    const [
      profileResult,
      educationResult,
      placementResult,
      terminationHistoryResult,
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
            "pendidikan"
          )
          .select(`
            peserta_id,
            sekolah,
            jurusan
          `)
          .in(
            "peserta_id",
            participantIds
          ),


        supabase
          .from(
            "penempatan"
          )
          .select(`
            peserta_id,
            pembimbing_id,
            divisi,
            posisi,
            tanggal_mulai,
            tanggal_selesai
          `)
          .in(
            "peserta_id",
            participantIds
          ),


        supabase
          .from(
            "riwayat_kerja"
          )
          .select(`
            id,
            peserta_id,
            tanggal_event,
            alasan
          `)
          .in(
            "peserta_id",
            participantIds
          )
          .eq(
            "jenis_event",
            "diberhentikan"
          )
          .order(
            "tanggal_event",
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
        "ARCHIVE PROFILE ERROR:",
        profileResult.error
      );
    }


    if (
      educationResult.error
    ) {
      console.error(
        "ARCHIVE EDUCATION ERROR:",
        educationResult.error
      );
    }


    if (
      placementResult.error
    ) {
      console.error(
        "ARCHIVE PLACEMENT ERROR:",
        placementResult.error
      );
    }


    if (
      terminationHistoryResult.error
    ) {
      console.error(
        "ARCHIVE HISTORY ERROR:",
        terminationHistoryResult.error
      );
    }


    const profiles =
      (
        profileResult.data ??
        []
      ) as ProfileRow[];


    const educations =
      (
        educationResult.data ??
        []
      ) as EducationRow[];


    const placements =
      (
        placementResult.data ??
        []
      ) as PlacementRow[];


    const terminationHistories =
      (
        terminationHistoryResult.data ??
        []
      ) as TerminationHistoryRow[];


    // =================================================
    // 4. PEMBIMBING
    // =================================================

    const supervisorIds =
      [
        ...new Set(
          placements
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


    let supervisors:
      SupervisorRow[] =
      [];


    let supervisorProfiles:
      ProfileRow[] =
      [];


    if (
      supervisorIds.length >
      0
    ) {
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
        console.error(
          "ARCHIVE SUPERVISOR ERROR:",
          supervisorError
        );

      } else {
        supervisors =
          (
            supervisorData ??
            []
          ) as SupervisorRow[];
      }


      const supervisorUserIds =
        [
          ...new Set(
            supervisors.map(
              (
                item
              ) =>
                item.user_id
            )
          ),
        ];


      if (
        supervisorUserIds.length >
        0
      ) {
        const {
          data:
            supervisorProfileData,

          error:
            supervisorProfileError,
        } =
          await supabase
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
              supervisorUserIds
            );


        if (
          supervisorProfileError
        ) {
          console.error(
            "ARCHIVE SUPERVISOR PROFILE ERROR:",
            supervisorProfileError
          );

        } else {
          supervisorProfiles =
            (
              supervisorProfileData ??
              []
            ) as ProfileRow[];
        }
      }
    }


    // =================================================
    // 5. MAP
    // =================================================

    const profileMap =
      new Map(
        profiles.map(
          (
            item
          ) => [
            item.id,
            item,
          ]
        )
      );


    const educationMap =
      new Map(
        educations.map(
          (
            item
          ) => [
            item.peserta_id,
            item,
          ]
        )
      );


    const placementMap =
      new Map(
        placements.map(
          (
            item
          ) => [
            item.peserta_id,
            item,
          ]
        )
      );


    const supervisorMap =
      new Map(
        supervisors.map(
          (
            item
          ) => [
            item.id,
            item,
          ]
        )
      );


    const supervisorProfileMap =
      new Map(
        supervisorProfiles.map(
          (
            item
          ) => [
            item.id,
            item,
          ]
        )
      );


    const latestTerminationMap =
      new Map<
        string,
        TerminationHistoryRow
      >();


    for (
      const history
      of terminationHistories
    ) {
      if (
        !latestTerminationMap.has(
          history.peserta_id
        )
      ) {
        latestTerminationMap.set(
          history.peserta_id,
          history
        );
      }
    }


    // =================================================
    // 6. RESPONSE
    // =================================================

    const result =
      participants.map(
        (
          participant
        ) => {
          const profile =
            profileMap.get(
              participant.user_id
            );


          const education =
            educationMap.get(
              participant.id
            );


          const placement =
            placementMap.get(
              participant.id
            );


          const supervisor =
            placement
              ?.pembimbing_id
              ? supervisorMap.get(
                  placement.pembimbing_id
                )
              : undefined;


          const supervisorProfile =
            supervisor
              ? supervisorProfileMap.get(
                  supervisor.user_id
                )
              : undefined;


          const termination =
            latestTerminationMap.get(
              participant.id
            );


          return {
            id:
              participant.id,

            userId:
              participant.user_id,

            nomorPeserta:
              participant.nomor_peserta ??
              "-",

            nama:
              profile
                ?.nama_lengkap ??
              "Peserta",

            email:
              profile
                ?.email ??
              "-",

            nomorHp:
              profile
                ?.nomor_hp ??
              "-",

            fotoUrl:
              profile
                ?.foto_url ??
              null,

            sekolah:
              education
                ?.sekolah ??
              "-",

            jurusan:
              education
                ?.jurusan ??
              "-",

            divisi:
              placement
                ?.divisi ??
              "-",

            posisi:
              placement
                ?.posisi ??
              "-",

            pembimbing:
              supervisorProfile
                ?.nama_lengkap ??
              "-",

            status:
              participant.status,

            tanggalMulai:
              participant
                .tanggal_mulai ??
              placement
                ?.tanggal_mulai ??
              null,

            tanggalSelesai:
              participant
                .tanggal_selesai ??
              placement
                ?.tanggal_selesai ??
              null,

            tanggalArsip:
              participant
                .status ===
                "diberhentikan"
                ? termination
                    ?.tanggal_event ??
                  participant
                    .tanggal_selesai ??
                  null
                : participant
                    .tanggal_selesai ??
                  null,

            alasanBerhenti:
              participant
                .status ===
                "diberhentikan"
                ? termination
                    ?.alasan ??
                  null
                : null,
          };
        }
      );


    return NextResponse.json({
      success:
        true,

      data:
        result,
    });

  } catch (
    error
  ) {
    console.error(
      "GET /api/admin/peserta/riwayat:",
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

        data:
          [],
      },
      {
        status:
          500,
      }
    );
  }
}
