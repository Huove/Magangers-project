import Link from "next/link";

import {
  ClipboardCheck,
  CalendarDays,
  Bell,
  FileText,
} from "lucide-react";

// =====================================================
// QUICK ACTION DATA
// =====================================================

const actions = [
  {
    title: "Periksa Pengajuan",
    desc: "Review data dan dokumen peserta.",
    href: "/admin/pelamar",
    icon: ClipboardCheck,
    color: "bg-blue-600",
  },
  {
    title: "Jadwal Wawancara",
    desc: "Kelola jadwal interview peserta.",
    href: "/admin/wawancara",
    icon: CalendarDays,
    color: "bg-violet-600",
  },
  {
    title: "Buat Pengumuman",
    desc: "Informasikan peserta magang.",
    href: "/admin/pengumuman",
    icon: Bell,
    color: "bg-emerald-600",
  },
  {
    title: "Lihat Laporan",
    desc: "Rekap seluruh aktivitas magang.",
    href: "/admin/laporan",
    icon: FileText,
    color: "bg-orange-500",
  },
];

// =====================================================
// COMPONENT
// =====================================================

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      {/* HEADER */}

      <div className="mb-6">
        <h2 className="text-lg font-semibold">
          Quick Action
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Akses cepat ke menu administrator.
        </p>
      </div>

      {/* ACTIONS */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        {actions.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-2xl border border-gray-200 p-5 transition duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-md"
            >

              {/* ICON */}

              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}
              >
                <Icon
                  size={22}
                  className="text-white"
                />
              </div>

              {/* TITLE */}

              <h3 className="font-semibold text-gray-900 transition group-hover:text-blue-600">
                {item.title}
              </h3>

              {/* DESCRIPTION */}

              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {item.desc}
              </p>

            </Link>
          );
        })}

      </div>

    </div>
  );
}