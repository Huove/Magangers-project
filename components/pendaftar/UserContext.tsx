"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type StatusType =
  | "tidak_aktif"
  | "mengajukan"
  | "verifikasi"
  | "wawancara"
  | "diterima"
  | "ditolak"
  | "aktif"
  | "selesai";

interface UserDataType {
  pribadi: any;
  pendidikan: any;
}

interface DocumentType {
  kartuPelajar?: string;
  ktp?: string;
  cv?: string;
  suratPengantar?: string;
  pasFoto?: string;
}

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

interface UserContextType {
  photo: string | null;
  setPhoto: (value: string | null) => void;

  status: StatusType;
  setStatus: (value: StatusType) => void;

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

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusType>("tidak_aktif");

  const [latestPengajuanStatus, setLatestPengajuanStatus] = useState<string | null>(null);
  const [latestPengajuanId, setLatestPengajuanId] = useState<string | null>(null);
  const [revisiNote, setRevisiNote] = useState<string | null>(null);
  const [jadwalWawancara, setJadwalWawancara] = useState<JadwalWawancara | null>(null);

  const [userData, setUserData] = useState<UserDataType | null>(null);
  const [documents, setDocuments] = useState<DocumentType>({});

  useEffect(() => {
    const savedPhoto = localStorage.getItem("user-photo");
    const savedStatus = localStorage.getItem("user-status");
    const savedUser = localStorage.getItem("user-data");
    const savedDocs = localStorage.getItem("user-documents");

    if (savedPhoto) setPhoto(savedPhoto);
    if (savedStatus) setStatus(savedStatus as StatusType);
    if (savedUser) setUserData(JSON.parse(savedUser));
    if (savedDocs) setDocuments(JSON.parse(savedDocs));
  }, []);

  useEffect(() => {
    if (photo) localStorage.setItem("user-photo", photo);
    localStorage.setItem("user-status", status);
    if (userData) localStorage.setItem("user-data", JSON.stringify(userData));
    localStorage.setItem("user-documents", JSON.stringify(documents));
  }, [photo, status, userData, documents]);

  async function refreshFromServer() {
    const { data: s } = await supabase.auth.getSession();
    const token = s.session?.access_token;

    if (!token) {
      setStatus("tidak_aktif");
      setLatestPengajuanStatus(null);
      setLatestPengajuanId(null);
      setRevisiNote(null);
      setJadwalWawancara(null);
      return;
    }

    const res = await fetch("/api/pendaftar/status", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { message: text };
    }

    if (!res.ok) return;

    setStatus((json?.status ?? "tidak_aktif") as StatusType);
    setLatestPengajuanStatus(json?.latest_pengajuan_status ?? null);
    setLatestPengajuanId(json?.latest_pengajuan_id ?? null);
    setRevisiNote(json?.revisi_note ?? null);
    setJadwalWawancara(json?.jadwal_wawancara ?? null);
  }

  useEffect(() => {
    refreshFromServer();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refreshFromServer();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider
      value={{
        photo,
        setPhoto,
        status,
        setStatus,
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

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be inside provider");
  return context;
}