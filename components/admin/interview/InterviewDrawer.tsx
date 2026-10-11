"use client";

import { X, User, CalendarClock } from "lucide-react";

import type { Interview } from "@/app/admin/wawancara/page";

interface InterviewDrawerProps {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;

  onPass: () => void;
  onFail: () => void;
  onReschedule: () => void;
}

export default function InterviewDrawer({
  open,
  onClose,
  interview,
  onPass,
  onFail,
  onReschedule,
}: InterviewDrawerProps) {

  if (!open || !interview) {
    return null;
  }

  return (
    <>
      {/* Overlay */}

      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
      />

      {/* Drawer */}

      <div className="fixed right-0 top-0 z-50 h-screen w-[560px] overflow-y-auto bg-white shadow-2xl">

        {/* Header */}

        <div className="sticky top-0 z-20 border-b bg-white px-6 py-5">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-2xl font-bold">
                Detail Wawancara
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Informasi jadwal dan hasil wawancara.
              </p>

            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-gray-100"
            >
              <X size={21} />
            </button>

          </div>

        </div>

        {/* Informasi Peserta */}

        <div className="p-6">

          <div className="rounded-2xl border border-gray-200 p-5">

            <div className="mb-5 flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">

                <User
                  size={28}
                  className="text-blue-600"
                />

              </div>

              <div>

                <h3 className="text-xl font-bold">
                  {interview.nama}
                </h3>

                <p className="text-sm text-gray-500">
                  {interview.posisi}
                </p>

              </div>

            </div>

            <div className="grid grid-cols-2 gap-5">

              <Info
                label="Sekolah"
                value={interview.sekolah}
              />

              <Info
                label="Posisi"
                value={interview.posisi}
              />

              <Info
                label="Email"
                value={interview.email}
              />

              <Info
                label="Interviewer"
                value={interview.interviewer}
              />

            </div>

          </div>

        </div>

        {/* Jadwal */}

        <div className="border-y bg-gray-50 px-6 py-6">

          <h3 className="mb-5 text-lg font-bold">
            Jadwal Wawancara
          </h3>

          <div className="grid grid-cols-2 gap-4">

            <ScheduleInfo
              label="Tanggal"
              value={interview.tanggal}
            />

            <ScheduleInfo
              label="Jam"
              value={interview.jam}
            />

            <ScheduleInfo
              label="Metode"
              value={interview.metode}
            />

            <ScheduleInfo
              label="Lokasi"
              value={interview.lokasi}
            />

          </div>

        </div>

        {/* Status */}

        <div className="px-6 py-6">

          <h3 className="mb-3 font-bold">
            Status Wawancara
          </h3>

          <StatusBadge
            status={interview.status}
          />

        </div>

        {/* Progress */}

        <div className="px-6 pb-8">

          <div className="rounded-2xl border border-gray-200 p-5">

            <h3 className="mb-6 font-bold">
              Progress Rekrutmen
            </h3>

            <div className="flex items-center justify-between">

              <ProgressStep
                title="Pengajuan"
                active
              />

              <ProgressLine />

              <ProgressStep
                title="Pemeriksaan"
                active
              />

              <ProgressLine />

              <ProgressStep
                title="Wawancara"
                active
              />

              <ProgressLine />

              <ProgressStep
                title="Hasil"
                active={
                  interview.status === "Lulus" ||
                  interview.status === "Tidak Lulus"
                }
              />

            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="sticky bottom-0 z-20 border-t bg-white p-5">

          <div className="grid grid-cols-3 gap-3">

            {/* Tidak Lulus */}

            <button
              onClick={onFail}
              className="rounded-xl border border-red-500 py-3 font-medium text-red-600 transition hover:bg-red-50"
            >
              Tidak Lulus
            </button>

            {/* Jadwalkan Ulang */}

            <button
              onClick={onReschedule}
              className="rounded-xl border border-yellow-500 py-3 font-medium text-yellow-600 transition hover:bg-yellow-50"
            >
              Jadwalkan Ulang
            </button>

            {/* Lulus */}

            <button
              onClick={onPass}
              className="rounded-xl bg-green-600 py-3 font-medium text-white transition hover:bg-green-700"
            >
              Lulus
            </button>

          </div>

        </div>

      </div>
    </>
  );
}

/* =====================================================
   INFO
===================================================== */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-1 font-medium">
        {value}
      </p>

    </div>
  );
}

/* =====================================================
   SCHEDULE INFO
===================================================== */

function ScheduleInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4">

      <div className="mb-2 flex items-center gap-2 text-gray-500">

        <CalendarClock size={16} />

        <span className="text-sm">
          {label}
        </span>

      </div>

      <p className="font-semibold">
        {value}
      </p>

    </div>
  );
}

/* =====================================================
   STATUS BADGE
===================================================== */

function StatusBadge({
  status,
}: {
  status: string;
}) {

  let style =
    "bg-gray-100 text-gray-700";

  if (status === "Dijadwalkan") {
    style = "bg-blue-100 text-blue-700";
  }

  if (status === "Menunggu") {
    style = "bg-yellow-100 text-yellow-700";
  }

  if (status === "Selesai") {
    style = "bg-gray-100 text-gray-700";
  }

  if (status === "Lulus") {
    style = "bg-green-100 text-green-700";
  }

  if (status === "Tidak Lulus") {
    style = "bg-red-100 text-red-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${style}`}
    >
      {status}
    </span>
  );
}

/* =====================================================
   PROGRESS STEP
===================================================== */

function ProgressStep({
  title,
  active,
}: {
  title: string;
  active: boolean;
}) {
  return (
    <div className="flex flex-col items-center">

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
          active
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-500"
        }`}
      >
        {active ? "✓" : ""}
      </div>

      <p className="mt-2 text-xs font-medium">
        {title}
      </p>

    </div>
  );
}

/* =====================================================
   PROGRESS LINE
===================================================== */

function ProgressLine() {
  return (
    <div className="mx-2 h-1 flex-1 rounded-full bg-blue-600" />
  );
}