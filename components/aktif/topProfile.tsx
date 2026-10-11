"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  Bell,
  ChevronDown,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type UserProfile = {
  nama: string;
  nomorPeserta: string;
  fotoUrl: string | null;
};

export default function TopNavbar() {
  const [
    profile,
    setProfile,
  ] =
    useState<UserProfile>({
      nama: "Peserta Magang",
      nomorPeserta: "-",
      fotoUrl: null,
    });

  const [
    avatarError,
    setAvatarError,
  ] = useState(false);

  // =========================================
  // FETCH PROFILE
  // =========================================

  useEffect(() => {
    async function fetchProfile() {
      try {
        // =====================================
        // USER
        // =====================================

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          return;
        }

        // =====================================
        // PROFILE
        // =====================================

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(`
            nama_lengkap,
            foto_url
          `)
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        // =====================================
        // PESERTA
        // =====================================

        const {
          data: pesertaData,
          error: pesertaError,
        } = await supabase
          .from("peserta")
          .select(
            "nomor_peserta"
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

        if (pesertaError) {
          console.error(
            "Peserta error:",
            pesertaError
          );
        }

        setProfile({
          nama:
            profileData
              ?.nama_lengkap ||
            "Peserta Magang",

          nomorPeserta:
            pesertaData
              ?.nomor_peserta ||
            "-",

          fotoUrl:
            profileData
              ?.foto_url ||
            null,
        });

        setAvatarError(false);
      } catch (err) {
        console.error(
          "Gagal mengambil profile navbar:",
          err
        );
      }
    }

    fetchProfile();
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-[72px] w-full items-center justify-between border-b border-neutral-200 bg-white/95 px-6 backdrop-blur-md">

      {/* =====================================
          LEFT
      ===================================== */}

      <div>

        <p className="text-sm text-neutral-400">
          Selamat datang,
        </p>

        <p className="text-sm font-semibold text-neutral-900">
          {profile.nama}
        </p>

      </div>

      {/* =====================================
          RIGHT
      ===================================== */}

      <div className="flex items-center gap-3">

        {/* PENGUMUMAN */}

        <Link
          href="/aktif/pengumuman"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-blue-600"
        >
          <Bell size={19} />
        </Link>

        {/* DIVIDER */}

        <div className="hidden h-8 w-px bg-neutral-200 sm:block" />

        {/* PROFILE */}

        <Link
          href="/aktif/profile"
          className="group flex items-center gap-3 rounded-full p-1.5 pr-3 transition hover:bg-neutral-50"
        >

          {/* AVATAR */}

          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100">

            {profile.fotoUrl ? (
              <img
                src={profile.fotoUrl}
                alt={`Foto ${profile.nama}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <User
                size={20}
                strokeWidth={1.7}
                className="text-neutral-400"
              />
            )}

          </div>

          {/* USER */}

          <div className="hidden min-w-0 sm:block">

            <p className="max-w-[150px] truncate text-sm font-semibold text-neutral-800">
              {profile.nama}
            </p>

            <p className="max-w-[150px] truncate text-[11px] text-neutral-400">
              {profile.nomorPeserta}
            </p>

          </div>

          <ChevronDown
            size={15}
            className="hidden text-neutral-400 transition group-hover:text-blue-500 sm:block"
          />

        </Link>

      </div>

    </header>
  );
}