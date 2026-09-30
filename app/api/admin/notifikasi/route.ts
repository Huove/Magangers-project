import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


export const dynamic =
  "force-dynamic";


type PesertaStatus =
  | "tidak_aktif"
  | "mengajukan"
  | "diterima"
  | "aktif"
  | "selesai"
  | "ditolak";


type NotificationMode =
  | "peserta"
  | "massal";


interface SendNotificationBody {
  mode:
    NotificationMode;

  judul: string;

  pesan: string;

  pesertaId?:
    string;

  status?:
    PesertaStatus
    | null;
}


// =====================================================
// GET NOTIFIKASI
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


    const url =
      new URL(
        request.url
      );


    const limitRaw =
      Number(
        url.searchParams.get(
          "limit"
        ) ?? 100
      );


    const limit =
      Number.isFinite(
        limitRaw
      )
        ? Math.min(
            Math.max(
              limitRaw,
              1
            ),
            500
          )
        : 100;


    // =================================================
    // NOTIFIKASI
    // =================================================

    const {
      data: notifications,
      error:
        notificationError,
    } =
      await supabase
        .from(
          "notifikasi"
        )
        .select(`
          id,
          user_id,
          judul,
          pesan,
          dibaca,
          created_at
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(
          limit
        );


    if (
      notificationError
    ) {
      console.error(
        "GET notifikasi error:",
        notificationError
      );


      return NextResponse.json(
        {
          success: false,

          message:
            "Gagal mengambil data notifikasi",
        },
        {
          status: 500,
        }
      );
    }


    const rows =
      notifications ??
      [];


    if (
      rows.length === 0
    ) {
      return NextResponse.json({
        success: true,

        data: [],

        stats: {
          total:
            0,

          dibaca:
            0,

          belumDibaca:
            0,
        },
      });
    }


    // =================================================
    // USER IDS
    // =================================================

    const userIds = [
      ...new Set(
        rows
          .map(
            (item) =>
              item.user_id
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
    // PROFILES
    // =================================================

    const profileMap =
      new Map<
        string,
        {
          nama:
            string;

          email:
            string;
        }
      >();


    if (
      userIds.length >
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
            nama_lengkap,
            email
          `)
          .in(
            "id",
            userIds
          );


      if (
        profileError
      ) {
        console.error(
          "Profile notifikasi error:",
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
            {
              nama:
                profile
                  .nama_lengkap ??
                "Peserta",

              email:
                profile.email ??
                "-",
            }
          );
        }
      }
    }


    // =================================================
    // PESERTA
    // =================================================

    const pesertaMap =
      new Map<
        string,
        {
          id:
            string;

          nomorPeserta:
            string;

          status:
            string;
        }
      >();


    if (
      userIds.length >
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
            user_id,
            nomor_peserta,
            status
          `)
          .in(
            "user_id",
            userIds
          );


      if (
        pesertaError
      ) {
        console.error(
          "Peserta notifikasi error:",
          pesertaError
        );
      } else {
        for (
          const peserta
          of pesertaRows ??
          []
        ) {
          pesertaMap.set(
            peserta.user_id,
            {
              id:
                peserta.id,

              nomorPeserta:
                peserta
                  .nomor_peserta,

              status:
                peserta.status,
            }
          );
        }
      }
    }


    // =================================================
    // FORMAT
    // =================================================

    const result =
      rows.map(
        (item) => {
          const profile =
            profileMap.get(
              item.user_id
            );


          const peserta =
            pesertaMap.get(
              item.user_id
            );


          return {
            id:
              item.id,

            userId:
              item.user_id,

            pesertaId:
              peserta?.id ??
              null,

            nomorPeserta:
              peserta
                ?.nomorPeserta ??
              "-",

            nama:
              profile?.nama ??
              "Peserta",

            email:
              profile?.email ??
              "-",

            statusPeserta:
              peserta?.status ??
              null,

            judul:
              item.judul,

            pesan:
              item.pesan,

            dibaca:
              Boolean(
                item.dibaca
              ),

            createdAt:
              item.created_at,
          };
        }
      );


    // =================================================
    // STATS
    // =================================================

    const dibaca =
      rows.filter(
        (item) =>
          item.dibaca ===
          true
      ).length;


    const belumDibaca =
      rows.length -
      dibaca;


    return NextResponse.json({
      success:
        true,

      data:
        result,

      stats: {
        total:
          rows.length,

        dibaca,

        belumDibaca,
      },
    });

  } catch (error) {
    console.error(
      "GET /api/admin/notifikasi:",
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
// POST NOTIFIKASI
// =====================================================

export async function POST(
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


    const body =
      (
        await request.json()
      ) as SendNotificationBody;


    // =================================================
    // NORMALISASI
    // =================================================

    const mode =
      body.mode;


    const judul =
      body.judul
        ?.trim();


    const pesan =
      body.pesan
        ?.trim();


    // =================================================
    // VALIDASI
    // =================================================

    if (
      mode !==
        "peserta" &&
      mode !==
        "massal"
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Mode notifikasi tidak valid",
        },
        {
          status: 400,
        }
      );
    }


    if (!judul) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Judul notifikasi wajib diisi",
        },
        {
          status: 400,
        }
      );
    }


    if (!pesan) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Pesan notifikasi wajib diisi",
        },
        {
          status: 400,
        }
      );
    }


    if (
      judul.length >
      150
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Judul notifikasi maksimal 150 karakter",
        },
        {
          status: 400,
        }
      );
    }


    if (
      pesan.length >
      5000
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Pesan notifikasi terlalu panjang",
        },
        {
          status: 400,
        }
      );
    }


    // =================================================
    // NOTIFIKASI PERSONAL
    // =================================================

    if (
      mode ===
      "peserta"
    ) {
      if (
        !body.pesertaId
      ) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Peserta tujuan wajib dipilih",
          },
          {
            status: 400,
          }
        );
      }


      // ===============================================
      // PASTIKAN PESERTA ADA
      // ===============================================

      const {
        data:
          peserta,
        error:
          pesertaError,
      } =
        await supabase
          .from(
            "peserta"
          )
          .select(`
            id,
            nama_lengkap
          `)
          .eq(
            "id",
            body.pesertaId
          )
          .maybeSingle();


      if (
        pesertaError
      ) {
        console.error(
          "Cek peserta notifikasi:",
          pesertaError
        );


        return NextResponse.json(
          {
            success: false,

            message:
              "Gagal memeriksa peserta tujuan",
          },
          {
            status: 500,
          }
        );
      }


      if (!peserta) {
        return NextResponse.json(
          {
            success: false,

            message:
              "Peserta tidak ditemukan",
          },
          {
            status: 404,
          }
        );
      }


      // ===============================================
      // RPC QUERY 6
      // ===============================================

      const {
        data:
          notificationId,
        error:
          notificationError,
      } =
        await supabase.rpc(
          "admin_kirim_notifikasi_peserta",
          {
            target_peserta_id:
              body.pesertaId,

            target_judul:
              judul,

            target_pesan:
              pesan,
          }
        );


      if (
        notificationError
      ) {
        console.error(
          "RPC notifikasi peserta error:",
          notificationError
        );


        return NextResponse.json(
          {
            success: false,

            message:
              notificationError.message ||
              "Gagal mengirim notifikasi peserta",
          },
          {
            status: 500,
          }
        );
      }


      return NextResponse.json(
        {
          success:
            true,

          message:
            `Notifikasi berhasil dikirim ke ${peserta.nama_lengkap ?? "peserta"}`,

          data: {
            notificationId,
            recipientCount:
              1,
          },
        },
        {
          status: 201,
        }
      );
    }


    // =================================================
    // NOTIFIKASI MASSAL
    // =================================================

    const allowedStatuses:
      PesertaStatus[] = [
        "tidak_aktif",
        "mengajukan",
        "diterima",
        "aktif",
        "selesai",
        "ditolak",
      ];


    if (
      body.status &&
      !allowedStatuses.includes(
        body.status
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Status peserta tujuan tidak valid",
        },
        {
          status: 400,
        }
      );
    }


    // =================================================
    // RPC QUERY 6
    //
    // status null:
    // diterima + aktif
    // =================================================

    const {
      data:
        sentCount,
      error:
        massError,
    } =
      await supabase.rpc(
        "admin_kirim_notifikasi_massal",
        {
          target_judul:
            judul,

          target_pesan:
            pesan,

          target_status:
            body.status ??
            null,
        }
      );


    if (
      massError
    ) {
      console.error(
        "RPC notifikasi massal error:",
        massError
      );


      return NextResponse.json(
        {
          success: false,

          message:
            massError.message ||
            "Gagal mengirim notifikasi massal",
        },
        {
          status: 500,
        }
      );
    }


    const total =
      Number(
        sentCount
      ) || 0;


    return NextResponse.json(
      {
        success: true,

        message:
          total > 0
            ? `Notifikasi berhasil dikirim ke ${total} peserta`
            : "Tidak ada peserta yang memenuhi target notifikasi",

        data: {
          recipientCount:
            total,
        },
      },
      {
        status: 201,
      }
    );

  } catch (error) {
    console.error(
      "POST /api/admin/notifikasi:",
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