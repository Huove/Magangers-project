"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Link from "next/link";

import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  FileSearch,
  CalendarClock,
  ClipboardCheck,
  BookMarked,
  type LucideIcon,
} from "lucide-react";

import { supabase } from "@/lib/supabase";


// =====================================================
// TYPES
// =====================================================

type Stat = {
  label: string;
  value: number;
  note: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};


type DashboardStatData = {
  hadirHariIni: number;
  terlambatHariIni: number;

  pengajuanIzin: number;

  laporanMenunggu: number;

  jadwalEvaluasi: number;

  tugasMenunggu: number;

  jurnalMenunggu: number;

  totalPesertaBimbingan: number;

  jadwalNote: string;
};


type RecentTask = {
  id: string;

  assignmentId: string;

  judul: string;

  nama: string;

  deadline:
    | string
    | null;

  status: string;
};


type RecentJournal = {
  id: string;

  judul: string;

  nama: string;

  tanggal: string;

  status: string;
};


type RecentIzin = {
  id: string;

  nama: string;

  alasan: string;

  tanggal: string;

  status: string;
};


type UpcomingEvaluation = {
  id: string;

  pesertaId: string;

  tanggal: string;

  jenis: string;

  judul: string;

  nama: string | null;

  waktu: string;

  lokasi:
    | string
    | null;
};


type ParticipantRow = {
  id: string;

  user_id:
    | string
    | null;

  status:
    | string
    | null;
};


type ProfileRow = {
  id: string;

  nama_lengkap:
    | string
    | null;
};


type TaskRow = {
  id: string;

  judul: string;

  deadline:
    | string
    | null;

  created_at: string;
};


type TaskAssignmentRow = {
  id: string;

  tugas_id: string;

  peserta_id: string;

  status:
    | string
    | null;

  dikumpulkan_at:
    | string
    | null;

  created_at: string;
};


type EvaluationRow = {
  id: string;

  peserta_id: string;

  jenis_evaluasi: string;

  judul: string;

  tanggal: string;

  jam_mulai: string;

  jam_selesai:
    | string
    | null;

  lokasi:
    | string
    | null;

  status: string;
};


// =====================================================
// INITIAL DATA
// =====================================================

const initialDashboardStatData:
  DashboardStatData = {
    hadirHariIni: 0,

    terlambatHariIni: 0,

    pengajuanIzin: 0,

    laporanMenunggu: 0,

    jadwalEvaluasi: 0,

    tugasMenunggu: 0,

    jurnalMenunggu: 0,

    totalPesertaBimbingan: 0,

    jadwalNote:
      "Dalam 7 hari ke depan",
  };


// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  iconBg,
  iconColor,
}: Stat) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${iconBg}`}
      >
        <Icon
          className={`h-5 w-5 ${iconColor}`}
        />
      </span>


      <div>

        <p className="text-sm text-slate-500">
          {label}
        </p>


        <p className="mt-1 text-3xl font-extrabold text-slate-900">
          {value}
        </p>


        <p className="mt-1 text-xs text-slate-400">
          {note}
        </p>

      </div>

    </div>
  );
}


// =====================================================
// SECTION CARD
// =====================================================

function SectionCard({
  title,
  href,
  children,
}: {
  title: string;

  href?: string;

  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

      <div className="mb-4 flex items-center justify-between">

        <h2 className="text-lg font-bold text-slate-900">
          {title}
        </h2>


        {href ? (

          <Link
            href={href}
            className="text-sm font-semibold text-brand-blue hover:underline"
          >
            Lihat semua
          </Link>

        ) : (

          <span />

        )}

      </div>


      {children}

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
    | string
    | null;
}) {
  const normalized =
    normalizeStatus(
      status
    );


  let label =
    "Menunggu";


  let classes =
    "bg-amber-100 text-amber-700";


  if (
    normalized ===
      "disetujui" ||
    normalized ===
      "selesai" ||
    normalized ===
      "approved"
  ) {
    label =
      normalized ===
      "disetujui"
        ? "Disetujui"
        : "Selesai";


    classes =
      "bg-emerald-100 text-emerald-700";
  }


  else if (
    normalized ===
      "revisi" ||
    normalized ===
      "direvisi" ||
    normalized ===
      "perlu_revisi" ||
    normalized ===
      "perlu_perbaikan" ||
    normalized ===
      "ditolak" ||
    normalized ===
      "rejected"
  ) {
    if (
      normalized ===
        "ditolak" ||
      normalized ===
        "rejected"
    ) {
      label =
        "Ditolak";
    } else {
      label =
        "Perlu Revisi";
    }


    classes =
      "bg-red-100 text-red-700";
  }


  else if (
    normalized ===
    "belum_dikerjakan"
  ) {
    label =
      "Belum Dikerjakan";


    classes =
      "bg-slate-100 text-slate-600";
  }


  else if (
    normalized ===
      "sedang_dikerjakan" ||
    normalized ===
      "dikerjakan"
  ) {
    label =
      "Sedang Dikerjakan";


    classes =
      "bg-blue-100 text-blue-700";
  }


  else if (
    normalized ===
      "dikumpulkan" ||
    normalized ===
      "sudah_dikirim" ||
    normalized ===
      "submitted" ||
    normalized ===
      "menunggu_pemeriksaan" ||
    normalized ===
      "menunggu_konfirmasi"
  ) {
    label =
      "Menunggu Pemeriksaan";


    classes =
      "bg-amber-100 text-amber-700";
  }


  return (
    <span
      className={`whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}


// =====================================================
// LOADING
// =====================================================

function RecentLoading() {
  return (
    <div className="py-8 text-center text-sm text-slate-400">
      Memuat data terbaru...
    </div>
  );
}


// =====================================================
// EMPTY
// =====================================================

function RecentEmpty({
  text,
}: {
  text: string;
}) {
  return (
    <div className="py-8 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}


// =====================================================
// PAGE
// =====================================================

export default function PembinaDashboardPage() {
  // ===================================================
  // DASHBOARD
  // ===================================================

  const [
    dashboardData,
    setDashboardData,
  ] =
    useState<DashboardStatData>(
      initialDashboardStatData
    );


  const [
    loadingDashboard,
    setLoadingDashboard,
  ] =
    useState(true);


  const [
    dashboardError,
    setDashboardError,
  ] =
    useState("");


  // ===================================================
  // RECENT
  // ===================================================

  const [
    recentTasks,
    setRecentTasks,
  ] =
    useState<
      RecentTask[]
    >([]);


  const [
    recentJournals,
    setRecentJournals,
  ] =
    useState<
      RecentJournal[]
    >([]);


  const [
    recentIzin,
    setRecentIzin,
  ] =
    useState<
      RecentIzin[]
    >([]);


  const [
    loadingRecent,
    setLoadingRecent,
  ] =
    useState(true);


  const [
    recentError,
    setRecentError,
  ] =
    useState("");


  // ===================================================
  // JADWAL EVALUASI
  // ===================================================

  const [
    upcomingEvaluations,
    setUpcomingEvaluations,
  ] =
    useState<
      UpcomingEvaluation[]
    >([]);


  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  const loadDashboard =
    useCallback(
      async () => {
        try {
          setLoadingDashboard(
            true
          );


          setLoadingRecent(
            true
          );


          setDashboardError(
            ""
          );


          setRecentError(
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
                id,
                user_id
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


          if (!pembimbing) {
            throw new Error(
              "Data pembimbing tidak ditemukan."
            );
          }


          // =============================================
          // 3. PENEMPATAN PEMBIMBING
          // =============================================

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
                peserta_id
              `)
              .eq(
                "pembimbing_id",
                pembimbing.id
              );


          if (
            penempatanError
          ) {
            throw penempatanError;
          }


          const semuaPesertaIds = [
            ...new Set(
              (
                penempatanData ??
                []
              )
                .map(
                  (
                    item
                  ) =>
                    item.peserta_id
                )
                .filter(
                  (
                    id
                  ): id is string =>
                    Boolean(id)
                )
            ),
          ];


          // =============================================
          // 4. JADWAL EVALUASI
          //
          // Tidak bergantung pada jumlah peserta aktif.
          // Jadwal tetap dapat dimuat berdasarkan
          // pembimbing_id.
          // =============================================

          const jadwalResult =
            await fetchJadwalEvaluasi(
              pembimbing.id
            );


          setUpcomingEvaluations(
            jadwalResult.items
          );


          // =============================================
          // TIDAK ADA PESERTA BIMBINGAN
          // =============================================

          if (
            semuaPesertaIds.length ===
            0
          ) {
            setDashboardData({
              ...initialDashboardStatData,

              jadwalEvaluasi:
                jadwalResult.count,

              jadwalNote:
                jadwalResult.note,
            });


            setRecentTasks([]);
            setRecentJournals([]);
            setRecentIzin([]);

            return;
          }


          // =============================================
          // 5. PESERTA AKTIF BIMBINGAN
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
                status
              `)
              .in(
                "id",
                semuaPesertaIds
              )
              .eq(
                "status",
                "aktif"
              );


          if (
            pesertaError
          ) {
            throw pesertaError;
          }


          const participants =
            (
              pesertaData ??
              []
            ) as ParticipantRow[];


          const pesertaIds =
            participants.map(
              (
                item
              ) =>
                item.id
            );


          // =============================================
          // PROFILE PESERTA
          // =============================================

          const profileIds = [
            ...new Set(
              participants
                .map(
                  (
                    participant
                  ) =>
                    participant.user_id
                )
                .filter(
                  (
                    id
                  ): id is string =>
                    Boolean(id)
                )
            ),
          ];


          const profileMap =
            new Map<
              string,
              string
            >();


          if (
            profileIds.length >
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
                  profileIds
                );


            if (
              profileError
            ) {
              throw profileError;
            }


            for (
              const profile
              of (
                profileData ??
                []
              ) as ProfileRow[]
            ) {
              profileMap.set(
                profile.id,

                profile
                  .nama_lengkap ??
                  "Peserta"
              );
            }
          }


          const participantNameMap =
            new Map<
              string,
              string
            >();


          for (
            const participant
            of participants
          ) {
            participantNameMap.set(
              participant.id,

              participant.user_id
                ? profileMap.get(
                    participant.user_id
                  ) ??
                  "Peserta"
                : "Peserta"
            );
          }


          // =============================================
          // PESERTA AKTIF KOSONG
          // =============================================

          if (
            pesertaIds.length ===
            0
          ) {
            setDashboardData({
              ...initialDashboardStatData,

              jadwalEvaluasi:
                jadwalResult.count,

              jadwalNote:
                jadwalResult.note,
            });


            setRecentTasks([]);
            setRecentJournals([]);
            setRecentIzin([]);

            return;
          }


          // =============================================
          // 6. TUGAS PEMBIMBING
          // =============================================

          const {
            data:
              taskData,

            error:
              taskError,
          } =
            await supabase
              .from(
                "tugas"
              )
              .select(`
                id,
                judul,
                deadline,
                created_at
              `)
              .eq(
                "pembimbing_id",
                pembimbing.id
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              )
              .limit(20);


          if (
            taskError
          ) {
            throw taskError;
          }


          const taskRows =
            (
              taskData ??
              []
            ) as TaskRow[];


          const taskIds =
            taskRows.map(
              (
                item
              ) =>
                item.id
            );


          // =============================================
          // 7. QUERY DASHBOARD
          // =============================================

          const [
            absensiResult,
            izinResult,
            laporanResult,
            jurnalResult,
          ] =
            await Promise.all([
              supabase
                .from(
                  "absensi"
                )
                .select(`
                  id,
                  peserta_id,
                  status
                `)
                .in(
                  "peserta_id",
                  pesertaIds
                )
                .eq(
                  "tanggal",
                  getJakartaDate()
                ),


              supabase
                .from(
                  "pengajuan_izin"
                )
                .select(
                  "id",
                  {
                    count:
                      "exact",

                    head:
                      true,
                  }
                )
                .in(
                  "peserta_id",
                  pesertaIds
                )
                .eq(
                  "status",
                  "menunggu"
                ),


              supabase
                .from(
                  "laporan"
                )
                .select(
                  "id",
                  {
                    count:
                      "exact",

                    head:
                      true,
                  }
                )
                .in(
                  "peserta_id",
                  pesertaIds
                )
                .eq(
                  "status",
                  "menunggu"
                ),


              supabase
                .from(
                  "jurnal"
                )
                .select(
                  "id",
                  {
                    count:
                      "exact",

                    head:
                      true,
                  }
                )
                .in(
                  "peserta_id",
                  pesertaIds
                )
                .eq(
                  "status",
                  "menunggu"
                ),
            ]);


          if (
            absensiResult.error
          ) {
            throw absensiResult.error;
          }


          if (
            izinResult.error
          ) {
            throw izinResult.error;
          }


          if (
            laporanResult.error
          ) {
            throw laporanResult.error;
          }


          if (
            jurnalResult.error
          ) {
            throw jurnalResult.error;
          }


          // =============================================
          // 8. TUGAS PESERTA
          // =============================================

          let assignmentRows:
            TaskAssignmentRow[] =
            [];


          if (
            taskIds.length >
            0
          ) {
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
                  dikumpulkan_at,
                  created_at
                `)
                .in(
                  "tugas_id",
                  taskIds
                )
                .in(
                  "peserta_id",
                  pesertaIds
                );


            if (
              assignmentError
            ) {
              throw assignmentError;
            }


            assignmentRows =
              (
                assignmentData ??
                []
              ) as TaskAssignmentRow[];
          }


          // =============================================
          // 9. ABSENSI
          // =============================================

          const absensi =
            absensiResult.data ??
            [];


          const hadirHariIni =
            absensi.filter(
              (
                item
              ) =>
                normalizeStatus(
                  item.status
                ) ===
                "hadir"
            ).length;


          const terlambatHariIni =
            absensi.filter(
              (
                item
              ) =>
                normalizeStatus(
                  item.status
                ) ===
                "terlambat"
            ).length;


          // =============================================
          // 10. TUGAS MENUNGGU
          // =============================================

          const tugasMenunggu =
            assignmentRows.filter(
              (
                item
              ) =>
                isTaskWaitingForReview(
                  item.status,
                  item.dikumpulkan_at
                )
            ).length;


          // =============================================
          // 11. SET STATS
          // =============================================

          setDashboardData({
            hadirHariIni,

            terlambatHariIni,

            pengajuanIzin:
              izinResult.count ??
              0,

            laporanMenunggu:
              laporanResult.count ??
              0,

            jadwalEvaluasi:
              jadwalResult.count,

            tugasMenunggu,

            jurnalMenunggu:
              jurnalResult.count ??
              0,

            totalPesertaBimbingan:
              pesertaIds.length,

            jadwalNote:
              jadwalResult.note,
          });


          // =============================================
          // 12. RECENT TASK
          // =============================================

          const taskMap =
            new Map<
              string,
              TaskRow
            >();


          for (
            const task
            of taskRows
          ) {
            taskMap.set(
              task.id,
              task
            );
          }


          const formattedTasks =
            assignmentRows
              .map(
                (
                  assignment
                ):
                  RecentTask | null => {
                  const task =
                    taskMap.get(
                      assignment
                        .tugas_id
                    );


                  if (!task) {
                    return null;
                  }


                  return {
                    id:
                      task.id,

                    assignmentId:
                      assignment.id,

                    judul:
                      task.judul,

                    nama:
                      participantNameMap.get(
                        assignment
                          .peserta_id
                      ) ??
                      "Peserta",

                    deadline:
                      task.deadline,

                    status:
                      assignment.status ??
                      "belum_dikerjakan",
                  };
                }
              )
              .filter(
                (
                  item
                ): item is RecentTask =>
                  Boolean(item)
              )
              .sort(
                (
                  a,
                  b
                ) => {
                  const taskA =
                    taskMap.get(
                      a.id
                    );


                  const taskB =
                    taskMap.get(
                      b.id
                    );


                  return (
                    new Date(
                      taskB
                        ?.created_at ??
                        0
                    ).getTime() -

                    new Date(
                      taskA
                        ?.created_at ??
                        0
                    ).getTime()
                  );
                }
              )
              .slice(
                0,
                3
              );


          setRecentTasks(
            formattedTasks
          );


          // =============================================
          // 13. JURNAL TERBARU
          // =============================================

          const {
            data:
              journalData,

            error:
              journalError,
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
                status,
                created_at
              `)
              .in(
                "peserta_id",
                pesertaIds
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              )
              .limit(3);


          if (
            journalError
          ) {
            throw journalError;
          }


          const formattedJournals:
            RecentJournal[] =
            (
              journalData ??
              []
            ).map(
              (
                item
              ) => ({
                id:
                  item.id,

                judul:
                  item.judul ||
                  `Jurnal ${formatShortDate(
                    item.tanggal
                  )}`,

                nama:
                  participantNameMap.get(
                    item.peserta_id
                  ) ??
                  "Peserta",

                tanggal:
                  item.tanggal,

                status:
                  item.status ??
                  "menunggu",
              })
            );


          setRecentJournals(
            formattedJournals
          );


          // =============================================
          // 14. IZIN TERBARU
          // =============================================

          const {
            data:
              izinData,

            error:
              izinRecentError,
          } =
            await supabase
              .from(
                "pengajuan_izin"
              )
              .select(`
                id,
                peserta_id,
                tanggal_mulai,
                alasan,
                status,
                created_at
              `)
              .in(
                "peserta_id",
                pesertaIds
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              )
              .limit(3);


          if (
            izinRecentError
          ) {
            throw izinRecentError;
          }


          const formattedIzin:
            RecentIzin[] =
            (
              izinData ??
              []
            ).map(
              (
                item
              ) => ({
                id:
                  item.id,

                nama:
                  participantNameMap.get(
                    item.peserta_id
                  ) ??
                  "Peserta",

                alasan:
                  item.alasan,

                tanggal:
                  item
                    .tanggal_mulai,

                status:
                  item.status ??
                  "menunggu",
              })
            );


          setRecentIzin(
            formattedIzin
          );

        } catch (
          error
        ) {
          console.error(
            "DASHBOARD PEMBIMBING ERROR:",
            error
          );


          const message =
            error instanceof Error
              ? error.message
              : "Gagal mengambil dashboard pembimbing.";


          setDashboardError(
            message
          );


          setRecentError(
            message
          );


          setDashboardData(
            initialDashboardStatData
          );


          setUpcomingEvaluations([]);

          setRecentTasks([]);

          setRecentJournals([]);

          setRecentIzin([]);

        } finally {
          setLoadingDashboard(
            false
          );


          setLoadingRecent(
            false
          );
        }
      },
      []
    );


  // ===================================================
  // INITIAL
  // ===================================================

  useEffect(
    () => {
      loadDashboard();
    },
    [
      loadDashboard,
    ]
  );


  // ===================================================
  // PERCENTAGE
  // ===================================================

  const totalBimbingan =
    dashboardData
      .totalPesertaBimbingan;


  const hadirPercentage =
    getPercentage(
      dashboardData
        .hadirHariIni,

      totalBimbingan
    );


  const terlambatPercentage =
    getPercentage(
      dashboardData
        .terlambatHariIni,

      totalBimbingan
    );


  // ===================================================
  // STATS
  // ===================================================

  const STATS:
    Stat[] =
    useMemo(
      () => [
        {
          label:
            "Peserta Bimbingan",

          value:
            dashboardData
              .totalPesertaBimbingan,

          note:
            loadingDashboard
              ? "Memuat data..."
              : `${dashboardData.totalPesertaBimbingan} peserta aktif`,

          icon:
            Users,

          iconBg:
            "bg-blue-100",

          iconColor:
            "text-blue-500",
        },


        {
          label:
            "Hadir Hari Ini",

          value:
            dashboardData
              .hadirHariIni,

          note:
            loadingDashboard
              ? "Memuat data..."
              : `${hadirPercentage}% dari ${totalBimbingan} peserta`,

          icon:
            CheckCircle2,

          iconBg:
            "bg-emerald-100",

          iconColor:
            "text-emerald-500",
        },


        {
          label:
            "Terlambat",

          value:
            dashboardData
              .terlambatHariIni,

          note:
            loadingDashboard
              ? "Memuat data..."
              : `${terlambatPercentage}% dari ${totalBimbingan} peserta`,

          icon:
            Clock,

          iconBg:
            "bg-red-100",

          iconColor:
            "text-red-500",
        },


        {
          label:
            "Pengajuan Izin",

          value:
            dashboardData
              .pengajuanIzin,

          note:
            loadingDashboard
              ? "Memuat data..."
              : `${dashboardData.pengajuanIzin} menunggu persetujuan`,

          icon:
            FileText,

          iconBg:
            "bg-blue-100",

          iconColor:
            "text-blue-500",
        },


        {
          label:
            "Laporan Menunggu Pemeriksaan",

          value:
            dashboardData
              .laporanMenunggu,

          note:
            loadingDashboard
              ? "Memuat data..."
              : `${dashboardData.laporanMenunggu} menunggu pemeriksaan`,

          icon:
            FileSearch,

          iconBg:
            "bg-red-100",

          iconColor:
            "text-red-500",
        },


        {
          label:
            "Jadwal Evaluasi",

          value:
            dashboardData
              .jadwalEvaluasi,

          note:
            loadingDashboard
              ? "Memuat data..."
              : dashboardData
                  .jadwalNote,

          icon:
            CalendarClock,

          iconBg:
            "bg-blue-100",

          iconColor:
            "text-blue-500",
        },


        {
          label:
            "Tugas Menunggu Pemeriksaan",

          value:
            dashboardData
              .tugasMenunggu,

          note:
            loadingDashboard
              ? "Memuat data..."
              : `${dashboardData.tugasMenunggu} tugas perlu diperiksa`,

          icon:
            ClipboardCheck,

          iconBg:
            "bg-amber-100",

          iconColor:
            "text-amber-500",
        },


        {
          label:
            "Jurnal Menunggu Pemeriksaan",

          value:
            dashboardData
              .jurnalMenunggu,

          note:
            loadingDashboard
              ? "Memuat data..."
              : `${dashboardData.jurnalMenunggu} jurnal perlu diperiksa`,

          icon:
            BookMarked,

          iconBg:
            "bg-emerald-100",

          iconColor:
            "text-emerald-500",
        },
      ],
      [
        dashboardData,
        loadingDashboard,
        hadirPercentage,
        terlambatPercentage,
        totalBimbingan,
      ]
    );


  // ===================================================
  // UI
  // ===================================================

  return (
    <div>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">

        <div>

          <h1 className="text-2xl font-extrabold text-slate-900">
            Dashboard Pembimbing
          </h1>


          <p className="mt-1 text-sm text-slate-500">
            Selamat Datang! Berikut ringkasan bimbingan hari ini.
          </p>

        </div>


        <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm">

          <Calendar className="h-4 w-4 text-slate-400" />

          {formatCurrentDate()}

        </span>

      </div>


      {/* =================================================
          ERROR DASHBOARD
      ================================================= */}

      {dashboardError && (

        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

          Gagal mengambil beberapa data dashboard:{" "}

          {dashboardError}

        </div>

      )}


      {/* =================================================
          ERROR RECENT
      ================================================= */}

      {recentError &&
        recentError !==
          dashboardError && (

        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

          Gagal mengambil data terbaru:{" "}

          {recentError}

        </div>

      )}


      {/* =================================================
          STAT CARDS
      ================================================= */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

        {STATS.map(
          (
            stat
          ) => (

          <StatCard
            key={
              stat.label
            }
            {...stat}
          />

          )
        )}

      </div>


      {/* =================================================
          JADWAL EVALUASI MENDATANG
      ================================================= */}

      <div className="mt-8">
        <JadwalEvaluasiKalender
          jadwal={upcomingEvaluations}
          loading={loadingDashboard}
          error={dashboardError || null}
          lihatSemuaHref="/dashboard-pembina/jadwal-evaluasi"
        />
      </div>


      {/* =================================================
          TUGAS TERBARU
      ================================================= */}

      <div className="mt-6">

        <SectionCard
          title="Tugas Terbaru"
          href="/dashboard-pembina/tugas"
        >

          {loadingRecent ? (

            <RecentLoading />

          ) : recentTasks.length ===
            0 ? (

            <RecentEmpty
              text="Belum ada tugas terbaru."
            />

          ) : (

            <div className="divide-y divide-slate-100">

              {recentTasks.map(
                (
                  item
                ) => (

                <Link
                  key={
                    item.assignmentId
                  }
                  href={`/dashboard-pembina/tugas/${item.id}`}
                  className="-mx-2 flex flex-wrap items-center gap-4 rounded-lg px-2 py-3.5 transition hover:bg-slate-50"
                >

                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-200 text-sm font-bold text-blue-700">

                    {getInitial(
                      item.nama
                    )}

                  </span>


                  <div className="min-w-[180px] flex-1">

                    <p className="text-sm font-semibold text-slate-900">
                      {item.judul}
                    </p>


                    <p className="text-sm text-slate-500">
                      {item.nama}
                    </p>

                  </div>


                  <StatusBadge
                    status={
                      item.status
                    }
                  />


                  <span className="text-sm text-slate-500">

                    Batas :{" "}

                    {item.deadline
                      ? formatDashboardDate(
                          item.deadline
                        )
                      : "-"}

                  </span>

                </Link>

                )
              )}

            </div>

          )}

        </SectionCard>

      </div>


      {/* =================================================
          JURNAL TERBARU
      ================================================= */}

      <div className="mt-6">

        <SectionCard
          title="Jurnal Terbaru"
          href="/dashboard-pembina/jurnal"
        >

          {loadingRecent ? (

            <RecentLoading />

          ) : recentJournals.length ===
            0 ? (

            <RecentEmpty
              text="Belum ada jurnal terbaru."
            />

          ) : (

            <div className="divide-y divide-slate-100">

              {recentJournals.map(
                (
                  item
                ) => (

                <Link
                  key={
                    item.id
                  }
                  href={`/dashboard-pembina/jurnal/${item.id}`}
                  className="-mx-2 flex flex-wrap items-center gap-4 rounded-lg px-2 py-3.5 transition hover:bg-slate-50"
                >

                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-200 text-sm font-bold text-blue-700">

                    {getInitial(
                      item.nama
                    )}

                  </span>


                  <div className="min-w-[180px] flex-1">

                    <p className="text-sm font-semibold text-slate-900">
                      {item.judul}
                    </p>


                    <p className="text-sm text-slate-500">
                      {item.nama}
                    </p>

                  </div>


                  <StatusBadge
                    status={
                      item.status
                    }
                  />


                  <span className="text-sm text-slate-500">

                    {formatDashboardDate(
                      item.tanggal
                    )}

                  </span>

                </Link>

                )
              )}

            </div>

          )}

        </SectionCard>

      </div>


      {/* =================================================
          IZIN TERBARU
      ================================================= */}

      <div className="mt-6">

        <SectionCard
          title="Pengajuan Izin Terbaru"
          href="/dashboard-pembina/izin"
        >

          {loadingRecent ? (

            <RecentLoading />

          ) : recentIzin.length ===
            0 ? (

            <RecentEmpty
              text="Belum ada pengajuan izin terbaru."
            />

          ) : (

            <div className="divide-y divide-slate-100">

              {recentIzin.map(
                (
                  item
                ) => (

                <Link
                  key={
                    item.id
                  }
                  href={`/dashboard-pembina/izin/${item.id}`}
                  className="-mx-2 flex flex-wrap items-center gap-4 rounded-lg px-2 py-3.5 transition hover:bg-slate-50"
                >

                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-200 text-sm font-bold text-blue-700">

                    {getInitial(
                      item.nama
                    )}

                  </span>


                  <div className="min-w-[180px] flex-1">

                    <p className="text-sm font-semibold text-slate-900">
                      {item.nama}
                    </p>


                    <p className="text-sm text-slate-500">
                      {item.alasan}
                    </p>

                  </div>


                  <span className="text-sm text-slate-500">

                    {formatDashboardDate(
                      item.tanggal
                    )}

                  </span>


                  <StatusBadge
                    status={
                      item.status
                    }
                  />

                </Link>

                )
              )}

            </div>

          )}

        </SectionCard>

      </div>

    </div>
  );
}


// =====================================================
// KALENDER EVALUASI DASHBOARD
// =====================================================

const HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function tanggalHariIni(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function tanggalUTC(tanggal: string) {
  const [tahun, bulan, hari] = tanggal.split("-").map(Number);
  return new Date(Date.UTC(tahun, bulan - 1, hari));
}

function formatTanggal(tanggal: string) {
  return tanggalUTC(tanggal).toLocaleDateString("id-ID", {
    timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function geserBulan(bulan: string, langkah: number) {
  const tanggal = tanggalUTC(`${bulan}-01`);
  tanggal.setUTCMonth(tanggal.getUTCMonth() + langkah);
  return tanggal.toISOString().slice(0, 7);
}

function JadwalEvaluasiKalender({
  jadwal,
  loading = false,
  error = null,
  lihatSemuaHref,
  timeZone = "Asia/Jakarta",
}: {
  jadwal: UpcomingEvaluation[];
  loading?: boolean;
  error?: string | null;
  lihatSemuaHref?: string;
  timeZone?: string;
}) {
  const headingId = useId();
  const [hariIni, setHariIni] = useState("");
  const [bulan, setBulan] = useState("");
  const [tanggalDipilih, setTanggalDipilih] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const sekarang = tanggalHariIni(timeZone);
      setHariIni(sekarang);
      setBulan((sebelumnya) => sebelumnya || sekarang.slice(0, 7));
    };
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [timeZone]);

  const perTanggal = useMemo(() => {
    const groups = new Map<string, UpcomingEvaluation[]>();
    [...jadwal]
      .filter((item) => item.tanggal >= hariIni)
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.waktu.localeCompare(b.waktu))
      .forEach((item) => {
        const items = groups.get(item.tanggal) ?? [];
        items.push(item);
        groups.set(item.tanggal, items);
      });
    return groups;
  }, [jadwal, hariIni]);

  const daftarBulan = [...perTanggal.entries()].filter(([tanggal]) => tanggal.startsWith(`${bulan}-`));
  const daftarTampil = tanggalDipilih
    ? daftarBulan.filter(([tanggal]) => tanggal === tanggalDipilih)
    : daftarBulan;
  const jumlahEvaluasi = daftarBulan.reduce((jumlah, [, items]) => jumlah + items.length, 0);
  const siap = Boolean(bulan && hariIni);
  const awalBulan = siap ? tanggalUTC(`${bulan}-01`) : null;
  const offset = awalBulan ? (awalBulan.getUTCDay() + 6) % 7 : 0;
  const jumlahHari = awalBulan
    ? new Date(Date.UTC(awalBulan.getUTCFullYear(), awalBulan.getUTCMonth() + 1, 0)).getUTCDate()
    : 0;
  const jumlahSel = Math.ceil((offset + jumlahHari) / 7) * 7;
  const judulBulan = awalBulan?.toLocaleDateString("id-ID", {
    timeZone: "UTC", month: "long", year: "numeric",
  });

  function pindahBulan(langkah: number) {
    setBulan((sebelumnya) => geserBulan(sebelumnya, langkah));
    setTanggalDipilih(null);
  }

  const tombolNavigasi = "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

  return (
    <section aria-labelledby={headingId} aria-busy={loading || !siap}
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg font-bold text-slate-900 sm:text-xl">
          Jadwal Evaluasi Mendatang
        </h2>
        {lihatSemuaHref && (
          <a href={lihatSemuaHref} className="rounded text-sm font-semibold text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            Lihat semua
          </a>
        )}
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : loading || !siap ? (
        <p role="status" className="py-16 text-center text-sm text-slate-500">Memuat jadwal evaluasi...</p>
      ) : (
        <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="mb-5 flex items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900" aria-live="polite">{judulBulan}</h3>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setBulan(hariIni.slice(0, 7)); setTanggalDipilih(null); }}
                  className="rounded-lg px-2 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                  Hari ini
                </button>
                <button type="button" onClick={() => pindahBulan(-1)} aria-label="Bulan sebelumnya" className={tombolNavigasi}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button type="button" onClick={() => pindahBulan(1)} aria-label="Bulan berikutnya" className={tombolNavigasi}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {HARI.map((hari) => <span key={hari} className="pb-2 text-xs font-medium text-slate-500">{hari}</span>)}
              {Array.from({ length: jumlahSel }, (_, index) => {
                const hari = index - offset + 1;
                if (hari < 1 || hari > jumlahHari) return <span key={`kosong-${index}`} aria-hidden="true" />;
                const tanggal = `${bulan}-${String(hari).padStart(2, "0")}`;
                const jumlah = perTanggal.get(tanggal)?.length ?? 0;
                const dipilih = tanggalDipilih === tanggal;
                return (
                  <button key={tanggal} type="button" aria-pressed={dipilih}
                    aria-current={tanggal === hariIni ? "date" : undefined}
                    aria-label={`${formatTanggal(tanggal)}, ${jumlah ? `${jumlah} jadwal evaluasi` : "tidak ada evaluasi mendatang"}`}
                    onClick={() => setTanggalDipilih(dipilih ? null : tanggal)}
                    className={`relative flex h-11 items-center justify-center rounded-xl pb-1 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      dipilih ? "bg-blue-100 font-bold text-blue-800 ring-1 ring-blue-300"
                        : tanggal === hariIni ? "bg-slate-100 font-semibold text-blue-700 hover:bg-blue-50"
                          : "text-slate-700 hover:bg-blue-50"
                    }`}>
                    {hari}
                    {jumlah > 0 && <span aria-hidden="true" className="absolute bottom-1.5 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-blue-600" />}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <span aria-hidden="true" className="h-1 w-5 rounded-full bg-blue-600" />Ada jadwal evaluasi
            </p>
          </div>

          <div className="min-w-0 border-t border-slate-100 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">{tanggalDipilih ? formatTanggal(tanggalDipilih) : `Evaluasi ${judulBulan}`}</h3>
                <p className="mt-1 text-xs text-slate-500">{jumlahEvaluasi} evaluasi mendatang bulan ini</p>
              </div>
              {tanggalDipilih && <button type="button" onClick={() => setTanggalDipilih(null)}
                className="rounded text-xs font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                Semua tanggal
              </button>}
            </div>

            <div role="region" aria-label="Daftar jadwal evaluasi" tabIndex={0}
              className="max-h-80 space-y-4 overflow-y-auto rounded-xl pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              {daftarTampil.length === 0 ? (
                <p role="status" className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  {tanggalDipilih ? "Tidak ada evaluasi mendatang pada tanggal ini." : "Belum ada jadwal evaluasi mendatang pada bulan ini."}
                </p>
              ) : daftarTampil.map(([tanggal, items]) => (
                <div key={tanggal}>
                  <p className="mb-2 text-sm font-semibold text-slate-700"><time dateTime={tanggal}>{formatTanggal(tanggal)}</time></p>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item.id} className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <p className="break-words text-sm font-semibold text-slate-900">{item.judul || item.jenis}</p>
                        <p className="mt-1 break-words text-sm text-slate-600">
                          {item.nama ? `Dengan ${item.nama}` : "Nama peserta belum tersedia"}
                        </p>
                        <p className="mt-2 text-sm font-medium text-blue-700">
                          Pukul {item.waktu} WIB
                        </p>
                        {item.lokasi && <p className="mt-1 break-words text-xs text-slate-500">{item.lokasi}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


// =====================================================
// FETCH JADWAL EVALUASI
// =====================================================

async function fetchJadwalEvaluasi(
  pembimbingId: string
): Promise<{ count: number; note: string; items: UpcomingEvaluation[] }> {
  const today = getJakartaDate();
  const sevenDaysLater = addDays(today, 7);
  const schedules: EvaluationRow[] = [];
  const pageSize = 200;

  // Kalender memerlukan seluruh jadwal mendatang, termasuk bulan berikutnya.
  // Pagination mencegah jadwal terpotong oleh batas respons Supabase.
  for (let offset = 0; ; ) {
    const { data, error } = await supabase
      .from("jadwal_evaluasi")
      .select("id, peserta_id, jenis_evaluasi, judul, tanggal, jam_mulai, jam_selesai, lokasi, status")
      .eq("pembimbing_id", pembimbingId)
      .eq("status", "terjadwal")
      .gte("tanggal", today)
      .order("tanggal", { ascending: true })
      .order("jam_mulai", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    const rows = (data ?? []) as EvaluationRow[];
    if (rows.length === 0) break;
    schedules.push(...rows);
    offset += rows.length;
  }

  // Pertahankan periode kartu statistik yang lama; kalender tidak dibatasi.
  const count = schedules.filter((item) => item.tanggal <= sevenDaysLater).length;
  const note = "Dalam 7 hari ke depan";
  if (schedules.length === 0) return { count, note, items: [] };

  const pesertaIds = [...new Set(schedules.map((item) => item.peserta_id).filter(Boolean))];
  const peserta: Array<{ id: string; user_id: string | null }> = [];
  for (let offset = 0; offset < pesertaIds.length; offset += pageSize) {
    const { data, error } = await supabase
      .from("peserta")
      .select("id, user_id")
      .in("id", pesertaIds.slice(offset, offset + pageSize));
    if (error) throw error;
    peserta.push(...(data ?? []));
  }

  const userIds = [...new Set(peserta.map((item) => item.user_id).filter((id): id is string => Boolean(id)))];
  const profileMap = new Map<string, string>();
  for (let offset = 0; offset < userIds.length; offset += pageSize) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nama_lengkap")
      .in("id", userIds.slice(offset, offset + pageSize));
    if (!error) {
      for (const profile of (data ?? []) as ProfileRow[]) {
        const name = profile.nama_lengkap?.trim();
        if (name) profileMap.set(profile.id, name);
      }
    }
  }

  // Gunakan fungsi yang sama dengan halaman Jadwal Evaluasi jika nama
  // tidak terbaca melalui SELECT profiles (termasuk hasil kosong akibat RLS).
  // Pasang Nama-Peserta-Evaluasi.sql sekali di Supabase SQL Editor.
  const missingUserIds = userIds.filter((id) => !profileMap.has(id));
  for (let offset = 0; offset < missingUserIds.length; offset += pageSize) {
    const requestedIds = missingUserIds.slice(offset, offset + pageSize);
    const { data, error } = await supabase
      .rpc("get_nama_peserta_evaluasi")
      .in("id", requestedIds);
    if (!error) {
      for (const profile of (data ?? []) as ProfileRow[]) {
        const name = profile.nama_lengkap?.trim();
        if (name && requestedIds.includes(profile.id)) profileMap.set(profile.id, name);
      }
    }
  }

  // Nomor peserta bukan nama. Biarkan UI menjelaskan jika nama belum tersedia.
  const participantNameMap = new Map(peserta.map((participant) => [
    participant.id,
    participant.user_id ? profileMap.get(participant.user_id) ?? null : null,
  ]));

  const items: UpcomingEvaluation[] = schedules.map((schedule) => ({
    id: schedule.id,
    pesertaId: schedule.peserta_id,
    tanggal: schedule.tanggal,
    jenis: formatEvaluationType(schedule.jenis_evaluasi),
    judul: schedule.judul,
    nama: participantNameMap.get(schedule.peserta_id) ?? null,
    waktu: formatEvaluationTime(schedule.jam_mulai, schedule.jam_selesai),
    lokasi: schedule.lokasi ?? null,
  }));

  return { count, note, items };
}


// =====================================================
// PERCENTAGE
// =====================================================

function getPercentage(
  value: number,
  total: number
) {
  if (
    total <=
    0
  ) {
    return 0;
  }


  return Math.round(
    (
      value /
      total
    ) *
      100
  );
}


// =====================================================
// JAKARTA DATE
// =====================================================

function getJakartaDate() {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "Asia/Jakarta",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).formatToParts(
      new Date()
    );


  const year =
    parts.find(
      (
        part
      ) =>
        part.type ===
        "year"
    )?.value;


  const month =
    parts.find(
      (
        part
      ) =>
        part.type ===
        "month"
    )?.value;


  const day =
    parts.find(
      (
        part
      ) =>
        part.type ===
        "day"
    )?.value;


  return `${year}-${month}-${day}`;
}


// =====================================================
// CURRENT DATE
// =====================================================

function formatCurrentDate() {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      timeZone:
        "Asia/Jakarta",

      weekday:
        "long",

      day:
        "numeric",

      month:
        "long",

      year:
        "numeric",
    }
  ).format(
    new Date()
  );
}


// =====================================================
// ADD DAYS
// =====================================================

function addDays(dateString: string, days: number) {
  // Operasi pada tanggal kalender, tanpa bergantung zona waktu browser/server.
  const date = tanggalUTC(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}


// =====================================================
// NORMALIZE STATUS
// =====================================================

function normalizeStatus(
  value:
    | string
    | null
    | undefined
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
// TASK WAITING
// =====================================================

function isTaskWaitingForReview(
  status:
    | string
    | null,

  dikumpulkanAt:
    | string
    | null
) {
  if (
    !dikumpulkanAt
  ) {
    return false;
  }


  const normalized =
    normalizeStatus(
      status
    );


  if (
    normalized ===
      "disetujui" ||
    normalized ===
      "selesai" ||
    normalized ===
      "approved"
  ) {
    return false;
  }


  if (
    normalized ===
      "revisi" ||
    normalized ===
      "direvisi" ||
    normalized ===
      "perlu_revisi" ||
    normalized ===
      "perlu_perbaikan" ||
    normalized ===
      "ditolak" ||
    normalized ===
      "rejected"
  ) {
    return false;
  }


  return true;
}


// =====================================================
// INITIAL
// =====================================================

function getInitial(
  nama: string
) {
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


// =====================================================
// DASHBOARD DATE
// =====================================================

function formatDashboardDate(
  value: string
) {
  if (!value) {
    return "-";
  }


  let date:
    Date;


  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    date =
      new Date(
        `${value}T00:00:00+07:00`
      );

  } else {
    date =
      new Date(
        value
      );
  }


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
        "short",

      year:
        "numeric",
    }
  ).format(
    date
  );
}


// =====================================================
// SHORT DATE
// =====================================================

function formatShortDate(
  value: string
) {
  if (!value) {
    return "";
  }


  const date =
    new Date(
      `${value}T00:00:00+07:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }


  return new Intl.DateTimeFormat(
    "id-ID",
    {
      timeZone:
        "Asia/Jakarta",

      day:
        "numeric",

      month:
        "long",
    }
  ).format(
    date
  );
}


// =====================================================
// EVALUATION TYPE
// =====================================================

function formatEvaluationType(
  value:
    | string
    | null
) {
  switch (
    value
  ) {
    case "mingguan":
      return "Evaluasi Mingguan";

    case "bulanan":
      return "Evaluasi Bulanan";

    case "tengah_periode":
      return "Evaluasi Tengah Periode";

    case "akhir":
      return "Evaluasi Akhir";

    case "lainnya":
      return "Evaluasi Lainnya";

    default:
      return "Evaluasi";
  }
}


// =====================================================
// EVALUATION TIME
// =====================================================

function formatEvaluationTime(
  start:
    | string
    | null,

  end:
    | string
    | null
) {
  const formatTime = (
    value:
      | string
      | null
  ) => {
    if (!value) {
      return "-";
    }


    return value
      .slice(
        0,
        5
      )
      .replace(
        ":",
        "."
      );
  };


  const startTime =
    formatTime(
      start
    );


  if (!end) {
    return startTime;
  }


  return `${startTime} - ${formatTime(
    end
  )}`;
}