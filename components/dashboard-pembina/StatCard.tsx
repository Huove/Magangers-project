import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  iconBg: string;
  label: string;
  value: number | string;
  hint: string;
};

export default function StatCard({
  icon: Icon,
  iconBg,
  label,
  value,
  hint,
}: StatCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <span
        className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${iconBg}`}
      >
        <Icon className="h-6 w-6 text-white" />
      </span>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-extrabold text-slate-900">
          {value}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
      </div>
    </div>
  );
}
