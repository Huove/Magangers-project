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
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  School,
  UserCheck,
  UserRound,
  Users,
  XCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";


// =====================================================
// TAB
// =====================================================

type TabType =
  | "ringkasan"
  | "absensi"
  | "tugas"
  | "jurnal"
  | "izin"
  | "laporan"
  | "nilai";


// =====================================================
// PROFILE
// =====================================================

type ParticipantDetail = {
  id: string;

  userId:
    | string
    | null;

  nama: string;

  fotoUrl:
    | string
    | null;

  email: string;

  nomorHp: string;

  nomorPeserta: string;

  status: string;

  sekolah: string;

  jurusan: string;

  kelas: string;

  divisi: string;

  posisi: string;

  tanggalMulai:
    | string
    | null;

  tanggalSelesai:
    | string
    | null;

  progress: number;
};


// =====================================================
// ABSENSI
// =====================================================

type AbsensiItem = {
  id: string;

  tanggal: string;

  jamMasuk:
    | string
    | null;

  jamPulang:
    | string
    | null;

  status: string;

  catatan:
    | string
    | null;
};


// =====================================================
// TUGAS
// =====================================================

type TugasItem = {
  assignmentId: string;

  tugasId: string;

  judul: string;

  deskripsi: string;

  deadline:
    | string
    | null;

  status: string;

  jawaban:
    | string
    | null;

  fileUrl:
    | string
    | null;

  dikumpulkanAt:
    | string
    | null;
};


// =====================================================
// JURNAL
// =====================================================

type JurnalItem = {
  id: string;

  tanggal: string;

  judul: string;

  kegiatan: string;

  hasil:
    | string
    | null;

  status: string;

  fileUrl:
    | string
    | null;
};


// =====================================================
// IZIN
// =====================================================

type IzinItem = {
  id: string;

  tanggalMulai: string;

  tanggalSelesai: string;

  alasan: string;

  status: string;

  catatan:
    | string
    | null;

  fileBuktiUrl:
    | string
    | null;
};


// =====================================================
// LAPORAN
// =====================================================

type LaporanItem = {
  id: string;

  tipe:
    string | null;

  judul: string;

  periode:
    string | null;

  status:
    string | null;

  fileUrl:
    string | null;

  createdAt:
    string;
};


// =====================================================
// NILAI
// =====================================================

type PenilaianData = {
  kedisiplinan:
    number | null;

  tanggungJawab:
    number | null;

  kerjasama:
    number | null;

  kemampuanTeknis:
    number | null;

  nilaiAkhir:
    number | null;

  catatan:
    string | null;
};


// =====================================================
// PAGE
// =====================================================

export default function ParticipantDetailPage() {
  const params =
    useParams<{
      id: string;
    }>();


  const pesertaId =
    params?.id;


  // ===================================================
  // STATE
  // ===================================================

  const [
    participant,
    setParticipant,
  ] =
    useState<
      ParticipantDetail | null
    >(null);


  const [
    absensi,
    setAbsensi,
  ] =
    useState<
      AbsensiItem[]
    >([]);


  const [
    tugas,
    setTugas,
  ] =
    useState<
      TugasItem[]
    >([]);


  const [
    jurnal,
    setJurnal,
  ] =
    useState<
      JurnalItem[]
    >([]);


  const [
    izin,
    setIzin,
  ] =
    useState<
      IzinItem[]
    >([]);


  const [
    laporan,
    setLaporan,
  ] =
    useState<
      LaporanItem[]
    >([]);


  const [
    penilaian,
    setPenilaian,
  ] =
    useState<
      PenilaianData | null
    >(null);


  const [
    activeTab,
    setActiveTab,
  ] =
    useState<TabType>(
      "ringkasan"
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


  // ===================================================
  // FETCH
  // ===================================================

  const fetchParticipant =
    useCallback(
      async () => {
        if (
          !pesertaId
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
              supervisor,
            error:
              supervisorError,
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
            supervisorError
          ) {
            throw supervisorError;
          }


          if (
            !supervisor
          ) {
            throw new Error(
              "Data pembimbing tidak ditemukan."
            );
          }


          // =============================================
          // 3. VERIFIKASI PENEMPATAN
          //
          // Pastikan peserta memang milik
          // pembimbing yang sedang login.
          // =============================================

          const {
            data:
              placement,
            error:
              placementError,
          } =
            await supabase
              .from(
                "penempatan"
              )
              .select(`
                id,
                peserta_id,
                pembimbing_id,
                divisi,
                posisi,
                tanggal_mulai,
                tanggal_selesai
              `)
              .eq(
                "peserta_id",
                pesertaId
              )
              .eq(
                "pembimbing_id",
                supervisor.id
              )
              .maybeSingle();


          if (
            placementError
          ) {
            throw placementError;
          }


          if (
            !placement
          ) {
            throw new Error(
              "Peserta tidak ditemukan atau bukan peserta bimbingan Anda."
            );
          }


          // =============================================
          // 4. DATA PESERTA
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
                nama_lengkap,
                email,
                nomor_hp,
                status,
                tanggal_mulai,
                tanggal_selesai
              `)
              .eq(
                "id",
                pesertaId
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
          // 5. PROFILE
          // =============================================

          let profile:
            {
              nama_lengkap:
                string | null;

              email:
                string | null;

              nomor_hp:
                string | null;

              foto_url:
                string | null;
            } | null =
            null;


          if (
            peserta.user_id
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
                  nama_lengkap,
                  email,
                  nomor_hp,
                  foto_url
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
            } else {
              profile =
                profileData;
            }
          }


          // =============================================
          // 6. PENDIDIKAN
          // =============================================

          const {
            data:
              educationData,
            error:
              educationError,
          } =
            await supabase
              .from(
                "pendidikan"
              )
              .select(`
                sekolah,
                jurusan,
                kelas
              `)
              .eq(
                "peserta_id",
                pesertaId
              )
              .limit(
                1
              )
              .maybeSingle();


          if (
            educationError
          ) {
            console.error(
              "PENDIDIKAN ERROR:",
              educationError
            );
          }


          // =============================================
          // 7. PERIODE
          // =============================================

          const tanggalMulai =
            placement
              .tanggal_mulai ||

            peserta
              .tanggal_mulai ||

            null;


          const tanggalSelesai =
            placement
              .tanggal_selesai ||

            peserta
              .tanggal_selesai ||

            null;


          const statusPeserta =
            peserta.status ??
            "tidak_aktif";


          // =============================================
          // 8. SET PROFILE
          // =============================================

          setParticipant({
            id:
              peserta.id,

            userId:
              peserta.user_id,

            nama:
              peserta
                .nama_lengkap ||

              profile
                ?.nama_lengkap ||

              "Peserta",

            fotoUrl:
              profile
                ?.foto_url ??
              null,

            email:
              peserta.email ||

              profile
                ?.email ||

              "-",

            nomorHp:
              peserta
                .nomor_hp ||

              profile
                ?.nomor_hp ||

              "-",

            nomorPeserta:
              peserta
                .nomor_peserta ??
              "-",

            status:
              statusPeserta,

            sekolah:
              educationData
                ?.sekolah ??
              "-",

            jurusan:
              educationData
                ?.jurusan ??
              "-",

            kelas:
              educationData
                ?.kelas ??
              "-",

            divisi:
              placement
                .divisi ??
              "-",

            posisi:
              placement
                .posisi ??
              "-",

            tanggalMulai,

            tanggalSelesai,

            progress:
              calculateProgress(
                statusPeserta,
                tanggalMulai,
                tanggalSelesai
              ),
          });


          // =============================================
          // 9. AMBIL DATA KEGIATAN
          // =============================================

          const [
            absensiResult,
            tugasPesertaResult,
            jurnalResult,
            izinResult,
            laporanResult,
            nilaiResult,
          ] =
            await Promise.all([
              // =========================================
              // ABSENSI
              // =========================================

              supabase
                .from(
                  "absensi"
                )
                .select(`
                  id,
                  tanggal,
                  jam_masuk,
                  jam_pulang,
                  status,
                  catatan
                `)
                .eq(
                  "peserta_id",
                  pesertaId
                )
                .order(
                  "tanggal",
                  {
                    ascending:
                      false,
                  }
                ),


              // =========================================
              // TUGAS PESERTA
              // =========================================

              supabase
                .from(
                  "tugas_peserta"
                )
                .select(`
                  id,
                  tugas_id,
                  status,
                  jawaban,
                  file_url,
                  dikumpulkan_at,
                  created_at
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
                ),


              // =========================================
              // JURNAL
              // =========================================

              supabase
                .from(
                  "jurnal"
                )
                .select(`
                  id,
                  tanggal,
                  judul,
                  kegiatan,
                  hasil,
                  file_url,
                  status,
                  created_at
                `)
                .eq(
                  "peserta_id",
                  pesertaId
                )
                .order(
                  "tanggal",
                  {
                    ascending:
                      false,
                  }
                ),


              // =========================================
              // IZIN
              // =========================================

              supabase
                .from(
                  "pengajuan_izin"
                )
                .select(`
                  id,
                  tanggal_mulai,
                  tanggal_selesai,
                  alasan,
                  file_bukti_url,
                  status,
                  catatan,
                  created_at
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
                ),


              // =========================================
              // LAPORAN
              // =========================================

              supabase
                .from(
                  "laporan"
                )
                .select(`
                  id,
                  tipe,
                  judul,
                  periode,
                  status,
                  file_url,
                  created_at
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
                ),


              // =========================================
              // PENILAIAN
              // =========================================

              supabase
                .from(
                  "penilaian"
                )
                .select(`
                  kedisiplinan,
                  tanggung_jawab,
                  kerjasama,
                  kemampuan_teknis,
                  nilai_akhir,
                  catatan
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
            ]);


          // =============================================
          // 10. ABSENSI
          // =============================================

          if (
            absensiResult.error
          ) {
            console.error(
              "ABSENSI ERROR:",
              absensiResult.error
            );
          } else {
            setAbsensi(
              (
                absensiResult.data ??
                []
              ).map(
                (
                  item
                ) => ({
                  id:
                    item.id,

                  tanggal:
                    item.tanggal,

                  jamMasuk:
                    item.jam_masuk,

                  jamPulang:
                    item.jam_pulang,

                  status:
                    item.status,

                  catatan:
                    item.catatan,
                })
              )
            );
          }


          // =============================================
          // 11. TUGAS
          // =============================================

          if (
            tugasPesertaResult.error
          ) {
            console.error(
              "TUGAS PESERTA ERROR:",
              tugasPesertaResult.error
            );
          } else {
            const assignments =
              tugasPesertaResult
                .data ??
              [];


            const taskIds = [
              ...new Set(
                assignments.map(
                  (
                    item
                  ) =>
                    item.tugas_id
                )
              ),
            ];


            const taskMap =
              new Map<
                string,
                {
                  judul:
                    string;

                  deskripsi:
                    string | null;

                  deadline:
                    string | null;
                }
              >();


            if (
              taskIds.length >
              0
            ) {
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
                    deskripsi,
                    deadline,
                    pembimbing_id
                  `)
                  .in(
                    "id",
                    taskIds
                  )
                  .eq(
                    "pembimbing_id",
                    supervisor.id
                  );


              if (
                taskError
              ) {
                console.error(
                  "TUGAS ERROR:",
                  taskError
                );
              } else {
                for (
                  const task
                  of taskData ??
                  []
                ) {
                  taskMap.set(
                    task.id,
                    {
                      judul:
                        task.judul,

                      deskripsi:
                        task.deskripsi,

                      deadline:
                        task.deadline,
                    }
                  );
                }
              }
            }


            const formattedTasks:
              TugasItem[] =
              assignments
                .filter(
                  (
                    assignment
                  ) =>
                    taskMap.has(
                      assignment
                        .tugas_id
                    )
                )
                .map(
                  (
                    assignment
                  ) => {
                    const task =
                      taskMap.get(
                        assignment
                          .tugas_id
                      )!;


                    return {
                      assignmentId:
                        assignment.id,

                      tugasId:
                        assignment
                          .tugas_id,

                      judul:
                        task.judul,

                      deskripsi:
                        task.deskripsi ??
                        "-",

                      deadline:
                        task.deadline,

                      status:
                        assignment
                          .status ??
                        "belum_dikerjakan",

                      jawaban:
                        assignment
                          .jawaban,

                      fileUrl:
                        assignment
                          .file_url,

                      dikumpulkanAt:
                        assignment
                          .dikumpulkan_at,
                    };
                  }
                );


            setTugas(
              formattedTasks
            );
          }


          // =============================================
          // 12. JURNAL
          // =============================================

          if (
            jurnalResult.error
          ) {
            console.error(
              "JURNAL ERROR:",
              jurnalResult.error
            );
          } else {
            setJurnal(
              (
                jurnalResult.data ??
                []
              ).map(
                (
                  item
                ) => ({
                  id:
                    item.id,

                  tanggal:
                    item.tanggal,

                  judul:
                    item.judul ||
                    "Jurnal Kegiatan",

                  kegiatan:
                    item.kegiatan,

                  hasil:
                    item.hasil,

                  status:
                    item.status ||
                    "menunggu",

                  fileUrl:
                    item.file_url,
                })
              )
            );
          }


          // =============================================
          // 13. IZIN
          // =============================================

          if (
            izinResult.error
          ) {
            console.error(
              "IZIN ERROR:",
              izinResult.error
            );
          } else {
            setIzin(
              (
                izinResult.data ??
                []
              ).map(
                (
                  item
                ) => ({
                  id:
                    item.id,

                  tanggalMulai:
                    item
                      .tanggal_mulai,

                  tanggalSelesai:
                    item
                      .tanggal_selesai,

                  alasan:
                    item.alasan,

                  status:
                    item.status ??
                    "menunggu",

                  catatan:
                    item.catatan,

                  fileBuktiUrl:
                    item
                      .file_bukti_url,
                })
              )
            );
          }


          // =============================================
          // 14. LAPORAN
          // =============================================

          if (
            laporanResult.error
          ) {
            console.error(
              "LAPORAN ERROR:",
              laporanResult.error
            );
          } else {
            setLaporan(
              (
                laporanResult.data ??
                []
              ).map(
                (
                  item
                ) => ({
                  id:
                    item.id,

                  tipe:
                    item.tipe,

                  judul:
                    item.judul,

                  periode:
                    item.periode,

                  status:
                    item.status,

                  fileUrl:
                    item.file_url,

                  createdAt:
                    item.created_at,
                })
              )
            );
          }


          // =============================================
          // 15. NILAI
          // =============================================

          if (
            nilaiResult.error
          ) {
            console.error(
              "PENILAIAN ERROR:",
              nilaiResult.error
            );


            setPenilaian(
              null
            );
          } else if (
            nilaiResult.data
          ) {
            setPenilaian({
              kedisiplinan:
                nilaiResult.data
                  .kedisiplinan,

              tanggungJawab:
                nilaiResult.data
                  .tanggung_jawab,

              kerjasama:
                nilaiResult.data
                  .kerjasama,

              kemampuanTeknis:
                nilaiResult.data
                  .kemampuan_teknis,

              nilaiAkhir:
                nilaiResult.data
                  .nilai_akhir,

              catatan:
                nilaiResult.data
                  .catatan,
            });
          } else {
            setPenilaian(
              null
            );
          }

        } catch (
          err
        ) {
          console.error(
            "PARTICIPANT DETAIL ERROR:",
            err
          );


          setParticipant(
            null
          );


          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil detail peserta."
          );

        } finally {
          setLoading(
            false
          );
        }
      },
      [
        pesertaId,
      ]
    );


  // ===================================================
  // LOAD
  // ===================================================

  useEffect(() => {
    fetchParticipant();
  }, [
    fetchParticipant,
  ]);


  // ===================================================
  // SUMMARY
  // ===================================================

  const summary =
    useMemo(
      () => {
        const hadir =
          absensi.filter(
            (
              item
            ) =>
              normalizeStatus(
                item.status
              ) ===
              "hadir"
          ).length;


        const terlambat =
          absensi.filter(
            (
              item
            ) =>
              normalizeStatus(
                item.status
              ) ===
              "terlambat"
          ).length;


        const izinCount =
          absensi.filter(
            (
              item
            ) => {
              const status =
                normalizeStatus(
                  item.status
                );


              return (
                status ===
                  "izin" ||
                status ===
                  "sakit"
              );
            }
          ).length;


        const tugasSelesai =
          tugas.filter(
            (
              item
            ) =>
              isCompletedStatus(
                item.status
              )
          ).length;


        const jurnalDisetujui =
          jurnal.filter(
            (
              item
            ) =>
              isCompletedStatus(
                item.status
              )
          ).length;


        return {
          hadir,

          terlambat,

          izin:
            izinCount,

          tugasSelesai,

          jurnalDisetujui,
        };
      },
      [
        absensi,
        tugas,
        jurnal,
      ]
    );


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
            Memuat detail peserta...
          </p>

        </div>

      </div>
    );
  }


  // ===================================================
  // ERROR
  // ===================================================

  if (
    !participant
  ) {
    return (
      <div>

        <Link
          href="/dashboard-pembina/peserta"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />

          Kembali
        </Link>


        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-10 text-center">

          <AlertCircle className="mx-auto h-9 w-9 text-red-500" />


          <h2 className="mt-3 font-bold text-red-700">
            Peserta tidak dapat ditampilkan
          </h2>


          <p className="mt-2 text-sm text-red-600">
            {error ||
              "Peserta tidak ditemukan."}
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
        href="/dashboard-pembina/peserta"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />

        Kembali ke Peserta Bimbingan
      </Link>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>

      )}


      {/* =================================================
          PROFILE HEADER
      ================================================= */}

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          {/* PROFILE */}

          <div className="flex items-center gap-4">

            {participant.fotoUrl ? (

              <img
                src={
                  participant.fotoUrl
                }
                alt={
                  participant.nama
                }
                className="h-20 w-20 rounded-full object-cover"
              />

            ) : (

              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-xl font-bold text-blue-600">
                {getInisial(
                  participant.nama
                )}
              </div>

            )}


            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-2xl font-extrabold text-slate-900">
                  {participant.nama}
                </h1>


                <ParticipantStatusBadge
                  status={
                    participant.status
                  }
                />

              </div>


              <p className="mt-1 text-sm text-slate-500">
                {participant.nomorPeserta}
              </p>


              <p className="mt-1 text-sm font-medium text-blue-600">
                {participant.posisi}
              </p>

            </div>

          </div>


          {/* PROGRESS */}

          <div className="w-full max-w-xs">

            <div className="mb-2 flex items-center justify-between">

              <p className="text-sm font-medium text-slate-500">
                Progress Magang
              </p>


              <p className="text-sm font-bold text-blue-600">
                {participant.progress}%
              </p>

            </div>


            <div className="h-2 overflow-hidden rounded-full bg-slate-100">

              <div
                className="h-full rounded-full bg-brand-blue transition-all"
                style={{
                  width:
                    `${participant.progress}%`,
                }}
              />

            </div>


            <p className="mt-2 text-xs text-slate-400">
              {formatPeriode(
                participant.tanggalMulai,
                participant.tanggalSelesai
              )}
            </p>

          </div>

        </div>

      </section>


      {/* =================================================
          INFORMATION
      ================================================= */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <InfoCard
          icon={
            School
          }
          label="Sekolah / Kampus"
          value={
            participant.sekolah
          }
          secondary={
            participant.jurusan
          }
        />


        <InfoCard
          icon={
            BriefcaseBusiness
          }
          label="Penempatan"
          value={
            participant.divisi
          }
          secondary={
            participant.posisi
          }
        />


        <InfoCard
          icon={
            Mail
          }
          label="Email"
          value={
            participant.email
          }
          secondary={
            participant.nomorHp
          }
        />


        <InfoCard
          icon={
            CalendarDays
          }
          label="Periode Magang"
          value={
            formatTanggal(
              participant.tanggalMulai
            )
          }
          secondary={`s/d ${formatTanggal(
            participant.tanggalSelesai
          )}`}
        />

      </section>


      {/* =================================================
          TABS
      ================================================= */}

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">

        <div className="overflow-x-auto border-b border-slate-100">

          <div className="flex min-w-max px-4">

            <TabButton
              label="Ringkasan"
              active={
                activeTab ===
                "ringkasan"
              }
              onClick={() =>
                setActiveTab(
                  "ringkasan"
                )
              }
            />


            <TabButton
              label={`Absensi (${absensi.length})`}
              active={
                activeTab ===
                "absensi"
              }
              onClick={() =>
                setActiveTab(
                  "absensi"
                )
              }
            />


            <TabButton
              label={`Tugas (${tugas.length})`}
              active={
                activeTab ===
                "tugas"
              }
              onClick={() =>
                setActiveTab(
                  "tugas"
                )
              }
            />


            <TabButton
              label={`Jurnal (${jurnal.length})`}
              active={
                activeTab ===
                "jurnal"
              }
              onClick={() =>
                setActiveTab(
                  "jurnal"
                )
              }
            />


            <TabButton
              label={`Izin (${izin.length})`}
              active={
                activeTab ===
                "izin"
              }
              onClick={() =>
                setActiveTab(
                  "izin"
                )
              }
            />


            <TabButton
              label={`Laporan (${laporan.length})`}
              active={
                activeTab ===
                "laporan"
              }
              onClick={() =>
                setActiveTab(
                  "laporan"
                )
              }
            />


            <TabButton
              label="Nilai"
              active={
                activeTab ===
                "nilai"
              }
              onClick={() =>
                setActiveTab(
                  "nilai"
                )
              }
            />

          </div>

        </div>


        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="p-6">

          {/* ===============================================
              RINGKASAN
          =============================================== */}

          {activeTab ===
            "ringkasan" && (

            <div className="space-y-6">

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

                <SummaryCard
                  icon={
                    UserCheck
                  }
                  label="Hadir"
                  value={
                    summary.hadir
                  }
                  className="bg-emerald-50 text-emerald-600"
                />


                <SummaryCard
                  icon={
                    Clock3
                  }
                  label="Terlambat"
                  value={
                    summary.terlambat
                  }
                  className="bg-amber-50 text-amber-600"
                />


                <SummaryCard
                  icon={
                    CalendarDays
                  }
                  label="Izin / Sakit"
                  value={
                    summary.izin
                  }
                  className="bg-blue-50 text-blue-600"
                />


                <SummaryCard
                  icon={
                    ClipboardCheck
                  }
                  label="Tugas Selesai"
                  value={
                    summary.tugasSelesai
                  }
                  className="bg-purple-50 text-purple-600"
                />


                <SummaryCard
                  icon={
                    BookOpen
                  }
                  label="Jurnal Disetujui"
                  value={
                    summary.jurnalDisetujui
                  }
                  className="bg-cyan-50 text-cyan-600"
                />

              </div>


              {/* DETAIL */}

              <div className="rounded-2xl bg-slate-50 p-5">

                <h2 className="font-bold text-slate-900">
                  Informasi Peserta
                </h2>


                <div className="mt-5 grid gap-5 sm:grid-cols-2">

                  <DetailRow
                    label="Nama Lengkap"
                    value={
                      participant.nama
                    }
                  />


                  <DetailRow
                    label="Nomor Peserta"
                    value={
                      participant.nomorPeserta
                    }
                  />


                  <DetailRow
                    label="Email"
                    value={
                      participant.email
                    }
                  />


                  <DetailRow
                    label="Nomor HP"
                    value={
                      participant.nomorHp
                    }
                  />


                  <DetailRow
                    label="Sekolah / Kampus"
                    value={
                      participant.sekolah
                    }
                  />


                  <DetailRow
                    label="Jurusan"
                    value={
                      participant.jurusan
                    }
                  />


                  <DetailRow
                    label="Kelas"
                    value={
                      participant.kelas
                    }
                  />


                  <DetailRow
                    label="Divisi"
                    value={
                      participant.divisi
                    }
                  />


                  <DetailRow
                    label="Posisi"
                    value={
                      participant.posisi
                    }
                  />


                  <DetailRow
                    label="Status"
                    value={
                      formatStatusPeserta(
                        participant.status
                      )
                    }
                  />

                </div>

              </div>

            </div>

          )}


          {/* ===============================================
              ABSENSI
          =============================================== */}

          {activeTab ===
            "absensi" && (

            <DataSection
              empty={
                absensi.length ===
                0
              }
              emptyText="Belum ada riwayat absensi."
            >

              <div className="overflow-x-auto">

                <table className="w-full min-w-[700px] text-left text-sm">

                  <thead>

                    <tr className="border-b border-slate-100 text-slate-400">

                      <th className="pb-3 font-medium">
                        Tanggal
                      </th>

                      <th className="pb-3 font-medium">
                        Masuk
                      </th>

                      <th className="pb-3 font-medium">
                        Pulang
                      </th>

                      <th className="pb-3 font-medium">
                        Status
                      </th>

                      <th className="pb-3 font-medium">
                        Catatan
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {absensi.map(
                      (
                        item
                      ) => (

                      <tr
                        key={
                          item.id
                        }
                        className="border-b border-slate-50 last:border-0"
                      >

                        <td className="py-4 text-slate-600">
                          {formatTanggal(
                            item.tanggal
                          )}
                        </td>


                        <td className="py-4 text-slate-600">
                          {formatJam(
                            item.jamMasuk
                          )}
                        </td>


                        <td className="py-4 text-slate-600">
                          {formatJam(
                            item.jamPulang
                          )}
                        </td>


                        <td className="py-4">

                          <SimpleStatusBadge
                            status={
                              item.status
                            }
                          />

                        </td>


                        <td className="py-4 text-slate-500">
                          {item.catatan ||
                            "-"}
                        </td>

                      </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            </DataSection>

          )}


          {/* ===============================================
              TUGAS
          =============================================== */}

          {activeTab ===
            "tugas" && (

            <DataSection
              empty={
                tugas.length ===
                0
              }
              emptyText="Belum ada tugas untuk peserta ini."
            >

              <div className="space-y-4">

                {tugas.map(
                  (
                    item
                  ) => (

                  <div
                    key={
                      item.assignmentId
                    }
                    className="rounded-2xl border border-slate-100 p-5"
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div>

                        <h3 className="font-bold text-slate-900">
                          {item.judul}
                        </h3>


                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {item.deskripsi}
                        </p>

                      </div>


                      <SimpleStatusBadge
                        status={
                          item.status
                        }
                      />

                    </div>


                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">

                      <span>
                        Deadline:{" "}
                        {item.deadline
                          ? formatDateTime(
                              item.deadline
                            )
                          : "-"}
                      </span>


                      <span>
                        Dikumpulkan:{" "}
                        {item.dikumpulkanAt
                          ? formatDateTime(
                              item.dikumpulkanAt
                            )
                          : "Belum"}
                      </span>

                    </div>


                    <div className="mt-4 flex flex-wrap gap-2">

                      <Link
                        href={`/dashboard-pembina/tugas/${item.tugasId}`}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                      >
                        Lihat Detail
                      </Link>


                      {item.fileUrl && (

                        <a
                          href={
                            item.fileUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                        >
                          File

                          <ExternalLink className="h-3 w-3" />
                        </a>

                      )}

                    </div>

                  </div>

                  )
                )}

              </div>

            </DataSection>

          )}


          {/* ===============================================
              JURNAL
          =============================================== */}

          {activeTab ===
            "jurnal" && (

            <DataSection
              empty={
                jurnal.length ===
                0
              }
              emptyText="Belum ada jurnal peserta."
            >

              <div className="space-y-4">

                {jurnal.map(
                  (
                    item
                  ) => (

                  <div
                    key={
                      item.id
                    }
                    className="rounded-2xl border border-slate-100 p-5"
                  >

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                      <div>

                        <p className="text-xs font-medium text-blue-600">
                          {formatTanggal(
                            item.tanggal
                          )}
                        </p>


                        <h3 className="mt-1 font-bold text-slate-900">
                          {item.judul}
                        </h3>


                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {item.kegiatan}
                        </p>

                      </div>


                      <SimpleStatusBadge
                        status={
                          item.status
                        }
                      />

                    </div>


                    {item.hasil && (

                      <div className="mt-4 rounded-xl bg-slate-50 p-4">

                        <p className="text-xs font-semibold text-slate-400">
                          HASIL
                        </p>


                        <p className="mt-1 text-sm text-slate-600">
                          {item.hasil}
                        </p>

                      </div>

                    )}


                    {item.fileUrl && (

                      <a
                        href={
                          item.fileUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
                      >
                        Lihat lampiran

                        <ExternalLink className="h-3 w-3" />
                      </a>

                    )}

                  </div>

                  )
                )}

              </div>

            </DataSection>

          )}


          {/* ===============================================
              IZIN
          =============================================== */}

          {activeTab ===
            "izin" && (

            <DataSection
              empty={
                izin.length ===
                0
              }
              emptyText="Belum ada pengajuan izin."
            >

              <div className="space-y-4">

                {izin.map(
                  (
                    item
                  ) => (

                  <div
                    key={
                      item.id
                    }
                    className="rounded-2xl border border-slate-100 p-5"
                  >

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">

                      <div>

                        <p className="text-xs text-slate-400">
                          {formatTanggal(
                            item.tanggalMulai
                          )}

                          {" - "}

                          {formatTanggal(
                            item.tanggalSelesai
                          )}
                        </p>


                        <p className="mt-2 font-semibold text-slate-900">
                          {item.alasan}
                        </p>

                      </div>


                      <SimpleStatusBadge
                        status={
                          item.status
                        }
                      />

                    </div>


                    {item.catatan && (

                      <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                        Catatan:{" "}
                        {item.catatan}
                      </p>

                    )}


                    <div className="mt-3 flex gap-3">

                      <Link
                        href={`/dashboard-pembina/izin/${item.id}`}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Detail Izin
                      </Link>


                      {item.fileBuktiUrl && (

                        <a
                          href={
                            item.fileBuktiUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"
                        >
                          Bukti

                          <ExternalLink className="h-3 w-3" />
                        </a>

                      )}

                    </div>

                  </div>

                  )
                )}

              </div>

            </DataSection>

          )}


          {/* ===============================================
              LAPORAN
          =============================================== */}

          {activeTab ===
            "laporan" && (

            <DataSection
              empty={
                laporan.length ===
                0
              }
              emptyText="Belum ada laporan peserta."
            >

              <div className="space-y-4">

                {laporan.map(
                  (
                    item
                  ) => (

                  <div
                    key={
                      item.id
                    }
                    className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div>

                      <p className="text-xs font-medium text-blue-600">
                        {item.tipe ||
                          "Laporan"}
                      </p>


                      <h3 className="mt-1 font-bold text-slate-900">
                        {item.judul}
                      </h3>


                      <p className="mt-1 text-xs text-slate-400">
                        {item.periode ||
                          formatDateTime(
                            item.createdAt
                          )}
                      </p>

                    </div>


                    <div className="flex items-center gap-3">

                      <SimpleStatusBadge
                        status={
                          item.status ||
                          "menunggu"
                        }
                      />


                      {item.fileUrl && (

                        <a
                          href={
                            item.fileUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>

                      )}

                    </div>

                  </div>

                  )
                )}

              </div>

            </DataSection>

          )}


          {/* ===============================================
              NILAI
          =============================================== */}

          {activeTab ===
            "nilai" && (

            <div>

              {!penilaian ? (

                <EmptyState
                  text="Belum ada penilaian untuk peserta ini."
                />

              ) : (

                <div className="space-y-6">

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

                    <ScoreCard
                      label="Kedisiplinan"
                      value={
                        penilaian.kedisiplinan
                      }
                    />


                    <ScoreCard
                      label="Tanggung Jawab"
                      value={
                        penilaian.tanggungJawab
                      }
                    />


                    <ScoreCard
                      label="Kerja Sama"
                      value={
                        penilaian.kerjasama
                      }
                    />


                    <ScoreCard
                      label="Teknis"
                      value={
                        penilaian.kemampuanTeknis
                      }
                    />


                    <ScoreCard
                      label="Nilai Akhir"
                      value={
                        penilaian.nilaiAkhir
                      }
                      primary
                    />

                  </div>


                  <div className="rounded-2xl bg-slate-50 p-5">

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Catatan Penilaian
                    </p>


                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {penilaian.catatan ||
                        "Belum ada catatan penilaian."}
                    </p>

                  </div>

                </div>

              )}

            </div>

          )}

        </div>

      </section>

    </div>
  );
}


// =====================================================
// TAB BUTTON
// =====================================================

function TabButton({
  label,
  active,
  onClick,
}: {
  label:
    string;

  active:
    boolean;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`relative px-4 py-4 text-sm font-semibold transition-colors ${
        active
          ? "text-blue-600"
          : "text-slate-400 hover:text-slate-600"
      }`}
    >
      {label}


      {active && (

        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-600" />

      )}

    </button>
  );
}


// =====================================================
// INFO CARD
// =====================================================

function InfoCard({
  icon: Icon,
  label,
  value,
  secondary,
}: {
  icon:
    ElementType;

  label:
    string;

  value:
    string;

  secondary?:
    string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">

      <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">

        <Icon className="h-4 w-4" />

      </div>


      <p className="mt-3 text-xs text-slate-400">
        {label}
      </p>


      <p className="mt-1 break-words text-sm font-bold text-slate-800">
        {value}
      </p>


      {secondary &&
        secondary !==
          "-" && (

        <p className="mt-1 text-xs text-slate-400">
          {secondary}
        </p>

      )}

    </div>
  );
}


// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
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
    <div className="rounded-2xl border border-slate-100 p-4">

      <div
        className={`grid h-9 w-9 place-items-center rounded-xl ${className}`}
      >
        <Icon className="h-4 w-4" />
      </div>


      <p className="mt-3 text-2xl font-extrabold text-slate-900">
        {value}
      </p>


      <p className="mt-0.5 text-xs text-slate-500">
        {label}
      </p>

    </div>
  );
}


// =====================================================
// DETAIL ROW
// =====================================================

function DetailRow({
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

      <p className="text-xs text-slate-400">
        {label}
      </p>


      <p className="mt-1 text-sm font-semibold text-slate-700">
        {value}
      </p>

    </div>
  );
}


// =====================================================
// DATA SECTION
// =====================================================

function DataSection({
  empty,
  emptyText,
  children,
}: {
  empty:
    boolean;

  emptyText:
    string;

  children:
    React.ReactNode;
}) {
  if (
    empty
  ) {
    return (
      <EmptyState
        text={
          emptyText
        }
      />
    );
  }


  return (
    <>
      {children}
    </>
  );
}


// =====================================================
// EMPTY
// =====================================================

function EmptyState({
  text,
}: {
  text:
    string;
}) {
  return (
    <div className="py-14 text-center">

      <FileText className="mx-auto h-8 w-8 text-slate-300" />


      <p className="mt-3 text-sm text-slate-400">
        {text}
      </p>

    </div>
  );
}


// =====================================================
// SCORE
// =====================================================

function ScoreCard({
  label,
  value,
  primary = false,
}: {
  label:
    string;

  value:
    number | null;

  primary?:
    boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${
        primary
          ? "bg-blue-600 text-white"
          : "border border-slate-100 bg-white"
      }`}
    >

      <p
        className={`text-xs ${
          primary
            ? "text-blue-100"
            : "text-slate-400"
        }`}
      >
        {label}
      </p>


      <p
        className={`mt-2 text-3xl font-extrabold ${
          primary
            ? "text-white"
            : "text-slate-900"
        }`}
      >
        {formatNilai(
          value
        )}
      </p>

    </div>
  );
}


// =====================================================
// PARTICIPANT STATUS
// =====================================================

function ParticipantStatusBadge({
  status,
}: {
  status:
    string;
}) {
  const normalized =
    normalizeStatus(
      status
    );


  if (
    normalized ===
    "aktif"
  ) {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
        Aktif
      </span>
    );
  }


  if (
    normalized ===
    "diterima"
  ) {
    return (
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
        Diterima
      </span>
    );
  }


  if (
    normalized ===
    "selesai"
  ) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
        Selesai
      </span>
    );
  }


  return (
    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
      {formatStatusPeserta(
        status
      )}
    </span>
  );
}


// =====================================================
// SIMPLE STATUS
// =====================================================

function SimpleStatusBadge({
  status,
}: {
  status:
    string;
}) {
  const normalized =
    normalizeStatus(
      status
    );


  if (
    normalized ===
      "selesai" ||
    normalized ===
      "disetujui" ||
    normalized ===
      "approved" ||
    normalized ===
      "hadir"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">

        <CheckCircle2 className="h-3 w-3" />

        {formatStatus(
          status
        )}

      </span>
    );
  }


  if (
    normalized ===
      "ditolak" ||
    normalized ===
      "perlu_revisi" ||
    normalized ===
      "revisi" ||
    normalized ===
      "perlu_perbaikan"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">

        <XCircle className="h-3 w-3" />

        {formatStatus(
          status
        )}

      </span>
    );
  }


  if (
    normalized ===
      "terlambat"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">

        <Clock3 className="h-3 w-3" />

        Terlambat

      </span>
    );
  }


  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">

      <Clock3 className="h-3 w-3" />

      {formatStatus(
        status
      )}

    </span>
  );
}


// =====================================================
// STATUS PESERTA
// =====================================================

function formatStatusPeserta(
  value:
    string
) {
  switch (
    normalizeStatus(
      value
    )
  ) {
    case "aktif":
      return "Aktif";


    case "diterima":
      return "Diterima";


    case "selesai":
      return "Selesai";


    case "mengajukan":
      return "Mengajukan";


    case "ditolak":
      return "Ditolak";


    case "tidak_aktif":
      return "Tidak Aktif";


    default:
      return value;
  }
}


// =====================================================
// FORMAT STATUS UMUM
// =====================================================

function formatStatus(
  value:
    string
) {
  const normalized =
    normalizeStatus(
      value
    );


  switch (
    normalized
  ) {
    case "belum_dikerjakan":
      return "Belum Dikerjakan";


    case "sedang_dikerjakan":
      return "Sedang Dikerjakan";


    case "sudah_dikirim":
    case "dikumpulkan":
    case "menunggu_pemeriksaan":
    case "menunggu_konfirmasi":
      return "Menunggu Pemeriksaan";


    case "menunggu":
      return "Menunggu";


    case "perlu_revisi":
    case "perlu_perbaikan":
    case "revisi":
    case "direvisi":
      return "Perlu Perbaikan";


    case "selesai":
      return "Selesai";


    case "disetujui":
      return "Disetujui";


    case "ditolak":
      return "Ditolak";


    case "hadir":
      return "Hadir";


    case "terlambat":
      return "Terlambat";


    case "izin":
      return "Izin";


    case "sakit":
      return "Sakit";


    case "alpha":
      return "Alpha";


    default:
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
}


// =====================================================
// COMPLETE STATUS
// =====================================================

function isCompletedStatus(
  status:
    string
) {
  const normalized =
    normalizeStatus(
      status
    );


  return (
    normalized ===
      "selesai" ||

    normalized ===
      "disetujui" ||

    normalized ===
      "approved"
  );
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
// PROGRESS
// =====================================================

function calculateProgress(
  status:
    string,

  mulai:
    string | null,

  selesai:
    string | null
) {
  if (
    normalizeStatus(
      status
    ) ===
    "selesai"
  ) {
    return 100;
  }


  if (
    !mulai ||
    !selesai
  ) {
    return 0;
  }


  const start =
    new Date(
      `${mulai}T00:00:00+07:00`
    ).getTime();


  const end =
    new Date(
      `${selesai}T23:59:59+07:00`
    ).getTime();


  const now =
    Date.now();


  if (
    Number.isNaN(
      start
    ) ||
    Number.isNaN(
      end
    ) ||
    end <= start
  ) {
    return 0;
  }


  if (
    now <= start
  ) {
    return 0;
  }


  if (
    now >= end
  ) {
    return 100;
  }


  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (
          (
            now -
            start
          ) /
          (
            end -
            start
          )
        ) *
        100
      )
    )
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


// =====================================================
// DATE
// =====================================================

function formatTanggal(
  value:
    string | null
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
        "short",

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
        "short",

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
// JAM
// =====================================================

function formatJam(
  value:
    string | null
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
// PERIOD
// =====================================================

function formatPeriode(
  mulai:
    string | null,

  selesai:
    string | null
) {
  if (
    !mulai &&
    !selesai
  ) {
    return "Periode belum ditentukan";
  }


  return `${formatTanggal(
    mulai
  )} - ${formatTanggal(
    selesai
  )}`;
}


// =====================================================
// NILAI
// =====================================================

function formatNilai(
  value:
    number | null
) {
  if (
    value ===
    null ||
    value ===
    undefined
  ) {
    return "-";
  }


  return Number(
    value
  ).toFixed(
    Number.isInteger(
      Number(
        value
      )
    )
      ? 0
      : 1
  );
}