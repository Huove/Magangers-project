"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ElementType,
} from "react";

import Link from "next/link";

import {
  useParams,
} from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquareText,
  RotateCcw,
  School,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabase";


// =====================================================
// STATUS
// =====================================================

type StatusJurnal =
  | "Menunggu"
  | "Disetujui"
  | "Perlu Revisi";


// =====================================================
// DETAIL
// =====================================================

type JurnalDetail = {
  id: string;

  pesertaId: string;

  pesertaNama: string;

  nomorPeserta: string;

  sekolah: string;

  jurusan: string;

  divisi: string;

  posisi: string;

  tanggal: string;

  judul: string;

  kegiatan: string;

  hasil:
    | string
    | null;

  fileUrl:
    | string
    | null;

  status:
    StatusJurnal;

  rawStatus: string;

  catatanPembimbing:
    | string
    | null;

  disetujuiOleh:
    | string
    | null;

  disetujuiAt:
    | string
    | null;

  createdAt: string;
};


// =====================================================
// DATABASE TYPES
// =====================================================

type JurnalDatabaseRow = {
  id: string;

  peserta_id: string;

  tanggal: string;

  judul:
    | string
    | null;

  kegiatan: string;

  hasil:
    | string
    | null;

  file_url:
    | string
    | null;

  status:
    | string
    | null;

  catatan_pembimbing:
    | string
    | null;

  disetujui_oleh:
    | string
    | null;

  disetujui_at:
    | string
    | null;

  created_at: string;
};


// =====================================================
// PAGE
// =====================================================

export default function DetailJurnalPage() {
  const params =
    useParams<{
      id: string;
    }>();


  const jurnalId =
    params?.id;


  // ===================================================
  // STATE
  // ===================================================

  const [
    jurnal,
    setJurnal,
  ] =
    useState<
      JurnalDetail | null
    >(null);


  const [
    pembimbingId,
    setPembimbingId,
  ] =
    useState<
      string | null
    >(null);


  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    processing,
    setProcessing,
  ] =
    useState(
      false
    );


  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  const [
    catatan,
    setCatatan,
  ] =
    useState(
      ""
    );


  // ===================================================
  // FETCH DETAIL
  // ===================================================

  const fetchDetail =
    useCallback(
      async () => {
        if (
          !jurnalId
        ) {
          return;
        }


        try {
          setLoading(
            true
          );


          setError(
            ""
          );


          // =============================================
          // 1. USER LOGIN
          // =============================================

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
            throw userError;
          }


          if (!user) {
            throw new Error(
              "User belum login."
            );
          }


          // =============================================
          // 2. PEMBIMBING LOGIN
          // =============================================

          const {
            data:
              pembimbing,
            error:
              pembimbingError,
          } =
            await supabase
              .from(
                "pembimbing"
              )
              .select(`
                id
              `)
              .eq(
                "user_id",
                user.id
              )
              .maybeSingle();


          if (
            pembimbingError
          ) {
            throw pembimbingError;
          }


          if (
            !pembimbing
          ) {
            throw new Error(
              "Data pembimbing tidak ditemukan."
            );
          }


          setPembimbingId(
            pembimbing.id
          );


          // =============================================
          // 3. JURNAL BERDASARKAN ID URL
          // =============================================

          const {
            data:
              jurnalData,
            error:
              jurnalError,
          } =
            await supabase
              .from(
                "jurnal"
              )
              .select(`
                id,
                peserta_id,
                tanggal,
                judul,
                kegiatan,
                hasil,
                file_url,
                status,
                catatan_pembimbing,
                disetujui_oleh,
                disetujui_at,
                created_at
              `)
              .eq(
                "id",
                jurnalId
              )
              .maybeSingle();


          if (
            jurnalError
          ) {
            throw jurnalError;
          }


          if (
            !jurnalData
          ) {
            throw new Error(
              "Jurnal tidak ditemukan."
            );
          }


          const jurnalRow =
            jurnalData as
              JurnalDatabaseRow;


          // =============================================
          // 4. VERIFIKASI PESERTA BIMBINGAN
          //
          // Jurnal hanya boleh dibuka jika
          // peserta memang berada di bawah
          // pembimbing login.
          // =============================================

          const {
            data:
              penempatan,
            error:
              penempatanError,
          } =
            await supabase
              .from(
                "penempatan"
              )
              .select(`
                peserta_id,
                pembimbing_id,
                divisi,
                posisi
              `)
              .eq(
                "peserta_id",
                jurnalRow
                  .peserta_id
              )
              .eq(
                "pembimbing_id",
                pembimbing.id
              )
              .maybeSingle();


          if (
            penempatanError
          ) {
            throw penempatanError;
          }


          if (
            !penempatan
          ) {
            throw new Error(
              "Anda tidak memiliki akses ke jurnal peserta ini."
            );
          }


          // =============================================
          // 5. PESERTA
          // =============================================

          const {
            data:
              peserta,
            error:
              pesertaError,
          } =
            await supabase
              .from(
                "peserta"
              )
              .select(`
                id,
                user_id,
                nomor_peserta,
                nama_lengkap
              `)
              .eq(
                "id",
                jurnalRow
                  .peserta_id
              )
              .maybeSingle();


          if (
            pesertaError
          ) {
            throw pesertaError;
          }


          if (
            !peserta
          ) {
            throw new Error(
              "Data peserta tidak ditemukan."
            );
          }


          // =============================================
          // 6. PROFILE FALLBACK
          // =============================================

          let pesertaNama =
            peserta
              .nama_lengkap ??
            "";


          if (
            !pesertaNama &&
            peserta.user_id
          ) {
            const {
              data:
                profile,
              error:
                profileError,
            } =
              await supabase
                .from(
                  "profiles"
                )
                .select(`
                  nama_lengkap
                `)
                .eq(
                  "id",
                  peserta.user_id
                )
                .maybeSingle();


            if (
              profileError
            ) {
              console.error(
                "PROFILE ERROR:",
                profileError
              );
            }


            pesertaNama =
              profile
                ?.nama_lengkap ??
              "";
          }


          // =============================================
          // 7. PENDIDIKAN
          // =============================================

          let sekolah =
            "-";


          let jurusan =
            "-";


          const {
            data:
              pendidikan,
            error:
              pendidikanError,
          } =
            await supabase
              .from(
                "pendidikan"
              )
              .select(`
                sekolah,
                jurusan
              `)
              .eq(
                "peserta_id",
                peserta.id
              )
              .limit(
                1
              )
              .maybeSingle();


          if (
            pendidikanError
          ) {
            console.error(
              "PENDIDIKAN ERROR:",
              pendidikanError
            );
          }


          if (
            pendidikan
          ) {
            sekolah =
              pendidikan
                .sekolah ??
              "-";


            jurusan =
              pendidikan
                .jurusan ??
              "-";
          }


          // =============================================
          // 8. FORMAT
          // =============================================

          const detail:
            JurnalDetail =
            {
              id:
                jurnalRow.id,

              pesertaId:
                peserta.id,

              pesertaNama:
                pesertaNama ||
                "Peserta",

              nomorPeserta:
                peserta
                  .nomor_peserta ??
                "-",

              sekolah,

              jurusan,

              divisi:
                penempatan
                  .divisi ??
                "-",

              posisi:
                penempatan
                  .posisi ??
                "-",

              tanggal:
                jurnalRow
                  .tanggal,

              judul:
                jurnalRow
                  .judul ||
                "Jurnal Kegiatan",

              kegiatan:
                jurnalRow
                  .kegiatan,

              hasil:
                jurnalRow
                  .hasil,

              fileUrl:
                jurnalRow
                  .file_url,

              status:
                formatStatusJurnal(
                  jurnalRow.status
                ),

              rawStatus:
                jurnalRow.status ??
                "menunggu",

              catatanPembimbing:
                jurnalRow
                  .catatan_pembimbing,

              disetujuiOleh:
                jurnalRow
                  .disetujui_oleh,

              disetujuiAt:
                jurnalRow
                  .disetujui_at,

              createdAt:
                jurnalRow
                  .created_at,
            };


          setJurnal(
            detail
          );


          setCatatan(
            detail
              .catatanPembimbing ??
              ""
          );

        } catch (
          err
        ) {
          console.error(
            "DETAIL JURNAL ERROR:",
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil detail jurnal."
          );


          setJurnal(
            null
          );

        } finally {
          setLoading(
            false
          );
        }
      },
      [
        jurnalId,
      ]
    );


  // ===================================================
  // LOAD
  // ===================================================

  useEffect(() => {
    fetchDetail();
  }, [
    fetchDetail,
  ]);


  // ===================================================
  // UPDATE STATUS
  // ===================================================

  async function handleStatus(
    newStatus:
      "disetujui"
      | "revisi"
  ) {
    if (
      !jurnal ||
      !pembimbingId
    ) {
      return;
    }


    // ===============================================
    // Revisi sebaiknya punya catatan
    // ===============================================

    if (
      newStatus ===
        "revisi" &&
      !catatan.trim()
    ) {
      alert(
        "Masukkan catatan revisi terlebih dahulu."
      );

      return;
    }


    const actionText =
      newStatus ===
        "disetujui"
        ? "menyetujui"
        : "meminta revisi untuk";


    const confirmed =
      window.confirm(
        `Yakin ingin ${actionText} jurnal ${jurnal.pesertaNama}?`
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {
      setProcessing(
        true
      );


      setError(
        ""
      );


      // ===============================================
      // VERIFY USER
      // ===============================================

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
        throw userError;
      }


      if (!user) {
        throw new Error(
          "User belum login."
        );
      }


      // ===============================================
      // VERIFY PEMBIMBING
      // ===============================================

      const {
        data:
          pembimbing,
        error:
          pembimbingError,
      } =
        await supabase
          .from(
            "pembimbing"
          )
          .select(`
            id
          `)
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "id",
            pembimbingId
          )
          .maybeSingle();


      if (
        pembimbingError
      ) {
        throw pembimbingError;
      }


      if (
        !pembimbing
      ) {
        throw new Error(
          "Anda tidak memiliki akses untuk memeriksa jurnal ini."
        );
      }


      // ===============================================
      // VERIFY PENEMPATAN
      // ===============================================

      const {
        data:
          penempatan,
        error:
          penempatanError,
      } =
        await supabase
          .from(
            "penempatan"
          )
          .select(`
            peserta_id
          `)
          .eq(
            "peserta_id",
            jurnal.pesertaId
          )
          .eq(
            "pembimbing_id",
            pembimbingId
          )
          .maybeSingle();


      if (
        penempatanError
      ) {
        throw penempatanError;
      }


      if (
        !penempatan
      ) {
        throw new Error(
          "Peserta bukan bagian dari bimbingan Anda."
        );
      }


      // ===============================================
      // APPROVE
      // ===============================================

      if (
        newStatus ===
        "disetujui"
      ) {
        const {
          error:
            updateError,
        } =
          await supabase
            .from(
              "jurnal"
            )
            .update({
              status:
                "disetujui",

              catatan_pembimbing:
                catatan
                  .trim() ||
                null,

              disetujui_oleh:
                pembimbingId,

              disetujui_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              jurnal.id
            )
            .eq(
              "peserta_id",
              jurnal.pesertaId
            );


        if (
          updateError
        ) {
          throw updateError;
        }
      }


      // ===============================================
      // REVISION
      // ===============================================

      if (
        newStatus ===
        "revisi"
      ) {
        const {
          error:
            updateError,
        } =
          await supabase
            .from(
              "jurnal"
            )
            .update({
              status:
                "revisi",

              catatan_pembimbing:
                catatan.trim(),

              disetujui_oleh:
                null,

              disetujui_at:
                null,
            })
            .eq(
              "id",
              jurnal.id
            )
            .eq(
              "peserta_id",
              jurnal.pesertaId
            );


        if (
          updateError
        ) {
          throw updateError;
        }
      }


      // ===============================================
      // REFRESH
      // ===============================================

      await fetchDetail();


      alert(
        newStatus ===
          "disetujui"
          ? "Jurnal berhasil disetujui."
          : "Jurnal berhasil dikembalikan untuk revisi."
      );

    } catch (
      err
    ) {
      console.error(
        "UPDATE JURNAL ERROR:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal memperbarui jurnal.";


      setError(
        message
      );


      alert(
        message
      );

    } finally {
      setProcessing(
        false
      );
    }
  }


  // ===================================================
  // LOADING
  // ===================================================

  if (
    loading
  ) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">

        <div className="text-center">

          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />


          <p className="mt-3 text-sm text-slate-500">
            Memuat detail jurnal...
          </p>

        </div>

      </div>
    );
  }


  // ===================================================
  // ERROR / NOT FOUND
  // ===================================================

  if (
    !jurnal
  ) {
    return (
      <div>

        <Link
          href="/dashboard-pembina/jurnal"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />

          Kembali
        </Link>


        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-10 text-center">

          <AlertCircle className="mx-auto h-9 w-9 text-red-500" />


          <h2 className="mt-3 font-bold text-red-700">
            Jurnal tidak dapat ditampilkan
          </h2>


          <p className="mt-2 text-sm text-red-600">
            {error ||
              "Jurnal tidak ditemukan."}
          </p>

        </div>

      </div>
    );
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          BACK
      ================================================= */}

      <Link
        href="/dashboard-pembina/jurnal"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />

        Kembali ke Pemeriksaan Jurnal
      </Link>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>

          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Detail Jurnal
          </p>


          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
            {jurnal.judul}
          </h1>


          <p className="mt-1 text-sm text-slate-500">
            Dibuat{" "}
            {formatDateTime(
              jurnal.createdAt
            )}
          </p>

        </div>


        <StatusBadge
          status={
            jurnal.status
          }
        />

      </div>


      {/* =================================================
          PARTICIPANT
      ================================================= */}

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

        <div className="flex items-center gap-4">

          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-base font-bold text-blue-600">
            {getInisial(
              jurnal.pesertaNama
            )}
          </div>


          <div>

            <p className="text-lg font-bold text-slate-900">
              {jurnal.pesertaNama}
            </p>


            <p className="mt-0.5 text-sm text-slate-400">
              {jurnal.nomorPeserta}
            </p>

          </div>

        </div>


        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">

          <InfoItem
            icon={
              School
            }
            label="Sekolah / Kampus"
            value={
              jurnal.sekolah
            }
          />


          <InfoItem
            icon={
              GraduationCap
            }
            label="Jurusan"
            value={
              jurnal.jurusan
            }
          />


          <InfoItem
            icon={
              BriefcaseBusiness
            }
            label="Divisi"
            value={
              jurnal.divisi
            }
          />


          <InfoItem
            icon={
              BriefcaseBusiness
            }
            label="Posisi"
            value={
              jurnal.posisi
            }
          />

        </div>

      </section>


      {/* =================================================
          JOURNAL DETAIL
      ================================================= */}

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

        <div className="flex items-start gap-3">

          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">

            <BookOpen className="h-5 w-5" />

          </div>


          <div>

            <h2 className="text-lg font-bold text-slate-900">
              Informasi Jurnal
            </h2>


            <p className="mt-1 text-sm text-slate-500">
              Informasi kegiatan yang ditulis oleh peserta.
            </p>

          </div>

        </div>


        {/* DATE */}

        <div className="mt-6 rounded-xl bg-slate-50 p-4">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Tanggal Jurnal
          </p>


          <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">

            <CalendarDays className="h-4 w-4 text-blue-500" />

            {formatTanggal(
              jurnal.tanggal
            )}

          </div>

        </div>


        {/* TITLE */}

        <div className="mt-5">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Judul
          </p>


          <p className="mt-2 text-base font-bold text-slate-900">
            {jurnal.judul}
          </p>

        </div>


        {/* KEGIATAN */}

        <div className="mt-5">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Kegiatan
          </p>


          <div className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
            {jurnal.kegiatan}
          </div>

        </div>


        {/* HASIL */}

        <div className="mt-5">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Hasil
          </p>


          {jurnal.hasil ? (

            <div className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
              {jurnal.hasil}
            </div>

          ) : (

            <div className="mt-2 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">
              Peserta belum menambahkan hasil kegiatan.
            </div>

          )}

        </div>


        {/* FILE */}

        <div className="mt-5">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Lampiran
          </p>


          {jurnal.fileUrl ? (

            <a
              href={
                jurnal.fileUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
            >

              <FileText className="h-4 w-4" />

              Lihat Lampiran Jurnal

              <ExternalLink className="h-3.5 w-3.5" />

            </a>

          ) : (

            <div className="mt-2 rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">
              Tidak ada lampiran jurnal.
            </div>

          )}

        </div>

      </section>


      {/* =================================================
          REVIEW
      ================================================= */}

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

        <div className="flex items-start gap-3">

          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-600">

            <MessageSquareText className="h-5 w-5" />

          </div>


          <div>

            <h2 className="text-lg font-bold text-slate-900">
              Catatan Pembimbing
            </h2>


            <p className="mt-1 text-sm text-slate-500">
              Berikan catatan atau masukan terhadap jurnal peserta.
            </p>

          </div>

        </div>


        {/* ===============================================
            JIKA MASIH BISA DIPERIKSA
        =============================================== */}

        {jurnal.status !==
        "Disetujui" ? (

          <textarea
            value={
              catatan
            }
            onChange={(
              event
            ) =>
              setCatatan(
                event.target.value
              )
            }
            rows={5}
            placeholder="Tuliskan catatan pembimbing..."
            className="mt-5 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

        ) : (

          <div className="mt-5 rounded-xl bg-slate-50 p-4">

            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {jurnal.catatanPembimbing ||
                "Tidak ada catatan pembimbing."}
            </p>

          </div>

        )}


        {/* ===============================================
            APPROVED INFO
        =============================================== */}

        {jurnal.disetujuiAt && (

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">

            <Clock3 className="h-3.5 w-3.5" />

            Disetujui pada{" "}

            <span className="font-semibold text-slate-600">
              {formatDateTime(
                jurnal.disetujuiAt
              )}
            </span>

          </div>

        )}

      </section>


      {/* =================================================
          ACTION
      ================================================= */}

      {jurnal.status !==
      "Disetujui" ? (

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:justify-end">

          {/* REVISION */}

          <button
            type="button"
            disabled={
              processing
            }
            onClick={() =>
              handleStatus(
                "revisi"
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {processing ? (

              <Loader2 className="h-4 w-4 animate-spin" />

            ) : (

              <RotateCcw className="h-4 w-4" />

            )}

            Minta Revisi

          </button>


          {/* APPROVE */}

          <button
            type="button"
            disabled={
              processing
            }
            onClick={() =>
              handleStatus(
                "disetujui"
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {processing ? (

              <Loader2 className="h-4 w-4 animate-spin" />

            ) : (

              <Check className="h-4 w-4" />

            )}

            Setujui Jurnal

          </button>

        </section>

      ) : (

        /* =================================================
            APPROVED STATE
        ================================================= */

        <section className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />


          <div>

            <p className="font-semibold text-emerald-700">
              Jurnal Telah Disetujui
            </p>


            <p className="mt-1 text-sm text-emerald-600">
              Jurnal peserta ini telah selesai diperiksa.
            </p>

          </div>

        </section>

      )}

    </div>
  );
}


// =====================================================
// INFO ITEM
// =====================================================

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon:
    ElementType;

  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-500">

        <Icon className="h-4 w-4" />

      </div>


      <div className="min-w-0">

        <p className="text-xs text-slate-400">
          {label}
        </p>


        <p className="mt-1 break-words text-sm font-semibold text-slate-700">
          {value}
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
  status:
    StatusJurnal;
}) {
  if (
    status ===
    "Disetujui"
  ) {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">

        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

        Disetujui

      </span>
    );
  }


  if (
    status ===
    "Perlu Revisi"
  ) {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">

        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

        Perlu Revisi

      </span>
    );
  }


  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">

      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

      Menunggu

    </span>
  );
}


// =====================================================
// DATABASE STATUS → UI
// =====================================================

function formatStatusJurnal(
  value:
    string | null
): StatusJurnal {
  const status =
    normalizeStatus(
      value
    );


  if (
    status ===
      "disetujui" ||
    status ===
      "approved" ||
    status ===
      "selesai"
  ) {
    return "Disetujui";
  }


  if (
    status ===
      "revisi" ||
    status ===
      "direvisi" ||
    status ===
      "perlu_revisi" ||
    status ===
      "perlu_perbaikan"
  ) {
    return "Perlu Revisi";
  }


  return "Menunggu";
}


// =====================================================
// NORMALIZE
// =====================================================

function normalizeStatus(
  value:
    string | null
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
// FORMAT DATE
// =====================================================

function formatTanggal(
  value:
    string
) {
  if (!value) {
    return "-";
  }


  const date =
    new Date(
      `${value}T00:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }


  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric",
    }
  ).format(
    date
  );
}


// =====================================================
// DATE TIME
// =====================================================

function formatDateTime(
  value:
    string
) {
  if (!value) {
    return "-";
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }


  return new Intl.DateTimeFormat(
    "id-ID",
    {
      timeZone:
        "Asia/Jakarta",

      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  ).format(
    date
  );
}


// =====================================================
// INITIAL
// =====================================================

function getInisial(
  nama:
    string
) {
  const parts =
    nama
      .trim()
      .split(
        /\s+/
      )
      .filter(
        Boolean
      );


  if (
    parts.length ===
    0
  ) {
    return "-";
  }


  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .slice(
        0,
        2
      )
      .toUpperCase();
  }


  return (
    parts[0][0] +
    parts[
      parts.length -
        1
    ][0]
  ).toUpperCase();
}