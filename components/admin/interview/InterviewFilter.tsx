"use client";

import { Search, Plus } from "lucide-react";

interface InterviewFilterProps {
  search: string;
  setSearch: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;

  onAdd: () => void;
}

export default function InterviewFilter({
  search,
  setSearch,
  status,
  setStatus,
  onAdd,
}: InterviewFilterProps) {
  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        {/* Search */}
        <div className="relative w-full lg:w-[360px]">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Cari nama peserta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 outline-none transition focus:border-blue-600"
          />
        </div>

        {/* Filter Status */}
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-600"
          >
            <option>Semua Status</option>
            <option>Menunggu</option>
            <option>Dijadwalkan</option>
            <option>Selesai</option>
            <option>Lulus</option>
            <option>Tidak Lulus</option>
          </select>
        </div>

        {/* Tambah Jadwal */}
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Jadwal
        </button>

      </div>
    </div>
  );
}