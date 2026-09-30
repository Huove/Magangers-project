import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


export const dynamic =
  "force-dynamic";


// =====================================================
// BODY
// =====================================================

interface CreateDivisiBody {
  nama?: string;

  deskripsi?:
    | string
    | null;

  aktif?: boolean;
}


// =====================================================
// GET
// AMBIL SEMUA DIVISI
// =====================================================

export async function GET(
  request: Request
) {
  try {
    // ===============================================
    // AUTH ADMIN
    // ===============================================

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


    // ===============================================
    // QUERY PARAMETER
    //
    // ?active=1
    // digunakan nanti untuk dropdown penempatan
    // ===============================================

    const url =
      new URL(
        request.url
      );


    const activeOnly =
      url.searchParams.get(
        "active"
      ) === "1";


    // ===============================================
    // QUERY
    // ===============================================

    let query =
      supabase
        .from(
          "master_divisi"
        )
        .select(`
          id,
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


    if (activeOnly) {
      query =
        query.eq(
          "aktif",
          true
        );
    }


    const {
      data,
      error,
    } =
      await query;


    // ===============================================
    // ERROR
    // ===============================================

    if (error) {
      console.error(
        "GET MASTER DIVISI ERROR:",
        error
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            error.message ||
            "Gagal mengambil master divisi.",
        },
        {
          status:
            500,
        }
      );
    }


    // ===============================================
    // FORMAT
    // ===============================================

    const formatted =
      (
        data ??
        []
      ).map(
        (
          item
        ) => ({
          id:
            item.id,

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
      );


    // ===============================================
    // RESPONSE
    // ===============================================

    return NextResponse.json({
      success:
        true,

      data:
        formatted,
    });

  } catch (error) {
    console.error(
      "GET /api/admin/master-data/divisi ERROR:",
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
// TAMBAH DIVISI
// =====================================================

export async function POST(
  request: Request
) {
  try {
    // ===============================================
    // AUTH ADMIN
    // ===============================================

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


    // ===============================================
    // BODY
    // ===============================================

    let body:
      CreateDivisiBody;


    try {
      body =
        (
          await request.json()
        ) as CreateDivisiBody;

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


    // ===============================================
    // NORMALISASI
    // ===============================================

    const nama =
      body.nama
        ?.trim() ??
      "";


    const deskripsi =
      cleanNullable(
        body.deskripsi
      );


    const aktif =
      body.aktif ??
      true;


    // ===============================================
    // VALIDASI
    // ===============================================

    if (!nama) {
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


    // ===============================================
    // CEK DUPLIKAT
    //
    // supaya:
    // IT Development
    // it development
    //
    // tidak jadi dua data berbeda
    // ===============================================

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
          "id, nama"
        )
        .ilike(
          "nama",
          nama
        )
        .limit(1)
        .maybeSingle();


    if (duplicateError) {
      console.error(
        "CHECK DIVISI DUPLICATE ERROR:",
        duplicateError
      );


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


    if (duplicate) {
      return NextResponse.json(
        {
          success:
            false,

          message:
            "Divisi dengan nama tersebut sudah ada.",
        },
        {
          status:
            409,
        }
      );
    }


    // ===============================================
    // INSERT
    // ===============================================

    const {
      data,
      error,
    } =
      await supabase
        .from(
          "master_divisi"
        )
        .insert({
          nama,

          deskripsi,

          aktif,
        })
        .select(`
          id,
          nama,
          deskripsi,
          aktif,
          created_at,
          updated_at
        `)
        .single();


    // ===============================================
    // INSERT ERROR
    // ===============================================

    if (error) {
      console.error(
        "CREATE MASTER DIVISI ERROR:",
        error
      );


      return NextResponse.json(
        {
          success:
            false,

          message:
            error.code ===
            "23505"
              ? "Divisi tersebut sudah tersedia."
              : (
                  error.message ||
                  "Gagal menambahkan divisi."
                ),
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


    // ===============================================
    // SUCCESS
    // ===============================================

    return NextResponse.json(
      {
        success:
          true,

        message:
          "Divisi berhasil ditambahkan.",

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
      },
      {
        status:
          201,
      }
    );

  } catch (error) {
    console.error(
      "POST /api/admin/master-data/divisi ERROR:",
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