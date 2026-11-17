
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  RefreshCw,
  ClipboardCheck,
  CalendarDays,
  MapPin,
  MessageSquareText,
  LoaderCircle,
  Eye,
  X,
  AlertCircle,
} from "lucide-react";

type Participant = {
  nama_lengkap: string | null;
  email: string | null;
  sekolah: string | null;
  jurusan: string | null;
};

type Schedule = {
  id: string;
  peserta_id: string;
  interviewer: string | null;
  tanggal: string;
  jam: string;
  metode: string | null;
  lokasi: string | null;
  status: string;
  peserta: Participant | null;
};

type ScoreKey =
  | "komunikasi"
  | "motivasi"
  | "kemampuan_dasar"
  | "pemecahan_masalah"
  | "kesiapan_magang";

type Score = {
  id: string;
  jadwal_wawancara_id: string;
  peserta_id: string;
  komunikasi: number | null;
  motivasi: number | null;
  kemampuan_dasar: number | null;
  pemecahan_masalah: number | null;
  kesiapan_magang: number | null;
  catatan: string | null;
  penjelasan: Partial<Record<ScoreKey, string>>;
  updated_at?: string;
};

const CRITERIA: { key: ScoreKey; label: string }[] = [
  { key: "komunikasi", label: "Komunikasi" },
  { key: "motivasi", label: "Motivasi" },
  { key: "kemampuan_dasar", label: "Kemampuan Dasar" },
  { key: "pemecahan_masalah", label: "Pemecahan Masalah" },
  { key: "kesiapan_magang", label: "Kesiapan Magang" },
];

function formatDate(date: string) {
  if (!date) return "-";
  const parsed = new Date(`${date}T00:00:00`);

  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

function averageScore(score: Score): number | null {
  const values = CRITERIA.map((item) => score[item.key]);

  if (values.some((value) => value === null || value === undefined)) {
    return null;
  }

  return Math.round(
    values.reduce<number>((sum, value) => sum + (value ?? 0), 0) /
      values.length
  );
}

function getConclusion(average: number | null) {
  if (average === null) {
    return {
      title: "Nilai belum lengkap",
      description: "Belum semua aspek penilaian diisi oleh admin.",
      style: "border-slate-200 bg-slate-50 text-slate-700",
    };
  }

  if (average >= 85) {
    return {
      title: "Sangat baik — direkomendasikan",
      description:
        "Hasil penilaian sangat baik. Pertimbangkan bersama aspek seleksi lainnya.",
      style: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  if (average >= 70) {
    return {
      title: "Baik — perlu dipertimbangkan",
      description:
        "Hasil penilaian baik dan perlu dipertimbangkan bersama aspek seleksi lainnya.",
      style: "border-blue-200 bg-blue-50 text-blue-800",
    };
  }

  return {
    title: "Perlu evaluasi lebih lanjut",
    description:
      "Hasil penilaian perlu ditinjau kembali sebelum menentukan langkah selanjutnya.",
    style: "border-amber-200 bg-amber-50 text-amber-800",
  };
}

function normalizeScore(item: Record<string, unknown>): Score {
  const keys: ScoreKey[] = [
    "komunikasi",
    "motivasi",
    "kemampuan_dasar",
    "pemecahan_masalah",
    "kesiapan_magang",
  ];

  const explanations =
    item.penjelasan &&
    typeof item.penjelasan === "object" &&
    !Array.isArray(item.penjelasan)
      ? (item.penjelasan as Record<string, unknown>)
      : {};

  const result = {} as Record<ScoreKey, number | null>;

  for (const key of keys) {
    const value = item[key];
    result[key] =
      typeof value === "number"
        ? value
        : typeof value === "string" && value.trim() !== ""
          ? Number(value)
          : null;

    if (result[key] !== null && !Number.isFinite(result[key])) {
      result[key] = null;
    }
  }

  const penjelasan: Partial<Record<ScoreKey, string>> = {};

  for (const key of keys) {
    penjelasan[key] =
      typeof explanations[key] === "string" ? explanations[key] : "";
  }

  return {
    id: String(item.id ?? ""),
    jadwal_wawancara_id: String(item.jadwal_wawancara_id ?? ""),
    peserta_id: String(item.peserta_id ?? ""),
    ...result,
    catatan: typeof item.catatan === "string" ? item.catatan : "",
    penjelasan,
    updated_at:
      typeof item.updated_at === "string" ? item.updated_at : undefined,
  };
}

export default function PenilaianWawancaraPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Schedule | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Sesi login berakhir. Silakan login ulang.");
      }

      const response = await fetch("/api/pembina/penilaian-wawancara", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const text = await response.text();

      let result: {
        schedules?: Schedule[];
        scores?: Record<string, unknown>[];
        message?: string;
        detail?: string;
      };

      try {
        result = JSON.parse(text);
      } catch {
        console.error("Respons API bukan JSON:", response.status, text);
        throw new Error(
          `Respons API tidak valid (HTTP ${response.status}). Pastikan file API sudah dibuat di app/api/pembina/penilaian-wawancara/route.ts.`
        );
      }

      if (!response.ok) {
        throw new Error(
          [result.message, result.detail].filter(Boolean).join(" — ") ||
            `Gagal memuat data (HTTP ${response.status}).`
        );
      }

      const scheduleData = Array.isArray(result.schedules)
        ? result.schedules
        : [];

      const scoreData = Array.isArray(result.scores) ? result.scores : [];

      setSchedules(
        scheduleData.map((item) => ({
          ...item,
          id: String(item.id),
          peserta_id: String(item.peserta_id),
          peserta: item.peserta ?? null,
        }))
      );

      setScores(scoreData.map(normalizeScore));
    } catch (err) {
      setSchedules([]);
      setScores([]);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memuat hasil penilaian wawancara."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredSchedules = schedules.filter((schedule) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;

    return [
      schedule.peserta?.nama_lengkap ?? "",
      schedule.peserta?.email ?? "",
      schedule.peserta?.sekolah ?? "",
      schedule.peserta?.jurusan ?? "",
      schedule.interviewer ?? "",
      schedule.status ?? "",
    ].some((value) => value.toLowerCase().includes(keyword));
  });

  const selectedScore = selected
    ? scores.find(
        (score) => score.jadwal_wawancara_id === selected.id
      ) ?? null
    : null;

  const assessedCount = schedules.filter((schedule) =>
    scores.some((score) => score.jadwal_wawancara_id === schedule.id)
  ).length;

  const selectedAverage = selectedScore
    ? averageScore(selectedScore)
    : null;

  const conclusion = getConclusion(selectedAverage);

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Dashboard Pembina
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Hasil Penilaian Wawancara
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Lihat nilai, penjelasan setiap aspek, dan catatan hasil wawancara
            dari admin.
          </p>
        </div>

        <button
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Muat Ulang
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Jadwal",
            value: schedules.length,
            icon: <CalendarDays className="text-blue-600" size={20} />,
          },
          {
            label: "Sudah Dinilai Admin",
            value: assessedCount,
            icon: <ClipboardCheck className="text-emerald-600" size={20} />,
          },
          {
            label: "Belum Dinilai",
            value: schedules.length - assessedCount,
            icon: <MessageSquareText className="text-amber-600" size={20} />,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{item.label}</p>
              {item.icon}
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Daftar Peserta</h2>
            <p className="mt-1 text-sm text-slate-500">
              Nilai hanya dapat diisi atau diubah oleh admin.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau sekolah..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
            <LoaderCircle className="animate-spin" size={20} />
            Memuat hasil penilaian...
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays className="mx-auto text-slate-300" size={36} />
            <p className="mt-3 font-semibold text-slate-700">
              {error ? "Data gagal dimuat" : "Belum ada jadwal wawancara"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {error
                ? "Periksa pesan error di atas, lalu coba muat ulang."
                : "Jadwal peserta bimbingan akan muncul jika tersedia."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSchedules.map((schedule) => {
              const score =
                scores.find(
                  (item) => item.jadwal_wawancara_id === schedule.id
                ) ?? null;

              const average = score ? averageScore(score) : null;

              return (
                <div
                  key={schedule.id}
                  className="flex flex-col gap-4 p-5 hover:bg-slate-50/70 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">
                        {schedule.peserta?.nama_lengkap ||
                          "Nama belum tersedia"}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          score
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {score ? "Sudah dinilai" : "Belum dinilai"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {schedule.peserta?.sekolah || "Sekolah belum tersedia"}
                      {schedule.peserta?.jurusan
                        ? ` • ${schedule.peserta.jurusan}`
                        : ""}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {formatDate(schedule.tanggal)} • {schedule.jam || "-"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} />
                        {schedule.metode || "Metode belum ditentukan"}
                        {schedule.lokasi ? ` — ${schedule.lokasi}` : ""}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Pewawancara: {schedule.interviewer || "-"}
                    </p>

                    {score && (
                      <p className="mt-2 text-sm font-semibold text-blue-700">
                        Rata-rata nilai:{" "}
                        {average === null ? "Belum lengkap" : `${average}/100`}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setSelected(schedule)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    <Eye size={16} />
                    Lihat Hasil
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Hasil Penilaian Wawancara
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selected.peserta?.nama_lengkap || "Peserta"}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Tutup hasil"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl bg-slate-50 p-4 text-sm">
                <p className="font-semibold text-slate-800">
                  {formatDate(selected.tanggal)} · {selected.jam || "-"}
                </p>
                <p className="mt-1 text-slate-500">
                  {selected.peserta?.sekolah || "Sekolah belum tersedia"}
                  {selected.peserta?.jurusan
                    ? ` — ${selected.peserta.jurusan}`
                    : ""}
                </p>
                <p className="mt-2 text-slate-500">
                  Pewawancara: {selected.interviewer || "-"}
                </p>
              </div>

              {!selectedScore ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
                  <ClipboardCheck className="mx-auto text-amber-600" size={30} />
                  <p className="mt-2 font-semibold text-amber-800">
                    Belum Dinilai
                  </p>
                  <p className="mt-1 text-sm text-amber-700">
                    Admin belum mengisi hasil penilaian wawancara peserta ini.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-800">
                      Rata-rata nilai wawancara
                    </p>
                    <p className="mt-1 text-3xl font-bold text-blue-700">
                      {selectedAverage ?? "—"}
                      <span className="ml-1 text-sm font-medium">/ 100</span>
                    </p>
                    <p className="mt-2 text-xs text-blue-700">
                      Rata-rata dari lima aspek penilaian.
                    </p>
                  </div>

                  <div className={`rounded-xl border p-4 ${conclusion.style}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                      Kesimpulan Rekomendasi
                    </p>
                    <p className="mt-1 font-bold">{conclusion.title}</p>
                    <p className="mt-2 text-sm leading-6">
                      {conclusion.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-3 font-bold text-slate-900">
                      Rincian Penilaian
                    </h3>
                    <div className="space-y-4">
                      {CRITERIA.map((criterion) => {
                        const value = selectedScore[criterion.key];
                        const explanation =
                          selectedScore.penjelasan[criterion.key];

                        return (
                          <div
                            key={criterion.key}
                            className="rounded-xl border border-slate-200 p-4"
                          >
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-slate-700">
                                {criterion.label}
                              </span>
                              <span className="shrink-0 text-sm font-bold text-slate-900">
                                {value === null ? "Belum diisi" : `${value}/100`}
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-blue-600"
                                style={{
                                  width: `${Math.min(100, Math.max(0, value ?? 0))}%`,
                                }}
                              />
                            </div>

                            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Penjelasan Admin
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                              {explanation?.trim() ||
                                "Tidak ada penjelasan untuk aspek ini."}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-700">
                      Catatan Admin
                    </h3>
                    <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                      {selectedScore.catatan?.trim() ||
                        "Tidak ada catatan dari admin."}
                    </div>
                  </div>
                </>
              )}

              <p className="text-xs leading-5 text-slate-400">
                Kesimpulan merupakan rekomendasi berdasarkan rata-rata nilai,
                bukan keputusan kelulusan otomatis.
              </p>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
