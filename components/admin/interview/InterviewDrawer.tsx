
"use client";

import { useEffect, useState } from "react";
import {
  X,
  User,
  CalendarClock,
  ShieldAlert,
  ClipboardCheck,
  Save,
  LoaderCircle,
} from "lucide-react";

import type { Interview } from "@/app/admin/wawancara/page";
import { supabase } from "@/lib/supabase";

interface InterviewDrawerProps {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;
  onPass: () => void;
  onFail: () => void;
  onReschedule: () => void;
  onBlacklist: (alasan: string) => void;
}

type ScoreKey =
  | "komunikasi"
  | "motivasi"
  | "kemampuan_dasar"
  | "pemecahan_masalah"
  | "kesiapan_magang";

type Scores = Record<ScoreKey, number>;
type ScoreExplanations = Record<ScoreKey, string>;

const INITIAL_SCORES: Scores = {
  komunikasi: 0,
  motivasi: 0,
  kemampuan_dasar: 0,
  pemecahan_masalah: 0,
  kesiapan_magang: 0,
};

const INITIAL_EXPLANATIONS: ScoreExplanations = {
  komunikasi: "",
  motivasi: "",
  kemampuan_dasar: "",
  pemecahan_masalah: "",
  kesiapan_magang: "",
};

const SCORE_CRITERIA: {
  key: ScoreKey;
  label: string;
  description: string;
}[] = [
  {
    key: "komunikasi",
    label: "Komunikasi",
    description:
      "Kemampuan menyampaikan pendapat dan menjawab pertanyaan.",
  },
  {
    key: "motivasi",
    label: "Motivasi",
    description:
      "Kesungguhan dan alasan mengikuti program magang.",
  },
  {
    key: "kemampuan_dasar",
    label: "Kemampuan Dasar",
    description:
      "Pemahaman dasar sesuai posisi yang dilamar.",
  },
  {
    key: "pemecahan_masalah",
    label: "Pemecahan Masalah",
    description:
      "Kemampuan menganalisis masalah dan mencari solusi.",
  },
  {
    key: "kesiapan_magang",
    label: "Kesiapan Magang",
    description:
      "Kesiapan belajar, disiplin, dan komitmen.",
  },
];

function getConclusion(score: number) {
  if (score >= 85) {
    return {
      title: "Sangat baik — direkomendasikan",
      description:
        "Peserta memperoleh hasil wawancara yang sangat baik.",
      style: "border-green-200 bg-green-50 text-green-800",
    };
  }

  if (score >= 70) {
    return {
      title: "Baik — perlu dipertimbangkan",
      description:
        "Pertimbangkan hasil wawancara dan kebutuhan posisi.",
      style: "border-blue-200 bg-blue-50 text-blue-800",
    };
  }

  return {
    title: "Perlu evaluasi lebih lanjut",
    description:
      "Tinjau kembali kemampuan dan kesiapan peserta.",
    style: "border-amber-200 bg-amber-50 text-amber-800",
  };
}

export default function InterviewDrawer({
  open,
  onClose,
  interview,
  onPass,
  onFail,
  onReschedule,
  onBlacklist,
}: InterviewDrawerProps) {
  const [alasanBlacklist, setAlasanBlacklist] = useState("");
  const [konfirmasiBlacklist, setKonfirmasiBlacklist] =
    useState(false);

  const [scores, setScores] = useState<Scores>({
    ...INITIAL_SCORES,
  });

  const [explanations, setExplanations] =
    useState<ScoreExplanations>({
      ...INITIAL_EXPLANATIONS,
    });

  const [catatanNilai, setCatatanNilai] = useState("");
  const [nilaiId, setNilaiId] = useState<string | null>(null);
  const [loadingNilai, setLoadingNilai] = useState(false);
  const [savingNilai, setSavingNilai] = useState(false);
  const [errorNilai, setErrorNilai] = useState("");
  const [successNilai, setSuccessNilai] = useState("");

  useEffect(() => {
    if (!open || !interview?.jadwal_id) {
      setScores({ ...INITIAL_SCORES });
      setExplanations({ ...INITIAL_EXPLANATIONS });
      setCatatanNilai("");
      setNilaiId(null);
      setErrorNilai("");
      setSuccessNilai("");
      setLoadingNilai(false);
      return;
    }

    let aktif = true;

    async function loadNilai() {
      setLoadingNilai(true);
      setErrorNilai("");
      setSuccessNilai("");
      setScores({ ...INITIAL_SCORES });
      setExplanations({ ...INITIAL_EXPLANATIONS });
      setCatatanNilai("");
      setNilaiId(null);

      try {
        const { data: sessionData } =
          await supabase.auth.getSession();

        const token = sessionData.session?.access_token;

        if (!token) {
          throw new Error(
            "Sesi admin tidak ditemukan. Silakan login ulang."
          );
        }

        const res = await fetch(
          `/api/admin/penilaian-wawancara?jadwal_id=${encodeURIComponent(
            interview!.jadwal_id!
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const json = await res.json();

        if (!res.ok) {
          throw new Error(
            json.message ?? "Gagal mengambil penilaian."
          );
        }

        if (!aktif) return;

        const nilai = json.data;

        setNilaiId(nilai?.id ?? null);

        setScores({
          komunikasi: nilai?.komunikasi ?? 0,
          motivasi: nilai?.motivasi ?? 0,
          kemampuan_dasar: nilai?.kemampuan_dasar ?? 0,
          pemecahan_masalah:
            nilai?.pemecahan_masalah ?? 0,
          kesiapan_magang: nilai?.kesiapan_magang ?? 0,
        });

        setExplanations({
          komunikasi:
            nilai?.penjelasan?.komunikasi ?? "",
          motivasi: nilai?.penjelasan?.motivasi ?? "",
          kemampuan_dasar:
            nilai?.penjelasan?.kemampuan_dasar ?? "",
          pemecahan_masalah:
            nilai?.penjelasan?.pemecahan_masalah ?? "",
          kesiapan_magang:
            nilai?.penjelasan?.kesiapan_magang ?? "",
        });

        setCatatanNilai(nilai?.catatan ?? "");
      } catch (error) {
        if (!aktif) return;

        setErrorNilai(
          error instanceof Error
            ? error.message
            : "Gagal mengambil penilaian."
        );
      } finally {
        if (aktif) setLoadingNilai(false);
      }
    }

    void loadNilai();

    return () => {
      aktif = false;
    };
  }, [open, interview?.jadwal_id]);

  const nilaiAkhir =
    Object.values(scores).reduce(
      (total, value) => total + value,
      0
    ) / SCORE_CRITERIA.length;

  const kesimpulan = getConclusion(nilaiAkhir);

  const handleSaveNilai = async () => {
    if (!interview?.jadwal_id) {
      setErrorNilai(
        "Jadwal wawancara belum tersedia."
      );
      return;
    }

    for (const [key, value] of Object.entries(scores)) {
      if (
        !Number.isInteger(value) ||
        value < 0 ||
        value > 100
      ) {
        setErrorNilai(
          `Nilai ${key.replaceAll("_", " ")} harus berupa bilangan bulat 0–100.`
        );
        return;
      }
    }

    setSavingNilai(true);
    setErrorNilai("");
    setSuccessNilai("");

    try {
      const { data: sessionData } =
        await supabase.auth.getSession();

      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error(
          "Sesi admin tidak ditemukan. Silakan login ulang."
        );
      }

      const res = await fetch(
        "/api/admin/penilaian-wawancara",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jadwal_wawancara_id: interview.jadwal_id,
            ...scores,
            penjelasan: explanations,
            catatan: catatanNilai,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message ?? "Gagal menyimpan penilaian."
        );
      }

      setNilaiId(json.data?.id ?? null);
      setSuccessNilai(
        "Penilaian wawancara berhasil disimpan."
      );
    } catch (error) {
      setErrorNilai(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan penilaian."
      );
    } finally {
      setSavingNilai(false);
    }
  };

  const handleBlacklist = () => {
    const alasan = alasanBlacklist.trim();

    if (!alasan) {
      alert("Alasan blacklist wajib diisi.");
      return;
    }

    onBlacklist(alasan);
  };

  if (!open || !interview) return null;

  const sudahBlacklist =
    interview.status.toLowerCase() === "blacklist";

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
      />

      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-[560px] overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-20 border-b bg-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Detail Wawancara
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Informasi peserta dan proses wawancara.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup detail wawancara"
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <X size={21} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <User size={28} className="text-blue-600" />
              </div>

              <div>
                <h3 className="text-xl font-bold">
                  {interview.nama}
                </h3>
                <p className="text-sm text-gray-500">
                  {interview.posisi || "-"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <Info
                label="Sekolah"
                value={interview.sekolah || "-"}
              />
              <Info
                label="Posisi"
                value={interview.posisi || "-"}
              />
              <Info
                label="Email"
                value={interview.email || "-"}
              />
              <Info
                label="Interviewer"
                value={interview.interviewer || "-"}
              />
            </div>
          </div>
        </div>

        <div className="border-y bg-gray-50 px-6 py-6">
          <h3 className="mb-5 text-lg font-bold">
            Jadwal Wawancara
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <ScheduleInfo
              label="Tanggal"
              value={
                interview.tanggal || "Belum dijadwalkan"
              }
            />
            <ScheduleInfo
              label="Jam"
              value={interview.jam || "-"}
            />
            <ScheduleInfo
              label="Metode"
              value={interview.metode || "-"}
            />
            <ScheduleInfo
              label="Lokasi"
              value={interview.lokasi || "-"}
            />
          </div>
        </div>

        {/* Form penilaian wawancara admin */}
        <div className="px-6 py-6">
          <div className="rounded-2xl border border-gray-200 p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <ClipboardCheck size={22} />
              </div>

              <div>
                <h3 className="font-bold">
                  Penilaian Wawancara
                </h3>
                <p className="text-sm text-gray-500">
                  Berikan nilai dan penjelasan untuk setiap aspek.
                </p>
              </div>
            </div>

            {!interview.jadwal_id ? (
              <p className="rounded-xl bg-yellow-50 p-4 text-sm text-yellow-700">
                Buat jadwal wawancara terlebih dahulu sebelum memberikan nilai.
              </p>
            ) : loadingNilai ? (
              <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
                Memuat penilaian...
              </div>
            ) : (
              <>
                {SCORE_CRITERIA.map((criterion) => {
                  const key = criterion.key;

                  return (
                    <div
                      key={key}
                      className="mb-5 rounded-xl border border-gray-200 p-4"
                    >
                      <label
                        htmlFor={`nilai-${key}`}
                        className="block text-sm font-semibold text-gray-800"
                      >
                        {criterion.label}
                      </label>

                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {criterion.description}
                      </p>

                      <div className="mt-3 flex items-center gap-3">
                        <input
                          id={`nilai-${key}`}
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={scores[key]}
                          onChange={(event) => {
                            const raw = event.target.value;
                            const value =
                              raw === "" ? 0 : Number(raw);

                            setScores((current) => ({
                              ...current,
                              [key]: value,
                            }));

                            setSuccessNilai("");
                            setErrorNilai("");
                          }}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                        />

                        <span className="shrink-0 text-sm text-gray-500">
                          / 100
                        </span>
                      </div>

                      <label
                        htmlFor={`penjelasan-${key}`}
                        className="mb-2 mt-4 block text-sm font-medium text-gray-700"
                      >
                        Penjelasan Penilaian
                      </label>

                      <textarea
                        id={`penjelasan-${key}`}
                        value={explanations[key]}
                        onChange={(event) => {
                          setExplanations((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }));

                          setSuccessNilai("");
                        }}
                        rows={3}
                        maxLength={1000}
                        placeholder={`Jelaskan hasil penilaian ${criterion.label.toLowerCase()}...`}
                        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  );
                })}

                <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    Nilai Akhir Wawancara
                  </p>

                  <p className="mt-1 text-3xl font-bold text-blue-700">
                    {nilaiAkhir.toFixed(1)}
                    <span className="ml-1 text-sm font-medium">
                      / 100
                    </span>
                  </p>

                  <div
                    className={`mt-3 rounded-lg border p-3 ${kesimpulan.style}`}
                  >
                    <p className="text-sm font-bold">
                      {kesimpulan.title}
                    </p>
                    <p className="mt-1 text-xs">
                      {kesimpulan.description}
                    </p>
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    Nilai akhir dihitung otomatis dari rata-rata lima aspek.
                    Kesimpulan merupakan rekomendasi penilaian, bukan
                    perubahan status kelulusan otomatis.
                  </p>
                </div>

                <label
                  htmlFor="catatan-nilai"
                  className="mb-2 block text-sm font-medium"
                >
                  Catatan Admin
                </label>

                <textarea
                  id="catatan-nilai"
                  value={catatanNilai}
                  onChange={(event) => {
                    setCatatanNilai(event.target.value);
                    setSuccessNilai("");
                  }}
                  rows={3}
                  maxLength={2000}
                  placeholder="Tulis catatan umum hasil wawancara..."
                  className="mb-4 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                />

                {errorNilai && (
                  <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {errorNilai}
                  </p>
                )}

                {successNilai && (
                  <p className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    {successNilai}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSaveNilai}
                  disabled={savingNilai}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingNilai ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={18} />
                  )}

                  {savingNilai
                    ? "Menyimpan..."
                    : nilaiId
                      ? "Perbarui Penilaian"
                      : "Simpan Penilaian"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="px-6 py-6">
          <h3 className="mb-3 font-bold">
            Status Wawancara
          </h3>

          <StatusBadge
            status={
              sudahBlacklist
                ? "Blacklist"
                : interview.status
            }
          />
        </div>

        <div className="px-6 pb-8">
          <div className="rounded-2xl border border-gray-200 p-5">
            <h3 className="mb-6 font-bold">
              Progress Rekrutmen
            </h3>

            <div className="flex items-center justify-between">
              <ProgressStep title="Pengajuan" active />
              <ProgressLine />
              <ProgressStep title="Pemeriksaan" active />
              <ProgressLine />
              <ProgressStep
                title="Wawancara"
                active={!sudahBlacklist}
              />
              <ProgressLine />
              <ProgressStep
                title="Hasil"
                active={[
                  "Lulus",
                  "Tidak Lulus",
                  "Blacklist",
                ].includes(
                  sudahBlacklist
                    ? "Blacklist"
                    : interview.status
                )}
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-20 border-t bg-white p-5">
          {sudahBlacklist ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
              Peserta ini sudah masuk blacklist. Aksi wawancara dinonaktifkan.
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50/50 p-4">
                <div className="mb-3 flex items-center gap-2 font-semibold text-red-700">
                  <ShieldAlert size={18} />
                  Blacklist Peserta
                </div>

                <p className="mb-3 text-sm text-gray-600">
                  Gunakan jika peserta tidak bisa dihubungi atau tidak dapat melanjutkan proses rekrutmen.
                </p>

                <textarea
                  value={alasanBlacklist}
                  onChange={(event) => {
                    setAlasanBlacklist(event.target.value);
                    setKonfirmasiBlacklist(false);
                  }}
                  placeholder="Tulis alasan blacklist..."
                  rows={2}
                  maxLength={500}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setKonfirmasiBlacklist(
                        !konfirmasiBlacklist
                      )
                    }
                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    {konfirmasiBlacklist
                      ? "Batal"
                      : "Pilih blacklist"}
                  </button>

                  {konfirmasiBlacklist && (
                    <button
                      type="button"
                      onClick={handleBlacklist}
                      disabled={!alasanBlacklist.trim()}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Konfirmasi Blacklist
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={onFail}
                  className="rounded-xl border border-red-500 px-2 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  Tidak Lulus
                </button>

                <button
                  type="button"
                  onClick={onReschedule}
                  className="rounded-xl border border-yellow-500 px-2 py-3 text-sm font-medium text-yellow-600 transition hover:bg-yellow-50"
                >
                  Jadwalkan Ulang
                </button>

                <button
                  type="button"
                  onClick={onPass}
                  className="rounded-xl bg-green-600 px-2 py-3 text-sm font-medium text-white transition hover:bg-green-700"
                >
                  Lulus
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 break-words font-medium">
        {value}
      </p>
    </div>
  );
}

function ScheduleInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-gray-500">
        <CalendarClock size={16} />
        <span className="text-sm">{label}</span>
      </div>
      <p className="break-words font-semibold">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let style = "bg-gray-100 text-gray-700";

  if (status === "Dijadwalkan") {
    style = "bg-blue-100 text-blue-700";
  } else if (status === "Menunggu") {
    style = "bg-yellow-100 text-yellow-700";
  } else if (status === "Selesai") {
    style = "bg-gray-100 text-gray-700";
  } else if (status === "Lulus") {
    style = "bg-green-100 text-green-700";
  } else if (status === "Tidak Lulus") {
    style = "bg-red-100 text-red-700";
  } else if (status.toLowerCase() === "blacklist") {
    style = "bg-red-100 text-red-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${style}`}
    >
      {status}
    </span>
  );
}

function ProgressStep({
  title,
  active,
}: {
  title: string;
  active: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
          active
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-500"
        }`}
      >
        {active ? "✓" : ""}
      </div>
      <p className="mt-2 text-xs font-medium">{title}</p>
    </div>
  );
}

function ProgressLine() {
  return (
    <div className="mx-2 h-1 flex-1 rounded-full bg-blue-600" />
  );
}
