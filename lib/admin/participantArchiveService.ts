"use client";

import {
  supabase,
} from "@/lib/supabase";


export type ParticipantArchiveStatus =
  | "selesai"
  | "diberhentikan";


export interface ParticipantArchiveItem {
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

  nomorHp:
    string;

  fotoUrl:
    string | null;

  sekolah:
    string;

  jurusan:
    string;

  divisi:
    string;

  posisi:
    string;

  pembimbing:
    string;

  status:
    ParticipantArchiveStatus;

  tanggalMulai:
    string | null;

  tanggalSelesai:
    string | null;

  tanggalArsip:
    string | null;

  alasanBerhenti:
    string | null;
}


interface ArchiveApiResponse {
  success?:
    boolean;

  message?:
    string;

  data?:
    ParticipantArchiveItem[];
}


// =====================================================
// GET ACCESS TOKEN
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
// GET PARTICIPANT ARCHIVE
// =====================================================

export async function getParticipantArchive() {
  const token =
    await getAccessToken();


  const response =
    await fetch(
      "/api/admin/peserta/riwayat",
      {
        method:
          "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        cache:
          "no-store",
      }
    );


  const rawText =
    await response.text();


  let result:
    ArchiveApiResponse;


  try {
    result =
      JSON.parse(
        rawText
      ) as ArchiveApiResponse;

  } catch {
    throw new Error(
      `Response riwayat peserta tidak valid. Status ${response.status}.`
    );
  }


  if (
    !response.ok ||
    result.success ===
      false
  ) {
    throw new Error(
      result.message ||
      "Gagal mengambil riwayat peserta."
    );
  }


  return (
    result.data ??
    []
  );
}
