"use client";

import {
  Home,
  Users,
  ClipboardList,
  BookCheck,
  FileCheck2,
  BarChart3,
  LogOut,
  CalendarClock,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  { label: "Dashboard", icon: Home, href: "/dashboard-pembina" },
  { label: "Peserta Bimbingan", icon: Users, href: "/dashboard-pembina/peserta" },
  { label: "Kelola Tugas", icon: ClipboardList, href: "/dashboard-pembina/tugas" },
  { label: "Pemeriksaan Jurnal", icon: BookCheck, href: "/dashboard-pembina/jurnal" },
  { label: "Persetujuan Izin", icon: FileCheck2, href: "/dashboard-pembina/izin" },
  { label: "Penilaian Peserta", icon: BarChart3, href: "/dashboard-pembina/penilaian" },
  { label: "Jadwal Evaluasi", icon: CalendarClock, href: "/dashboard-pembina/jadwal-evaluasi" },
];

export default function PembinaSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-100 bg-white px-5 py-6">
      <Link href="/" className="mb-8 flex items-center gap-2 px-1">
        <img
          src="/logo.png"
          alt="Magang-ers Logo"
          className="h-8 w-8 rounded-lg object-cover"
        />

        <span className="text-lg font-extrabold text-slate-900">
          Magang-ers
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {MENU_ITEMS.map(({ label, icon: Icon, href }) => {
          const isActive =
            href === "/dashboard-pembina"
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? "bg-brand-blue text-white shadow-md shadow-blue-600/20"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/"
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
      >
        <LogOut className="h-5 w-5" />
        Logout
      </Link>
    </aside>
  );
} 