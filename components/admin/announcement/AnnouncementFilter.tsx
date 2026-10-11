"use client";

import {
  Search,
  Plus,
  Download,
} from "lucide-react";

interface Props {
  search: string;
  setSearch: (value: string) => void;
  onAdd: () => void;
  onExport: () => void;
}

export default function AnnouncementFilter({
  search,
  setSearch,
  onAdd,
  onExport,
}: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        {/* SEARCH */}

        <div className="relative w-full lg:w-[400px]">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Cari pengumuman..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 outline-none focus:border-blue-600"
          />

        </div>

        {/* BUTTON */}

        <div className="flex gap-3">

          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 hover:bg-gray-100"
          >
            <Download size={18} />
            Export
          </button>

          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Tambah Pengumuman
          </button>

        </div>

      </div>

    </div>
  );
}