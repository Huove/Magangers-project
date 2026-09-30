"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Eye,
  Users,
} from "lucide-react";

import type {
  Participant,
} from "@/app/admin/peserta/page";

// =====================================================
// PROPS
// =====================================================

interface Props {
  data: Participant[];

  onDetail: (
    participant: Participant
  ) => void;
}

// =====================================================
// CONFIG
// =====================================================

const ITEMS_PER_PAGE = 5;

// =====================================================
// TABLE
// =====================================================

export default function ParticipantTable({
  data,
  onDetail,
}: Props) {
  // ===================================================
  // PAGINATION
  // ===================================================

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(
      data.length /
        ITEMS_PER_PAGE
    )
  );

  // Kalau filter/search berubah,
  // balik ke halaman pertama.
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  // Jaga supaya halaman tidak melebihi total.
  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);

  // ===================================================
  // DATA HALAMAN SEKARANG
  // ===================================================

  const paginatedData =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ITEMS_PER_PAGE;

      const end =
        start +
        ITEMS_PER_PAGE;

      return data.slice(
        start,
        end
      );
    }, [
      data,
      currentPage,
    ]);

  // ===================================================
  // EMPTY
  // ===================================================

  if (data.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 text-center shadow-sm">

        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">

          <Users size={24} />

        </div>

        <h3 className="font-semibold text-gray-800">
          Peserta tidak ditemukan
        </h3>

        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Belum ada peserta
          yang sesuai dengan
          pencarian atau filter
          yang dipilih.
        </p>

      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="overflow-x-auto">

        <table className="w-full">

          {/* ===============================================
              HEADER
          =============================================== */}

          <thead className="bg-gray-50">

            <tr className="text-left text-sm text-gray-500">

              <th className="whitespace-nowrap px-6 py-4">
                Peserta
              </th>

              <th className="whitespace-nowrap px-6 py-4">
                Posisi
              </th>

              <th className="whitespace-nowrap px-6 py-4">
                Divisi
              </th>

              <th className="whitespace-nowrap px-6 py-4">
                Pembimbing
              </th>

              <th className="whitespace-nowrap px-6 py-4">
                Progress
              </th>

              <th className="whitespace-nowrap px-6 py-4">
                Status
              </th>

              <th className="whitespace-nowrap px-6 py-4 text-center">
                Aksi
              </th>

            </tr>

          </thead>

          {/* ===============================================
              BODY
          =============================================== */}

          <tbody>

            {paginatedData.map(
              (item) => {
                const progress =
                  calculateProgress(
                    item
                  );

                return (
                  <tr
                    key={item.id}
                    className="border-t transition hover:bg-gray-50"
                  >

                    {/* =====================================
                        PESERTA
                    ====================================== */}

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold uppercase text-blue-600">

                          {getInitials(
                            item.nama
                          )}

                        </div>

                        <div className="min-w-[190px]">

                          <p className="font-semibold text-gray-900">
                            {item.nama}
                          </p>

                          <p className="mt-0.5 text-sm text-gray-500">
                            {item.email}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-400">
                            {item.sekolah}
                          </p>

                        </div>

                      </div>

                    </td>

                    {/* =====================================
                        POSISI
                    ====================================== */}

                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-700">
                      {item.posisi}
                    </td>

                    {/* =====================================
                        DIVISI
                    ====================================== */}

                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-700">
                      {item.divisi}
                    </td>

                    {/* =====================================
                        PEMBIMBING
                    ====================================== */}

                    <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-700">
                      {item.pembimbing}
                    </td>

                    {/* =====================================
                        PROGRESS
                    ====================================== */}

                    <td className="px-6 py-5">

                      <ProgressBar
                        progress={
                          progress
                        }
                      />

                    </td>

                    {/* =====================================
                        STATUS
                    ====================================== */}

                    <td className="px-6 py-5">

                      <StatusBadge
                        status={
                          item.status
                        }
                      />

                    </td>

                    {/* =====================================
                        AKSI
                    ====================================== */}

                    <td className="px-6 py-5 text-center">

                      <button
                        type="button"
                        onClick={() =>
                          onDetail(
                            item
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-600 hover:text-white"
                      >

                        <Eye
                          size={16}
                        />

                        Detail

                      </button>

                    </td>

                  </tr>
                );
              }
            )}

          </tbody>

        </table>

      </div>

      {/* =================================================
          FOOTER / PAGINATION
      ================================================= */}

      <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

        <p className="text-sm text-gray-500">

          Menampilkan{" "}
          <span className="font-medium text-gray-700">
            {paginatedData.length}
          </span>{" "}
          dari{" "}
          <span className="font-medium text-gray-700">
            {data.length}
          </span>{" "}
          peserta

        </p>

        {/* ===============================================
            PAGINATION
        =============================================== */}

        {totalPages > 1 && (

          <div className="flex items-center gap-2">

            {/* PREVIOUS */}

            <button
              type="button"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1
                    )
                )
              }
              className="rounded-lg border px-3 py-1.5 text-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ←
            </button>

            {/* PAGE NUMBERS */}

            {Array.from(
              {
                length:
                  totalPages,
              },
              (_, index) =>
                index + 1
            ).map(
              (page) => (

                <button
                  key={page}
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      page
                    )
                  }
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                    currentPage ===
                    page
                      ? "bg-blue-600 text-white"
                      : "border text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>

              )
            )}

            {/* NEXT */}

            <button
              type="button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                )
              }
              className="rounded-lg border px-3 py-1.5 text-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              →
            </button>

          </div>

        )}

      </div>

    </div>
  );
}

// =====================================================
// PROGRESS BAR
// =====================================================

function ProgressBar({
  progress,
}: {
  progress: number;
}) {
  const safeProgress =
    Math.max(
      0,
      Math.min(
        progress,
        100
      )
    );

  return (
    <div className="w-36">

      <div className="mb-1 flex justify-between gap-3 text-xs">

        <span className="text-gray-500">
          Progress
        </span>

        <span className="font-medium text-gray-700">
          {safeProgress}%
        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-gray-200">

        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{
            width: `${safeProgress}%`,
          }}
        />

      </div>

    </div>
  );
}

// =====================================================
// STATUS BADGE
// =====================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let color =
    "bg-gray-100 text-gray-700";

  if (status === "Aktif") {
    color =
      "bg-green-100 text-green-700";
  }

  if (
    status === "Selesai"
  ) {
    color =
      "bg-blue-100 text-blue-700";
  }

  if (
    status === "Diterima"
  ) {
    color =
      "bg-yellow-100 text-yellow-700";
  }

  return (
    <span
      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${color}`}
    >
      {status}
    </span>
  );
}

// =====================================================
// HITUNG PROGRESS MAGANG
// =====================================================

function calculateProgress(
  participant: Participant
) {
  // ===============================================
  // STATUS SELESAI
  // ===============================================

  if (
    participant.status ===
    "Selesai"
  ) {
    return 100;
  }

  // ===============================================
  // BELUM AKTIF
  // ===============================================

  if (
    participant.status ===
    "Diterima"
  ) {
    return 0;
  }

  // ===============================================
  // PARSE TANGGAL
  // ===============================================

  const startDate =
    parseIndonesianDate(
      participant.mulai
    );

  const endDate =
    parseIndonesianDate(
      participant.selesai
    );

  // Belum punya periode
  if (
    !startDate ||
    !endDate
  ) {
    return 0;
  }

  // ===============================================
  // VALIDASI
  // ===============================================

  const start =
    startDate.getTime();

  const end =
    endDate.getTime();

  const now =
    new Date().getTime();

  if (
    end <= start
  ) {
    return 0;
  }

  // Belum mulai
  if (
    now <= start
  ) {
    return 0;
  }

  // Sudah melewati periode
  if (
    now >= end
  ) {
    return 100;
  }

  // ===============================================
  // HITUNG PERSENTASE
  // ===============================================

  const elapsed =
    now - start;

  const total =
    end - start;

  return Math.round(
    (elapsed / total) *
      100
  );
}

// =====================================================
// PARSE TANGGAL INDONESIA
// =====================================================

function parseIndonesianDate(
  value: string
): Date | null {
  if (
    !value ||
    value === "-"
  ) {
    return null;
  }

  const months: Record<
    string,
    number
  > = {
    Januari: 0,
    Februari: 1,
    Maret: 2,
    April: 3,
    Mei: 4,
    Juni: 5,
    Juli: 6,
    Agustus: 7,
    September: 8,
    Oktober: 9,
    November: 10,
    Desember: 11,
  };

  const parts =
    value
      .trim()
      .split(/\s+/);

  if (
    parts.length !== 3
  ) {
    return null;
  }

  const day =
    Number(parts[0]);

  const month =
    months[parts[1]];

  const year =
    Number(parts[2]);

  if (
    Number.isNaN(day) ||
    month === undefined ||
    Number.isNaN(year)
  ) {
    return null;
  }

  const date =
    new Date(
      year,
      month,
      day
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

// =====================================================
// INITIAL NAMA
// =====================================================

function getInitials(
  name: string
) {
  if (
    !name ||
    name === "-"
  ) {
    return "?";
  }

  return name
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