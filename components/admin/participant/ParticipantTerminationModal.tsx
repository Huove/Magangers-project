"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Loader2,
  X,
} from "lucide-react";

import type {
  AdminParticipant,
  TerminateAdminParticipantPayload,
} from "@/lib/admin/pesertaService";


// =====================================================
// TYPE
// =====================================================

type TerminationReason =
  | "mengundurkan_diri"
  | "mutasi_keluar"
  | "permintaan_sekolah"
  | "diberhentikan_perusahaan"
  | "pelanggaran"
  | "lainnya";


interface Props {
  open:
    boolean;

  participant:
    AdminParticipant | null;

  saving:
    boolean;

  error?:
    string;

  onClose:
    () => void;

  onSubmit:
    (
      payload:
        TerminateAdminParticipantPayload
    ) => Promise<void>;
}


// =====================================================
// OPTIONS
// =====================================================

const REASON_OPTIONS:
  Array<{
    value:
      TerminationReason;

    label:
      string;
  }> =
  [
    {
      value:
        "mengundurkan_diri",

      label:
        "Mengundurkan diri",
    },

    {
      value:
        "mutasi_keluar",

      label:
        "Mutasi keluar perusahaan",
    },

    {
      value:
        "permintaan_sekolah",

      label:
        "Permintaan sekolah / kampus",
    },

    {
      value:
        "diberhentikan_perusahaan",

      label:
        "Diberhentikan perusahaan",
    },

    {
      value:
        "pelanggaran",

      label:
        "Pelanggaran",
    },

    {
      value:
        "lainnya",

      label:
        "Lainnya",
    },
  ];


// =====================================================
// COMPONENT
// =====================================================

export default function ParticipantTerminationModal({
  open,
  participant,
  saving,
  error = "",
  onClose,
  onSubmit,
}: Props) {
  const [
    tanggalBerhenti,
    setTanggalBerhenti,
  ] =
    useState(
      ""
    );


  const [
    reasonType,
    setReasonType,
  ] =
    useState<TerminationReason>(
      "mengundurkan_diri"
    );


  const [
    perusahaanTujuan,
    setPerusahaanTujuan,
  ] =
    useState(
      ""
    );


  const [
    detailAlasan,
    setDetailAlasan,
  ] =
    useState(
      ""
    );


  const [
    localError,
    setLocalError,
  ] =
    useState(
      ""
    );


  // ===================================================
  // RESET
  // ===================================================

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }


      setTanggalBerhenti(
        getToday()
      );


      setReasonType(
        "mengundurkan_diri"
      );


      setPerusahaanTujuan(
        ""
      );


      setDetailAlasan(
        ""
      );


      setLocalError(
        ""
      );
    },
    [
      open,
      participant?.id,
    ]
  );


  // ===================================================
  // FINAL REASON
  // ===================================================

  const finalReason =
    useMemo(
      () => {
        const detail =
          detailAlasan
            .trim();


        switch (
          reasonType
        ) {
          case "mengundurkan_diri":
            return [
              "Mengundurkan diri.",
              detail,
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              );


          case "mutasi_keluar": {
            const company =
              perusahaanTujuan
                .trim();


            return [
              company
                ? `Mutasi keluar perusahaan ke ${company}.`
                : "Mutasi keluar perusahaan.",

              detail,
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              );
          }


          case "permintaan_sekolah":
            return [
              "Penghentian atas permintaan sekolah/kampus.",
              detail,
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              );


          case "diberhentikan_perusahaan":
            return [
              "Diberhentikan oleh perusahaan.",
              detail,
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              );


          case "pelanggaran":
            return [
              "Diberhentikan karena pelanggaran.",
              detail,
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              );


          case "lainnya":
            return detail;


          default:
            return detail;
        }
      },
      [
        reasonType,
        perusahaanTujuan,
        detailAlasan,
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


  // ===================================================
  // SUBMIT
  // ===================================================

  async function handleSubmit() {
    setLocalError(
      ""
    );


    if (
      !tanggalBerhenti
    ) {
      setLocalError(
        "Tanggal berhenti wajib diisi."
      );

      return;
    }


    if (
      reasonType ===
        "mutasi_keluar" &&
      !perusahaanTujuan.trim()
    ) {
      setLocalError(
        "Nama perusahaan tujuan wajib diisi untuk mutasi keluar."
      );

      return;
    }


    if (
      reasonType ===
        "lainnya" &&
      detailAlasan
        .trim()
        .length <
        5
    ) {
      setLocalError(
        "Alasan minimal 5 karakter."
      );

      return;
    }


    if (
      finalReason.length <
      5
    ) {
      setLocalError(
        "Alasan penghentian belum lengkap."
      );

      return;
    }


    await onSubmit({
      tanggalBerhenti,

      alasan:
        finalReason,
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

        <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

          {/* HEADER */}

          <div className="flex items-start justify-between border-b border-neutral-100 px-6 py-5">

            <div className="flex items-start gap-3">

              <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600">

                <AlertTriangle
                  size={
                    21
                  }
                />

              </div>


              <div>

                <h2 className="text-xl font-bold text-neutral-900">
                  Hentikan Magang
                </h2>


                <p className="mt-1 text-sm text-neutral-500">
                  Akhiri kegiatan magang peserta di perusahaan.
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


          {/* BODY */}

          <div className="space-y-5 p-6">

            {(error ||
              localError) && (

              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {localError ||
                  error}
              </div>

            )}


            {/* PARTICIPANT */}

            <div className="rounded-2xl bg-neutral-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Peserta
              </p>


              <p className="mt-2 text-lg font-semibold text-neutral-900">
                {participant.nama}
              </p>


              <p className="mt-1 text-sm text-neutral-500">
                {participant.nomorPeserta}
                {" • "}
                {participant.divisi}
              </p>

            </div>


            {/* WARNING */}

            <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4">

              <div className="flex gap-3">

                <AlertTriangle
                  size={
                    18
                  }
                  className="mt-0.5 shrink-0 text-red-600"
                />


                <div>

                  <p className="text-sm font-semibold text-red-800">
                    Tindakan ini mengakhiri kegiatan magang peserta.
                  </p>


                  <p className="mt-1 text-xs leading-5 text-red-600">
                    Status peserta akan menjadi Diberhentikan dan peserta tidak
                    lagi dianggap aktif. Riwayat penghentian tetap disimpan.
                  </p>

                </div>

              </div>

            </div>


            {/* DATE */}

            <label className="block">

              <span className="mb-2 block text-sm font-medium text-neutral-700">
                Tanggal Berhenti
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
                    tanggalBerhenti
                  }
                  onChange={(
                    event
                  ) =>
                    setTanggalBerhenti(
                      event.target.value
                    )
                  }
                  className={`${inputClass} pl-11`}
                />

              </div>

            </label>


            {/* REASON TYPE */}

            <label className="block">

              <span className="mb-2 block text-sm font-medium text-neutral-700">
                Jenis Penghentian
              </span>


              <select
                value={
                  reasonType
                }
                onChange={(
                  event
                ) =>
                  setReasonType(
                    event.target
                      .value as TerminationReason
                  )
                }
                className={
                  inputClass
                }
              >

                {REASON_OPTIONS.map(
                  (
                    option
                  ) => (

                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>

                  )
                )}

              </select>

            </label>


            {/* MUTASI EXTERNAL */}

            {reasonType ===
              "mutasi_keluar" && (

              <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">

                <div className="flex items-start gap-3">

                  <Building2
                    size={
                      18
                    }
                    className="mt-0.5 shrink-0 text-blue-600"
                  />


                  <div>

                    <p className="text-sm font-semibold text-blue-900">
                      Mutasi Keluar Perusahaan
                    </p>


                    <p className="mt-1 text-xs leading-5 text-blue-700">
                      Gunakan ini apabila peserta tetap melanjutkan magang,
                      tetapi di perusahaan lain. Di sistem perusahaan kita
                      peserta akan berstatus Diberhentikan.
                    </p>

                  </div>

                </div>


                <label className="block">

                  <span className="mb-2 block text-sm font-medium text-neutral-700">
                    Perusahaan Tujuan
                  </span>


                  <input
                    type="text"
                    value={
                      perusahaanTujuan
                    }
                    onChange={(
                      event
                    ) =>
                      setPerusahaanTujuan(
                        event.target.value
                      )
                    }
                    placeholder="Contoh: PT Maju Teknologi"
                    className={
                      inputClass
                    }
                  />

                </label>

              </div>

            )}


            {/* DETAIL */}

            <label className="block">

              <span className="mb-2 block text-sm font-medium text-neutral-700">

                {reasonType ===
                "lainnya"
                  ? "Alasan"
                  : "Keterangan Tambahan"}

              </span>


              <textarea
                rows={
                  4
                }
                value={
                  detailAlasan
                }
                onChange={(
                  event
                ) =>
                  setDetailAlasan(
                    event.target.value
                  )
                }
                placeholder={
                  reasonType ===
                  "mutasi_keluar"
                    ? "Contoh: Mutasi dilakukan atas permintaan sekolah..."
                    : "Tambahkan keterangan jika diperlukan..."
                }
                className={`${inputClass} resize-none`}
              />

            </label>


            {/* PREVIEW */}

            <div className="rounded-2xl border border-neutral-200 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Riwayat yang akan disimpan
              </p>


              <div className="mt-3 flex items-center gap-3">

                <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  Aktif
                </div>


                <ArrowRight
                  size={
                    16
                  }
                  className="text-neutral-300"
                />


                <div className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
                  Diberhentikan
                </div>

              </div>


              <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-neutral-500">

                <BriefcaseBusiness
                  size={
                    15
                  }
                  className="mt-0.5 shrink-0"
                />


                <span>
                  {finalReason ||
                    "Alasan penghentian akan tampil di sini."}
                </span>

              </div>

            </div>

          </div>


          {/* FOOTER */}

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
                !tanggalBerhenti ||
                (
                  reasonType ===
                    "mutasi_keluar" &&
                  !perusahaanTujuan
                    .trim()
                )
              }
              onClick={
                handleSubmit
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {saving ? (

                <Loader2
                  size={
                    17
                  }
                  className="animate-spin"
                />

              ) : (

                <AlertTriangle
                  size={
                    17
                  }
                />

              )}


              {saving
                ? "Memproses..."
                : "Hentikan Magang"}

            </button>

          </div>

        </div>

      </div>
    </>
  );
}


// =====================================================
// INPUT
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