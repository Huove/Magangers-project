import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


// =====================================================
// TYPES
// =====================================================

interface CreateCertificateBody {
  pesertaId?: string;

  nomorSertifikat?: string;

  tanggalTerbit?: string;

  fileUrl?:
    string |
    null;
}


interface ParticipantRow {
  id: string;

  user_id: string;

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
  id: string;

  nama_lengkap:
    string | null;

  email:
    string | null;
}


interface TaskRow {
  peserta_id:
    string;

  status:
    string | null;
}


interface ReportRow {
  peserta_id:
    string;

  tipe:
    string | null;

  judul:
    string | null;

  status:
    string | null;
}


interface ScoreRow {
  id:
    string;

  peserta_id:
    string;

  kehadiran:
    number | null;

  kedisiplinan:
    number | null;

  tanggung_jawab:
    number | null;

  sikap:
    number | null;

  komunikasi:
    number | null;

  kerja_sama:
    number | null;

  tugas:
    number | null;

  laporan:
    number | null;

  created_at:
    string | null;
}


interface CertificateRow {
  id:
    string;

  peserta_id:
    string;

  nomor_sertifikat:
    string | null;

  file_url:
    string | null;

  tanggal_terbit:
    string | null;

  created_at:
    string;
}


// =====================================================
// GET
// DAFTAR PESERTA + KELAYAKAN SERTIFIKAT
// =====================================================

export async function GET(
  request:
    NextRequest
) {
  try {
    // =================================================
    // AUTH ADMIN
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
    // PESERTA
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
            "aktif",
            "selesai",
            "diberhentikan",
          ]
        )
        .order(
          "tanggal_selesai",
          {
            ascending:
              false,
          }
        );


    if (
      participantError
    ) {
      console.error(
        "GET CERTIFICATE PARTICIPANTS ERROR:",
        participantError
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal mengambil data peserta.",
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


    // =================================================
    // IDS
    // =================================================

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
    // QUERY DATA PENDUKUNG
    // =================================================

    const [
      profileResult,
      taskResult,
      reportResult,
      scoreResult,
      certificateResult,
    ] =
      await Promise.all([
        // =============================================
        // PROFILE
        // =============================================

        supabase
          .from(
            "profiles"
          )
          .select(`
            id,
            nama_lengkap,
            email
          `)
          .in(
            "id",
            userIds
          ),


        // =============================================
        // TUGAS
        // =============================================

        supabase
          .from(
            "tugas_peserta"
          )
          .select(`
            peserta_id,
            status
          `)
          .in(
            "peserta_id",
            participantIds
          ),


        // =============================================
        // LAPORAN
        // =============================================

        supabase
          .from(
            "laporan"
          )
          .select(`
            peserta_id,
            tipe,
            judul,
            status
          `)
          .in(
            "peserta_id",
            participantIds
          ),


        // =============================================
        // PENILAIAN
        // =============================================

        supabase
          .from(
            "penilaian"
          )
          .select(`
            id,
            peserta_id,
            kehadiran,
            kedisiplinan,
            tanggung_jawab,
            sikap,
            komunikasi,
            kerja_sama,
            tugas,
            laporan,
            created_at
          `)
          .in(
            "peserta_id",
            participantIds
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          ),


        // =============================================
        // SERTIFIKAT
        // =============================================

        supabase
          .from(
            "sertifikat"
          )
          .select(`
            id,
            peserta_id,
            nomor_sertifikat,
            file_url,
            tanggal_terbit,
            created_at
          `)
          .in(
            "peserta_id",
            participantIds
          ),
      ]);


    // =================================================
    // QUERY ERRORS
    // =================================================

    if (
      profileResult.error
    ) {
      return databaseError(
        "PROFILE",
        profileResult.error
      );
    }


    if (
      taskResult.error
    ) {
      return databaseError(
        "TUGAS",
        taskResult.error
      );
    }


    if (
      reportResult.error
    ) {
      return databaseError(
        "LAPORAN",
        reportResult.error
      );
    }


    if (
      scoreResult.error
    ) {
      return databaseError(
        "PENILAIAN",
        scoreResult.error
      );
    }


    if (
      certificateResult.error
    ) {
      return databaseError(
        "SERTIFIKAT",
        certificateResult.error
      );
    }


    // =================================================
    // CAST
    // =================================================

    const profiles =
      (
        profileResult.data ??
        []
      ) as ProfileRow[];


    const tasks =
      (
        taskResult.data ??
        []
      ) as TaskRow[];


    const reports =
      (
        reportResult.data ??
        []
      ) as ReportRow[];


    const scores =
      (
        scoreResult.data ??
        []
      ) as ScoreRow[];


    const certificates =
      (
        certificateResult.data ??
        []
      ) as CertificateRow[];


    // =================================================
    // PROFILE MAP
    // =================================================

    const profileMap =
      new Map<
        string,
        ProfileRow
      >();


    profiles.forEach(
      (
        profile
      ) => {
        profileMap.set(
          profile.id,
          profile
        );
      }
    );


    // =================================================
    // SCORE MAP
    //
    // Query sudah descending.
    // Record pertama = penilaian terbaru.
    // =================================================

    const scoreMap =
      new Map<
        string,
        ScoreRow
      >();


    scores.forEach(
      (
        score
      ) => {
        if (
          !scoreMap.has(
            score.peserta_id
          )
        ) {
          scoreMap.set(
            score.peserta_id,
            score
          );
        }
      }
    );


    // =================================================
    // CERTIFICATE MAP
    // =================================================

    const certificateMap =
      new Map<
        string,
        CertificateRow
      >();


    certificates.forEach(
      (
        certificate
      ) => {
        certificateMap.set(
          certificate
            .peserta_id,
          certificate
        );
      }
    );


    // =================================================
    // BUILD RESPONSE
    // =================================================

    const result =
      participants.map(
        (
          participant
        ) => {
          const profile =
            profileMap.get(
              participant
                .user_id
            );


          // ===========================================
          // MAGANG
          // ===========================================

          const magangSelesai =
            normalizeStatus(
              participant.status
            ) ===
            "selesai";


          // ===========================================
          // TUGAS
          // ===========================================

          const participantTasks =
            tasks.filter(
              (
                task
              ) =>
                task.peserta_id ===
                participant.id
            );


          const totalTugas =
            participantTasks.length;


          const tugasSelesai =
            participantTasks.filter(
              (
                task
              ) =>
                normalizeStatus(
                  task.status
                ) ===
                "selesai"
            ).length;


          const semuaTugasSelesai =
            totalTugas >
              0 &&
            tugasSelesai ===
              totalTugas;


          // ===========================================
          // LAPORAN AKHIR
          // ===========================================

          const participantReports =
            reports.filter(
              (
                report
              ) =>
                report.peserta_id ===
                participant.id
            );


         const laporanAkhirDisetujui =
            participantReports.some(
                (report) =>
                isFinalReport(report) &&
                normalizeStatus(
                    report.status
                ) === "disetujui"
            );


          // ===========================================
          // PENILAIAN
          // ===========================================

          const score =
            scoreMap.get(
              participant.id
            );


          const scoreResult =
            getScoreResult(
              score
            );


          // ===========================================
          // REQUIREMENTS
          // ===========================================

          const requirements = {
            magangSelesai,

            semuaTugasSelesai,

            laporanAkhirDisetujui,

            penilaianSelesai:
              scoreResult.complete,
          };


          const completedRequirements =
            Object.values(
              requirements
            ).filter(
              Boolean
            ).length;


          // ===========================================
          // CERTIFICATE
          // ===========================================

          const certificate =
            certificateMap.get(
              participant.id
            );


          const eligible =
            completedRequirements ===
            4;


          return {
            id:
              participant.id,

            userId:
              participant.user_id,

            nomorPeserta:
              participant
                .nomor_peserta ??
              "-",

            nama:
              profile
                ?.nama_lengkap ??
              "Peserta",

            email:
              profile
                ?.email ??
              "-",

            status:
              participant.status,

            tanggalMulai:
              participant
                .tanggal_mulai,

            tanggalSelesai:
              participant
                .tanggal_selesai,

            totalTugas,

            tugasSelesai,

            nilaiAkhir:
              scoreResult.average,

            requirements,

            completedRequirements,

            totalRequirements:
              4,

            eligible,

            certificate:
              certificate
                ? {
                    id:
                      certificate.id,

                    nomorSertifikat:
                      certificate
                        .nomor_sertifikat,

                    fileUrl:
                      certificate
                        .file_url,

                    tanggalTerbit:
                      certificate
                        .tanggal_terbit,

                    createdAt:
                      certificate
                        .created_at,
                  }
                : null,
          };
        }
      );


    // =================================================
    // SUCCESS
    // =================================================

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
      "GET /api/admin/sertifikat ERROR:",
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


// =====================================================
// POST
// TERBITKAN / UPDATE SERTIFIKAT
// =====================================================

export async function POST(
  request:
    NextRequest
) {
  try {
    // =================================================
    // AUTH ADMIN
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
    // BODY
    // =================================================

    let body:
      CreateCertificateBody;


    try {
      body =
        (
          await request.json()
        ) as CreateCertificateBody;

    } catch {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Body request tidak valid.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // NORMALIZE
    // =================================================

    const pesertaId =
      body.pesertaId
        ?.trim();


    const nomorSertifikat =
      body.nomorSertifikat
        ?.trim();


    const tanggalTerbit =
      body.tanggalTerbit
        ?.trim();


    const fileUrl =
      cleanNullable(
        body.fileUrl
      );


    // =================================================
    // VALIDATION
    // =================================================

    if (
      !pesertaId
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "ID peserta wajib diisi.",
        },
        {
          status:
            400,
        }
      );
    }


    if (
      !nomorSertifikat
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Nomor sertifikat wajib diisi.",
        },
        {
          status:
            400,
        }
      );
    }


    if (
      !tanggalTerbit ||
      !isDateValue(
        tanggalTerbit
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Tanggal terbit tidak valid.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // PESERTA
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
          status
        `)
        .eq(
          "id",
          pesertaId
        )
        .maybeSingle();


    if (
      participantError
    ) {
      return databaseError(
        "PESERTA",
        participantError
      );
    }


    if (
      !participant
    ) {
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
    // STATUS MAGANG
    // =================================================

    if (
      normalizeStatus(
        participant.status
      ) !==
      "selesai"
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Peserta belum menyelesaikan masa magang.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // CHECK REQUIREMENTS
    // =================================================

    const [
      taskResult,
      reportResult,
      scoreResult,
    ] =
      await Promise.all([
        // =============================================
        // TASK
        // =============================================

        supabase
          .from(
            "tugas_peserta"
          )
          .select(`
            id,
            status
          `)
          .eq(
            "peserta_id",
            pesertaId
          ),


        // =============================================
        // REPORT
        // =============================================

        supabase
          .from(
            "laporan"
          )
          .select(`
            id,
            tipe,
            judul,
            status
          `)
          .eq(
            "peserta_id",
            pesertaId
          ),


        // =============================================
        // SCORE
        // =============================================

        supabase
          .from(
            "penilaian"
          )
          .select(`
            id,
            peserta_id,
            kehadiran,
            kedisiplinan,
            tanggung_jawab,
            sikap,
            komunikasi,
            kerja_sama,
            tugas,
            laporan,
            created_at
          `)
          .eq(
            "peserta_id",
            pesertaId
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(
            1
          )
          .maybeSingle(),
      ]);


    // =================================================
    // ERRORS
    // =================================================

    if (
      taskResult.error
    ) {
      return databaseError(
        "TUGAS",
        taskResult.error
      );
    }


    if (
      reportResult.error
    ) {
      return databaseError(
        "LAPORAN",
        reportResult.error
      );
    }


    if (
      scoreResult.error
    ) {
      return databaseError(
        "PENILAIAN",
        scoreResult.error
      );
    }


    // =================================================
    // TASK VALIDATION
    // =================================================

    const tasks =
      taskResult.data ??
      [];


    const allTasksComplete =
      tasks.length >
        0 &&
      tasks.every(
        (
          task
        ) =>
          normalizeStatus(
            task.status
          ) ===
          "selesai"
      );


    if (
      !allTasksComplete
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Seluruh tugas peserta belum selesai.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // REPORT VALIDATION
    // =================================================

    const finalReportApproved =
      (
        reportResult.data ??
        []
      ).some(
        (
          report
        ) =>
          isFinalReport(
            report
          ) &&
          normalizeStatus(
            report.status
          ) ===
            "disetujui"
      );


    if (
      !finalReportApproved
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Laporan akhir belum disetujui.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // SCORE VALIDATION
    // =================================================

    const scoreCheck =
      getScoreResult(
        scoreResult.data as
          ScoreRow | null
      );


    if (
      !scoreCheck.complete
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Penilaian pembimbing belum lengkap.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // UPSERT CERTIFICATE
    //
    // peserta_id UNIQUE, jadi satu peserta satu sertifikat.
    // =================================================

    const {
      data:
        certificate,

      error:
        certificateError,
    } =
      await supabase
        .from(
          "sertifikat"
        )
        .upsert(
          {
            peserta_id:
              pesertaId,

            nomor_sertifikat:
              nomorSertifikat,

            tanggal_terbit:
              tanggalTerbit,

            file_url:
              fileUrl,
          },
          {
            onConflict:
              "peserta_id",
          }
        )
        .select(`
          id,
          peserta_id,
          nomor_sertifikat,
          file_url,
          tanggal_terbit,
          created_at
        `)
        .single();


    if (
      certificateError
    ) {
      console.error(
        "SAVE CERTIFICATE ERROR:",
        certificateError
      );


      if (
        certificateError.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "Nomor sertifikat sudah digunakan.",
          },
          {
            status:
              409,
          }
        );
      }


      return NextResponse.json(
        {
          success:
            false,

          message:
            certificateError.message ||
            "Gagal menyimpan sertifikat.",
        },
        {
          status:
            500,
        }
      );
    }


    // =================================================
    // SUCCESS
    // =================================================

    return NextResponse.json({
      success:
        true,

      message:
        "Sertifikat berhasil disimpan.",

      data: {
        certificate,

        nilaiAkhir:
          scoreCheck.average,
      },
    });

  } catch (
    error
  ) {
    console.error(
      "POST /api/admin/sertifikat ERROR:",
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


// =====================================================
// FINAL REPORT
// =====================================================

function isFinalReport(
  report: {
    tipe?:
      string | null;

    judul?:
      string | null;
  }
) {
  const tipe =
    normalizeText(
      report.tipe
    );


  const judul =
    normalizeText(
      report.judul
    );


  return (
    tipe.includes(
      "akhir"
    ) ||
    judul.includes(
      "laporan akhir"
    )
  );
}


// =====================================================
// SCORE RESULT
// =====================================================

function getScoreResult(
  score:
    ScoreRow |
    null |
    undefined
) {
  if (
    !score
  ) {
    return {
      complete:
        false,

      average:
        null as number | null,
    };
  }


  const values = [
    score.kehadiran,
    score.kedisiplinan,
    score.tanggung_jawab,
    score.sikap,
    score.komunikasi,
    score.kerja_sama,
    score.tugas,
    score.laporan,
  ];


  const complete =
    values.every(
      (
        value
      ) =>
        value !==
          null &&
        value !==
          undefined
    );


  if (
    !complete
  ) {
    return {
      complete:
        false,

      average:
        null as number | null,
    };
  }


  const total =
    values.reduce(
      (
        sum,
        value
      ) =>
        sum +
        Number(
          value ??
          0
        ),
      0
    );


  return {
    complete:
      true,

    average:
      Math.round(
        total /
          values.length
      ),
  };
}


// =====================================================
// NORMALIZE STATUS
// =====================================================

function normalizeStatus(
  value:
    string |
    null |
    undefined
) {
  return (
    value ??
    ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[\s-]+/g,
      "_"
    );
}


// =====================================================
// NORMALIZE TEXT
// =====================================================

function normalizeText(
  value:
    string |
    null |
    undefined
) {
  return (
    value ??
    ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /_/g,
      " "
    );
}


// =====================================================
// CLEAN NULLABLE
// =====================================================

function cleanNullable(
  value:
    string |
    null |
    undefined
):
string | null {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return null;
  }


  const cleaned =
    value.trim();


  return (
    cleaned ||
    null
  );
}


// =====================================================
// DATE
// =====================================================

function isDateValue(
  value:
    string
) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    value
  );
}


// =====================================================
// DATABASE ERROR
// =====================================================

function databaseError(
  label:
    string,

  error: {
    message?:
      string;

    code?:
      string;

    details?:
      string;

    hint?:
      string;
  }
) {
  console.error(
    `${label} ERROR:`,
    error
  );


  return NextResponse.json(
    {
      success:
        false,

      message:
        `[${label}] ${
          error.message ||
          "Terjadi kesalahan database."
        }`,
    },
    {
      status:
        500,
    }
  );
}