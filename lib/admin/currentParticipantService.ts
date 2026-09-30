"use client";

import {
  getAdminParticipants,
  type AdminParticipant,
} from "@/lib/admin/pesertaService";


export type CurrentParticipantStatus =
  | "diterima"
  | "aktif";


const CURRENT_STATUSES:
  CurrentParticipantStatus[] =
  [
    "diterima",
    "aktif",
  ];


// =====================================================
// NORMALIZE
// =====================================================

function normalizeStatus(
  value:
    string |
    null |
    undefined
) {
  return (
    value ??
    ""
  )
    .trim()
    .toLowerCase();
}


// =====================================================
// GET CURRENT PARTICIPANTS
//
// Peserta selesai dan diberhentikan tidak ditampilkan
// di daftar Peserta utama.
// Mereka tetap tersedia di Riwayat Peserta.
// =====================================================

export async function getCurrentAdminParticipants():
  Promise<AdminParticipant[]> {

  const participants =
    await getAdminParticipants();


  return participants.filter(
    (
      participant
    ) =>
      CURRENT_STATUSES.includes(
        normalizeStatus(
          participant.status
        ) as CurrentParticipantStatus
      )
  );
}
