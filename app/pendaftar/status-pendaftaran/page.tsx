"use client";

import { useUser } from "@/components/pendaftar/UserContext";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Clock3,
  Search,
  ShieldCheck,
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Video,
  MapPin,
  User,
} from "lucide-react";

export default function StatusPendaftaranPage() {
  const { status, latestPengajuanStatus, revisiNote, jadwalWawancara } = useUser();

  const pageStatus = latestPengajuanStatus === "revisi" ? "revisi" : status;

  const statusConfig: Record<string, any> = {
    tidak_aktif: {
      color: "bg-gray-400",
      textColor: "text-gray-700",
      light: "bg-gray-50 border-gray-200",
      title: "Belum Aktif",
      message: "Silakan lengkapi data diri dan ajukan magang untuk memulai proses.",
      icon: Clock3,
      step: 1,
    },
    mengajukan: {
      color: "bg-yellow-400",
      textColor: "text-yellow-700",
      light: "bg-yellow-50 border-yellow-200",
      title: "Mengajukan",
      message: "Pengajuan Anda sedang diperiksa oleh administrator.",
      icon: Search,
      step: 2,
    },
    revisi: {
      color: "bg-amber-500",
      textColor: "text-amber-700",
      light: "bg-amber-50 border-amber-200",
      title: "Revisi",
      message: "Pengajuan Anda perlu diperbaiki. Silakan baca catatan revisi dari admin, lalu ajukan ulang.",
      icon: AlertTriangle,
      step: 2,
    },
    verifikasi: {
      color: "bg-blue-500",
      textColor: "text-blue-700",
      light: "bg-blue-50 border-blue-200",
      title: "Verifikasi",
      message: "Data Anda sedang diverifikasi oleh tim kami.",
      icon: ShieldCheck,
      step: 3,
    },
    wawancara: {
      color: "bg-purple-500",
      textColor: "text-purple-700",
      light: "bg-purple-50 border-purple-200",
      title: "Wawancara",
      message: "Selamat! Anda lolos tahap verifikasi dan akan menjalani tahap wawancara.",
      icon: CalendarDays,
      step: 4,
    },
    diterima: {
      color: "bg-green-500",
      textColor: "text-green-700",
      light: "bg-green-50 border-green-200",
      title: "Diterima",
      message: "Selamat! Anda telah diterima sebagai peserta magang.",
      icon: CheckCircle2,
      step: 5,
    },
    ditolak: {
      color: "bg-red-500",
      textColor: "text-red-700",
      light: "bg-red-50 border-red-200",
      title: "Ditolak",
      message: "Mohon maaf, pengajuan Anda belum dapat kami terima.",
      icon: XCircle,
      step: 5,
    },
    aktif: {
      color: "bg-blue-500",
      textColor: "text-blue-700",
      light: "bg-blue-50 border-blue-200",
      title: "Verifikasi",
      message: "Data Anda sedang diverifikasi oleh tim kami.",
      icon: ShieldCheck,
      step: 3,
    },
    selesai: {
      color: "bg-green-500",
      textColor: "text-green-700",
      light: "bg-green-50 border-green-200",
      title: "Selesai",
      message: "Proses pendaftaran sudah selesai.",
      icon: CheckCircle2,
      step: 5,
    },
  };

  const config = statusConfig[pageStatus] ?? statusConfig.tidak_aktif;
  const Icon = config.icon;

  const steps = ["Registrasi", "Pengajuan", "Verifikasi", "Wawancara", "Selesai"];

  // Format tanggal
  const formatTanggal = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-sm"
        >
          <div className={`absolute inset-0 opacity-[0.06] ${config.color}`} />

          <div className="relative p-6 sm:p-8 lg:p-10">
            {/* Header */}
            <div className="text-center">
              <div className={`mx-auto mb-5 w-20 h-20 rounded-3xl flex items-center justify-center border ${config.light}`}>
                <Icon className={`w-10 h-10 ${config.textColor}`} />
              </div>

              <p className="text-sm font-semibold text-gray-500 mb-2">Status Pendaftaran</p>

              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{config.title}</h1>

              <div className="mt-4">
                <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${config.light} ${config.textColor}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
                  {config.title}
                </span>
              </div>

              <p className="mt-6 text-gray-600 leading-relaxed max-w-2xl mx-auto">{config.message}</p>
            </div>

            {/* Catatan Revisi */}
            {pageStatus === "revisi" && (
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-left">
                <h3 className="font-semibold text-amber-900">Catatan Revisi dari Admin</h3>
                <p className="mt-2 text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
                  {revisiNote?.trim() ? revisiNote : "Admin belum menuliskan catatan revisi."}
                </p>
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                  <Link href="/pendaftar/pengajuan-magang" className="inline-flex items-center justify-center rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700">
                    Ajukan Ulang Pengajuan
                  </Link>
                  <Link href="/pendaftar/dokumen" className="inline-flex items-center justify-center rounded-full border border-amber-300 bg-white px-5 py-3 text-sm font-semibold text-amber-800 hover:bg-amber-100/40">
                    Cek / Upload Dokumen
                  </Link>
                </div>
              </div>
            )}

            {/* Info Jadwal Wawancara */}
            {pageStatus === "wawancara" && (
              <div className="mt-6 rounded-3xl border border-purple-200 bg-purple-50 p-5 text-left">
                <h3 className="font-semibold text-purple-900 mb-3">
                  {jadwalWawancara ? "Jadwal Wawancara Anda" : "Menunggu Jadwal Wawancara"}
                </h3>

                {jadwalWawancara ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 border border-purple-100">
                        <User className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-xs text-gray-500">Interviewer</p>
                          <p className="text-sm font-medium text-gray-900">{jadwalWawancara.interviewer}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 border border-purple-100">
                        <CalendarDays className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-xs text-gray-500">Tanggal</p>
                          <p className="text-sm font-medium text-gray-900">{formatTanggal(jadwalWawancara.tanggal)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 border border-purple-100">
                        <Clock3 className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-xs text-gray-500">Jam</p>
                          <p className="text-sm font-medium text-gray-900">{jadwalWawancara.jam}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 border border-purple-100">
                        {jadwalWawancara.metode === "Online" ? (
                          <Video className="w-5 h-5 text-purple-600" />
                        ) : (
                          <MapPin className="w-5 h-5 text-purple-600" />
                        )}
                        <div>
                          <p className="text-xs text-gray-500">Metode</p>
                          <p className="text-sm font-medium text-gray-900">{jadwalWawancara.metode}</p>
                        </div>
                      </div>

                      {jadwalWawancara.lokasi && (
                        <div className="sm:col-span-2 flex items-center gap-3 rounded-2xl bg-white p-3 border border-purple-100">
                          <MapPin className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-xs text-gray-500">Lokasi / Link</p>
                            <p className="text-sm font-medium text-gray-900 break-all">{jadwalWawancara.lokasi}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        jadwalWawancara.status === "Dijadwalkan" ? "bg-blue-100 text-blue-700" :
                        jadwalWawancara.status === "Selesai" ? "bg-green-100 text-green-700" :
                        jadwalWawancara.status === "Lulus" ? "bg-emerald-100 text-emerald-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {jadwalWawancara.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CalendarDays className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                    <p className="text-sm text-purple-700">
                      Jadwal wawancara Anda sedang disiapkan oleh admin. Silakan cek kembali nanti.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Progress */}
            <div className="mt-10 rounded-3xl border border-gray-200 bg-gray-50 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Progress Pendaftaran</h2>
                <span className="text-sm font-medium text-gray-600">Tahap {Math.min(config.step, 5)} / 5</span>
              </div>

              <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden mb-6">
                <div className={`h-full rounded-full transition-all duration-500 ${config.color}`} style={{ width: `${(Math.min(config.step, 5) / 5) * 100}%` }} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {steps.map((step, index) => {
                  const active = index < config.step;
                  return (
                    <div key={step} className="text-center">
                      <div className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border transition-all duration-300 ${active ? `${config.color} text-white border-transparent` : "bg-white text-gray-400 border-gray-200"}`}>
                        {index + 1}
                      </div>
                      <p className={`mt-2 text-xs font-medium ${active ? "text-gray-900" : "text-gray-400"}`}>{step}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Information card */}
            <div className={`mt-6 rounded-3xl border p-5 ${config.light}`}>
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${config.color} text-white shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className={`font-semibold ${config.textColor}`}>Informasi Tahap Saat Ini</h3>
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">{config.message}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}