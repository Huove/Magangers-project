"use client";

import {
  useEffect,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  X,
  CalendarDays,
  User,
  FileText,
  ClipboardList,
  ExternalLink,
  Tag,
  Clock3,
} from "lucide-react";

import type {
  Report,
} from "@/app/admin/laporan/page";

// =====================================================
// PROPS
// =====================================================

interface Props {
  open: boolean;

  onClose: () => void;

  report:
    | Report
    | null;

  onUpdate: (
    updatedReport: Report
  ) =>
    | void
    | Promise<void>;
}

// =====================================================
// COMPONENT
// =====================================================

export default function ReportDrawer({
  open,
  onClose,
  report,
  onUpdate,
}: Props) {
  const [
    catatan,
    setCatatan,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  // ===================================================
  // ISI CATATAN DARI DATABASE
  // ===================================================

  useEffect(() => {
    if (
      report
    ) {
      setCatatan(
        report.catatan ||
          ""
      );
    }
  }, [
    report,
  ]);

  // ===================================================
  // JANGAN RENDER
  // ===================================================

  if (
    !open ||
    !report
  ) {
    return null;
  }

  // Supaya TypeScript tahu
  // report sudah pasti bukan null.
  const currentReport =
    report;

  // ===================================================
  // LIHAT FILE
  // ===================================================

  function handleViewFile() {
    const fileUrl =
      currentReport
        .lampiran
        ?.url;

    if (
      !fileUrl
    ) {
      alert(
        "Lampiran laporan tidak tersedia."
      );

      return;
    }

    window.open(
      fileUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // ===================================================
  // UPDATE STATUS
  // ===================================================

  async function handleStatusChange(
    newStatus:
      | "Direvisi"
      | "Ditolak"
      | "Disetujui"
  ) {
    // Revisi sebaiknya
    // punya catatan.
    if (
      newStatus ===
        "Direvisi" &&
      !catatan.trim()
    ) {
      alert(
        "Tuliskan catatan revisi terlebih dahulu."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      const updatedReport: Report =
        {
          ...currentReport,

          status:
            newStatus,

          catatan:
            catatan.trim(),
        };

      // Ini sekarang benar-benar
      // menunggu update Supabase
      // dari page.tsx selesai.
      await onUpdate(
        updatedReport
      );

      // Baru tutup jika sukses.
      onClose();
    } catch (error) {
      console.error(
        "UPDATE REPORT ERROR:",
        error
      );

      // Alert utama sudah ada
      // di page.tsx.
    } finally {
      setSaving(
        false
      );
    }
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      {/* =================================================
          OVERLAY
      ================================================= */}

      <div
        onClick={
          saving
            ? undefined
            : onClose
        }
        className="fixed inset-0 z-40 bg-black/30"
      />

      {/* =================================================
          DRAWER
      ================================================= */}

      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">

        {/* ===============================================
            HEADER
        =============================================== */}

        <div className="flex items-center justify-between border-b bg-white px-6 py-5">

          <div>

            <h2 className="text-2xl font-bold">
              Detail Laporan
            </h2>

            <p className="mt-1 text-gray-500">
              Informasi lengkap
              laporan peserta.
            </p>

          </div>

          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              onClose
            }
            className="rounded-lg p-2 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X
              size={22}
            />
          </button>

        </div>

        {/* ===============================================
            BODY
        =============================================== */}

        <div className="space-y-6 p-6">

          {/* =============================================
              JUDUL + STATUS
          ============================================== */}

          <div>

            <StatusBadge
              status={
                currentReport.status
              }
            />

            <h1 className="mt-4 break-words text-3xl font-bold">
              {
                currentReport.judul
              }
            </h1>

          </div>

          {/* =============================================
              INFORMASI LAPORAN
          ============================================== */}

          <div className="rounded-xl border border-gray-200">

            <div className="border-b px-5 py-4 font-semibold">
              Informasi Laporan
            </div>

            <div className="space-y-5 p-5">

              {/* PESERTA */}

              <InfoItem
                icon={
                  <User
                    size={18}
                  />
                }
                title="Peserta"
                value={
                  currentReport.peserta
                }
              />

              {/* PEMBIMBING */}

              <InfoItem
                icon={
                  <ClipboardList
                    size={18}
                  />
                }
                title="Pembimbing"
                value={
                  currentReport.pembimbing
                }
              />

              {/* TIPE */}

              <InfoItem
                icon={
                  <Tag
                    size={18}
                  />
                }
                title="Tipe Laporan"
                value={
                  currentReport.tipe ||
                  "-"
                }
              />

              {/* PERIODE */}

              <InfoItem
                icon={
                  <Clock3
                    size={18}
                  />
                }
                title="Periode"
                value={
                  currentReport.periode ||
                  "-"
                }
              />

              {/* TANGGAL */}

              <InfoItem
                icon={
                  <CalendarDays
                    size={18}
                  />
                }
                title="Tanggal Dikirim"
                value={
                  currentReport.tanggal
                }
              />

            </div>

          </div>

          {/* =============================================
              ISI LAPORAN
          ============================================== */}

          <div className="rounded-xl border border-gray-200 p-5">

            <h3 className="mb-4 font-semibold">
              Isi Laporan
            </h3>

            <p className="whitespace-pre-line break-words leading-7 text-gray-600">
              {
                currentReport.deskripsi
              }
            </p>

          </div>

          {/* =============================================
              LAMPIRAN
          ============================================== */}

          <div className="rounded-xl border border-gray-200 p-5">

            <h3 className="mb-4 font-semibold">
              Lampiran
            </h3>

            {currentReport
              .lampiran ? (

              <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-gray-300 p-4">

                {/* FILE INFO */}

                <div className="flex min-w-0 items-center gap-3">

                  <div className="shrink-0 rounded-lg bg-blue-50 p-3">

                    <FileText
                      size={28}
                      className="text-blue-600"
                    />

                  </div>

                  <div className="min-w-0">

                    <p className="truncate font-medium">
                      {
                        currentReport
                          .lampiran
                          .nama
                      }
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {
                        currentReport
                          .lampiran
                          .ukuran
                      }
                    </p>

                  </div>

                </div>

                {/* LIHAT */}

                {currentReport
                  .lampiran
                  .url ? (

                  <button
                    type="button"
                    onClick={
                      handleViewFile
                    }
                    className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
                  >

                    <ExternalLink
                      size={16}
                    />

                    Lihat

                  </button>

                ) : (

                  <span className="shrink-0 text-sm text-gray-400">
                    File tidak tersedia
                  </span>

                )}

              </div>

            ) : (

              <div className="rounded-xl border border-dashed border-gray-300 px-5 py-8 text-center">

                <FileText
                  size={30}
                  className="mx-auto mb-3 text-gray-300"
                />

                <p className="text-sm font-medium text-gray-500">
                  Tidak ada lampiran
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Peserta tidak
                  mengunggah file
                  pada laporan ini.
                </p>

              </div>

            )}

          </div>

          {/* =============================================
              CATATAN ADMIN
          ============================================== */}

          <div className="rounded-xl border border-gray-200 p-5">

            <h3 className="font-semibold">
              Catatan Admin
            </h3>

            <p className="mb-4 mt-1 text-sm text-gray-500">
              Tambahkan catatan,
              alasan revisi, atau
              hasil pemeriksaan
              laporan.
            </p>

            <textarea
              rows={5}
              disabled={
                saving
              }
              value={
                catatan
              }
              onChange={(
                e
              ) =>
                setCatatan(
                  e.target
                    .value
                )
              }
              placeholder="Tulis catatan pemeriksaan..."
              className="w-full resize-none rounded-xl border border-gray-300 p-4 outline-none transition focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:bg-gray-50"
            />

          </div>

          {/* =============================================
              RIWAYAT REVIEW
          ============================================== */}

          {currentReport
            .ditinjauAt && (

            <div className="rounded-xl border border-gray-200 p-5">

              <h3 className="mb-4 font-semibold">
                Riwayat Pemeriksaan
              </h3>

              <div className="flex gap-4">

                <div className="mt-2 h-3 w-3 shrink-0 rounded-full bg-blue-600" />

                <div>

                  <p className="font-medium">
                    Laporan telah
                    diperiksa
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {formatDateTime(
                      currentReport
                        .ditinjauAt
                    )}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Status:{" "}
                    <span className="font-medium text-gray-700">
                      {
                        currentReport.status
                      }
                    </span>
                  </p>

                </div>

              </div>

            </div>

          )}

        </div>

        {/* ===============================================
            FOOTER
        =============================================== */}

        <div className="sticky bottom-0 flex flex-col gap-3 border-t bg-white p-6 sm:flex-row">

          {/* REVISI */}

          <button
            type="button"
            disabled={
              saving
            }
            onClick={() =>
              handleStatusChange(
                "Direvisi"
              )
            }
            className="flex-1 rounded-xl border border-yellow-500 py-3 font-medium text-yellow-600 transition hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Menyimpan..."
              : "Revisi"}
          </button>

          {/* TOLAK */}

          <button
            type="button"
            disabled={
              saving
            }
            onClick={() =>
              handleStatusChange(
                "Ditolak"
              )
            }
            className="flex-1 rounded-xl border border-red-500 py-3 font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Menyimpan..."
              : "Tolak"}
          </button>

          {/* SETUJUI */}

          <button
            type="button"
            disabled={
              saving
            }
            onClick={() =>
              handleStatusChange(
                "Disetujui"
              )
            }
            className="flex-1 rounded-xl bg-green-600 py-3 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Menyimpan..."
              : "Setujui"}
          </button>

        </div>

      </div>
    </>
  );
}

// =====================================================
// INFO ITEM
// =====================================================

function InfoItem({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4">

      <div className="shrink-0 rounded-lg bg-blue-50 p-3 text-blue-600">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-sm text-gray-500">
          {title}
        </p>

        <p className="break-words font-medium">
          {value}
        </p>

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

  if (
    status ===
    "Menunggu"
  ) {
    color =
      "bg-yellow-100 text-yellow-700";
  }

  if (
    status ===
    "Direvisi"
  ) {
    color =
      "bg-orange-100 text-orange-700";
  }

  if (
    status ===
    "Disetujui"
  ) {
    color =
      "bg-green-100 text-green-700";
  }

  if (
    status ===
    "Ditolak"
  ) {
    color =
      "bg-red-100 text-red-700";
  }

  return (
    <span
      className={`inline-block rounded-full px-4 py-2 text-sm font-semibold ${color}`}
    >
      {status}
    </span>
  );
}

// =====================================================
// FORMAT DATETIME
// =====================================================

function formatDateTime(
  value:
    | string
    | null
    | undefined
) {
  if (
    !value
  ) {
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

  return date.toLocaleString(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}