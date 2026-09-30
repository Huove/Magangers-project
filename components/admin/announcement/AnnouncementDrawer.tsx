"use client";

import {
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  X,
  CalendarDays,
  Users,
  Bell,
  FileText,
  Download,
  Pencil,
  Send,
  Clock3,
} from "lucide-react";

import type {
  Announcement,
} from "@/app/admin/pengumuman/page";

import { supabase } from "@/lib/supabase";

// =====================================================
// PROPS
// =====================================================

interface Props {
  open: boolean;

  onClose: () => void;

  announcement:
    | Announcement
    | null;

  onEdit: (
    announcement: Announcement
  ) => void;

  onPublish: (
    announcement: Announcement
  ) =>
    | void
    | Promise<void>;
}

// =====================================================
// COMPONENT
// =====================================================

export default function AnnouncementDrawer({
  open,
  onClose,
  announcement,
  onEdit,
  onPublish,
}: Props) {
  const [
    downloading,
    setDownloading,
  ] = useState(false);

  const [
    publishing,
    setPublishing,
  ] = useState(false);

  // ===================================================
  // JANGAN RENDER JIKA TIDAK ADA DATA
  // ===================================================

  if (
    !open ||
    !announcement
  ) {
    return null;
  }

  // Setelah pengecekan di atas,
  // variabel ini pasti Announcement,
  // bukan Announcement | null.
  const currentAnnouncement =
    announcement;

  // ===================================================
  // DOWNLOAD PRIVATE STORAGE
  // ===================================================

  async function handleDownload() {
    const attachment =
      currentAnnouncement.attachment;

    if (
      !attachment?.path
    ) {
      alert(
        "Lampiran tidak ditemukan."
      );

      return;
    }

    try {
      setDownloading(
        true
      );

      const {
        data,
        error,
      } =
        await supabase.storage
          .from(
            "pengumuman"
          )
          .download(
            attachment.path
          );

      if (
        error
      ) {
        throw error;
      }

      if (
        !data
      ) {
        throw new Error(
          "File tidak ditemukan."
        );
      }

      const url =
        URL.createObjectURL(
          data
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        url;

      link.download =
        attachment.name;

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
    } catch (error) {
      console.error(
        "DOWNLOAD ERROR:",
        error
      );

      alert(
        "Gagal mengunduh lampiran."
      );
    } finally {
      setDownloading(
        false
      );
    }
  }

  // ===================================================
  // PUBLISH
  // ===================================================

  async function handlePublish() {
    try {
      setPublishing(
        true
      );

      await onPublish(
        currentAnnouncement
      );
    } catch (error) {
      console.error(
        "PUBLISH ERROR:",
        error
      );
    } finally {
      setPublishing(
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
          publishing
            ? undefined
            : onClose
        }
        className="fixed inset-0 z-40 bg-black/30"
      />

      {/* =================================================
          DRAWER
      ================================================= */}

      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-xl overflow-y-auto bg-white shadow-2xl">

        {/* ===============================================
            HEADER
        =============================================== */}

        <div className="flex items-center justify-between border-b px-6 py-5">

          <div>

            <h2 className="text-2xl font-bold">
              Detail Pengumuman
            </h2>

            <p className="mt-1 text-gray-500">
              Informasi lengkap
              pengumuman.
            </p>

          </div>

          <button
            type="button"
            disabled={
              publishing
            }
            onClick={
              onClose
            }
            className="rounded-lg p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
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
              STATUS + TITLE
          ============================================== */}

          <div>

            <StatusBadge
              status={
                currentAnnouncement.status
              }
            />

            <h1 className="mt-4 break-words text-3xl font-bold">
              {
                currentAnnouncement.judul
              }
            </h1>

          </div>

          {/* =============================================
              ISI
          ============================================== */}

          <div className="rounded-xl border border-gray-200 p-5">

            <h3 className="mb-4 font-semibold">
              Isi Pengumuman
            </h3>

            <p className="whitespace-pre-line break-words leading-7 text-gray-600">
              {
                currentAnnouncement.isi
              }
            </p>

          </div>

          {/* =============================================
              INFORMASI
          ============================================== */}

          <div className="rounded-xl border border-gray-200">

            <div className="border-b px-5 py-4 font-semibold">
              Informasi
            </div>

            <div className="space-y-5 p-5">

              <InfoItem
                icon={
                  <CalendarDays
                    size={18}
                  />
                }
                title="Tanggal Pengumuman"
                value={
                  currentAnnouncement.tanggal
                }
              />

              <InfoItem
                icon={
                  <Users
                    size={18}
                  />
                }
                title="Target"
                value={
                  currentAnnouncement.target
                }
              />

              <InfoItem
                icon={
                  <Bell
                    size={18}
                  />
                }
                title="Status"
                value={
                  currentAnnouncement.status
                }
              />

              <InfoItem
                icon={
                  <FileText
                    size={18}
                  />
                }
                title="Lampiran"
                value={
                  currentAnnouncement
                    .attachment
                    ?.name ||
                  "Belum ada lampiran"
                }
              />

            </div>

          </div>

          {/* =============================================
              LAMPIRAN
          ============================================== */}

          {currentAnnouncement
            .attachment && (

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">

              <div className="flex items-center justify-between gap-4">

                <div className="flex min-w-0 items-center gap-3">

                  {/* ICON */}

                  <div className="rounded-lg bg-white p-3 text-blue-600">

                    <FileText
                      size={22}
                    />

                  </div>

                  {/* FILE INFO */}

                  <div className="min-w-0">

                    <p className="font-medium text-blue-900">
                      Lampiran
                    </p>

                    <p className="truncate text-sm text-blue-700">
                      {
                        currentAnnouncement
                          .attachment
                          .name
                      }
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatFileSize(
                        currentAnnouncement
                          .attachment
                          .size
                      )}
                    </p>

                  </div>

                </div>

                {/* DOWNLOAD */}

                <button
                  type="button"
                  disabled={
                    downloading
                  }
                  onClick={
                    handleDownload
                  }
                  className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <Download
                    size={16}
                  />

                  {downloading
                    ? "Mengunduh..."
                    : "Download"}

                </button>

              </div>

            </div>

          )}

          {/* =============================================
              RIWAYAT PUBLIKASI
          ============================================== */}

          <div className="rounded-xl border border-gray-200 p-5">

            <div className="mb-5 flex items-center gap-2">

              <Clock3
                size={18}
                className="text-blue-600"
              />

              <h3 className="font-semibold">
                Riwayat Publikasi
              </h3>

            </div>

            <div className="space-y-4">

              {/* DIBUAT */}

              <TimelineItem
                title="Pengumuman dibuat"
                date={
                  formatDateTime(
                    currentAnnouncement.createdAt
                  )
                }
              />

              {/* DIPUBLIKASIKAN */}

              {currentAnnouncement
                .publishedAt ? (

                <TimelineItem
                  title="Pengumuman dipublikasikan"
                  date={
                    formatDateTime(
                      currentAnnouncement
                        .publishedAt
                    )
                  }
                />

              ) : (

                <TimelineItem
                  title={
                    currentAnnouncement.status ===
                    "Terjadwal"
                      ? "Menunggu jadwal publikasi"
                      : "Belum dipublikasikan"
                  }
                  date={
                    currentAnnouncement.status ===
                    "Terjadwal"
                      ? currentAnnouncement.tanggal
                      : "-"
                  }
                  muted
                />

              )}

            </div>

          </div>

        </div>

        {/* ===============================================
            FOOTER
        =============================================== */}

        <div className="sticky bottom-0 flex gap-3 border-t bg-white p-6">

          {/* EDIT */}

          <button
            type="button"
            disabled={
              publishing
            }
            onClick={() =>
              onEdit(
                currentAnnouncement
              )
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-yellow-500 py-3 font-medium text-yellow-600 hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Pencil
              size={18}
            />

            Edit
          </button>

          {/* PUBLISH */}

          {currentAnnouncement.status !==
            "Dipublikasikan" && (

            <button
              type="button"
              disabled={
                publishing
              }
              onClick={
                handlePublish
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Send
                size={18}
              />

              {publishing
                ? "Mempublikasikan..."
                : "Publikasikan"}

            </button>

          )}

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

      <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
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
// TIMELINE ITEM
// =====================================================

function TimelineItem({
  title,
  date,
  muted = false,
}: {
  title: string;
  date: string;
  muted?: boolean;
}) {
  return (
    <div className="flex gap-4">

      <div
        className={`mt-2 h-3 w-3 shrink-0 rounded-full ${
          muted
            ? "bg-gray-300"
            : "bg-blue-600"
        }`}
      />

      <div>

        <p
          className={`font-medium ${
            muted
              ? "text-gray-500"
              : "text-gray-800"
          }`}
        >
          {title}
        </p>

        <p className="text-sm text-gray-500">
          {date}
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
    "Dipublikasikan"
  ) {
    color =
      "bg-green-100 text-green-700";
  }

  if (
    status ===
    "Draft"
  ) {
    color =
      "bg-yellow-100 text-yellow-700";
  }

  if (
    status ===
    "Terjadwal"
  ) {
    color =
      "bg-blue-100 text-blue-700";
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

// =====================================================
// FORMAT FILE SIZE
// =====================================================

function formatFileSize(
  bytes: number
) {
  if (
    !bytes
  ) {
    return "0 KB";
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(1)} MB`;
}