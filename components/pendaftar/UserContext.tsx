"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/lib/supabase";

// ==========================================
// STATUS PESERTA
// ==========================================
export type StatusType =
  | "tidak_aktif"
  | "mengajukan"
  | "verifikasi"
  | "wawancara"
  | "diterima"
  | "ditolak"
  | "aktif"
  | "selesai";

// ==========================================
// USER DATA
// ==========================================
interface UserDataType {
  pribadi: any;
  pendidikan: any;
}

// ==========================================
// DOCUMENT
// ==========================================
interface DocumentType {
  kartuPelajar?: string;
  ktp?: string;
  cv?: string;
  suratPengantar?: string;
  pasFoto?: string;
}

// ==========================================
// JADWAL WAWANCARA
// ==========================================
interface JadwalWawancara {
  id: string;
  interviewer: string;
  tanggal: string;
  jam: string;
  metode: string;
  lokasi: string | null;
  status: string;
  catatan: string | null;
}

// ==========================================
// CONTEXT TYPE
// ==========================================
interface UserContextType {
  photo: string | null;

  setPhoto: (value: string | null) => void;

  status: StatusType;

  setStatus: (value: StatusType) => void;

  loadingStatus: boolean;

  latestPengajuanStatus: string | null;

  latestPengajuanId: string | null;

  revisiNote: string | null;

  jadwalWawancara: JadwalWawancara | null;

  userData: UserDataType | null;

  setUserData: (value: UserDataType | null) => void;

  documents: DocumentType;

  setDocuments: (value: DocumentType) => void;

  refreshFromServer: () => Promise<void>;
}

// ==========================================
// CREATE CONTEXT
// ==========================================
const UserContext = createContext<UserContextType | undefined>(
  undefined
);

// ==========================================
// PROVIDER
// ==========================================
export function UserProvider({
  children,
}: {
  children: ReactNode;
}) {
  // ==========================================
  // STATE
  // ==========================================

  const [photo, setPhoto] = useState<string | null>(null);

  // Default awal selalu tidak aktif.
  // Status sebenarnya akan diambil dari server.
  const [status, setStatus] =
    useState<StatusType>("tidak_aktif");

  // Menandakan apakah status sedang dicek ke server.
  const [loadingStatus, setLoadingStatus] =
    useState<boolean>(true);

  const [latestPengajuanStatus, setLatestPengajuanStatus] =
    useState<string | null>(null);

  const [latestPengajuanId, setLatestPengajuanId] =
    useState<string | null>(null);

  const [revisiNote, setRevisiNote] =
    useState<string | null>(null);

  const [jadwalWawancara, setJadwalWawancara] =
    useState<JadwalWawancara | null>(null);

  const [userData, setUserData] =
    useState<UserDataType | null>(null);

  const [documents, setDocuments] =
    useState<DocumentType>({});

  // ==========================================
  // REQUEST ID
  // ==========================================
  // Mencegah request lama menimpa status
  // akun yang lebih baru.
  // ==========================================
  const refreshRequestRef = useRef(0);

  // ==========================================
  // LOCAL STORAGE
  // ==========================================
  // Status TIDAK disimpan ke localStorage.
  //
  // Status peserta harus selalu berasal dari
  // database/server.
  // ==========================================
  useEffect(() => {
    // Hapus status lama jika sebelumnya pernah
    // tersimpan dari versi aplikasi sebelumnya.
    localStorage.removeItem("user-status");

    const savedPhoto =
      localStorage.getItem("user-photo");

    const savedUser =
      localStorage.getItem("user-data");

    const savedDocs =
      localStorage.getItem("user-documents");

    // ------------------------------------------
    // PHOTO
    // ------------------------------------------
    if (savedPhoto) {
      setPhoto(savedPhoto);
    }

    // ------------------------------------------
    // USER DATA
    // ------------------------------------------
    if (savedUser) {
      try {
        setUserData(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user-data");
      }
    }

    // ------------------------------------------
    // DOCUMENTS
    // ------------------------------------------
    if (savedDocs) {
      try {
        setDocuments(JSON.parse(savedDocs));
      } catch {
        localStorage.removeItem("user-documents");
      }
    }
  }, []);

  // ==========================================
  // SIMPAN DATA NON-STATUS KE LOCAL STORAGE
  // ==========================================
  useEffect(() => {
    // ------------------------------------------
    // PHOTO
    // ------------------------------------------
    if (photo) {
      localStorage.setItem(
        "user-photo",
        photo
      );
    } else {
      localStorage.removeItem("user-photo");
    }

    // ------------------------------------------
    // USER DATA
    // ------------------------------------------
    if (userData) {
      localStorage.setItem(
        "user-data",
        JSON.stringify(userData)
      );
    } else {
      localStorage.removeItem("user-data");
    }

    // ------------------------------------------
    // DOCUMENTS
    // ------------------------------------------
    localStorage.setItem(
      "user-documents",
      JSON.stringify(documents)
    );
  }, [
    photo,
    userData,
    documents,
  ]);

  // ==========================================
  // REFRESH DARI SERVER
  // ==========================================
  const refreshFromServer = useCallback(
    async () => {
      // Buat ID request baru.
      const requestId =
        ++refreshRequestRef.current;

      // Selama proses pengecekan,
      // jangan melakukan redirect.
      setLoadingStatus(true);

      try {
        // ======================================
        // AMBIL SESSION
        // ======================================
        const {
          data: sessionData,
          error: sessionError,
        } =
          await supabase.auth.getSession();

        // Kalau request ini sudah bukan request
        // terbaru, hentikan.
        if (
          requestId !==
          refreshRequestRef.current
        ) {
          return;
        }

        if (sessionError) {
          console.warn(
            "GET SESSION ERROR:",
            sessionError
          );

          setStatus("tidak_aktif");

          setLatestPengajuanStatus(null);
          setLatestPengajuanId(null);
          setRevisiNote(null);
          setJadwalWawancara(null);

          return;
        }

        const token =
          sessionData.session
            ?.access_token;

        // ======================================
        // BELUM LOGIN
        // ======================================
        if (!token) {
          setStatus("tidak_aktif");

          setLatestPengajuanStatus(null);
          setLatestPengajuanId(null);
          setRevisiNote(null);
          setJadwalWawancara(null);

          return;
        }

        // ======================================
        // UTM ATTACHMENT
        // ======================================
        // Tidak menggagalkan proses login/status
        // jika endpoint UTM mengalami error.
        // ======================================
        try {
          await fetch(
            "/api/utm/attach",
            {
              method: "POST",
              cache: "no-store",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );
        } catch (error) {
          console.warn(
            "UTM ATTACH SKIPPED:",
            error
          );
        }

        // ======================================
        // AMBIL STATUS PESERTA
        // ======================================
        const res =
          await fetch(
            "/api/pendaftar/status",
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache: "no-store",
            }
          );

        // ======================================
        // CEK REQUEST TERBARU
        // ======================================
        if (
          requestId !==
          refreshRequestRef.current
        ) {
          return;
        }

        // ======================================
        // BACA RESPONSE
        // ======================================
        const text =
          await res.text();

        let json: any = null;

        try {
          json = text
            ? JSON.parse(text)
            : null;
        } catch {
          json = {
            message: text,
          };
        }

        // ======================================
        // API ERROR
        // ======================================
        if (!res.ok) {
          console.warn(
            "GET STATUS ERROR:",
            json
          );

          // Jangan biarkan status lama
          // menyebabkan redirect.
          setStatus("tidak_aktif");

          return;
        }

        // ======================================
        // STATUS PESERTA DARI SERVER
        // ======================================
        const serverStatus =
          (json?.status ??
            "tidak_aktif") as StatusType;

        // ======================================
        // SET STATUS
        // ======================================
        setStatus(serverStatus);

        // ======================================
        // DATA PENGAJUAN
        // ======================================
        setLatestPengajuanStatus(
          json?.latest_pengajuan_status ??
            null
        );

        setLatestPengajuanId(
          json?.latest_pengajuan_id ??
            null
        );

        // ======================================
        // CATATAN REVISI
        // ======================================
        setRevisiNote(
          json?.revisi_note ??
            null
        );

        // ======================================
        // JADWAL WAWANCARA
        // ======================================
        setJadwalWawancara(
          json?.jadwal_wawancara ??
            null
        );
      } catch (error) {
        // ======================================
        // ERROR TAK TERDUGA
        // ======================================
        console.warn(
          "REFRESH USER STATUS ERROR:",
          error
        );

        // Kalau gagal mengambil status,
        // jangan arahkan user ke halaman aktif.
        if (
          requestId ===
          refreshRequestRef.current
        ) {
          setStatus("tidak_aktif");
        }
      } finally {
        // Hanya request terbaru yang boleh
        // mengubah loading menjadi false.
        if (
          requestId ===
          refreshRequestRef.current
        ) {
          setLoadingStatus(false);
        }
      }
    },
    []
  );

  // ==========================================
  // AUTH STATE
  // ==========================================
  useEffect(() => {
    // Cek status saat pertama kali provider
    // dijalankan.
    void refreshFromServer();

    // Dengarkan perubahan auth.
    const {
      data: sub,
    } =
      supabase.auth.onAuthStateChange(
        () => {
          // Ketika login/logout/refresh session,
          // ambil ulang status dari server.
          void refreshFromServer();
        }
      );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [
    refreshFromServer,
  ]);

  // ==========================================
  // CONTEXT PROVIDER
  // ==========================================
  return (
    <UserContext.Provider
      value={{
        photo,
        setPhoto,

        status,
        setStatus,

        loadingStatus,

        latestPengajuanStatus,
        latestPengajuanId,

        revisiNote,
        jadwalWawancara,

        userData,
        setUserData,

        documents,
        setDocuments,

        refreshFromServer,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// ==========================================
// USE USER
// ==========================================
export function useUser() {
  const context =
    useContext(UserContext);

  if (!context) {
    throw new Error(
      "useUser must be inside provider"
    );
  }

  return context;
}