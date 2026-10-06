"use client";

import type { Applicant } from "@/types/applicant";
import { ReactNode, useState } from "react";
import {
  X,
  User,
  FileText,
  Clock3,
  MessageSquare,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;

  applicant: Applicant | null;

  onAccept: () => void;
  onReject: () => void;
  onRevision: () => void;

  docs: any[];
  docsLoading: boolean;
  docsError: string | null;

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
              <h2 className="text-2xl font-bold">
                {applicant.nama}
              </h2>

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
            <User
              size={50}
              className="text-blue-600"
            />
          </div>

          <h3 className="mt-4 font-semibold">
            {applicant.nama}
          </h3>

          <p className="text-sm text-gray-500">
            {applicant.sekolah}
          </p>

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

          {tab === "data" && (
            <DataTab applicant={applicant} />
          )}

          {tab === "document" && (
            <DocumentTab />
          )}

          {tab === "timeline" && (
            <TimelineTab />
          )}

          {tab === "note" && (
            <NoteTab />
          )}

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

function DataTab({
  applicant,
}: {
  applicant: Applicant;
}) {
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

function DocumentTab() {
  return (
    <div className="space-y-4">

      <DocumentCard
        title="Curriculum Vitae.pdf"
        size="1.2 MB"
        status="Terverifikasi"
      />

      <DocumentCard
        title="Surat Pengantar.pdf"
        size="860 KB"
        status="Terverifikasi"
      />

      <DocumentCard
        title="Portofolio.pdf"
        size="5.4 MB"
        status="Belum Dicek"
      />

      <DocumentCard
        title="Transkrip Nilai.pdf"
        size="1.8 MB"
        status="Terverifikasi"
      />

    </div>
  );
}

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

function DocumentCard({
  title,
  size,
  status,
}: {
  title: string;
  size: string;
  status: string;
}) {
  function handleView() {
    alert(`Membuka ${title}`);
  }

  function handleDownload() {
    alert(`Mengunduh ${title}`);
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-4">

      <div className="flex items-start justify-between">

        <div>
          <p className="font-semibold">
            {title}
          </p>

          <p className="text-sm text-gray-500">
            {size}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            status === "Terverifikasi"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {status}
        </span>

      </div>

      <div className="mt-4 flex gap-3">

        <button
          onClick={handleView}
          className="rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          Lihat
        </button>

        <button
          onClick={handleDownload}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Unduh
        </button>

      </div>

    </div>
  );
}

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
      className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-4 transition ${
        active
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