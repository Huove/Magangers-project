import {
  NextResponse,
} from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


const BUCKET =
  "pengumuman";


const VALID_STATUS = [
  "draft",
  "terjadwal",
  "dipublikasikan",
] as const;


type AnnouncementStatus =
  (typeof VALID_STATUS)[number];


interface RouteContext {
  params: Promise<{
    id: string;
  }>;
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


    if (!auth.ok) {
      return auth.response;
    }


    const {
      supabase,
      user,
    } = auth;


    const { id } =
      await context.params;


    const formData =
      await request.formData();


    // =================================================
    // CURRENT
    // =================================================

    const {
      data: current,
      error: currentError,
    } =
      await supabase
        .from("pengumuman")
        .select(`
          id,
          attachment_path,
          attachment_name,
          attachment_size,
          attachment_type,
          status,
          published_at
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
      return NextResponse.json(
        {
          success: false,
          message:
            "Pengumuman tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }


    // =================================================
    // VALUES
    // =================================================

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
      current.status;


    if (
      !judul ||
      !isi
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Judul dan isi pengumuman wajib diisi",
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


    const removeAttachment =
      getString(
        formData,
        "removeAttachment"
      ) === "true";


    const fileValue =
      formData.get(
        "file"
      );


    const newFile =
      fileValue instanceof File &&
      fileValue.size > 0
        ? fileValue
        : null;


    if (
      newFile &&
      newFile.size >
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


    // =================================================
    // ATTACHMENT DEFAULT = FILE LAMA
    // =================================================

    let attachmentPath =
      current
        .attachment_path;


    let attachmentName =
      current
        .attachment_name;


    let attachmentSize =
      current
        .attachment_size;


    let attachmentType =
      current
        .attachment_type;


    let uploadedPath:
      | string
      | null =
      null;


    // =================================================
    // UPLOAD FILE BARU
    // =================================================

    if (newFile) {
      uploadedPath =
        createStoragePath(
          user.id,
          newFile.name
        );


      const buffer =
        await newFile
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
                newFile.type ||
                "application/octet-stream",

              upsert:
                false,
            }
          );


      if (uploadError) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Gagal mengunggah lampiran baru",
          },
          {
            status: 500,
          }
        );
      }


      attachmentPath =
        uploadedPath;

      attachmentName =
        newFile.name;

      attachmentSize =
        newFile.size;

      attachmentType =
        newFile.type;
    }


    // =================================================
    // HAPUS ATTACHMENT
    // =================================================

    if (
      removeAttachment &&
      !newFile
    ) {
      attachmentPath =
        null;

      attachmentName =
        null;

      attachmentSize =
        null;

      attachmentType =
        null;
    }


    // =================================================
    // PUBLISHED AT
    // =================================================

    let publishedAt =
      current.published_at;


    if (
      status ===
        "dipublikasikan" &&
      current.status !==
        "dipublikasikan"
    ) {
      publishedAt =
        new Date()
          .toISOString();
    }


    if (
      status !==
      "dipublikasikan"
    ) {
      publishedAt =
        null;
    }


    // =================================================
    // UPDATE DATABASE
    // =================================================

    const {
      data: updated,
      error: updateError,
    } =
      await supabase
        .from("pengumuman")
        .update({
          judul,

          isi,

          target,

          ...(tanggal
            ? {
                tanggal,
              }
            : {}),

          status,

          published_at:
            publishedAt,

          attachment_name:
            attachmentName,

          attachment_size:
            attachmentSize,

          attachment_type:
            attachmentType,

          attachment_path:
            attachmentPath,
        })
        .eq(
          "id",
          id
        )
        .select(`
          id,
          judul,
          status,
          tanggal,
          published_at,
          updated_at
        `)
        .single();


    if (
      updateError ||
      !updated
    ) {
      console.error(
        "Update pengumuman error:",
        updateError
      );


      // File baru belum dipakai,
      // hapus supaya tidak orphan.
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
            "Gagal memperbarui pengumuman",
        },
        {
          status: 500,
        }
      );
    }


    const warnings:
      string[] =
      [];


    // =================================================
    // HAPUS FILE LAMA SETELAH UPDATE DB SUKSES
    // =================================================

    const shouldDeleteOld =
      current
        .attachment_path &&
      (
        Boolean(newFile) ||
        removeAttachment
      ) &&
      current
        .attachment_path !==
        attachmentPath;


    if (shouldDeleteOld) {
      const {
        error:
          deleteOldError,
      } =
        await supabase.storage
          .from(BUCKET)
          .remove([
            current
              .attachment_path,
          ]);


      if (deleteOldError) {
        console.error(
          "Delete old file error:",
          deleteOldError
        );


        warnings.push(
          "File lama gagal dibersihkan dari Storage"
        );
      }
    }


    return NextResponse.json({
      success: true,

      message:
        "Pengumuman berhasil diperbarui",

      data:
        updated,

      warnings,
    });

  } catch (error) {
    console.error(
      "PUT /api/admin/pengumuman/[id]:",
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


    if (!auth.ok) {
      return auth.response;
    }


    const {
      supabase,
    } = auth;


    const { id } =
      await context.params;


    // =================================================
    // CURRENT
    // =================================================

    const {
      data: current,
      error: currentError,
    } =
      await supabase
        .from("pengumuman")
        .select(`
          id,
          attachment_path
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
      return NextResponse.json(
        {
          success: false,
          message:
            "Pengumuman tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }


    // =================================================
    // DELETE DATABASE
    // =================================================

    const {
      error: deleteError,
    } =
      await supabase
        .from("pengumuman")
        .delete()
        .eq(
          "id",
          id
        );


    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal menghapus pengumuman",
        },
        {
          status: 500,
        }
      );
    }


    const warnings:
      string[] =
      [];


    // =================================================
    // DELETE STORAGE
    // =================================================

    if (
      current
        .attachment_path
    ) {
      const {
        error:
          storageError,
      } =
        await supabase.storage
          .from(BUCKET)
          .remove([
            current
              .attachment_path,
          ]);


      if (storageError) {
        console.error(
          "Delete storage error:",
          storageError
        );


        warnings.push(
          "Pengumuman terhapus tetapi lampiran gagal dibersihkan"
        );
      }
    }


    return NextResponse.json({
      success: true,

      message:
        "Pengumuman berhasil dihapus",

      warnings,
    });

  } catch (error) {
    console.error(
      "DELETE /api/admin/pengumuman/[id]:",
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