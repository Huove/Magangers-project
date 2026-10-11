"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MessageCircle,
  Star,
  Users,
  UserCheck,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

// =========================================
// TYPE
// =========================================

type PenilaianItem = {
  id: number;
  nama: string;
  nilai: number;
  deskripsi: string;
  icon: React.ElementType;
};

type PenilaianDatabase = {
  id: string;
  peserta_id: string;

  pembimbing_id:
  | string
  | null;

  kehadiran:
  | number
  | null;

  kedisiplinan:
  | number
  | null;

  tanggung_jawab:
  | number
  | null;

  sikap:
  | number
  | null;

  komunikasi:
  | number
  | null;

  kerja_sama:
  | number
  | null;

  tugas:
  | number
  | null;

  laporan:
  | number
  | null;

  catatan:
  | string
  | null;

  created_at:
  | string
  | null;

  updated_at:
  | string
  | null;
};

// =========================================
// PAGE
// =========================================

export default function PenilaianPage() {
  const [
    dataPenilaian,
    setDataPenilaian,
  ] =
    useState<PenilaianDatabase | null>(
      null
    );

  const [
    namaPembimbing,
    setNamaPembimbing,
  ] = useState("-");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================================
  // FETCH PENILAIAN
  // =========================================

  const fetchPenilaian =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        // =====================================
        // USER LOGIN
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
          setError(
            "User tidak ditemukan. Silakan login kembali."
          );

          return;
        }

        // =====================================
        // PESERTA
        // =====================================

        const {
          data: peserta,
          error: pesertaError,
        } = await supabase
          .from("peserta")
          .select("id")
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

        if (pesertaError) {
          throw pesertaError;
        }

        if (!peserta) {
          setError(
            "Data peserta tidak ditemukan."
          );

          return;
        }

        // =====================================
        // PENILAIAN
        // =====================================

        const {
          data,
          error:
          penilaianError,
        } = await supabase
          .from("penilaian")
          .select(`
    id,
    peserta_id,
    pembimbing_id,
    kehadiran,
    kedisiplinan,
    tanggung_jawab,
    sikap,
    komunikasi,
    kerja_sama,
    tugas,
    laporan,
    catatan,
    created_at,
    updated_at
  `)
          .eq(
            "peserta_id",
            peserta.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

        if (penilaianError) {
          throw penilaianError;
        }

        if (!data) {
          setDataPenilaian(
            null
          );

          return;
        }

        setDataPenilaian(
          data
        );

        // =====================================
        // PEMBIMBING
        // =====================================

        if (
          data.pembimbing_id
        ) {
          const {
            data:
            pembimbing,
            error:
            pembimbingError,
          } = await supabase
            .from("pembimbing")
            .select("user_id")
            .eq(
              "id",
              data.pembimbing_id
            )
            .maybeSingle();

          if (
            pembimbingError
          ) {
            console.error(
              "PEMBIMBING ERROR:",
              pembimbingError
            );
          }

          if (
            pembimbing?.user_id
          ) {
            const {
              data:
              profile,
              error:
              profileError,
            } = await supabase
              .from("profiles")
              .select(
                "nama_lengkap"
              )
              .eq(
                "id",
                pembimbing.user_id
              )
              .maybeSingle();

            if (
              profileError
            ) {
              console.error(
                "PROFILE PEMBIMBING ERROR:",
                profileError
              );
            }

            setNamaPembimbing(
              profile
                ?.nama_lengkap ||
              "Pembimbing"
            );
          }
        }
      } catch (err) {
        console.error(
          "GAGAL MENGAMBIL PENILAIAN:",
          err
        );

        setError(
          "Gagal mengambil data penilaian."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  // =========================================
  // LOAD
  // =========================================

  useEffect(() => {
    fetchPenilaian();
  }, [fetchPenilaian]);

  // =========================================
  // DETAIL PENILAIAN
  // =========================================

  const penilaian =
    useMemo<
      PenilaianItem[]
    >(() => {
      if (
        !dataPenilaian
      ) {
        return [];
      }

      return [
        {
          id: 1,

          nama:
            "Kehadiran",

          nilai:
            dataPenilaian
              .kehadiran ?? 0,

          deskripsi:
            "Kehadiran selama pelaksanaan magang.",

          icon:
            UserCheck,
        },

        {
          id: 2,

          nama:
            "Kedisiplinan",

          nilai:
            dataPenilaian
              .kedisiplinan ??
            0,

          deskripsi:
            "Kedisiplinan terhadap waktu dan peraturan.",

          icon:
            ShieldCheck,
        },

        {
          id: 3,

          nama:
            "Tanggung Jawab",

          nilai:
            dataPenilaian
              .tanggung_jawab ??
            0,

          deskripsi:
            "Kemampuan menyelesaikan tugas dan tanggung jawab.",

          icon:
            ClipboardCheck,
        },

        {
          id: 4,

          nama:
            "Sikap",

          nilai:
            dataPenilaian
              .sikap ?? 0,

          deskripsi:
            "Sikap dan perilaku selama berada di lingkungan kerja.",

          icon:
            Star,
        },

        {
          id: 5,

          nama:
            "Komunikasi",

          nilai:
            dataPenilaian
              .komunikasi ?? 0,

          deskripsi:
            "Kemampuan berkomunikasi dengan pembimbing dan tim.",

          icon:
            MessageCircle,
        },

        {
          id: 6,

          nama:
            "Kerja Sama",

          nilai:
            dataPenilaian
              .kerja_sama ?? 0,

          deskripsi:
            "Kemampuan bekerja sama dengan anggota tim.",

          icon:
            Users,
        },

        {
          id: 7,

          nama:
            "Tugas",

          nilai:
            dataPenilaian
              .tugas ?? 0,

          deskripsi:
            "Kualitas dan penyelesaian tugas yang diberikan.",

          icon:
            BookOpen,
        },

        {
          id: 8,

          nama:
            "Laporan",

          nilai:
            dataPenilaian
              .laporan ?? 0,

          deskripsi:
            "Kelengkapan dan kualitas laporan magang.",

          icon:
            FileText,
        },
      ];
    }, [dataPenilaian]);

  // =========================================
  // NILAI AKHIR
  // =========================================

  const nilaiAkhir =
    useMemo(() => {
      if (
        penilaian.length === 0
      ) {
        return 0;
      }

      const total =
        penilaian.reduce(
          (
            jumlah,
            item
          ) =>
            jumlah +
            item.nilai,
          0
        );

      return Math.round(
        total /
        penilaian.length
      );
    }, [penilaian]);

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">

        <div className="text-center">

          <Award
            size={32}
            className="mx-auto mb-3 animate-pulse text-blue-500"
          />

          <p className="text-sm text-neutral-500">
            Memuat penilaian...
          </p>

        </div>

      </div>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
          {error}
        </div>

      </div>
    );
  }

  // =========================================
  // BELUM DINILAI
  // =========================================

  if (!dataPenilaian) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-8">

        {/* HEADER */}

        <div className="mb-8">

          <div className="mb-1 flex items-center gap-2">

            <Award
              size={18}
              className="text-neutral-900"
            />

            <p className="text-2xl font-semibold text-neutral-900">
              Penilaian Peserta
            </p>

          </div>

          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-500">
            Lihat hasil penilaian dan
            evaluasi kamu selama
            melaksanakan kegiatan
            magang.
          </p>

        </div>

        {/* EMPTY */}

        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-50 px-6 text-center">

          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">

            <Award
              size={27}
              className="text-neutral-400"
            />

          </div>

          <h2 className="text-base font-semibold text-neutral-800">
            Penilaian belum tersedia
          </h2>

          <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-500">
            Pembimbing belum memberikan
            penilaian untuk kegiatan
            magang kamu.
          </p>

        </div>

      </div>
    );
  }

  // =========================================
  // PAGE
  // =========================================

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="mb-8">

        <div className="mb-1 flex items-center gap-2">

          <Award
            size={18}
            className="text-neutral-900"
          />

          <p className="text-2xl font-semibold text-neutral-900">
            Penilaian Peserta
          </p>

        </div>

        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-500">
          Lihat hasil penilaian dan
          evaluasi kamu selama
          melaksanakan kegiatan magang.
        </p>

      </div>

      {/* =====================================
          SUMMARY
      ===================================== */}

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">

        {/* NILAI AKHIR */}

        <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-blue-50/50 p-6">

          <div className="relative z-10">

            <p className="text-sm font-medium text-blue-600">
              NILAI AKHIR
            </p>

            <div className="mt-4 flex items-end gap-3">

              <span className="text-6xl font-semibold tracking-tight text-neutral-900">
                {nilaiAkhir}
              </span>

              <span className="mb-2 text-sm text-neutral-500">
                / 100
              </span>

            </div>

            <div className="mt-4 flex items-center gap-2">

              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">

                <CheckCircle2
                  size={16}
                />

              </span>

              <span className="text-sm font-medium text-emerald-700">
                {getNilaiLabel(
                  nilaiAkhir
                )}
              </span>

            </div>

          </div>

          <Award
            className="absolute -bottom-8 -right-8 text-blue-100"
            size={180}
          />

        </div>

        {/* STATUS */}

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

          <p className="text-sm text-neutral-500">
            Status penilaian
          </p>

          <div className="mt-3 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

              <CheckCircle2
                size={20}
              />

            </div>

            <div>

              <p className="font-semibold text-neutral-900">
                Penilaian tersedia
              </p>

              <p className="mt-0.5 text-xs text-neutral-500">
                Telah dinilai oleh{" "}
                {namaPembimbing}
              </p>

            </div>

          </div>

          <div className="mt-6 border-t border-neutral-100 pt-5">

            <div className="flex items-center justify-between text-sm">

              <span className="text-neutral-500">
                Jumlah aspek
              </span>

              <span className="font-semibold text-neutral-900">
                {penilaian.length} aspek
              </span>

            </div>

            <div className="mt-3 flex items-center justify-between text-sm">

              <span className="text-neutral-500">
                Rata-rata nilai
              </span>

              <span className="font-semibold text-blue-600">
                {nilaiAkhir} / 100
              </span>

            </div>

            <div className="mt-3 flex items-center justify-between text-sm">

              <span className="text-neutral-500">
                Diperbarui
              </span>

              <span className="font-medium text-neutral-700">
                {formatTanggal(
                  dataPenilaian.updated_at ||
                  dataPenilaian.created_at
                )}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================
          DETAIL PENILAIAN
      ===================================== */}

      <div className="mb-8">

        <div className="mb-5">

          <h2 className="text-xl font-semibold text-neutral-900">
            Detail Penilaian
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Hasil penilaian berdasarkan
            beberapa aspek selama kegiatan
            magang.
          </p>

        </div>

        <div className="grid gap-4 md:grid-cols-2">

          {penilaian.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                        <Icon
                          size={19}
                        />

                      </div>

                      <div>

                        <h3 className="font-semibold text-neutral-900">
                          {item.nama}
                        </h3>

                        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                          {
                            item.deskripsi
                          }
                        </p>

                      </div>

                    </div>

                    {/* NILAI */}

                    <div className="shrink-0 text-right">

                      <p className="text-2xl font-semibold text-neutral-900">
                        {item.nilai}
                      </p>

                      <p className="text-[11px] text-neutral-400">
                        / 100
                      </p>

                    </div>

                  </div>

                  {/* PROGRESS */}

                  <div className="mt-5">

                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">

                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                        style={{
                          width:
                            getProgressWidth(
                              item.nilai
                            ),
                        }}
                      />

                    </div>

                    <div className="mt-2 flex items-center justify-between">

                      <span className="text-xs text-neutral-400">
                        Nilai
                      </span>

                      <span
                        className={`text-xs font-medium ${getNilaiColor(
                          item.nilai
                        )}`}
                      >
                        {getNilaiLabel(
                          item.nilai
                        )}
                      </span>

                    </div>

                  </div>

                </div>
              );
            }
          )}

        </div>

      </div>

      {/* =====================================
          CATATAN PEMBIMBING
      ===================================== */}

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

        <div className="mb-5 flex items-start gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

            <MessageCircle
              size={20}
            />

          </div>

          <div>

            <h2 className="text-lg font-semibold text-neutral-900">
              Catatan Pembimbing
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Evaluasi dan masukan dari
              pembimbing selama pelaksanaan
              magang.
            </p>

          </div>

        </div>

        <div className="rounded-2xl bg-neutral-50 p-5">

          <div className="mb-3 flex items-center gap-2">

            <div className="h-2 w-2 rounded-full bg-blue-600" />

            <p className="text-sm font-medium text-neutral-700">
              Catatan evaluasi
            </p>

          </div>

          {dataPenilaian.catatan ? (

            <p className="whitespace-pre-wrap text-sm leading-7 text-neutral-600">
              {dataPenilaian.catatan}
            </p>

          ) : (

            <p className="text-sm italic leading-7 text-neutral-400">
              Pembimbing belum memberikan
              catatan evaluasi.
            </p>

          )}

        </div>

      </div>

    </div>
  );
}

// =========================================
// LABEL NILAI
// =========================================

function getNilaiLabel(
  nilai: number
) {
  if (nilai >= 90) {
    return "Sangat Baik";
  }

  if (nilai >= 80) {
    return "Baik";
  }

  if (nilai >= 70) {
    return "Cukup";
  }

  return "Perlu Perbaikan";
}

// =========================================
// WARNA LABEL
// =========================================

function getNilaiColor(
  nilai: number
) {
  if (nilai >= 90) {
    return "text-emerald-600";
  }

  if (nilai >= 80) {
    return "text-blue-600";
  }

  if (nilai >= 70) {
    return "text-amber-600";
  }

  return "text-red-600";
}

// =========================================
// PROGRESS WIDTH
// =========================================

function getProgressWidth(
  nilai: number
) {
  const aman =
    Math.min(
      Math.max(
        nilai,
        0
      ),
      100
    );

  return `${aman}%`;
}

// =========================================
// FORMAT TANGGAL
// =========================================

function formatTanggal(
  value: string | null
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}