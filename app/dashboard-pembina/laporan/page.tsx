"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileText,
  LayoutDashboard,
  Loader2,
  Pencil,
  Plus,
  Send,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

// =====================================================
// TYPES
// =====================================================

type ReportType =
  | "mingguan"
  | "bulanan"
  | "akhir";

type Participant = {
  id: string;
  user_id: string;
  nomor_peserta:
    | string
    | null;
  nama: string;
  foto_url:
    | string
    | null;
  status: string;
  divisi:
    | string
    | null;
  posisi:
    | string
    | null;
  tanggal_mulai:
    | string
    | null;
  tanggal_selesai:
    | string
    | null;
};

type Report = {
  id: string;
  peserta_id: string;
  pembimbing_id: string;
  tipe: ReportType;
  judul: string;
  periode:
    | string
    | null;
  deskripsi: string;
  file_url:
    | string
    | null;
  status: string;
  catatan_admin:
    | string
    | null;
  ditinjau_at:
    | string
    | null;

  tampil_ke_peserta:
    boolean;

  tampil_di_laporan:
    boolean;

  tampil_di_dashboard:
    boolean;

  created_at: string;
  updated_at: string;
};

type VisibilityType =
  | "none"
  | "laporan"
  | "dashboard"
  | "both";

// =====================================================
// HELPERS
// =====================================================

function getTypeLabel(
  type: ReportType
) {
  switch (type) {
    case "mingguan":
      return "Laporan Mingguan";

    case "bulanan":
      return "Laporan Bulanan";

    case "akhir":
      return "Laporan Akhir";

    default:
      return "Laporan";
  }
}

function getTypeDescription(
  type: ReportType
) {
  switch (type) {
    case "mingguan":
      return "Perkembangan peserta selama satu minggu.";

    case "bulanan":
      return "Evaluasi peserta selama satu bulan.";

    case "akhir":
      return "Rangkuman keseluruhan pelaksanaan magang.";

    default:
      return "";
  }
}

function formatDate(
  value:
    | string
    | null
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(
      `${value.slice(0, 10)}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function getStatusLabel(
  status: string
) {
  switch (
    status
      ?.toLowerCase()
      .trim()
  ) {
    case "menunggu":
      return "Menunggu Pemeriksaan";

    case "direvisi":
      return "Perlu Revisi";

    case "disetujui":
      return "Disetujui";

    case "ditolak":
      return "Ditolak";

    default:
      return status || "-";
  }
}

function getStatusClass(
  status: string
) {
  switch (
    status
      ?.toLowerCase()
      .trim()
  ) {
    case "menunggu":
      return "bg-amber-50 text-amber-700";

    case "direvisi":
      return "bg-blue-50 text-blue-700";

    case "disetujui":
      return "bg-emerald-50 text-emerald-700";

    case "ditolak":
      return "bg-red-50 text-red-700";

    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

function getVisibility(
  report: Report
): VisibilityType {
  if (
    !report.tampil_ke_peserta
  ) {
    return "none";
  }

  if (
    report.tampil_di_laporan &&
    report.tampil_di_dashboard
  ) {
    return "both";
  }

  if (
    report.tampil_di_laporan
  ) {
    return "laporan";
  }

  if (
    report.tampil_di_dashboard
  ) {
    return "dashboard";
  }

  return "none";
}

function getVisibilityLabel(
  report: Report
) {
  switch (
    getVisibility(
      report
    )
  ) {
    case "laporan":
      return "Halaman Laporan";

    case "dashboard":
      return "Dashboard";

    case "both":
      return "Dashboard + Laporan";

    default:
      return "Tidak ditampilkan";
  }
}

// =====================================================
// PAGE
// =====================================================

export default function PembimbingLaporanPage() {
  // ===================================================
  // DATA
  // ===================================================

  const [
    participants,
    setParticipants,
  ] = useState<
    Participant[]
  >([]);

  const [
    reports,
    setReports,
  ] = useState<
    Report[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  // ===================================================
  // FILTER
  // ===================================================

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filterPeserta,
    setFilterPeserta,
  ] = useState("");

  const [
    filterTipe,
    setFilterTipe,
  ] = useState<
    "semua" | ReportType
  >("semua");

  // ===================================================
  // MODAL
  // ===================================================

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingId,
    setEditingId,
  ] = useState<
    string | null
  >(null);

  // ===================================================
  // FORM
  // ===================================================

  const [
    pesertaId,
    setPesertaId,
  ] = useState("");

  const [
    tipe,
    setTipe,
  ] = useState<
    ReportType
  >("mingguan");

  const [
    judul,
    setJudul,
  ] = useState("");

  const [
    periode,
    setPeriode,
  ] = useState("");

  const [
    deskripsi,
    setDeskripsi,
  ] = useState("");

  const [
    fileUrl,
    setFileUrl,
  ] = useState("");

  const [
    visibility,
    setVisibility,
  ] = useState<
    VisibilityType
  >("laporan");

  // ===================================================
  // AUTH
  // ===================================================

  async function getHeaders() {
    const {
      data,
    } =
      await supabase.auth.getSession();

    const token =
      data.session
        ?.access_token;

    if (!token) {
      throw new Error(
        "Sesi login tidak ditemukan. Silakan login kembali."
      );
    }

    return {
      Authorization:
        `Bearer ${token}`,

      "Content-Type":
        "application/json",
    };
  }

  // ===================================================
  // LOAD
  // ===================================================

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const headers =
        await getHeaders();

      const response =
        await fetch(
          "/api/pembimbing/laporan",
          {
            method: "GET",
            headers,
            cache: "no-store",
          }
        );

      const json =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          json?.message ||
            "Gagal mengambil laporan."
        );
      }

      setParticipants(
        json?.participants ??
          []
      );

      setReports(
        json?.reports ??
          []
      );
    } catch (err) {
      console.error(
        "LOAD PEMBIMBING LAPORAN:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil laporan."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  // ===================================================
  // PARTICIPANT MAP
  // ===================================================

  const participantMap =
    useMemo(
      () =>
        new Map(
          participants.map(
            (item) => [
              item.id,
              item,
            ]
          )
        ),
      [participants]
    );

  // ===================================================
  // FILTERED REPORTS
  // ===================================================

  const filteredReports =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return reports.filter(
        (report) => {
          const participant =
            participantMap.get(
              report.peserta_id
            );

          const matchesSearch =
            !keyword ||
            report.judul
              .toLowerCase()
              .includes(
                keyword
              ) ||
            participant?.nama
              .toLowerCase()
              .includes(
                keyword
              ) ||
            participant?.nomor_peserta
              ?.toLowerCase()
              .includes(
                keyword
              );

          const matchesPeserta =
            !filterPeserta ||
            report.peserta_id ===
              filterPeserta;

          const matchesType =
            filterTipe ===
              "semua" ||
            report.tipe ===
              filterTipe;

          return (
            matchesSearch &&
            matchesPeserta &&
            matchesType
          );
        }
      );
    }, [
      reports,
      participantMap,
      search,
      filterPeserta,
      filterTipe,
    ]);

  // ===================================================
  // SUMMARY
  // ===================================================

  const totalReports =
    reports.length;

  const visibleReports =
    reports.filter(
      (item) =>
        item.tampil_ke_peserta
    ).length;

  const dashboardReports =
    reports.filter(
      (item) =>
        item.tampil_ke_peserta &&
        item.tampil_di_dashboard
    ).length;

  const waitingReports =
    reports.filter(
      (item) =>
        item.status ===
        "menunggu"
    ).length;

  // ===================================================
  // RESET FORM
  // ===================================================

  function resetForm() {
    setEditingId(null);

    setPesertaId("");

    setTipe(
      "mingguan"
    );

    setJudul("");

    setPeriode("");

    setDeskripsi("");

    setFileUrl("");

    setVisibility(
      "laporan"
    );

    setModalOpen(false);
  }

  // ===================================================
  // CREATE
  // ===================================================

  function openCreate(
    participantId = ""
  ) {
    setEditingId(null);

    setPesertaId(
      participantId
    );

    setTipe(
      "mingguan"
    );

    setJudul("");

    setPeriode("");

    setDeskripsi("");

    setFileUrl("");

    setVisibility(
      "laporan"
    );

    setError("");

    setSuccess("");

    setModalOpen(true);
  }

  // ===================================================
  // EDIT
  // ===================================================

  function openEdit(
    report: Report
  ) {
    setEditingId(
      report.id
    );

    setPesertaId(
      report.peserta_id
    );

    setTipe(
      report.tipe
    );

    setJudul(
      report.judul
    );

    setPeriode(
      report.periode ??
        ""
    );

    setDeskripsi(
      report.deskripsi
    );

    setFileUrl(
      report.file_url ??
        ""
    );

    setVisibility(
      getVisibility(
        report
      )
    );

    setError("");

    setSuccess("");

    setModalOpen(true);
  }

  // ===================================================
  // SAVE
  // ===================================================

  async function saveReport() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!pesertaId) {
        throw new Error(
          "Peserta wajib dipilih."
        );
      }

      if (!judul.trim()) {
        throw new Error(
          "Judul laporan wajib diisi."
        );
      }

      if (!deskripsi.trim()) {
        throw new Error(
          "Isi laporan wajib diisi."
        );
      }

      let tampilKePeserta =
        false;

      let tampilDiLaporan =
        false;

      let tampilDiDashboard =
        false;

      if (
        visibility ===
        "laporan"
      ) {
        tampilKePeserta =
          true;

        tampilDiLaporan =
          true;
      }

      if (
        visibility ===
        "dashboard"
      ) {
        tampilKePeserta =
          true;

        tampilDiDashboard =
          true;
      }

      if (
        visibility ===
        "both"
      ) {
        tampilKePeserta =
          true;

        tampilDiLaporan =
          true;

        tampilDiDashboard =
          true;
      }

      const headers =
        await getHeaders();

      const payload = {
        peserta_id:
          pesertaId,

        tipe,

        judul:
          judul.trim(),

        periode:
          periode.trim(),

        deskripsi:
          deskripsi.trim(),

        file_url:
          fileUrl.trim() ||
          null,

        tampil_ke_peserta:
          tampilKePeserta,

        tampil_di_laporan:
          tampilDiLaporan,

        tampil_di_dashboard:
          tampilDiDashboard,
      };

      const response =
        await fetch(
          "/api/pembimbing/laporan",
          {
            method:
              editingId
                ? "PATCH"
                : "POST",

            headers,

            body: JSON.stringify(
              editingId
                ? {
                    id:
                      editingId,
                    ...payload,
                  }
                : payload
            ),
          }
        );

      const json =
        await response.json();

const responseText = await response.text();

let responseData: any = {};

try {
  responseData = responseText
    ? JSON.parse(responseText)
    : {};
} catch {
  responseData = {
    raw: responseText,
  };
}

console.error("SAVE REPORT API RESPONSE:", {
  status: response.status,
  statusText: response.statusText,
  data: responseData,
});

if (!response.ok) {
  throw new Error(
    responseData?.detail ||
    responseData?.error ||
    responseData?.message ||
    responseData?.raw ||
    `Gagal menyimpan laporan. HTTP ${response.status}`
  );
}

      setSuccess(
        editingId
          ? "Laporan berhasil diperbarui."
          : "Laporan berhasil dibuat."
      );

      resetForm();

      await loadReports();
    } catch (err) {
      console.error(
        "SAVE REPORT:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan laporan."
      );
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // DELETE
  // ===================================================

  async function deleteReport(
    reportId: string
  ) {
    const confirmed =
      window.confirm(
        "Apakah laporan ini ingin dihapus?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const headers =
        await getHeaders();

      const response =
        await fetch(
          "/api/pembimbing/laporan",
          {
            method: "DELETE",

            headers,

            body: JSON.stringify({
              id: reportId,
            }),
          }
        );

      const json =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          json?.message ||
            "Gagal menghapus laporan."
        );
      }

      setSuccess(
        "Laporan berhasil dihapus."
      );

      await loadReports();
    } catch (err) {
      console.error(
        "DELETE REPORT:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus laporan."
      );
    }
  }

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin text-blue-600"
          />

          <p className="mt-3 text-sm text-neutral-500">
            Memuat laporan peserta...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <FileText
              size={19}
              className="text-blue-600"
            />

            <span className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
              Pembimbing
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Laporan Peserta
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Buat dan kelola laporan perkembangan
            peserta bimbingan, mulai dari laporan
            mingguan, bulanan, hingga laporan akhir.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            openCreate()
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={17} />

          Buat Laporan
        </button>
      </div>

      {/* =================================================
          ALERT
      ================================================= */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={
            <Users size={18} />
          }
          label="Peserta Bimbingan"
          value={
            participants.length
          }
        />

        <SummaryCard
          icon={
            <FileText size={18} />
          }
          label="Total Laporan"
          value={
            totalReports
          }
        />

        <SummaryCard
          icon={
            <Eye size={18} />
          }
          label="Tampil ke Peserta"
          value={
            visibleReports
          }
        />

        <SummaryCard
          icon={
            <LayoutDashboard
              size={18}
            />
          }
          label="Tampil di Dashboard"
          value={
            dashboardReports
          }
        />
      </div>

      {/* =================================================
          FILTER
      ================================================= */}

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr]">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Cari judul laporan atau nama peserta..."
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <select
            value={
              filterPeserta
            }
            onChange={(event) =>
              setFilterPeserta(
                event.target.value
              )
            }
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">
              Semua Peserta
            </option>

            {participants.map(
              (participant) => (
                <option
                  key={
                    participant.id
                  }
                  value={
                    participant.id
                  }
                >
                  {
                    participant.nama
                  }
                </option>
              )
            )}
          </select>

          <select
            value={
              filterTipe
            }
            onChange={(event) =>
              setFilterTipe(
                event.target.value as
                  | "semua"
                  | ReportType
              )
            }
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="semua">
              Semua Jenis Laporan
            </option>

            <option value="mingguan">
              Laporan Mingguan
            </option>

            <option value="bulanan">
              Laporan Bulanan
            </option>

            <option value="akhir">
              Laporan Akhir
            </option>
          </select>
        </div>
      </div>

      {/* =================================================
          REPORT LIST
      ================================================= */}

      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-neutral-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-neutral-900">
              Daftar Laporan
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              {filteredReports.length} laporan
              ditampilkan.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadReports()
            }
            className="self-start rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
          >
            Refresh
          </button>
        </div>

        {filteredReports.length ===
        0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <FileText
                size={21}
              />
            </div>

            <p className="mt-4 text-sm font-semibold text-neutral-800">
              Belum ada laporan
            </p>

            <p className="mt-1 text-sm text-neutral-500">
              Buat laporan pertama untuk peserta
              bimbingan Anda.
            </p>

            <button
              type="button"
              onClick={() =>
                openCreate()
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              Buat Laporan
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredReports.map(
              (report) => {
                const participant =
                  participantMap.get(
                    report.peserta_id
                  );

                return (
                  <div
                    key={
                      report.id
                    }
                    className="p-5 transition hover:bg-neutral-50"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {getTypeLabel(
                              report.tipe
                            )}
                          </span>

                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                              report.status
                            )}`}
                          >
                            {getStatusLabel(
                              report.status
                            )}
                          </span>
                        </div>

                        <h3 className="mt-3 text-base font-semibold text-neutral-900">
                          {report.judul}
                        </h3>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                          <span className="font-medium text-neutral-700">
                            {
                              participant?.nama
                            }
                          </span>

                          <span>
                            •
                          </span>

                          <span>
                            {
                              participant?.nomor_peserta ??
                              "-"
                            }
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays
                              size={14}
                            />

                            {report.periode ||
                              "Periode tidak diisi"}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            {report.tampil_ke_peserta ? (
                              <Eye
                                size={14}
                              />
                            ) : (
                              <Eye
                                size={14}
                                className="opacity-40"
                              />
                            )}

                            {getVisibilityLabel(
                              report
                            )}
                          </span>
                        </div>

                        <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-neutral-600">
                          {
                            report.deskripsi
                          }
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openEdit(
                              report
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                        >
                          <Pencil
                            size={14}
                          />

                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void deleteReport(
                              report.id
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          <Trash2
                            size={14}
                          />

                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {/* =================================================
          MODAL
      ================================================= */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* HEADER */}

            <div className="flex items-start justify-between border-b border-neutral-200 px-6 py-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FileText
                      size={19}
                    />
                  </div>

                  <div>
                    <h2 className="font-semibold text-neutral-900">
                      {editingId
                        ? "Edit Laporan"
                        : "Buat Laporan Peserta"}
                    </h2>

                    <p className="mt-0.5 text-xs text-neutral-500">
                      Tulis laporan perkembangan
                      peserta bimbingan.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() => {
                  resetForm();
                  setError("");
                }}
                className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X size={19} />
              </button>
            </div>

            {/* BODY */}

            <div className="overflow-y-auto p-6">
              <div className="space-y-6">
                {/* PESERTA */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-neutral-800">
                    Peserta
                  </label>

                  <select
                    value={
                      pesertaId
                    }
                    disabled={
                      saving
                    }
                    onChange={(
                      event
                    ) =>
                      setPesertaId(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Pilih peserta bimbingan
                    </option>

                    {participants.map(
                      (
                        participant
                      ) => (
                        <option
                          key={
                            participant.id
                          }
                          value={
                            participant.id
                          }
                        >
                          {
                            participant.nama
                          }{" "}
                          —{" "}
                          {
                            participant.nomor_peserta
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* TIPE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-neutral-800">
                    Jenis Laporan
                  </label>

                  <div className="grid gap-3 md:grid-cols-3">
                    {(
                      [
                        [
                          "mingguan",
                          "Laporan Mingguan",
                        ],
                        [
                          "bulanan",
                          "Laporan Bulanan",
                        ],
                        [
                          "akhir",
                          "Laporan Akhir",
                        ],
                      ] as const
                    ).map(
                      (
                        [value, label]
                      ) => (
                        <button
                          key={
                            value
                          }
                          type="button"
                          disabled={
                            saving
                          }
                          onClick={() =>
                            setTipe(
                              value
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition ${
                            tipe ===
                            value
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                              : "border-neutral-200 bg-white hover:bg-neutral-50"
                          }`}
                        >
                          <p className="text-sm font-semibold text-neutral-900">
                            {label}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-neutral-500">
                            {getTypeDescription(
                              value
                            )}
                          </p>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* JUDUL */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-neutral-800">
                    Judul Laporan
                  </label>

                  <input
                    value={
                      judul
                    }
                    disabled={
                      saving
                    }
                    onChange={(
                      event
                    ) =>
                      setJudul(
                        event.target
                          .value
                      )
                    }
                    placeholder="Contoh: Perkembangan Peserta Minggu Ke-1"
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* PERIODE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-neutral-800">
                    Periode
                  </label>

                  <input
                    value={
                      periode
                    }
                    disabled={
                      saving
                    }
                    onChange={(
                      event
                    ) =>
                      setPeriode(
                        event.target
                          .value
                      )
                    }
                    placeholder="Contoh: 01 - 07 Oktober 2026"
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* ISI */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-neutral-800">
                    Isi Laporan
                  </label>

                  <textarea
                    rows={10}
                    value={
                      deskripsi
                    }
                    disabled={
                      saving
                    }
                    onChange={(
                      event
                    ) =>
                      setDeskripsi(
                        event.target
                          .value
                      )
                    }
                    placeholder={`Tuliskan perkembangan peserta.

Contoh:
- Kegiatan yang dilakukan
- Perkembangan kemampuan
- Pencapaian
- Kendala
- Sikap dan kedisiplinan
- Hal yang perlu ditingkatkan
- Rekomendasi pembimbing`}
                    className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* FILE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-neutral-800">
                    Lampiran
                    <span className="ml-1 font-normal text-neutral-400">
                      (opsional)
                    </span>
                  </label>

                  <input
                    value={
                      fileUrl
                    }
                    disabled={
                      saving
                    }
                    onChange={(
                      event
                    ) =>
                      setFileUrl(
                        event.target
                          .value
                      )
                    }
                    placeholder="URL file laporan jika ada"
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* VISIBILITY */}

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-neutral-800">
                      Tampilkan kepada peserta
                    </label>

                    <span className="text-xs text-neutral-400">
                      Atur lokasi tampilan
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <VisibilityOption
                      value="none"
                      selected={
                        visibility ===
                        "none"
                      }
                      onClick={() =>
                        setVisibility(
                          "none"
                        )
                      }
                      icon={
                        <Eye
                          size={17}
                        />
                      }
                      title="Tidak ditampilkan"
                      description="Hanya pembimbing dan admin yang dapat melihat."
                    />

                    <VisibilityOption
                      value="laporan"
                      selected={
                        visibility ===
                        "laporan"
                      }
                      onClick={() =>
                        setVisibility(
                          "laporan"
                        )
                      }
                      icon={
                        <FileText
                          size={17}
                        />
                      }
                      title="Halaman Laporan"
                      description="Muncul di halaman laporan peserta."
                    />

                    <VisibilityOption
                      value="dashboard"
                      selected={
                        visibility ===
                        "dashboard"
                      }
                      onClick={() =>
                        setVisibility(
                          "dashboard"
                        )
                      }
                      icon={
                        <LayoutDashboard
                          size={17}
                        />
                      }
                      title="Dashboard"
                      description="Muncul sebagai informasi di dashboard peserta."
                    />

                    <VisibilityOption
                      value="both"
                      selected={
                        visibility ===
                        "both"
                      }
                      onClick={() =>
                        setVisibility(
                          "both"
                        )
                      }
                      icon={
                        <CheckCircle2
                          size={17}
                        />
                      }
                      title="Dashboard + Laporan"
                      description="Muncul di kedua tempat."
                    />
                  </div>
                </div>

                {/* INFO */}

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex gap-3">
                    <Send
                      size={17}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-blue-800">
                        Status pemeriksaan
                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-700">
                        Laporan yang dibuat akan masuk
                        ke status{" "}
                        <strong>
                          Menunggu Pemeriksaan
                        </strong>
                        . Jika isi laporan diedit,
                        status pemeriksaan akan kembali
                        menjadi menunggu.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="flex flex-col-reverse gap-3 border-t border-neutral-200 bg-neutral-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() => {
                  resetForm();
                  setError("");
                }}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() =>
                  void saveReport()
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Send
                    size={16}
                  />
                )}

                {editingId
                  ? "Simpan Perubahan"
                  : "Simpan Laporan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

// =====================================================
// VISIBILITY OPTION
// =====================================================

function VisibilityOption({
  value,
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  value: VisibilityType;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        selected
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
          : "border-neutral-200 bg-white hover:bg-neutral-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            selected
              ? "bg-blue-600 text-white"
              : "bg-neutral-100 text-neutral-500"
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-neutral-500">
            {description}
          </p>
        </div>
      </div>
    </button>
  );
}