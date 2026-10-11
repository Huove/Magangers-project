"use client";

import {
  adminApi,
} from "./adminApi";


// =====================================================
// TYPE
// =====================================================

export interface AdminPlacement {
  id:
    string;

  pesertaId:
    string;

  peserta:
    string;

  nomorPeserta:
    string;

  statusPeserta:
    string;

  pembimbingId:
    string | null;

  pembimbing:
    string;

  divisi:
    string;

  posisi:
    string;

  tanggalMulai:
    string;

  tanggalSelesai:
    string | null;

  createdAt:
    string;
}


// =====================================================
// RESPONSE
// =====================================================

interface PlacementResponse {
  success:
    boolean;

  data:
    AdminPlacement[];
}


interface UpdatePlacementResponse {
  success:
    boolean;

  message:
    string;

  data?:
    unknown;
}


// =====================================================
// GET
// =====================================================

export async function getAdminPlacements():
Promise<AdminPlacement[]> {
  const response =
    await adminApi<
      PlacementResponse
    >(
      "/api/admin/penempatan"
    );


  return response.data;
}


// =====================================================
// UPDATE
// =====================================================

export async function saveAdminPlacement(
  pesertaId:
    string,

  payload: {
    pembimbingId:
      string | null;

    divisi:
      string | null;

    posisi:
      string | null;

    tanggalMulai:
      string;

    tanggalSelesai:
      string | null;
  }
) {
  return adminApi<
    UpdatePlacementResponse
  >(
    `/api/admin/penempatan/${pesertaId}`,
    {
      method:
        "PUT",

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}