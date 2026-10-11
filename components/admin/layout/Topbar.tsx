"use client";

import { Bell, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="flex h-20 items-center border-b border-gray-200 bg-white px-8">
      
      {/* Search */}
      <div className="relative w-64">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Cari..."
          className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 outline-none focus:border-blue-500"
        />
      </div>

      {/* Kanan */}
      <div className="ml-auto flex items-center gap-5">

        {/* Notifikasi */}
        <button className="rounded-xl border border-gray-200 p-3 hover:bg-gray-100">
          <Bell size={20} />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3">

          <div className="h-10 w-10 rounded-full bg-blue-600"></div>

          <div>
            <p className="font-semibold">
              Administrator
            </p>

            <p className="text-sm text-gray-500">
              admin@magangers.id
            </p>
          </div>

        </div>

      </div>
    </header>
  );
}