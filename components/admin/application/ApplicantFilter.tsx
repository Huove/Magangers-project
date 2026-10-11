"use client";

import { Search, Plus } from "lucide-react";

interface ApplicantFilterProps {
  search: string;
  setSearch: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;

  position: string;
  setPosition: (value: string) => void;

  onAdd: () => void;
}

export default function ApplicantFilter({
  search,
  setSearch,
  status,
  setStatus,
  position,
  setPosition,
  onAdd,
}: ApplicantFilterProps) {
  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        {/* SEARCH */}
        <div className="relative w-full lg:w-[360px]">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Cari nama pelamar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 outline-none focus:border-blue-600"
          />
        </div>

        {/* FILTER */}
        <div className="flex flex-wrap gap-3">

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-600"
          >
            <option>Semua Status</option>
            <option>Menunggu</option>
            <option>Diperiksa</option>
            <option>Revisi</option>
            <option>Diterima</option>
            <option>Ditolak</option>
          </select>

          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-600"
          >
            <option>Semua Posisi</option>
            <option>Frontend Developer</option>
            <option>Backend Developer</option>
            <option>UI/UX Designer</option>
            <option>Mobile Developer</option>
            <option>Data Analyst</option>
          </select>

        </div>

        {/* TAMBAH */}
        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Tambah Pelamar
        </button>

      </div>
    </div>
  );
}