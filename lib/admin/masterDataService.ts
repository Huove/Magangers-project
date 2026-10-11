import { supabase } from "@/lib/supabase";


// =====================================================
// TYPES
// =====================================================

export interface MasterDivisi {
  id: string;

  nama: string;

  deskripsi: string | null;

  aktif: boolean;

  createdAt: string;

  updatedAt: string;
}


export interface MasterPosisi {
  id: string;

  divisiId: string;

  divisiNama: string;

  nama: string;

  deskripsi: string | null;

  aktif: boolean;

  createdAt: string;

  updatedAt: string;
}


export interface SaveMasterDivisiPayload {
  nama: string;

  deskripsi?: string | null;

  aktif?: boolean;
}


export interface SaveMasterPosisiPayload {
  divisiId: string;

  nama: string;

  deskripsi?: string | null;

  aktif?: boolean;
}


interface ApiResponse<T> {
  success: boolean;

  message?: string;

  data: T;
}


// =====================================================
// TOKEN
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


  if (
    !session?.access_token
  ) {
    throw new Error(
      "Sesi admin tidak ditemukan. Silakan login kembali."
    );
  }


  return session.access_token;
}


// =====================================================
// FETCH HELPER
// =====================================================

async function adminFetch<T>(
  url: string,

  options: RequestInit = {}
): Promise<T> {
  const token =
    await getAccessToken();


  const headers:
    Record<string, string> =
    {
      Authorization:
        `Bearer ${token}`,
    };


  if (
    options.body
  ) {
    headers[
      "Content-Type"
    ] =
      "application/json";
  }


  const response =
    await fetch(
      url,
      {
        ...options,

        headers: {
          ...headers,

          ...(options.headers ??
            {}),
        },

        cache:
          "no-store",
      }
    );


  const result =
    (
      await response
        .json()
        .catch(
          () => ({
            success:
              false,

            message:
              "Response server tidak valid.",

            data:
              null,
          })
        )
    ) as ApiResponse<T>;


  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.message ||
        "Permintaan gagal diproses."
    );
  }


  return result.data;
}


// =====================================================
// DIVISI
// =====================================================

export async function getMasterDivisions(
  options?: {
    activeOnly?: boolean;
  }
) {
  const params =
    new URLSearchParams();


  if (
    options
      ?.activeOnly
  ) {
    params.set(
      "active",
      "1"
    );
  }


  const suffix =
    params.toString();


  return adminFetch<
    MasterDivisi[]
  >(
    `/api/admin/master-data/divisi${
      suffix
        ? `?${suffix}`
        : ""
    }`
  );
}


export async function createMasterDivisi(
  payload:
    SaveMasterDivisiPayload
) {
  return adminFetch<
    MasterDivisi
  >(
    "/api/admin/master-data/divisi",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}


export async function updateMasterDivisi(
  id: string,

  payload:
    Partial<SaveMasterDivisiPayload>
) {
  return adminFetch<
    MasterDivisi
  >(
    `/api/admin/master-data/divisi/${id}`,
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


export async function deleteMasterDivisi(
  id: string
) {
  return adminFetch<null>(
    `/api/admin/master-data/divisi/${id}`,
    {
      method:
        "DELETE",
    }
  );
}


// =====================================================
// POSISI
// =====================================================

export async function getMasterPositions(
  options?: {
    activeOnly?: boolean;

    divisiId?: string;
  }
) {
  const params =
    new URLSearchParams();


  if (
    options
      ?.activeOnly
  ) {
    params.set(
      "active",
      "1"
    );
  }


  if (
    options
      ?.divisiId
  ) {
    params.set(
      "divisiId",
      options.divisiId
    );
  }


  const suffix =
    params.toString();


  return adminFetch<
    MasterPosisi[]
  >(
    `/api/admin/master-data/posisi${
      suffix
        ? `?${suffix}`
        : ""
    }`
  );
}


export async function createMasterPosisi(
  payload:
    SaveMasterPosisiPayload
) {
  return adminFetch<
    MasterPosisi
  >(
    "/api/admin/master-data/posisi",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}


export async function updateMasterPosisi(
  id: string,

  payload:
    Partial<SaveMasterPosisiPayload>
) {
  return adminFetch<
    MasterPosisi
  >(
    `/api/admin/master-data/posisi/${id}`,
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


export async function deleteMasterPosisi(
  id: string
) {
  return adminFetch<null>(
    `/api/admin/master-data/posisi/${id}`,
    {
      method:
        "DELETE",
    }
  );
}