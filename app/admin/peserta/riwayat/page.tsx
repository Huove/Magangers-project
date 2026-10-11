"use client";

import Link
  from "next/link";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Archive,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Eye,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";

import {
  getParticipantArchive,
  type ParticipantArchiveItem,
  type ParticipantArchiveStatus,
} from "@/lib/admin/participantArchiveService";


// =====================================================
// FILTER
// =====================================================

type ArchiveFilter =
  | "semua"
  | ParticipantArchiveStatus;


// =====================================================
// PAGE
// =====================================================

export default function ParticipantArchivePage() {
  const [
    data,
    setData,
  ] =
    useState<
      ParticipantArchiveItem[]
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


  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    filter,
    setFilter,
  ] =
    useState<ArchiveFilter>(
      "semua"
    );


  // ===================================================
  // LOAD
  // ===================================================

  async function loadData(
    refresh =
      false
  ) {
    try {
      if (
        refresh
      ) {
        setRefreshing(
          true
        );

      } else {
        setLoading(
          true
        );
      }


      setError("");


      const archive =
        await getParticipantArchive();


      setData(
        archive
      );

    } catch (
      error
    ) {
      console.warn(
        "PARTICIPANT ARCHIVE:",
        error
      );


      setError(
        error instanceof Error
          ? error.message
          : "Gagal mengambil riwayat peserta."
      );


      setData([]);

    } finally {
      setLoading(
        false
      );

      setRefreshing(
        false
      );
    }
  }


  useEffect(
    () => {
      loadData();
    },
    []
  );


  // ===================================================
  // STATS
  // ===================================================

  const stats =
    useMemo(
      () => {
        const selesai =
          data.filter(
            (
              item
            ) =>
              item.status ===
              "selesai"
          ).length;


        const diberhentikan =
          data.filter(
            (
              item
            ) =>
              item.status ===
              "diberhentikan"
          ).length;


        return {
          total:
            data.length,

          selesai,

          diberhentikan,
        };
      },
      [
        data,
      ]
    );


  // ===================================================
  // FILTERED
  // ===================================================

  const filtered =
    useMemo(
      () => {
        const keyword =
          search
            .trim()
            .toLowerCase();


        return data.filter(
          (
            item
          ) => {
            const statusMatch =
              filter ===
                "semua" ||
              item.status ===
                filter;


            if (
              !statusMatch
            ) {
              return false;
            }


            if (
              !keyword
            ) {
              return true;
            }


            const haystack =
              [
                item.nama,
                item.nomorPeserta,
                item.email,
                item.sekolah,
                item.jurusan,
                item.divisi,
                item.posisi,
                item.pembimbing,
                item.alasanBerhenti ??
                  "",
              ]
                .join(" ")
                .toLowerCase();


            return haystack.includes(
              keyword
            );
          }
        );
      },
      [
        data,
        search,
        filter,
      ]
    );


  // ===================================================
  // LOADING
  // ===================================================

  if (
    loading
  ) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">

        <div className="text-center">

          <Loader2
            size={30}
            className="mx-auto animate-spin text-blue-600"
          />


          <p className="mt-3 text-sm text-neutral-500">
            Memuat riwayat peserta...
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

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

        <div>

          <Link
            href="/admin/peserta"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 transition hover:text-blue-600"
          >
            <ArrowLeft
              size={16}
            />

            Kembali ke Peserta
          </Link>


          <div className="flex items-center gap-3">

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Archive
                size={21}
              />
            </div>


            <div>

              <h1 className="text-2xl font-bold text-neutral-900">
                Riwayat Peserta
              </h1>


              <p className="mt-1 text-sm text-neutral-500">
                Arsip peserta yang telah selesai atau diberhentikan.
                Biodata dan aktivitas lama tetap tersimpan.
              </p>

            </div>

          </div>

        </div>


        <button
          type="button"
          disabled={
            refreshing
          }
          onClick={() =>
            loadData(
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

          Refresh

        </button>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>

      )}


      {/* =================================================
          STATS
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-3">

        <ArchiveStatCard
          icon={
            Archive
          }
          label="Total Riwayat"
          value={
            stats.total
          }
        />


        <ArchiveStatCard
          icon={
            CheckCircle2
          }
          label="Selesai"
          value={
            stats.selesai
          }
        />


        <ArchiveStatCard
          icon={
            UserRoundX
          }
          label="Diberhentikan"
          value={
            stats.diberhentikan
          }
        />

      </div>


      {/* =================================================
          FILTER
      ================================================= */}

      <div className="rounded-2xl border border-neutral-200 bg-white p-4">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="relative w-full lg:max-w-md">

            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />


            <input
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
              placeholder="Cari nama, nomor peserta, sekolah, divisi..."
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm text-neutral-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />

          </div>


          <div className="flex flex-wrap gap-2">

            <FilterButton
              active={
                filter ===
                "semua"
              }
              onClick={() =>
                setFilter(
                  "semua"
                )
              }
            >
              Semua
            </FilterButton>


            <FilterButton
              active={
                filter ===
                "selesai"
              }
              onClick={() =>
                setFilter(
                  "selesai"
                )
              }
            >
              Selesai
            </FilterButton>


            <FilterButton
              active={
                filter ===
                "diberhentikan"
              }
              onClick={() =>
                setFilter(
                  "diberhentikan"
                )
              }
            >
              Diberhentikan
            </FilterButton>

          </div>

        </div>

      </div>


      {/* =================================================
          TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">

        <div className="overflow-x-auto">

          <table className="min-w-[1100px] w-full">

            <thead className="border-b border-neutral-100 bg-neutral-50">

              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">

                <th className="px-5 py-4">
                  Peserta
                </th>

                <th className="px-5 py-4">
                  Pendidikan
                </th>

                <th className="px-5 py-4">
                  Penempatan Terakhir
                </th>

                <th className="px-5 py-4">
                  Periode
                </th>

                <th className="px-5 py-4">
                  Status
                </th>

                <th className="px-5 py-4 text-right">
                  Aksi
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-neutral-100">

              {filtered.map(
                (
                  item
                ) => (

                <tr
                  key={
                    item.id
                  }
                  className="align-top transition hover:bg-neutral-50/70"
                >

                  <td className="px-5 py-4">

                    <div className="min-w-[220px]">

                      <p className="font-semibold text-neutral-900">
                        {item.nama}
                      </p>


                      <p className="mt-1 text-xs text-neutral-500">
                        {item.nomorPeserta}
                      </p>


                      <p className="mt-1 text-xs text-neutral-400">
                        {item.email}
                      </p>

                    </div>

                  </td>


                  <td className="px-5 py-4">

                    <div className="min-w-[190px]">

                      <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">

                        <GraduationCap
                          size={15}
                          className="text-neutral-400"
                        />

                        {item.sekolah}

                      </div>


                      <p className="mt-1 pl-[23px] text-xs text-neutral-400">
                        {item.jurusan}
                      </p>

                    </div>

                  </td>


                  <td className="px-5 py-4">

                    <div className="min-w-[210px]">

                      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">

                        <BriefcaseBusiness
                          size={15}
                          className="text-neutral-400"
                        />

                        {item.divisi}

                      </div>


                      <p className="mt-1 pl-[23px] text-xs text-neutral-500">
                        {item.posisi}
                      </p>


                      <p className="mt-1 pl-[23px] text-xs text-neutral-400">
                        Pembimbing:{" "}
                        {item.pembimbing}
                      </p>

                    </div>

                  </td>


                  <td className="px-5 py-4">

                    <div className="min-w-[175px] text-xs text-neutral-500">

                      <div className="flex items-center gap-2">

                        <CalendarDays
                          size={14}
                          className="text-neutral-400"
                        />

                        {formatDate(
                          item.tanggalMulai
                        )}

                      </div>


                      <p className="mt-1 pl-[22px]">
                        s/d{" "}
                        {formatDate(
                          item.tanggalSelesai
                        )}
                      </p>

                    </div>

                  </td>


                  <td className="px-5 py-4">

                    <ArchiveStatusBadge
                      status={
                        item.status
                      }
                    />


                    {item.status ===
                      "diberhentikan" &&
                      item.alasanBerhenti && (

                      <p className="mt-2 max-w-[250px] text-xs leading-5 text-neutral-500">
                        {item.alasanBerhenti}
                      </p>

                    )}

                  </td>


                  <td className="px-5 py-4">

                    <div className="flex min-w-[170px] justify-end gap-2">

                      <Link
                        href={
                          `/admin/peserta/${item.id}`
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50"
                      >
                        <Eye
                          size={14}
                        />

                        Detail
                      </Link>


                      {item.status ===
                        "diberhentikan" && (

                        <Link
                          href={
                            `/admin/peserta/${item.id}?action=reactivate`
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <UserRoundCheck
                            size={14}
                          />

                          Aktifkan
                        </Link>

                      )}

                    </div>

                  </td>

                </tr>

                )
              )}


              {filtered.length ===
                0 && (

                <tr>

                  <td
                    colSpan={
                      6
                    }
                    className="px-6 py-16 text-center"
                  >

                    <Archive
                      size={34}
                      className="mx-auto text-neutral-300"
                    />


                    <p className="mt-3 font-semibold text-neutral-700">
                      Riwayat peserta tidak ditemukan
                    </p>


                    <p className="mt-1 text-sm text-neutral-400">
                      Coba ubah pencarian atau filter status.
                    </p>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>


      <p className="text-xs text-neutral-400">
        Peserta yang diaktifkan kembali akan keluar dari daftar
        Diberhentikan karena statusnya kembali Aktif, tetapi riwayat
        pemberhentiannya tetap tersimpan di detail peserta.
      </p>

    </div>
  );
}


// =====================================================
// STAT CARD
// =====================================================

function ArchiveStatCard({
  icon:
    Icon,

  label,
  value,
}: {
  icon:
    typeof Archive;

  label:
    string;

  value:
    number;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-neutral-500">
            {label}
          </p>


          <p className="mt-2 text-3xl font-bold text-neutral-900">
            {value}
          </p>

        </div>


        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">

          <Icon
            size={20}
          />

        </div>

      </div>

    </div>
  );
}


// =====================================================
// FILTER BUTTON
// =====================================================

function FilterButton({
  active,
  onClick,
  children,
}: {
  active:
    boolean;

  onClick:
    () => void;

  children:
    ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
      }`}
    >
      {children}
    </button>
  );
}


// =====================================================
// STATUS BADGE
// =====================================================

function ArchiveStatusBadge({
  status,
}: {
  status:
    ParticipantArchiveStatus;
}) {
  if (
    status ===
    "diberhentikan"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">

        <UserRoundX
          size={13}
        />

        Diberhentikan

      </span>
    );
  }


  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">

      <CheckCircle2
        size={13}
      />

      Selesai

    </span>
  );
}


// =====================================================
// DATE
// =====================================================

function formatDate(
  value:
    string |
    null
) {
  if (
    !value
  ) {
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
    return value;
  }


  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  ).format(
    date
  );
}
