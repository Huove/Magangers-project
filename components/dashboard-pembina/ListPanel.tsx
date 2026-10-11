export default function ListPanel({
  title,
  children,
  href = "#",
}: {
  title: string;
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <a
          href={href}
          className="text-sm font-semibold text-brand-blue hover:underline"
        >
          Lihat semua
        </a>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}
