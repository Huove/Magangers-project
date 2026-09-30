"use client";

import Sidebar from "@/components/pendaftar/Sidebar";
import Topbar from "@/components/pendaftar/Topbar";
import TopLoadingBar from "@/components/pendaftar/TopLoadingBar";
import PageTransition from "@/components/pendaftar/PageTransition";
import { UserProvider } from "@/components/pendaftar/UserContext";
import RevisiPopup from "@/components/pendaftar/RevisiPopup" // ✅ tambah ini

export default function PendaftarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopLoadingBar />
          <Topbar />

          <main className="min-h-0 flex-1 overflow-y-auto">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>

      {/* ✅ Popup revisi global, tapi hanya muncul jika latestPengajuanStatus === "revisi" */}
      <RevisiPopup />
    </UserProvider>
  );
}