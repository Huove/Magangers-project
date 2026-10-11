import Sidebar from "@/components/aktif/sidebar/SidebarPesertaMagang";
import TopNavbar from "@/components/aktif/topProfile";
import PopupPengumuman from "@/components/aktif/pengumuman/popup";

export default function AktifLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* SIDEBAR */}
      <aside className="h-screen shrink-0">
        <Sidebar />
      </aside>

      {/* AREA KANAN */}
      <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden">
        {/* TOP NAVBAR */}
        <div className="shrink-0">
          <TopNavbar />
        </div>

        {/* HANYA INI YANG SCROLL */}
        <main className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>

        <PopupPengumuman />
      </div>
    </div>
  );
}