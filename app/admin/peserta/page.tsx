"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
  UserRoundX,
  Users,
} from "lucide-react";

import {
  getCurrentAdminParticipants,
} from "@/lib/admin/currentParticipantService";

import type {
  AdminParticipant,
} from "@/lib/admin/pesertaService";


export interface Participant {
  id: string;

  userId: string;

  nama: string;

  email: string;

  sekolah: string;

  posisi: string;

  divisi: string;

  pembimbing: string;

  pembimbingId: string | null;

  // Versi tanggal yang sudah diformat untuk UI lama
  mulai: string;

  selesai: string;

  // Raw YYYY-MM-DD
  tanggalMulai: string;

  tanggalSelesai: string;

  status: string;
}


// =====================================================
// FILTER
// =====================================================

type StatusFilter =
  | "semua"
  | "diterima"
  | "aktif";


// =====================================================
// PAGE
// =====================================================

export default function AdminPesertaPage() {
  // ===================================================
  // DATA
  // ===================================================

  const [
    participants,
    setParticipants,
  ] =
    useState<
      AdminParticipant[]
    >([]);


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  // ===================================================
  // FILTER
  // ===================================================

  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>(
      "semua"
    );


  // ===================================================
  // LOAD
  // ===================================================

  const loadParticipants =
    useCallback(
      async (
        refresh = false
      ) => {
        try {
          if (refresh) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }


          setError("");


          const data =
            await getCurrentAdminParticipants();


          setParticipants(
            data
          );

        } catch (
          err
        ) {
          console.error(
            "ADMIN PARTICIPANT LIST ERROR:",
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil data peserta."
          );

        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      []
    );


  // ===================================================
  // INITIAL
  // ===================================================

  useEffect(
    () => {
      loadParticipants();
    },
    [
      loadParticipants,
    ]
  );


  // ===================================================
  // STATISTICS
  // ===================================================

  const statistics =
    useMemo(
      () => {
        const total =
          participants.length;


        const diterima =
          participants.filter(
            (
              item
            ) =>
              normalizeStatus(
                item.status
              ) ===
              "diterima"
          ).length;


        const aktif =
          participants.filter(
            (
              item
            ) =>
              normalizeStatus(
                item.status
              ) ===
              "aktif"
          ).length;


        return {
          total,
          diterima,
          aktif,
        };
      },
      [
        participants,
      ]
    );


  // ===================================================
  // FILTERED
  // ===================================================

  const filteredParticipants =
    useMemo(
      () => {
        const keyword =
          search
            .trim()
            .toLowerCase();


        return participants.filter(
          (
            participant
          ) => {
            const matchSearch =
              !keyword ||
              participant.nama
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              participant.email
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              participant.nomorPeserta
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              participant.sekolah
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              participant.jurusan
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              participant.divisi
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              participant.posisi
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              participant.pembimbing
                .toLowerCase()
                .includes(
                  keyword
                );


            const matchStatus =
              statusFilter ===
                "semua" ||
              normalizeStatus(
                participant.status
              ) ===
                statusFilter;


            return (
              matchSearch &&
              matchStatus
            );
          }
        );
      },
      [
        participants,
        search,
        statusFilter,
      ]
    );


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
            Memuat peserta...
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

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

        <div>

          <h1 className="text-2xl font-bold text-neutral-900">
            Peserta Magang
          </h1>


          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Kelola peserta yang menunggu mulai dan peserta aktif.
            Peserta selesai atau diberhentikan tersedia di Riwayat Peserta.
          </p>

        </div>


        <button
          type="button"
          disabled={
            refreshing
          }
          onClick={() =>
            loadParticipants(
              true
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
        >

          <RefreshCw
            size={16}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />


          {refreshing
            ? "Memperbarui..."
            : "Refresh"}

        </button>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

          <div className="flex items-start gap-3">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />


            <div>

              <p className="font-semibold text-red-800">
                Gagal memuat peserta
              </p>


              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <StatCard
          icon={
            Users
          }
          label="Total Peserta Berjalan"
          value={
            statistics.total
          }
          iconClass="bg-blue-50 text-blue-600"
        />


        <StatCard
          icon={
            Clock3
          }
          label="Menunggu Mulai"
          value={
            statistics.diterima
          }
          iconClass="bg-amber-50 text-amber-600"
        />


        <StatCard
          icon={
            UserCheck
          }
          label="Aktif"
          value={
            statistics.aktif
          }
          iconClass="bg-emerald-50 text-emerald-600"
        />

      </div>


      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

          <div className="relative flex-1">

            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />


            <input
              type="text"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Cari nama, nomor peserta, sekolah, divisi, posisi..."
              className="w-full rounded-xl border border-neutral-200 py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />

          </div>


          <select
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
              setStatusFilter(
                event.target
                  .value as StatusFilter
              )
            }
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-600 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          >

            <option value="semua">
              Semua Status
            </option>

            <option value="diterima">
              Diterima
            </option>

            <option value="aktif">
              Aktif
            </option>

          </select>


          {(search ||
            statusFilter !==
              "semua") && (

            <button
              type="button"
              onClick={() => {
                setSearch("");

                setStatusFilter(
                  "semua"
                );
              }}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-500 transition hover:bg-neutral-50"
            >
              Reset
            </button>

          )}

        </div>

      </div>


      {/* =================================================
          TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

        <div className="border-b border-neutral-100 px-6 py-5">

          <h2 className="font-semibold text-neutral-900">
            Daftar Peserta
          </h2>


          <p className="mt-1 text-sm text-neutral-500">
            Menampilkan{" "}

            <span className="font-semibold text-neutral-700">
              {filteredParticipants.length}
            </span>

            {" "}peserta.
          </p>

        </div>


        {filteredParticipants.length ===
        0 ? (

          <div className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">

            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">

              <Users
                size={25}
              />

            </div>


            <p className="mt-4 font-semibold text-neutral-700">
              Peserta tidak ditemukan
            </p>


            <p className="mt-1 text-sm text-neutral-400">
              Coba ubah kata pencarian atau filter status.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead className="bg-neutral-50">

                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">

                  <th className="px-6 py-4">
                    Peserta
                  </th>

                  <th className="px-4 py-4">
                    Sekolah
                  </th>

                  <th className="px-4 py-4">
                    Penempatan
                  </th>

                  <th className="px-4 py-4">
                    Pembimbing
                  </th>

                  <th className="px-4 py-4">
                    Periode
                  </th>

                  <th className="px-4 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right">
                    Aksi
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-neutral-100">

                {filteredParticipants.map(
                  (
                    participant
                  ) => (

                  <ParticipantRow
                    key={
                      participant.id
                    }
                    participant={
                      participant
                    }
                  />

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}


// =====================================================
// PARTICIPANT ROW
// =====================================================

function ParticipantRow({
  participant,
}: {
  participant:
    AdminParticipant;
}) {
  return (
    <tr className="transition hover:bg-neutral-50/70">

      {/* PESERTA */}

      <td className="px-6 py-4">

        <div className="flex items-center gap-3">

          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
            {getInitial(
              participant.nama
            )}
          </div>


          <div className="min-w-0">

            <p className="max-w-[220px] truncate text-sm font-semibold text-neutral-900">
              {participant.nama}
            </p>


            <p className="mt-1 text-xs text-neutral-400">
              {participant.nomorPeserta}
            </p>


            <p className="mt-0.5 max-w-[220px] truncate text-xs text-neutral-400">
              {participant.email}
            </p>

          </div>

        </div>

      </td>


      {/* SEKOLAH */}

      <td className="px-4 py-4">

        <p className="max-w-[190px] truncate text-sm font-medium text-neutral-700">
          {participant.sekolah ||
            "-"}
        </p>


        <p className="mt-1 max-w-[190px] truncate text-xs text-neutral-400">
          {participant.jurusan ||
            "-"}
        </p>

      </td>


      {/* PENEMPATAN */}

      <td className="px-4 py-4">

        <div className="flex items-start gap-2">

          <BriefcaseBusiness
            size={15}
            className="mt-0.5 shrink-0 text-neutral-400"
          />


          <div>

            <p className="max-w-[170px] truncate text-sm font-medium text-neutral-700">
              {participant.divisi ||
                "-"}
            </p>

            <p className="mt-1 max-w-[170px] truncate text-xs text-neutral-400">
              {participant.posisi ||
                "-"}
            </p>

          </div>

        </div>

      </td>


      {/* PEMBIMBING */}

      <td className="px-4 py-4 text-sm text-neutral-600">
        {participant.pembimbing ||
          "-"}
      </td>


      {/* PERIODE */}

      <td className="px-4 py-4">

        <p className="text-xs text-neutral-600">
          {formatDate(
            participant.tanggalMulai
          )}
        </p>


        <p className="mt-1 text-xs text-neutral-400">
          s/d{" "}
          {formatDate(
            participant.tanggalSelesai
          )}
        </p>

      </td>


      {/* STATUS */}

      <td className="px-4 py-4">

        <ParticipantStatusBadge
          status={
            participant.status
          }
        />

      </td>


      {/* ACTION */}

      <td className="px-6 py-4">

        <div className="flex justify-end">

          <Link
            href={`/admin/peserta/${participant.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <Eye
              size={15}
            />

            Detail
          </Link>

        </div>

      </td>

    </tr>
  );
}


// =====================================================
// STATUS
// =====================================================

function ParticipantStatusBadge({
  status,
}: {
  status:
    string;
}) {
  const normalized =
    normalizeStatus(
      status
    );


  if (
    normalized ===
    "aktif"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">

        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

        Aktif

      </span>
    );
  }


  if (
    normalized ===
    "diterima"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">

        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />

        Diterima

      </span>
    );
  }


  if (
    normalized ===
    "selesai"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">

        <CheckCircle2
          size={12}
        />

        Selesai

      </span>
    );
  }


  if (
    normalized ===
    "diberhentikan"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">

        <UserRoundX
          size={12}
        />

        Diberhentikan

      </span>
    );
  }


  return (
    <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-500">
      {formatStatus(
        status
      )}
    </span>
  );
}


// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon:
    typeof Users;

  label:
    string;

  value:
    number;

  iconClass:
    string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

      <div
        className={`grid h-10 w-10 place-items-center rounded-xl ${iconClass}`}
      >
        <Icon
          size={19}
        />
      </div>


      <p className="mt-4 text-xs font-medium text-neutral-400">
        {label}
      </p>


      <p className="mt-1 text-2xl font-bold text-neutral-900">
        {value}
      </p>

    </div>
  );
}


// =====================================================
// HELPERS
// =====================================================

function normalizeStatus(
  value:
    string |
    null |
    undefined
) {
  return (
    value ??
    ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[\s-]+/g,
      "_"
    );
}


function formatStatus(
  value:
    string |
    null |
    undefined
) {
  if (!value) {
    return "-";
  }


  return value
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        char
      ) =>
        char.toUpperCase()
    );
}


function formatDate(
  value:
    string |
    null
) {
  if (!value) {
    return "-";
  }


  const date =
    new Date(
      `${value}T00:00:00`
    );


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
      month: "short",
      year: "numeric",
    }
  );
}


function getInitial(
  value:
    string
) {
  const clean =
    value
      .trim();


  if (
    !clean ||
    clean === "-"
  ) {
    return "P";
  }


  const words =
    clean.split(
      /\s+/
    );


  if (
    words.length ===
    1
  ) {
    return words[0]
      .slice(
        0,
        2
      )
      .toUpperCase();
  }


  return (
    words[0][0] +
    words[1][0]
  ).toUpperCase();
}