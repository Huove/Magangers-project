"use client";

import {
  supabase,
} from "@/lib/supabase";


export interface ReactivateAdminParticipantPayload {
  tanggalMulai:
    string;

  pembimbingId:
    string;

  divisi:
    string;

  posisi:
    string;

  tanggalSelesai:
    string | null;

  alasan:
    string;
}


interface ReactivationApiResponse {
  success?:
    boolean;

  message?:
    string;

  data?: {
    historyId?:
      string | null;
  } | null;
}


// =====================================================
// ACCESS TOKEN
// =====================================================

async function getAccessToken() {
  const {
    data: {
      session,
    },

    error,
  } =
    await supabase.auth
      .getSession();


  if (
    error
  ) {
    throw error;
  }


  const token =
    session?.access_token;


  if (
    !token
  ) {
    throw new Error(
      "Sesi admin tidak ditemukan. Silakan login kembali."
    );
  }


  return token;
}


// =====================================================
// REACTIVATE PARTICIPANT
// =====================================================

export async function reactivateAdminParticipant(
  pesertaId:
    string,

  payload:
    ReactivateAdminParticipantPayload
) {
  const token =
    await getAccessToken();


  const response =
    await fetch(
      `/api/admin/peserta/${encodeURIComponent(
        pesertaId
      )}/aktifkan-kembali`,
      {
        method:
          "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            payload
          ),

        cache:
          "no-store",
      }
    );


  const rawText =
    await response.text();


  let result:
    ReactivationApiResponse;


  try {
    result =
      JSON.parse(
        rawText
      ) as ReactivationApiResponse;

  } catch {
    throw new Error(
      `Response aktivasi kembali tidak valid. Status ${response.status}.`
    );
  }


  if (
    !response.ok ||
    result.success ===
      false
  ) {
    throw new Error(
      result.message ||
      "Gagal mengaktifkan kembali peserta."
    );
  }


  return (
    result.data ??
    null
  );
}
