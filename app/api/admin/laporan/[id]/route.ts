import { NextResponse } from "next/server";

import {
  requireAdmin,
} from "@/lib/admin/requireAdmin";


type ReportStatus =
  | "menunggu"
  | "direvisi"
  | "disetujui"
  | "ditolak";


interface UpdateReportBody {
  status: ReportStatus;
  catatan?: string;
}


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
    // =================================================
    // AUTH ADMIN
    // =================================================

    const auth =
      await requireAdmin(request);

    if (!auth.ok) {
      return auth.response;
    }

    const {
      supabase,
      user,
    } = auth;


    const { id } =
      await context.params;


    const body =
      (
        await request.json()
      ) as UpdateReportBody;


    // =================================================
    // VALIDATION
    // =================================================

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ID laporan tidak valid",
        },
        {
          status: 400,
        }
      );
    }


    const allowedStatus:
      ReportStatus[] = [
        "menunggu",
        "direvisi",
        "disetujui",
        "ditolak",
      ];


    if (
      !body.status ||
      !allowedStatus.includes(
        body.status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Status laporan tidak valid",
        },
        {
          status: 400,
        }
      );
    }


    const catatan =
      body.catatan?.trim() ??
      "";


    if (
      body.status ===
        "direvisi" &&
      !catatan
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Catatan revisi wajib diisi",
        },
        {
          status: 400,
        }
      );
    }


    // =================================================
    // CURRENT REPORT
    // =================================================

    const {
      data: current,
      error: currentError,
    } = await supabase
      .from("laporan")
      .select(`
        id,
        peserta_id,
        judul,
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
      return NextResponse.json(
        {
          success: false,
          message:
            "Laporan tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }


    const oldStatus =
      current.status;


    const reviewedAt =
      new Date()
        .toISOString();


    // =================================================
    // UPDATE REPORT
    // =================================================

    const {
      data: updated,
      error: updateError,
    } = await supabase
      .from("laporan")
      .update({
        status:
          body.status,

        catatan_admin:
          catatan || null,

        ditinjau_oleh:
          user.id,

        ditinjau_at:
          reviewedAt,
      })
      .eq(
        "id",
        id
      )
      .select(`
        id,
        peserta_id,
        judul,
        status,
        catatan_admin,
        ditinjau_oleh,
        ditinjau_at
      `)
      .single();


    if (
      updateError ||
      !updated
    ) {
      console.error(
        "Update laporan error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Gagal memperbarui laporan",
        },
        {
          status: 500,
        }
      );
    }


    // =================================================
    // WARNING NON-CRITICAL
    // =================================================

    const warnings: string[] =
      [];


    // =================================================
    // STATUS HISTORY
    // =================================================

    if (
      oldStatus !==
      body.status
    ) {
      const {
        error: historyError,
      } = await supabase
        .from("status_history")
        .insert({
          peserta_id:
            current.peserta_id,

          entity:
            "laporan",

          entity_id:
            current.id,

          from_status:
            oldStatus,

          to_status:
            body.status,

          note:
            catatan ||
            `Status laporan diubah menjadi ${body.status}.`,

          changed_by:
            user.id,
        });


      if (historyError) {
        console.error(
          "Report status history error:",
          historyError
        );

        warnings.push(
          "Status history gagal dicatat"
        );
      }
    }


    // =================================================
    // NOTIFIKASI PESERTA
    // Query 6
    // =================================================

    if (
      oldStatus !==
      body.status
    ) {
      const notification =
        buildReportNotification(
          current.judul ??
          "Laporan",

          body.status,

          catatan
        );


      const {
        error:
          notificationError,
      } = await supabase.rpc(
        "admin_kirim_notifikasi_peserta",
        {
          target_peserta_id:
            current.peserta_id,

          target_judul:
            notification.title,

          target_pesan:
            notification.message,
        }
      );


      if (notificationError) {
        console.error(
          "Report notification error:",
          notificationError
        );

        warnings.push(
          "Notifikasi peserta gagal dikirim"
        );
      }
    }


    // =================================================
    // RESULT
    // =================================================

    return NextResponse.json({
      success: true,

      message:
        "Laporan berhasil diperbarui",

      data: updated,

      warnings,
    });

  } catch (error) {
    console.error(
      "PUT /api/admin/laporan/[id]:",
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
// NOTIFICATION
// =====================================================

function buildReportNotification(
  title: string,
  status: ReportStatus,
  note: string
) {
  switch (status) {
    case "disetujui":
      return {
        title:
          "Laporan Disetujui",

        message:
          `Laporan "${title}" telah disetujui oleh Admin.`,
      };


    case "direvisi":
      return {
        title:
          "Laporan Perlu Direvisi",

        message:
          note
            ? `Laporan "${title}" perlu direvisi. Catatan: ${note}`
            : `Laporan "${title}" perlu direvisi.`,
      };


    case "ditolak":
      return {
        title:
          "Laporan Ditolak",

        message:
          note
            ? `Laporan "${title}" ditolak. Catatan: ${note}`
            : `Laporan "${title}" ditolak.`,
      };


    default:
      return {
        title:
          "Status Laporan Diperbarui",

        message:
          `Status laporan "${title}" dikembalikan menjadi menunggu.`,
      };
  }
}