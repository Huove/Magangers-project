"use client";

import {
  supabase,
} from "@/lib/supabase";


// =====================================================
// REQUIREMENTS
// =====================================================

export interface AdminCertificateRequirements {
  magangSelesai:
    boolean;

  semuaTugasSelesai:
    boolean;

  laporanAkhirDisetujui:
    boolean;

  penilaianSelesai:
    boolean;
}


// =====================================================
// CERTIFICATE
// =====================================================

export interface AdminCertificate {
  id:
    string;

  nomorSertifikat:
    string | null;

  fileUrl:
    string | null;

  tanggalTerbit:
    string | null;

  createdAt:
    string;
}


// =====================================================
// PARTICIPANT
// =====================================================

export interface AdminCertificateParticipant {
  id:
    string;

  userId:
    string;

  nomorPeserta:
    string;

  nama:
    string;

  email:
    string;

  status:
    string;

  tanggalMulai:
    string | null;

  tanggalSelesai:
    string | null;

  totalTugas:
    number;

  tugasSelesai:
    number;

  nilaiAkhir:
    number | null;

  requirements:
    AdminCertificateRequirements;

  completedRequirements:
    number;

  totalRequirements:
    number;

  eligible:
    boolean;

  certificate:
    AdminCertificate | null;
}


// =====================================================
// SAVE PAYLOAD
// =====================================================

export interface SaveAdminCertificatePayload {
  pesertaId:
    string;

  nomorSertifikat:
    string;

  tanggalTerbit:
    string;

  fileUrl?:
    string | null;
}


// =====================================================
// RESPONSE
// =====================================================

interface ListResponse {
  success:
    boolean;

  message?:
    string;

  data?:
    AdminCertificateParticipant[];
}


interface SaveResponse {
  success:
    boolean;

  message?:
    string;

  data?: {
    certificate:
      unknown;

    nilaiAkhir:
      number | null;
  };
}


// =====================================================
// TOKEN
// =====================================================

async function getAccessToken() {
  const {
    data,
    error,
  } =
    await supabase.auth
      .getSession();


  if (
    error
  ) {
    throw new Error(
      error.message ||
      "Gagal membaca session admin."
    );
  }


  const token =
    data.session
      ?.access_token;


  if (
    !token
  ) {
    throw new Error(
      "Session admin tidak ditemukan. Silakan login kembali."
    );
  }


  return token;
}


// =====================================================
// RESPONSE ERROR
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
// GET CERTIFICATE PARTICIPANTS
// =====================================================

export async function getAdminCertificateParticipants():
Promise<AdminCertificateParticipant[]> {
  const token =
    await getAccessToken();


  const response =
    await fetch(
      "/api/admin/sertifikat",
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


  if (
    !response.ok
  ) {
    throw new Error(
      await getErrorMessage(
        response,
        "Gagal mengambil data sertifikat."
      )
    );
  }


  const result =
    await response.json() as
      ListResponse;


  if (
    !result.success
  ) {
    throw new Error(
      result.message ||
      "Gagal mengambil data sertifikat."
    );
  }


  return Array.isArray(
    result.data
  )
    ? result.data
    : [];
}


// =====================================================
// SAVE / ISSUE CERTIFICATE
// =====================================================

export async function saveAdminCertificate(
  payload:
    SaveAdminCertificatePayload
):
Promise<SaveResponse> {
  const pesertaId =
    payload.pesertaId
      .trim();


  const nomorSertifikat =
    payload.nomorSertifikat
      .trim();


  const tanggalTerbit =
    payload.tanggalTerbit
      .trim();


  if (
    !pesertaId
  ) {
    throw new Error(
      "ID peserta tidak valid."
    );
  }


  if (
    !nomorSertifikat
  ) {
    throw new Error(
      "Nomor sertifikat wajib diisi."
    );
  }


  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      tanggalTerbit
    )
  ) {
    throw new Error(
      "Tanggal terbit tidak valid."
    );
  }


  const token =
    await getAccessToken();


  const response =
    await fetch(
      "/api/admin/sertifikat",
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
            pesertaId,

            nomorSertifikat,

            tanggalTerbit,

            fileUrl:
              payload.fileUrl
                ?.trim() ||
              null,
          }),
      }
    );


  if (
    !response.ok
  ) {
    throw new Error(
      await getErrorMessage(
        response,
        "Gagal menyimpan sertifikat."
      )
    );
  }


  const result =
    await response.json() as
      SaveResponse;


  if (
    !result.success
  ) {
    throw new Error(
      result.message ||
      "Gagal menyimpan sertifikat."
    );
  }


  return result;
}