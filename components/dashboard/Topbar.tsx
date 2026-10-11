import { Check } from "lucide-react";

type Step = {
  label: string;
  status: "done" | "current" | "upcoming";
};

const STEPS: Step[] = [
  { label: "Registrasi", status: "done" },
  { label: "Mengajukan", status: "current" },
  { label: "Verifikasi", status: "upcoming" },
  { label: "Diterima", status: "upcoming" },
];

function stepDotClasses(status: Step["status"]) {
  if (status === "done") return "bg-emerald-500 border-emerald-500";
  if (status === "current") return "bg-amber-400 border-amber-400";
  return "bg-red-500 border-red-500";
}

function connectorClasses(status: Step["status"]) {
  return status === "done" ? "bg-emerald-500" : "bg-red-400";
}

type DashboardTopbarProps = {
  userName?: string;
  userLabel?: string;
};

export default function DashboardTopbar({
  userName = "Nama Lengkap",
  userLabel = "Pendaftar Baru",
}: DashboardTopbarProps) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-white to-rose-50 px-8 py-6">
      <div className="flex items-center justify-between gap-6">
        {/* Stepper */}
        <div className="flex flex-1 items-center">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full border-4 border-white shadow ${stepDotClasses(
                    step.status
                  )}`}
                >
                  {step.status === "done" && (
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  )}
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={`mx-2 mt-[-1.25rem] h-0.5 flex-1 ${connectorClasses(
                    step.status
                  )}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
          <div className="text-right leading-tight">
            <p className="text-sm font-bold text-slate-900">{userName}</p>
            <p className="text-xs font-semibold text-red-500">{userLabel}</p>
          </div>
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-slate-200 text-slate-400">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
            </svg>
          </span>
        </div>
      </div>
    </header>
  );
}
