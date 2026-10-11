"use client";

import {
  supabase,
} from "@/lib/supabase";


// =====================================================
// PARTICIPANT STATUS
// =====================================================

export type AdminParticipantStatus =
  | "diterima"
  | "aktif"
  | "selesai";


// =====================================================
// ADMIN PARTICIPANT
// =====================================================

export interface AdminParticipant {
  id: string;

  userId: string;

  nomorPeserta: string;

  nama: string;

  email: string;

  nomorHp: string;

  sekolah: string;

  jurusan: string;

  posisi: string;

  divisi: string;

  pembimbing: string;

  pembimbingId: string | null;

  tanggalMulai: string | null;

  tanggalSelesai: string | null;

  status: string;
}


// =====================================================
// UPDATE PARTICIPANT
// =====================================================

export interface UpdateAdminParticipantPayload {
  nama: string;

  sekolah: string;

  status:
    AdminParticipantStatus;

  posisi: string;

  divisi: string;

  pembimbingId:
    string | null;

  tanggalMulai?:
    string;

  tanggalSelesai?:
    string | null;
}


// Compatibility untuk code lama
export type UpdateAdminParticipant =
  UpdateAdminParticipantPayload;


// =====================================================
// MUTATION
// =====================================================

export interface MutateAdminParticipantPayload {
  tanggalMutasi:
    string;

  pembimbingId:
    string | null;

  divisi:
    string | null;

  posisi:
    string | null;

  tanggalSelesai:
    string | null;

  alasan:
    string | null;
}


// =====================================================
// TERMINATION
// =====================================================

export interface TerminateAdminParticipantPayload {
  tanggalBerhenti:
    string;

  alasan:
    string;
}


// =====================================================
// WORK HISTORY PLACEMENT
// =====================================================

export interface WorkHistoryPlacement {
  pembimbingId:
    string | null;

  pembimbingNama:
    string;

  divisi:
    string | null;

  posisi:
    string | null;

  tanggalMulai:
    string | null;

  tanggalSelesaiRencana:
    string | null;
}


// =====================================================
// WORK HISTORY
// =====================================================

export interface AdminParticipantWorkHistory {
  id:
    string;

  pesertaId:
    string;

  jenisEvent:
    | "penempatan_awal"
    | "mutasi"
    | "selesai"
    | "diberhentikan"
    | string;

  tanggalEvent:
    string;

  dari:
    WorkHistoryPlacement;

  ke:
    WorkHistoryPlacement;

  alasan:
    string | null;

  dibuatOleh:
    string | null;

  createdAt:
    string;
}


// =====================================================
// WORK HISTORY PARTICIPANT
// =====================================================

export interface WorkHistoryParticipant {
  id:
    string;

  nomorPeserta:
    string | null;

  status:
    string;
}


// =====================================================
// RESPONSES
// =====================================================

interface AdminParticipantListResponse {
  success:
    boolean;

  message?:
    string;

  data?:
    AdminParticipant[];
}


interface AdminParticipantUpdateResponse {
  success:
    boolean;

  message?:
    string;

  data?:
    unknown;
}


interface MutationResponse {
  success:
    boolean;

  message?:
    string;

  data?: {
    historyId:
      string;
  };
}


interface TerminationResponse {
  success:
    boolean;

  message?:
    string;

  data?: {
    historyId:
      string;
  };
}


interface WorkHistoryResponse {
  success:
    boolean;

  message?:
    string;

  data?: {
    participant:
      WorkHistoryParticipant;

    history:
      AdminParticipantWorkHistory[];
  };
}


// =====================================================
// GET ACCESS TOKEN
// =====================================================

async function getAccessToken() {
  const {
    data,
    error,
  } =
    await supabase.auth
      .getSession();


  if (error) {
    throw new Error(
      error.message ||
      "Gagal membaca session admin."
    );
  }


  const token =
    data.session
      ?.access_token;


  if (!token) {
    throw new Error(
      "Session admin tidak ditemukan. Silakan login kembali."
    );
  }


  return token;
}


// =====================================================
// ERROR RESPONSE
// =====================================================

async function getErrorMessage(
  response:
    Response,

  fallback:
    string
) {
  try {
    const body =
      await response.json() as {
        message?:
          string;
      };


    return (
      body.message ||
      fallback
    );

  } catch {
    return fallback;
  }
}


// =====================================================
// VALIDATE ID
// =====================================================

function validateParticipantId(
  id:
    string
) {
  if (
    !id ||
    id === "undefined" ||
    id === "null"
  ) {
    throw new Error(
      "ID peserta tidak valid."
    );
  }
}


// =====================================================
// DATE
// =====================================================

function isDateValue(
  value:
    string
) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    value
  );
}


// =====================================================
// NULLABLE
// =====================================================

function cleanNullable(
  value:
    string |
    null |
    undefined
):
string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }


  const result =
    value.trim();


  return (
    result ||
    null
  );
}


// =====================================================
// GET PARTICIPANTS
// =====================================================

export async function getAdminParticipants():
Promise<AdminParticipant[]> {
  const token =
    await getAccessToken();


  const response =
    await fetch(
      "/api/admin/peserta",
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,

          Accept:
            "application/json",
        },

        cache:
          "no-store",
      }
    );


  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Gagal mengambil data peserta."
      )
    );
  }


  const result =
    await response.json() as
      AdminParticipantListResponse;


  if (!result.success) {
    throw new Error(
      result.message ||
      "Gagal mengambil data peserta."
    );
  }


  return Array.isArray(
    result.data
  )
    ? result.data
    : [];
}


// =====================================================
// UPDATE PARTICIPANT
// =====================================================

export async function updateAdminParticipant(
  id:
    string,

  payload:
    UpdateAdminParticipantPayload
) {
  validateParticipantId(
    id
  );


  const nama =
    payload.nama.trim();


  if (!nama) {
    throw new Error(
      "Nama peserta wajib diisi."
    );
  }


  if (
    payload.tanggalMulai &&
    payload.tanggalSelesai &&
    payload.tanggalSelesai <
      payload.tanggalMulai
  ) {
    throw new Error(
      "Tanggal selesai tidak boleh sebelum tanggal mulai."
    );
  }


  const token =
    await getAccessToken();


  const response =
    await fetch(
      `/api/admin/peserta/${id}`,
      {
        method:
          "PUT",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body:
          JSON.stringify({
            ...payload,

            nama,

            sekolah:
              payload.sekolah.trim(),

            posisi:
              payload.posisi.trim(),

            divisi:
              payload.divisi.trim(),

            pembimbingId:
              payload.pembimbingId ||
              null,

            tanggalSelesai:
              payload.tanggalSelesai ||
              null,
          }),
      }
    );


  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Gagal memperbarui peserta."
      )
    );
  }


  const result =
    await response.json() as
      AdminParticipantUpdateResponse;


  if (!result.success) {
    throw new Error(
      result.message ||
      "Gagal memperbarui peserta."
    );
  }


  return result;
}


// =====================================================
// MUTATE PARTICIPANT
// =====================================================

export async function mutateAdminParticipant(
  id:
    string,

  payload:
    MutateAdminParticipantPayload
) {
  validateParticipantId(
    id
  );


  const tanggalMutasi =
    payload.tanggalMutasi
      .trim();


  if (!tanggalMutasi) {
    throw new Error(
      "Tanggal mutasi wajib diisi."
    );
  }


  if (
    !isDateValue(
      tanggalMutasi
    )
  ) {
    throw new Error(
      "Tanggal mutasi tidak valid."
    );
  }


  const tanggalSelesai =
    cleanNullable(
      payload.tanggalSelesai
    );


  if (
    tanggalSelesai &&
    tanggalSelesai <
      tanggalMutasi
  ) {
    throw new Error(
      "Tanggal selesai tidak boleh sebelum tanggal mutasi."
    );
  }


  const token =
    await getAccessToken();


  const response =
    await fetch(
      `/api/admin/peserta/${id}/mutasi`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body:
          JSON.stringify({
            tanggalMutasi,

            pembimbingId:
              cleanNullable(
                payload.pembimbingId
              ),

            divisi:
              cleanNullable(
                payload.divisi
              ),

            posisi:
              cleanNullable(
                payload.posisi
              ),

            tanggalSelesai,

            alasan:
              cleanNullable(
                payload.alasan
              ),
          }),
      }
    );


  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Gagal melakukan mutasi peserta."
      )
    );
  }


  const result =
    await response.json() as
      MutationResponse;


  if (!result.success) {
    throw new Error(
      result.message ||
      "Gagal melakukan mutasi peserta."
    );
  }


  return result;
}


// =====================================================
// TERMINATE PARTICIPANT
// =====================================================

export async function terminateAdminParticipant(
  id:
    string,

  payload:
    TerminateAdminParticipantPayload
) {
  validateParticipantId(
    id
  );


  const tanggalBerhenti =
    payload.tanggalBerhenti
      .trim();


  const alasan =
    payload.alasan
      .trim();


  if (!tanggalBerhenti) {
    throw new Error(
      "Tanggal pemberhentian wajib diisi."
    );
  }


  if (
    !isDateValue(
      tanggalBerhenti
    )
  ) {
    throw new Error(
      "Tanggal pemberhentian tidak valid."
    );
  }


  if (!alasan) {
    throw new Error(
      "Alasan pemberhentian wajib diisi."
    );
  }


  if (
    alasan.length <
    5
  ) {
    throw new Error(
      "Alasan pemberhentian terlalu singkat."
    );
  }


  const token =
    await getAccessToken();


  const response =
    await fetch(
      `/api/admin/peserta/${id}/berhentikan`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body:
          JSON.stringify({
            tanggalBerhenti,
            alasan,
          }),
      }
    );


  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Gagal memberhentikan peserta."
      )
    );
  }


  const result =
    await response.json() as
      TerminationResponse;


  if (!result.success) {
    throw new Error(
      result.message ||
      "Gagal memberhentikan peserta."
    );
  }


  return result;
}


// =====================================================
// GET WORK HISTORY
// =====================================================

export async function getAdminParticipantWorkHistory(
  id:
    string
):
Promise<AdminParticipantWorkHistory[]> {
  validateParticipantId(
    id
  );


  const token =
    await getAccessToken();


  const response =
    await fetch(
      `/api/admin/peserta/${id}/riwayat`,
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,

          Accept:
            "application/json",
        },

        cache:
          "no-store",
      }
    );


  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Gagal mengambil riwayat kerja."
      )
    );
  }


  const result =
    await response.json() as
      WorkHistoryResponse;


  if (!result.success) {
    throw new Error(
      result.message ||
      "Gagal mengambil riwayat kerja."
    );
  }


  return Array.isArray(
    result.data?.history
  )
    ? result.data.history
    : [];
}


// =====================================================
// GET FULL WORK HISTORY
// =====================================================

export async function getAdminParticipantWorkHistoryDetail(
  id:
    string
):
Promise<{
  participant:
    WorkHistoryParticipant | null;

  history:
    AdminParticipantWorkHistory[];
}> {
  validateParticipantId(
    id
  );


  const token =
    await getAccessToken();


  const response =
    await fetch(
      `/api/admin/peserta/${id}/riwayat`,
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,

          Accept:
            "application/json",
        },

        cache:
          "no-store",
      }
    );


  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Gagal mengambil riwayat kerja."
      )
    );
  }


  const result =
    await response.json() as
      WorkHistoryResponse;


  if (!result.success) {
    throw new Error(
      result.message ||
      "Gagal mengambil riwayat kerja."
    );
  }


  return {
    participant:
      result.data
        ?.participant ??
      null,

    history:
      Array.isArray(
        result.data?.history
      )
        ? result.data!.history
        : [],
  };
}