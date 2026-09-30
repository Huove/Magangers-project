"use client";

import {
  adminApi,
} from "./adminApi";


export type AdminReportStatus =
  | "menunggu"
  | "direvisi"
  | "disetujui"
  | "ditolak";


export interface AdminReport {
  id: string;

  pesertaId: string;

  peserta: string;

  pembimbingId:
    | string
    | null;

  pembimbing: string;

  judul: string;

  tipe: string;

  periode: string;

  deskripsi: string;

  status:
    AdminReportStatus;

  catatan: string;

  fileUrl:
    | string
    | null;

  fileName:
    | string
    | null;

  createdAt: string;

  ditinjauAt:
    | string
    | null;

  ditinjauOleh:
    | string
    | null;
}


interface ReportsResponse {
  success: boolean;

  data:
    AdminReport[];
}


interface UpdateReportResponse {
  success: boolean;

  message: string;

  data?: {
    id: string;
    peserta_id: string;
    judul: string;
    status: AdminReportStatus;
    catatan_admin:
      | string
      | null;
    ditinjau_oleh:
      | string
      | null;
    ditinjau_at:
      | string
      | null;
  };

  warnings?: string[];
}


// =====================================================
// GET REPORTS
// =====================================================

export async function getAdminReports():
Promise<AdminReport[]> {
  const response =
    await adminApi<
      ReportsResponse
    >(
      "/api/admin/laporan"
    );

  return response.data;
}


// =====================================================
// UPDATE REPORT
// =====================================================

export async function updateAdminReport(
  id: string,
  data: {
    status: AdminReportStatus;
    catatan?: string;
  }
) {
  const response =
    await adminApi<
      UpdateReportResponse
    >(
      `/api/admin/laporan/${id}`,
      {
        method: "PUT",

        body:
          JSON.stringify(
            data
          ),
      }
    );

  return response;
}