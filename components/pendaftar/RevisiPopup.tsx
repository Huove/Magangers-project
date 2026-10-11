"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/pendaftar/UserContext";
import { AlertTriangle, X } from "lucide-react";

const SEEN_KEY = "revisi-popup-seen-pengajuan-id";

export default function RevisiPopup() {
  const { latestPengajuanStatus, latestPengajuanId, revisiNote } = useUser();
  const [open, setOpen] = useState(false);

  // buka popup kalau ada revisi dan belum pernah di-OK untuk pengajuan id itu
  useEffect(() => {
    if (latestPengajuanStatus !== "revisi") return;
    if (!latestPengajuanId) return;

    const seen = localStorage.getItem(SEEN_KEY);
    if (seen !== latestPengajuanId) {
      setOpen(true);
    }
  }, [latestPengajuanStatus, latestPengajuanId]);

  // lock scroll saat modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleOk = () => {
    if (latestPengajuanId) localStorage.setItem(SEEN_KEY, latestPengajuanId);
    setOpen(false);
  };

  const handleClose = () => {
    // close sama seperti OK (biar gak muncul lagi terus)
    handleOk();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-2xl">
        <div className="flex items-start gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertTriangle size={22} />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">
              Pengajuan Magang Perlu Revisi
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Admin meminta kamu memperbaiki data/dokumen. Silakan baca catatan berikut:
            </p>

            <div className="mt-4 max-h-56 overflow-auto rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-900">
                {revisiNote?.trim()
                  ? revisiNote
                  : "Catatan revisi belum tersedia."}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 border-t bg-gray-50 px-6 py-4">
          <button
            onClick={handleOk}
            className="rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700 active:scale-[0.99]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}