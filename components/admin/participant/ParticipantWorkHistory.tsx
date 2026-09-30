"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  RefreshCw,
  UserRoundX,
} from "lucide-react";

import {
  getAdminParticipantWorkHistory,
  type AdminParticipantWorkHistory,
} from "@/lib/admin/pesertaService";


interface Props {
  participantId:
    string;

  refreshKey?:
    number;
}


export default function ParticipantWorkHistory({
  participantId,
  refreshKey = 0,
}: Props) {
  const [
    history,
    setHistory,
  ] =
    useState<
      AdminParticipantWorkHistory[]
    >([]);


  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    participantId,
    refreshKey,
  ]);


  async function loadHistory() {
    try {
      setLoading(
        true
      );


      setError(
        ""
      );


      const data =
        await getAdminParticipantWorkHistory(
          participantId
        );


      setHistory(
        data
      );

    } catch (
      err
    ) {
      console.error(
        "WORK HISTORY ERROR:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil riwayat kerja."
      );


      setHistory(
        []
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">

        <RefreshCw
          size={
            22
          }
          className="mx-auto animate-spin text-blue-600"
        />


        <p className="mt-3 text-sm text-gray-500">
          Memuat riwayat kerja...
        </p>

      </div>
    );
  }


  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

        <div className="flex items-center gap-3">

          <AlertTriangle
            size={
              19
            }
            className="text-red-600"
          />


          <p className="text-sm text-red-600">
            {error}
          </p>

        </div>


        <button
          type="button"
          onClick={
            loadHistory
          }
          className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600"
        >
          Coba Lagi
        </button>

      </div>
    );
  }


  if (
    history.length === 0
  ) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">

        <Clock3
          size={
            28
          }
          className="mx-auto text-gray-300"
        />


        <h3 className="mt-3 font-semibold text-gray-700">
          Belum Ada Riwayat
        </h3>


        <p className="mt-1 text-sm text-gray-400">
          Riwayat penempatan peserta akan muncul di sini.
        </p>

      </div>
    );
  }


  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">

      <div className="mb-6">

        <h2 className="text-lg font-bold text-gray-900">
          Riwayat Kerja
        </h2>


        <p className="mt-1 text-sm text-gray-500">
          Histori penempatan, mutasi, penyelesaian, dan pemberhentian peserta.
        </p>

      </div>


      <div>

        {history.map(
          (
            item,
            index
          ) => (

          <HistoryItem
            key={
              item.id
            }
            item={
              item
            }
            last={
              index ===
              history.length - 1
            }
          />

          )
        )}

      </div>

    </div>
  );
}


// =====================================================
// ITEM
// =====================================================

function HistoryItem({
  item,
  last,
}: {
  item:
    AdminParticipantWorkHistory;

  last:
    boolean;
}) {
  const config =
    getEventConfig(
      item.jenisEvent
    );


  const Icon =
    config.icon;


  return (
    <div className="relative flex gap-4">

      {/* LINE */}

      {!last && (

        <div className="absolute left-[19px] top-10 h-[calc(100%-16px)] w-px bg-gray-200" />

      )}


      {/* ICON */}

      <div
        className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full ${config.iconClass}`}
      >

        <Icon
          size={
            18
          }
        />

      </div>


      {/* CONTENT */}

      <div className="min-w-0 flex-1 pb-8">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${config.badgeClass}`}
            >
              {config.label}
            </span>


            <p className="mt-2 text-sm font-medium text-gray-900">
              {formatDate(
                item.tanggalEvent
              )}
            </p>

          </div>


          <p className="text-xs text-gray-400">
            Dicatat {formatDateTime(
              item.createdAt
            )}
          </p>

        </div>


        {/* PENEMPATAN AWAL */}

        {item.jenisEvent ===
          "penempatan_awal" && (

          <PlacementCard
            title="Penempatan"
            data={
              item.ke
            }
          />

        )}


        {/* MUTASI */}

        {item.jenisEvent ===
          "mutasi" && (

          <div className="mt-4 grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">

            <PlacementCard
              title="Sebelum"
              data={
                item.dari
              }
            />


            <div className="hidden items-center lg:flex">

              <div className="grid h-9 w-9 place-items-center rounded-full bg-violet-50 text-violet-600">

                <ArrowRight
                  size={
                    17
                  }
                />

              </div>

            </div>


            <PlacementCard
              title="Setelah"
              data={
                item.ke
              }
            />

          </div>

        )}


        {/* TERMINATED */}

        {item.jenisEvent ===
          "diberhentikan" && (

          <div className="mt-4">

            <PlacementCard
              title="Penempatan Terakhir"
              data={
                item.dari
              }
            />


            <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-4">

              <p className="text-xs font-medium text-red-500">
                Tanggal Berhenti Aktual
              </p>


              <p className="mt-1 text-sm font-semibold text-red-700">
                {formatDate(
                  item.tanggalEvent
                )}
              </p>


              {item.dari
                .tanggalSelesaiRencana && (

                <p className="mt-2 text-xs text-red-600">
                  Rencana selesai sebelumnya:{" "}
                  {formatDate(
                    item.dari
                      .tanggalSelesaiRencana
                  )}
                </p>

              )}

            </div>

          </div>

        )}


        {/* SELESAI */}

        {item.jenisEvent ===
          "selesai" && (

          <PlacementCard
            title="Penempatan Terakhir"
            data={
              item.dari
            }
          />

        )}


        {/* ALASAN */}

        {item.alasan && (

          <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3">

            <p className="text-xs font-medium text-gray-400">
              Keterangan
            </p>


            <p className="mt-1 text-sm leading-6 text-gray-600">
              {item.alasan}
            </p>

          </div>

        )}

      </div>

    </div>
  );
}


// =====================================================
// PLACEMENT CARD
// =====================================================

function PlacementCard({
  title,
  data,
}: {
  title:
    string;

  data:
    AdminParticipantWorkHistory["ke"];
}) {
  return (
    <div className="mt-4 rounded-xl border border-gray-200 p-4">

      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </p>


      <div className="space-y-2 text-sm">

        <Row
          label="Divisi"
          value={
            data.divisi
          }
        />


        <Row
          label="Posisi"
          value={
            data.posisi
          }
        />


        <Row
          label="Pembimbing"
          value={
            data.pembimbingNama
          }
        />


        <Row
          label="Mulai"
          value={
            formatDate(
              data.tanggalMulai
            )
          }
        />


        <Row
          label="Rencana Selesai"
          value={
            formatDate(
              data
                .tanggalSelesaiRencana
            )
          }
        />

      </div>

    </div>
  );
}


// =====================================================
// ROW
// =====================================================

function Row({
  label,
  value,
}: {
  label:
    string;

  value:
    string | null;
}) {
  return (
    <div className="flex justify-between gap-4">

      <span className="text-gray-400">
        {label}
      </span>


      <span className="text-right font-medium text-gray-700">
        {value || "-"}
      </span>

    </div>
  );
}


// =====================================================
// EVENT CONFIG
// =====================================================

function getEventConfig(
  event:
    string
) {
  switch (
    event
  ) {
    case "penempatan_awal":
      return {
        label:
          "Penempatan Awal",

        icon:
          BriefcaseBusiness,

        iconClass:
          "bg-blue-100 text-blue-600",

        badgeClass:
          "bg-blue-50 text-blue-600",
      };


    case "mutasi":
      return {
        label:
          "Mutasi",

        icon:
          ArrowRightLeft,

        iconClass:
          "bg-violet-100 text-violet-600",

        badgeClass:
          "bg-violet-50 text-violet-600",
      };


    case "selesai":
      return {
        label:
          "Selesai",

        icon:
          CheckCircle2,

        iconClass:
          "bg-emerald-100 text-emerald-600",

        badgeClass:
          "bg-emerald-50 text-emerald-600",
      };


    case "diberhentikan":
      return {
        label:
          "Diberhentikan",

        icon:
          UserRoundX,

        iconClass:
          "bg-red-100 text-red-600",

        badgeClass:
          "bg-red-50 text-red-600",
      };


    default:
      return {
        label:
          event,

        icon:
          Clock3,

        iconClass:
          "bg-gray-100 text-gray-500",

        badgeClass:
          "bg-gray-100 text-gray-500",
      };
  }
}


// =====================================================
// FORMAT
// =====================================================

function formatDate(
  value:
    string | null
) {
  if (!value) {
    return "-";
  }


  return new Date(
    `${value}T00:00:00`
  ).toLocaleDateString(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  );
}


function formatDateTime(
  value:
    string
) {
  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }


  return date
    .toLocaleDateString(
      "id-ID",
      {
        day:
          "2-digit",

        month:
          "short",

        year:
          "numeric",
      }
    );
}