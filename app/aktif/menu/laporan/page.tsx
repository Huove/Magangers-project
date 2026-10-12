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
  RefreshCw,
  Loader2,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

// =========================================
// TYPES
// =========================================

type LaporanType =
  | "Laporan Mingguan"
  | "Laporan Bulanan"
  | "Laporan Akhir"
  | "Rekap Jurnal"
  | "Rekap Tugas"
  | "Rekap Absensi";

type StatusLaporan = "Tersedia";

type LaporanDatabase = {
  id: string;
  peserta_id: string;
  pembimbing_id: string;
  tipe: string | null;
  judul: string | null;
  periode: string | null;
  deskripsi: string | null;
  file_url: string | null;
  status: string | null;
  catatan_admin: string | null;
  ditinjau_at: string | null;
  tampil_ke_peserta: boolean | null;
  tampil_di_laporan: boolean | null;
  tampil_di_dashboard: boolean | null;
  created_at: string;
  updated_at: string;
};

type Laporan = {
  id: string;
  tipe: LaporanType;
  judul: string;
  periode: string;
  deskripsi: string;
  status: StatusLaporan;
  tanggal: string;
  fileUrl: string | null;
  catatanAdmin: string | null;
};

// =========================================
// FILTER
// =========================================

const filterOptions: ("Semua" | LaporanType)[] = [
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

const iconMap: Record<LaporanType, LucideIcon> = {
  "Laporan Mingguan": CalendarDays,
  "Laporan Bulanan": FileText,
  "Laporan Akhir": BookOpen,
  "Rekap Jurnal": ClipboardList,
  "Rekap Tugas": FileText,
  "Rekap Absensi": Clock,
};

// =========================================
// NORMALISASI TIPE LAPORAN
// =========================================

function normalizeLaporanType(
  value: string | null
): LaporanType | null {
  const tipe = String(value ?? "")
    .trim()
    .toLowerCase();

  switch (tipe) {
    case "mingguan":
    case "laporan mingguan":
      return "Laporan Mingguan";

    case "bulanan":
    case "laporan bulanan":
      return "Laporan Bulanan";

    case "akhir":
    case "laporan akhir":
      return "Laporan Akhir";

    case "rekap jurnal":
      return "Rekap Jurnal";

    case "rekap tugas":
      return "Rekap Tugas";

    case "rekap absensi":
      return "Rekap Absensi";

    default:
      return null;
  }
}

// =========================================
// FORMAT TANGGAL
// =========================================

function formatTanggal(
  value: string | null | undefined
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// =========================================
// CEK PDF
// =========================================

function isPdf(url: string) {
  const cleanUrl = url
    .split("?")[0]
    .toLowerCase();

  return cleanUrl.endsWith(".pdf");
}

// =========================================
// PAGE
// =========================================

export default function LaporanPage() {
  const [filter, setFilter] = useState<
    "Semua" | LaporanType
  >("Semua");

  const [
    selectedLaporan,
    setSelectedLaporan,
  ] = useState<Laporan | null>(null);

  const [
    laporanDatabase,
    setLaporanDatabase,
  ] = useState<LaporanDatabase[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // =========================================
  // FETCH LAPORAN DARI API
  // =========================================

  const fetchLaporan = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // =====================================
      // AMBIL TOKEN LOGIN
      // =====================================

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const token = session?.access_token;

      if (!token) {
        throw new Error(
          "Sesi login tidak ditemukan. Silakan login kembali."
        );
      }

      // =====================================
      // REQUEST API LAPORAN PESERTA
      // =====================================

      const response = await fetch(
        "/api/aktif/laporan",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      // Baca response hanya satu kali.
      const responseText = await response.text();

      let responseData: {
        success?: boolean;
        message?: string;
        detail?: string;
        data?: LaporanDatabase[];
      } = {};

      try {
        responseData = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          `API laporan mengembalikan respons tidak valid. HTTP ${response.status}.`
        );
      }

      if (!response.ok || responseData.success === false) {
        throw new Error(
          responseData.detail ||
            responseData.message ||
            `Gagal mengambil laporan. HTTP ${response.status}.`
        );
      }

      setLaporanDatabase(
        Array.isArray(responseData.data)
          ? responseData.data
          : []
      );
    } catch (err) {
      console.error(
        "GAGAL MENGAMBIL LAPORAN PESERTA:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data laporan."
      );

      setLaporanDatabase([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // =========================================
  // LOAD PERTAMA
  // =========================================

  useEffect(() => {
    void fetchLaporan();
  }, [fetchLaporan]);

  // =========================================
  // REFRESH
  // =========================================

  async function handleRefresh() {
    setRefreshing(true);
    await fetchLaporan();
  }

  // =========================================
  // FORMAT DATA API → UI
  // =========================================

  const semuaLaporan = useMemo(() => {
    return laporanDatabase.flatMap((item) => {
      const tipe = normalizeLaporanType(item.tipe);

      if (!tipe) {
        return [];
      }

      return [
        {
          id: item.id,
          tipe,
          judul:
            item.judul?.trim() ||
            tipe,
          periode:
            item.periode?.trim() ||
            "-",
          deskripsi:
            item.deskripsi?.trim() ||
            "-",

          // API hanya mengembalikan laporan
          // yang sudah disetujui dan ditampilkan.
          status: "Tersedia" as StatusLaporan,

          tanggal: formatTanggal(
            item.updated_at ||
              item.ditinjau_at ||
              item.created_at
          ),

          fileUrl: item.file_url || null,
          catatanAdmin: item.catatan_admin || null,
        },
      ];
    });
  }, [laporanDatabase]);

  // =========================================
  // FILTER LAPORAN
  // =========================================

  const laporanTampil = useMemo(() => {
    if (filter === "Semua") {
      return semuaLaporan;
    }

    return semuaLaporan.filter(
      (laporan) => laporan.tipe === filter
    );
  }, [filter, semuaLaporan]);

  // =========================================
  // STATISTIK
  // =========================================

  const jumlahTersedia = semuaLaporan.length;

  const jumlahBelumTersedia = 0;

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center bg-white">
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
  // RENDER
  // =========================================

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      {/* HEADER */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
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
            Lihat laporan dan rekap kegiatan yang
            diberikan oleh pembimbing selama
            pelaksanaan magang.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={
              refreshing ? "animate-spin" : ""
            }
          />

          Refresh
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Gagal memuat laporan
            </p>

            <p className="mt-1">{error}</p>

            <button
              type="button"
              onClick={() => void fetchLaporan()}
              className="mt-3 font-semibold underline"
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {/* STATISTIK */}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* TOTAL */}

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileText size={19} />
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
            <CheckCircle2 size={19} />
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
            <Clock size={19} />
          </div>

          <p className="text-sm text-neutral-500">
            Belum tersedia
          </p>

          <p className="mt-1 text-2xl font-semibold text-neutral-900">
            {jumlahBelumTersedia}
          </p>
        </div>
      </div>

      {/* DAFTAR LAPORAN */}

      <div>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-neutral-900">
            Daftar Laporan
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Pilih jenis laporan yang ingin kamu lihat.
          </p>
        </div>

        {/* FILTER */}

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {filterOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === option
                  ? "bg-blue-600 text-white"
                  : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* LIST LAPORAN */}

      {laporanTampil.length > 0 ? (
        <div className="space-y-3">
          {laporanTampil.map((laporan) => {
            const Icon = iconMap[laporan.tipe];

            return (
              <div
                key={laporan.id}
                className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  {/* INFO */}

                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon size={20} />
                    </div>

                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-blue-600">
                          {laporan.tipe}
                        </span>

                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                          Disetujui
                        </span>
                      </div>

                      <h3 className="font-semibold text-neutral-900">
                        {laporan.judul}
                      </h3>

                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-500">
                        {laporan.deskripsi}
                      </p>
                    </div>
                  </div>

                  {/* PERIODE */}

                  <div className="flex shrink-0 flex-col gap-2 text-sm md:min-w-[200px]">
                    <div className="flex items-center gap-2 text-neutral-500">
                      <CalendarDays size={15} />

                      <span>
                        {laporan.periode === "-"
                          ? "Periode belum ditentukan"
                          : laporan.periode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-neutral-400">
                      <Clock size={15} />

                      <span>
                        {laporan.tanggal === "-"
                          ? "Belum diperbarui"
                          : `Diperbarui ${laporan.tanggal}`}
                      </span>
                    </div>
                  </div>

                  {/* BUTTON */}

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedLaporan(laporan)
                    }
                    className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Eye size={16} />

                    Lihat

                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* EMPTY */

        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-50 px-6 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
            <FileText
              size={24}
              className="text-neutral-400"
            />
          </div>

          <h3 className="text-sm font-semibold text-neutral-800">
            {semuaLaporan.length === 0
              ? "Belum ada laporan"
              : "Tidak ada laporan"}
          </h3>

          <p className="mt-1 max-w-sm text-xs leading-relaxed text-neutral-500">
            {semuaLaporan.length === 0
              ? "Belum ada laporan yang disetujui admin dan diatur untuk ditampilkan di halaman laporan."
              : "Belum ada laporan pada kategori yang dipilih."}
          </p>

          {semuaLaporan.length === 0 && (
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <RefreshCw size={15} />
              )}

              Muat Ulang
            </button>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}

      {selectedLaporan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={() => setSelectedLaporan(null)}
        >
          <EnterAnimation className="w-full max-w-2xl">
            <div
              onClick={(event) => event.stopPropagation()}
              className="max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl md:p-7"
            >
              {/* MODAL HEADER */}

              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {(() => {
                      const Icon =
                        iconMap[selectedLaporan.tipe];

                      return <Icon size={20} />;
                    })()}
                  </div>

                  <div>
                    <p className="text-xs font-medium text-blue-600">
                      {selectedLaporan.tipe}
                    </p>

                    <h2 className="mt-1 text-lg font-semibold leading-snug text-neutral-900">
                      {selectedLaporan.judul}
                    </h2>

                    <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      Disetujui admin
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedLaporan(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200"
                >
                  <X size={17} />
                </button>
              </div>

              {/* DETAIL */}

              <div className="space-y-4">
                {/* PERIODE */}

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs text-neutral-400">
                    Periode
                  </p>

                  <p className="mt-1 text-sm font-medium text-neutral-800">
                    {selectedLaporan.periode}
                  </p>
                </div>

                {/* TANGGAL */}

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs text-neutral-400">
                    Tanggal diperbarui
                  </p>

                  <p className="mt-1 text-sm font-medium text-neutral-800">
                    {selectedLaporan.tanggal}
                  </p>
                </div>

                {/* DESKRIPSI */}

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-xs text-neutral-400">
                    Isi laporan
                  </p>

                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">
                    {selectedLaporan.deskripsi}
                  </p>
                </div>

                {/* CATATAN ADMIN */}

                {selectedLaporan.catatanAdmin && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-semibold text-blue-800">
                      Catatan admin
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-blue-700">
                      {selectedLaporan.catatanAdmin}
                    </p>
                  </div>
                )}

                {/* DOKUMEN */}

                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">
                        Dokumen laporan
                      </p>

                      <p className="mt-1 text-xs text-neutral-400">
                        Lampiran dari pembimbing
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FileText size={19} />
                    </div>
                  </div>

                  {selectedLaporan.fileUrl &&
                  isPdf(selectedLaporan.fileUrl) ? (
                    <iframe
                      src={selectedLaporan.fileUrl}
                      title={selectedLaporan.judul}
                      className="h-[450px] w-full rounded-xl border border-neutral-200"
                    />
                  ) : selectedLaporan.fileUrl ? (
                    <div className="flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                        <FileText size={22} />
                      </div>

                      <p className="text-sm font-semibold text-neutral-800">
                        Dokumen tersedia
                      </p>

                      <p className="mt-1 max-w-xs text-xs leading-relaxed text-neutral-500">
                        Preview hanya tersedia untuk PDF.
                        Gunakan tombol di bawah untuk membuka
                        dokumen.
                      </p>
                    </div>
                  ) : (
                    <div className="flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 text-center">
                      <FileText
                        size={24}
                        className="mb-3 text-neutral-400"
                      />

                      <p className="text-sm font-semibold text-neutral-800">
                        Tidak ada lampiran
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Isi laporan tetap dapat dibaca di atas.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* BUKA DOKUMEN */}

              {selectedLaporan.fileUrl && (
                <a
                  href={selectedLaporan.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <ExternalLink size={17} />

                  Buka Dokumen
                </a>
              )}

              {/* TUTUP */}

              <button
                type="button"
                onClick={() => setSelectedLaporan(null)}
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