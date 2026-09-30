"use client";

import { adminApi } from "./adminApi";


// =====================================================
// SUMMARY TYPES
// =====================================================

export interface ParticipantCompletenessSummary {
  total_peserta: number;
  data_lengkap: number;
  data_belum_lengkap: number;
  tanpa_penempatan: number;
  tanpa_pembimbing: number;
  tanpa_periode: number;
}

export interface ParticipantConsistencySummary {
  total_peserta: number;
  data_konsisten: number;
  data_bermasalah: number;
  periode_belum_sinkron: number;
  periode_tidak_sama: number;
  aktif_tanpa_periode: number;
  status_tidak_sesuai_periode: number;
}


// =====================================================
// DETAIL TYPES
// =====================================================

export interface ParticipantCompletenessDetail {
  peserta_id: string;
  nama_lengkap: string;
  status: string;

  punya_penempatan: boolean;
  punya_pembimbing: boolean;
  punya_posisi: boolean;
  punya_divisi: boolean;
  punya_tanggal_mulai: boolean;
  punya_tanggal_selesai: boolean;

  lengkap: boolean;
  jumlah_masalah: number;

  masalah: string[];
}

export interface ParticipantConsistencyDetail {
  peserta_id: string;
  nama_lengkap: string;
  status: string;

  penempatan_id: string | null;

  peserta_mulai: string | null;
  peserta_selesai: string | null;

  penempatan_mulai: string | null;
  penempatan_selesai: string | null;

  konsisten: boolean;
  jumlah_masalah: number;

  kode_masalah: string[];
  masalah: string[];
}


// =====================================================
// MAIN RESPONSE TYPE
// =====================================================

export interface AdminHealthData {
  completeness: ParticipantCompletenessSummary;

  consistency: ParticipantConsistencySummary;

  detail?: {
    completeness: ParticipantCompletenessDetail[];
    consistency: ParticipantConsistencyDetail[];
  };
}

interface AdminHealthResponse {
  success: boolean;
  data: AdminHealthData;
}


// =====================================================
// GET HEALTH SUMMARY
// =====================================================

export async function getAdminHealthSummary(): Promise<AdminHealthData> {
  const response =
    await adminApi<AdminHealthResponse>(
      "/api/admin/health"
    );

  return response.data;
}


// =====================================================
// GET HEALTH DETAIL
// =====================================================

export async function getAdminHealthDetail(): Promise<AdminHealthData> {
  const response =
    await adminApi<AdminHealthResponse>(
      "/api/admin/health?detail=true"
    );

  return response.data;
}