"use client";

import {
  useEffect,
  useState,
} from "react";

import StatCard from "@/components/admin/dashboard/StatisticCard";
import ApplicantChart from "@/components/admin/dashboard/ApplicantChart";
import ActivityTimeline from "@/components/admin/dashboard/ActivityTimeline";
import RecentApplications from "@/components/admin/dashboard/RecentApplications";
import InterviewToday from "@/components/admin/dashboard/InterviewToday";
import QuickActions from "@/components/admin/dashboard/QuickAction";

import { supabase } from "@/lib/supabase";

import {
  Users,
  UserCheck,
  CircleCheckBig,
  BadgeCheck,
  FileText,
  Clock3,
  Bell,
  Send,
  BellRing,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";

// =====================================================
// TYPE RPC DATABASE
// =====================================================

interface DashboardRpcRow {
  total_peserta: number;

  peserta_diterima: number;
  peserta_aktif: number;
  peserta_selesai: number;

  total_laporan: number;
  laporan_menunggu: number;
  laporan_direvisi: number;
  laporan_disetujui: number;
  laporan_ditolak: number;

  total_pengumuman: number;
  pengumuman_draft: number;
  pengumuman_terjadwal: number;
  pengumuman_dipublikasikan: number;

  total_notifikasi: number;
  notifikasi_belum_dibaca: number;

  total_penempatan: number;
  peserta_dengan_pembimbing: number;
}

// =====================================================
// TYPE FRONTEND
// =====================================================

interface DashboardStats {
  totalPeserta: number;

  diterima: number;
  aktif: number;
  selesai: number;
  diberhentikan: number;

  totalLaporan: number;
  laporanMenunggu: number;

  totalPengumuman: number;
  pengumumanPublished: number;

  notifikasiBelumDibaca: number;

  pesertaDenganPembimbing: number;
}

// =====================================================
// INITIAL
// =====================================================

const initialStats: DashboardStats = {
  totalPeserta: 0,

  diterima: 0,
  aktif: 0,
  selesai: 0,
  diberhentikan: 0,

  totalLaporan: 0,
  laporanMenunggu: 0,

  totalPengumuman: 0,
  pengumumanPublished: 0,

  notifikasiBelumDibaca: 0,

  pesertaDenganPembimbing: 0,
};

// =====================================================
// PAGE
// =====================================================

export default function DashboardPage() {
  const [
    stats,
    setStats,
  ] = useState<DashboardStats>(
    initialStats
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  // ===================================================
  // LOAD
  // ===================================================

  useEffect(() => {
    loadDashboard();
  }, []);

  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  async function loadDashboard() {
    try {
      setLoading(true);

      setError("");

      // ===============================================
      // SATU RPC UNTUK SEMUA STATISTIK ADMIN
      // ===============================================
      //
      // Tidak query:
      // - pelamar
      // - pengajuan_magang
      // - wawancara
      //
      // ===============================================

      const {
        data,
        error: rpcError,
      } = await supabase.rpc(
        "admin_dashboard_ringkasan"
      );

      if (
        rpcError
      ) {
        throw rpcError;
      }

      // Karena function RETURNS TABLE,
      // hasil Supabase berbentuk array.

      const rows =
        (data ||
          []) as DashboardRpcRow[];

      const result =
        rows[0];

      // ===============================================
      // JIKA DATA KOSONG
      // ===============================================

      if (
        !result
      ) {
        setStats(
          initialStats
        );

        return;
      }

      // ===============================================
      // PESERTA DIBERHENTIKAN
      //
      // RPC dashboard dibuat sebelum status
      // "diberhentikan" ditambahkan, jadi hitung
      // status ini secara terpisah agar dashboard
      // tetap menampilkan kondisi terbaru.
      // ===============================================

      const {
        count:
          terminatedCount,

        error:
          terminatedError,
      } =
        await supabase
          .from(
            "peserta"
          )
          .select(
            "id",
            {
              count:
                "exact",

              head:
                true,
            }
          )
          .eq(
            "status",
            "diberhentikan"
          );


      if (
        terminatedError
      ) {
        console.warn(
          "DASHBOARD TERMINATED COUNT:",
          terminatedError
        );
      }


      // ===============================================
      // MAP DATABASE → FRONTEND
      // ===============================================

      setStats({
        totalPeserta:
          Number(
            result.total_peserta
          ) || 0,

        diterima:
          Number(
            result.peserta_diterima
          ) || 0,

        aktif:
          Number(
            result.peserta_aktif
          ) || 0,

        selesai:
          Number(
            result.peserta_selesai
          ) || 0,

        diberhentikan:
          terminatedCount ??
          0,

        totalLaporan:
          Number(
            result.total_laporan
          ) || 0,

        laporanMenunggu:
          Number(
            result.laporan_menunggu
          ) || 0,

        totalPengumuman:
          Number(
            result.total_pengumuman
          ) || 0,

        pengumumanPublished:
          Number(
            result.pengumuman_dipublikasikan
          ) || 0,

        notifikasiBelumDibaca:
          Number(
            result.notifikasi_belum_dibaca
          ) || 0,

        pesertaDenganPembimbing:
          Number(
            result.peserta_dengan_pembimbing
          ) || 0,
      });

      console.log(
        "DASHBOARD RPC:",
        result
      );
    } catch (err) {
      console.error(
        "DASHBOARD ERROR:",
        err
      );

      setError(
        "Gagal mengambil statistik dashboard."
      );

      setStats(
        initialStats
      );
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  // REFRESH
  // ===================================================

  async function handleRefresh() {
    await loadDashboard();
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Dashboard Administrator
          </h1>

          <p className="mt-1 text-gray-500">
            Ringkasan aktivitas
            sistem magang.
          </p>

        </div>

        {/* REFRESH */}

        <button
          type="button"
          disabled={
            loading
          }
          onClick={
            handleRefresh
          }
          className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Memuat..."
            : "Refresh"}
        </button>

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
          STATISTIC CARD
      ================================================= */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

        {/* TOTAL PESERTA */}

        <StatCard
          title="Total Peserta"
          value={
            loading
              ? 0
              : stats.totalPeserta
          }
          icon={Users}
          color="#2563EB"
        />

        {/* DITERIMA */}

        <StatCard
          title="Peserta Diterima"
          value={
            loading
              ? 0
              : stats.diterima
          }
          icon={BadgeCheck}
          color="#0EA5E9"
        />

        {/* AKTIF */}

        <StatCard
          title="Peserta Aktif"
          value={
            loading
              ? 0
              : stats.aktif
          }
          icon={UserCheck}
          color="#22C55E"
        />

        {/* SELESAI */}

        <StatCard
          title="Peserta Selesai"
          value={
            loading
              ? 0
              : stats.selesai
          }
          icon={
            CircleCheckBig
          }
          color="#16A34A"
        />

        {/* DIBERHENTIKAN */}

        <StatCard
          title="Peserta Diberhentikan"
          value={
            loading
              ? 0
              : stats.diberhentikan
          }
          icon={
            UserRoundX
          }
          color="#EF4444"
        />

        {/* PEMBIMBING */}

        <StatCard
          title="Sudah Ada Pembimbing"
          value={
            loading
              ? 0
              : stats.pesertaDenganPembimbing
          }
          icon={
            UserRoundCheck
          }
          color="#14B8A6"
        />

        {/* TOTAL LAPORAN */}

        <StatCard
          title="Total Laporan"
          value={
            loading
              ? 0
              : stats.totalLaporan
          }
          icon={FileText}
          color="#6366F1"
        />

        {/* LAPORAN MENUNGGU */}

        <StatCard
          title="Laporan Menunggu"
          value={
            loading
              ? 0
              : stats.laporanMenunggu
          }
          icon={Clock3}
          color="#F59E0B"
        />

        {/* TOTAL PENGUMUMAN */}

        <StatCard
          title="Total Pengumuman"
          value={
            loading
              ? 0
              : stats.totalPengumuman
          }
          icon={Bell}
          color="#8B5CF6"
        />

        {/* PUBLISHED */}

        <StatCard
          title="Pengumuman Publik"
          value={
            loading
              ? 0
              : stats.pengumumanPublished
          }
          icon={Send}
          color="#10B981"
        />

        {/* NOTIFIKASI */}

        <StatCard
          title="Notifikasi Belum Dibaca"
          value={
            loading
              ? 0
              : stats.notifikasiBelumDibaca
          }
          icon={BellRing}
          color="#EF4444"
        />

      </div>


      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        <div className="xl:col-span-2">

          <ApplicantChart />

        </div>

        <ActivityTimeline />

      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        <div className="xl:col-span-2">

          <RecentApplications />

        </div>

        <InterviewToday />

      </div>

      <div>

        <QuickActions />

      </div>

    </div>
  );
}