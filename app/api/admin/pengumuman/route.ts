import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


export const dynamic =
  "force-dynamic";


const BUCKET =
  "pengumuman";


const VALID_STATUS = [
  "draft",
  "terjadwal",
  "dipublikasikan",
] as const;


type AnnouncementStatus =
  (typeof VALID_STATUS)[number];


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


    if (!auth.ok) {
      return auth.response;
    }


    const {
      supabase,
    } = auth;


    // =================================================
    // PENGUMUMAN
    // =================================================

    const {
      data,
      error,
    } =
      await supabase
        .from("pengumuman")
        .select(`
          id,
          judul,
          isi,
          target,
          tanggal,
          status,
          dibuat_oleh,
          attachment_name,
          attachment_size,
          attachment_type,
          attachment_path,
          published_at,
          created_at,
          updated_at
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        );


    if (error) {
      console.error(
        "GET pengumuman error:",
        error
      );


      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal mengambil pengumuman",
        },
        {
          status: 500,
        }
      );
    }


    const announcements =
      data ?? [];


    // =================================================
    // AUTHOR
    // =================================================

    const authorIds = [
      ...new Set(
        announcements
          .map(
            (item) =>
              item.dibuat_oleh
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      ),
    ];


    const authorMap =
      new Map<
        string,
        string
      >();


    if (
      authorIds.length > 0
    ) {
      const {
        data: profiles,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select(`
            id,
            nama_lengkap
          `)
          .in(
            "id",
            authorIds
          );


      if (profileError) {
        console.error(
          "Profile author error:",
          profileError
        );
      } else {
        for (
          const profile
          of profiles ?? []
        ) {
          authorMap.set(
            profile.id,
            profile.nama_lengkap ??
            "Admin"
          );
        }
      }
    }


    // =================================================
    // SIGNED URL
    // =================================================

    const result =
      await Promise.all(
        announcements.map(
          async (
            item
          ) => {
            let attachmentUrl:
              | string
              | null =
              null;


            if (
              item.attachment_path
            ) {
              const {
                data:
                  signedData,
                error:
                  signedError,
              } =
                await supabase.storage
                  .from(
                    BUCKET
                  )
                  .createSignedUrl(
                    item
                      .attachment_path,

                    60 * 60
                  );


              if (
                signedError
              ) {
                console.error(
                  "Signed URL error:",
                  signedError
                );
              } else {
                attachmentUrl =
                  signedData
                    .signedUrl;
              }
            }


            return {
              id:
                item.id,

              judul:
                item.judul,

              isi:
                item.isi,

              target:
                item.target,

              tanggal:
                item.tanggal,

              status:
                item.status,

              dibuatOleh:
                item.dibuat_oleh
                  ? authorMap.get(
                      item
                        .dibuat_oleh
                    ) ??
                    "Admin"
                  : "Admin",

              dibuatOlehId:
                item.dibuat_oleh ??
                null,

              createdAt:
                item.created_at,

              updatedAt:
                item.updated_at,

              publishedAt:
                item.published_at ??
                null,

              attachment:
                item
                  .attachment_path
                  ? {
                      name:
                        item
                          .attachment_name ??
                        "Lampiran",

                      size:
                        Number(
                          item
                            .attachment_size
                        ) || 0,

                      type:
                        item
                          .attachment_type ??
                        "",

                      path:
                        item
                          .attachment_path,

                      url:
                        attachmentUrl,
                    }
                  : null,
            };
          }
        )
      );


    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    console.error(
      "GET /api/admin/pengumuman:",
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


    if (!auth.ok) {
      return auth.response;
    }


    const {
      supabase,
      user,
    } = auth;


    const formData =
      await request.formData();


    const judul =
      getString(
        formData,
        "judul"
      );


    const isi =
      getString(
        formData,
        "isi"
      );


    const target =
      getString(
        formData,
        "target"
      ) ||
      "Semua Peserta";


    const tanggal =
      getString(
        formData,
        "tanggal"
      );


    const rawStatus =
      getString(
        formData,
        "status"
      ) ||
      "draft";


    // =================================================
    // VALIDATION
    // =================================================

    if (!judul) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Judul pengumuman wajib diisi",
        },
        {
          status: 400,
        }
      );
    }


    if (!isi) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Isi pengumuman wajib diisi",
        },
        {
          status: 400,
        }
      );
    }


    if (
      !VALID_STATUS.includes(
        rawStatus as
          AnnouncementStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Status pengumuman tidak valid",
        },
        {
          status: 400,
        }
      );
    }


    const status =
      rawStatus as
        AnnouncementStatus;


    const fileValue =
      formData.get(
        "file"
      );


    const file =
      fileValue instanceof File &&
      fileValue.size > 0
        ? fileValue
        : null;


    // =================================================
    // FILE VALIDATION
    // =================================================

    if (
      file &&
      file.size >
        10 * 1024 * 1024
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ukuran lampiran maksimal 10 MB",
        },
        {
          status: 400,
        }
      );
    }


    let uploadedPath:
      | string
      | null =
      null;


    // =================================================
    // UPLOAD FILE
    // =================================================

    if (file) {
      uploadedPath =
        createStoragePath(
          user.id,
          file.name
        );


      const buffer =
        await file
          .arrayBuffer();


      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(BUCKET)
          .upload(
            uploadedPath,
            buffer,
            {
              contentType:
                file.type ||
                "application/octet-stream",

              upsert:
                false,
            }
          );


      if (uploadError) {
        console.error(
          "Upload pengumuman error:",
          uploadError
        );


        return NextResponse.json(
          {
            success: false,
            message:
              "Gagal mengunggah lampiran",
          },
          {
            status: 500,
          }
        );
      }
    }


    // =================================================
    // INSERT DATABASE
    // =================================================

    const payload = {
      judul,

      isi,

      target,

      status,

      dibuat_oleh:
        user.id,

      ...(tanggal
        ? {
            tanggal,
          }
        : {}),

      published_at:
        status ===
          "dipublikasikan"
          ? new Date()
              .toISOString()
          : null,

      attachment_name:
        file?.name ??
        null,

      attachment_size:
        file?.size ??
        null,

      attachment_type:
        file?.type ??
        null,

      attachment_path:
        uploadedPath,
    };


    const {
      data: created,
      error:
        insertError,
    } =
      await supabase
        .from("pengumuman")
        .insert(
          payload
        )
        .select(`
          id,
          judul,
          status,
          tanggal,
          created_at,
          published_at
        `)
        .single();


    if (
      insertError ||
      !created
    ) {
      console.error(
        "Insert pengumuman error:",
        insertError
      );


      // ===============================================
      // CLEANUP FILE KALAU DB GAGAL
      // ===============================================

      if (uploadedPath) {
        await supabase.storage
          .from(BUCKET)
          .remove([
            uploadedPath,
          ]);
      }


      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal menyimpan pengumuman",
        },
        {
          status: 500,
        }
      );
    }


    return NextResponse.json(
      {
        success: true,

        message:
          status ===
          "dipublikasikan"
            ? "Pengumuman berhasil dipublikasikan"
            : status ===
              "terjadwal"
              ? "Pengumuman berhasil dijadwalkan"
              : "Draft pengumuman berhasil disimpan",

        data:
          created,
      },
      {
        status: 201,
      }
    );

  } catch (error) {
    console.error(
      "POST /api/admin/pengumuman:",
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
// HELPERS
// =====================================================

function getString(
  formData: FormData,
  key: string
) {
  const value =
    formData.get(
      key
    );


  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


function createStoragePath(
  userId: string,
  fileName: string
) {
  const safeName =
    fileName
      .normalize("NFKD")
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      )
      .slice(-120);


  return `${userId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
}