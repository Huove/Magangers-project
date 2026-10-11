"use client";

import { X, ClipboardPlus } from "lucide-react";
import { useState } from "react";
import { KATEGORI_OPTIONS, type Tugas } from "@/lib/tugasData";

type TambahTugasModalProps = {
  pesertaOptions: string[];
  onClose: () => void;
  onSubmit: (data: Omit<Tugas, "id" | "status">) => void;
};

export default function TambahTugasModal({
  pesertaOptions,
  onClose,
  onSubmit,
}: TambahTugasModalProps) {
  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState(KATEGORI_OPTIONS[0]);
  const [peserta, setPeserta] = useState(pesertaOptions[0] ?? "");
  const [batasWaktu, setBatasWaktu] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!judul.trim() || !peserta || !batasWaktu) return;

    const formattedDate = new Date(batasWaktu).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    onSubmit({
      judul: judul.trim(),
      kategori,
      pesertaNama: peserta,
      batasWaktu: formattedDate,
      deskripsi: deskripsi.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tambah-tugas-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-5 top-5 text-slate-400 transition-colors hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-brand-blue">
          <ClipboardPlus className="h-6 w-6" />
        </span>
        <h2 id="tambah-tugas-title" className="mt-4 text-xl font-extrabold text-slate-900">
          Tambah Tugas Baru
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Isi detail tugas yang akan diberikan ke peserta magang.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Judul Tugas
            </label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Membuat UI Dashboard"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-blue focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Kategori
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-brand-blue focus:bg-white"
              >
                {KATEGORI_OPTIONS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Peserta
              </label>
              <select
                value={peserta}
                onChange={(e) => setPeserta(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-brand-blue focus:bg-white"
              >
                {pesertaOptions.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Batas Waktu
            </label>
            <input
              type="date"
              value={batasWaktu}
              onChange={(e) => setBatasWaktu(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-brand-blue focus:bg-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Deskripsi <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={3}
              placeholder="Jelaskan detail pengerjaan tugas ini..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-blue focus:bg-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-brand-blue py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-transform hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Simpan Tugas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
