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
  Building2,
  Calendar,
  User,
  GraduationCap,
  Mail,
  ClipboardCheck,
  UserRoundCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

import type {
  Participant,
} from "@/app/admin/peserta/page";

// =====================================================
// PROPS
// =====================================================

interface Props {
  open: boolean;

  onClose: () => void;

  participant:
    | Participant
    | null;

  onSave: (
    participant: Participant
  ) =>
    | void
    | Promise<void>;
}

// =====================================================
// PEMBIMBING OPTION
// =====================================================

interface PembimbingOption {
  id: string;
  nama: string;
}

// =====================================================
// ABSENSI
// =====================================================

interface AttendanceSummary {
  hadir: number;
  izin: number;
  terlambat: number;
}

// =====================================================
// PENILAIAN
// =====================================================

interface Evaluation {
  kehadiran:
    | number
    | null;

  kedisiplinan:
    | number
    | null;

  tanggungJawab:
    | number
    | null;

  sikap:
    | number
    | null;

  komunikasi:
    | number
    | null;

  kerjaSama:
    | number
    | null;

  tugas:
    | number
    | null;

  laporan:
    | number
    | null;

  catatan:
    | string
    | null;
}

// =====================================================
// DEFAULT
// =====================================================

const defaultAttendance: AttendanceSummary = {
  hadir: 0,
  izin: 0,
  terlambat: 0,
};

const defaultEvaluation: Evaluation = {
  kehadiran: null,
  kedisiplinan: null,
  tanggungJawab: null,
  sikap: null,
  komunikasi: null,
  kerjaSama: null,
  tugas: null,
  laporan: null,
  catatan: null,
};

// =====================================================
// COMPONENT
// =====================================================

export default function ParticipantDrawer({
  open,
  onClose,
  participant,
  onSave,
}: Props) {
  // ===================================================
  // EDIT DATA
  // ===================================================

  const [
    editedParticipant,
    setEditedParticipant,
  ] =
    useState<Participant | null>(
      null
    );

  const [
    isEditing,
    setIsEditing,
  ] =
    useState(false);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    saveError,
    setSaveError,
  ] =
    useState("");

  // ===================================================
  // DETAIL DATABASE
  // ===================================================

  const [
    detailLoading,
    setDetailLoading,
  ] =
    useState(false);

  const [
    attendance,
    setAttendance,
  ] =
    useState<AttendanceSummary>(
      defaultAttendance
    );

  const [
    evaluation,
    setEvaluation,
  ] =
    useState<Evaluation>(
      defaultEvaluation
    );

  // ===================================================
  // PEMBIMBING
  // ===================================================

  const [
    pembimbingOptions,
    setPembimbingOptions,
  ] =
    useState<
      PembimbingOption[]
    >([]);

  // ===================================================
  // SYNC PARTICIPANT
  // ===================================================

  useEffect(() => {
    if (
      !open ||
      !participant
    ) {
      return;
    }

    setEditedParticipant(
      participant
    );

    setIsEditing(
      false
    );

    setSaveError("");

    setAttendance(
      defaultAttendance
    );

    setEvaluation(
      defaultEvaluation
    );

    loadDetailParticipant(
      participant.id
    );

    loadPembimbing();
  }, [
    open,
    participant,
  ]);

  // ===================================================
  // LOAD DETAIL
  // ===================================================

  async function loadDetailParticipant(
    pesertaId: string
  ) {
    try {
      setDetailLoading(
        true
      );

      // ===============================================
      // ABSENSI + PENILAIAN
      // ===============================================

      const [
        absensiResult,
        penilaianResult,
      ] =
        await Promise.all([
          supabase
            .from("absensi")
            .select("status")
            .eq(
              "peserta_id",
              pesertaId
            ),

          supabase
            .from("penilaian")
            .select(`
              kehadiran,
              kedisiplinan,
              tanggung_jawab,
              sikap,
              komunikasi,
              kerja_sama,
              tugas,
              laporan,
              catatan
            `)
            .eq(
              "peserta_id",
              pesertaId
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            )
            .limit(1)
            .maybeSingle(),
        ]);

      // ===============================================
      // ABSENSI
      // ===============================================

      if (
        absensiResult.error
      ) {
        console.error(
          "ABSENSI DETAIL ERROR:",
          absensiResult.error
        );
      } else {
        const absensi =
          absensiResult.data ||
          [];

        setAttendance({
          hadir:
            absensi.filter(
              (item) =>
                item.status ===
                "hadir"
            ).length,

          terlambat:
            absensi.filter(
              (item) =>
                item.status ===
                "terlambat"
            ).length,

          izin:
            absensi.filter(
              (item) =>
                item.status ===
                  "izin" ||
                item.status ===
                  "sakit"
            ).length,
        });
      }

      // ===============================================
      // PENILAIAN
      // ===============================================

      if (
        penilaianResult.error
      ) {
        console.error(
          "PENILAIAN DETAIL ERROR:",
          penilaianResult.error
        );
      } else if (
        penilaianResult.data
      ) {
        const nilai =
          penilaianResult.data;

        setEvaluation({
          kehadiran:
            nilai.kehadiran,

          kedisiplinan:
            nilai.kedisiplinan,

          tanggungJawab:
            nilai.tanggung_jawab,

          sikap:
            nilai.sikap,

          komunikasi:
            nilai.komunikasi,

          kerjaSama:
            nilai.kerja_sama,

          tugas:
            nilai.tugas,

          laporan:
            nilai.laporan,

          catatan:
            nilai.catatan,
        });
      }
    } catch (error) {
      console.error(
        "LOAD DETAIL PARTICIPANT ERROR:",
        error
      );
    } finally {
      setDetailLoading(
        false
      );
    }
  }

  // ===================================================
  // LOAD PEMBIMBING
  // ===================================================

  async function loadPembimbing() {
    try {
      // ===============================================
      // 1. PEMBIMBING
      // ===============================================

      const {
        data:
          pembimbingData,
        error:
          pembimbingError,
      } =
        await supabase
          .from("pembimbing")
          .select(`
            id,
            user_id
          `);

      if (
        pembimbingError
      ) {
        throw pembimbingError;
      }

      const rows =
        pembimbingData ||
        [];

      if (
        rows.length === 0
      ) {
        setPembimbingOptions(
          []
        );

        return;
      }

      // ===============================================
      // 2. PROFILE PEMBIMBING
      // ===============================================

      const userIds = [
        ...new Set(
          rows.map(
            (item) =>
              item.user_id
          )
        ),
      ];

      const {
        data:
          profileData,
        error:
          profileError,
      } =
        await supabase
          .from("profiles")
          .select(`
            id,
            nama_lengkap
          `)
          .in(
            "id",
            userIds
          );

      if (
        profileError
      ) {
        throw profileError;
      }

      // ===============================================
      // 3. FORMAT
      // ===============================================

      const options: PembimbingOption[] =
        rows.map(
          (item) => {
            const profile =
              (
                profileData ||
                []
              ).find(
                (user) =>
                  user.id ===
                  item.user_id
              );

            return {
              id:
                item.id,

              nama:
                profile
                  ?.nama_lengkap ||
                "Pembimbing",
            };
          }
        );

      options.sort(
        (a, b) =>
          a.nama.localeCompare(
            b.nama,
            "id"
          )
      );

      setPembimbingOptions(
        options
      );
    } catch (error) {
      console.error(
        "LOAD PEMBIMBING ERROR:",
        error
      );
    }
  }

  // ===================================================
  // GUARD
  // ===================================================

  if (
    !open ||
    !participant ||
    !editedParticipant
  ) {
    return null;
  }

  const currentParticipant =
    editedParticipant;

  // ===================================================
  // START EDIT
  // ===================================================

  function handleStartEdit() {
    setSaveError("");

    setEditedParticipant({
      ...currentParticipant,

      nama:
        normalizeEditable(
          currentParticipant.nama
        ),

      sekolah:
        normalizeEditable(
          currentParticipant.sekolah
        ),

      posisi:
        normalizeEditable(
          currentParticipant.posisi
        ),

      divisi:
        normalizeEditable(
          currentParticipant.divisi
        ),

      tanggalMulai:
        currentParticipant
          .tanggalMulai ||
        "",

      tanggalSelesai:
        currentParticipant
          .tanggalSelesai ||
        "",
    });

    setIsEditing(
      true
    );
  }

  // ===================================================
  // CANCEL EDIT
  // ===================================================

  function handleCancelEdit() {
    setEditedParticipant(
      participant
    );

    setIsEditing(
      false
    );

    setSaveError("");
  }

  // ===================================================
  // CHANGE
  // ===================================================

  function updateField<
    K extends keyof Participant
  >(
    key: K,
    value: Participant[K]
  ) {
    setEditedParticipant(
      (current) => {
        if (
          !current
        ) {
          return current;
        }

        return {
          ...current,
          [key]: value,
        };
      }
    );
  }

  // ===================================================
  // CHANGE PEMBIMBING
  // ===================================================

  function handlePembimbingChange(
    pembimbingId: string
  ) {
    const selected =
      pembimbingOptions.find(
        (item) =>
          item.id ===
          pembimbingId
      );

    setEditedParticipant(
      (current) => {
        if (
          !current
        ) {
          return current;
        }

        return {
          ...current,

          pembimbingId:
            pembimbingId ||
            null,

          pembimbing:
            selected
              ?.nama ||
            "-",
        };
      }
    );
  }

  // ===================================================
  // SAVE
  // ===================================================

  async function handleSave() {
    if (
      !currentParticipant
        .nama
        .trim()
    ) {
      setSaveError(
        "Nama peserta wajib diisi."
      );

      return;
    }

    // ===============================================
    // VALIDASI PERIODE
    // ===============================================

    if (
      currentParticipant
        .tanggalSelesai &&
      !currentParticipant
        .tanggalMulai
    ) {
      setSaveError(
        "Tanggal mulai harus diisi jika tanggal selesai diisi."
      );

      return;
    }

    if (
      currentParticipant
        .tanggalMulai &&
      currentParticipant
        .tanggalSelesai &&
      currentParticipant
        .tanggalSelesai <
        currentParticipant
          .tanggalMulai
    ) {
      setSaveError(
        "Tanggal selesai tidak boleh sebelum tanggal mulai."
      );

      return;
    }

    // ===============================================
    // PENEMPATAN
    // ===============================================

    const hasPlacement =
      Boolean(
        currentParticipant
          .pembimbingId ||
          currentParticipant
            .posisi
            .trim() ||
          currentParticipant
            .divisi
            .trim() ||
          currentParticipant
            .tanggalMulai ||
          currentParticipant
            .tanggalSelesai
      );

    if (
      hasPlacement &&
      !currentParticipant
        .tanggalMulai
    ) {
      setSaveError(
        "Tanggal mulai wajib diisi untuk menyimpan penempatan."
      );

      return;
    }

    try {
      setIsSaving(
        true
      );

      setSaveError("");

      await onSave(
        currentParticipant
      );

      setIsEditing(
        false
      );
    } catch (error) {
      console.error(
        "DRAWER SAVE ERROR:",
        error
      );

      setSaveError(
        "Data gagal disimpan."
      );
    } finally {
      setIsSaving(
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
          isSaving
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

        <div className="flex items-center justify-between border-b px-6 py-5">

          <div>

            <h2 className="text-2xl font-bold">
              Detail Peserta
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Informasi peserta
              dan penempatan
              magang.
            </p>

          </div>

          <button
            type="button"
            disabled={
              isSaving
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
              PROFILE
          ============================================== */}

          <div className="flex items-center gap-4">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
              {getInitials(
                currentParticipant.nama
              )}
            </div>

            <div className="min-w-0">

              <h1 className="break-words text-2xl font-bold">
                {
                  currentParticipant.nama ||
                  "-"
                }
              </h1>

              <p className="mt-1 text-gray-500">
                {
                  currentParticipant.email
                }
              </p>

              <div className="mt-2">

                <StatusBadge
                  status={
                    currentParticipant.status
                  }
                />

              </div>

            </div>

          </div>

          {/* =============================================
              ERROR
          ============================================== */}

          {saveError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {saveError}
            </div>
          )}

          {/* =============================================
              DATA UTAMA
          ============================================== */}

          <Section
            title="Data Peserta"
          >

            {isEditing ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* NAMA */}

                <FormField
                  label="Nama Lengkap"
                >
                  <input
                    type="text"
                    value={
                      currentParticipant.nama
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "nama",
                        e.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  />
                </FormField>

                {/* EMAIL READ ONLY */}

                <FormField
                  label="Email"
                >
                  <input
                    type="email"
                    disabled
                    value={
                      currentParticipant.email
                    }
                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500"
                  />
                </FormField>

                {/* SEKOLAH */}

                <FormField
                  label="Sekolah / Kampus"
                >
                  <input
                    type="text"
                    value={
                      currentParticipant.sekolah
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "sekolah",
                        e.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  />
                </FormField>

                {/* STATUS */}

                <FormField
                  label="Status Peserta"
                >
                  <select
                    value={
                      currentParticipant.status
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "status",
                        e.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  >
                    <option>
                      Diterima
                    </option>

                    <option>
                      Aktif
                    </option>

                    <option>
                      Selesai
                    </option>
                  </select>
                </FormField>

              </div>
            ) : (
              <div className="space-y-5">

                <InfoItem
                  icon={
                    <User
                      size={18}
                    />
                  }
                  title="Nama"
                  value={
                    currentParticipant.nama
                  }
                />

                <InfoItem
                  icon={
                    <Mail
                      size={18}
                    />
                  }
                  title="Email"
                  value={
                    currentParticipant.email
                  }
                />

                <InfoItem
                  icon={
                    <GraduationCap
                      size={18}
                    />
                  }
                  title="Sekolah / Kampus"
                  value={
                    currentParticipant.sekolah
                  }
                />

              </div>
            )}

          </Section>

          {/* =============================================
              PENEMPATAN
          ============================================== */}

          <Section
            title="Penempatan Magang"
          >

            {isEditing ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* POSISI */}

                <FormField
                  label="Posisi"
                >
                  <input
                    type="text"
                    value={
                      currentParticipant.posisi
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "posisi",
                        e.target
                          .value
                      )
                    }
                    placeholder="Contoh: Software Engineer"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  />
                </FormField>

                {/* DIVISI */}

                <FormField
                  label="Divisi"
                >
                  <input
                    type="text"
                    value={
                      currentParticipant.divisi
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "divisi",
                        e.target
                          .value
                      )
                    }
                    placeholder="Contoh: IT Development"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  />
                </FormField>

                {/* PEMBIMBING */}

                <FormField
                  label="Pembimbing"
                >
                  <select
                    value={
                      currentParticipant
                        .pembimbingId ||
                      ""
                    }
                    onChange={(
                      e
                    ) =>
                      handlePembimbingChange(
                        e.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  >

                    <option value="">
                      Belum ditentukan
                    </option>

                    {pembimbingOptions.map(
                      (
                        pembimbing
                      ) => (
                        <option
                          key={
                            pembimbing.id
                          }
                          value={
                            pembimbing.id
                          }
                        >
                          {
                            pembimbing.nama
                          }
                        </option>
                      )
                    )}

                  </select>
                </FormField>

                {/* TANGGAL MULAI */}

                <FormField
                  label="Tanggal Mulai"
                >
                  <input
                    type="date"
                    value={
                      currentParticipant.tanggalMulai
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "tanggalMulai",
                        e.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  />
                </FormField>

                {/* TANGGAL SELESAI */}

                <FormField
                  label="Tanggal Selesai"
                >
                  <input
                    type="date"
                    value={
                      currentParticipant.tanggalSelesai
                    }
                    min={
                      currentParticipant.tanggalMulai ||
                      undefined
                    }
                    onChange={(
                      e
                    ) =>
                      updateField(
                        "tanggalSelesai",
                        e.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  />
                </FormField>

              </div>
            ) : (
              <div className="space-y-5">

                <InfoItem
                  icon={
                    <Building2
                      size={18}
                    />
                  }
                  title="Posisi"
                  value={
                    currentParticipant.posisi
                  }
                />

                <InfoItem
                  icon={
                    <Building2
                      size={18}
                    />
                  }
                  title="Divisi"
                  value={
                    currentParticipant.divisi
                  }
                />

                <InfoItem
                  icon={
                    <UserRoundCheck
                      size={18}
                    />
                  }
                  title="Pembimbing"
                  value={
                    currentParticipant.pembimbing
                  }
                />

                <InfoItem
                  icon={
                    <Calendar
                      size={18}
                    />
                  }
                  title="Periode Magang"
                  value={`${currentParticipant.mulai} - ${currentParticipant.selesai}`}
                />

              </div>
            )}

          </Section>

          {/* =============================================
              ABSENSI
          ============================================== */}

          <Section
            title="Ringkasan Absensi"
          >

            {detailLoading ? (
              <p className="text-sm text-gray-400">
                Memuat absensi...
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">

                <SummaryCard
                  title="Hadir"
                  value={
                    attendance.hadir
                  }
                />

                <SummaryCard
                  title="Terlambat"
                  value={
                    attendance.terlambat
                  }
                />

                <SummaryCard
                  title="Izin / Sakit"
                  value={
                    attendance.izin
                  }
                />

              </div>
            )}

          </Section>

          {/* =============================================
              PENILAIAN
          ============================================== */}

          <Section
            title="Penilaian"
          >

            {detailLoading ? (
              <p className="text-sm text-gray-400">
                Memuat penilaian...
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                  <ScoreCard
                    title="Kehadiran"
                    value={
                      evaluation.kehadiran
                    }
                  />

                  <ScoreCard
                    title="Disiplin"
                    value={
                      evaluation.kedisiplinan
                    }
                  />

                  <ScoreCard
                    title="Tanggung Jawab"
                    value={
                      evaluation.tanggungJawab
                    }
                  />

                  <ScoreCard
                    title="Sikap"
                    value={
                      evaluation.sikap
                    }
                  />

                  <ScoreCard
                    title="Komunikasi"
                    value={
                      evaluation.komunikasi
                    }
                  />

                  <ScoreCard
                    title="Kerja Sama"
                    value={
                      evaluation.kerjaSama
                    }
                  />

                  <ScoreCard
                    title="Tugas"
                    value={
                      evaluation.tugas
                    }
                  />

                  <ScoreCard
                    title="Laporan"
                    value={
                      evaluation.laporan
                    }
                  />

                </div>

                <div className="mt-4 rounded-xl bg-gray-50 p-4">

                  <p className="text-sm font-medium text-gray-700">
                    Catatan Pembimbing
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-500">
                    {
                      evaluation.catatan ||
                      "Belum ada catatan."
                    }
                  </p>

                </div>
              </>
            )}

          </Section>

        </div>

        {/* ===============================================
            FOOTER
        =============================================== */}

        <div className="sticky bottom-0 border-t bg-white p-6">

          {!isEditing ? (

            <button
              type="button"
              onClick={
                handleStartEdit
              }
              className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              Ubah Data
            </button>

          ) : (

            <div className="flex gap-3">

              <button
                type="button"
                disabled={
                  isSaving
                }
                onClick={
                  handleCancelEdit
                }
                className="flex-1 rounded-xl border border-gray-300 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={
                  isSaving
                }
                onClick={
                  handleSave
                }
                className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving
                  ? "Menyimpan..."
                  : "Simpan"}
              </button>

            </div>

          )}

        </div>

      </div>
    </>
  );
}

// =====================================================
// SECTION
// =====================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200">

      <div className="border-b px-5 py-4 font-semibold">
        {title}
      </div>

      <div className="p-5">
        {children}
      </div>

    </div>
  );
}

// =====================================================
// FORM FIELD
// =====================================================

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      {children}

    </div>
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

        <p className="break-words font-medium text-gray-800">
          {value || "-"}
        </p>

      </div>

    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 text-center">

      <p className="text-2xl font-bold text-gray-800">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {title}
      </p>

    </div>
  );
}

// =====================================================
// SCORE CARD
// =====================================================

function ScoreCard({
  title,
  value,
}: {
  title: string;

  value:
    | number
    | null;
}) {
  const safeValue =
    value === null
      ? null
      : Math.max(
          0,
          Math.min(
            100,
            value
          )
        );

  return (
    <div className="rounded-xl bg-gray-50 p-4">

      <p className="text-xs text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-xl font-bold text-gray-800">
        {safeValue ===
        null
          ? "-"
          : safeValue}
      </p>

    </div>
  );
}

// =====================================================
// STATUS
// =====================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let style =
    "bg-gray-100 text-gray-700";

  if (
    status === "Aktif"
  ) {
    style =
      "bg-green-100 text-green-700";
  }

  if (
    status ===
    "Diterima"
  ) {
    style =
      "bg-yellow-100 text-yellow-700";
  }

  if (
    status ===
    "Selesai"
  ) {
    style =
      "bg-blue-100 text-blue-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style}`}
    >
      {status}
    </span>
  );
}

// =====================================================
// INITIAL
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

// =====================================================
// NORMALIZE
// =====================================================

function normalizeEditable(
  value: string
) {
  if (
    !value ||
    value === "-"
  ) {
    return "";
  }

  return value;
}