import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


export const dynamic =
  "force-dynamic";


interface CreatePosisiBody {
  divisiId?: string;

  nama?: string;

  deskripsi?:
    | string
    | null;

  aktif?: boolean;
}


// =====================================================
// GET
// =====================================================

export async function GET(
  request: Request
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


    const url =
      new URL(
        request.url
      );


    const activeOnly =
      url.searchParams.get(
        "active"
      ) === "1";


    const divisiId =
      url.searchParams.get(
        "divisiId"
      );


    let query =
      supabase
        .from(
          "master_posisi"
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
        .order(
          "nama",
          {
            ascending:
              true,
          }
        );


    if (
      activeOnly
    ) {
      query =
        query.eq(
          "aktif",
          true
        );
    }


    if (
      divisiId
    ) {
      query =
        query.eq(
          "divisi_id",
          divisiId
        );
    }


    const {
      data:
        posisiData,

      error:
        posisiError,
    } =
      await query;


    if (
      posisiError
    ) {
      console.error(
        "GET POSISI:",
        posisiError
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            "Gagal mengambil master posisi.",
        },
        {
          status:
            500,
        }
      );
    }


    const rows =
      posisiData ??
      [];


    const divisiIds = [
      ...new Set(
        rows.map(
          (
            item
          ) =>
            item.divisi_id
        )
      ),
    ];


    let divisiMap =
      new Map<
        string,
        string
      >();


    if (
      divisiIds.length >
      0
    ) {
      const {
        data:
          divisiData,

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
          .in(
            "id",
            divisiIds
          );


      if (
        divisiError
      ) {
        return NextResponse.json(
          {
            success:
              false,

            message:
              "Gagal membaca relasi divisi.",
          },
          {
            status:
              500,
          }
        );
      }


      divisiMap =
        new Map(
          (
            divisiData ??
            []
          ).map(
            (
              item
            ) => [
              item.id,
              item.nama,
            ]
          )
        );
    }


    return NextResponse.json({
      success:
        true,

      data:
        rows.map(
          (
            item
          ) => ({
            id:
              item.id,

            divisiId:
              item.divisi_id,

            divisiNama:
              divisiMap.get(
                item.divisi_id
              ) ??
              "-",

            nama:
              item.nama,

            deskripsi:
              item.deskripsi,

            aktif:
              item.aktif,

            createdAt:
              item.created_at,

            updatedAt:
              item.updated_at,
          })
        ),
    });

  } catch (
    error
  ) {
    console.error(
      "GET /master-data/posisi:",
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
// POST
// =====================================================

export async function POST(
  request: Request
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


    let body:
      CreatePosisiBody;


    try {
      body =
        (
          await request.json()
        ) as CreatePosisiBody;
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


    const divisiId =
      body.divisiId?.trim() ??
      "";


    const nama =
      body.nama?.trim() ??
      "";


    const deskripsi =
      cleanNullable(
        body.deskripsi
      );


    const aktif =
      body.aktif ??
      true;


    if (
      !isUuid(
        divisiId
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Divisi wajib dipilih.",
        },
        {
          status:
            400,
        }
      );
    }


    if (
      !nama
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
          divisiId
        )
        .maybeSingle();


    if (
      divisiError
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
            404,
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
          divisiId
        )
        .ilike(
          "nama",
          nama
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


    const {
      data,
      error,
    } =
      await supabase
        .from(
          "master_posisi"
        )
        .insert({
          divisi_id:
            divisiId,

          nama,

          deskripsi,

          aktif,
        })
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
        "CREATE POSISI:",
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
              : "Gagal menambahkan posisi.",
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


    return NextResponse.json(
      {
        success:
          true,

        message:
          "Posisi berhasil ditambahkan.",

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
      },
      {
        status:
          201,
      }
    );

  } catch (
    error
  ) {
    console.error(
      "POST /master-data/posisi:",
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