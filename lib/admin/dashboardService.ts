"use client";

import {
  adminApi,
} from "./adminApi";

export interface AdminDashboardSummary {
  total_peserta: number;

  peserta_diterima: number;
  peserta_aktif: number;
  peserta_selesai: number;

  total_laporan: number;

  laporan_menunggu: number;
  laporan_direvisi: number;
  laporan_disetujui: number;
  laporan_ditolak: number;

  total_pengumuman: number;

  pengumuman_draft: number;
  pengumuman_terjadwal: number;
  pengumuman_dipublikasikan: number;

  total_notifikasi: number;
  notifikasi_belum_dibaca: number;

  total_penempatan: number;
  peserta_dengan_pembimbing: number;
}

interface DashboardResponse {
  success: boolean;
  data: AdminDashboardSummary;
}

export async function
getAdminDashboardSummary() {
  const response =
    await adminApi<DashboardResponse>(
      "/api/admin/dashboard"
    );

  return response.data;
}