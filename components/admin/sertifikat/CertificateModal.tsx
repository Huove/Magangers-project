"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  Award,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  X,
} from "lucide-react";

import type {
  AdminCertificateParticipant,
  SaveAdminCertificatePayload,
} from "@/lib/admin/sertifikatService";


interface Props {
  open:
    boolean;

  participant:
    AdminCertificateParticipant | null;

  saving:
    boolean;

  error?:
    string;

  onClose:
    () => void;

  onSubmit:
    (
      payload:
        SaveAdminCertificatePayload
    ) => Promise<void>;
}


// =====================================================
// COMPONENT
// =====================================================

export default function CertificateModal({
  open,
  participant,
  saving,
  error = "",
  onClose,
  onSubmit,
}: Props) {
  const [
    nomorSertifikat,
    setNomorSertifikat,
  ] =
    useState(
      ""
    );


  const [
    tanggalTerbit,
    setTanggalTerbit,
  ] =
    useState(
      ""
    );


  const [
    fileUrl,
    setFileUrl,
  ] =
    useState(
      ""
    );


  // ===================================================
  // RESET / PREFILL
  // ===================================================

  useEffect(
    () => {
      if (
        !open ||
        !participant
      ) {
        return;
      }


      setNomorSertifikat(
        participant
          .certificate
          ?.nomorSertifikat ??
        generateCertificateNumber(
          participant
            .nomorPeserta
        )
      );


      setTanggalTerbit(
        participant
          .certificate
          ?.tanggalTerbit ??
        getToday()
      );


      setFileUrl(
        participant
          .certificate
          ?.fileUrl ??
        ""
      );
    },
    [
      open,
      participant,
    ]
  );


  // ===================================================
  // CLOSED
  // ===================================================

  if (
    !open ||
    !participant
  ) {
    return null;
  }


  const isEdit =
    Boolean(
      participant
        .certificate
    );


  // ===================================================
  // SUBMIT
  // ===================================================

  async function handleSubmit() {
    if (
      !nomorSertifikat.trim() ||
      !tanggalTerbit
    ) {
      return;
    }


    await onSubmit({
      pesertaId:
        participant!.id,

      nomorSertifikat:
        nomorSertifikat
          .trim(),

      tanggalTerbit,

      fileUrl:
        fileUrl.trim() ||
        null,
    });
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <>
      {/* BACKDROP */}

      <div
        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]"
        onClick={
          saving
            ? undefined
            : onClose
        }
      />


      {/* WRAPPER */}

      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">

        <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

          {/* ===========================================
              HEADER
          =========================================== */}

          <div className="flex items-start justify-between border-b border-neutral-100 px-6 py-5">

            <div className="flex items-start gap-3">

              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">

                <Award
                  size={
                    21
                  }
                />

              </div>


              <div>

                <h2 className="text-xl font-bold text-neutral-900">

                  {isEdit
                    ? "Edit Sertifikat"
                    : "Terbitkan Sertifikat"}

                </h2>


                <p className="mt-1 text-sm text-neutral-500">

                  {isEdit
                    ? "Perbarui informasi sertifikat peserta."
                    : "Terbitkan sertifikat untuk peserta yang telah memenuhi syarat."}

                </p>

              </div>

            </div>


            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                onClose
              }
              className="grid h-10 w-10 place-items-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 disabled:opacity-40"
            >

              <X
                size={
                  20
                }
              />

            </button>

          </div>


          {/* ===========================================
              BODY
          =========================================== */}

          <div className="space-y-6 p-6">

            {/* ERROR */}

            {error && (

              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>

            )}


            {/* =========================================
                PARTICIPANT
            ========================================= */}

            <div className="rounded-2xl bg-neutral-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Peserta
              </p>


              <h3 className="mt-2 text-lg font-semibold text-neutral-900">
                {participant.nama}
              </h3>


              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">

                <span>
                  {participant.nomorPeserta}
                </span>

                <span>
                  {participant.email}
                </span>

              </div>


              {/* NILAI */}

              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm">

                <CheckCircle2
                  size={
                    16
                  }
                  className="text-emerald-600"
                />


                <span className="text-neutral-500">
                  Nilai akhir:
                </span>


                <span className="font-semibold text-neutral-900">

                  {participant.nilaiAkhir !==
                  null
                    ? `${participant.nilaiAkhir} / 100`
                    : "-"}

                </span>

              </div>

            </div>


            {/* =========================================
                REQUIREMENTS
            ========================================= */}

            <div>

              <h3 className="mb-3 text-sm font-semibold text-neutral-800">
                Persyaratan
              </h3>


              <div className="grid gap-2 sm:grid-cols-2">

                <Requirement
                  label="Masa magang selesai"
                  complete={
                    participant
                      .requirements
                      .magangSelesai
                  }
                />


                <Requirement
                  label="Seluruh tugas selesai"
                  complete={
                    participant
                      .requirements
                      .semuaTugasSelesai
                  }
                />


                <Requirement
                  label="Laporan akhir disetujui"
                  complete={
                    participant
                      .requirements
                      .laporanAkhirDisetujui
                  }
                />


                <Requirement
                  label="Penilaian selesai"
                  complete={
                    participant
                      .requirements
                      .penilaianSelesai
                  }
                />

              </div>

            </div>


            {/* =========================================
                FORM
            ========================================= */}

            <div className="grid gap-4 sm:grid-cols-2">

              {/* NUMBER */}

              <label className="block sm:col-span-2">

                <span className="mb-2 block text-sm font-medium text-neutral-700">
                  Nomor Sertifikat
                </span>


                <input
                  type="text"
                  value={
                    nomorSertifikat
                  }
                  onChange={(
                    event
                  ) =>
                    setNomorSertifikat(
                      event.target.value
                    )
                  }
                  placeholder="Contoh: CERT/PKL/2026/001"
                  className={inputClass}
                />

              </label>


              {/* DATE */}

              <label className="block">

                <span className="mb-2 block text-sm font-medium text-neutral-700">
                  Tanggal Terbit
                </span>


                <div className="relative">

                  <CalendarDays
                    size={
                      17
                    }
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />


                  <input
                    type="date"
                    value={
                      tanggalTerbit
                    }
                    onChange={(
                      event
                    ) =>
                      setTanggalTerbit(
                        event.target.value
                      )
                    }
                    className={`${inputClass} pl-11`}
                  />

                </div>

              </label>


              {/* FILE STATUS */}

              <div>

                <span className="mb-2 block text-sm font-medium text-neutral-700">
                  Status File
                </span>


                <div className="flex h-[46px] items-center rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm">

                  {fileUrl ? (

                    <span className="flex items-center gap-2 font-medium text-emerald-600">

                      <FileText
                        size={
                          16
                        }
                      />

                      File tersedia

                    </span>

                  ) : (

                    <span className="text-neutral-400">
                      Belum ada file
                    </span>

                  )}

                </div>

              </div>


              {/* FILE URL */}

              <label className="block sm:col-span-2">

                <span className="mb-2 block text-sm font-medium text-neutral-700">
                  URL File Sertifikat
                </span>


                <input
                  type="url"
                  value={
                    fileUrl
                  }
                  onChange={(
                    event
                  ) =>
                    setFileUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                  className={inputClass}
                />


                <p className="mt-2 text-xs leading-5 text-neutral-400">
                  Bisa dikosongkan terlebih dahulu. Sertifikat tetap dapat diterbitkan,
                  tetapi peserta belum dapat mengunduh file sampai URL tersedia.
                </p>

              </label>


              {/* PREVIEW */}

              {fileUrl && (

                <div className="sm:col-span-2">

                  <a
                    href={
                      fileUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >

                    <ExternalLink
                      size={
                        15
                      }
                    />

                    Coba buka file sertifikat

                  </a>

                </div>

              )}

            </div>

          </div>


          {/* ===========================================
              FOOTER
          =========================================== */}

          <div className="flex flex-col-reverse gap-3 border-t border-neutral-100 px-6 py-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                onClose
              }
              className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
            >
              Batal
            </button>


            <button
              type="button"
              disabled={
                saving ||
                !nomorSertifikat.trim() ||
                !tanggalTerbit
              }
              onClick={
                handleSubmit
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {saving ? (

                <Loader2
                  size={
                    17
                  }
                  className="animate-spin"
                />

              ) : (

                <Award
                  size={
                    17
                  }
                />

              )}


              {saving
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan Perubahan"
                  : "Terbitkan Sertifikat"}

            </button>

          </div>

        </div>

      </div>
    </>
  );
}


// =====================================================
// REQUIREMENT
// =====================================================

function Requirement({
  label,
  complete,
}: {
  label:
    string;

  complete:
    boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        complete
          ? "border-emerald-100 bg-emerald-50"
          : "border-neutral-200 bg-neutral-50"
      }`}
    >

      <div
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
          complete
            ? "bg-emerald-500 text-white"
            : "bg-neutral-200 text-neutral-500"
        }`}
      >

        {complete ? (

          <CheckCircle2
            size={
              15
            }
          />

        ) : (

          <Clock
            size={
              14
            }
          />

        )}

      </div>


      <span
        className={`text-xs font-medium ${
          complete
            ? "text-emerald-700"
            : "text-neutral-500"
        }`}
      >
        {label}
      </span>

    </div>
  );
}


// =====================================================
// STYLE
// =====================================================

const inputClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50";


// =====================================================
// TODAY
// =====================================================

function getToday() {
  const date =
    new Date();


  return [
    date.getFullYear(),

    String(
      date.getMonth() +
        1
    ).padStart(
      2,
      "0"
    ),

    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    ),
  ].join("-");
}


// =====================================================
// AUTO NUMBER
// =====================================================

function generateCertificateNumber(
  nomorPeserta:
    string
) {
  const year =
    new Date()
      .getFullYear();


  const cleanParticipantNumber =
    nomorPeserta
      .replace(
        /[^a-zA-Z0-9]/g,
        ""
      )
      .toUpperCase();


  return `CERT/PKL/${year}/${cleanParticipantNumber}`;
}