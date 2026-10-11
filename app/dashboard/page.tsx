import { FileText, GraduationCap, ChevronRight, ClipboardCheck } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="relative">
      {/* Decorative dotted grids */}
      <div className="pointer-events-none absolute -right-4 top-0 -z-10 h-40 w-40 opacity-40 [background-image:radial-gradient(circle,theme(colors.blue.300)_1.5px,transparent_1.5px)] [background-size:14px_14px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 -z-10 h-40 w-40 opacity-30 [background-image:radial-gradient(circle,theme(colors.blue.300)_1.5px,transparent_1.5px)] [background-size:14px_14px]" />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: profile card + actions */}
        <div>
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row">
              <dl className="space-y-2 text-sm text-slate-700">
                <div className="flex gap-1">
                  <dt className="font-medium">Nama :</dt>
                  <dd>Nama Lengkap</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="font-medium">Email :</dt>
                  <dd>-</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="font-medium">No HP :</dt>
                  <dd>-</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="font-medium">No Pendaftaran :</dt>
                  <dd>-</dd>
                </div>
                <div className="pt-3">
                  <div className="flex gap-1">
                    <dt className="font-medium">Pembimbing :</dt>
                    <dd>-</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt className="font-medium">Status :</dt>
                    <dd className="font-semibold text-red-500">Tidak Aktif</dd>
                  </div>
                </div>
              </dl>

              <div className="flex flex-col items-center gap-1 self-start">
                <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 text-blue-400">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-11 w-11"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
                  </svg>
                </div>
                <span className="text-sm text-slate-400">-</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 space-y-4">
            <a
              href="/dashboard/data-diri"
              className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 font-semibold text-white shadow-lg shadow-blue-600/25 transition-transform hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                Isi Data Lengkapmu!
              </span>
              <ChevronRight className="h-5 w-5" />
            </a>

            <a
              href="/dashboard/pendidikan"
              className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-4 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-transform hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5" />
                Isi Data Pendidikanmu!
              </span>
              <ChevronRight className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Right: decorative illustration */}
        <div className="hidden items-center justify-center lg:flex">
          <div className="relative">
            <div className="absolute -inset-10 -z-10 rounded-full bg-blue-100/60 blur-2xl" />
            <div className="flex h-56 w-44 -rotate-6 flex-col gap-3 rounded-3xl border-8 border-blue-500 bg-white p-5 shadow-xl">
              <span className="mx-auto -mt-9 grid h-8 w-16 place-items-center rounded-full bg-blue-400 shadow" />
              <ClipboardCheck className="mx-auto mt-2 h-8 w-8 text-blue-400" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="h-2 flex-1 rounded-full bg-blue-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
