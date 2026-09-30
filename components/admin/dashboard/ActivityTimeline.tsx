"use client";

import {
  useEffect,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import {
  Activity,
} from "lucide-react";

// =====================================================
// TYPE DATABASE
// =====================================================

type StatusHistoryRow = {
  id: string;
  peserta_id: string;

  entity: string;
  entity_id: string | null;

  from_status: string | null;
  to_status: string;

  note: string | null;

  changed_by: string | null;

  created_at: string;
};

type PesertaRow = {
  id: string;
  nama_lengkap: string | null;
};

type ProfileRow = {
  id: string;
  nama_lengkap: string;
};

// =====================================================
// TYPE FRONTEND
// =====================================================

type ActivityItem = {
  id: string;

  date: string;

  title: string;

  desc: string;
};

// =====================================================
// COMPONENT
// =====================================================

export default function ActivityTimeline() {
  const [
    history,
    setHistory,
  ] =
    useState<ActivityItem[]>([]);

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
  // FETCH
  // ===================================================

  useEffect(() => {
    fetchActivities();
  }, []);

  async function fetchActivities() {
    try {
      setLoading(true);
      setError("");

      // ===============================================
      // 1. STATUS HISTORY
      // ===============================================

      const {
        data: historyData,
        error: historyError,
      } = await supabase
        .from("status_history")
        .select(`
          id,
          peserta_id,
          entity,
          entity_id,
          from_status,
          to_status,
          note,
          changed_by,
          created_at
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(6);

      if (historyError) {
        throw historyError;
      }

      const histories =
        (historyData ||
          []) as StatusHistoryRow[];

      // ===============================================
      // KALAU BELUM ADA HISTORY
      // ===============================================

      if (
        histories.length === 0
      ) {
        setHistory([]);

        return;
      }

      // ===============================================
      // 2. PESERTA ID
      // ===============================================

      const pesertaIds = [
        ...new Set(
          histories.map(
            (item) =>
              item.peserta_id
          )
        ),
      ];

      // ===============================================
      // 3. CHANGED BY
      // ===============================================

      const changedByIds = [
        ...new Set(
          histories
            .map(
              (item) =>
                item.changed_by
            )
            .filter(
              (
                id
              ): id is string =>
                Boolean(id)
            )
        ),
      ];

      // ===============================================
      // 4. AMBIL PESERTA + PROFILE ADMIN
      // ===============================================

      const [
        pesertaResult,
        profileResult,
      ] =
        await Promise.all([
          supabase
            .from("peserta")
            .select(`
              id,
              nama_lengkap
            `)
            .in(
              "id",
              pesertaIds
            ),

          changedByIds.length >
          0
            ? supabase
                .from("profiles")
                .select(`
                  id,
                  nama_lengkap
                `)
                .in(
                  "id",
                  changedByIds
                )
            : Promise.resolve({
                data: [],
                error: null,
              }),
        ]);

      if (
        pesertaResult.error
      ) {
        console.error(
          "PESERTA HISTORY ERROR:",
          pesertaResult.error
        );
      }

      if (
        profileResult.error
      ) {
        console.error(
          "PROFILE HISTORY ERROR:",
          profileResult.error
        );
      }

      const peserta =
        (pesertaResult.data ||
          []) as PesertaRow[];

      const profiles =
        (profileResult.data ||
          []) as ProfileRow[];

      // ===============================================
      // 5. FORMAT
      // ===============================================

      const formattedData: ActivityItem[] =
        histories.map(
          (item) => {
            const pesertaData =
              peserta.find(
                (peserta) =>
                  peserta.id ===
                  item.peserta_id
              );

            const changedBy =
              profiles.find(
                (profile) =>
                  profile.id ===
                  item.changed_by
              );

            const namaPeserta =
              pesertaData
                ?.nama_lengkap ||
              "Peserta";

            const namaAdmin =
              changedBy
                ?.nama_lengkap ||
              "Administrator";

            return {
              id: item.id,

              date:
                formatTanggal(
                  item.created_at
                ),

              title:
                getActivityTitle(
                  item.entity,
                  item.to_status
                ),

              desc:
                item.note ||
                getActivityDescription(
                  namaPeserta,
                  namaAdmin,
                  item.from_status,
                  item.to_status
                ),
            };
          }
        );

      setHistory(
        formattedData
      );
    } catch (err) {
      console.error(
        "ACTIVITY TIMELINE ERROR:",
        err
      );

      setError(
        "Gagal mengambil aktivitas."
      );
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      {/* HEADER */}

      <div className="mb-6 flex items-center gap-2">

        <Activity
          size={18}
          className="text-blue-600"
        />

        <h2 className="text-lg font-semibold">
          Aktivitas Terbaru
        </h2>

      </div>

      {/* LOADING */}

      {loading && (
        <div className="py-8 text-center">

          <p className="text-sm text-gray-400">
            Memuat aktivitas...
          </p>

        </div>
      )}

      {/* ERROR */}

      {!loading &&
        error && (

          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">

            <p className="text-sm text-red-600">
              {error}
            </p>

          </div>

        )}

      {/* EMPTY */}

      {!loading &&
        !error &&
        history.length ===
          0 && (

          <div className="py-8 text-center">

            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">

              <Activity
                size={20}
              />

            </div>

            <p className="text-sm font-medium text-gray-600">
              Belum ada aktivitas
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Aktivitas terbaru
              Administrator akan
              muncul di sini.
            </p>

          </div>

        )}

      {/* TIMELINE */}

      {!loading &&
        !error &&
        history.length >
          0 && (

          <div className="space-y-0">

            {history.map(
              (
                item,
                index
              ) => (

                <div
                  key={item.id}
                  className="flex gap-4"
                >

                  {/* TIMELINE LINE */}

                  <div className="flex flex-col items-center">

                    <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-600" />

                    {index !==
                      history.length -
                        1 && (

                      <div className="min-h-16 w-[2px] flex-1 bg-gray-200" />

                    )}

                  </div>

                  {/* CONTENT */}

                  <div
                    className={`min-w-0 flex-1 ${
                      index !==
                      history.length -
                        1
                        ? "pb-6"
                        : ""
                    }`}
                  >

                    <p className="text-xs text-gray-400">
                      {
                        item.date
                      }
                    </p>

                    <h3 className="mt-1 font-semibold text-gray-800">
                      {
                        item.title
                      }
                    </h3>

                    <p className="mt-1 text-sm leading-relaxed text-gray-500">
                      {
                        item.desc
                      }
                    </p>

                  </div>

                </div>

              )
            )}

          </div>

        )}

    </div>
  );
}

// =====================================================
// TITLE ACTIVITY
// =====================================================

function getActivityTitle(
  entity: string,
  status: string
) {
  if (
    entity ===
    "pengajuan_magang"
  ) {
    switch (status) {
      case "draft":
        return "Pengajuan Dibuat";

      case "diajukan":
        return "Pengajuan Dikirim";

      case "diproses":
        return "Pengajuan Diproses";

      case "revisi":
        return "Pengajuan Perlu Revisi";

      case "diterima":
        return "Peserta Diterima";

      case "ditolak":
        return "Pengajuan Ditolak";
    }
  }

  if (
    entity === "peserta"
  ) {
    switch (status) {
      case "aktif":
        return "Peserta Diaktifkan";

      case "selesai":
        return "Magang Selesai";

      case "ditolak":
        return "Peserta Ditolak";
    }
  }

  return "Perubahan Status";
}

// =====================================================
// DESCRIPTION
// =====================================================

function getActivityDescription(
  peserta: string,
  changedBy: string,
  fromStatus:
    | string
    | null,
  toStatus: string
) {
  if (!fromStatus) {
    return `${peserta} memiliki status ${formatStatus(
      toStatus
    )}.`;
  }

  return `${changedBy} mengubah status ${peserta} dari ${formatStatus(
    fromStatus
  )} menjadi ${formatStatus(
    toStatus
  )}.`;
}

// =====================================================
// FORMAT STATUS
// =====================================================

function formatStatus(
  status: string
) {
  return status
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}

// =====================================================
// FORMAT TANGGAL
// =====================================================

function formatTanggal(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}