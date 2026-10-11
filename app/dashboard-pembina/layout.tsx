import PembinaSidebar from "@/components/dashboard-pembina/Sidebar";

export default function PembinaDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="h-screen shrink-0">
        <PembinaSidebar />
      </aside>
      <main className="min-w-0 min-h-0 flex-1 overflow-y-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}