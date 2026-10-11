"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ArrowRightLeft,
  CalendarDays,
  Loader2,
  X,
} from "lucide-react";

import type {
  AdminSupervisor,
} from "@/lib/admin/pembimbingService";

import type {
  MutateAdminParticipantPayload,
} from "@/lib/admin/pesertaService";


interface ParticipantMutationData {
  nama:
    string;

  pembimbingId:
    string | null;

  pembimbing:
    string;

  divisi:
    string;

  posisi:
    string;

  tanggalMulai:
    string | null;

  tanggalSelesai:
    string | null;
}


interface Props {
  open:
    boolean;

  participant:
    ParticipantMutationData | null;

  supervisors:
    AdminSupervisor[];

  saving:
    boolean;

  error?:
    string;

  onClose:
    () => void;

  onSubmit:
    (
      payload:
        MutateAdminParticipantPayload
    ) => Promise<void>;
}


export default function ParticipantMutationModal({
  open,
  participant,
  supervisors,
  saving,
  error = "",
  onClose,
  onSubmit,
}: Props) {
  const [
    tanggalMutasi,
    setTanggalMutasi,
  ] =
    useState("");


  const [
    pembimbingId,
    setPembimbingId,
  ] =
    useState("");


  const [
    divisi,
    setDivisi,
  ] =
    useState("");


  const [
    posisi,
    setPosisi,
  ] =
    useState("");


  const [
    tanggalSelesai,
    setTanggalSelesai,
  ] =
    useState("");


  const [
    alasan,
    setAlasan,
  ] =
    useState("");


  useEffect(() => {
    if (
      !open ||
      !participant
    ) {
      return;
    }


    setTanggalMutasi(
      getToday()
    );


    setPembimbingId(
      participant
        .pembimbingId ??
      ""
    );


    setDivisi(
      cleanDisplay(
        participant.divisi
      )
    );


    setPosisi(
      cleanDisplay(
        participant.posisi
      )
    );


    setTanggalSelesai(
      participant
        .tanggalSelesai ??
      ""
    );


    setAlasan(
      ""
    );

  }, [
    open,
    participant,
  ]);


  if (
    !open ||
    !participant
  ) {
    return null;
  }


  function handleSupervisorChange(
    id:
      string
  ) {
    setPembimbingId(
      id
    );


    const supervisor =
      supervisors.find(
        (
          item
        ) =>
          item.id === id
      );


    if (
      supervisor &&
      supervisor.divisi &&
      supervisor.divisi !== "-"
    ) {
      setDivisi(
        supervisor.divisi
      );
    }
  }


  async function handleSubmit() {
    if (!tanggalMutasi) {
      return;
    }


    await onSubmit({
      tanggalMutasi,

      pembimbingId:
        pembimbingId ||
        null,

      divisi:
        divisi.trim() ||
        null,

      posisi:
        posisi.trim() ||
        null,

      tanggalSelesai:
        tanggalSelesai ||
        null,

      alasan:
        alasan.trim() ||
        null,
    });
  }


  return (
    <>
      <div
        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]"
        onClick={
          saving
            ? undefined
            : onClose
        }
      />


      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">

        <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

          {/* HEADER */}

          <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">

            <div className="flex items-start gap-3">

              <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-600">

                <ArrowRightLeft
                  size={
                    20
                  }
                />

              </div>


              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  Mutasi Peserta
                </h2>


                <p className="mt-1 text-sm text-gray-500">
                  Ubah penempatan tanpa mengakhiri masa magang.
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
              className="grid h-10 w-10 place-items-center rounded-xl text-gray-400 transition hover:bg-gray-100 disabled:opacity-40"
            >
              <X
                size={
                  20
                }
              />
            </button>

          </div>


          {/* BODY */}

          <div className="space-y-6 p-6">

            {error && (

              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>

            )}


            {/* CURRENT */}

            <div className="rounded-2xl bg-gray-50 p-5">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Penempatan Saat Ini
              </p>


              <h3 className="mt-2 font-bold text-gray-900">
                {participant.nama}
              </h3>


              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">

                <Info
                  label="Divisi"
                  value={
                    participant.divisi
                  }
                />

                <Info
                  label="Posisi"
                  value={
                    participant.posisi
                  }
                />

                <Info
                  label="Pembimbing"
                  value={
                    participant.pembimbing
                  }
                />

                <Info
                  label="Periode"
                  value={`${formatDate(
                    participant.tanggalMulai
                  )} — ${formatDate(
                    participant.tanggalSelesai
                  )}`}
                />

              </div>

            </div>


            {/* NEW PLACEMENT */}

            <div>

              <h3 className="mb-4 font-semibold text-gray-900">
                Penempatan Baru
              </h3>


              <div className="grid gap-4 sm:grid-cols-2">

                <Field
                  label="Tanggal Mutasi"
                >
                  <input
                    type="date"
                    value={
                      tanggalMutasi
                    }
                    min={
                      participant
                        .tanggalMulai ??
                      undefined
                    }
                    onChange={(
                      event
                    ) =>
                      setTanggalMutasi(
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>


                <Field
                  label="Pembimbing Baru"
                >
                  <select
                    value={
                      pembimbingId
                    }
                    onChange={(
                      event
                    ) =>
                      handleSupervisorChange(
                        event.target.value
                      )
                    }
                    className={inputClass}
                  >

                    <option value="">
                      Tanpa Pembimbing
                    </option>


                    {supervisors.map(
                      (
                        supervisor
                      ) => (

                      <option
                        key={
                          supervisor.id
                        }
                        value={
                          supervisor.id
                        }
                      >
                        {supervisor.nama}
                        {supervisor.divisi &&
                        supervisor.divisi !== "-"
                          ? ` — ${supervisor.divisi}`
                          : ""}
                      </option>

                      )
                    )}

                  </select>
                </Field>


                <Field
                  label="Divisi Baru"
                >
                  <input
                    type="text"
                    value={
                      divisi
                    }
                    onChange={(
                      event
                    ) =>
                      setDivisi(
                        event.target.value
                      )
                    }
                    placeholder="Contoh: IT Development"
                    className={inputClass}
                  />
                </Field>


                <Field
                  label="Posisi Baru"
                >
                  <input
                    type="text"
                    value={
                      posisi
                    }
                    onChange={(
                      event
                    ) =>
                      setPosisi(
                        event.target.value
                      )
                    }
                    placeholder="Contoh: Frontend Developer"
                    className={inputClass}
                  />
                </Field>


                <Field
                  label="Rencana Selesai"
                >
                  <input
                    type="date"
                    value={
                      tanggalSelesai
                    }
                    min={
                      tanggalMutasi ||
                      undefined
                    }
                    onChange={(
                      event
                    ) =>
                      setTanggalSelesai(
                        event.target.value
                      )
                    }
                    className={inputClass}
                  />
                </Field>

              </div>

            </div>


            {/* REASON */}

            <Field
              label="Keterangan Mutasi"
            >

              <textarea
                rows={
                  4
                }
                value={
                  alasan
                }
                onChange={(
                  event
                ) =>
                  setAlasan(
                    event.target.value
                  )
                }
                placeholder="Contoh: Dipindahkan ke divisi lain sesuai kebutuhan perusahaan."
                className={`${inputClass} resize-none`}
              />

              <p className="mt-2 text-xs text-gray-400">
                Opsional, tetapi disarankan agar alasan mutasi tercatat pada histori.
              </p>

            </Field>

          </div>


          {/* FOOTER */}

          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-5">

            <button
              type="button"
              disabled={
                saving
              }
              onClick={
                onClose
              }
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>


            <button
              type="button"
              disabled={
                saving ||
                !tanggalMutasi
              }
              onClick={
                handleSubmit
              }
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              {saving ? (
                <Loader2
                  size={
                    17
                  }
                  className="animate-spin"
                />
              ) : (
                <ArrowRightLeft
                  size={
                    17
                  }
                />
              )}


              {saving
                ? "Memproses..."
                : "Simpan Mutasi"}

            </button>

          </div>

        </div>

      </div>
    </>
  );
}


// =====================================================
// FIELD
// =====================================================

function Field({
  label,
  children,
}: {
  label:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>

      {children}

    </label>
  );
}


// =====================================================
// INFO
// =====================================================

function Info({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div>

      <p className="text-xs text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-medium text-gray-700">
        {value || "-"}
      </p>

    </div>
  );
}


const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50";


function cleanDisplay(
  value:
    string
) {
  return value === "-"
    ? ""
    : value || "";
}


function getToday() {
  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;
}


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