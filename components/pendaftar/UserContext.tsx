// components/pendaftar/UserContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient, type Session } from "@supabase/supabase-js";

type JadwalWawancara = {
  id: string;
  interviewer: string;
  tanggal: string;
  jam: string;
  metode: string;
  lokasi: string;
  status: string;

  catatan?: string | null;

  // tugas text
  tugas?: string | null;
  jawaban_tugas?: string | null;
  jawaban_tugas_submitted_at?: string | null;

  // tugas file
  jawaban_tugas_file_path?: string | null;
  jawaban_tugas_file_name?: string | null;
  jawaban_tugas_file_uploaded_at?: string | null;
  jawaban_tugas_file_url?: string | null;
} | null;

type UserDataShape =
  | {
      pribadi?: Record<string, any>;
      pendidikan?: Record<string, any>;
      [key: string]: any;
    }
  | null;

type DocumentsShape = Record<string, any>;

export type UserCtx = {
  loading: boolean;

  // auth/session (buat komponen lain yang butuh token)
  session: Session | null;
  accessToken: string | null;
  token: string | null; // alias

  // status pendaftaran
  status: string;
  latestPengajuanStatus: string | null;
  revisiNote: string;
  jadwalWawancara: JadwalWawancara;
  lastSeenJadwalWawancaraId: string | null;

  // ✅ ini yang dibutuhkan data-diri & dokumen
  userData: UserDataShape;
  setUserData: (v: UserDataShape) => void;

  documents: DocumentsShape;
  setDocuments: (v: DocumentsShape) => void;

  // refresh
  refresh: () => Promise<void>;
  refreshFromServer: () => Promise<void>;

  // biar aman kalau ada komponen lain akses key lama
  [key: string]: any;
};

const Ctx = createContext<UserCtx | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return null;
    return createClient(url, anon);
  }, []);

  const [loading, setLoading] = useState(true);

  // auth/session
  const [session, setSession] = useState<Session | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // status pendaftaran
  const [status, setStatus] = useState<string>("tidak_aktif");
  const [latestPengajuanStatus, setLatestPengajuanStatus] = useState<string | null>(null);
  const [revisiNote, setRevisiNote] = useState<string>("");
  const [jadwalWawancara, setJadwalWawancara] = useState<JadwalWawancara>(null);
  const [lastSeenJadwalWawancaraId, setLastSeenJadwalWawancaraId] = useState<string | null>(null);

  // ✅ data-diri + dokumen
  const [userData, _setUserData] = useState<UserDataShape>(null);
  const [documents, _setDocuments] = useState<DocumentsShape>({});

  const setUserData = (v: UserDataShape) => _setUserData(v);
  const setDocuments = (v: DocumentsShape) => _setDocuments(v);

  const refresh = async () => {
    try {
      setLoading(true);

      if (!supabase) {
        setSession(null);
        setAccessToken(null);

        setStatus("tidak_aktif");
        setLatestPengajuanStatus(null);
        setRevisiNote("");
        setJadwalWawancara(null);
        setLastSeenJadwalWawancaraId(null);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const sess = sessionData.session ?? null;

      setSession(sess);
      setAccessToken(sess?.access_token ?? null);

      const token = sess?.access_token;
      if (!token) {
        setStatus("tidak_aktif");
        setLatestPengajuanStatus(null);
        setRevisiNote("");
        setJadwalWawancara(null);
        setLastSeenJadwalWawancaraId(null);
        return;
      }

      // ambil status pendaftaran (yang sudah kamu pakai)
      const res = await fetch("/api/pendaftar/status", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        // fallback aman
        setStatus("tidak_aktif");
        setLatestPengajuanStatus(null);
        setRevisiNote("");
        setJadwalWawancara(null);
        setLastSeenJadwalWawancaraId(null);
        return;
      }

      setStatus(json?.status ?? "tidak_aktif");
      setLatestPengajuanStatus(json?.latestPengajuanStatus ?? null);
      setRevisiNote(json?.revisiNote ?? "");
      setJadwalWawancara(json?.jadwalWawancara ?? null);
      setLastSeenJadwalWawancaraId(json?.lastSeenJadwalWawancaraId ?? null);
    } finally {
      setLoading(false);
    }
  };

  const refreshFromServer = refresh;

  useEffect(() => {
    refresh();

    // optional: ikut update session kalau auth berubah
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setAccessToken(sess?.access_token ?? null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: UserCtx = {
    loading,

    session,
    accessToken,
    token: accessToken, // alias

    status,
    latestPengajuanStatus,
    revisiNote,
    jadwalWawancara,
    lastSeenJadwalWawancaraId,

    userData,
    setUserData,

    documents,
    setDocuments,

    refresh,
    refreshFromServer,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUser(): UserCtx {
  const ctx = useContext(Ctx);

  // ✅ fallback biar gak crash walau Provider belum kebaca
  return (
    ctx ?? {
      loading: true,

      session: null,
      accessToken: null,
      token: null,

      status: "tidak_aktif",
      latestPengajuanStatus: null,
      revisiNote: "",
      jadwalWawancara: null,
      lastSeenJadwalWawancaraId: null,

      userData: null,
      setUserData: () => {},

      documents: {},
      setDocuments: () => {},

      refresh: async () => {},
      refreshFromServer: async () => {},
    }
  );
}