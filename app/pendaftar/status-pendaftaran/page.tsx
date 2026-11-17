// app/pendaftar/status-pendaftaran/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/components/pendaftar/UserContext";
import { motion } from "framer-motion";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
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
  StickyNote,
  ClipboardList,
  Send,
  Loader2,
  FileUp,
  Paperclip,
} from "lucide-react";

export default function StatusPendaftaranPage() {
  const user = useUser();

  const status = user?.status ?? "tidak_aktif";
  const latestPengajuanStatus = user?.latestPengajuanStatus ?? null;
  const revisiNote = user?.revisiNote ?? "";
  const jadwalWawancara = user?.jadwalWawancara ?? null;

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return null;
    return createClient(url, anon);
  }, []);

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
      message: "Pengajuan Anda sedang diperiksa oleh administrator. Silakan menunggu konfirmasi admin.",
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
      color: "bg-green-500",
      textColor: "text-green-700",
      light: "bg-green-50 border-green-200",
      title: "Peserta Magang Aktif",
      message: "Anda sudah menjadi peserta magang aktif.",
      icon: CheckCircle2,
      step: 5,
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
  const Icon = config?.icon ?? Clock3;

  const steps = ["Registrasi", "Pengajuan", "Verifikasi", "Wawancara", "Selesai"];

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

  const formatTanggalJam = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const catatanWawancara = useMemo(() => (jadwalWawancara?.catatan ?? "").trim(), [jadwalWawancara?.catatan]);
  const tugasWawancara = useMemo(() => (jadwalWawancara?.tugas ?? "").trim(), [jadwalWawancara?.tugas]);
  const existingJawaban = useMemo(
    () => (jadwalWawancara?.jawaban_tugas ?? "").trim(),
    [jadwalWawancara?.jawaban_tugas]
  );

  const existingFileUrl = (jadwalWawancara as any)?.jawaban_tugas_file_url || "";
  const existingFileName = (jadwalWawancara as any)?.jawaban_tugas_file_name || "";

  const [jawabanTugas, setJawabanTugas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [fileJawaban, setFileJawaban] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    setJawabanTugas(existingJawaban || "");
  }, [jadwalWawancara?.id, existingJawaban]);

  const refreshUser = async () => {
    if (typeof (user as any)?.refreshFromServer === "function") return (user as any).refreshFromServer();
    if (typeof (user as any)?.refresh === "function") return (user as any).refresh();
  };

  const handleSubmitTugasText = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      if (!jadwalWawancara?.id) {
        setSubmitError("Jadwal wawancara tidak ditemukan.");
        return;
      }

      if (!tugasWawancara) {
        setSubmitError("Tugas belum tersedia dari admin.");
        return;
      }

      const trimmed = jawabanTugas.trim();
      if (!trimmed) {
        setSubmitError("Jawaban tugas tidak boleh kosong.");
        return;
      }

      if (!supabase) {
        setSubmitError("Konfigurasi Supabase belum ada (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).");
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const token = sessionData.session?.access_token;
      if (!token) {
        setSubmitError("Sesi login tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await fetch("/api/pendaftar/wawancara/tugas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jadwal_wawancara_id: jadwalWawancara.id,
          jawaban_tugas: trimmed,
        }),
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setSubmitError(json?.error || "Gagal mengirim jawaban tugas.");
        return;
      }

      setSubmitSuccess(existingJawaban ? "Jawaban berhasil diperbarui." : "Jawaban berhasil dikirim.");
      await refreshUser();
    } catch (e: any) {
      setSubmitError(e?.message || "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadFile = async () => {
    try {
      setUploadingFile(true);
      setUploadError(null);
      setUploadSuccess(null);

      if (!jadwalWawancara?.id) {
        setUploadError("Jadwal wawancara tidak ditemukan.");
        return;
      }
      if (!tugasWawancara) {
        setUploadError("Tugas belum tersedia dari admin.");
        return;
      }
      if (!fileJawaban) {
        setUploadError("Pilih file terlebih dahulu.");
        return;
      }
      if (!supabase) {
        setUploadError("Konfigurasi Supabase belum ada.");
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const token = sessionData.session?.access_token;
      if (!token) {
        setUploadError("Sesi login tidak ditemukan. Silakan login ulang.");
        return;
      }

      const fd = new FormData();
      fd.append("jadwal_wawancara_id", jadwalWawancara.id);
      fd.append("file", fileJawaban);

      // optional: ikut simpan teks jawaban kalau diisi
      if (jawabanTugas.trim()) fd.append("jawaban_tugas", jawabanTugas.trim());

      const res = await fetch("/api/pendaftar/wawancara/tugas-file", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setUploadError(json?.error || "Gagal upload file.");
        return;
      }

      setUploadSuccess("File berhasil diupload.");
      setFileJawaban(null);
      await refreshUser();
    } catch (e: any) {
      setUploadError(e?.message || "Terjadi kesalahan.");
    } finally {
      setUploadingFile(false);
    }
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
                  <Link
                    href="/pendaftar/pengajuan-magang"
                    className="inline-flex items-center justify-center rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-700"
                  >
                    Ajukan Ulang Pengajuan
                  </Link>
                  <Link
                    href="/pendaftar/dokumen"
                    className="inline-flex items-center justify-center rounded-full border border-amber-300 bg-white px-5 py-3 text-sm font-semibold text-amber-800 hover:bg-amber-100/40"
                  >
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

                    {/* CATATAN ADMIN */}
                    {catatanWawancara && (
                      <div className="rounded-2xl border border-purple-100 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                            <StickyNote className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">Catatan Admin</p>
                            <p className="mt-1 whitespace-pre-line text-sm text-gray-700 leading-relaxed">{catatanWawancara}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ✅ TUGAS (TEKS + FILE) */}
                    <div className="rounded-2xl border border-purple-100 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 border border-purple-100">
                          <ClipboardList className="h-5 w-5" />
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900">Tugas dari Admin</p>

                            {jadwalWawancara.jawaban_tugas_submitted_at && (
                              <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 text-xs font-semibold">
                                Terakhir submit: {formatTanggalJam(jadwalWawancara.jawaban_tugas_submitted_at)}
                              </span>
                            )}
                          </div>

                          {tugasWawancara ? (
                            <p className="mt-2 whitespace-pre-line text-sm text-gray-700 leading-relaxed">{tugasWawancara}</p>
                          ) : (
                            <div className="mt-2 rounded-xl border border-purple-100 bg-purple-50 px-4 py-3 text-sm text-purple-800">
                              Admin belum memberikan tugas.
                            </div>
                          )}

                          {/* Jawaban teks */}
                          <div className="mt-4">
                            <label className="block text-xs font-semibold text-gray-600 mb-2">Jawaban Teks (opsional)</label>
                            <textarea
                              value={jawabanTugas}
                              onChange={(e) => setJawabanTugas(e.target.value)}
                              rows={6}
                              placeholder="Tulis jawaban tugas di sini (opsional jika hanya upload file)..."
                              className="w-full rounded-2xl border border-purple-100 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-purple-200"
                              disabled={!tugasWawancara}
                            />

                            {submitError && (
                              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {submitError}
                              </div>
                            )}
                            {submitSuccess && (
                              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                {submitSuccess}
                              </div>
                            )}

                            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                onClick={handleSubmitTugasText}
                                disabled={submitting || !tugasWawancara}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                              >
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Kirim Jawaban Teks
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setJawabanTugas(existingJawaban || "");
                                  setSubmitError(null);
                                  setSubmitSuccess(null);
                                }}
                                className="inline-flex items-center justify-center rounded-full border border-purple-200 bg-white px-5 py-3 text-sm font-semibold text-purple-800 hover:bg-purple-50"
                                disabled={!tugasWawancara}
                              >
                                Reset Teks
                              </button>
                            </div>
                          </div>

                          {/* Upload file */}
                          <div className="mt-6 border-t border-purple-100 pt-4">
                            <div className="flex items-center gap-2">
                              <FileUp className="h-4 w-4 text-purple-700" />
                              <p className="text-sm font-semibold text-gray-900">Upload File Jawaban</p>
                            </div>
                            <p className="mt-1 text-xs text-gray-600">Maks 10MB. Format bebas (PDF/DOCX/ZIP, dll).</p>

                            {(existingFileUrl || existingFileName) && (
                              <div className="mt-3 rounded-2xl border border-purple-100 bg-purple-50 p-3">
                                <div className="flex items-start gap-2">
                                  <Paperclip className="h-4 w-4 text-purple-700 mt-0.5" />
                                  <div className="min-w-0">
                                    <p className="text-xs text-gray-600">File terkirim:</p>
                                    {existingFileUrl ? (
                                      <a
                                        href={existingFileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-sm font-semibold text-purple-700 underline break-all"
                                      >
                                        {existingFileName || existingFileUrl}
                                      </a>
                                    ) : (
                                      <p className="text-sm font-semibold text-gray-800 break-all">{existingFileName}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            <input
                              type="file"
                              onChange={(e) => setFileJawaban(e.target.files?.[0] || null)}
                              className="mt-3 block w-full text-sm"
                              disabled={!tugasWawancara}
                            />

                            {fileJawaban && (
                              <p className="mt-2 text-xs text-gray-600">
                                Dipilih: <span className="font-semibold">{fileJawaban.name}</span>
                              </p>
                            )}

                            {uploadError && (
                              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {uploadError}
                              </div>
                            )}
                            {uploadSuccess && (
                              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                {uploadSuccess}
                              </div>
                            )}

                            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                onClick={handleUploadFile}
                                disabled={uploadingFile || !tugasWawancara}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                              >
                                {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Upload File
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setFileJawaban(null);
                                  setUploadError(null);
                                  setUploadSuccess(null);
                                }}
                                className="inline-flex items-center justify-center rounded-full border border-purple-200 bg-white px-5 py-3 text-sm font-semibold text-purple-800 hover:bg-purple-50"
                                disabled={!tugasWawancara}
                              >
                                Reset File
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          jadwalWawancara.status === "Dijadwalkan"
                            ? "bg-blue-100 text-blue-700"
                            : jadwalWawancara.status === "Selesai"
                              ? "bg-green-100 text-green-700"
                              : jadwalWawancara.status === "Lulus"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {jadwalWawancara.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CalendarDays className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                    <p className="text-sm text-purple-700">Jadwal wawancara Anda sedang disiapkan oleh admin. Silakan cek kembali nanti.</p>
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
                <div
                  className={`h-full rounded-full transition-all duration-500 ${config.color}`}
                  style={{ width: `${(Math.min(config.step, 5) / 5) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {steps.map((step, index) => {
                  const active = index < config.step;
                  return (
                    <div key={step} className="text-center">
                      <div
                        className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border transition-all duration-300 ${
                          active ? `${config.color} text-white border-transparent` : "bg-white text-gray-400 border-gray-200"
                        }`}
                      >
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