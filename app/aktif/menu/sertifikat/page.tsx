"use client";

import * as React from "react";

import {
  Award,
  Check,
  Clock,
  FileCheck,
  ClipboardCheck,
  BookOpenCheck,
  GraduationCap,
  Eye,
  Download,
  ShieldCheck,
  Loader2,
  AlertCircle,
  RefreshCw,
  Hash,
  CalendarDays,
} from "lucide-react";

import { supabase } from "@/lib/supabase";


// =====================================================
// TYPE SYARAT
// =====================================================

type Syarat = {
  id: number;

  title: string;

  description: string;

  selesai: boolean;

  icon: React.ReactNode;
};


// =====================================================
// TYPE PESERTA
// =====================================================

type PesertaData = {
  id: string;

  status: string;

  tanggalMulai: string | null;

  tanggalSelesai: string | null;
};


// =====================================================
// TYPE SERTIFIKAT
// =====================================================

type SertifikatData = {
  id: string;

  nomorSertifikat: string | null;

  fileUrl: string | null;

  tanggalTerbit: string | null;
};


// =====================================================
// TYPE PENILAIAN
// =====================================================

type PenilaianData = {
  id: string;

  peserta_id: string;

  pembimbing_id: string | null;

  kehadiran: number | null;

  kedisiplinan: number | null;

  tanggung_jawab: number | null;

  sikap: number | null;

  komunikasi: number | null;

  kerja_sama: number | null;

  tugas: number | null;

  laporan: number | null;

  catatan: string | null;

  created_at: string | null;

  updated_at: string | null;
};


// =====================================================
// PAGE
// =====================================================

export default function SertifikatPage() {
  // ===================================================
  // PESERTA
  // ===================================================

  const [
    peserta,
    setPeserta,
  ] =
    React.useState<
      PesertaData | null
    >(
      null
    );


  // ===================================================
  // SYARAT
  // ===================================================

  const [
    syarat,
    setSyarat,
  ] =
    React.useState<
      Syarat[]
    >(
      []
    );


  // ===================================================
  // SERTIFIKAT
  // ===================================================

  const [
    sertifikat,
    setSertifikat,
  ] =
    React.useState<
      SertifikatData | null
    >(
      null
    );


  // ===================================================
  // TUGAS
  // ===================================================

  const [
    totalTugas,
    setTotalTugas,
  ] =
    React.useState(
      0
    );


  const [
    tugasSelesai,
    setTugasSelesai,
  ] =
    React.useState(
      0
    );


  // ===================================================
  // NILAI AKHIR
  // ===================================================

  const [
    nilaiAkhir,
    setNilaiAkhir,
  ] =
    React.useState<
      number | null
    >(
      null
    );


  // ===================================================
  // STATE
  // ===================================================

  const [
    loading,
    setLoading,
  ] =
    React.useState(
      true
    );


  const [
    refreshing,
    setRefreshing,
  ] =
    React.useState(
      false
    );


  const [
    error,
    setError,
  ] =
    React.useState(
      ""
    );


  // ===================================================
  // FETCH DATA
  // ===================================================

  const fetchSertifikat =
    React.useCallback(
      async (
        refresh = false
      ) => {
        try {
          // ===========================================
          // LOADING
          // ===========================================

          if (
            refresh
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }


          setError(
            ""
          );


          // ===========================================
          // USER LOGIN
          // ===========================================

          const {
            data: {
              user,
            },

            error:
            userError,
          } =
            await supabase.auth
              .getUser();


          if (
            userError
          ) {
            throw new Error(
              `[AUTH] ${userError.message}`
            );
          }


          if (
            !user
          ) {
            throw new Error(
              "User tidak ditemukan. Silakan login kembali."
            );
          }


          // ===========================================
          // PESERTA
          // ===========================================

          const {
            data:
            pesertaData,

            error:
            pesertaError,
          } =
            await supabase
              .from(
                "peserta"
              )
              .select(`
                id,
                status,
                tanggal_mulai,
                tanggal_selesai
              `)
              .eq(
                "user_id",
                user.id
              )
              .maybeSingle();


          if (
            pesertaError
          ) {
            throwQueryError(
              "PESERTA",
              pesertaError
            );
          }


          if (
            !pesertaData
          ) {
            throw new Error(
              "[PESERTA] Data peserta tidak ditemukan."
            );
          }


          const pesertaId =
            pesertaData.id;


          setPeserta({
            id:
              pesertaData.id,

            status:
              pesertaData.status,

            tanggalMulai:
              pesertaData
                .tanggal_mulai,

            tanggalSelesai:
              pesertaData
                .tanggal_selesai,
          });


          // ===========================================
          // QUERY DATABASE
          // ===========================================

          const [
            tugasResult,
            laporanResult,
            penilaianResult,
            sertifikatResult,
          ] =
            await Promise.all([
              // =======================================
              // TUGAS PESERTA
              // =======================================

              supabase
                .from(
                  "tugas_peserta"
                )
                .select(`
                  id,
                  status
                `)
                .eq(
                  "peserta_id",
                  pesertaId
                ),


              // =======================================
              // LAPORAN
              // =======================================

              supabase
                .from(
                  "laporan"
                )
                .select(`
                  id,
                  tipe,
                  judul,
                  status
                `)
                .eq(
                  "peserta_id",
                  pesertaId
                ),


              // =======================================
              // PENILAIAN
              // =======================================

              supabase
                .from(
                  "penilaian"
                )
                .select(`
                  id,
                  peserta_id,
                  pembimbing_id,
                  kehadiran,
                  kedisiplinan,
                  tanggung_jawab,
                  sikap,
                  komunikasi,
                  kerja_sama,
                  tugas,
                  laporan,
                  catatan,
                  created_at,
                  updated_at
                `)
                .eq(
                  "peserta_id",
                  pesertaId
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
                .limit(
                  1
                )
                .maybeSingle(),


              // =======================================
              // SERTIFIKAT
              // =======================================

              supabase
                .from(
                  "sertifikat"
                )
                .select(`
                  id,
                  nomor_sertifikat,
                  file_url,
                  tanggal_terbit
                `)
                .eq(
                  "peserta_id",
                  pesertaId
                )
                .maybeSingle(),
            ]);


          // ===========================================
          // CHECK ERROR TUGAS
          // ===========================================

          if (
            tugasResult.error
          ) {
            throwQueryError(
              "TUGAS",
              tugasResult.error
            );
          }


          // ===========================================
          // CHECK ERROR LAPORAN
          // ===========================================

          if (
            laporanResult.error
          ) {
            throwQueryError(
              "LAPORAN",
              laporanResult.error
            );
          }


          // ===========================================
          // CHECK ERROR PENILAIAN
          // ===========================================

          if (
            penilaianResult.error
          ) {
            throwQueryError(
              "PENILAIAN",
              penilaianResult.error
            );
          }


          // ===========================================
          // CHECK ERROR SERTIFIKAT
          // ===========================================

          if (
            sertifikatResult.error
          ) {
            throwQueryError(
              "SERTIFIKAT",
              sertifikatResult.error
            );
          }


          // =================================================
          // 1. MASA MAGANG SELESAI
          // =================================================

          const masaMagangSelesai =
            normalizeStatus(
              pesertaData.status
            ) ===
            "selesai";


          // =================================================
          // 2. SELURUH TUGAS SELESAI
          // =================================================

          const tugasData =
            tugasResult.data ??
            [];


          const jumlahTugas =
            tugasData.length;


          const jumlahTugasSelesai =
            tugasData.filter(
              (
                item
              ) =>
                normalizeStatus(
                  item.status
                ) ===
                "selesai"
            ).length;


          setTotalTugas(
            jumlahTugas
          );


          setTugasSelesai(
            jumlahTugasSelesai
          );


          const semuaTugasSelesai =
            jumlahTugas >
            0 &&
            jumlahTugasSelesai ===
            jumlahTugas;


          // =================================================
          // 3. LAPORAN AKHIR DISETUJUI
          // =================================================

          const laporanData =
            laporanResult.data ??
            [];


          const laporanAkhir =
            laporanData.find(
              (
                item
              ) => {
                const tipe =
                  normalizeText(
                    item.tipe
                  );


                const judul =
                  normalizeText(
                    item.judul
                  );


                return (
                  tipe.includes(
                    "akhir"
                  ) ||
                  judul.includes(
                    "laporan akhir"
                  )
                );
              }
            );


          const laporanAkhirDisetujui =
            Boolean(
              laporanAkhir &&
              normalizeStatus(
                laporanAkhir
                  .status
              ) ===
              "disetujui"
            );


          // =================================================
          // 4. PENILAIAN PEMBIMBING
          // =================================================

          const penilaian =
            penilaianResult.data as
            PenilaianData | null;


          // =================================================
          // SEMUA NILAI
          // =================================================

          const daftarNilai:
            Array<
              number | null
            > =
            penilaian
              ? [
                penilaian
                  .kehadiran,

                penilaian
                  .kedisiplinan,

                penilaian
                  .tanggung_jawab,

                penilaian
                  .sikap,

                penilaian
                  .komunikasi,

                penilaian
                  .kerja_sama,

                penilaian
                  .tugas,

                penilaian
                  .laporan,
              ]
              : [];


          // =================================================
          // CEK SEMUA ASPEK SUDAH DINILAI
          // =================================================

          const penilaianSelesai =
            Boolean(
              penilaian &&
              daftarNilai.length ===
              8 &&
              daftarNilai.every(
                (
                  nilai
                ) =>
                  nilai !==
                  null &&
                  nilai !==
                  undefined
              )
            );


          // =================================================
          // HITUNG NILAI AKHIR
          // =================================================

          let nilaiRataRata:
            number | null =
            null;


          if (penilaianSelesai) {
            const total = daftarNilai.reduce<number>(
              (jumlah, nilai) =>
                jumlah + Number(nilai ?? 0),
              0
            );

            nilaiRataRata = Math.round(
              total / daftarNilai.length
            );
          }


          setNilaiAkhir(
            nilaiRataRata
          );


          // =================================================
          // 5. DINYATAKAN LULUS
          //
          // Untuk sekarang:
          // jika record sertifikat sudah dibuat,
          // peserta dianggap sudah dinyatakan lulus.
          // =================================================

          const certificate =
            sertifikatResult.data;


          const dinyatakanLulus =
            Boolean(
              certificate?.id
            );


          // =================================================
          // SET SERTIFIKAT
          // =================================================

          if (
            certificate
          ) {
            setSertifikat({
              id:
                certificate.id,

              nomorSertifikat:
                certificate
                  .nomor_sertifikat ??
                null,

              fileUrl:
                certificate
                  .file_url ??
                null,

              tanggalTerbit:
                certificate
                  .tanggal_terbit ??
                null,
            });

          } else {
            setSertifikat(
              null
            );
          }


          // =================================================
          // BUILD SYARAT
          // =================================================

          const syaratBaru:
            Syarat[] = [
              // =============================================
              // MASA MAGANG
              // =============================================

              {
                id:
                  1,

                title:
                  "Masa Magang Selesai",

                description:
                  masaMagangSelesai
                    ? "Masa magang telah dinyatakan selesai."
                    : `Status magang saat ini: ${formatStatus(
                      pesertaData
                        .status
                    )}.`,

                selesai:
                  masaMagangSelesai,

                icon:
                  <Clock
                    size={
                      20
                    }
                  />,
              },


              // =============================================
              // TUGAS
              // =============================================

              {
                id:
                  2,

                title:
                  "Seluruh Tugas Selesai",

                description:
                  jumlahTugas ===
                    0
                    ? "Belum ada tugas yang dapat diverifikasi."
                    : `${jumlahTugasSelesai} dari ${jumlahTugas} tugas telah selesai.`,

                selesai:
                  semuaTugasSelesai,

                icon:
                  <ClipboardCheck
                    size={
                      20
                    }
                  />,
              },


              // =============================================
              // LAPORAN
              // =============================================

              {
                id:
                  3,

                title:
                  "Laporan Akhir Disetujui",

                description:
                  laporanAkhir
                    ? laporanAkhirDisetujui
                      ? "Laporan akhir telah diperiksa dan disetujui."
                      : `Status laporan akhir: ${formatStatus(
                        laporanAkhir
                          .status
                      )}.`
                    : "Laporan akhir belum ditemukan.",

                selesai:
                  laporanAkhirDisetujui,

                icon:
                  <FileCheck
                    size={
                      20
                    }
                  />,
              },


              // =============================================
              // PENILAIAN
              // =============================================

              {
                id:
                  4,

                title:
                  "Penilaian Pembimbing Selesai",

                description:
                  penilaianSelesai
                    ? `Seluruh aspek penilaian telah selesai dengan nilai rata-rata ${nilaiRataRata}.`
                    : penilaian
                      ? "Penilaian sudah tersedia, tetapi masih ada aspek yang belum dinilai."
                      : "Penilaian dari pembimbing belum tersedia.",

                selesai:
                  penilaianSelesai,

                icon:
                  <BookOpenCheck
                    size={
                      20
                    }
                  />,
              },


              // =============================================
              // KELULUSAN
              // =============================================

              {
                id:
                  5,

                title:
                  "Dinyatakan Lulus",

                description:
                  dinyatakanLulus
                    ? "Peserta telah dinyatakan lulus dan sertifikat telah diterbitkan."
                    : "Kelulusan peserta belum ditetapkan.",

                selesai:
                  dinyatakanLulus,

                icon:
                  <GraduationCap
                    size={
                      20
                    }
                  />,
              },
            ];


          setSyarat(
            syaratBaru
          );

        } catch (
        err:
          unknown
        ) {
          // ===========================================
          // ERROR
          // ===========================================

          const message =
            err instanceof Error
              ? err.message
              : "Gagal mengambil data sertifikat.";


          console.error(
            "GAGAL MENGAMBIL DATA SERTIFIKAT:",
            message
          );


          setError(
            message
          );

        } finally {
          setLoading(
            false
          );


          setRefreshing(
            false
          );
        }
      },
      []
    );


  // ===================================================
  // LOAD
  // ===================================================

  React.useEffect(
    () => {
      fetchSertifikat();
    },
    [
      fetchSertifikat,
    ]
  );


  // ===================================================
  // PROGRESS
  // ===================================================

  const jumlahSelesai =
    syarat.filter(
      (
        item
      ) =>
        item.selesai
    ).length;


  const progress =
    syarat.length >
      0
      ? Math.round(
        (
          jumlahSelesai /
          syarat.length
        ) *
        100
      )
      : 0;


  const semuaSelesai =
    syarat.length >
    0 &&
    syarat.every(
      (
        item
      ) =>
        item.selesai
    );


  // ===================================================
  // FILE TERSEDIA
  // ===================================================

  const sertifikatTersedia =
    Boolean(
      sertifikat?.fileUrl
    );


  // ===================================================
  // LIHAT SERTIFIKAT
  // ===================================================

  function handleLihatSertifikat() {
    if (
      !sertifikat
        ?.fileUrl
    ) {
      alert(
        "File sertifikat belum tersedia."
      );

      return;
    }


    window.open(
      sertifikat.fileUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }


  // ===================================================
  // DOWNLOAD
  // ===================================================

  function handleDownload() {
    if (
      !sertifikat
        ?.fileUrl
    ) {
      alert(
        "File sertifikat belum tersedia."
      );

      return;
    }


    const link =
      document.createElement(
        "a"
      );


    link.href =
      sertifikat.fileUrl;


    link.target =
      "_blank";


    link.rel =
      "noopener noreferrer";


    link.download =
      sertifikat
        .nomorSertifikat
        ? `sertifikat-${sertifikat.nomorSertifikat}.pdf`
        : "sertifikat-magang.pdf";


    document.body
      .appendChild(
        link
      );


    link.click();


    document.body
      .removeChild(
        link
      );
  }


  // ===================================================
  // LOADING
  // ===================================================

  if (
    loading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">

        <div className="text-center">

          <Loader2
            size={
              32
            }
            className="mx-auto animate-spin text-blue-600"
          />


          <p className="mt-4 text-sm text-neutral-500">
            Memeriksa persyaratan sertifikat...
          </p>

        </div>

      </div>
    );
  }


  // ===================================================
  // ERROR
  // ===================================================

  if (
    error
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">

        <div className="w-full max-w-lg rounded-3xl border border-red-200 bg-red-50 p-6">

          <AlertCircle
            size={
              30
            }
            className="text-red-600"
          />


          <h2 className="mt-4 text-lg font-semibold text-red-900">
            Gagal memuat sertifikat
          </h2>


          <p className="mt-2 break-words text-sm leading-6 text-red-700">
            {error}
          </p>


          <button
            type="button"
            disabled={
              refreshing
            }
            onClick={() =>
              fetchSertifikat(
                true
              )
            }
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
          >

            <RefreshCw
              size={
                16
              }
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Coba Lagi

          </button>

        </div>

      </div>
    );
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>

          <div className="mb-1 flex items-center gap-2">

            <Award
              size={
                18
              }
              className="text-neutral-900"
            />


            <h1 className="text-2xl font-semibold text-neutral-900">
              Sertifikat Magang
            </h1>

          </div>


          <p className="mt-1 text-sm text-neutral-500">
            Sertifikat magang akan tersedia setelah
            seluruh persyaratan diselesaikan.
          </p>

        </div>


        {/* =============================================
            REFRESH
        ============================================= */}

        <button
          type="button"
          disabled={
            refreshing
          }
          onClick={() =>
            fetchSertifikat(
              true
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >

          <RefreshCw
            size={
              15
            }
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />


          {refreshing
            ? "Memperbarui..."
            : "Refresh"}

        </button>

      </div>


      {/* =================================================
          STATUS SERTIFIKAT
      ================================================= */}

      <div
        className={`mb-6 rounded-3xl border p-6 shadow-sm ${sertifikatTersedia
            ? "border-emerald-200 bg-emerald-50/40"
            : "border-neutral-200 bg-white"
          }`}
      >

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          <div className="flex items-start gap-4">

            {/* ICON */}

            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${sertifikatTersedia
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-blue-50 text-blue-600"
                }`}
            >

              {sertifikatTersedia ? (

                <Award
                  size={
                    28
                  }
                />

              ) : (

                <ShieldCheck
                  size={
                    28
                  }
                />

              )}

            </div>


            {/* TEXT */}

            <div>

              <p className="text-sm text-neutral-500">
                Status sertifikat
              </p>


              <h2 className="mt-1 text-xl font-semibold text-neutral-900">

                {sertifikatTersedia
                  ? "Sertifikat tersedia"
                  : semuaSelesai
                    ? "Sertifikat sedang diproses"
                    : "Sertifikat belum tersedia"}

              </h2>


              <p className="mt-1 max-w-xl text-sm leading-relaxed text-neutral-500">

                {sertifikatTersedia
                  ? "Selamat! Sertifikat magang sudah tersedia untuk dilihat dan diunduh."
                  : semuaSelesai
                    ? "Seluruh persyaratan telah selesai, tetapi file sertifikat belum tersedia."
                    : "Selesaikan seluruh persyaratan berikut untuk mendapatkan sertifikat magang."}

              </p>

            </div>

          </div>


          {/* =============================================
              ACTION SERTIFIKAT
          ============================================= */}

          {sertifikatTersedia && (

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={
                  handleLihatSertifikat
                }
                className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >

                <Eye
                  size={
                    16
                  }
                />

                Lihat Sertifikat

              </button>


              <button
                type="button"
                onClick={
                  handleDownload
                }
                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >

                <Download
                  size={
                    16
                  }
                />

                Download

              </button>

            </div>

          )}

        </div>


        {/* =============================================
            INFO SERTIFIKAT
        ============================================= */}

        {sertifikat && (

          <div className="mt-6 grid gap-4 border-t border-neutral-200 pt-5 sm:grid-cols-2">

            {/* NOMOR SERTIFIKAT */}

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">

                <Hash
                  size={
                    17
                  }
                />

              </div>


              <div>

                <p className="text-xs text-neutral-400">
                  Nomor Sertifikat
                </p>


                <p className="mt-1 text-sm font-semibold text-neutral-800">

                  {sertifikat
                    .nomorSertifikat ||
                    "-"}

                </p>

              </div>

            </div>


            {/* TANGGAL TERBIT */}

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">

                <CalendarDays
                  size={
                    17
                  }
                />

              </div>


              <div>

                <p className="text-xs text-neutral-400">
                  Tanggal Terbit
                </p>


                <p className="mt-1 text-sm font-semibold text-neutral-800">

                  {formatTanggal(
                    sertifikat
                      .tanggalTerbit
                  )}

                </p>

              </div>

            </div>

          </div>

        )}

      </div>


      {/* =================================================
          PROGRESS
      ================================================= */}

      <div className="mb-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

        <div className="mb-4 flex items-center justify-between gap-5">

          <div>

            <h2 className="text-lg font-semibold text-neutral-900">
              Progress Persyaratan
            </h2>


            <p className="mt-1 text-sm text-neutral-500">

              {jumlahSelesai} dari{" "}
              {syarat.length} persyaratan telah selesai.

            </p>

          </div>


          <span className="text-sm font-semibold text-blue-600">
            {progress}%
          </span>

        </div>


        {/* =============================================
            PROGRESS BAR
        ============================================= */}

        <div className="h-2 overflow-hidden rounded-full bg-neutral-100">

          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{
              width:
                `${progress}%`,
            }}
          />

        </div>


        {/* =============================================
            SUMMARY
        ============================================= */}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">

          {/* TUGAS */}

          <div className="rounded-2xl bg-neutral-50 p-4">

            <p className="text-xs text-neutral-400">
              Tugas Selesai
            </p>


            <p className="mt-1 text-lg font-semibold text-neutral-800">

              {tugasSelesai}
              {" / "}
              {totalTugas}

            </p>

          </div>


          {/* NILAI */}

          <div className="rounded-2xl bg-neutral-50 p-4">

            <p className="text-xs text-neutral-400">
              Nilai Rata-rata
            </p>


            <p className="mt-1 text-lg font-semibold text-neutral-800">

              {nilaiAkhir !==
                null
                ? `${nilaiAkhir} / 100`
                : "-"}

            </p>

          </div>

        </div>

      </div>


      {/* =================================================
          PERSYARATAN
      ================================================= */}

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

        <div className="mb-6">

          <h2 className="text-lg font-semibold text-neutral-900">
            Persyaratan Sertifikat
          </h2>


          <p className="mt-1 text-sm text-neutral-500">
            Status persyaratan diperiksa langsung dari database.
          </p>

        </div>


        <div className="space-y-3">

          {syarat.map(
            (
              item
            ) => (

              <div
                key={
                  item.id
                }
                className={`flex items-center gap-4 rounded-2xl border p-4 transition ${item.selesai
                    ? "border-emerald-100 bg-emerald-50/40"
                    : "border-neutral-200 bg-white"
                  }`}
              >

                {/* =========================================
                  ICON
              ========================================= */}

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.selesai
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-neutral-100 text-neutral-500"
                    }`}
                >
                  {item.icon}
                </div>


                {/* =========================================
                  TEXT
              ========================================= */}

                <div className="min-w-0 flex-1">

                  <div className="flex flex-wrap items-center gap-2">

                    <h3 className="text-sm font-semibold text-neutral-900">
                      {item.title}
                    </h3>


                    {item.selesai ? (

                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">

                        <Check
                          size={
                            12
                          }
                        />

                        Selesai

                      </span>

                    ) : (

                      <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500">

                        <Clock
                          size={
                            12
                          }
                        />

                        Menunggu

                      </span>

                    )}

                  </div>


                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                    {item.description}
                  </p>

                </div>


                {/* =========================================
                  STATUS
              ========================================= */}

                <div
                  className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-full sm:flex ${item.selesai
                      ? "bg-emerald-500 text-white"
                      : "bg-neutral-100 text-neutral-400"
                    }`}
                >

                  {item.selesai ? (

                    <Check
                      size={
                        16
                      }
                    />

                  ) : (

                    <Clock
                      size={
                        15
                      }
                    />

                  )}

                </div>

              </div>

            )
          )}

        </div>

      </div>


      {/* =================================================
          INFO BELUM TERSEDIA
      ================================================= */}

      {!sertifikatTersedia && (

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">

          <ShieldCheck
            size={
              19
            }
            className="mt-0.5 shrink-0 text-blue-600"
          />


          <div>

            <p className="text-sm font-semibold text-blue-900">
              Sertifikat belum dapat diunduh
            </p>


            <p className="mt-1 text-xs leading-relaxed text-blue-700">

              Sertifikat akan tersedia setelah masa
              magang selesai, seluruh tugas selesai,
              laporan akhir disetujui, seluruh aspek
              penilaian pembimbing selesai, dan
              sertifikat telah diterbitkan.

            </p>

          </div>

        </div>

      )}


      {/* =================================================
          PERIODE MAGANG
      ================================================= */}

      {peserta && (

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">

          <p className="text-xs font-medium text-neutral-400">
            Periode Magang
          </p>


          <p className="mt-1 text-sm font-medium text-neutral-700">

            {formatTanggal(
              peserta.tanggalMulai
            )}

            {" — "}

            {formatTanggal(
              peserta.tanggalSelesai
            )}

          </p>


          <p className="mt-2 text-xs text-neutral-400">

            Status:{" "}

            <span className="font-medium text-neutral-600">
              {formatStatus(
                peserta.status
              )}
            </span>

          </p>

        </div>

      )}

    </div>
  );
}


// =====================================================
// THROW QUERY ERROR
// =====================================================

function throwQueryError(
  label:
    string,

  error:
    unknown
): never {
  const queryError =
    error as {
      message?:
      string;

      details?:
      string;

      hint?:
      string;

      code?:
      string;
    };


  const message =
    queryError.message ||
    "Terjadi kesalahan pada database.";


  console.error(
    `${label} ERROR:`,
    {
      message:
        queryError.message,

      details:
        queryError.details,

      hint:
        queryError.hint,

      code:
        queryError.code,
    }
  );


  throw new Error(
    `[${label}] ${message}${queryError.code
      ? ` (${queryError.code})`
      : ""
    }`
  );
}


// =====================================================
// NORMALIZE STATUS
// =====================================================

function normalizeStatus(
  value:
    string |
    null |
    undefined
) {
  return (
    value ??
    ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[\s-]+/g,
      "_"
    );
}


// =====================================================
// NORMALIZE TEXT
// =====================================================

function normalizeText(
  value:
    string |
    null |
    undefined
) {
  return (
    value ??
    ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /_/g,
      " "
    );
}


// =====================================================
// FORMAT STATUS
// =====================================================

function formatStatus(
  value:
    string |
    null |
    undefined
) {
  if (
    !value
  ) {
    return "-";
  }


  return value
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        char
      ) =>
        char.toUpperCase()
    );
}


// =====================================================
// FORMAT TANGGAL
// =====================================================

function formatTanggal(
  value:
    string |
    null |
    undefined
) {
  if (
    !value
  ) {
    return "-";
  }


  const raw =
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
      ? `${value}T00:00:00`
      : value;


  const date =
    new Date(
      raw
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }


  return date.toLocaleDateString(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric",
    }
  );
}