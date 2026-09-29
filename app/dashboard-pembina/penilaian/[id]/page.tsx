"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ChevronRight,
  Calendar,
  Save,
  Info,
  ChevronDown,
  RefreshCw,
  User,
  GraduationCap,
  BriefcaseBusiness,
} from "lucide-react";

import Link from "next/link";

import {
  useParams,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

import {
  hitungNilaiAkhir,
  hitungNilaiTotal,
  type AspekPenilaian,
  type StatusAspek,
} from "@/lib/penilaianData";

// =====================================================
// STATUS FILTER
// =====================================================

const STATUS_OPTIONS: Array<
  "Semua Status" | StatusAspek
> = [
  "Semua Status",
  "Sudah Dinilai",
  "Belum Dinilai",
];

// =====================================================
// KOLOM PENILAIAN DATABASE
// =====================================================

type NilaiColumn =
  | "kehadiran"
  | "kedisiplinan"
  | "tanggung_jawab"
  | "sikap"
  | "komunikasi"
  | "kerja_sama"
  | "tugas"
  | "laporan";

// =====================================================
// ASPEK PENILAIAN
//
// Total bobot = 100%
// =====================================================

type EvaluationAspect =
  Omit<AspekPenilaian, "id"> & {
    id: NilaiColumn;
  };

function createEmptyAspects():
  EvaluationAspect[] {
  return [
    {
      id: "kehadiran",
      aspek: "Kehadiran",
      bobot: 15,
      nilai: 0,
      status: "Belum Dinilai",
    },
    {
      id: "kedisiplinan",
      aspek: "Kedisiplinan",
      bobot: 15,
      nilai: 0,
      status: "Belum Dinilai",
    },
    {
      id: "tanggung_jawab",
      aspek: "Tanggung Jawab",
      bobot: 15,
      nilai: 0,
      status: "Belum Dinilai",
    },
    {
      id: "sikap",
      aspek: "Sikap",
      bobot: 10,
      nilai: 0,
      status: "Belum Dinilai",
    },
    {
      id: "komunikasi",
      aspek: "Komunikasi",
      bobot: 10,
      nilai: 0,
      status: "Belum Dinilai",
    },
    {
      id: "kerja_sama",
      aspek: "Kerja Sama",
      bobot: 10,
      nilai: 0,
      status: "Belum Dinilai",
    },
    {
      id: "tugas",
      aspek: "Tugas",
      bobot: 15,
      nilai: 0,
      status: "Belum Dinilai",
    },
    {
      id: "laporan",
      aspek: "Laporan",
      bobot: 10,
      nilai: 0,
      status: "Belum Dinilai",
    },
  ];
}

// =====================================================
// TYPE PESERTA
// =====================================================

interface ParticipantDetail {
  id: string;
  nama: string;
  kampus: string;
  posisi: string;
  status: string;
}

// =====================================================
// DATABASE TYPES
// =====================================================

interface PenilaianRow {
  id: string;

  peserta_id: string;
  pembimbing_id: string;

  periode: string;

  kehadiran: number | null;
  kedisiplinan: number | null;
  tanggung_jawab: number | null;
  sikap: number | null;
  komunikasi: number | null;
  kerja_sama: number | null;
  tugas: number | null;
  laporan: number | null;

  created_at: string;
  updated_at: string;
}

// =====================================================
// PAGE
// =====================================================

export default function PenilaianDetailPage() {
  const params =
    useParams<{
      id: string;
    }>();

  // ===================================================
  // PESERTA
  // ===================================================

  const [
    peserta,
    setPeserta,
  ] =
    useState<ParticipantDetail | null>(
      null
    );

  // ===================================================
  // PEMBIMBING ID
  // ===================================================

  const [
    pembimbingId,
    setPembimbingId,
  ] =
    useState<string | null>(
      null
    );

  // ===================================================
  // ID PENILAIAN YANG SUDAH ADA
  // ===================================================

  const [
    penilaianId,
    setPenilaianId,
  ] =
    useState<string | null>(
      null
    );

  // ===================================================
  // ASPEK
  // ===================================================

  const [
    aspekList,
    setAspekList,
  ] =
    useState<EvaluationAspect[]>(
      createEmptyAspects()
    );

  // ===================================================
  // FILTER
  // ===================================================

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      "Semua Status" | StatusAspek
    >("Semua Status");

  // ===================================================
  // PERIODE
  // ===================================================

  const [
    periode,
    setPeriode,
  ] =
    useState(
      getCurrentMonth()
    );

  // ===================================================
  // UI STATE
  // ===================================================

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    loadingNilai,
    setLoadingNilai,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    savedMessage,
    setSavedMessage,
  ] =
    useState("");

  // ===================================================
  // LOAD PESERTA
  // ===================================================

  useEffect(() => {
    loadParticipant();
  }, [params.id]);

  // ===================================================
  // LOAD NILAI SAAT PERIODE BERUBAH
  // ===================================================

  useEffect(() => {
    if (
      !pembimbingId
    ) {
      return;
    }

    loadPenilaian(
      pembimbingId
    );
  }, [
    periode,
    pembimbingId,
    params.id,
  ]);

  // ===================================================
  // LOAD PARTICIPANT CONTEXT
  // ===================================================

  async function loadParticipant() {
    try {
      setLoading(true);
      setError("");

      // ===============================================
      // 1. USER LOGIN
      // ===============================================

      const {
        data:
          userData,
        error:
          userError,
      } =
        await supabase.auth
          .getUser();

      if (
        userError ||
        !userData.user
      ) {
        throw new Error(
          "Pembimbing belum login."
        );
      }

      // ===============================================
      // 2. DATA PEMBIMBING
      // ===============================================

      const {
        data:
          pembimbingData,
        error:
          pembimbingError,
      } =
        await supabase
          .from("pembimbing")
          .select("id")
          .eq(
            "user_id",
            userData.user.id
          )
          .maybeSingle();

      if (
        pembimbingError
      ) {
        throw pembimbingError;
      }

      if (
        !pembimbingData
      ) {
        throw new Error(
          "Data pembimbing tidak ditemukan."
        );
      }

      const currentPembimbingId =
        pembimbingData.id;

      // ===============================================
      // 3. CEK PENEMPATAN
      //
      // Peserta HARUS peserta bimbingan
      // pembimbing yang sedang login.
      // ===============================================

      const {
        data:
          penempatanData,
        error:
          penempatanError,
      } =
        await supabase
          .from("penempatan")
          .select(`
            peserta_id,
            posisi
          `)
          .eq(
            "peserta_id",
            params.id
          )
          .eq(
            "pembimbing_id",
            currentPembimbingId
          )
          .maybeSingle();

      if (
        penempatanError
      ) {
        throw penempatanError;
      }

      if (
        !penempatanData
      ) {
        throw new Error(
          "Peserta tidak ditemukan atau bukan peserta bimbingan Anda."
        );
      }

      // ===============================================
      // 4. PESERTA
      // ===============================================

      const {
        data:
          pesertaData,
        error:
          pesertaError,
      } =
        await supabase
          .from("peserta")
          .select(`
            id,
            nama_lengkap,
            status
          `)
          .eq(
            "id",
            params.id
          )
          .maybeSingle();

      if (
        pesertaError
      ) {
        throw pesertaError;
      }

      if (
        !pesertaData
      ) {
        throw new Error(
          "Data peserta tidak ditemukan."
        );
      }

      // ===============================================
      // 5. PENDIDIKAN TERBARU
      // ===============================================

      const {
        data:
          pendidikanData,
        error:
          pendidikanError,
      } =
        await supabase
          .from("pendidikan")
          .select(`
            sekolah
          `)
          .eq(
            "peserta_id",
            params.id
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (
        pendidikanError
      ) {
        console.error(
          "PENDIDIKAN ERROR:",
          pendidikanError
        );
      }

      // ===============================================
      // SET PESERTA
      // ===============================================

      setPeserta({
        id:
          pesertaData.id,

        nama:
          pesertaData
            .nama_lengkap ||
          "Peserta",

        kampus:
          pendidikanData
            ?.sekolah ||
          "-",

        posisi:
          penempatanData
            .posisi ||
          "-",

        status:
          formatStatus(
            pesertaData.status
          ),
      });

      setPembimbingId(
        currentPembimbingId
      );
    } catch (err) {
      console.error(
        "LOAD PARTICIPANT ERROR:",
        err
      );

      setPeserta(
        null
      );

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil peserta."
      );
    } finally {
      setLoading(false);
    }
  }

  // ===================================================
  // LOAD PENILAIAN PER PERIODE
  // ===================================================

  async function loadPenilaian(
    currentPembimbingId: string
  ) {
    try {
      setLoadingNilai(
        true
      );

      setSavedMessage(
        ""
      );

      // ===============================================
      // PERIODE DB
      //
      // "2026-09" → "2026-09-01"
      // ===============================================

      const periodeDatabase =
        `${periode}-01`;

      // ===============================================
      // AMBIL PENILAIAN
      // ===============================================

      const {
        data:
          penilaianData,
        error:
          penilaianError,
      } =
        await supabase
          .from("penilaian")
          .select(`
            id,
            peserta_id,
            pembimbing_id,
            periode,
            kehadiran,
            kedisiplinan,
            tanggung_jawab,
            sikap,
            komunikasi,
            kerja_sama,
            tugas,
            laporan,
            created_at,
            updated_at
          `)
          .eq(
            "peserta_id",
            params.id
          )
          .eq(
            "pembimbing_id",
            currentPembimbingId
          )
          .eq(
            "periode",
            periodeDatabase
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (
        penilaianError
      ) {
        throw penilaianError;
      }

      // ===============================================
      // BELUM PERNAH DINILAI
      // ===============================================

      if (
        !penilaianData
      ) {
        setPenilaianId(
          null
        );

        setAspekList(
          createEmptyAspects()
        );

        return;
      }

      const row =
        penilaianData as PenilaianRow;

      setPenilaianId(
        row.id
      );

      // ===============================================
      // DATABASE → UI
      // ===============================================

      const formatted =
        createEmptyAspects().map(
          (aspect) => {
            const value =
              getNilaiFromRow(
                row,
                aspect.id
              );

            return {
              ...aspect,

              nilai:
                value ??
                0,

              status:
                value ===
                null
                  ? "Belum Dinilai"
                  : "Sudah Dinilai",
            } as EvaluationAspect;
          }
        );

      setAspekList(
        formatted
      );
    } catch (err) {
      console.error(
        "LOAD PENILAIAN ERROR:",
        err
      );

      setAspekList(
        createEmptyAspects()
      );

      setPenilaianId(
        null
      );
    } finally {
      setLoadingNilai(
        false
      );
    }
  }

  // ===================================================
  // SLIDER
  // ===================================================

  function handleSliderChange(
    id: NilaiColumn,
    nilai: number
  ) {
    setAspekList(
      (prev) =>
        prev.map(
          (aspect) =>
            aspect.id === id
              ? {
                  ...aspect,
                  nilai,
                  status:
                    "Sudah Dinilai",
                }
              : aspect
        )
    );

    setSavedMessage(
      ""
    );
  }

  // ===================================================
  // SIMPAN PENILAIAN
  // ===================================================

  async function handleSimpan() {
    if (
      !pembimbingId
    ) {
      alert(
        "Data pembimbing tidak ditemukan."
      );

      return;
    }

    try {
      setSaving(true);
      setSavedMessage("");

      const periodeDatabase =
        `${periode}-01`;

      // ===============================================
      // NILAI
      //
      // Belum Dinilai → NULL
      // Sudah Dinilai → angka 0-100
      // ===============================================

      const payloadNilai = {
        kehadiran:
          getAspekValue(
            aspekList,
            "kehadiran"
          ),

        kedisiplinan:
          getAspekValue(
            aspekList,
            "kedisiplinan"
          ),

        tanggung_jawab:
          getAspekValue(
            aspekList,
            "tanggung_jawab"
          ),

        sikap:
          getAspekValue(
            aspekList,
            "sikap"
          ),

        komunikasi:
          getAspekValue(
            aspekList,
            "komunikasi"
          ),

        kerja_sama:
          getAspekValue(
            aspekList,
            "kerja_sama"
          ),

        tugas:
          getAspekValue(
            aspekList,
            "tugas"
          ),

        laporan:
          getAspekValue(
            aspekList,
            "laporan"
          ),
      };

      // ===============================================
      // UPDATE JIKA SUDAH ADA
      // ===============================================

      if (
        penilaianId
      ) {
        const {
          error:
            updateError,
        } =
          await supabase
            .from("penilaian")
            .update({
              ...payloadNilai,

              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              penilaianId
            );

        if (
          updateError
        ) {
          throw updateError;
        }
      }

      // ===============================================
      // INSERT JIKA BELUM ADA
      // ===============================================

      else {
        const {
          data:
            insertedData,
          error:
            insertError,
        } =
          await supabase
            .from("penilaian")
            .insert({
              peserta_id:
                params.id,

              pembimbing_id:
                pembimbingId,

              periode:
                periodeDatabase,

              ...payloadNilai,
            })
            .select("id")
            .single();

        if (
          insertError
        ) {
          throw insertError;
        }

        setPenilaianId(
          insertedData.id
        );
      }

      // ===============================================
      // SUCCESS
      // ===============================================

      setSavedMessage(
        "Penilaian berhasil disimpan."
      );

      // Reload supaya benar-benar
      // mengambil data dari database.
      await loadPenilaian(
        pembimbingId
      );

      setSavedMessage(
        "Penilaian berhasil disimpan."
      );

      window.setTimeout(
        () => {
          setSavedMessage(
            ""
          );
        },
        3000
      );
    } catch (err) {
      console.error(
        "SAVE PENILAIAN ERROR:",
        err
      );

      alert(
        "Gagal menyimpan penilaian."
      );
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // FILTER ASPEK
  // ===================================================

  const filtered =
    aspekList.filter(
      (aspect) =>
        statusFilter ===
          "Semua Status" ||
        aspect.status ===
          statusFilter
    );

  // ===================================================
  // LOADING PAGE
  // ===================================================

  if (
    loading
  ) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">

        <RefreshCw className="h-7 w-7 animate-spin text-blue-600" />

        <p className="text-sm text-slate-400">
          Memuat data peserta...
        </p>

      </div>
    );
  }

  // ===================================================
  // ERROR / TIDAK PUNYA AKSES
  // ===================================================

  if (
    error ||
    !peserta
  ) {
    return (
      <div>

        <div className="mb-6">

          <h1 className="text-2xl font-extrabold text-slate-900">
            Penilaian Peserta
          </h1>

        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">

          <p className="font-semibold text-red-600">
            Data tidak dapat dibuka
          </p>

          <p className="mt-2 text-sm text-red-500">
            {error ||
              "Peserta tidak ditemukan."}
          </p>

          <Link
            href="/dashboard-pembina/penilaian"
            className="mt-5 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm"
          >
            Kembali
          </Link>

        </div>

      </div>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">

        <div>

          <h1 className="text-2xl font-extrabold text-slate-900">
            Penilaian Peserta
          </h1>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-slate-400">

            <Link
              href="/dashboard-pembina"
              className="hover:text-slate-600"
            >
              Dashboard
            </Link>

            <ChevronRight className="h-3.5 w-3.5" />

            <Link
              href="/dashboard-pembina/penilaian"
              className="hover:text-slate-600"
            >
              Penilaian Peserta
            </Link>

            <ChevronRight className="h-3.5 w-3.5" />

            <span className="text-slate-500">
              {peserta.nama}
            </span>

          </div>

        </div>

        {/* PERIODE + SIMPAN */}

        <div className="flex flex-wrap items-center gap-3">

          <div className="flex items-center gap-2 text-sm text-slate-500">

            <span>
              Periode Penilaian
            </span>

            <div className="relative">

              <input
                type="month"
                value={periode}
                disabled={
                  saving
                }
                onChange={(e) =>
                  setPeriode(
                    e.target.value
                  )
                }
                className="rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-blue-600 disabled:opacity-50"
              />

              <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            </div>

          </div>

          <button
            type="button"
            disabled={
              saving ||
              loadingNilai
            }
            onClick={
              handleSimpan
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-transform hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {saving
              ? "Menyimpan..."
              : "Simpan Penilaian"}
          </button>

        </div>

      </div>

      {/* =================================================
          PESERTA INFO
      ================================================= */}

      <div className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:grid-cols-3">

        <ParticipantInfo
          icon={
            <User className="h-5 w-5" />
          }
          title="Peserta"
          value={
            peserta.nama
          }
        />

        <ParticipantInfo
          icon={
            <GraduationCap className="h-5 w-5" />
          }
          title="Kampus / Sekolah"
          value={
            peserta.kampus
          }
        />

        <ParticipantInfo
          icon={
            <BriefcaseBusiness className="h-5 w-5" />
          }
          title="Posisi"
          value={
            peserta.posisi
          }
        />

      </div>

      {/* =================================================
          SAVED MESSAGE
      ================================================= */}

      {savedMessage && (
        <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {savedMessage}
        </div>
      )}

      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

        <div className="relative sm:w-56">

          <select
            value={
              statusFilter
            }
            onChange={(e) =>
              setStatusFilter(
                e.target.value as
                  | "Semua Status"
                  | StatusAspek
              )
            }
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-blue-600"
          >
            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={
                    status
                  }
                >
                  {status}
                </option>
              )
            )}
          </select>

          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        </div>

        {loadingNilai && (
          <div className="inline-flex items-center gap-2 text-sm text-slate-400">

            <RefreshCw className="h-4 w-4 animate-spin" />

            Memuat penilaian...

          </div>
        )}

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="relative mt-6 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">

        <table className="w-full min-w-[720px] text-left text-sm">

          <thead>

            <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500">

              <th className="w-14 px-6 py-4 font-medium">
                No
              </th>

              <th className="px-4 py-4 font-medium">
                Aspek Penilaian
              </th>

              <th className="px-4 py-4 font-medium">
                Bobot
              </th>

              <th className="px-4 py-4 font-medium">
                Nilai (0-100)
              </th>

              <th className="px-6 py-4 font-medium">
                Nilai Akhir
              </th>

            </tr>

          </thead>

          <tbody>

            {filtered.map(
              (
                aspect,
                index
              ) => (

                <tr
                  key={
                    aspect.id
                  }
                  className="border-b border-slate-50 last:border-0"
                >

                  {/* NO */}

                  <td className="px-6 py-4">

                    <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                      {index + 1}
                    </span>

                  </td>

                  {/* ASPEK */}

                  <td className="px-4 py-4">

                    <p className="font-semibold text-slate-900">
                      {
                        aspect.aspek
                      }
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {
                        aspect.status
                      }
                    </p>

                  </td>

                  {/* BOBOT */}

                  <td className="px-4 py-4 text-slate-500">
                    {
                      aspect.bobot
                    }
                    %
                  </td>

                  {/* NILAI */}

                  <td className="px-4 py-4">

                    <div className="max-w-xs">

                      <div className="mb-2 flex items-center gap-3">

                        <input
                          type="range"
                          min={0}
                          max={100}
                          disabled={
                            saving ||
                            loadingNilai
                          }
                          value={
                            aspect.nilai
                          }
                          onChange={(e) =>
                            handleSliderChange(
                              aspect.id,
                              Number(
                                e.target
                                  .value
                              )
                            )
                          }
                          style={{
                            accentColor:
                              "#1D4ED8",
                          }}
                          className="w-full cursor-pointer disabled:cursor-not-allowed"
                        />

                        <span className="w-10 text-right font-bold text-blue-600">
                          {
                            aspect.nilai
                          }
                        </span>

                      </div>

                      <div className="flex justify-between text-xs text-slate-400">

                        <span>
                          0
                        </span>

                        <span>
                          100
                        </span>

                      </div>

                    </div>

                  </td>

                  {/* NILAI AKHIR */}

                  <td className="px-6 py-4">

                    {aspect.status ===
                    "Sudah Dinilai" ? (

                      <span className="inline-block rounded-lg bg-emerald-50 px-3.5 py-1.5 text-sm font-bold text-emerald-600">
                        {hitungNilaiAkhir(
                          aspect.nilai
                        )}
                      </span>

                    ) : (

                      <span className="text-sm text-slate-400">
                        -
                      </span>

                    )}

                  </td>

                </tr>

              )
            )}

          </tbody>

        </table>

      </div>

      {/* =================================================
          INFO
      ================================================= */}

      <div className="mt-4 flex justify-end">

        <span className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-slate-500 shadow-sm">

          <Info className="h-4 w-4 text-blue-600" />

          Geser slider untuk
          memberikan nilai

        </span>

      </div>

      {/* =================================================
          NILAI TOTAL
      ================================================= */}

      <div className="mt-6 flex justify-end">

        <div className="rounded-2xl border border-slate-100 bg-white px-6 py-4 text-right shadow-sm">

          <p className="text-xs text-slate-400">
            Nilai Akhir Total
          </p>

          <p className="text-2xl font-extrabold text-blue-600">
            {hitungNilaiTotal(
              aspekList
            )}
          </p>

        </div>

      </div>

    </div>
  );
}

// =====================================================
// PARTICIPANT INFO
// =====================================================

function ParticipantInfo({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-xs text-slate-400">
          {title}
        </p>

        <p className="truncate font-semibold text-slate-800">
          {value}
        </p>

      </div>

    </div>
  );
}

// =====================================================
// GET NILAI DATABASE
// =====================================================

function getNilaiFromRow(
  row: PenilaianRow,
  column: NilaiColumn
): number | null {
  switch (column) {
    case "kehadiran":
      return row.kehadiran;

    case "kedisiplinan":
      return row.kedisiplinan;

    case "tanggung_jawab":
      return row.tanggung_jawab;

    case "sikap":
      return row.sikap;

    case "komunikasi":
      return row.komunikasi;

    case "kerja_sama":
      return row.kerja_sama;

    case "tugas":
      return row.tugas;

    case "laporan":
      return row.laporan;
  }
}

// =====================================================
// ASPEK → DATABASE VALUE
// =====================================================

function getAspekValue(
  aspekList: EvaluationAspect[],
  id: NilaiColumn
): number | null {
  const aspect =
    aspekList.find(
      (item) =>
        item.id === id
    );

  if (
    !aspect ||
    aspect.status !==
      "Sudah Dinilai"
  ) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      100,
      aspect.nilai
    )
  );
}

// =====================================================
// CURRENT MONTH
//
// 2026-09
// =====================================================

function getCurrentMonth() {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}`;
}

// =====================================================
// FORMAT STATUS
// =====================================================

function formatStatus(
  status: string
) {
  switch (status) {
    case "aktif":
      return "Aktif";

    case "selesai":
      return "Selesai";

    case "diterima":
      return "Diterima";

    case "ditolak":
      return "Ditolak";

    case "mengajukan":
      return "Mengajukan";

    default:
      return "Tidak Aktif";
  }
}