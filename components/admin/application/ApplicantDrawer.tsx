"use client";

import type { Applicant } from "@/types/applicant";
import { ReactNode, useState } from "react";
import type { AdminDoc } from "@/app/admin/pelamar/page";
import {
  X,
  User,
  FileText,
  Clock3,
  MessageSquare,
  Download,
  ExternalLink,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;

  applicant: Applicant | null;

  onAccept: () => void;
  onReject: () => void;
  onRevision: () => void;

  docs: AdminDoc[];
  docsLoading: boolean;
  docsError: string | null;

  onViewDocument: (doc: AdminDoc) => void;
  onDownloadDocument: (doc: AdminDoc) => void;

  history: any[];
  historyLoading: boolean;
  historyError: string | null;
}

export default function ApplicantDrawer({
  open,
  onClose,
  applicant,
  onAccept,
  onReject,
  onRevision,
  onViewDocument,
  onDownloadDocument,
  docs,
  docsLoading,
  docsError,
  history,
  historyLoading,
  historyError,
}: Props) {
  const [tab, setTab] = useState("data");

  if (!open || !applicant) {
    return null;
  }

  return (
    <>
      {/* OVERLAY */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
      />

      {/* DRAWER */}
      <div className="fixed right-0 top-0 z-50 h-screen w-[520px] overflow-y-auto bg-white shadow-2xl">
        {/* HEADER */}
        <div className="sticky top-0 z-10 border-b bg-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{applicant.nama}</h2>

              <p className="mt-1 text-sm text-gray-500">
                {applicant.posisi}
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 transition hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* PROFILE */}
        <div className="flex flex-col items-center py-8">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-100">
            <User size={50} className="text-blue-600" />
          </div>

          <h3 className="mt-4 font-semibold">{applicant.nama}</h3>

          <p className="text-sm text-gray-500">{applicant.sekolah}</p>
        </div>

        {/* TABS */}
        <div className="border-b">
          <div className="flex justify-around">
            <TabButton
              icon={<User size={17} />}
              title="Data"
              active={tab === "data"}
              onClick={() => setTab("data")}
            />

            <TabButton
              icon={<FileText size={17} />}
              title="Dokumen"
              active={tab === "document"}
              onClick={() => setTab("document")}
            />

            <TabButton
              icon={<Clock3 size={17} />}
              title="Timeline"
              active={tab === "timeline"}
              onClick={() => setTab("timeline")}
            />

            <TabButton
              icon={<MessageSquare size={17} />}
              title="Catatan"
              active={tab === "note"}
              onClick={() => setTab("note")}
            />
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6">
          {tab === "data" && <DataTab applicant={applicant} />}

          {tab === "document" && (
            <DocumentTab
              docs={docs}
              docsLoading={docsLoading}
              docsError={docsError}
              onViewDocument={onViewDocument}
              onDownloadDocument={onDownloadDocument}
            />
          )}

          {tab === "timeline" && <TimelineTab />}

          {tab === "note" && <NoteTab />}
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 border-t bg-white p-5">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={onReject}
              className="rounded-xl bg-red-500 py-3 font-medium text-white hover:bg-red-600"
            >
              Tolak
            </button>

            <button
              onClick={onRevision}
              className="rounded-xl bg-yellow-500 py-3 font-medium text-white hover:bg-yellow-600"
            >
              Revisi
            </button>

            <button
              onClick={onAccept}
              className="rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
            >
              Wawancara
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function DataTab({ applicant }: { applicant: Applicant }) {
  return (
    <div className="space-y-4">
      <Info label="Nama Lengkap" value={applicant.nama} />
      <Info label="Email" value={applicant.email} />

      <Info
        label="Sekolah / Kampus"
        value={applicant.sekolah}
      />

      <Info
        label="Jurusan"
        value={applicant.jurusan}
      />

      <Info
        label="Posisi Magang"
        value={applicant.posisi}
      />

      <Info
        label="Alamat"
        value={applicant.alamat}
      />

      <Info
        label="No. Handphone"
        value={applicant.nohp}
      />
    </div>
  );
}

/* =========================================================
   DOKUMEN
   ========================================================= */

function DocumentTab({
  docs,
  docsLoading,
  docsError,
  onViewDocument,
  onDownloadDocument,
}: {
  docs: AdminDoc[];
  docsLoading: boolean;
  docsError: string | null;
  onViewDocument: (doc: AdminDoc) => void;
  onDownloadDocument: (doc: AdminDoc) => void;
}) {
  if (docsLoading) {
    return (
      <div className="rounded-2xl border border-gray-200 p-5 text-center">
        <p className="text-sm text-gray-500">
          Memuat dokumen...
        </p>
      </div>
    );
  }

  if (docsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-medium text-red-700">
          Gagal memuat dokumen
        </p>

        <p className="mt-1 text-sm text-red-600">
          {docsError}
        </p>
      </div>
    );
  }

  if (!docs || docs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center">
        <FileText
          size={36}
          className="mx-auto text-gray-400"
        />

        <p className="mt-3 font-medium text-gray-700">
          Belum ada dokumen
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Dokumen yang diunggah pelamar akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {docs.map((doc) => (
        <DocumentCard
          key={`${doc.jenis}-${doc.path}`}
          doc={doc}
          onView={() => onViewDocument(doc)}
          onDownload={() => onDownloadDocument(doc)}
        />
      ))}
    </div>
  );
}

function DocumentCard({
  doc,
  onView,
  onDownload,
}: {
  doc: AdminDoc;
  onView: () => void;
  onDownload: () => void;
}) {
  const title = getDocumentName(doc);

  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <FileText
                size={20}
                className="text-blue-600"
              />
            </div>

            <div className="min-w-0">
              <p
                className="truncate font-semibold"
                title={title}
              >
                {title}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {doc.jenis}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
            <span>{formatFileSize(doc.size)}</span>

            {doc.mime_type && (
              <span>{doc.mime_type}</span>
            )}
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          Tersedia
        </span>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          <ExternalLink size={16} />
          Lihat
        </button>

        <button
          type="button"
          onClick={onDownload}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Download size={16} />
          Unduh
        </button>
      </div>
    </div>
  );
}

function getDocumentName(doc: AdminDoc) {
  const fileName = doc.path?.split("/").pop();

  if (fileName) {
    try {
      return decodeURIComponent(fileName);
    } catch {
      return fileName;
    }
  }

  return doc.jenis || "Dokumen";
}

function formatFileSize(size: number | null) {
  if (size === null || size === undefined) {
    return "Ukuran tidak diketahui";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/* =========================================================
   TIMELINE
   ========================================================= */

function TimelineTab() {
  return (
    <div className="space-y-2">
      <Timeline
        date="12 Juli 2026"
        title="Pengajuan Dikirim"
        description="Peserta mengirim formulir pendaftaran magang."
      />

      <Timeline
        date="13 Juli 2026"
        title="Data Diverifikasi"
        description="Administrator memeriksa data diri dan dokumen."
      />

      <Timeline
        date="15 Juli 2026"
        title="Jadwal Wawancara"
        description="Wawancara dijadwalkan pukul 09.00 WIB."
      />

      <Timeline
        date="18 Juli 2026"
        title="Peserta Diterima"
        description="Peserta diterima sebagai peserta magang."
      />
    </div>
  );
}

/* =========================================================
   CATATAN
   ========================================================= */

function NoteTab() {
  const [note, setNote] = useState("");

  function saveNote() {
    if (!note.trim()) {
      alert("Catatan masih kosong.");
      return;
    }

    alert("Catatan berhasil disimpan.");
  }

  return (
    <div className="space-y-5">
      <textarea
        rows={8}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Masukkan catatan pemeriksaan..."
        className="w-full rounded-xl border border-gray-300 p-4 outline-none focus:border-blue-600"
      />

      <button
        onClick={saveNote}
        className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
      >
        Simpan Catatan
      </button>
    </div>
  );
}

/* =========================================================
   COMPONENTS
   ========================================================= */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-4">
      <span className="text-sm text-gray-500">
        {label}
      </span>

      <span className="max-w-[60%] text-right font-semibold">
        {value}
      </span>
    </div>
  );
}

function Timeline({
  date,
  title,
  description,
}: {
  date: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div className="h-4 w-4 rounded-full bg-blue-600" />
        <div className="w-[2px] flex-1 bg-gray-200" />
      </div>

      <div className="pb-8">
        <p className="text-xs font-semibold text-blue-600">
          {date}
        </p>

        <p className="mt-1 font-semibold">
          {title}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function TabButton({
  icon,
  title,
  active,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-4 transition ${active
          ? "border-blue-600 text-blue-600"
          : "border-transparent text-gray-500 hover:text-blue-600"
        }`}
    >
      {icon}

      <span className="text-sm font-medium">
        {title}
      </span>
    </button>
  );
}
