
"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  ClipboardCheck,
  RefreshCw,
  Search,
  Save,
  LoaderCircle,
  X,
  Pencil,
  Eye,
  CheckCircle2,
  Clock,
} from "lucide-react";

const CRITERIA = [
  { key: "komunikasi", label: "Komunikasi" },
  { key: "motivasi", label: "Motivasi" },
  { key: "kemampuan_dasar", label: "Kemampuan Dasar" },
  { key: "pemecahan_masalah", label: "Problem Solving" },
  { key: "kesiapan_magang", label: "Kesiapan Magang" },
] as const;

type ScoreKey = (typeof CRITERIA)[number]["key"];

type Interview = {
  jadwal_id: string;
  peserta_id: string;
  nama: string;
  email: string;
  sekolah: string;
  posisi: string;
  interviewer: string;
  tanggal: string;
  jam: string;
  metode: string;
  lokasi: string;
  status: string;
};

type Score = {
  id?: string;
  jadwal_wawancara_id: string;
  peserta_id: string;
  komunikasi: number;
  motivasi: number;
  kemampuan_dasar: number;
  pemecahan_masalah: number;
  kesiapan_magang: number;
  catatan: string;
  penjelasan: Record<string, string>;
};

type ScoreForm = Record<ScoreKey, number> & {
  catatan: string;
};

const EMPTY_SCORE: ScoreForm = {
  komunikasi: 0,
  motivasi: 0,
  kemampuan_dasar: 0,
  pemecahan_masalah: 0,
  kesiapan_magang: 0,
  catatan: "",
};

const EMPTY_EXPLANATIONS: Record<ScoreKey, string> = {
  komunikasi: "",
  motivasi: "",
  kemampuan_dasar: "",
  pemecahan_masalah: "",
  kesiapan_magang: "",
};

function getAverage(score?: Score | null) {
  if (!score) return null;

  const values = CRITERIA.map((item) => score[item.key]);

  if (values.some((value) => value === null || value === undefined)) {
    return null;
  }

  return Math.round(
    values.reduce((sum, value) => sum + Number(value), 0) /
      CRITERIA.length
  );
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PenilaianWawancaraAdminPage() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [scores, setScores] = useState<Record<string, Score>>({});
  const [explanations, setExplanations] =
    useState<Record<ScoreKey, string>>(EMPTY_EXPLANATIONS);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selected, setSelected] = useState<Interview | null>(null);
  const [score, setScore] = useState<ScoreForm>(EMPTY_SCORE);
  const [mode, setMode] = useState<"detail" | "edit">("detail");
  const [alreadyScored, setAlreadyScored] = useState(false);

  const getToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session?.access_token) {
      throw new Error("Sesi login habis. Silakan login ulang.");
    }

    return data.session.access_token;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = await getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [interviewResponse, scoreResponse] = await Promise.all([
        fetch("/api/admin/wawancara", {
          headers,
          cache: "no-store",
        }),
        fetch("/api/admin/penilaian-wawancara", {
          headers,
          cache: "no-store",
        }),
      ]);

      const interviewResult = await interviewResponse.json();
      const scoreResult = await scoreResponse.json();

      if (!interviewResponse.ok) {
        throw new Error(
          interviewResult.message || "Gagal mengambil jadwal wawancara."
        );
      }

      if (!scoreResponse.ok) {
        throw new Error(
          scoreResult.message || "Gagal mengambil daftar penilaian."
        );
      }

      const interviewRows = Array.isArray(interviewResult)
        ? interviewResult
        : interviewResult.data ?? interviewResult.wawancara ?? [];

      const normalized: Interview[] = interviewRows
        .map((item: Record<string, unknown>) => ({
          jadwal_id: String(item.jadwal_id ?? item.id ?? ""),
          peserta_id: String(item.peserta_id ?? ""),
          nama: String(
            item.nama ?? item.nama_lengkap ?? "Nama belum tersedia"
          ),
          email: String(item.email ?? ""),
          sekolah: String(item.sekolah ?? ""),
          posisi: String(item.posisi ?? ""),
          interviewer: String(item.interviewer ?? ""),
          tanggal: String(item.tanggal ?? ""),
          jam: String(item.jam ?? ""),
          metode: String(item.metode ?? ""),
          lokasi: String(item.lokasi ?? ""),
          status: String(item.status ?? ""),
        }))
        .filter((item: Interview) => item.jadwal_id);

      const rows: Score[] = Array.isArray(scoreResult.data)
        ? scoreResult.data
        : [];

      const scoreMap: Record<string, Score> = {};

      rows.forEach((item) => {
        scoreMap[String(item.jadwal_wawancara_id)] = item;
      });

      setInterviews(normalized);
      setScores(scoreMap);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat data penilaian."
      );
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function openDetail(
    interview: Interview,
    nextMode: "detail" | "edit"
  ) {
    setSelected(interview);
    setMode(nextMode);
    setScore(EMPTY_SCORE);
    setExplanations(EMPTY_EXPLANATIONS);
    setAlreadyScored(false);
    setError("");
    setNotice("");
    setLoadingScore(true);

    try {
      const token = await getToken();

      const response = await fetch(
        `/api/admin/penilaian-wawancara?jadwal_id=${encodeURIComponent(
          interview.jadwal_id
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil detail nilai.");
      }

      if (result.data) {
        const data = result.data as Score;

        setScore({
          komunikasi: Number(data.komunikasi ?? 0),
          motivasi: Number(data.motivasi ?? 0),
          kemampuan_dasar: Number(data.kemampuan_dasar ?? 0),
          pemecahan_masalah: Number(data.pemecahan_masalah ?? 0),
          kesiapan_magang: Number(data.kesiapan_magang ?? 0),
          catatan: data.catatan ?? "",
        });

        const savedExplanations = data.penjelasan ?? {};

        setExplanations({
          komunikasi: savedExplanations.komunikasi ?? "",
          motivasi: savedExplanations.motivasi ?? "",
          kemampuan_dasar: savedExplanations.kemampuan_dasar ?? "",
          pemecahan_masalah: savedExplanations.pemecahan_masalah ?? "",
          kesiapan_magang: savedExplanations.kesiapan_magang ?? "",
        });

        setAlreadyScored(true);
        setScores((current) => ({
          ...current,
          [interview.jadwal_id]: data,
        }));
      } else if (nextMode === "detail") {
        setNotice("Peserta ini belum memiliki penilaian.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil detail nilai."
      );
    } finally {
      setLoadingScore(false);
    }
  }

  async function saveScore() {
    if (!selected) return;

    for (const criterion of CRITERIA) {
      const value = score[criterion.key];

      if (!Number.isInteger(value) || value < 0 || value > 100) {
        setError(`Nilai ${criterion.label} harus berupa angka 0–100.`);
        return;
      }
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const token = await getToken();

      const response = await fetch("/api/admin/penilaian-wawancara", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jadwal_wawancara_id: selected.jadwal_id,
          peserta_id: selected.peserta_id,
          ...score,
          penjelasan: explanations,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menyimpan penilaian.");
      }

      const saved: Score = result.data;

      setScores((current) => ({
        ...current,
        [selected.jadwal_id]: saved,
      }));

      setAlreadyScored(true);
      setMode("detail");
      setNotice("Penilaian berhasil disimpan.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan penilaian."
      );
    } finally {
      setSaving(false);
    }
  }

  const filtered = interviews.filter((item) => {
    const keyword = search.toLowerCase();

    const matchesSearch = [
      item.nama,
      item.email,
      item.sekolah,
      item.posisi,
      item.interviewer,
    ].some((value) => value.toLowerCase().includes(keyword));

    const hasScore = Boolean(scores[item.jadwal_id]);

    const matchesStatus =
      statusFilter === "semua" ||
      (statusFilter === "sudah" && hasScore) ||
      (statusFilter === "belum" && !hasScore);

    return matchesSearch && matchesStatus;
  });

  const scoredCount = interviews.filter(
    (item) => Boolean(scores[item.jadwal_id])
  ).length;

  const averageScore = getAverage(
    selected ? scores[selected.jadwal_id] : null
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Penilaian Wawancara
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Nilai angka dan catatan untuk setiap aspek wawancara kandidat.
          </p>
        </div>

        <button
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Muat Ulang
        </button>
      </div>

      {error && !selected && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Jadwal</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {interviews.length}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Sudah Dinilai</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {scoredCount}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Belum Dinilai</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {interviews.length - scoredCount}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b p-5">
          <div>
            <h2 className="font-bold text-slate-900">Daftar Penilaian</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filtered.length} peserta ditampilkan
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, sekolah, atau posisi..."
                className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="semua">Semua Status</option>
              <option value="sudah">Sudah Dinilai</option>
              <option value="belum">Belum Dinilai</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
            <LoaderCircle className="animate-spin" size={20} />
            Memuat data penilaian...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Tidak ada data yang cocok dengan pencarian atau filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => {
              const itemScore = scores[item.jadwal_id];
              const average = getAverage(itemScore);

              return (
                <div
                  key={item.jadwal_id}
                  className="space-y-4 p-5 transition hover:bg-slate-50/70"
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">
                          {item.nama}
                        </h3>

                        {itemScore ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 size={13} />
                            Sudah Dinilai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            <Clock size={13} />
                            Belum Dinilai
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.email || "Email tidak tersedia"}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {item.sekolah || "Sekolah belum tersedia"}
                        {item.posisi ? ` • ${item.posisi}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDate(item.tanggal)} • {item.jam || "-"} •
                        Pewawancara: {item.interviewer || "-"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 lg:min-w-36 lg:flex-col lg:items-end">
                      <span className="text-xs text-slate-500">
                        Rata-rata Nilai
                      </span>
                      {average !== null ? (
                        <span className="text-2xl font-bold text-blue-700">
                          {average}
                          <span className="text-sm font-medium text-slate-400">
                            /100
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-slate-400">
                          Belum tersedia
                        </span>
                      )}
                    </div>
                  </div>

                  {itemScore && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                      {CRITERIA.map((criterion) => (
                        <div
                          key={criterion.key}
                          className="rounded-xl border border-slate-100 p-3"
                        >
                          <p className="text-xs text-slate-500">
                            {criterion.label}
                          </p>
                          <p className="mt-1 text-lg font-bold text-slate-800">
                            {itemScore[criterion.key]}/100
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                            {itemScore.penjelasan?.[criterion.key] ||
                              "Belum ada catatan aspek."}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {itemScore?.catatan && (
                    <div className="rounded-xl border border-slate-100 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-500">
                        Kesimpulan Wawancara
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                        {itemScore.catatan}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => void openDetail(item, "detail")}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <Eye size={16} />
                      Lihat Detail
                    </button>

                    <button
                      onClick={() => void openDetail(item, "edit")}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      {itemScore ? (
                        <Pencil size={16} />
                      ) : (
                        <ClipboardCheck size={16} />
                      )}
                      {itemScore ? "Edit Nilai" : "Beri Nilai"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  Penilaian Kandidat
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  {mode === "edit"
                    ? alreadyScored
                      ? "Edit Nilai Wawancara"
                      : "Form Penilaian Wawancara"
                    : "Detail Penilaian Wawancara"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selected.nama}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {notice && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  {notice}
                </div>
              )}

              {loadingScore ? (
                <div className="flex justify-center gap-3 p-8 text-sm text-slate-500">
                  <LoaderCircle className="animate-spin" size={20} />
                  Memuat detail nilai...
                </div>
              ) : mode === "detail" ? (
                <>
                  {alreadyScored ? (
                    <>
                      <div className="rounded-2xl bg-blue-50 p-5">
                        <p className="text-sm font-medium text-blue-800">
                          Rata-rata Nilai
                        </p>
                        <p className="mt-1 text-4xl font-bold text-blue-700">
                          {averageScore ?? "-"}
                          <span className="text-base font-medium text-blue-400">
                            /100
                          </span>
                        </p>
                        <p className="mt-2 text-xs text-blue-700">
                          Status: Sudah Dinilai
                        </p>
                      </div>

                      {CRITERIA.map((criterion) => (
                        <div
                          key={criterion.key}
                          className="rounded-xl border p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold text-slate-800">
                              {criterion.label}
                            </h3>
                            <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-blue-700">
                              {score[criterion.key]}/100
                            </span>
                          </div>

                          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Catatan Penilaian
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {explanations[criterion.key].trim() ||
                              "Belum ada penjelasan untuk aspek ini."}
                          </p>
                        </div>
                      ))}

                      <div className="rounded-xl border p-4">
                        <p className="text-sm font-semibold text-slate-700">
                          Kesimpulan Wawancara
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {score.catatan.trim() || "Belum ada kesimpulan."}
                        </p>
                      </div>

                      <div className="flex justify-end gap-3 border-t pt-4">
                        <button
                          onClick={() => setSelected(null)}
                          className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Tutup
                        </button>
                        <button
                          onClick={() => {
                            setMode("edit");
                            setNotice("");
                            setError("");
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          <Pencil size={16} />
                          Edit Nilai
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <Clock size={36} className="mx-auto text-amber-500" />
                      <h3 className="mt-3 font-bold text-slate-800">
                        Belum Ada Penilaian
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Nilai dan catatan untuk peserta ini belum diisi.
                      </p>
                      <button
                        onClick={() => {
                          setMode("edit");
                          setNotice("");
                          setError("");
                        }}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <ClipboardCheck size={16} />
                        Mulai Penilaian
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {selected.nama}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Isi nilai angka dan alasan penilaian untuk setiap aspek.
                    </p>
                  </div>

                  {CRITERIA.map((criterion) => (
                    <div
                      key={criterion.key}
                      className="space-y-3 rounded-xl border p-4"
                    >
                      <h3 className="font-bold text-slate-800">
                        {criterion.label}
                      </h3>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-600">
                          Nilai (0–100)
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={score[criterion.key]}
                          onChange={(event) => {
                            const raw = event.target.value;
                            const value = raw === "" ? 0 : Number(raw);

                            setScore((current) => ({
                              ...current,
                              [criterion.key]: value,
                            }));
                          }}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-600">
                          Catatan / Alasan Penilaian
                        </span>
                        <textarea
                          value={explanations[criterion.key]}
                          onChange={(event) =>
                            setExplanations((current) => ({
                              ...current,
                              [criterion.key]: event.target.value,
                            }))
                          }
                          rows={3}
                          maxLength={1000}
                          placeholder={`Jelaskan penilaian untuk ${criterion.label.toLowerCase()} berdasarkan hasil wawancara...`}
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500"
                        />
                        <p className="mt-1 text-right text-xs text-slate-400">
                          {explanations[criterion.key].length}/1000 karakter
                        </p>
                      </label>
                    </div>
                  ))}

                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-800">
                      Rata-rata Nilai
                    </p>
                    <p className="mt-1 text-3xl font-bold text-blue-700">
                      {Math.round(
                        CRITERIA.reduce(
                          (sum, item) => sum + score[item.key],
                          0
                        ) / CRITERIA.length
                      )}
                      /100
                    </p>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">
                      Kesimpulan Wawancara
                    </span>
                    <textarea
                      value={score.catatan}
                      onChange={(event) =>
                        setScore((current) => ({
                          ...current,
                          catatan: event.target.value,
                        }))
                      }
                      rows={4}
                      placeholder="Tuliskan kesimpulan umum, kelebihan, hal yang perlu dikembangkan, atau rekomendasi hasil wawancara..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500"
                    />
                  </label>

                  <div className="flex flex-col-reverse justify-end gap-3 border-t pt-4 sm:flex-row">
                    <button
                      onClick={() => {
                        if (alreadyScored) {
                          setMode("detail");
                        } else {
                          setSelected(null);
                        }
                        setError("");
                        setNotice("");
                      }}
                      className="rounded-xl border px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Batal
                    </button>

                    <button
                      onClick={() => void saveScore()}
                      disabled={
                        saving ||
                        CRITERIA.some(
                          (item) =>
                            !Number.isInteger(score[item.key]) ||
                            score[item.key] < 0 ||
                            score[item.key] > 100
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <LoaderCircle
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Save size={16} />
                      )}
                      {saving ? "Menyimpan..." : "Simpan Penilaian"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
