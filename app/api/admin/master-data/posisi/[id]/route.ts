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


interface UpdatePosisiBody {
  divisiId?: string;

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
            "ID posisi tidak valid.",
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
          "master_posisi"
        )
        .select(`
          id,
          divisi_id,
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
            "Gagal membaca posisi.",
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
            "Posisi tidak ditemukan.",
        },
        {
          status:
            404,
        }
      );
    }


    let body:
      UpdatePosisiBody;


    try {
      body =
        (
          await request.json()
        ) as UpdatePosisiBody;
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


    const nextDivisiId =
      body.divisiId !==
      undefined
        ? body.divisiId.trim()
        : current.divisi_id;


    const nextNama =
      body.nama !==
      undefined
        ? body.nama.trim()
        : current.nama;


    if (
      !isUuid(
        nextDivisiId
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Divisi tidak valid.",
        },
        {
          status:
            400,
        }
      );
    }


    if (
      !nextNama
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Nama posisi wajib diisi.",
        },
        {
          status:
            400,
        }
      );
    }


    const {
      data:
        divisi,

      error:
        divisiError,
    } =
      await supabase
        .from(
          "master_divisi"
        )
        .select(
          "id, nama"
        )
        .eq(
          "id",
          nextDivisiId
        )
        .maybeSingle();


    if (
      divisiError ||
      !divisi
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
            divisiError
              ? 500
              : 404,
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
          "master_posisi"
        )
        .select(
          "id"
        )
        .eq(
          "divisi_id",
          nextDivisiId
        )
        .ilike(
          "nama",
          nextNama
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
            "Gagal memeriksa posisi.",
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
            "Posisi tersebut sudah ada pada divisi ini.",
        },
        {
          status:
            409,
        }
      );
    }


    const updateData: {
      divisi_id?:
        string;

      nama?:
        string;

      deskripsi?:
        string | null;

      aktif?:
        boolean;

      updated_at?:
        string;
    } = {};


    if (
      body.divisiId !==
      undefined
    ) {
      updateData.divisi_id =
        nextDivisiId;
    }


    if (
      body.nama !==
      undefined
    ) {
      updateData.nama =
        nextNama;
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
          "master_posisi"
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
          divisi_id,
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
        "UPDATE POSISI:",
        error
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            error.code ===
            "23505"
              ? "Posisi tersebut sudah tersedia."
              : "Gagal memperbarui posisi.",
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
        "Posisi berhasil diperbarui.",

      data: {
        id:
          data.id,

        divisiId:
          data.divisi_id,

        divisiNama:
          divisi.nama,

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
      "PUT /master-data/posisi/[id]:",
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
            "ID posisi tidak valid.",
        },
        {
          status:
            400,
        }
      );
    }


    const {
      data,
      error,
    } =
      await supabase
        .from(
          "master_posisi"
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
        "DELETE POSISI:",
        error
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal menghapus posisi.",
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
            "Posisi tidak ditemukan.",
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
        "Posisi berhasil dihapus.",

      data:
        null,
    });

  } catch (
    error
  ) {
    console.error(
      "DELETE /master-data/posisi/[id]:",
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
// HELPERS
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