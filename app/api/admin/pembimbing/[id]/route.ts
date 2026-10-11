import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


// =====================================================
// NEXT.JS 16 ROUTE CONTEXT
// =====================================================

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


// =====================================================
// REQUEST BODY
// =====================================================

interface UpdateSupervisorBody {
  nama?: string;

  nip?:
    | string
    | null;

  divisi?:
    | string
    | null;

  nomorHp?:
    | string
    | null;
}


// =====================================================
// PUT
// UPDATE PEMBIMBING
// =====================================================

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    // =================================================
    // 1. CEK ADMIN
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
    // 2. AMBIL ID PEMBIMBING
    // =================================================

    const {
      id,
    } =
      await context.params;


    if (
      !id ||
      id === "undefined" ||
      id === "null"
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "ID pembimbing tidak valid.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // 3. AMBIL BODY
    // =================================================

    let body:
      UpdateSupervisorBody;


    try {
      body =
        (
          await request.json()
        ) as UpdateSupervisorBody;
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
    // 4. CARI PEMBIMBING
    // =================================================

    const {
      data:
        currentSupervisor,
      error:
        supervisorError,
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
        .eq(
          "id",
          id
        )
        .maybeSingle();


    if (
      supervisorError
    ) {
      console.error(
        "READ PEMBIMBING ERROR:",
        supervisorError
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal membaca data pembimbing.",
        },
        {
          status:
            500,
        }
      );
    }


    if (
      !currentSupervisor
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Pembimbing tidak ditemukan.",
        },
        {
          status:
            404,
        }
      );
    }


    // =================================================
    // 5. NORMALISASI DATA
    // =================================================

    const nama =
      body.nama !==
      undefined
        ? body.nama.trim()
        : undefined;


    const nip =
      body.nip !==
      undefined
        ? cleanNullable(
            body.nip
          )
        : undefined;


    const divisi =
      body.divisi !==
      undefined
        ? cleanNullable(
            body.divisi
          )
        : undefined;


    const nomorHp =
      body.nomorHp !==
      undefined
        ? cleanNullable(
            body.nomorHp
          )
        : undefined;


    // =================================================
    // NAMA WAJIB JIKA DIKIRIM
    // =================================================

    if (
      nama !==
        undefined &&
      !nama
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Nama pembimbing tidak boleh kosong.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // 6. UPDATE TABLE PEMBIMBING
    // =================================================

    const pembimbingUpdate: {
      nip?: string | null;
      divisi?: string | null;
    } = {};


    if (
      nip !==
      undefined
    ) {
      pembimbingUpdate.nip =
        nip;
    }


    if (
      divisi !==
      undefined
    ) {
      pembimbingUpdate.divisi =
        divisi;
    }


    if (
      Object.keys(
        pembimbingUpdate
      ).length >
      0
    ) {
      const {
        error:
          updateSupervisorError,
      } =
        await supabase
          .from(
            "pembimbing"
          )
          .update(
            pembimbingUpdate
          )
          .eq(
            "id",
            id
          );


      if (
        updateSupervisorError
      ) {
        console.error(
          "UPDATE PEMBIMBING ERROR:",
          updateSupervisorError
        );


        return NextResponse.json(
          {
            success:
              false,

            message:
              updateSupervisorError
                .message ||
              "Gagal memperbarui data pembimbing.",
          },
          {
            status:
              500,
          }
        );
      }
    }


    // =================================================
    // 7. UPDATE PROFILE PEMBIMBING
    // =================================================

    const profileUpdate: {
      nama_lengkap?: string;
      nomor_hp?: string | null;
      updated_at?: string;
    } = {};


    if (
      nama !==
      undefined
    ) {
      profileUpdate.nama_lengkap =
        nama;
    }


    if (
      nomorHp !==
      undefined
    ) {
      profileUpdate.nomor_hp =
        nomorHp;
    }


    if (
      Object.keys(
        profileUpdate
      ).length >
      0
    ) {
      profileUpdate.updated_at =
        new Date()
          .toISOString();


      const {
        error:
          profileError,
      } =
        await supabase
          .from(
            "profiles"
          )
          .update(
            profileUpdate
          )
          .eq(
            "id",
            currentSupervisor
              .user_id
          );


      if (
        profileError
      ) {
        console.error(
          "UPDATE PROFILE PEMBIMBING ERROR:",
          profileError
        );


        return NextResponse.json(
          {
            success:
              false,

            message:
              profileError.message ||
              "Data pembimbing berhasil diubah, tetapi profile gagal diperbarui.",
          },
          {
            status:
              500,
          }
        );
      }
    }


    // =================================================
    // 8. AMBIL DATA TERBARU
    // =================================================

    const [
      latestSupervisorResult,
      latestProfileResult,
    ] =
      await Promise.all([
        supabase
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
          .eq(
            "id",
            id
          )
          .maybeSingle(),

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
          .eq(
            "id",
            currentSupervisor
              .user_id
          )
          .maybeSingle(),
      ]);


    if (
      latestSupervisorResult.error
    ) {
      console.error(
        "REFRESH PEMBIMBING ERROR:",
        latestSupervisorResult.error
      );
    }


    if (
      latestProfileResult.error
    ) {
      console.error(
        "REFRESH PROFILE ERROR:",
        latestProfileResult.error
      );
    }


    const latestSupervisor =
      latestSupervisorResult.data;


    const latestProfile =
      latestProfileResult.data;


    // =================================================
    // SUCCESS
    // =================================================

    return NextResponse.json({
      success:
        true,

      message:
        "Data pembimbing berhasil diperbarui.",

      data: {
        id,

        userId:
          currentSupervisor
            .user_id,

        nama:
          latestProfile
            ?.nama_lengkap ??
          nama ??
          "-",

        email:
          latestProfile
            ?.email ??
          "-",

        nomorHp:
          latestProfile
            ?.nomor_hp ??
          "-",

        fotoUrl:
          latestProfile
            ?.foto_url ??
          null,

        nip:
          latestSupervisor
            ?.nip ??
          "-",

        divisi:
          latestSupervisor
            ?.divisi ??
          "-",

        createdAt:
          latestSupervisor
            ?.created_at ??
          currentSupervisor
            .created_at,
      },
    });

  } catch (error) {
    console.error(
      "PUT /api/admin/pembimbing/[id] ERROR:",
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
// CLEAN NULLABLE VALUE
// =====================================================

function cleanNullable(
  value:
    | string
    | null
    | undefined
) {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return null;
  }


  const result =
    value.trim();


  if (
    !result ||
    result === "-"
  ) {
    return null;
  }


  return result;
}