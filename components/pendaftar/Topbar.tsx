"use client";

import { useUser } from "./UserContext";

const steps = [
  { key: "registrasi", label: "Registrasi" },
  { key: "mengajukan", label: "Mengajukan" },
  { key: "verifikasi", label: "Verifikasi" },
  { key: "wawancara", label: "Wawancara" },
  { key: "diterima", label: "Diterima" },
];

const statusLabelMap: Record<string, string> = {
  tidak_aktif: "Pendaftar Baru",
  mengajukan: "Mengajukan",
  verifikasi: "Verifikasi",
  wawancara: "Wawancara",
  diterima: "Diterima",
  ditolak: "Ditolak",
  aktif: "Verifikasi",
  selesai: "Selesai",
};

export default function Topbar() {
  const { status, photo, userData } = useUser();

  // normalize kalau status enum lama masih ada
  const normalizedStatus = status === "aktif" ? "verifikasi" : status;

  let currentIndex = 0;
  if (normalizedStatus === "tidak_aktif") currentIndex = 1;
  if (normalizedStatus === "mengajukan") currentIndex = 2;
  if (normalizedStatus === "verifikasi") currentIndex = 3;
  if (normalizedStatus === "wawancara") currentIndex = 4;
  if (normalizedStatus === "diterima") currentIndex = 5;

  const displayName = userData?.pribadi?.nama || "Nama Lengkap";
  const initial = displayName?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 h-24 bg-white/95 backdrop-blur border-b border-gray-200 shadow-sm">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        {/* ================= TIMELINE ================= */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-max flex items-center py-2">
            {steps.map((step, i) => {
              let dotColor = "bg-red-400 border-red-100";

              if (i < currentIndex - 1) {
                dotColor = "bg-green-500 border-green-100";
              }

              if (i === currentIndex - 1) {
                dotColor = "bg-yellow-400 border-yellow-100 ring-4 ring-yellow-100";
              }

              if (normalizedStatus === "diterima") {
                dotColor = "bg-green-500 border-green-100";
              }

              const lineCompleted = i < currentIndex - 1 || normalizedStatus === "diterima";

              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center w-24 sm:w-28">
                    <span
                      className={`text-[11px] sm:text-xs mb-2 font-medium whitespace-nowrap ${
                        i < currentIndex - 1 || normalizedStatus === "diterima"
                          ? "text-green-700"
                          : i === currentIndex - 1
                          ? "text-yellow-700"
                          : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </span>

                    <div
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${dotColor}`}
                    />
                  </div>

                  {i !== steps.length - 1 && (
                    <div className="w-12 sm:w-16 lg:w-20 mx-1">
                      <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            lineCompleted ? "bg-green-500 w-full" : "bg-red-300 w-full"
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= USER INFO ================= */}
        <div className="shrink-0 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 leading-none">
              {displayName}
            </p>

            <div className="mt-1 flex justify-end">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  normalizedStatus === "diterima"
                    ? "bg-green-100 text-green-700"
                    : normalizedStatus === "wawancara"
                    ? "bg-purple-100 text-purple-700"
                    : normalizedStatus === "verifikasi"
                    ? "bg-blue-100 text-blue-700"
                    : normalizedStatus === "mengajukan"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {statusLabelMap[normalizedStatus] ?? normalizedStatus}
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200 ring-2 ring-white shadow-sm">
              {photo ? (
                <img src={photo} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">
                  {initial}
                </div>
              )}
            </div>

            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
          </div>
        </div>
      </div>
    </header>
  );
}