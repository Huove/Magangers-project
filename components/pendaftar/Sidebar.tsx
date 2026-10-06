"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Home,
  Users,
  FileText,
  ClipboardCheck,
  CalendarDays,
  BookOpen,
  ClipboardList,
  Clock3,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const menuItems = [
  {
    key: "beranda",
    label: "Beranda",
    icon: Home,
    path: "/dashboard-pembina",
  },
  {
    key: "peserta",
    label: "Peserta Bimbingan",
    icon: Users,
    path: "/dashboard-pembina/peserta",
  },
  {
    key: "laporan",
    label: "Laporan Akhir",
    icon: FileText,
    path: "/dashboard-pembina/laporan",
  },
  {
    key: "penilaian",
    label: "Penilaian",
    icon: ClipboardCheck,
    path: "/dashboard-pembina/penilaian",
  },
  {
    key: "jadwal-evaluasi",
    label: "Jadwal Evaluasi",
    icon: CalendarDays,
    path: "/dashboard-pembina/jadwal-evaluasi",
  },
  {
    key: "jurnal",
    label: "Jurnal",
    icon: BookOpen,
    path: "/dashboard-pembina/jurnal",
  },
  {
    key: "tugas",
    label: "Tugas",
    icon: ClipboardList,
    path: "/dashboard-pembina/tugas",
  },
  {
    key: "izin",
    label: "Izin",
    icon: Clock3,
    path: "/dashboard-pembina/izin",
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [active, setActive] = useState("");

  const router = useRouter();
  const pathname = usePathname();

  // ===============================
  // ACTIVE MENU
  // ===============================

  useEffect(() => {
    const current = menuItems.find((item) => {
      if (item.path === "/dashboard-pembina") {
        return pathname === item.path;
      }

      return pathname.startsWith(item.path);
    });

    if (current) {
      setActive(current.key);
    }
  }, [pathname]);

  // ===============================
  // NAVIGATION
  // ===============================

  const handleClick = (path: string, key: string) => {
    setActive(key);
    router.push(path);
  };

  // ===============================
  // LOGOUT
  // ===============================

  const handleLogout = async () => {
    const confirmed = confirm("Yakin ingin logout?");

    if (!confirmed) return;

    await supabase.auth.signOut();

    // Bersihkan cache lokal jika ada
    localStorage.removeItem("user-status");
    localStorage.removeItem("user-photo");
    localStorage.removeItem("user-data");
    localStorage.removeItem("user-documents");

    // Kembali ke halaman login
    window.location.href = "/";
  };

  return (
    <aside
      className={`
        h-screen
        flex
        flex-col
        border-r
        border-neutral-300
        bg-white
        transition-all
        duration-500
        ease-in-out
        ${isOpen ? "w-64" : "w-20"}
      `}
    >
      {/* ================= HEADER ================= */}

      <div className="flex items-center gap-3 px-5 py-5">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        <img
          src="/logo.png"
          alt="Magang-ers Logo"
          className="h-9 w-9 shrink-0 rounded-lg object-contain"
        />

        {/* Nama */}
        {isOpen && (
          <span className="whitespace-nowrap text-[20px] font-bold text-black">
            Magang-ers
          </span>
        )}
      </div>

      {/* ================= MENU ================= */}

      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-3">
        {menuItems.map(({ key, label, icon: Icon, path }) => {
          const isActive = active === key;

          return (
            <button
              key={key}
              onClick={() => handleClick(path, key)}
              className={`
                flex
                items-center
                gap-3
                rounded-lg
                px-4
                py-3
                text-[15px]
                font-medium
                transition-all

                ${
                  isActive
                    ? "bg-blue-500 text-white"
                    : "text-neutral-800 hover:bg-gray-100"
                }

                ${!isOpen ? "justify-center" : ""}
              `}
            >
              <Icon
                size={20}
                strokeWidth={1.8}
                className="shrink-0"
              />

              {isOpen && (
                <span className="whitespace-nowrap">
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ================= LOGOUT ================= */}

      <div className="border-t border-neutral-300 px-5 py-4">
        <button
          onClick={handleLogout}
          className={`
            flex
            items-center
            gap-2
            text-[15px]
            font-semibold
            text-red-700
            transition-colors
            hover:text-red-800

            ${!isOpen ? "w-full justify-center" : ""}
          `}
        >
          <LogOut size={18} />

          {isOpen && "Logout"}
        </button>
      </div>
    </aside>
  );
}