"use client";

import {
  LayoutGrid,
  User,
  Briefcase,
  FileText,
  Megaphone,
  UserCircle,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";

const MENU_ITEMS = [
  { label: "Beranda", icon: LayoutGrid, href: "/dashboard" },
  { label: "Data Diri", icon: User, href: "/dashboard/data-diri" },
  { label: "Pengajuan Magang", icon: Briefcase, href: "/dashboard/pengajuan" },
  { label: "Dokumen", icon: FileText, href: "/dashboard/dokumen" },
  { label: "Pengumuman", icon: Megaphone, href: "/dashboard/pengumuman" },
  { label: "Profil", icon: UserCircle, href: "/dashboard/profil" },
];

export default function DashboardSidebar() {
  const [active, setActive] = useState("Beranda");

  return (
    <aside className="relative flex h-full w-72 shrink-0 flex-col overflow-hidden bg-white px-5 py-6">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 px-1">
        <button
          aria-label="Buka menu"
          className="text-slate-700 hover:text-slate-900"
        >
          <Menu className="h-6 w-6" />
        </button>
        <span className="text-lg font-extrabold text-slate-900">
          Magang<span className="text-brand-blue">-ers</span>
        </span>
      </div>

      {/* Menu */}
      <nav className="flex flex-1 flex-col gap-1.5">
        {MENU_ITEMS.map(({ label, icon: Icon, href }) => {
          const isActive = active === label;
          return (
            <a
              key={label}
              href={href}
              onClick={() => setActive(label)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-brand-blue text-white shadow-md shadow-blue-600/20"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </a>
          );
        })}
      </nav>

      {/* Logout */}
      <a
        href="/"
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
      >
        <LogOut className="h-5 w-5" />
        Logout
      </a>

      {/* Decorative wave */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 -z-10 w-full text-rose-100/70"
        viewBox="0 0 300 160"
        preserveAspectRatio="none"
      >
        <path
          d="M0 90 C 60 60, 100 130, 160 100 C 220 70, 260 140, 300 110 L 300 160 L 0 160 Z"
          fill="currentColor"
        />
      </svg>
    </aside>
  );
}
