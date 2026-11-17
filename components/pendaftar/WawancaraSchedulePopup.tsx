"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/components/pendaftar/UserContext";
import { CalendarDays, Clock3, MapPin, StickyNote, User, Video, X } from "lucide-react";

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function formatTanggal(dateStr: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function WawancaraSchedulePopup() {
  const router = useRouter();
  const { jadwalWawancara, lastSeenJadwalWawancaraId, refreshFromServer, status } = useUser();

  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);

  const shouldShow = useMemo(() => {
    if (!jadwalWawancara?.id) return false;

    // biasanya popup ini hanya relevan saat peserta sudah masuk tahap wawancara
    if (status !== "wawancara") return false;

    // hanya tampil kalau jadwal aktif/baru
    if (jadwalWawancara.status !== "Dijadwalkan") return false;

    // tampil kalau belum pernah dilihat
    if (lastSeenJadwalWawancaraId === jadwalWawancara.id) return false;

    return true;
  }, [jadwalWawancara, lastSeenJadwalWawancaraId, status]);

  useEffect(() => {
    if (shouldShow) setOpen(true);
  }, [shouldShow]);

  async function markSeen() {
    if (!jadwalWawancara?.id) return;

    setMarking(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const res = await fetch("/api/pendaftar/notifikasi/wawancara/seen", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jadwal_id: jadwalWawancara.id }),
      });

      const json = await safeJson(res);
      if (!res.ok) {
        console.warn("Mark seen gagal:", json);
        return;
      }

      await refreshFromServer();
    } finally {
      setMarking(false);
    }
  }

  async function handleClose() {
    await markSeen();
    setOpen(false);
  }

  async function handleGoDetail() {
    await markSeen();
    setOpen(false);
    router.push("/pendaftar/status-pendaftaran");
  }

  if (!open || !jadwalWawancara) return null;

  const catatan = (jadwalWawancara.catatan ?? "").trim();

  return (
    <>
      <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg overflow-hidden rounded-3xl border border-purple-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-purple-100 bg-purple-50 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-purple-600">
                Notifikasi Wawancara
              </p>
              <h2 className="mt-1 text-lg font-bold text-purple-900">
                Jadwal wawancara sudah ditetapkan
              </h2>
              <p className="mt-1 text-sm text-purple-800/80">
                Silakan cek detail jadwal dan catatan admin.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="grid h-10 w-10 place-items-center rounded-2xl text-purple-700 hover:bg-purple-100"
              aria-label="Tutup"
              disabled={marking}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-white p-3">
                <User className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-500">Interviewer</p>
                  <p className="text-sm font-semibold text-gray-900">{jadwalWawancara.interviewer}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-white p-3">
                <CalendarDays className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-500">Tanggal</p>
                  <p className="text-sm font-semibold text-gray-900">{formatTanggal(jadwalWawancara.tanggal)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-white p-3">
                <Clock3 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-xs text-gray-500">Jam</p>
                  <p className="text-sm font-semibold text-gray-900">{jadwalWawancara.jam}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-white p-3">
                {jadwalWawancara.metode === "Online" ? (
                  <Video className="h-5 w-5 text-purple-600" />
                ) : (
                  <MapPin className="h-5 w-5 text-purple-600" />
                )}
                <div>
                  <p className="text-xs text-gray-500">Metode</p>
                  <p className="text-sm font-semibold text-gray-900">{jadwalWawancara.metode}</p>
                </div>
              </div>

              {jadwalWawancara.lokasi && (
                <div className="sm:col-span-2 flex items-start gap-3 rounded-2xl border border-purple-100 bg-white p-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Lokasi / Link</p>
                    <p className="text-sm font-semibold text-gray-900 break-all">{jadwalWawancara.lokasi}</p>
                  </div>
                </div>
              )}
            </div>

            {catatan && (
              <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50 p-4">
                <div className="flex items-start gap-3">
                  <StickyNote className="mt-0.5 h-5 w-5 text-purple-700" />
                  <div>
                    <p className="text-sm font-semibold text-purple-900">Catatan Admin</p>
                    <p className="mt-1 whitespace-pre-line text-sm text-purple-900/90">{catatan}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-purple-100 bg-white px-6 py-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={marking}
              className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleGoDetail}
              disabled={marking}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Lihat Detail di Status Pendaftaran
            </button>
          </div>
        </div>
      </div>
    </>
  );
}