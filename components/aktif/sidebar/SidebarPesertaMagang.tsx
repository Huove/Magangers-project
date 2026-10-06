"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  LayoutGrid,
  CalendarClock,
  ClipboardList,
  BookOpen,
  NotebookText,
  SquareMenu,
  ChevronRight,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
    route: "/aktif/dashboard",
  },
  {
    key: "pengumuman",
    label: "Pengumuman",
    icon: CalendarClock,
    route: "/aktif/pengumuman",
  },
  {
    key: "absensi",
    label: "Absensi",
    icon: ClipboardList,
    route: "/aktif/absensi",
  },
  {
    key: "tugas",
    label: "Tugas",
    icon: BookOpen,
    route: "/aktif/tugas",
  },
  {
    key: "jurnal",
    label: "Jurnal",
    icon: NotebookText,
    route: "/aktif/jurnal",
  },
  {
    key: "lainnya",
    label: "Menu Lainnya",
    icon: SquareMenu,
    route: "/aktif/lainnya",
    hasChevron: true,
  },
];

export default function Sidebar({
  onNavigate,
  onLogout,
}: {
  onNavigate?: (key: string) => void;
  onLogout?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  /*
   * Menentukan menu aktif berdasarkan URL.
   */
  const activeItem = menuItems.find((item) => {
    if (item.route === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(item.route);
  });

  const active = activeItem?.key ?? "";

  const handleClick = (key: string, route: string) => {
    router.push(route);

    if (onNavigate) {
      onNavigate(key);
    }
  };

  const handleLogout = () => {
    const confirmed = window.confirm(
      "Yakin ingin logout?"
    );

    if (confirmed) {
      router.push("/");

      if (onLogout) {
        onLogout();
      }
    }
  };

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-neutral-200 bg-white transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* ================= HEADER ================= */}

      <div
        className={`flex items-center px-5 py-5 ${
          isOpen ? "gap-3" : "justify-center"
        }`}
      >

                {/* Tombol Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={
            isOpen
              ? "Tutup sidebar"
              : "Buka sidebar"
          }
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-700 transition hover:bg-neutral-100 ${
            isOpen ? "ml-auto" : ""
          }`}
        >
          <Menu size={23} />
        </button>

        {/* Logo */}
        <img
          src="/logo.png"
          alt="Magang-ers Logo"
          className="h-9 w-9 shrink-0 rounded-lg object-contain"
        />

        {/* Nama */}
        {isOpen && (
          <span className="whitespace-nowrap text-[20px] font-bold text-black gap-4">
            Magang-ers
          </span>
        )}
      </div>

      {/* ================= MENU ================= */}

      <nav className="flex flex-1 flex-col gap-2 px-3">
        {menuItems.map(
          ({
            key,
            label,
            icon: Icon,
            route,
            hasChevron,
          }) => {
            const isActive = active === key;

            return (
              <button
                key={key}
                onClick={() =>
                  handleClick(key, route)
                }
                title={
                  !isOpen
                    ? label
                    : undefined
                }
                className={`
                  flex items-center justify-between
                  rounded-xl px-3.5 py-3
                  text-[16px] font-medium
                  transition-all duration-200

                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }

                  ${!isOpen ? "justify-center" : ""}
                `}
              >
                <span className="flex items-center gap-3">
                  <Icon size={21} />

                  {isOpen && (
                    <span>{label}</span>
                  )}
                </span>

                {isOpen && hasChevron && (
                  <ChevronRight
                    size={16}
                    className={
                      isActive
                        ? "text-white"
                        : "text-neutral-400"
                    }
                  />
                )}
              </button>
            );
          }
        )}
      </nav>

      {/* ================= LOGOUT ================= */}

      <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-4">
        <button
          onClick={handleLogout}
          title={
            !isOpen
              ? "Logout"
              : undefined
          }
          className={`
            flex w-full items-center gap-3
            rounded-xl px-3 py-2.5
            text-[15px] font-semibold
            text-red-600
            transition
            hover:bg-red-50

            ${!isOpen ? "justify-center" : ""}
          `}
        >
          <LogOut size={18} />

          {isOpen && (
            <span>Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
}