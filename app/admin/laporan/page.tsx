"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ReportFilter from "@/components/admin/report/ReportFilter";
import ReportTable from "@/components/admin/report/ReportTable";
import ReportDrawer from "@/components/admin/report/ReportDrawer";
import StatCard from "@/components/admin/dashboard/StatisticCard";

import {
  getAdminReports,
  updateAdminReport,
  type AdminReport,
  type AdminReportStatus,
} from "@/lib/admin/laporanService";

import {
  FileText,
  Clock3,
  CircleCheckBig,
  RotateCcw,
  CircleX,
} from "lucide-react";


// =====================================================
// TYPE FRONTEND
// =====================================================

export interface Report {
  // UUID laporan
  id: string;

  pesertaId: string;

  peserta: string;

  judul: string;

  tipe: string;

  periode: string;

  tanggal: string;

  pembimbing: string;

  status: string;

  deskripsi: string;

  catatan?: string;

  ditinjauAt?: string | null;

  lampiran?: {
    nama: string;

    ukuran: string;

    url?: string;
  };
}


// =====================================================
// PAGE
// =====================================================

export default function ReportPage() {
  // ===================================================
  // DATA
  // ===================================================

  const [
    reports,
    setReports,
  ] = useState<Report[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  // ===================================================
  // FILTER
  // ===================================================

  const [
    search,
    setSearch,
  ] = useState("");


  const [
    status,
    setStatus,
  ] = useState(
    "Semua Status"
  );


  // ===================================================
  // DRAWER
  // ===================================================

  const [
    selectedReport,
    setSelectedReport,
  ] =
    useState<Report | null>(
      null
    );


  const [
    drawerOpen,
    setDrawerOpen,
  ] = useState(false);


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchReports();
  }, []);


  // ===================================================
  // FETCH LAPORAN
  //
  // PAGE
  // ↓
  // laporanService.ts
  // ↓
  // GET /api/admin/laporan
  // ↓
  // requireAdmin()
  // ↓
  // SUPABASE
  // ===================================================

  async function fetchReports(
    isRefresh = false
  ) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");


      // ===============================================
      // APPLICATION BACKEND
      // ===============================================

      const data =
        await getAdminReports();


      // ===============================================
      // API DATA → UI
      // ===============================================

      const formatted =
        data.map(
          mapAdminReport
        );


      setReports(
        formatted
      );


      // ===============================================
      // UPDATE DRAWER
      // JIKA REPORT YANG SAMA SEDANG DIBUKA
      // ===============================================

      setSelectedReport(
        (current) => {
          if (!current) {
            return null;
          }

          return (
            formatted.find(
              (item) =>
                item.id ===
                current.id
            ) ??
            current
          );
        }
      );

    } catch (err) {
      console.error(
        "FETCH LAPORAN ERROR:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengambil data laporan.";


      setError(
        message
      );

      setReports([]);

    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  }


  // ===================================================
  // FILTER
  // ===================================================

  const filteredData =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();


      return reports.filter(
        (item) => {
          const matchSearch =
            !keyword ||

            item.peserta
              .toLowerCase()
              .includes(
                keyword
              ) ||

            item.judul
              .toLowerCase()
              .includes(
                keyword
              ) ||

            item.pembimbing
              .toLowerCase()
              .includes(
                keyword
              ) ||

            item.tipe
              .toLowerCase()
              .includes(
                keyword
              );


          const matchStatus =
            status ===
              "Semua Status" ||

            item.status ===
              status;


          return (
            matchSearch &&
            matchStatus
          );
        }
      );

    }, [
      reports,
      search,
      status,
    ]);


  // ===================================================
  // UPDATE LAPORAN
  //
  // Drawer
  // ↓
  // laporanService.ts
  // ↓
  // PUT /api/admin/laporan/:id
  // ↓
  // requireAdmin()
  // ↓
  // update laporan
  // ↓
  // status_history
  // ↓
  // notifikasi peserta
  // ↓
  // audit trigger
  // ===================================================

  async function handleUpdateReport(
    updatedReport: Report
  ) {
    try {
      setError("");


      // ===============================================
      // STATUS UI → DATABASE
      // ===============================================

      const databaseStatus =
        getDatabaseStatus(
          updatedReport.status
        );


      const catatan =
        updatedReport.catatan
          ?.trim() ??
        "";


      // ===============================================
      // VALIDASI
      // ===============================================

      if (
        databaseStatus ===
          "direvisi" &&
        !catatan
      ) {
        throw new Error(
          "Catatan revisi wajib diisi."
        );
      }


      // ===============================================
      // APPLICATION BACKEND
      // ===============================================

      const result =
        await updateAdminReport(
          updatedReport.id,
          {
            status:
              databaseStatus,

            catatan,
          }
        );


      console.log(
        "REPORT UPDATED:",
        result
      );


      // ===============================================
      // WARNING NON-CRITICAL
      // ===============================================

      if (
        result.warnings &&
        result.warnings.length >
          0
      ) {
        console.warn(
          "REPORT UPDATE WARNINGS:",
          result.warnings
        );
      }


      // ===============================================
      // REFRESH DATA
      // ===============================================

      await fetchReports(
        true
      );

    } catch (err) {
      console.error(
        "UPDATE LAPORAN ERROR:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal memperbarui laporan.";


      setError(
        message
      );


      alert(
        message
      );


      // Drawer membutuhkan Promise reject
      // jika proses gagal.
      throw err;
    }
  }


  // ===================================================
  // DETAIL
  // ===================================================

  function handleDetail(
    report: Report
  ) {
    setSelectedReport(
      report
    );

    setDrawerOpen(
      true
    );
  }


  // ===================================================
  // REFRESH
  // ===================================================

  async function handleRefresh() {
    setSearch("");

    setStatus(
      "Semua Status"
    );

    await fetchReports(
      true
    );
  }


  // ===================================================
  // EXPORT CSV
  // ===================================================

  function handleExport() {
    if (
      reports.length ===
      0
    ) {
      alert(
        "Tidak ada laporan untuk diexport."
      );

      return;
    }


    const rows = [
      [
        "Peserta",
        "Judul",
        "Tipe",
        "Periode",
        "Tanggal",
        "Pembimbing",
        "Status",
        "Catatan",
      ],

      ...reports.map(
        (item) => [
          item.peserta,
          item.judul,
          item.tipe,
          item.periode,
          item.tanggal,
          item.pembimbing,
          item.status,
          item.catatan ||
            "-",
        ]
      ),
    ];


    const csv =
      rows
        .map(
          (row) =>
            row
              .map(
                (value) =>
                  `"${String(
                    value
                  ).replace(
                    /"/g,
                    '""'
                  )}"`
              )
              .join(",")
        )
        .join("\n");


    // BOM agar Excel membaca UTF-8
    // dengan benar.
    const blob =
      new Blob(
        [
          "\uFEFF",
          csv,
        ],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;

    link.download =
      "laporan-magang.csv";


    document.body.appendChild(
      link
    );


    link.click();


    document.body.removeChild(
      link
    );


    URL.revokeObjectURL(
      url
    );
  }


  // ===================================================
  // STATISTIK
  // ===================================================

  const totalReports =
    reports.length;


  const waitingReports =
    reports.filter(
      (item) =>
        item.status ===
        "Menunggu"
    ).length;


  const revisedReports =
    reports.filter(
      (item) =>
        item.status ===
        "Direvisi"
    ).length;


  const approvedReports =
    reports.filter(
      (item) =>
        item.status ===
        "Disetujui"
    ).length;


  const rejectedReports =
    reports.filter(
      (item) =>
        item.status ===
        "Ditolak"
    ).length;


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div>

        <h1 className="text-3xl font-bold">
          Laporan Magang
        </h1>

        <p className="mt-2 text-gray-500">
          Kelola seluruh laporan
          peserta magang.
        </p>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-600">
          {error}
        </div>
      )}


      {/* =================================================
          STATISTIK
      ================================================= */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

        <StatCard
          title="Total"
          value={
            loading
              ? 0
              : totalReports
          }
          icon={FileText}
          color="#2563EB"
        />


        <StatCard
          title="Menunggu"
          value={
            loading
              ? 0
              : waitingReports
          }
          icon={Clock3}
          color="#F59E0B"
        />


        <StatCard
          title="Direvisi"
          value={
            loading
              ? 0
              : revisedReports
          }
          icon={RotateCcw}
          color="#F97316"
        />


        <StatCard
          title="Disetujui"
          value={
            loading
              ? 0
              : approvedReports
          }
          icon={
            CircleCheckBig
          }
          color="#22C55E"
        />


        <StatCard
          title="Ditolak"
          value={
            loading
              ? 0
              : rejectedReports
          }
          icon={CircleX}
          color="#EF4444"
        />

      </div>


      {/* =================================================
          FILTER
      ================================================= */}

      <ReportFilter
        search={
          search
        }
        setSearch={
          setSearch
        }
        status={
          status
        }
        setStatus={
          setStatus
        }
        onRefresh={
          handleRefresh
        }
        onExport={
          handleExport
        }
      />


      {/* REFRESH INFO */}

      {refreshing && (
        <p className="text-sm text-gray-500">
          Memperbarui data laporan...
        </p>
      )}


      {/* =================================================
          TABLE
      ================================================= */}

      {loading ? (

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

          <p className="text-sm text-gray-500">
            Memuat laporan...
          </p>

        </div>

      ) : (

        <ReportTable
          data={
            filteredData
          }
          onDetail={
            handleDetail
          }
        />

      )}


      {/* =================================================
          DRAWER
      ================================================= */}

      <ReportDrawer
        open={
          drawerOpen
        }
        onClose={() => {
          setDrawerOpen(
            false
          );

          setSelectedReport(
            null
          );
        }}
        report={
          selectedReport
        }
        onUpdate={
          handleUpdateReport
        }
      />

    </div>
  );
}


// =====================================================
// API → UI
// =====================================================

function mapAdminReport(
  item: AdminReport
): Report {
  return {
    id:
      item.id,

    pesertaId:
      item.pesertaId,

    peserta:
      item.peserta ||
      "Peserta",

    judul:
      item.judul ||
      "-",

    tipe:
      item.tipe ||
      "-",

    periode:
      item.periode ||
      "-",

    tanggal:
      formatTanggal(
        item.createdAt
      ),

    pembimbing:
      item.pembimbing ||
      "-",

    status:
      formatStatus(
        item.status
      ),

    deskripsi:
      item.deskripsi ||
      "-",

    catatan:
      item.catatan ||
      "",

    ditinjauAt:
      item.ditinjauAt,

    lampiran:
      item.fileUrl
        ? {
            nama:
              item.fileName ||
              "Lampiran",

            // Database laporan sekarang
            // belum menyimpan ukuran file.
            ukuran:
              "-",

            url:
              item.fileUrl,
          }
        : undefined,
  };
}


// =====================================================
// FORMAT STATUS DATABASE → UI
// =====================================================

function formatStatus(
  status: AdminReportStatus
) {
  switch (status) {
    case "direvisi":
      return "Direvisi";

    case "disetujui":
      return "Disetujui";

    case "ditolak":
      return "Ditolak";

    case "menunggu":
    default:
      return "Menunggu";
  }
}


// =====================================================
// FORMAT STATUS UI → DATABASE
// =====================================================

function getDatabaseStatus(
  status: string
): AdminReportStatus {
  switch (status) {
    case "Direvisi":
      return "direvisi";

    case "Disetujui":
      return "disetujui";

    case "Ditolak":
      return "ditolak";

    case "Menunggu":
    default:
      return "menunggu";
  }
}


// =====================================================
// FORMAT TANGGAL
// =====================================================

function formatTanggal(
  value: string
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