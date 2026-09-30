"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import EnterAnimation from "@/components/aktif/animation/entreAnimation";

import {
  FileText,
  CalendarDays,
  BookOpen,
  ClipboardList,
  Clock,
  ChevronRight,
  CheckCircle2,
  Eye,
  ExternalLink,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

// =========================================
// TYPE
// =========================================

type LaporanType =
  | "Laporan Mingguan"
  | "Laporan Bulanan"
  | "Laporan Akhir"
  | "Rekap Jurnal"
  | "Rekap Tugas"
  | "Rekap Absensi";

type StatusLaporan =
  | "Tersedia"
  | "Belum tersedia";

type Laporan = {
  id: string;
  tipe: LaporanType;
  judul: string;
  periode: string;
  deskripsi: string;
  status: StatusLaporan;
  tanggal: string;
  fileUrl: string | null;
};

type LaporanDatabase = {
  id: string;
  peserta_id: string;
  tipe: string | null;
  judul: string | null;
  periode: string | null;
  deskripsi: string | null;
  file_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

// =========================================
// FILTER
// =========================================

const filterOptions: (
  | "Semua"
  | LaporanType
)[] = [
  "Semua",
  "Laporan Mingguan",
  "Laporan Bulanan",
  "Laporan Akhir",
  "Rekap Jurnal",
  "Rekap Tugas",
  "Rekap Absensi",
];

// =========================================
// ICON
// =========================================

const iconMap: Record<
  LaporanType,
  typeof FileText
> = {
  "Laporan Mingguan": CalendarDays,
  "Laporan Bulanan": FileText,
  "Laporan Akhir": BookOpen,
  "Rekap Jurnal": ClipboardList,
  "Rekap Tugas": FileText,
  "Rekap Absensi": Clock,
};

// =========================================
// PAGE
// =========================================

export default function LaporanPage() {
  const [filter, setFilter] =
    useState<
      "Semua" | LaporanType
    >("Semua");

  const [
    selectedLaporan,
    setSelectedLaporan,
  ] = useState<Laporan | null>(
    null
  );

  const [
    laporanDatabase,
    setLaporanDatabase,
  ] = useState<
    LaporanDatabase[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================================
  // FETCH LAPORAN
  // =========================================

  const fetchLaporan =
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
        // CARI PESERTA
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
        // AMBIL LAPORAN PESERTA
        // =====================================

        const {
          data,
          error: laporanError,
        } = await supabase
          .from("laporan")
          .select(`
            id,
            peserta_id,
            tipe,
            judul,
            periode,
            deskripsi,
            file_url,
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
          );

        if (laporanError) {
          throw laporanError;
        }

        setLaporanDatabase(
          data || []
        );
      } catch (err) {
        console.error(
          "GAGAL MENGAMBIL LAPORAN:",
          err
        );

        setError(
          "Gagal mengambil data laporan."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  // =========================================
  // LOAD PERTAMA
  // =========================================

  useEffect(() => {
    fetchLaporan();
  }, [fetchLaporan]);

  // =========================================
  // FORMAT DATA DATABASE
  // =========================================

  const semuaLaporan =
    useMemo(() => {
      return laporanDatabase
        .filter((item) =>
          isLaporanType(
            item.tipe
          )
        )
        .map(
          (
            item
          ): Laporan => ({
            id:
              item.id,

            tipe:
              item.tipe as LaporanType,

            judul:
              item.judul ||
              item.tipe ||
              "Laporan",

            periode:
              item.periode ||
              "-",

            deskripsi:
              item.deskripsi ||
              "-",

            // =================================
            // FILE ADA = TERSEDIA
            // =================================

            status:
              item.file_url
                ? "Tersedia"
                : "Belum tersedia",

            tanggal:
              item.updated_at ||
              item.created_at
                ? formatTanggal(
                    item.updated_at ||
                      item.created_at
                  )
                : "-",

            fileUrl:
              item.file_url ||
              null,
          })
        );
    }, [laporanDatabase]);

  // =========================================
  // FILTER LAPORAN
  // =========================================

  const laporanTampil =
    useMemo(() => {
      if (
        filter === "Semua"
      ) {
        return semuaLaporan;
      }

      return semuaLaporan.filter(
        (laporan) =>
          laporan.tipe ===
          filter
      );
    }, [
      filter,
      semuaLaporan,
    ]);

  // =========================================
  // STATISTIK
  // =========================================

  const jumlahTersedia =
    useMemo(() => {
      return semuaLaporan.filter(
        (laporan) =>
          laporan.status ===
          "Tersedia"
      ).length;
    }, [semuaLaporan]);

  const jumlahBelumTersedia =
    semuaLaporan.length -
    jumlahTersedia;

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">

        <div className="text-center">

          <FileText
            size={30}
            className="mx-auto mb-3 animate-pulse text-blue-500"
          />

          <p className="text-sm text-neutral-500">
            Memuat laporan...
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

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="mb-8">

        <div className="mb-1 flex items-center gap-2">

          <FileText
            size={18}
            className="text-neutral-900"
          />

          <p className="text-2xl font-semibold text-neutral-900">
            Laporan Peserta
          </p>

        </div>

        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-500">
          Lihat laporan dan rekap kegiatan
          yang diberikan oleh pembimbing
          selama pelaksanaan magang.
        </p>

      </div>

      {/* =====================================
          STATISTIK
      ===================================== */}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* TOTAL */}

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

            <FileText
              size={19}
            />

          </div>

          <p className="text-sm text-neutral-500">
            Total laporan
          </p>

          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {semuaLaporan.length}
          </p>

        </div>

        {/* TERSEDIA */}

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

            <CheckCircle2
              size={19}
            />

          </div>

          <p className="text-sm text-neutral-500">
            Laporan tersedia
          </p>

          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {jumlahTersedia}
          </p>

        </div>

        {/* BELUM TERSEDIA */}

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">

            <Clock
              size={19}
            />

          </div>

          <p className="text-sm text-neutral-500">
            Belum tersedia
          </p>

          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {
              jumlahBelumTersedia
            }
          </p>

        </div>

      </div>

      {/* =====================================
          FILTER
      ===================================== */}

      <div className="mb-6">

        <div className="mb-3">

          <h2 className="text-lg font-semibold text-neutral-900">
            Daftar Laporan
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Pilih jenis laporan yang
            ingin kamu lihat.
          </p>

        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">

          {filterOptions.map(
            (option) => (

              <button
                key={option}
                type="button"
                onClick={() =>
                  setFilter(
                    option
                  )
                }
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === option
                    ? "bg-blue-600 text-white"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {option}
              </button>

            )
          )}

        </div>

      </div>

      {/* =====================================
          LIST LAPORAN
      ===================================== */}

      {laporanTampil.length > 0 ? (

        <div className="space-y-3">

          {laporanTampil.map(
            (laporan) => {
              const Icon =
                iconMap[
                  laporan.tipe
                ];

              return (
                <div
                  key={
                    laporan.id
                  }
                  className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >

                  <div className="flex flex-col gap-5 md:flex-row md:items-center">

                    {/* =========================
                        INFO
                    ========================= */}

                    <div className="flex min-w-0 flex-1 items-start gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                        <Icon
                          size={20}
                        />

                      </div>

                      <div className="min-w-0">

                        <div className="mb-1 flex flex-wrap items-center gap-2">

                          <span className="text-xs font-medium text-blue-600">
                            {
                              laporan.tipe
                            }
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                              laporan.status ===
                              "Tersedia"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {
                              laporan.status
                            }
                          </span>

                        </div>

                        <h3 className="font-semibold text-neutral-900">
                          {
                            laporan.judul
                          }
                        </h3>

                        <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                          {
                            laporan.deskripsi
                          }
                        </p>

                      </div>

                    </div>

                    {/* =========================
                        PERIODE
                    ========================= */}

                    <div className="flex shrink-0 flex-col gap-2 text-sm md:min-w-[200px]">

                      <div className="flex items-center gap-2 text-neutral-500">

                        <CalendarDays
                          size={15}
                        />

                        <span>
                          {laporan.periode ===
                          "-"
                            ? "Periode belum ditentukan"
                            : laporan.periode}
                        </span>

                      </div>

                      <div className="flex items-center gap-2 text-neutral-400">

                        <Clock
                          size={15}
                        />

                        <span>
                          {laporan.tanggal ===
                          "-"
                            ? "Belum diperbarui"
                            : `Diperbarui ${laporan.tanggal}`}
                        </span>

                      </div>

                    </div>

                    {/* =========================
                        BUTTON
                    ========================= */}

                    <button
                      type="button"
                      disabled={
                        laporan.status !==
                        "Tersedia"
                      }
                      onClick={() =>
                        setSelectedLaporan(
                          laporan
                        )
                      }
                      className={`flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                        laporan.status ===
                        "Tersedia"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                      }`}
                    >

                      <Eye
                        size={16}
                      />

                      {laporan.status ===
                      "Tersedia"
                        ? "Lihat"
                        : "Belum tersedia"}

                      {laporan.status ===
                        "Tersedia" && (

                        <ChevronRight
                          size={16}
                        />

                      )}

                    </button>

                  </div>

                </div>
              );
            }
          )}

        </div>

      ) : (

        /* =====================================
            EMPTY
        ===================================== */

        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-50 px-6 text-center">

          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">

            <FileText
              size={24}
              className="text-neutral-400"
            />

          </div>

          <h3 className="text-sm font-semibold text-neutral-800">

            {semuaLaporan.length ===
            0
              ? "Belum ada laporan"
              : "Tidak ada laporan"}

          </h3>

          <p className="mt-1 max-w-sm text-xs leading-relaxed text-neutral-500">

            {semuaLaporan.length ===
            0
              ? "Pembimbing belum memberikan laporan untuk kamu."
              : "Belum ada laporan pada kategori yang dipilih."}

          </p>

        </div>

      )}

      {/* =====================================
          DETAIL MODAL
      ===================================== */}

      {selectedLaporan && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedLaporan(
              null
            )
          }
        >

          <EnterAnimation className="w-full max-w-2xl">

            <div
              onClick={(e) =>
                e.stopPropagation()
              }
              className="max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-7"
            >

              {/* =============================
                  MODAL HEADER
              ============================= */}

              <div className="mb-6 flex items-start justify-between gap-4">

                <div className="flex items-start gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                    {(() => {
                      const Icon =
                        iconMap[
                          selectedLaporan
                            .tipe
                        ];

                      return (
                        <Icon
                          size={20}
                        />
                      );
                    })()}

                  </div>

                  <div>

                    <p className="text-xs font-medium text-blue-600">
                      {
                        selectedLaporan
                          .tipe
                      }
                    </p>

                    <h2 className="mt-1 text-lg font-semibold leading-snug text-neutral-900">
                      {
                        selectedLaporan
                          .judul
                      }
                    </h2>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedLaporan(
                      null
                    )
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200"
                >
                  <X size={17} />
                </button>

              </div>

              {/* =============================
                  DETAIL
              ============================= */}

              <div className="space-y-4">

                {/* PERIODE */}

                <div className="rounded-2xl bg-neutral-50 p-4">

                  <p className="text-xs text-neutral-400">
                    Periode
                  </p>

                  <p className="mt-1 text-sm font-medium text-neutral-800">
                    {
                      selectedLaporan
                        .periode
                    }
                  </p>

                </div>

                {/* DESKRIPSI */}

                <div className="rounded-2xl bg-neutral-50 p-4">

                  <p className="text-xs text-neutral-400">
                    Deskripsi
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">
                    {
                      selectedLaporan
                        .deskripsi
                    }
                  </p>

                </div>

                {/* =============================
                    DOKUMEN
                ============================= */}

                <div className="rounded-2xl border border-neutral-200 bg-white p-4">

                  <div className="mb-4 flex items-center justify-between">

                    <div>

                      <p className="text-sm font-semibold text-neutral-800">
                        Dokumen laporan
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        Preview dokumen laporan
                      </p>

                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                      <FileText
                        size={19}
                      />

                    </div>

                  </div>

                  {/* ===========================
                      PDF PREVIEW
                  =========================== */}

                  {selectedLaporan.fileUrl &&
                  isPdf(
                    selectedLaporan.fileUrl
                  ) ? (

                    <iframe
                      src={
                        selectedLaporan.fileUrl
                      }
                      title={
                        selectedLaporan.judul
                      }
                      className="h-[450px] w-full rounded-xl border border-neutral-200"
                    />

                  ) : selectedLaporan.fileUrl ? (

                    <div className="flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 text-center">

                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">

                        <FileText
                          size={22}
                        />

                      </div>

                      <p className="text-sm font-semibold text-neutral-800">
                        Dokumen tersedia
                      </p>

                      <p className="mt-1 max-w-xs text-xs leading-relaxed text-neutral-500">
                        Preview hanya tersedia
                        untuk PDF. Buka dokumen
                        untuk melihat file.
                      </p>

                    </div>

                  ) : (

                    <div className="flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 text-center">

                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-neutral-400 shadow-sm">

                        <FileText
                          size={22}
                        />

                      </div>

                      <p className="text-sm font-semibold text-neutral-800">
                        File belum tersedia
                      </p>

                    </div>

                  )}

                </div>

              </div>

              {/* =============================
                  BUTTON OPEN
              ============================= */}

              {selectedLaporan.fileUrl && (

                <a
                  href={
                    selectedLaporan.fileUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >

                  <ExternalLink
                    size={17}
                  />

                  Buka Dokumen

                </a>

              )}

              {/* CLOSE */}

              <button
                type="button"
                onClick={() =>
                  setSelectedLaporan(
                    null
                  )
                }
                className="mt-3 w-full rounded-full border border-neutral-200 py-3 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
              >
                Tutup
              </button>

            </div>

          </EnterAnimation>

        </div>

      )}

    </div>
  );
}

// =========================================
// VALIDASI TIPE LAPORAN
// =========================================

function isLaporanType(
  value: string | null
): value is LaporanType {
  return (
    value ===
      "Laporan Mingguan" ||
    value ===
      "Laporan Bulanan" ||
    value ===
      "Laporan Akhir" ||
    value ===
      "Rekap Jurnal" ||
    value ===
      "Rekap Tugas" ||
    value ===
      "Rekap Absensi"
  );
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

// =========================================
// CEK PDF
// =========================================

function isPdf(
  url: string
) {
  const cleanUrl =
    url
      .split("?")[0]
      .toLowerCase();

  return cleanUrl.endsWith(
    ".pdf"
  );
}