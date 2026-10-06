"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/pendaftar/Sidebar";
import Topbar from "@/components/pendaftar/Topbar";
import TopLoadingBar from "@/components/pendaftar/TopLoadingBar";
import PageTransition from "@/components/pendaftar/PageTransition";
import RevisiPopup from "@/components/pendaftar/RevisiPopup";

import {
  UserProvider,
  useUser,
} from "@/components/pendaftar/UserContext";

// =====================================================
// REDIRECT HANDLER
// =====================================================

function PendaftarRedirectGuard() {
  const router = useRouter();

  const {
    status,
    loadingStatus,
  } = useUser();

  useEffect(() => {
    // Jangan melakukan redirect sebelum
    // status dari server selesai diperiksa.
    if (loadingStatus) {
      return;
    }

    // HANYA peserta yang benar-benar aktif
    // yang diarahkan ke dashboard peserta aktif.
    if (status === "aktif") {
      router.replace("/aktif/dashboard");
    }
  }, [
    status,
    loadingStatus,
    router,
  ]);

  return null;
}

// =====================================================
// LOADING STATUS
// =====================================================

function PendaftarStatusLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

        <p className="text-sm font-medium text-gray-600">
          Memeriksa status peserta...
        </p>

        <p className="mt-1 text-xs text-gray-400">
          Mohon tunggu sebentar
        </p>
      </div>
    </div>
  );
}

// =====================================================
// LAYOUT CONTENT
// =====================================================

function PendaftarLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    status,
    loadingStatus,
  } = useUser();

  // Redirect guard berada DI DALAM UserProvider.
  // Jadi useUser() aman digunakan.
  //
  // Kita tetap render guard walaupun loading.
  // Guard sendiri tidak akan redirect selama loading.
  if (loadingStatus) {
    return <PendaftarStatusLoading />;
  }

  // Kalau sudah aktif, redirect sedang dijalankan.
  // Jangan tampilkan halaman pendaftar sebentar.
  if (status === "aktif") {
    return null;
  }

  return (
    <>
      <PendaftarRedirectGuard />

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
    </>
  );
}

// =====================================================
// MAIN LAYOUT
// =====================================================

export default function PendaftarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <PendaftarLayoutContent>
        {children}
      </PendaftarLayoutContent>
    </UserProvider>
  );
}