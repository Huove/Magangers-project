import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


// =====================================================
// BODY
// =====================================================

interface UpdatePesertaBody {
  nama?: string;

  sekolah?: string;

  status?:
    | "diterima"
    | "aktif"
    | "selesai";

  posisi?: string;

  divisi?: string;

  pembimbingId?:
    | string
    | null;

  tanggalMulai?: string;

  tanggalSelesai?:
    | string
    | null;
}


// =====================================================
// ROUTE CONTEXT
// =====================================================

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};


// =====================================================
// PUT PESERTA
// =====================================================

export async function PUT(
  request: NextRequest,
  context: RouteContext
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
      user,
    } = auth;


    // =================================================
    // 2. PARAM ID
    // =================================================

    const {
      id,
    } =
      await context.params;


    // =================================================
    // 3. BODY
    // =================================================

    const body =
      (
        await request.json()
      ) as UpdatePesertaBody;


    // =================================================
    // VALIDATION ID
    // =================================================

    if (!id) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "ID peserta tidak valid",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // VALIDATION STATUS
    // =================================================

    const allowedStatus:
      UpdatePesertaBody["status"][] =
      [
        "diterima",
        "aktif",
        "selesai",
      ];


    if (
      body.status &&
      !allowedStatus.includes(
        body.status
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Status peserta tidak valid",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // VALIDATION DATE
    // =================================================

    if (
      body.tanggalMulai &&
      body.tanggalSelesai &&
      body.tanggalSelesai <
        body.tanggalMulai
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Tanggal selesai tidak boleh sebelum tanggal mulai",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // GET CURRENT PESERTA
    // =================================================

    const {
      data:
        current,

      error:
        currentError,
    } =
      await supabase
        .from(
          "peserta"
        )
        .select(`
          id,
          user_id,
          nama_lengkap,
          status
        `)
        .eq(
          "id",
          id
        )
        .single();


    if (
      currentError ||
      !current
    ) {
      console.error(
        "Current peserta error:",
        currentError
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "Peserta tidak ditemukan",
        },
        {
          status:
            404,
        }
      );
    }


    // =================================================
    // UPDATE PESERTA
    // =================================================

    const pesertaUpdate: {
      nama_lengkap?:
        string;

      status?:
        | "diterima"
        | "aktif"
        | "selesai";
    } = {};


    // =================================================
    // NAMA
    // =================================================

    if (
      typeof body.nama ===
      "string"
    ) {
      const nama =
        body.nama.trim();


      if (nama) {
        pesertaUpdate
          .nama_lengkap =
          nama;
      }
    }


    // =================================================
    // STATUS
    // =================================================

    if (
      body.status
    ) {
      pesertaUpdate.status =
        body.status;
    }


    // =================================================
    // SIMPAN PESERTA
    // =================================================

    if (
      Object.keys(
        pesertaUpdate
      ).length >
      0
    ) {
      const {
        error:
          updateError,
      } =
        await supabase
          .from(
            "peserta"
          )
          .update(
            pesertaUpdate
          )
          .eq(
            "id",
            id
          );


      if (
        updateError
      ) {
        console.error(
          "Update peserta error:",
          updateError
        );


        return NextResponse.json(
          {
            success:
              false,

            message:
              "Gagal memperbarui peserta",
          },
          {
            status:
              500,
          }
        );
      }
    }


    // =================================================
    // SYNC NAMA KE PROFILES
    // =================================================

    if (
      typeof body.nama ===
        "string" &&
      body.nama.trim()
    ) {
      const {
        error:
          profileError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .update({
            nama_lengkap:
              body.nama.trim(),
          })
          .eq(
            "id",
            current.user_id
          );


      if (
        profileError
      ) {
        console.error(
          "Update profile error:",
          profileError
        );


        return NextResponse.json(
          {
            success:
              false,

            message:
              "Peserta diperbarui tetapi profil gagal disinkronkan",
          },
          {
            status:
              500,
          }
        );
      }
    }


    // =================================================
    // STATUS HISTORY
    // =================================================

    if (
      body.status &&
      body.status !==
        current.status
    ) {
      const {
        error:
          historyError,
      } =
        await supabase
          .from(
            "status_history"
          )
          .insert({
            peserta_id:
              current.id,

            entity:
              "peserta",

            entity_id:
              current.id,

            from_status:
              current.status,

            to_status:
              body.status,

            note:
              "Status peserta diperbarui melalui Admin Peserta.",

            changed_by:
              user.id,
          });


      // History tidak menggagalkan
      // update utama jika gagal.
      if (
        historyError
      ) {
        console.error(
          "Status history error:",
          historyError
        );
      }
    }


    // =================================================
    // PENDIDIKAN
    // =================================================

    if (
      typeof body.sekolah ===
      "string"
    ) {
      const sekolah =
        body.sekolah.trim();


      // ===============================================
      // CARI PENDIDIKAN TERBARU
      // ===============================================

      const {
        data:
          education,

        error:
          educationFindError,
      } =
        await supabase
          .from(
            "pendidikan"
          )
          .select(
            "id"
          )
          .eq(
            "peserta_id",
            id
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
          .maybeSingle();


      if (
        educationFindError
      ) {
        console.error(
          "Cari pendidikan error:",
          educationFindError
        );


        return NextResponse.json(
          {
            success:
              false,

            message:
              "Gagal membaca pendidikan peserta",
          },
          {
            status:
              500,
          }
        );
      }


      // ===============================================
      // UPDATE
      // ===============================================

      if (
        education
      ) {
        const {
          error:
            educationUpdateError,
        } =
          await supabase
            .from(
              "pendidikan"
            )
            .update({
              sekolah,
            })
            .eq(
              "id",
              education.id
            );


        if (
          educationUpdateError
        ) {
          console.error(
            "Update pendidikan error:",
            educationUpdateError
          );


          return NextResponse.json(
            {
              success:
                false,

              message:
                "Gagal memperbarui pendidikan peserta",
            },
            {
              status:
                500,
            }
          );
        }
      }


      // ===============================================
      // INSERT
      // ===============================================

      else if (
        sekolah
      ) {
        const {
          error:
            educationInsertError,
        } =
          await supabase
            .from(
              "pendidikan"
            )
            .insert({
              peserta_id:
                id,

              sekolah,
            });


        if (
          educationInsertError
        ) {
          console.error(
            "Insert pendidikan error:",
            educationInsertError
          );


          return NextResponse.json(
            {
              success:
                false,

              message:
                "Gagal menyimpan pendidikan peserta",
            },
            {
              status:
                500,
            }
          );
        }
      }
    }


    // =================================================
    // PENEMPATAN
    //
    // Menggunakan RPC:
    // admin_simpan_penempatan
    // =================================================

    const hasPlacementData =
      Boolean(
        body.posisi
          ?.trim()
      ) ||

      Boolean(
        body.divisi
          ?.trim()
      ) ||

      Boolean(
        body.pembimbingId
      ) ||

      Boolean(
        body.tanggalMulai
      ) ||

      Boolean(
        body.tanggalSelesai
      );


    // =================================================
    // JIKA ADA DATA PENEMPATAN
    // =================================================

    if (
      hasPlacementData
    ) {
      // ===============================================
      // TANGGAL MULAI WAJIB
      // ===============================================

      if (
        !body.tanggalMulai
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "Tanggal mulai wajib diisi untuk penempatan",
          },
          {
            status:
              400,
          }
        );
      }


      // ===============================================
      // RPC
      // ===============================================

      const {
        data:
          placement,

        error:
          placementError,
      } =
        await supabase.rpc(
          "admin_simpan_penempatan",
          {
            target_peserta_id:
              id,

            target_pembimbing_id:
              body.pembimbingId ??
              null,

            target_divisi:
              body.divisi
                ?.trim() ||
              null,

            target_posisi:
              body.posisi
                ?.trim() ||
              null,

            target_tanggal_mulai:
              body.tanggalMulai,

            target_tanggal_selesai:
              body.tanggalSelesai ||
              null,
          }
        );


      if (
        placementError
      ) {
        console.error(
          "Placement RPC error:",
          placementError
        );


        return NextResponse.json(
          {
            success:
              false,

            message:
              placementError.message ||
              "Gagal menyimpan penempatan peserta",
          },
          {
            status:
              500,
          }
        );
      }


      // ===============================================
      // RESPONSE DENGAN PENEMPATAN
      // ===============================================

      return NextResponse.json(
        {
          success:
            true,

          message:
            "Data peserta dan penempatan berhasil diperbarui",

          data: {
            placement,
          },
        }
      );
    }


    // =================================================
    // RESPONSE TANPA PENEMPATAN
    // =================================================

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Data peserta berhasil diperbarui",
      }
    );

  } catch (
    error
  ) {
    console.error(
      "PUT /api/admin/peserta/[id]:",
      error
    );


    return NextResponse.json(
      {
        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan pada server",
      },
      {
        status:
          500,
      }
    );
  }
}