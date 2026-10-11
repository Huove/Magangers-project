"use client";

import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function InterviewScheduleModal({
  open,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30"
      />

      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-5">

          <div>
            <h2 className="text-xl font-bold">
              Jadwalkan Wawancara
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Atur jadwal wawancara peserta magang.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <X size={22} />
          </button>

        </div>

        {/* Body */}
        <div className="grid grid-cols-2 gap-5 p-6">

          <div className="col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Peserta
            </label>

            <select className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600">
              <option>Pilih Peserta</option>
              <option>Ahmad Fauzi</option>
              <option>Nabila Putri</option>
              <option>Rizky Saputra</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Tanggal
            </label>

            <input
              type="date"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Jam
            </label>

            <input
              type="time"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Metode
            </label>

            <select className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600">
              <option>Offline</option>
              <option>Online</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Interviewer
            </label>

            <select className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600">
              <option>Kak Fitri</option>
              <option>Pak Budi</option>
              <option>Bu Dian</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Lokasi / Link Meeting
            </label>

            <input
              type="text"
              placeholder="Meeting Room 1 atau Google Meet"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>

          <div className="col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Catatan
            </label>

            <textarea
              rows={4}
              placeholder="Tambahkan catatan..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t p-6">

          <button
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-5 py-3 hover:bg-gray-100"
          >
            Batal
          </button>

          <button className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
            Simpan Jadwal
          </button>

        </div>

      </div>
    </>
  );
}