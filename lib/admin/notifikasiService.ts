"use client";

import {
  adminApi,
} from "./adminApi";


export type ParticipantStatus =
  | "tidak_aktif"
  | "mengajukan"
  | "diterima"
  | "aktif"
  | "selesai"
  | "ditolak";


export interface AdminNotification {
  id: string;

  userId: string;

  pesertaId:
    | string
    | null;

  nomorPeserta:
    string;

  nama:
    string;

  email:
    string;

  statusPeserta:
    ParticipantStatus
    | null;

  judul:
    string;

  pesan:
    string;

  dibaca:
    boolean;

  createdAt:
    string;
}


export interface AdminNotificationStats {
  total:
    number;

  dibaca:
    number;

  belumDibaca:
    number;
}


export interface AdminNotificationsData {
  notifications:
    AdminNotification[];

  stats:
    AdminNotificationStats;
}


interface NotificationsResponse {
  success:
    boolean;

  data:
    AdminNotification[];

  stats:
    AdminNotificationStats;
}


interface MutationResponse {
  success:
    boolean;

  message:
    string;

  data?: {
    notificationId?:
      string;

    recipientCount?:
      number;
  };
}


// =====================================================
// GET
// =====================================================

export async function getAdminNotifications(
  limit = 100
): Promise<AdminNotificationsData> {
  const response =
    await adminApi<
      NotificationsResponse
    >(
      `/api/admin/notifikasi?limit=${limit}`
    );


  return {
    notifications:
      response.data,

    stats:
      response.stats,
  };
}


// =====================================================
// PERSONAL
// =====================================================

export async function sendParticipantNotification(
  payload: {
    pesertaId:
      string;

    judul:
      string;

    pesan:
      string;
  }
) {
  return adminApi<
    MutationResponse
  >(
    "/api/admin/notifikasi",
    {
      method:
        "POST",

      body:
        JSON.stringify({
          mode:
            "peserta",

          pesertaId:
            payload.pesertaId,

          judul:
            payload.judul,

          pesan:
            payload.pesan,
        }),
    }
  );
}


// =====================================================
// MASSAL
// =====================================================

export async function sendBulkNotification(
  payload: {
    judul:
      string;

    pesan:
      string;

    status?:
      ParticipantStatus
      | null;
  }
) {
  return adminApi<
    MutationResponse
  >(
    "/api/admin/notifikasi",
    {
      method:
        "POST",

      body:
        JSON.stringify({
          mode:
            "massal",

          judul:
            payload.judul,

          pesan:
            payload.pesan,

          status:
            payload.status ??
            null,
        }),
    }
  );
}


// =====================================================
// DELETE
// =====================================================

export async function deleteAdminNotification(
  id: string
) {
  return adminApi<
    MutationResponse
  >(
    `/api/admin/notifikasi/${id}`,
    {
      method:
        "DELETE",
    }
  );
}