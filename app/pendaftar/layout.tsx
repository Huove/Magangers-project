"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/pendaftar/Sidebar";
import Topbar from "@/components/pendaftar/Topbar";
import TopLoadingBar from "@/components/pendaftar/TopLoadingBar";
import PageTransition from "@/components/pendaftar/PageTransition";
import {
  UserProvider,
  useUser,
} from "@/components/pendaftar/UserContext";
import RevisiPopup from "@/components/pendaftar/RevisiPopup";

function PendaftarRedirect({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const {
    status,
    refreshFromServer,
  } = useUser();

  useEffect(() => {
    refreshFromServer();
  }, []);

  useEffect(() => {
    if (status === "aktif") {
      router.replace("/aktif/dashboard");
    }
  }, [status, router]);

  // Jangan tampilkan halaman pendaftar
  // jika peserta sudah aktif.
  if (status === "aktif") {
    return null;
  }

  return <>{children}</>;
}

export default function PendaftarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <PendaftarRedirect>
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <TopLoadingBar />
            <Topbar />

            <main className="min-h-0 flex-1 overflow-y-auto">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
          </div>
        </div>

        {/* Popup revisi global */}
        <RevisiPopup />
      </PendaftarRedirect>
    </UserProvider>
  );
}