import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}


interface UpdateDivisiBody {
  nama?: string;

  deskripsi?:
    | string
    | null;

  aktif?: boolean;
}


// =====================================================
// PUT
// =====================================================

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const auth =
      await requireAdmin(
        request
      );


    if (
      !auth.ok
    ) {
      return auth.response;
    }


    const {
      supabase,
    } =
      auth;


    const {
      id,
    } =
      await context.params;


    if (
      !isUuid(id)
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "ID divisi tidak valid.",
        },
        {
          status:
            400,
        }
      );
    }


    const {
      data:
        current,

      error:
        currentError,
    } =
      await supabase
        .from(
          "master_divisi"
        )
        .select(`
          id,
          nama,
          deskripsi,
          aktif
        `)
        .eq(
          "id",
          id
        )
        .maybeSingle();


    if (
      currentError
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal membaca divisi.",
        },
        {
          status:
            500,
        }
      );
    }


    if (
      !current
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Divisi tidak ditemukan.",
        },
        {
          status:
            404,
        }
      );
    }


    let body:
      UpdateDivisiBody;


    try {
      body =
        (
          await request.json()
        ) as UpdateDivisiBody;
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


    const updateData: {
      nama?: string;

      deskripsi?:
        string | null;

      aktif?: boolean;

      updated_at?:
        string;
    } = {};


    if (
      body.nama !==
      undefined
    ) {
      const nama =
        body.nama.trim();


      if (
        !nama
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "Nama divisi wajib diisi.",
          },
          {
            status:
              400,
          }
        );
      }


      const {
        data:
          duplicate,

        error:
          duplicateError,
      } =
        await supabase
          .from(
            "master_divisi"
          )
          .select(
            "id"
          )
          .ilike(
            "nama",
            nama
          )
          .neq(
            "id",
            id
          )
          .limit(1)
          .maybeSingle();


      if (
        duplicateError
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "Gagal memeriksa nama divisi.",
          },
          {
            status:
              500,
          }
        );
      }


      if (
        duplicate
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "Nama divisi sudah digunakan.",
          },
          {
            status:
              409,
          }
        );
      }


      updateData.nama =
        nama;
    }


    if (
      body.deskripsi !==
      undefined
    ) {
      updateData.deskripsi =
        cleanNullable(
          body.deskripsi
        );
    }


    if (
      body.aktif !==
      undefined
    ) {
      updateData.aktif =
        body.aktif;
    }


    if (
      Object.keys(
        updateData
      ).length ===
      0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Tidak ada data yang diperbarui.",
        },
        {
          status:
            400,
        }
      );
    }


    updateData.updated_at =
      new Date()
        .toISOString();


    const {
      data,
      error,
    } =
      await supabase
        .from(
          "master_divisi"
        )
        .update(
          updateData
        )
        .eq(
          "id",
          id
        )
        .select(`
          id,
          nama,
          deskripsi,
          aktif,
          created_at,
          updated_at
        `)
        .single();


    if (
      error
    ) {
      console.error(
        "UPDATE DIVISI:",
        error
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            error.code ===
            "23505"
              ? "Nama divisi sudah digunakan."
              : "Gagal memperbarui divisi.",
        },
        {
          status:
            error.code ===
            "23505"
              ? 409
              : 500,
        }
      );
    }


    return NextResponse.json({
      success:
        true,

      message:
        "Divisi berhasil diperbarui.",

      data: {
        id:
          data.id,

        nama:
          data.nama,

        deskripsi:
          data.deskripsi,

        aktif:
          data.aktif,

        createdAt:
          data.created_at,

        updatedAt:
          data.updated_at,
      },
    });

  } catch (
    error
  ) {
    console.error(
      "PUT /master-data/divisi/[id]:",
      error
    );


    return NextResponse.json(
      {
        success:
          false,

        message:
          "Terjadi kesalahan pada server.",
      },
      {
        status:
          500,
      }
    );
  }
}


// =====================================================
// DELETE
// =====================================================

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const auth =
      await requireAdmin(
        request
      );


    if (
      !auth.ok
    ) {
      return auth.response;
    }


    const {
      supabase,
    } =
      auth;


    const {
      id,
    } =
      await context.params;


    if (
      !isUuid(id)
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "ID divisi tidak valid.",
        },
        {
          status:
            400,
        }
      );
    }


    // =================================================
    // JANGAN HAPUS DIVISI YANG MASIH PUNYA POSISI
    // =================================================

    const {
      count,
      error:
        countError,
    } =
      await supabase
        .from(
          "master_posisi"
        )
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true,
          }
        )
        .eq(
          "divisi_id",
          id
        );


    if (
      countError
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal memeriksa posisi pada divisi.",
        },
        {
          status:
            500,
        }
      );
    }


    if (
      (
        count ??
        0
      ) >
      0
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Divisi masih memiliki posisi. Hapus atau pindahkan posisi terlebih dahulu.",
        },
        {
          status:
            409,
        }
      );
    }


    const {
      data,
      error,
    } =
      await supabase
        .from(
          "master_divisi"
        )
        .delete()
        .eq(
          "id",
          id
        )
        .select(
          "id"
        )
        .maybeSingle();


    if (
      error
    ) {
      console.error(
        "DELETE DIVISI:",
        error
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal menghapus divisi.",
        },
        {
          status:
            500,
        }
      );
    }


    if (
      !data
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Divisi tidak ditemukan.",
        },
        {
          status:
            404,
        }
      );
    }


    return NextResponse.json({
      success:
        true,

      message:
        "Divisi berhasil dihapus.",

      data:
        null,
    });

  } catch (
    error
  ) {
    console.error(
      "DELETE /master-data/divisi/[id]:",
      error
    );


    return NextResponse.json(
      {
        success:
          false,

        message:
          "Terjadi kesalahan pada server.",
      },
      {
        status:
          500,
      }
    );
  }
}


// =====================================================
// HELPER
// =====================================================

function cleanNullable(
  value:
    string |
    null |
    undefined
) {
  const result =
    value?.trim() ??
    "";


  return result ||
    null;
}


function isUuid(
  value: string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}