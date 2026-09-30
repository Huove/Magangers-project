"use client";

import {
  adminApi,
} from "./adminApi";


export type AdminAnnouncementStatus =
  | "draft"
  | "terjadwal"
  | "dipublikasikan";


export interface AdminAnnouncementAttachment {
  name: string;

  size: number;

  type: string;

  path: string;

  url:
    | string
    | null;
}


export interface AdminAnnouncement {
  id: string;

  judul: string;

  isi: string;

  target: string;

  tanggal: string;

  status:
    AdminAnnouncementStatus;

  dibuatOleh: string;

  dibuatOlehId:
    | string
    | null;

  createdAt: string;

  updatedAt:
    | string
    | null;

  publishedAt:
    | string
    | null;

  attachment:
    | AdminAnnouncementAttachment
    | null;
}


export interface AnnouncementPayload {
  judul: string;

  isi: string;

  target: string;

  tanggal: string;

  status:
    AdminAnnouncementStatus;

  file?: File | null;

  removeAttachment?:
    boolean;
}


interface AnnouncementsResponse {
  success: boolean;

  data:
    AdminAnnouncement[];
}


interface MutationResponse {
  success: boolean;

  message: string;

  data?: unknown;

  warnings?: string[];
}


// =====================================================
// GET
// =====================================================

export async function getAdminAnnouncements():
Promise<AdminAnnouncement[]> {
  const response =
    await adminApi<
      AnnouncementsResponse
    >(
      "/api/admin/pengumuman"
    );


  return response.data;
}


// =====================================================
// CREATE
// =====================================================

export async function createAdminAnnouncement(
  payload:
    AnnouncementPayload
) {
  const formData =
    createAnnouncementFormData(
      payload
    );


  return adminApi<
    MutationResponse
  >(
    "/api/admin/pengumuman",
    {
      method:
        "POST",

      body:
        formData,
    }
  );
}


// =====================================================
// UPDATE
// =====================================================

export async function updateAdminAnnouncement(
  id: string,
  payload:
    AnnouncementPayload
) {
  const formData =
    createAnnouncementFormData(
      payload
    );


  return adminApi<
    MutationResponse
  >(
    `/api/admin/pengumuman/${id}`,
    {
      method:
        "PUT",

      body:
        formData,
    }
  );
}


// =====================================================
// PUBLISH
// =====================================================

export async function publishAdminAnnouncement(
  id: string
) {
  return adminApi<
    MutationResponse
  >(
    `/api/admin/pengumuman/${id}/publish`,
    {
      method:
        "POST",
    }
  );
}


// =====================================================
// DELETE
// =====================================================

export async function deleteAdminAnnouncement(
  id: string
) {
  return adminApi<
    MutationResponse
  >(
    `/api/admin/pengumuman/${id}`,
    {
      method:
        "DELETE",
    }
  );
}


// =====================================================
// FORM DATA
// =====================================================

function createAnnouncementFormData(
  payload:
    AnnouncementPayload
) {
  const formData =
    new FormData();


  formData.set(
    "judul",
    payload.judul
  );


  formData.set(
    "isi",
    payload.isi
  );


  formData.set(
    "target",
    payload.target
  );


  formData.set(
    "tanggal",
    payload.tanggal
  );


  formData.set(
    "status",
    payload.status
  );


  if (
    payload.file
  ) {
    formData.set(
      "file",
      payload.file
    );
  }


  if (
    payload.removeAttachment
  ) {
    formData.set(
      "removeAttachment",
      "true"
    );
  }


  return formData;
}