"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  Home,
  User,
  ClipboardCheck,
  CalendarClock,
  Database,
  LogOut,
} from "lucide-react";
import { useUser } from "./UserContext";
import { supabase } from "@/lib/supabase";

/* ================= MENU MASTER ================= */

const allMenuItems = [
  { key: "beranda", label: "Beranda", icon: Home, path: "/pendaftar/beranda" },
  { key: "data-diri", label: "Data Diri", icon: User, path: "/pendaftar/data-diri" },
  { key: "pengajuan-magang", label: "Pengajuan Magang", icon: ClipboardCheck, path: "/pendaftar/pengajuan-magang" },
  { key: "status-pendaftaran", label: "Status Pendaftaran", icon: CalendarClock, path: "/pendaftar/status-pendaftaran" },
  { key: "dokumen", label: "Dokumen", icon: Database, path: "/pendaftar/dokumen" },
];

/* ================= ACCESS RULE ================= */
const sidebarAccess: Record<string, string[]> = {
  tidak_aktif: ["beranda", "data-diri", "pengajuan-magang", "dokumen", "status-pendaftaran"],
  mengajukan: ["beranda", "status-pendaftaran", "dokumen"],
  verifikasi: ["beranda", "status-pendaftaran", "dokumen"],
  wawancara: ["beranda", "status-pendaftaran", "dokumen"],
  diterima: ["beranda", "status-pendaftaran", "dokumen"],
  ditolak: ["beranda", "status-pendaftaran", "dokumen"],

  // enum lama kamu
  aktif: ["beranda", "status-pendaftaran", "dokumen"],
  selesai: ["beranda", "status-pendaftaran", "dokumen"],
};

export default function Sidebar() {
  const { status } = useUser();
  const [isOpen, setIsOpen] = useState(true);
  const [active, setActive] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const current = allMenuItems.find((item) => item.path === pathname);
    if (current) setActive(current.key);
  }, [pathname]);

  const normalizedStatus = status === "aktif" ? "verifikasi" : status;

  const allowedKeys =
    sidebarAccess[normalizedStatus] ?? ["beranda", "status-pendaftaran", "dokumen"];

  const menuItems = allMenuItems.filter((item) => allowedKeys.includes(item.key));

  const handleClick = (path: string, key: string) => {
    setActive(key);
    router.push(path);
  };

  const handleLogout = async () => {
    if (!confirm("Yakin ingin logout?")) return;

    // 1) logout supabase biar token/session hilang
    await supabase.auth.signOut();

    // 2) bersihin cache lokal pendaftar biar UI ga nyangkut data lama
    localStorage.removeItem("user-status");
    localStorage.removeItem("user-photo");
    localStorage.removeItem("user-data");
    localStorage.removeItem("user-documents");

    // 3) full reload redirect (lebih bersih daripada router.push)
    window.location.href = "/";
  };

  return (
    <aside
      className={`h-screen flex flex-col border-r border-neutral-300 bg-white transition-all duration-500 ease-in-out ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* HEADER */}
      <div className="flex items-center gap-3 px-5 py-5">
        <button onClick={() => setIsOpen(!isOpen)}>
          <Menu size={24} />
        </button>

        {isOpen && (
          <span className="text-[18px] font-bold whitespace-nowrap">
            <span className="text-[#840000]">Datasoft</span>{" "}
            <span>Solution</span>
          </span>
        )}
      </div>

      {/* MENU */}
      <nav className="flex flex-1 flex-col gap-2 px-3">
        {menuItems.map(({ key, label, icon: Icon, path }) => {
          const isActive = active === key;

          return (
            <button
              key={key}
              onClick={() => handleClick(path, key)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium transition-all ${
                isActive
                  ? "bg-blue-500 text-white"
                  : "text-neutral-800 hover:bg-gray-100"
              } ${!isOpen ? "justify-center" : ""}`}
            >
              <Icon size={20} strokeWidth={1.8} />
              {isOpen && label}
            </button>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div className="border-t border-neutral-300 px-5 py-4">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 text-[15px] font-semibold text-red-700 ${
            !isOpen ? "justify-center w-full" : ""
          }`}
        >
          <LogOut size={18} />
          {isOpen && "Logout"}
        </button>
      </div>
    </aside>
  );
}