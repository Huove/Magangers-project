"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BriefcaseBusiness,
  Archive,
  Database,
  Bell,
  FileText,
  Award,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

// =====================================================
// MENU ADMIN
// =====================================================

const menus = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    title: "Pelamar",
    icon: Users,
    href: "/admin/pelamar",
  },
  {
    title: "Wawancara",
    icon: CalendarDays,
    href: "/admin/wawancara",
  },
  {
    title: "Peserta",
    icon: BriefcaseBusiness,
    href: "/admin/peserta",
  },
  {
    title: "Riwayat Peserta",
    icon: Archive,
    href: "/admin/peserta/riwayat",
  },
  {
    title: "Master Data",
    icon: Database,
    href: "/admin/master-data",
  },
  {
    title: "Pengumuman",
    icon: Bell,
    href: "/admin/pengumuman",
  },
  {
    title: "Laporan",
    icon: FileText,
    href: "/admin/laporan",
  },
  {
    title: "Sertifikat",
    icon: Award,
    href: "/admin/sertifikat",
  },
];

// =====================================================
// SIDEBAR
// =====================================================

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  // ===================================================
  // ACTIVE MENU
  // ===================================================

  function isActive(href: string) {
    if (href === "/admin/peserta") {
      return (
        pathname === href ||
        (pathname.startsWith(`${href}/`) &&
          !pathname.startsWith("/admin/peserta/riwayat"))
      );
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  // ===================================================
  // LOGOUT
  // ===================================================

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    const confirmed = window.confirm(
      "Yakin ingin logout?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoggingOut(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.warn("LOGOUT:", error);

      alert(
        "Gagal logout. Silakan coba lagi."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <motion.aside
      animate={{
        width: open ? 260 : 84,
      }}
      transition={{
        duration: 0.25,
      }}
      className="
        sticky
        top-0
        z-50
        flex
        h-screen
        shrink-0
        flex-col
        overflow-hidden
        border-r
        border-gray-200
        bg-white
        shadow-sm
      "
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <div
        className={`flex h-[88px] shrink-0 items-center border-b border-gray-100 ${
          open
            ? "justify-between px-5"
            : "justify-center px-3"
        }`}
      >

        {/* LOGO + NAMA */}

        <Link
          href="/admin/dashboard"
          className={`flex items-center ${
            open ? "gap-3" : ""
          }`}
        >
          <img
            src="/logo.png"
            alt="Magang-ers Logo"
            className="h-10 w-10 shrink-0 rounded-lg object-contain"
          />

          {open && (
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-blue-600">
                Magang-ers
              </h1>

              <p className="mt-0.5 whitespace-nowrap text-xs text-gray-500">
                Internship Management
              </p>
            </div>
          )}
        </Link>

        {/* TOGGLE SIDEBAR */}

        <button
          type="button"
          onClick={() =>
            setOpen((current) => !current)
          }
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            border
            border-gray-200
            text-gray-600
            transition
            hover:bg-gray-100
          "
          aria-label={
            open
              ? "Tutup sidebar"
              : "Buka sidebar"
          }
        >
          {open ? (
            <ChevronLeft size={18} />
          ) : (
            <ChevronRight size={18} />
          )}
        </button>
      </div>

      {/* =================================================
          MENU
      ================================================= */}

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-2">

          {menus.map((menu) => {
            const Icon = menu.icon;
            const active = isActive(menu.href);

            return (
              <Link
                key={menu.title}
                href={menu.href}
                title={
                  !open
                    ? menu.title
                    : undefined
                }
                className={`
                  flex
                  h-12
                  items-center
                  rounded-xl
                  transition-all
                  duration-200

                  ${
                    open
                      ? "gap-3 px-4"
                      : "justify-center px-2"
                  }

                  ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <Icon
                  size={20}
                  className="shrink-0"
                />

                {open && (
                  <span className="whitespace-nowrap font-medium">
                    {menu.title}
                  </span>
                )}
              </Link>
            );
          })}

        </div>
      </nav>

      {/* =================================================
          FOOTER / LOGOUT
      ================================================= */}

      <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-4">

        <button
          type="button"
          disabled={loggingOut}
          onClick={handleLogout}
          title={
            !open
              ? "Logout"
              : undefined
          }
          className={`
            flex
            w-full
            items-center
            gap-3
            rounded-xl
            px-3
            py-2.5
            text-[15px]
            font-semibold
            text-red-600
            transition
            hover:bg-red-50
            disabled:cursor-not-allowed
            disabled:opacity-50

            ${
              !open
                ? "justify-center"
                : ""
            }
          `}
        >
          <LogOut
            size={18}
            className="shrink-0"
          />

          {open && (
            <span>
              {loggingOut
                ? "Keluar..."
                : "Logout"}
            </span>
          )}
        </button>

      </div>

    </motion.aside>
  );
}