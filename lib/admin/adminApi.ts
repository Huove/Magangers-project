"use client";

import {
  supabase,
} from "@/lib/supabase";

type AdminApiOptions =
  RequestInit;


// =====================================================
// ADMIN API
// =====================================================

export async function adminApi<T>(
  url: string,
  options: AdminApiOptions = {}
): Promise<T> {
  // ===================================================
  // SESSION
  // ===================================================

  const {
    data,
    error,
  } =
    await supabase.auth.getSession();


  if (error) {
    throw new Error(
      "Gagal mengambil sesi pengguna"
    );
  }


  const session =
    data.session;


  if (!session) {
    throw new Error(
      "Anda belum login"
    );
  }


  // ===================================================
  // HEADER
  // ===================================================

  const headers =
    new Headers(
      options.headers
    );


  headers.set(
    "Authorization",
    `Bearer ${session.access_token}`
  );


  // ===================================================
  // FORM DATA JANGAN DIBERI CONTENT-TYPE MANUAL
  //
  // Browser akan membuat:
  // multipart/form-data; boundary=...
  // ===================================================

  const isFormData =
    options.body instanceof
    FormData;


  if (
    options.body &&
    !isFormData &&
    !headers.has(
      "Content-Type"
    )
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }


  // ===================================================
  // FETCH
  // ===================================================

  const response =
    await fetch(
      url,
      {
        ...options,

        headers,

        cache:
          "no-store",
      }
    );


  // ===================================================
  // RESPONSE
  // ===================================================

  let result:
    | {
        success?: boolean;
        message?: string;
      }
    | null =
      null;


  try {
    result =
      await response.json();
  } catch {
    result =
      null;
  }


  if (!response.ok) {
    throw new Error(
      result?.message ??
      `Request gagal (${response.status})`
    );
  }


  return result as T;
}