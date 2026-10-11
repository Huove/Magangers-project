"use client";

import {
  Search,
  RotateCw,
  Download,
} from "lucide-react";

interface Props {
  search: string;
  setSearch: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;
}

export default function ParticipantFilter({
  search,
  setSearch,
  status,
  setStatus,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        {/* Search */}

        <div className="relative w-full lg:w-[360px]">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Cari peserta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 outline-none focus:border-blue-600"
          />

        </div>

        {/* Filter */}

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-600"
        >
          <option>Semua Status</option>
          <option>Aktif</option>
          <option>Selesai</option>
          <option>Cuti</option>
        </select>

        {/* Action */}

        <div className="flex gap-3">

          <button className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 hover:bg-gray-100">
            <RotateCw size={18} />
            Refresh
          </button>

          <button className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 hover:bg-gray-100">
            <Download size={18} />
            Export
          </button>

        </div>

      </div>

    </div>
  );
}