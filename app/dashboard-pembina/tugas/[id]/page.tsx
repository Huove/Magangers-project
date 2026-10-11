"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ElementType,
} from "react";

import Link from "next/link";

import { useParams } from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  RotateCcw,
  School,
  Send,
  UserRound,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";


// =====================================================
// STATUS
// =====================================================

type StatusTugas =
  | "Belum Dikerjakan"
  | "Sedang Dikerjakan"
  | "Menunggu Pemeriksaan"
  | "Perlu Perbaikan"
  | "Selesai";


// =====================================================
// TASK DETAIL
// =====================================================

type TaskDetail = {
  id: string;

  judul: string;

  deskripsi: string;

  deadline: string | null;

  createdAt: string;

  pembimbingId: string;

  peserta: TaskParticipant[];
};


// =====================================================
// PARTICIPANT
// =====================================================

type TaskParticipant = {
  assignmentId: string;

  pesertaId: string;

  nama: string;

  nomorPeserta: string;

  statusPeserta: string;

  sekolah: string;

  jurusan: string;

  divisi: string;

  posisi: string;

  status: StatusTugas;

  rawStatus: string;

  jawaban: string | null;

  fileUrl: string | null;

  dikumpulkanAt: string | null;

  assignedAt: string;
};


// =====================================================
// DATABASE TYPES
// =====================================================

type TugasRow = {
  id: string;

  judul: string;

  deskripsi: string | null;

  pembimbing_id: string | null;

  deadline: string | null;

  created_at: string;
};


type TugasPesertaRow = {
  id: string;

  tugas_id: string;

  peserta_id: string;

  status: string | null;

  file_url: string | null;

  jawaban: string | null;

  dikumpulkan_at: string | null;

  created_at: string;
};


type PesertaRow = {
  id: string;

  user_id: string | null;

  nama_lengkap: string | null;

  nomor_peserta: string | null;

  status: string | null;
};


type PendidikanRow = {
  peserta_id: string;

  sekolah: string | null;

  jurusan: string | null;
};


type PenempatanRow = {
  peserta_id: string;

  divisi: string | null;

  posisi: string | null;
};


// =====================================================
// PAGE
// =====================================================

export default function DetailTugasPage() {
  const params =
    useParams<{
      id: string;
    }>();


  const tugasId =
    params?.id;


  // ===================================================
  // STATE
  // ===================================================

  const [
    tugas,
    setTugas,
  ] =
    useState<TaskDetail | null>(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  const [
    processingId,
    setProcessingId,
  ] =
    useState<string | null>(
      null
    );


  // ===================================================
  // FETCH DETAIL
  // ===================================================

  const fetchDetail =
    useCallback(
      async () => {
        if (!tugasId) {
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
          // 2. DATA PEMBIMBING LOGIN
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


          // =============================================
          // 3. AMBIL TUGAS BERDASARKAN ID URL
          //
          // SEKALIGUS VERIFIKASI:
          // tugas harus dibuat pembimbing login
          // =============================================

          const {
            data:
              tugasData,
            error:
              tugasError,
          } =
            await supabase
              .from(
                "tugas"
              )
              .select(`
                id,
                judul,
                deskripsi,
                pembimbing_id,
                deadline,
                created_at
              `)
              .eq(
                "id",
                tugasId
              )
              .eq(
                "pembimbing_id",
                pembimbing.id
              )
              .maybeSingle();


          if (
            tugasError
          ) {
            throw tugasError;
          }


          if (
            !tugasData
          ) {
            throw new Error(
              "Tugas tidak ditemukan atau Anda tidak memiliki akses ke tugas ini."
            );
          }


          const taskRow =
            tugasData as TugasRow;


          // =============================================
          // 4. AMBIL ASSIGNMENT PESERTA
          // =============================================

          const {
            data:
              assignmentData,
            error:
              assignmentError,
          } =
            await supabase
              .from(
                "tugas_peserta"
              )
              .select(`
                id,
                tugas_id,
                peserta_id,
                status,
                file_url,
                jawaban,
                dikumpulkan_at,
                created_at
              `)
              .eq(
                "tugas_id",
                tugasId
              )
              .order(
                "created_at",
                {
                  ascending: true,
                }
              );


          if (
            assignmentError
          ) {
            throw assignmentError;
          }


          const assignments =
            (
              assignmentData ??
              []
            ) as TugasPesertaRow[];


          // =============================================
          // BELUM ADA PESERTA
          // =============================================

          if (
            assignments.length ===
            0
          ) {
            setTugas({
              id:
                taskRow.id,

              judul:
                taskRow.judul,

              deskripsi:
                taskRow.deskripsi ??
                "-",

              deadline:
                taskRow.deadline,

              createdAt:
                taskRow.created_at,

              pembimbingId:
                pembimbing.id,

              peserta:
                [],
            });


            return;
          }


          // =============================================
          // 5. PARTICIPANT IDS
          // =============================================

          const pesertaIds = [
            ...new Set(
              assignments.map(
                (
                  item
                ) =>
                  item.peserta_id
              )
            ),
          ];


          // =============================================
          // 6. DATA PESERTA
          // =============================================

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
                user_id,
                nama_lengkap,
                nomor_peserta,
                status
              `)
              .in(
                "id",
                pesertaIds
              );


          if (
            pesertaError
          ) {
            throw pesertaError;
          }


          const pesertaRows =
            (
              pesertaData ??
              []
            ) as PesertaRow[];


          // =============================================
          // 7. PROFILE FALLBACK
          //
          // Kalau nama_lengkap pada peserta kosong.
          // =============================================

          const userIds =
            pesertaRows
              .map(
                (
                  item
                ) =>
                  item.user_id
              )
              .filter(
                (
                  id
                ): id is string =>
                  Boolean(id)
              );


          const profileMap =
            new Map<
              string,
              string
            >();


          if (
            userIds.length >
            0
          ) {
            const {
              data:
                profileData,
              error:
                profileError,
            } =
              await supabase
                .from(
                  "profiles"
                )
                .select(`
                  id,
                  nama_lengkap
                `)
                .in(
                  "id",
                  userIds
                );


            // Profile fallback tidak kita jadikan
            // error fatal.
            if (
              profileError
            ) {
              console.error(
                "PROFILE ERROR:",
                profileError
              );
            } else {
              for (
                const profile
                of profileData ??
                []
              ) {
                profileMap.set(
                  profile.id,
                  profile
                    .nama_lengkap ??
                    "Peserta"
                );
              }
            }
          }


          // =============================================
          // 8. PENDIDIKAN
          // =============================================

          let pendidikanRows:
            PendidikanRow[] =
            [];


          const {
            data:
              pendidikanData,
            error:
              pendidikanError,
          } =
            await supabase
              .from(
                "pendidikan"
              )
              .select(`
                peserta_id,
                sekolah,
                jurusan
              `)
              .in(
                "peserta_id",
                pesertaIds
              );


          if (
            pendidikanError
          ) {
            console.error(
              "PENDIDIKAN ERROR:",
              pendidikanError
            );
          } else {
            pendidikanRows =
              (
                pendidikanData ??
                []
              ) as PendidikanRow[];
          }


          // =============================================
          // 9. PENEMPATAN
          // =============================================

          let penempatanRows:
            PenempatanRow[] =
            [];


          const {
            data:
              penempatanData,
            error:
              penempatanError,
          } =
            await supabase
              .from(
                "penempatan"
              )
              .select(`
                peserta_id,
                divisi,
                posisi
              `)
              .in(
                "peserta_id",
                pesertaIds
              );


          if (
            penempatanError
          ) {
            console.error(
              "PENEMPATAN ERROR:",
              penempatanError
            );
          } else {
            penempatanRows =
              (
                penempatanData ??
                []
              ) as PenempatanRow[];
          }


          // =============================================
          // 10. MAP
          // =============================================

          const pesertaMap =
            new Map<
              string,
              PesertaRow
            >();


          for (
            const peserta
            of pesertaRows
          ) {
            pesertaMap.set(
              peserta.id,
              peserta
            );
          }


          const pendidikanMap =
            new Map<
              string,
              PendidikanRow
            >();


          for (
            const pendidikan
            of pendidikanRows
          ) {
            pendidikanMap.set(
              pendidikan.peserta_id,
              pendidikan
            );
          }


          const penempatanMap =
            new Map<
              string,
              PenempatanRow
            >();


          for (
            const penempatan
            of penempatanRows
          ) {
            penempatanMap.set(
              penempatan.peserta_id,
              penempatan
            );
          }


          // =============================================
          // 11. FORMAT ASSIGNMENTS
          // =============================================

          const participantDetails:
            TaskParticipant[] =
            assignments.map(
              (
                assignment
              ) => {
                const peserta =
                  pesertaMap.get(
                    assignment.peserta_id
                  );


                const pendidikan =
                  pendidikanMap.get(
                    assignment.peserta_id
                  );


                const penempatan =
                  penempatanMap.get(
                    assignment.peserta_id
                  );


                let nama =
                  peserta
                    ?.nama_lengkap ??
                  "";


                if (
                  !nama &&
                  peserta?.user_id
                ) {
                  nama =
                    profileMap.get(
                      peserta.user_id
                    ) ??
                    "";
                }


                return {
                  assignmentId:
                    assignment.id,

                  pesertaId:
                    assignment
                      .peserta_id,

                  nama:
                    nama ||
                    "Peserta",

                  nomorPeserta:
                    peserta
                      ?.nomor_peserta ??
                    "-",

                  statusPeserta:
                    peserta
                      ?.status ??
                    "-",

                  sekolah:
                    pendidikan
                      ?.sekolah ??
                    "-",

                  jurusan:
                    pendidikan
                      ?.jurusan ??
                    "-",

                  divisi:
                    penempatan
                      ?.divisi ??
                    "-",

                  posisi:
                    penempatan
                      ?.posisi ??
                    "-",

                  status:
                    formatStatusTugas(
                      assignment.status
                    ),

                  rawStatus:
                    assignment.status ??
                    "belum_dikerjakan",

                  jawaban:
                    assignment.jawaban,

                  fileUrl:
                    assignment.file_url,

                  dikumpulkanAt:
                    assignment
                      .dikumpulkan_at,

                  assignedAt:
                    assignment.created_at,
                };
              }
            );


          // =============================================
          // 12. SET DATA
          // =============================================

          setTugas({
            id:
              taskRow.id,

            judul:
              taskRow.judul,

            deskripsi:
              taskRow.deskripsi ??
              "-",

            deadline:
              taskRow.deadline,

            createdAt:
              taskRow.created_at,

            pembimbingId:
              pembimbing.id,

            peserta:
              participantDetails,
          });

        } catch (
          err
        ) {
          console.error(
            "DETAIL TUGAS ERROR:",
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil detail tugas."
          );


          setTugas(
            null
          );

        } finally {
          setLoading(
            false
          );
        }
      },
      [
        tugasId,
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
  // STAT
  // ===================================================

  const stats =
    useMemo(() => {
      if (!tugas) {
        return {
          total: 0,
          menunggu: 0,
          revisi: 0,
          selesai: 0,
        };
      }


      const total =
        tugas.peserta.length;


      const menunggu =
        tugas.peserta.filter(
          (
            item
          ) =>
            item.status ===
            "Menunggu Pemeriksaan"
        ).length;


      const revisi =
        tugas.peserta.filter(
          (
            item
          ) =>
            item.status ===
            "Perlu Perbaikan"
        ).length;


      const selesai =
        tugas.peserta.filter(
          (
            item
          ) =>
            item.status ===
            "Selesai"
        ).length;


      return {
        total,
        menunggu,
        revisi,
        selesai,
      };

    }, [
      tugas,
    ]);


  // ===================================================
  // UPDATE STATUS
  // ===================================================

  async function handleUpdateStatus(
    participant:
      TaskParticipant,

    newStatus:
      "selesai"
      | "perlu_revisi"
  ) {
    if (!tugas) {
      return;
    }


    const actionText =
      newStatus ===
        "selesai"
        ? "menyetujui"
        : "meminta perbaikan untuk";


    const confirmed =
      window.confirm(
        `Yakin ingin ${actionText} tugas ${participant.nama}?`
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {
      setProcessingId(
        participant.assignmentId
      );


      setError(
        ""
      );


      // =============================================
      // VERIFIKASI USER
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
      // VERIFIKASI PEMBIMBING
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
        !pembimbing ||
        pembimbing.id !==
          tugas.pembimbingId
      ) {
        throw new Error(
          "Anda tidak memiliki akses untuk memeriksa tugas ini."
        );
      }


      // =============================================
      // UPDATE TUGAS PESERTA
      // =============================================

      const {
        error:
          updateError,
      } =
        await supabase
          .from(
            "tugas_peserta"
          )
          .update({
            status:
              newStatus,
          })
          .eq(
            "id",
            participant.assignmentId
          )
          .eq(
            "tugas_id",
            tugas.id
          );


      if (
        updateError
      ) {
        throw updateError;
      }


      // =============================================
      // REFRESH
      // =============================================

      await fetchDetail();


      alert(
        newStatus ===
          "selesai"
          ? "Tugas berhasil disetujui."
          : "Tugas dikembalikan untuk diperbaiki."
      );

    } catch (
      err
    ) {
      console.error(
        "UPDATE STATUS TUGAS ERROR:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal memperbarui status tugas.";


      setError(
        message
      );


      alert(
        message
      );

    } finally {
      setProcessingId(
        null
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
            Memuat detail tugas...
          </p>

        </div>

      </div>
    );
  }


  // ===================================================
  // ERROR
  // ===================================================

  if (
    error &&
    !tugas
  ) {
    return (
      <div>

        <Link
          href="/dashboard-pembina/tugas"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />

          Kembali
        </Link>


        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

          <AlertCircle className="mx-auto h-9 w-9 text-red-500" />


          <h2 className="mt-3 font-bold text-red-700">
            Detail tugas tidak dapat ditampilkan
          </h2>


          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

        </div>

      </div>
    );
  }


  if (
    !tugas
  ) {
    return null;
  }


  // ===================================================
  // OVERDUE
  // ===================================================

  const overdue =
    isOverdue(
      tugas.deadline
    );


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          BACK
      ================================================= */}

      <Link
        href="/dashboard-pembina/tugas"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />

        Kembali ke Kelola Tugas
      </Link>


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>

          <p className="text-sm font-semibold text-blue-600">
            DETAIL TUGAS
          </p>


          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
            {tugas.judul}
          </h1>


          <p className="mt-1 text-sm text-slate-500">
            Dibuat{" "}
            {formatDateTime(
              tugas.createdAt
            )}
          </p>

        </div>


        <div
          className={`inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
            overdue
              ? "bg-red-50 text-red-600"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          <CalendarDays className="h-4 w-4" />

          {tugas.deadline
            ? formatDateTime(
                tugas.deadline
              )
            : "Tidak ada deadline"}
        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}


      {/* =================================================
          TASK INFO
      ================================================= */}

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

        <div className="flex items-start gap-4">

          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600">
            <FileText className="h-5 w-5" />
          </div>


          <div className="min-w-0">

            <h2 className="text-lg font-bold text-slate-900">
              {tugas.judul}
            </h2>


            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {tugas.deskripsi}
            </p>

          </div>

        </div>


        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">

          <InfoItem
            icon={
              CalendarDays
            }
            label="Tanggal Diberikan"
            value={
              formatDateTime(
                tugas.createdAt
              )
            }
          />


          <InfoItem
            icon={
              Clock3
            }
            label="Batas Waktu"
            value={
              tugas.deadline
                ? formatDateTime(
                    tugas.deadline
                  )
                : "-"
            }
          />

        </div>

      </section>


      {/* =================================================
          STAT
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          icon={
            Users
          }
          label="Peserta"
          value={
            stats.total
          }
          className="bg-blue-50 text-blue-600"
        />


        <StatCard
          icon={
            Clock3
          }
          label="Menunggu Pemeriksaan"
          value={
            stats.menunggu
          }
          className="bg-amber-50 text-amber-600"
        />


        <StatCard
          icon={
            RotateCcw
          }
          label="Perlu Perbaikan"
          value={
            stats.revisi
          }
          className="bg-red-50 text-red-600"
        />


        <StatCard
          icon={
            CheckCircle2
          }
          label="Selesai"
          value={
            stats.selesai
          }
          className="bg-emerald-50 text-emerald-600"
        />

      </div>


      {/* =================================================
          PARTICIPANT SUBMISSIONS
      ================================================= */}

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

        <div>

          <h2 className="text-lg font-bold text-slate-900">
            Hasil Tugas Peserta
          </h2>


          <p className="mt-1 text-sm text-slate-500">
            Periksa hasil pekerjaan peserta yang menerima tugas ini.
          </p>

        </div>


        {/* EMPTY */}

        {tugas.peserta.length ===
        0 ? (

          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-10 text-center">

            <Users className="mx-auto h-8 w-8 text-slate-300" />


            <p className="mt-3 text-sm text-slate-400">
              Tugas ini belum diberikan kepada peserta.
            </p>

          </div>

        ) : (

          <div className="mt-6 space-y-5">

            {tugas.peserta.map(
              (
                participant
              ) => {

                const canReview =
                  canReviewTask(
                    participant
                  );


                return (
                  <article
                    key={
                      participant.assignmentId
                    }
                    className="overflow-hidden rounded-2xl border border-slate-100"
                  >

                    {/* =================================
                        PARTICIPANT HEADER
                    ================================= */}

                    <div className="flex flex-col gap-4 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">

                      <div className="flex items-center gap-3">

                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                          {getInisial(
                            participant.nama
                          )}
                        </div>


                        <div>

                          <p className="font-semibold text-slate-900">
                            {participant.nama}
                          </p>


                          <p className="mt-0.5 text-xs text-slate-400">
                            {participant.nomorPeserta}
                          </p>

                        </div>

                      </div>


                      <StatusBadge
                        status={
                          participant.status
                        }
                      />

                    </div>


                    {/* =================================
                        PARTICIPANT INFO
                    ================================= */}

                    <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-2 xl:grid-cols-4">

                      <InfoItem
                        icon={
                          School
                        }
                        label="Sekolah / Kampus"
                        value={
                          participant.sekolah
                        }
                      />


                      <InfoItem
                        icon={
                          School
                        }
                        label="Jurusan"
                        value={
                          participant.jurusan
                        }
                      />


                      <InfoItem
                        icon={
                          BriefcaseBusiness
                        }
                        label="Divisi"
                        value={
                          participant.divisi
                        }
                      />


                      <InfoItem
                        icon={
                          BriefcaseBusiness
                        }
                        label="Posisi"
                        value={
                          participant.posisi
                        }
                      />

                    </div>


                    {/* =================================
                        SUBMISSION
                    ================================= */}

                    <div className="p-5">

                      <div className="grid gap-5 lg:grid-cols-2">

                        {/* JAWABAN */}

                        <div>

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Jawaban / Hasil Pekerjaan
                          </p>


                          {participant.jawaban ? (

                            <div className="mt-2 min-h-24 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                              {participant.jawaban}
                            </div>

                          ) : (

                            <div className="mt-2 flex min-h-24 items-center rounded-xl border border-dashed border-slate-200 px-4 text-sm text-slate-400">
                              Peserta belum menulis hasil pekerjaan.
                            </div>

                          )}

                        </div>


                        {/* FILE */}

                        <div>

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Lampiran
                          </p>


                          {participant.fileUrl ? (

                            <a
                              href={
                                participant.fileUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 flex min-h-24 items-center justify-between rounded-xl border border-blue-100 bg-blue-50 p-4 transition hover:bg-blue-100"
                            >

                              <div className="flex items-center gap-3">

                                <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-blue-600">
                                  <FileText className="h-4 w-4" />
                                </div>


                                <div>

                                  <p className="text-sm font-semibold text-blue-700">
                                    Lihat Lampiran
                                  </p>


                                  <p className="mt-0.5 text-xs text-blue-500">
                                    Buka file hasil peserta
                                  </p>

                                </div>

                              </div>


                              <ExternalLink className="h-4 w-4 text-blue-500" />

                            </a>

                          ) : (

                            <div className="mt-2 flex min-h-24 items-center rounded-xl border border-dashed border-slate-200 px-4 text-sm text-slate-400">
                              Peserta belum mengunggah lampiran.
                            </div>

                          )}

                        </div>

                      </div>


                      {/* =================================
                          SUBMITTED AT
                      ================================= */}

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">

                        <div className="flex items-center gap-2 text-sm text-slate-500">

                          <Send className="h-4 w-4 text-slate-400" />


                          {participant.dikumpulkanAt ? (
                            <span>
                              Dikumpulkan{" "}
                              <strong className="font-semibold text-slate-700">
                                {formatDateTime(
                                  participant.dikumpulkanAt
                                )}
                              </strong>
                            </span>
                          ) : (
                            <span>
                              Belum dikumpulkan
                            </span>
                          )}

                        </div>


                        {/* =================================
                            REVIEW ACTION
                        ================================= */}

                        {canReview &&
                          participant.status !==
                            "Selesai" && (

                          <div className="flex flex-wrap gap-2">

                            {/* REVISI */}

                            <button
                              type="button"
                              disabled={
                                processingId ===
                                participant.assignmentId
                              }
                              onClick={() =>
                                handleUpdateStatus(
                                  participant,
                                  "perlu_revisi"
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              {processingId ===
                              participant.assignmentId ? (

                                <Loader2 className="h-4 w-4 animate-spin" />

                              ) : (

                                <RotateCcw className="h-4 w-4" />

                              )}

                              Minta Perbaikan

                            </button>


                            {/* APPROVE */}

                            <button
                              type="button"
                              disabled={
                                processingId ===
                                participant.assignmentId
                              }
                              onClick={() =>
                                handleUpdateStatus(
                                  participant,
                                  "selesai"
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              {processingId ===
                              participant.assignmentId ? (

                                <Loader2 className="h-4 w-4 animate-spin" />

                              ) : (

                                <Check className="h-4 w-4" />

                              )}

                              Setujui Tugas

                            </button>

                          </div>

                        )}


                        {/* =================================
                            COMPLETED
                        ================================= */}

                        {participant.status ===
                          "Selesai" && (

                          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-600">

                            <CheckCircle2 className="h-4 w-4" />

                            Tugas telah disetujui

                          </div>

                        )}

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>

        )}

      </section>

    </div>
  );
}


// =====================================================
// CAN REVIEW
// =====================================================

function canReviewTask(
  participant:
    TaskParticipant
) {
  const normalized =
    normalizeStatus(
      participant.rawStatus
    );


  const submittedStatuses = [
    "sudah_dikirim",
    "dikumpulkan",
    "menunggu",
    "menunggu_konfirmasi",
    "menunggu_pemeriksaan",
    "submitted",
    "perlu_revisi",
    "perlu_perbaikan",
    "revisi",
  ];


  return (
    submittedStatuses.includes(
      normalized
    ) ||
    Boolean(
      participant.dikumpulkanAt
    ) ||
    Boolean(
      participant.jawaban
    ) ||
    Boolean(
      participant.fileUrl
    )
  );
}


// =====================================================
// NORMALIZE STATUS
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
// DATABASE STATUS → UI
// =====================================================

function formatStatusTugas(
  value:
    string | null
): StatusTugas {
  const status =
    normalizeStatus(
      value
    );


  if (
    status ===
      "selesai" ||
    status ===
      "disetujui" ||
    status ===
      "approved"
  ) {
    return "Selesai";
  }


  if (
    status ===
      "perlu_revisi" ||
    status ===
      "perlu_perbaikan" ||
    status ===
      "revisi" ||
    status ===
      "direvisi"
  ) {
    return "Perlu Perbaikan";
  }


  if (
    status ===
      "sudah_dikirim" ||
    status ===
      "dikumpulkan" ||
    status ===
      "menunggu" ||
    status ===
      "menunggu_konfirmasi" ||
    status ===
      "menunggu_pemeriksaan" ||
    status ===
      "submitted"
  ) {
    return "Menunggu Pemeriksaan";
  }


  if (
    status ===
      "sedang_dikerjakan" ||
    status ===
      "dikerjakan"
  ) {
    return "Sedang Dikerjakan";
  }


  return "Belum Dikerjakan";
}


// =====================================================
// STATUS BADGE
// =====================================================

function StatusBadge({
  status,
}: {
  status:
    StatusTugas;
}) {
  const config:
    Record<
      StatusTugas,
      string
    > = {
    "Belum Dikerjakan":
      "bg-slate-100 text-slate-600",

    "Sedang Dikerjakan":
      "bg-blue-100 text-blue-700",

    "Menunggu Pemeriksaan":
      "bg-amber-100 text-amber-700",

    "Perlu Perbaikan":
      "bg-red-100 text-red-700",

    Selesai:
      "bg-emerald-100 text-emerald-700",
  };


  const dots:
    Record<
      StatusTugas,
      string
    > = {
    "Belum Dikerjakan":
      "bg-slate-400",

    "Sedang Dikerjakan":
      "bg-blue-500",

    "Menunggu Pemeriksaan":
      "bg-amber-500",

    "Perlu Perbaikan":
      "bg-red-500",

    Selesai:
      "bg-emerald-500",
  };


  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${config[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dots[status]}`}
      />

      {status}
    </span>
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
// STAT CARD
// =====================================================

function StatCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon:
    ElementType;

  label:
    string;

  value:
    number;

  className:
    string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

      <div className="flex items-center gap-3">

        <div
          className={`grid h-10 w-10 place-items-center rounded-xl ${className}`}
        >
          <Icon className="h-4 w-4" />
        </div>


        <div>

          <p className="text-xs text-slate-400">
            {label}
          </p>


          <p className="mt-0.5 text-xl font-bold text-slate-900">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}


// =====================================================
// FORMAT DATE TIME
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
// OVERDUE
// =====================================================

function isOverdue(
  deadline:
    string | null
) {
  if (
    !deadline
  ) {
    return false;
  }


  const date =
    new Date(
      deadline
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return false;
  }


  return (
    date.getTime() <
    Date.now()
  );
}


// =====================================================
// INITIAL
// =====================================================

function getInisial(
  nama:
    string
) {
  if (!nama) {
    return "-";
  }


  const words =
    nama
      .trim()
      .split(
        /\s+/
      )
      .filter(
        Boolean
      );


  if (
    words.length ===
    0
  ) {
    return "-";
  }


  if (
    words.length ===
    1
  ) {
    return words[0]
      .slice(
        0,
        2
      )
      .toUpperCase();
  }


  return (
    words[0][0] +
    words[
      words.length -
        1
    ][0]
  ).toUpperCase();
}