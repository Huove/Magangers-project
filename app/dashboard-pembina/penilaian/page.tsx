"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronRight,
  Search,
  Eye,
  BarChart3,
  RefreshCw,
} from "lucide-react";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

// =====================================================
// TYPE FRONTEND
// =====================================================

interface Participant {
  id: string;

  nama: string;

  kampus: string;

  posisi: string;

  status: string;
}

// =====================================================
// DATABASE TYPE
// =====================================================

interface PenempatanRow {
  peserta_id: string;

  posisi:
    | string
    | null;
}

interface PesertaRow {
  id: string;

  nama_lengkap:
    | string
    | null;

  status: string;
}

interface PendidikanRow {
  peserta_id: string;

  sekolah:
    | string
    | null;

  created_at: string;
}

// =====================================================
// PAGE
// =====================================================

export default function PenilaianListPage() {
  // ===================================================
  // DATA
  // ===================================================

  const [
    peserta,
    setPeserta,
  ] =
    useState<Participant[]>([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  // ===================================================
  // SEARCH
  // ===================================================

  const [
    query,
    setQuery,
  ] =
    useState("");

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchPesertaBimbingan();
  }, []);

  // ===================================================
  // FETCH PESERTA BIMBINGAN
  // ===================================================

  async function fetchPesertaBimbingan() {
    try {
      setLoading(true);
      setError("");

      // ===============================================
      // 1. USER YANG SEDANG LOGIN
      // ===============================================

      const {
        data:
          userData,
        error:
          userError,
      } =
        await supabase.auth
          .getUser();

      if (
        userError ||
        !userData.user
      ) {
        throw new Error(
          "Pembimbing belum login."
        );
      }

      // ===============================================
      // 2. CARI DATA PEMBIMBING
      // ===============================================

      const {
        data:
          pembimbingData,
        error:
          pembimbingError,
      } =
        await supabase
          .from("pembimbing")
          .select("id")
          .eq(
            "user_id",
            userData.user.id
          )
          .maybeSingle();

      if (
        pembimbingError
      ) {
        throw pembimbingError;
      }

      if (
        !pembimbingData
      ) {
        throw new Error(
          "Data pembimbing tidak ditemukan."
        );
      }

      // ===============================================
      // 3. AMBIL PENEMPATAN MILIK PEMBIMBING
      // ===============================================

      const {
        data:
          penempatanData,
        error:
          penempatanError,
      } =
        await supabase
          .from("penempatan")
          .select(`
            peserta_id,
            posisi
          `)
          .eq(
            "pembimbing_id",
            pembimbingData.id
          );

      if (
        penempatanError
      ) {
        throw penempatanError;
      }

      const penempatan =
        (penempatanData ||
          []) as PenempatanRow[];

      // Tidak punya peserta bimbingan.
      if (
        penempatan.length ===
        0
      ) {
        setPeserta([]);

        return;
      }

      // ===============================================
      // 4. ID PESERTA
      // ===============================================

      const pesertaIds = [
        ...new Set(
          penempatan.map(
            (item) =>
              item.peserta_id
          )
        ),
      ];

      // ===============================================
      // 5. AMBIL PESERTA + PENDIDIKAN
      // ===============================================

      const [
        pesertaResult,
        pendidikanResult,
      ] =
        await Promise.all([
          supabase
            .from("peserta")
            .select(`
              id,
              nama_lengkap,
              status
            `)
            .in(
              "id",
              pesertaIds
            ),

          supabase
            .from("pendidikan")
            .select(`
              peserta_id,
              sekolah,
              created_at
            `)
            .in(
              "peserta_id",
              pesertaIds
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            ),
        ]);

      if (
        pesertaResult.error
      ) {
        throw pesertaResult.error;
      }

      if (
        pendidikanResult.error
      ) {
        throw pendidikanResult.error;
      }

      const pesertaRows =
        (pesertaResult.data ||
          []) as PesertaRow[];

      const pendidikanRows =
        (pendidikanResult.data ||
          []) as PendidikanRow[];

      // ===============================================
      // 6. FORMAT DATA
      // ===============================================

      const formatted: Participant[] =
        pesertaRows.map(
          (item) => {
            const placement =
              penempatan.find(
                (p) =>
                  p.peserta_id ===
                  item.id
              );

            // Karena sudah di-order created_at DESC,
            // find() mengambil pendidikan terbaru.
            const pendidikan =
              pendidikanRows.find(
                (p) =>
                  p.peserta_id ===
                  item.id
              );

            return {
              id:
                item.id,

              nama:
                item.nama_lengkap ||
                "Peserta",

              kampus:
                pendidikan?.sekolah ||
                "-",

              posisi:
                placement?.posisi ||
                "-",

              status:
                formatStatus(
                  item.status
                ),
            };
          }
        );

      // ===============================================
      // URUTKAN NAMA
      // ===============================================

      formatted.sort(
        (a, b) =>
          a.nama.localeCompare(
            b.nama,
            "id"
          )
      );

      setPeserta(
        formatted
      );
    } catch (err) {
      console.error(
        "FETCH PESERTA BIMBINGAN ERROR:",
        err
      );

      setPeserta([]);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil peserta bimbingan."
      );
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  // SEARCH
  // ===================================================

  const filtered =
    useMemo(() => {
      const keyword =
        query
          .trim()
          .toLowerCase();

      if (
        !keyword
      ) {
        return peserta;
      }

      return peserta.filter(
        (item) =>
          item.nama
            .toLowerCase()
            .includes(
              keyword
            ) ||
          item.kampus
            .toLowerCase()
            .includes(
              keyword
            ) ||
          item.posisi
            .toLowerCase()
            .includes(
              keyword
            )
      );
    }, [
      peserta,
      query,
    ]);

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6">

        <h1 className="text-2xl font-extrabold text-slate-900">
          Penilaian Peserta
        </h1>

        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">

          <Link
            href="/dashboard-pembina"
            className="hover:text-slate-600"
          >
            Dashboard
          </Link>

          <ChevronRight className="h-3.5 w-3.5" />

          <span className="text-slate-500">
            Penilaian Peserta
          </span>

        </div>

      </div>

      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          {/* SEARCH */}

          <div className="relative w-full sm:max-w-xs">

            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={
                query
              }
              onChange={(
                e
              ) =>
                setQuery(
                  e.target
                    .value
                )
              }
              placeholder="Cari nama, kampus, atau posisi..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-600 focus:bg-white"
            />

          </div>

          {/* REFRESH */}

          <button
            type="button"
            disabled={
              loading
            }
            onClick={
              fetchPesertaBimbingan
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">

        {/* LOADING */}

        {loading ? (

          <div className="flex flex-col items-center gap-3 p-14 text-center">

            <RefreshCw className="h-7 w-7 animate-spin text-blue-500" />

            <p className="text-sm text-slate-400">
              Memuat peserta bimbingan...
            </p>

          </div>

        ) : filtered.length ===
          0 ? (

          // =============================================
          // EMPTY
          // =============================================

          <div className="flex flex-col items-center gap-2 p-14 text-center">

            <BarChart3 className="h-8 w-8 text-slate-300" />

            <p className="font-medium text-slate-500">
              {query
                ? "Tidak ada peserta yang cocok dengan pencarian."
                : "Belum ada peserta bimbingan."}
            </p>

            <p className="max-w-md text-sm text-slate-400">
              {!query &&
                "Peserta akan muncul setelah Admin menetapkan pembimbing pada data penempatan."}
            </p>

          </div>

        ) : (

          <table className="w-full text-left text-sm">

            {/* ===========================================
                HEAD
            ============================================ */}

            <thead>

              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500">

                <th className="w-14 px-6 py-4 font-medium">
                  No
                </th>

                <th className="px-4 py-4 font-medium">
                  Peserta
                </th>

                <th className="px-4 py-4 font-medium">
                  Kampus
                </th>

                <th className="px-4 py-4 font-medium">
                  Posisi
                </th>

                <th className="px-4 py-4 font-medium">
                  Status
                </th>

                <th className="px-6 py-4 font-medium">
                  Aksi
                </th>

              </tr>

            </thead>

            {/* ===========================================
                BODY
            ============================================ */}

            <tbody>

              {filtered.map(
                (
                  participant,
                  index
                ) => (

                  <tr
                    key={
                      participant.id
                    }
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                  >

                    {/* NO */}

                    <td className="px-6 py-4">

                      <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
                        {index +
                          1}
                      </span>

                    </td>

                    {/* PESERTA */}

                    <td className="px-4 py-4">

                      <div className="flex items-center gap-2.5">

                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-xs font-bold text-blue-600">
                          {getInisial(
                            participant.nama
                          )}
                        </span>

                        <span className="font-semibold text-slate-900">
                          {
                            participant.nama
                          }
                        </span>

                      </div>

                    </td>

                    {/* KAMPUS */}

                    <td className="px-4 py-4 text-slate-500">
                      {
                        participant.kampus
                      }
                    </td>

                    {/* POSISI */}

                    <td className="px-4 py-4 text-slate-500">
                      {
                        participant.posisi
                      }
                    </td>

                    {/* STATUS */}

                    <td className="px-4 py-4">

                      <StatusBadge
                        status={
                          participant.status
                        }
                      />

                    </td>

                    {/* AKSI */}

                    <td className="px-6 py-4">

                      <Link
                        href={`/dashboard-pembina/penilaian/${participant.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100"
                      >
                        <Eye className="h-3.5 w-3.5" />

                        Detail
                      </Link>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>

    </div>
  );
}

// =====================================================
// INITIAL
// =====================================================

function getInisial(
  nama: string
) {
  if (
    !nama ||
    nama === "-"
  ) {
    return "?";
  }

  return nama
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (word) =>
        word[0]
    )
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// =====================================================
// FORMAT STATUS
// =====================================================

function formatStatus(
  status: string
) {
  switch (
    status
  ) {
    case "aktif":
      return "Aktif";

    case "selesai":
      return "Selesai";

    case "diterima":
      return "Diterima";

    case "mengajukan":
      return "Mengajukan";

    case "ditolak":
      return "Ditolak";

    default:
      return "Tidak Aktif";
  }
}

// =====================================================
// STATUS BADGE
// =====================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let style =
    "bg-slate-100 text-slate-600";

  if (
    status === "Aktif"
  ) {
    style =
      "bg-emerald-50 text-emerald-600";
  }

  if (
    status === "Selesai"
  ) {
    style =
      "bg-blue-50 text-blue-600";
  }

  if (
    status === "Diterima"
  ) {
    style =
      "bg-yellow-50 text-yellow-600";
  }

  if (
    status === "Ditolak"
  ) {
    style =
      "bg-red-50 text-red-600";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {status}
    </span>
  );
}