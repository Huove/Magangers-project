"use client";

import {
  Search,
  Download,
  RotateCw,
} from "lucide-react";

interface Props {
  search: string;
  setSearch: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;

  onRefresh: () => void;
  onExport: () => void;
}

export default function ReportFilter({
  search,
  setSearch,
  status,
  setStatus,
  onRefresh,
  onExport,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        {/* SEARCH */}

        <div className="relative w-full lg:w-[350px]">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Cari peserta atau judul..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 outline-none focus:border-blue-600"
          />

        </div>

        {/* ACTION */}

        <div className="flex gap-3">

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-600"
          >
            <option>Semua Status</option>
            <option>Menunggu</option>
            <option>Direvisi</option>
            <option>Disetujui</option>
            <option>Ditolak</option>
          </select>

          <button
            type="button"
            onClick={onRefresh}
            className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 transition hover:bg-gray-100"
          >
            <RotateCw size={18} />

            Refresh
          </button>

          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 transition hover:bg-gray-100"
          >
            <Download size={18} />

            Export
          </button>

        </div>

      </div>

    </div>
  );
}