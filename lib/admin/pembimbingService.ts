"use client";

import {
  adminApi,
} from "./adminApi";


// =====================================================
// PARTICIPANT
// =====================================================

export interface SupervisorParticipant {
  pesertaId:
    string;

  nama:
    string;

  nomorPeserta:
    string;

  status:
    string;

  posisi:
    string;

  divisi:
    string;

  tanggalMulai:
    string;

  tanggalSelesai:
    string | null;
}


// =====================================================
// PEMBIMBING
// =====================================================

export interface AdminSupervisor {
  // pembimbing.id
  id:
    string;


  // profiles.id / auth.users.id
  userId:
    string;


  // PROFILE
  nama:
    string;

  email:
    string;

  nomorHp:
    string;

  fotoUrl:
    string | null;


  // PEMBIMBING
  nip:
    string;

  divisi:
    string;


  // SUMMARY
  totalPeserta:
    number;

  pesertaAktif:
    number;


  // PESERTA BIMBINGAN
  participants:
    SupervisorParticipant[];


  // DATABASE
  createdAt:
    string;
}


// =====================================================
// UPDATE PAYLOAD
// =====================================================

export interface UpdateAdminSupervisorPayload {
  nama:
    string;

  nip:
    string | null;

  divisi:
    string | null;

  nomorHp:
    string | null;
}


// =====================================================
// UPDATE RESULT
// =====================================================

export interface UpdatedAdminSupervisor {
  id:
    string;

  userId:
    string;

  nama:
    string;

  email:
    string;

  nomorHp:
    string;

  fotoUrl:
    string | null;

  nip:
    string;

  divisi:
    string;

  createdAt:
    string;
}


// =====================================================
// GET RESPONSE
// =====================================================

interface SupervisorResponse {
  success:
    boolean;

  data:
    AdminSupervisor[];

  message?:
    string;
}


// =====================================================
// UPDATE RESPONSE
// =====================================================

interface UpdateSupervisorResponse {
  success:
    boolean;

  message:
    string;

  data?:
    UpdatedAdminSupervisor;
}


// =====================================================
// GET ALL PEMBIMBING
// =====================================================

export async function getAdminSupervisors():
Promise<AdminSupervisor[]> {
  // ===================================================
  // REQUEST
  // ===================================================

  const response =
    await adminApi<
      SupervisorResponse
    >(
      "/api/admin/pembimbing"
    );


  // ===================================================
  // VALIDATION
  // ===================================================

  if (
    !response.success
  ) {
    throw new Error(
      response.message ||
      "Gagal mengambil data pembimbing."
    );
  }


  // ===================================================
  // FALLBACK
  // ===================================================

  if (
    !Array.isArray(
      response.data
    )
  ) {
    return [];
  }


  return response.data;
}


// =====================================================
// UPDATE PEMBIMBING
// =====================================================

export async function updateAdminSupervisor(
  id:
    string,

  payload:
    UpdateAdminSupervisorPayload
):
Promise<UpdateSupervisorResponse> {
  // ===================================================
  // VALIDATE ID
  // ===================================================

  if (
    !id ||
    id ===
      "undefined" ||
    id ===
      "null"
  ) {
    throw new Error(
      "ID pembimbing tidak valid."
    );
  }


  // ===================================================
  // VALIDATE NAME
  // ===================================================

  const nama =
    payload.nama.trim();


  if (!nama) {
    throw new Error(
      "Nama pembimbing wajib diisi."
    );
  }


  // ===================================================
  // NORMALIZE PAYLOAD
  // ===================================================

  const normalizedPayload:
    UpdateAdminSupervisorPayload = {
      nama,

      nip:
        cleanNullable(
          payload.nip
        ),

      divisi:
        cleanNullable(
          payload.divisi
        ),

      nomorHp:
        cleanNullable(
          payload.nomorHp
        ),
    };


  // ===================================================
  // REQUEST
  // ===================================================

  const response =
    await adminApi<
      UpdateSupervisorResponse
    >(
      `/api/admin/pembimbing/${id}`,
      {
        method:
          "PUT",

        body:
          JSON.stringify(
            normalizedPayload
          ),
      }
    );


  // ===================================================
  // VALIDATION
  // ===================================================

  if (
    !response.success
  ) {
    throw new Error(
      response.message ||
      "Gagal memperbarui pembimbing."
    );
  }


  return response;
}


// =====================================================
// GET ONE PEMBIMBING DARI DATA YANG SUDAH ADA
//
// Tidak melakukan request API baru.
// Berguna jika page sudah memiliki array supervisor.
// =====================================================

export function findAdminSupervisor(
  supervisors:
    AdminSupervisor[],

  id:
    string
):
AdminSupervisor | null {
  if (!id) {
    return null;
  }


  return (
    supervisors.find(
      (
        supervisor
      ) =>
        supervisor.id ===
        id
    ) ??
    null
  );
}


// =====================================================
// GET ACTIVE PARTICIPANTS
// =====================================================

export function getActiveSupervisorParticipants(
  supervisor:
    AdminSupervisor
):
SupervisorParticipant[] {
  return supervisor
    .participants
    .filter(
      (
        participant
      ) =>
        participant.status ===
        "aktif"
    );
}


// =====================================================
// GET INACTIVE PARTICIPANTS
// =====================================================

export function getInactiveSupervisorParticipants(
  supervisor:
    AdminSupervisor
):
SupervisorParticipant[] {
  return supervisor
    .participants
    .filter(
      (
        participant
      ) =>
        participant.status !==
        "aktif"
    );
}


// =====================================================
// HAS PARTICIPANTS
// =====================================================

export function hasSupervisorParticipants(
  supervisor:
    AdminSupervisor
) {
  return (
    supervisor.totalPeserta >
    0
  );
}


// =====================================================
// CLEAN NULLABLE
// =====================================================

function cleanNullable(
  value:
    string | null | undefined
):
string | null {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return null;
  }


  const result =
    value.trim();


  if (
    !result ||
    result ===
      "-"
  ) {
    return null;
  }


  return result;
}