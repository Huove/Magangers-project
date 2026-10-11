"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import Sidebar from "@/components/admin/layout/Sidebar";
import Topbar from "@/components/admin/layout/Topbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        // 1. Cek apakah ada user yang sedang login
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/masuk");
          return;
        }

        // 2. Ambil profile berdasarkan ID Auth
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, nama_lengkap, email, role")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          console.error("PROFILE ERROR:", profileError);

          await supabase.auth.signOut();
          router.replace("/masuk");
          return;
        }

        console.log("ADMIN PROFILE:", profile);

        // 3. Pastikan role adalah admin
        if (profile.role !== "admin") {
          console.warn("Akses ditolak. Role:", profile.role);

          router.replace("/masuk");
          return;
        }

        // 4. User memang admin
        setAuthorized(true);
      } catch (error) {
        console.error("ADMIN AUTH ERROR:", error);
        router.replace("/masuk");
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [router]);

  // Jangan tampilkan dashboard sebelum pengecekan selesai
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="text-sm text-gray-500">
            Memeriksa akses...
          </p>
        </div>
      </div>
    );
  }

  // Kalau bukan admin
  if (!authorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Topbar />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}