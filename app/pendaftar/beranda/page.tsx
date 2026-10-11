
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/components/pendaftar/UserContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  MessageCircle,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// GANTI dengan nomor WhatsApp resmi Customer Service.
// Format: https://wa.me/62XXXXXXXXXX
// Jangan gunakan tanda +, spasi, atau angka 0 di awal nomor.
const CUSTOMER_SERVICE_WHATSAPP = "https://wa.me/6285335074925";

const CUSTOMER_SERVICE_MESSAGE =
  "Halo Customer Service Magang-ers, saya ingin bertanya mengenai jadwal mulai magang.";

function formatTanggal(tanggal: string) {
  const dateOnly = tanggal.slice(0, 10);
  const [year, month, day] = dateOnly.split("-").map(Number);

  if (!year || !month || !day) {
    return tanggal;
  }

  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function BerandaPage() {
  const { status, userData, photo } = useUser();
  const router = useRouter();

  const [tanggalMulaiMagang, setTanggalMulaiMagang] =
    useState<string | null>(null);
  const [loadingTanggal, setLoadingTanggal] = useState(false);
  const [tanggalError, setTanggalError] = useState(false);

  // Ambil tanggal mulai dari API ketika peserta berstatus diterima.
  useEffect(() => {
    if (status !== "diterima") {
      return;
    }

    let cancelled = false;

    async function loadTanggalMulai() {
      setLoadingTanggal(true);
      setTanggalError(false);

      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        const token = sessionData.session?.access_token;

        if (!token) {
          throw new Error("Sesi login tidak ditemukan.");
        }

        const response = await fetch("/api/pendaftar/status", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message || "Gagal mengambil jadwal magang."
          );
        }

        if (!cancelled) {
          setTanggalMulaiMagang(
            typeof result?.tanggal_mulai_magang === "string" &&
              result.tanggal_mulai_magang.trim() !== ""
              ? result.tanggal_mulai_magang
              : null
          );
        }
      } catch (error) {
        console.error("Gagal mengambil tanggal mulai magang:", error);

        if (!cancelled) {
          setTanggalError(true);
        }
      } finally {
        if (!cancelled) {
          setLoadingTanggal(false);
        }
      }
    }

    void loadTanggalMulai();

    return () => {
      cancelled = true;
    };
  }, [status]);

  /* ================= STATUS: PENDAFTAR BARU ================= */
  if (status === "tidak_aktif") {
    return (
      <div className="flex min-h-[calc(100vh-96px)] items-center justify-center bg-gray-50/60 p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl rounded-[28px] border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200">
            <div className="h-10 w-10 rounded-2xl border border-white/30 bg-white/20" />
          </div>

          <div className="mb-4 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
            Status Belum Aktif
          </div>

          <h1 className="mb-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Lengkapi Data Dirimu
          </h1>

          <p className="mx-auto mb-8 max-w-xl leading-relaxed text-gray-500">
            Akun kamu sudah berhasil dibuat. Untuk melanjutkan proses
            pendaftaran magang, silakan lengkapi data pribadi, pendidikan,
            dan unggah dokumen yang diperlukan.
          </p>

          <button
            type="button"
            onClick={() => router.push("/pendaftar/data-diri")}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl active:scale-[0.99]"
          >
            Isi Data Dirimu
          </button>

          <div className="mt-8 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
            {[
              "Lengkapi data pribadi",
              "Lengkapi data pendidikan",
              "Unggah dokumen wajib",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-3 h-2 w-2 rounded-full bg-blue-500" />
                <p className="text-sm font-medium text-gray-800">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  /* ================= STATUS: MENGAJUKAN ================= */
  if (status === "mengajukan") {
    return (
      <div className="flex min-h-[calc(100vh-96px)] items-center justify-center bg-gray-50/60 p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-5xl rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col items-start gap-8 lg:flex-row">
            <div className="flex w-full flex-col items-center lg:w-64 lg:items-start">
              <div className="h-44 w-44 overflow-hidden rounded-[28px] border border-gray-200 bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm">
                {photo ? (
                  <img
                    src={photo}
                    alt="Foto profil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-medium text-gray-400">
                    Tidak ada foto
                  </div>
                )}
              </div>

              <div className="mt-5 w-full rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
                <p className="text-sm font-semibold">Status Saat Ini</p>
                <p className="mt-1 text-sm">
                  Pengajuan sedang menunggu proses verifikasi oleh
                  administrator.
                </p>
              </div>
            </div>

            <div className="w-full flex-1">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-2 text-sm font-semibold text-blue-600">
                    Data Pendaftar
                  </p>

                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {userData?.pribadi?.nama || "Nama Lengkap"}
                  </h1>

                  <p className="mt-2 text-gray-500">
                    Pastikan seluruh data yang dikirim sudah benar dan sesuai
                    dokumen.
                  </p>
                </div>

                <div className="inline-flex h-fit items-center rounded-full border border-yellow-200 bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
                  Mengajukan
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ["Email", userData?.pribadi?.email || "-"],
                  ["No HP", userData?.pribadi?.hp || "-"],
                  ["NIK", userData?.pribadi?.nik || "-"],
                  ["Tempat Lahir", userData?.pribadi?.tempat || "-"],
                  ["Tanggal Lahir", userData?.pribadi?.tanggal || "-"],
                  ["Gender", userData?.pribadi?.gender || "-"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {label}
                    </p>
                    <p className="break-words text-sm font-medium text-gray-900">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-sm">
                    i
                  </div>

                  <div>
                    <p className="font-semibold text-blue-900">
                      Informasi Verifikasi
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-blue-800">
                      Data dan dokumen yang telah dikirim sedang diperiksa
                      oleh tim administrasi. Selama proses verifikasi
                      berlangsung, beberapa data mungkin tidak dapat diubah.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ================= STATUS: DITERIMA ================= */
  if (status === "diterima") {
    const whatsappUrl =
      `${CUSTOMER_SERVICE_WHATSAPP}?text=` +
      encodeURIComponent(CUSTOMER_SERVICE_MESSAGE);

    return (
      <div className="min-h-[calc(100vh-96px)] bg-gray-50/60 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col justify-center gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm sm:p-9"
          >
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={36} />
              </div>

              <div className="flex-1">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 size={16} />
                  Diterima
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Selamat, kamu diterima!
                </h1>

                <p className="mt-2 leading-relaxed text-gray-500">
                  {userData?.pribadi?.nama
                    ? `Halo ${userData.pribadi.nama}, kamu telah diterima sebagai peserta magang.`
                    : "Kamu telah diterima sebagai peserta magang."}{" "}
                  Silakan periksa informasi tanggal mulai magang di bawah ini.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Informasi tanggal mulai magang */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <CalendarDays size={26} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900">
                  Jadwal Mulai Magang
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Informasi jadwal yang telah ditentukan oleh administrator.
                </p>

                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  {loadingTanggal ? (
                    <p className="text-sm text-gray-500">
                      Sedang memuat jadwal magang...
                    </p>
                  ) : tanggalError ? (
                    <div>
                      <p className="font-semibold text-red-700">
                        Jadwal belum dapat dimuat.
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Silakan muat ulang halaman atau hubungi Customer
                        Service.
                      </p>
                    </div>
                  ) : tanggalMulaiMagang ? (
                    <>
                      <p className="text-sm font-medium text-gray-500">
                        Tanggal mulai magangmu
                      </p>
                      <p className="mt-2 text-xl font-bold capitalize text-blue-700 sm:text-2xl">
                        {formatTanggal(tanggalMulaiMagang)}
                      </p>
                    </>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
                      <p className="font-medium leading-relaxed text-amber-800">
                        Tunggu hingga admin memasangkan tanggal mulai magangmu
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Customer Service */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <MessageCircle size={26} />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">
                  Butuh Bantuan?
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  Hubungi Customer Service Magang-ers jika kamu memiliki
                  pertanyaan mengenai penerimaan atau jadwal mulai magang.
                </p>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <MessageCircle size={19} />
                Hubungi Customer Service
                <ArrowUpRight size={17} />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ================= STATUS LAIN ================= */
  return (
    <div className="flex min-h-[calc(100vh-96px)] items-center justify-center bg-gray-50/60 p-6">
      <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="mb-2 text-sm font-semibold text-gray-500">
          Status Saat Ini
        </p>
        <h2 className="text-3xl font-bold capitalize text-gray-900">
          {status}
        </h2>
      </div>
    </div>
  );
}
