"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";


import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  History,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  UserRoundCheck,
  UserRoundX,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabase";

import {
  mutateAdminParticipant,
  terminateAdminParticipant,
  getAdminParticipantWorkHistory,
  type AdminParticipant,
  type AdminParticipantWorkHistory,
  type MutateAdminParticipantPayload,
  type TerminateAdminParticipantPayload,
} from "@/lib/admin/pesertaService";

import {
  reactivateAdminParticipant,
  type ReactivateAdminParticipantPayload,
} from "@/lib/admin/reactivateParticipantService";

import {
  saveAdminPlacement,
} from "@/lib/admin/penempatanService";

import MasterPlacementSelects
  from "@/components/admin/participant/MasterPlacementSelects";

// =====================================================
// TYPES
// =====================================================

type GenericRow =
  Record<string, unknown>;


type TabType =
  | "profil"
  | "absensi"
  | "tugas"
  | "jurnal"
  | "izin"
  | "laporan"
  | "penilaian"
  | "dokumen"
  | "riwayat";


type PesertaData = {
  id: string;

  userId: string;

  nomorPeserta: string;

  status: string;

  tanggalMulai: string | null;

  tanggalSelesai: string | null;
};


type ProfileData = {
  nama: string;

  email: string;

  nomorHp: string;

  fotoUrl: string | null;
};


type PendidikanData = {
  sekolah: string;

  jurusan: string;

  kelas: string;
};


type PenempatanData = {
  pembimbingId: string | null;

  pembimbing: string;

  divisi: string;

  posisi: string;

  tanggalMulai: string | null;

  tanggalSelesai: string | null;
};


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


type PembimbingOption = {
  id: string;

  nama: string;

  divisi: string;
};


type PlacementPayload = {
  pembimbingId: string | null;

  divisi: string | null;

  posisi: string | null;

  tanggalMulai: string;

  tanggalSelesai: string | null;
};


type TerminationReason =
  | "mengundurkan_diri"
  | "mutasi_keluar"
  | "permintaan_sekolah"
  | "diberhentikan_perusahaan"
  | "pelanggaran"
  | "lainnya";


// =====================================================
// PAGE
// =====================================================

export default function AdminParticipantDetailPage() {
  const params =
    useParams<{
      id: string;
    }>();


  const searchParams =
    useSearchParams();


  // ===================================================
  // ROUTE PARAM
  // ===================================================

  const rawPesertaId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;


  const pesertaId =
    decodeRouteParam(
      rawPesertaId
    );


  // ===================================================
  // GENERAL STATE
  // ===================================================

  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);


  const [
    fatalError,
    setFatalError,
  ] =
    useState("");


  const [
    queryErrors,
    setQueryErrors,
  ] =
    useState<string[]>([]);


  const [
    activeTab,
    setActiveTab,
  ] =
    useState<TabType>(
      "profil"
    );


  // ===================================================
  // PESERTA DATA
  // ===================================================

  const [
    peserta,
    setPeserta,
  ] =
    useState<
      PesertaData | null
    >(null);


  const [
    profile,
    setProfile,
  ] =
    useState<
      ProfileData | null
    >(null);


  const [
    pendidikan,
    setPendidikan,
  ] =
    useState<PendidikanData>({
      sekolah: "-",
      jurusan: "-",
      kelas: "-",
    });


  const [
    penempatan,
    setPenempatan,
  ] =
    useState<PenempatanData>({
      pembimbingId: null,
      pembimbing: "-",
      divisi: "-",
      posisi: "-",
      tanggalMulai: null,
      tanggalSelesai: null,
    });


  const [
    hasPlacement,
    setHasPlacement,
  ] =
    useState(false);


  // ===================================================
  // ACTIVITY DATA
  // ===================================================

  const [
    absensi,
    setAbsensi,
  ] =
    useState<GenericRow[]>([]);


  const [
    tugasPeserta,
    setTugasPeserta,
  ] =
    useState<GenericRow[]>([]);


  const [
    tugasMap,
    setTugasMap,
  ] =
    useState<
      Map<
        string,
        GenericRow
      >
    >(
      new Map()
    );


  const [
    jurnal,
    setJurnal,
  ] =
    useState<GenericRow[]>([]);


  const [
    izin,
    setIzin,
  ] =
    useState<GenericRow[]>([]);


  const [
    laporan,
    setLaporan,
  ] =
    useState<GenericRow[]>([]);


  const [
    dokumen,
    setDokumen,
  ] =
    useState<GenericRow[]>([]);


  const [
    penilaian,
    setPenilaian,
  ] =
    useState<
      PenilaianData | null
    >(null);


  // ===================================================
  // WORK HISTORY
  // ===================================================

  const [
    workHistory,
    setWorkHistory,
  ] =
    useState<
      AdminParticipantWorkHistory[]
    >([]);


  const [
    historyLoading,
    setHistoryLoading,
  ] =
    useState(false);


  // ===================================================
  // MODALS
  // ===================================================

  const [
    placementOpen,
    setPlacementOpen,
  ] =
    useState(false);


  const [
    mutationOpen,
    setMutationOpen,
  ] =
    useState(false);


  const [
    terminationOpen,
    setTerminationOpen,
  ] =
    useState(false);


  const [
    reactivationOpen,
    setReactivationOpen,
  ] =
    useState(false);


  const [
    actionSaving,
    setActionSaving,
  ] =
    useState(false);


  const [
    actionError,
    setActionError,
  ] =
    useState("");


  // ===================================================
  // LOAD PARTICIPANT
  // ===================================================

  const loadParticipant =
    useCallback(
      async (
        refresh = false
      ) => {
        // =============================================
        // INVALID UUID GUARD
        // =============================================

        if (
          !pesertaId ||
          !isValidUuid(
            pesertaId
          )
        ) {
          console.warn(
            "INVALID PESERTA ID:",
            pesertaId
          );


          setFatalError(
            "ID peserta tidak valid. Silakan kembali ke daftar peserta lalu buka detail peserta kembali."
          );


          setLoading(false);
          setRefreshing(false);

          return;
        }


        try {
          if (refresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }


          setFatalError("");
          setQueryErrors([]);


          const localErrors:
            string[] =
            [];


          // =============================================
          // PESERTA
          // =============================================

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
                user_id,
                nomor_peserta,
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
            throw new Error(
              formatDatabaseError(
                "PESERTA",
                pesertaError
              )
            );
          }


          if (
            !pesertaData
          ) {
            throw new Error(
              "Peserta tidak ditemukan."
            );
          }


          const participant:
            PesertaData =
          {
            id:
              pesertaData.id,

            userId:
              pesertaData.user_id,

            nomorPeserta:
              pesertaData.nomor_peserta ??
              "-",

            status:
              pesertaData.status ??
              "-",

            tanggalMulai:
              pesertaData.tanggal_mulai ??
              null,

            tanggalSelesai:
              pesertaData.tanggal_selesai ??
              null,
          };


          setPeserta(
            participant
          );


          // =============================================
          // PROFILE
          // =============================================

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
                nama_lengkap,
                email,
                nomor_hp,
                foto_url
              `)
              .eq(
                "id",
                participant.userId
              )
              .maybeSingle();


          if (
            profileError
          ) {
            localErrors.push(
              formatDatabaseError(
                "PROFILE",
                profileError
              )
            );
          }


          setProfile({
            nama:
              profileData
                ?.nama_lengkap ??
              "Peserta",

            email:
              profileData
                ?.email ??
              "-",

            nomorHp:
              profileData
                ?.nomor_hp ??
              "-",

            fotoUrl:
              profileData
                ?.foto_url ??
              null,
          });


          // =============================================
          // PARALLEL DATA
          // =============================================

          const [
            pendidikanResult,
            penempatanResult,
            absensiResult,
            tugasResult,
            jurnalResult,
            izinResult,
            laporanResult,
            penilaianResult,
            dokumenResult,
          ] =
            await Promise.all([
              // Pendidikan

              supabase
                .from("pendidikan")
                .select("*")
                .eq(
                  "peserta_id",
                  pesertaId
                )
                .maybeSingle(),


              // Penempatan terbaru

              supabase
                .from("penempatan")
                .select(`
                  id,
                  peserta_id,
                  pembimbing_id,
                  divisi,
                  posisi,
                  tanggal_mulai,
                  tanggal_selesai,
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
                )
                .limit(1)
                .maybeSingle(),


              // Absensi

              supabase
                .from("absensi")
                .select("*")
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


              // Tugas peserta

              supabase
                .from("tugas_peserta")
                .select("*")
                .eq(
                  "peserta_id",
                  pesertaId
                ),


              // Jurnal

              supabase
                .from("jurnal")
                .select("*")
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


              // Pengajuan izin

              supabase
                .from("pengajuan_izin")
                .select("*")
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


              // Laporan

              supabase
                .from("laporan")
                .select("*")
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
              // PENILAIAN TERBARU
              //
              // kerja_sama ✅
              // kerjasama ❌
              // nilai_akhir dihitung frontend.
              // =========================================

              supabase
                .from("penilaian")
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
                .limit(1)
                .maybeSingle(),


              // Dokumen

              supabase
                .from("dokumen")
                .select("*")
                .eq(
                  "peserta_id",
                  pesertaId
                )
                .order(
                  "uploaded_at",
                  {
                    ascending:
                      false,
                  }
                ),
            ]);


          // =============================================
          // PENDIDIKAN
          // =============================================

          if (
            pendidikanResult.error
          ) {
            localErrors.push(
              formatDatabaseError(
                "PENDIDIKAN",
                pendidikanResult.error
              )
            );

          } else {
            const row =
              pendidikanResult.data as
              GenericRow | null;


            setPendidikan({
              sekolah:
                getString(
                  row?.sekolah
                ),

              jurusan:
                getString(
                  row?.jurusan
                ),

              kelas:
                getString(
                  row?.kelas
                ),
            });
          }


          // =============================================
          // PENEMPATAN
          // =============================================

          let currentPlacement:
            GenericRow | null =
            null;


          if (
            penempatanResult.error
          ) {
            localErrors.push(
              formatDatabaseError(
                "PENEMPATAN",
                penempatanResult.error
              )
            );


            setHasPlacement(
              false
            );

          } else {
            currentPlacement =
              penempatanResult.data as
              GenericRow | null;


            setHasPlacement(
              Boolean(
                currentPlacement
              )
            );
          }


          const supervisorId =
            typeof currentPlacement
              ?.pembimbing_id ===
              "string"
              ? currentPlacement
                .pembimbing_id
              : null;


          let supervisorName =
            "-";


          if (
            supervisorId
          ) {
            const {
              data:
              supervisor,

              error:
              supervisorError,
            } =
              await supabase
                .from("pembimbing")
                .select(`
                  id,
                  user_id
                `)
                .eq(
                  "id",
                  supervisorId
                )
                .maybeSingle();


            if (
              supervisorError
            ) {
              localErrors.push(
                formatDatabaseError(
                  "PEMBIMBING",
                  supervisorError
                )
              );

            } else if (
              supervisor
                ?.user_id
            ) {
              const {
                data:
                supervisorProfile,

                error:
                supervisorProfileError,
              } =
                await supabase
                  .from("profiles")
                  .select(
                    "nama_lengkap"
                  )
                  .eq(
                    "id",
                    supervisor.user_id
                  )
                  .maybeSingle();


              if (
                supervisorProfileError
              ) {
                localErrors.push(
                  formatDatabaseError(
                    "PROFILE PEMBIMBING",
                    supervisorProfileError
                  )
                );

              } else {
                supervisorName =
                  supervisorProfile
                    ?.nama_lengkap ??
                  "-";
              }
            }
          }


          setPenempatan({
            pembimbingId:
              supervisorId,

            pembimbing:
              supervisorName,

            divisi:
              getString(
                currentPlacement
                  ?.divisi
              ),

            posisi:
              getString(
                currentPlacement
                  ?.posisi
              ),

            tanggalMulai:
              getNullableString(
                currentPlacement
                  ?.tanggal_mulai
              ) ??
              participant
                .tanggalMulai,

            tanggalSelesai:
              getNullableString(
                currentPlacement
                  ?.tanggal_selesai
              ) ??
              participant
                .tanggalSelesai,
          });


          // =============================================
          // ABSENSI
          // =============================================

          if (
            absensiResult.error
          ) {
            localErrors.push(
              formatDatabaseError(
                "ABSENSI",
                absensiResult.error
              )
            );


            setAbsensi([]);

          } else {
            setAbsensi(
              (
                absensiResult.data ??
                []
              ) as GenericRow[]
            );
          }


          // =============================================
          // TUGAS PESERTA
          // =============================================

          let participantTasks:
            GenericRow[] =
            [];


          if (
            tugasResult.error
          ) {
            localErrors.push(
              formatDatabaseError(
                "TUGAS",
                tugasResult.error
              )
            );


            setTugasPeserta([]);

          } else {
            participantTasks =
              (
                tugasResult.data ??
                []
              ) as GenericRow[];


            setTugasPeserta(
              participantTasks
            );
          }


          // =============================================
          // DETAIL TUGAS
          // =============================================

          const taskIds = [
            ...new Set(
              participantTasks
                .map(
                  (
                    row
                  ) =>
                    typeof row
                      .tugas_id ===
                      "string"
                      ? row.tugas_id
                      : null
                )
                .filter(
                  (
                    id
                  ): id is string =>
                    Boolean(id)
                )
            ),
          ];


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
                .from("tugas")
                .select("*")
                .in(
                  "id",
                  taskIds
                );


            if (
              taskError
            ) {
              localErrors.push(
                formatDatabaseError(
                  "DETAIL TUGAS",
                  taskError
                )
              );

            } else {
              const map =
                new Map<
                  string,
                  GenericRow
                >();


              (
                taskData ??
                []
              ).forEach(
                (
                  item
                ) => {
                  const row =
                    item as GenericRow;


                  if (
                    typeof row.id ===
                    "string"
                  ) {
                    map.set(
                      row.id,
                      row
                    );
                  }
                }
              );


              setTugasMap(
                map
              );
            }

          } else {
            setTugasMap(
              new Map()
            );
          }


          // =============================================
          // JURNAL
          // =============================================

          if (
            jurnalResult.error
          ) {
            localErrors.push(
              formatDatabaseError(
                "JURNAL",
                jurnalResult.error
              )
            );


            setJurnal([]);

          } else {
            setJurnal(
              (
                jurnalResult.data ??
                []
              ) as GenericRow[]
            );
          }


          // =============================================
          // IZIN
          // =============================================

          if (
            izinResult.error
          ) {
            localErrors.push(
              formatDatabaseError(
                "IZIN",
                izinResult.error
              )
            );


            setIzin([]);

          } else {
            setIzin(
              (
                izinResult.data ??
                []
              ) as GenericRow[]
            );
          }


          // =============================================
          // LAPORAN
          // =============================================

          if (
            laporanResult.error
          ) {
            localErrors.push(
              formatDatabaseError(
                "LAPORAN",
                laporanResult.error
              )
            );


            setLaporan([]);

          } else {
            setLaporan(
              (
                laporanResult.data ??
                []
              ) as GenericRow[]
            );
          }


          // =============================================
          // PENILAIAN
          // =============================================

          if (
            penilaianResult.error
          ) {
            localErrors.push(
              formatDatabaseError(
                "PENILAIAN",
                penilaianResult.error
              )
            );


            setPenilaian(
              null
            );

          } else {
            setPenilaian(
              penilaianResult.data as
              PenilaianData | null
            );
          }


          // =============================================
          // DOKUMEN
          // =============================================

          if (
            dokumenResult.error
          ) {
            localErrors.push(
              formatDatabaseError(
                "DOKUMEN",
                dokumenResult.error
              )
            );


            setDokumen([]);

          } else {
            setDokumen(
              (
                dokumenResult.data ??
                []
              ) as GenericRow[]
            );
          }


          setQueryErrors(
            localErrors
          );

        } catch (
        error
        ) {
          console.warn(
            "ADMIN PARTICIPANT DETAIL:",
            error
          );


          setFatalError(
            error instanceof Error
              ? error.message
              : "Gagal mengambil detail peserta."
          );

        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [
        pesertaId,
      ]
    );


  // ===================================================
  // LOAD WORK HISTORY
  // ===================================================

  const loadWorkHistory =
    useCallback(
      async () => {
        if (
          !pesertaId ||
          !isValidUuid(
            pesertaId
          )
        ) {
          return;
        }


        try {
          setHistoryLoading(
            true
          );


          const data =
            await getAdminParticipantWorkHistory(
              pesertaId
            );


          setWorkHistory(
            data
          );

        } catch (
        error
        ) {
          console.warn(
            "WORK HISTORY:",
            error
          );


          setWorkHistory([]);

        } finally {
          setHistoryLoading(
            false
          );
        }
      },
      [
        pesertaId,
      ]
    );


  // ===================================================
  // INITIAL
  // ===================================================

  useEffect(
    () => {
      loadParticipant();
    },
    [
      loadParticipant,
    ]
  );


  // ===================================================
  // HISTORY TAB
  // ===================================================

  useEffect(
    () => {
      if (
        activeTab ===
        "riwayat"
      ) {
        loadWorkHistory();
      }
    },
    [
      activeTab,
      loadWorkHistory,
    ]
  );


  // ===================================================
  // AUTO OPEN REACTIVATION
  // dari halaman Riwayat Peserta
  // ===================================================

  useEffect(
    () => {
      if (
        !peserta
      ) {
        return;
      }


      if (
        searchParams.get(
          "action"
        ) ===
        "reactivate" &&
        normalizeStatus(
          peserta.status
        ) ===
        "diberhentikan"
      ) {
        setActionError("");

        setReactivationOpen(
          true
        );
      }
    },
    [
      peserta,
      searchParams,
    ]
  );


  // ===================================================
  // NILAI AKHIR
  // ===================================================

  const nilaiAkhir =
    useMemo(
      () => {
        if (
          !penilaian
        ) {
          return null;
        }


        const values = [
          penilaian.kehadiran,
          penilaian.kedisiplinan,
          penilaian.tanggung_jawab,
          penilaian.sikap,
          penilaian.komunikasi,
          penilaian.kerja_sama,
          penilaian.tugas,
          penilaian.laporan,
        ];


        const complete =
          values.every(
            (
              value
            ) =>
              value !==
              null &&
              value !==
              undefined
          );


        if (
          !complete
        ) {
          return null;
        }


        const total =
          values.reduce(
            (
              sum,
              value
            ) =>
              sum +
              Number(
                value ?? 0
              ),
            0
          );


        return Math.round(
          total /
          values.length
        );
      },
      [
        penilaian,
      ]
    );


  // ===================================================
  // ADMIN PARTICIPANT OBJECT
  // ===================================================

  const adminParticipant =
    useMemo<
      AdminParticipant | null
    >(
      () => {
        if (
          !peserta ||
          !profile
        ) {
          return null;
        }


        return {
          id:
            peserta.id,

          userId:
            peserta.userId,

          nomorPeserta:
            peserta.nomorPeserta,

          nama:
            profile.nama,

          email:
            profile.email,

          nomorHp:
            profile.nomorHp,

          sekolah:
            pendidikan.sekolah,

          jurusan:
            pendidikan.jurusan,

          posisi:
            penempatan.posisi,

          divisi:
            penempatan.divisi,

          pembimbing:
            penempatan.pembimbing,

          pembimbingId:
            penempatan.pembimbingId,

          tanggalMulai:
            penempatan.tanggalMulai,

          tanggalSelesai:
            penempatan.tanggalSelesai,

          status:
            peserta.status,
        };
      },
      [
        peserta,
        profile,
        pendidikan,
        penempatan,
      ]
    );


  // ===================================================
  // SAVE PENEMPATAN
  // ===================================================

  async function handlePlacement(
    payload:
      PlacementPayload
  ) {
    if (
      !peserta
    ) {
      return;
    }


    try {
      setActionSaving(
        true
      );


      setActionError("");


      await saveAdminPlacement(
        peserta.id,
        payload
      );


      setPlacementOpen(
        false
      );


      await loadParticipant(
        true
      );


      await loadWorkHistory();

    } catch (
    error
    ) {
      console.warn(
        "SAVE PLACEMENT:",
        error
      );


      setActionError(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan penempatan peserta."
      );

    } finally {
      setActionSaving(
        false
      );
    }
  }

  async function handleActivateParticipant() {
    if (!peserta) {
      return;
    }

    if (
      normalizeStatus(peserta.status) !==
      "diterima"
    ) {
      return;
    }

    try {
      setActionSaving(true);

      setActionError("");

      const {
        error,
      } = await supabase
        .from("peserta")
        .update({
          status: "aktif",
        })
        .eq(
          "id",
          peserta.id
        );

      if (error) {
        throw new Error(
          error.message
        );
      }

      await loadParticipant(
        true
      );

      await loadWorkHistory();

    } catch (
    error
    ) {
      console.warn(
        "ACTIVATE PARTICIPANT:",
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "Gagal menjadikan peserta aktif."
      );

    } finally {
      setActionSaving(
        false
      );
    }
  }

  // ===================================================
  // MUTATION
  // ===================================================

  async function handleMutation(
    payload:
      MutateAdminParticipantPayload
  ) {
    if (
      !peserta
    ) {
      return;
    }


    if (
      !hasPlacement
    ) {
      setActionError(
        "Peserta belum memiliki penempatan. Silakan atur penempatan terlebih dahulu."
      );

      setMutationOpen(
        false
      );

      setPlacementOpen(
        true
      );

      return;
    }


    try {
      setActionSaving(
        true
      );


      setActionError("");


      await mutateAdminParticipant(
        peserta.id,
        payload
      );


      setMutationOpen(
        false
      );


      await loadParticipant(
        true
      );


      await loadWorkHistory();


      setActiveTab(
        "riwayat"
      );

    } catch (
    error
    ) {
      console.warn(
        "MUTATION:",
        error
      );


      setActionError(
        error instanceof Error
          ? error.message
          : "Gagal melakukan mutasi peserta."
      );

    } finally {
      setActionSaving(
        false
      );
    }
  }


  // ===================================================
  // TERMINATION
  // ===================================================

  async function handleTermination(
    payload:
      TerminateAdminParticipantPayload
  ) {
    if (
      !peserta
    ) {
      return;
    }


    if (
      !hasPlacement
    ) {
      setActionError(
        "Peserta belum memiliki penempatan. Silakan atur penempatan terlebih dahulu."
      );

      setTerminationOpen(
        false
      );

      setPlacementOpen(
        true
      );

      return;
    }


    try {
      setActionSaving(
        true
      );


      setActionError("");


      await terminateAdminParticipant(
        peserta.id,
        payload
      );


      setTerminationOpen(
        false
      );


      await loadParticipant(
        true
      );


      await loadWorkHistory();


      setActiveTab(
        "riwayat"
      );

    } catch (
    error
    ) {
      console.warn(
        "TERMINATION:",
        error
      );


      setActionError(
        error instanceof Error
          ? error.message
          : "Gagal menghentikan kegiatan magang."
      );

    } finally {
      setActionSaving(
        false
      );
    }
  }


  // ===================================================
  // REACTIVATION
  // ===================================================

  async function handleReactivation(
    payload:
      ReactivateAdminParticipantPayload
  ) {
    if (
      !peserta
    ) {
      return;
    }


    try {
      setActionSaving(
        true
      );


      setActionError("");


      await reactivateAdminParticipant(
        peserta.id,
        payload
      );


      setReactivationOpen(
        false
      );


      await loadParticipant(
        true
      );


      await loadWorkHistory();


      setActiveTab(
        "riwayat"
      );

    } catch (
    error
    ) {
      console.warn(
        "REACTIVATION:",
        error
      );


      setActionError(
        error instanceof Error
          ? error.message
          : "Gagal mengaktifkan kembali peserta."
      );

    } finally {
      setActionSaving(
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

          <Loader2
            size={30}
            className="mx-auto animate-spin text-blue-600"
          />


          <p className="mt-3 text-sm text-neutral-500">
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
    fatalError ||
    !peserta
  ) {
    return (
      <div className="space-y-6">

        <Link
          href="/admin/peserta"
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 transition hover:text-blue-600"
        >
          <ArrowLeft
            size={16}
          />

          Kembali ke Peserta
        </Link>


        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

          <div className="flex gap-3">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />


            <div>

              <p className="font-semibold text-red-800">
                Gagal memuat peserta
              </p>


              <p className="mt-1 text-sm leading-6 text-red-600">
                {fatalError ||
                  "Peserta tidak ditemukan."}
              </p>


              <Link
                href="/admin/peserta"
                className="mt-4 inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Kembali
              </Link>

            </div>

          </div>

        </div>

      </div>
    );
  }


  // ===================================================
  // STATUS
  // ===================================================

  const normalizedStatus =
    normalizeStatus(
      peserta.status
    );


  const pesertaAktif =
    normalizedStatus ===
    "aktif";


  const pesertaDiterima =
    normalizedStatus ===
    "diterima";


  const pesertaDiberhentikan =
    normalizedStatus ===
    "diberhentikan";


  // ===================================================
  // TABS
  // ===================================================

  const tabs:
    Array<{
      id: TabType;

      label: string;
    }> =
    [
      {
        id: "profil",
        label: "Profil",
      },

      {
        id: "absensi",
        label: "Absensi",
      },

      {
        id: "tugas",
        label: "Tugas",
      },

      {
        id: "jurnal",
        label: "Jurnal",
      },

      {
        id: "izin",
        label: "Izin",
      },

      {
        id: "laporan",
        label: "Laporan",
      },

      {
        id: "penilaian",
        label: "Penilaian",
      },

      {
        id: "dokumen",
        label: "Dokumen",
      },

      {
        id: "riwayat",
        label: "Riwayat Kerja",
      },
    ];


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

        <div>

          <Link
            href="/admin/peserta"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 transition hover:text-blue-600"
          >
            <ArrowLeft
              size={16}
            />

            Kembali ke Peserta
          </Link>


          <div className="flex flex-wrap items-center gap-3">

            <h1 className="text-2xl font-bold text-neutral-900">
              {profile?.nama ||
                "Peserta"}
            </h1>


            <StatusBadge
              status={
                peserta.status
              }
            />

          </div>


          <p className="mt-2 text-sm text-neutral-500">
            {peserta.nomorPeserta}

            {" • "}

            {profile?.email ||
              "-"}
          </p>

        </div>


        {/* =================================================
            ACTION
        ================================================= */}

        <div className="flex flex-wrap gap-2">

          {/* ===============================================
              PESERTA DITERIMA
              BISA ATUR / EDIT PENEMPATAN
          =============================================== */}

          {pesertaDiterima && (
            <>

              {/* ===========================================
        JADIKAN PESERTA AKTIF
    =========================================== */}

              <button
                type="button"
                disabled={actionSaving}
                onClick={handleActivateParticipant}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionSaving ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <UserRoundCheck
                    size={16}
                  />
                )}

                {actionSaving
                  ? "Mengaktifkan..."
                  : "Jadikan Peserta Aktif"}
              </button>


              {/* ===========================================
        EDIT / ATUR PENEMPATAN
    =========================================== */}

              <button
                type="button"
                disabled={actionSaving}
                onClick={() => {
                  setActionError("");
                  setPlacementOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MapPin
                  size={16}
                />

                {hasPlacement
                  ? "Edit Penempatan"
                  : "Atur Penempatan"}
              </button>

            </>
          )}


          {/* ===============================================
              ACTIVE TAPI BELUM PUNYA PENEMPATAN
          =============================================== */}

          {pesertaAktif &&
            !hasPlacement && (

              <button
                type="button"
                onClick={() => {
                  setActionError("");

                  setPlacementOpen(
                    true
                  );
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                <MapPin
                  size={16}
                />

                Atur Penempatan
              </button>

            )}


          {/* ===============================================
              MUTASI
          =============================================== */}

          {pesertaAktif &&
            hasPlacement && (

              <button
                type="button"
                onClick={() => {
                  setActionError("");

                  setMutationOpen(
                    true
                  );
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <ArrowRightLeft
                  size={16}
                />

                Mutasi
              </button>

            )}


          {/* ===============================================
              HENTIKAN
          =============================================== */}

          {pesertaAktif &&
            hasPlacement && (

              <button
                type="button"
                onClick={() => {
                  setActionError("");

                  setTerminationOpen(
                    true
                  );
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                <UserRoundX
                  size={16}
                />

                Hentikan Magang
              </button>

            )}


          {/* ===============================================
              AKTIFKAN KEMBALI
          =============================================== */}

          {pesertaDiberhentikan && (

            <button
              type="button"
              onClick={() => {
                setActionError("");

                setReactivationOpen(
                  true
                );
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <UserRoundCheck
                size={16}
              />

              Aktifkan Kembali
            </button>

          )}


          {/* ===============================================
              HISTORY
          =============================================== */}

          <button
            type="button"
            onClick={() =>
              setActiveTab(
                "riwayat"
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50"
          >
            <History
              size={16}
            />

            Riwayat
          </button>


          {/* ===============================================
              REFRESH
          =============================================== */}

          <button
            type="button"
            disabled={
              refreshing
            }
            onClick={() =>
              loadParticipant(
                true
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>

      </div>


      {/* =================================================
          BELUM PENEMPATAN
      ================================================= */}

      {(
        pesertaAktif ||
        pesertaDiterima
      ) &&
        !hasPlacement && (

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

            <div className="flex gap-3">

              <AlertTriangle
                size={20}
                className="mt-0.5 shrink-0 text-amber-600"
              />


              <div>

                <p className="font-semibold text-amber-900">
                  Penempatan belum ditentukan
                </p>


                <p className="mt-1 text-sm leading-6 text-amber-700">
                  Tentukan divisi, posisi, pembimbing, dan periode
                  magang terlebih dahulu.
                </p>

              </div>

            </div>

          </div>

        )}


      {/* =================================================
          QUERY WARNINGS
      ================================================= */}

      {queryErrors.length >
        0 && (

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">

            <div className="flex gap-3">

              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-amber-600"
              />


              <div className="min-w-0">

                <p className="font-semibold text-amber-900">
                  Sebagian data gagal dimuat
                </p>


                <div className="mt-3 space-y-1">

                  {queryErrors.map(
                    (
                      item,
                      index
                    ) => (

                      <p
                        key={
                          `${item}-${index}`
                        }
                        className="break-words font-mono text-xs text-amber-700"
                      >
                        {item}
                      </p>

                    )
                  )}

                </div>

              </div>

            </div>

          </div>

        )}


      {/* =================================================
          TERMINATED INFO
      ================================================= */}

      {normalizedStatus ===
        "diberhentikan" && (

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

            <div className="flex gap-3">

              <UserRoundX
                size={20}
                className="mt-0.5 shrink-0 text-red-600"
              />


              <div>

                <p className="font-semibold text-red-800">
                  Kegiatan magang telah dihentikan
                </p>


                <p className="mt-1 text-sm leading-6 text-red-600">
                  Peserta tidak lagi berstatus aktif. Biodata dan riwayat
                  tetap tersimpan. Gunakan tombol Aktifkan Kembali jika
                  peserta akan melanjutkan program magang.
                </p>

              </div>

            </div>

          </div>

        )}


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          icon={
            BriefcaseBusiness
          }
          label="Divisi"
          value={
            penempatan.divisi
          }
        />


        <SummaryCard
          icon={
            User
          }
          label="Pembimbing"
          value={
            penempatan.pembimbing
          }
        />


        <SummaryCard
          icon={
            CalendarDays
          }
          label="Mulai"
          value={
            formatDate(
              penempatan
                .tanggalMulai
            )
          }
        />


        <SummaryCard
          icon={
            CalendarDays
          }
          label="Selesai"
          value={
            formatDate(
              penempatan
                .tanggalSelesai
            )
          }
        />

      </div>


      {/* =================================================
          TABS
      ================================================= */}

      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-2">

        <div className="flex min-w-max gap-1">

          {tabs.map(
            (
              tab
            ) => (

              <button
                key={
                  tab.id
                }
                type="button"
                onClick={() =>
                  setActiveTab(
                    tab.id
                  )
                }
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeTab ===
                  tab.id
                  ? "bg-blue-600 text-white"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                  }`}
              >
                {tab.label}
              </button>

            )
          )}

        </div>

      </div>


      {/* =================================================
          TAB CONTENT
      ================================================= */}

      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

        {activeTab ===
          "profil" && (

            <ProfileTab
              peserta={
                peserta
              }
              profile={
                profile
              }
              pendidikan={
                pendidikan
              }
              penempatan={
                penempatan
              }
            />

          )}


        {activeTab ===
          "absensi" && (

            <AbsensiTab
              rows={
                absensi
              }
            />

          )}


        {activeTab ===
          "tugas" && (

            <TugasTab
              rows={
                tugasPeserta
              }
              tugasMap={
                tugasMap
              }
            />

          )}


        {activeTab ===
          "jurnal" && (

            <JurnalTab
              rows={
                jurnal
              }
            />

          )}


        {activeTab ===
          "izin" && (

            <IzinTab
              rows={
                izin
              }
            />

          )}


        {activeTab ===
          "laporan" && (

            <LaporanTab
              rows={
                laporan
              }
            />

          )}


        {activeTab ===
          "penilaian" && (

            <PenilaianTab
              data={
                penilaian
              }
              nilaiAkhir={
                nilaiAkhir
              }
            />

          )}


        {activeTab ===
          "dokumen" && (

            <DokumenTab
              rows={
                dokumen
              }
            />

          )}


        {activeTab ===
          "riwayat" && (

            <WorkHistoryTab
              loading={
                historyLoading
              }
              rows={
                workHistory
              }
            />

          )}

      </div>


      {/* =================================================
          PLACEMENT MODAL
      ================================================= */}

      {adminParticipant && (

        <PlacementModal
          open={
            placementOpen
          }
          participant={
            adminParticipant
          }
          saving={
            actionSaving
          }
          error={
            actionError
          }
          onClose={() => {
            if (
              actionSaving
            ) {
              return;
            }


            setPlacementOpen(
              false
            );


            setActionError("");
          }}
          onSubmit={
            handlePlacement
          }
        />

      )}


      {/* =================================================
          MUTATION MODAL
      ================================================= */}

      {adminParticipant && (

        <MutationModal
          open={
            mutationOpen
          }
          participant={
            adminParticipant
          }
          saving={
            actionSaving
          }
          error={
            actionError
          }
          onClose={() => {
            if (
              actionSaving
            ) {
              return;
            }


            setMutationOpen(
              false
            );


            setActionError("");
          }}
          onSubmit={
            handleMutation
          }
        />

      )}


      {/* =================================================
          TERMINATION MODAL
      ================================================= */}

      {adminParticipant && (

        <TerminationModal
          open={
            terminationOpen
          }
          participant={
            adminParticipant
          }
          saving={
            actionSaving
          }
          error={
            actionError
          }
          onClose={() => {
            if (
              actionSaving
            ) {
              return;
            }


            setTerminationOpen(
              false
            );


            setActionError("");
          }}
          onSubmit={
            handleTermination
          }
        />

      )}


      {/* =================================================
          REACTIVATION MODAL
      ================================================= */}

      {adminParticipant && (

        <ReactivationModal
          open={
            reactivationOpen
          }
          participant={
            adminParticipant
          }
          saving={
            actionSaving
          }
          error={
            actionError
          }
          onClose={() => {
            if (
              actionSaving
            ) {
              return;
            }


            setReactivationOpen(
              false
            );


            setActionError("");
          }}
          onSubmit={
            handleReactivation
          }
        />

      )}

    </div>
  );
}


// =====================================================
// PLACEMENT MODAL
// =====================================================

function PlacementModal({
  open,
  participant,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open:
  boolean;

  participant:
  AdminParticipant;

  saving:
  boolean;

  error:
  string;

  onClose:
  () => void;

  onSubmit:
  (
    payload:
      PlacementPayload
  ) => Promise<void>;
}) {
  const [
    pembimbingOptions,
    setPembimbingOptions,
  ] =
    useState<
      PembimbingOption[]
    >([]);


  const [
    pembimbingLoading,
    setPembimbingLoading,
  ] =
    useState(false);


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
    tanggalMulai,
    setTanggalMulai,
  ] =
    useState("");


  const [
    tanggalSelesai,
    setTanggalSelesai,
  ] =
    useState("");


  const [
    localError,
    setLocalError,
  ] =
    useState("");


  // ===================================================
  // PREFILL
  // ===================================================

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }


      setPembimbingId(
        participant.pembimbingId ??
        ""
      );


      setDivisi(
        cleanFormValue(
          participant.divisi
        )
      );


      setPosisi(
        cleanFormValue(
          participant.posisi
        )
      );


      setTanggalMulai(
        participant.tanggalMulai ??
        ""
      );


      setTanggalSelesai(
        participant.tanggalSelesai ??
        ""
      );


      setLocalError("");

    },
    [
      open,
      participant,
    ]
  );


  // ===================================================
  // LOAD PEMBIMBING
  // ===================================================

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }


      async function loadPembimbing() {
        try {
          setPembimbingLoading(
            true
          );


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
                user_id,
                divisi
              `);


          if (
            pembimbingError
          ) {
            throw pembimbingError;
          }


          const rows =
            pembimbingData ??
            [];


          const userIds =
            rows
              .map(
                (
                  row
                ) =>
                  row.user_id
              )
              .filter(
                (
                  id
                ): id is string =>
                  Boolean(id)
              );


          let profiles:
            Array<{
              id: string;

              nama_lengkap:
              string | null;
            }> =
            [];


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


            profiles =
              profileData ??
              [];
          }


          const formatted:
            PembimbingOption[] =
            rows.map(
              (
                row
              ) => {
                const pembimbingProfile =
                  profiles.find(
                    (
                      item
                    ) =>
                      item.id ===
                      row.user_id
                  );


                return {
                  id:
                    row.id,

                  nama:
                    pembimbingProfile
                      ?.nama_lengkap ??
                    "Pembimbing",

                  divisi:
                    row.divisi ??
                    "-",
                };
              }
            );


          formatted.sort(
            (
              a,
              b
            ) =>
              a.nama.localeCompare(
                b.nama,
                "id"
              )
          );


          setPembimbingOptions(
            formatted
          );

        } catch (
        error
        ) {
          console.warn(
            "LOAD PEMBIMBING:",
            error
          );


          setPembimbingOptions([]);

        } finally {
          setPembimbingLoading(
            false
          );
        }
      }


      loadPembimbing();

    },
    [
      open,
    ]
  );


  if (
    !open
  ) {
    return null;
  }


  // ===================================================
  // CHANGE PEMBIMBING
  // ===================================================

  function handleSupervisorChange(
    id:
      string
  ) {
    setPembimbingId(
      id
    );


    if (
      !id
    ) {
      return;
    }


    const supervisor =
      pembimbingOptions.find(
        (
          item
        ) =>
          item.id ===
          id
      );


    // Kalau divisi masih kosong,
    // otomatis bantu isi dari pembimbing.
    if (
      supervisor &&
      !divisi.trim()
    ) {
      setDivisi(
        cleanFormValue(
          supervisor.divisi
        )
      );
    }
  }


  // ===================================================
  // SUBMIT
  // ===================================================

  async function submit() {
    setLocalError("");


    if (
      !divisi.trim()
    ) {
      setLocalError(
        "Divisi wajib diisi."
      );

      return;
    }


    if (
      !posisi.trim()
    ) {
      setLocalError(
        "Posisi wajib diisi."
      );

      return;
    }


    if (
      !pembimbingId
    ) {
      setLocalError(
        "Pembimbing wajib dipilih."
      );

      return;
    }


    if (
      !tanggalMulai
    ) {
      setLocalError(
        "Tanggal mulai wajib diisi."
      );

      return;
    }


    if (
      tanggalSelesai &&
      tanggalSelesai <
      tanggalMulai
    ) {
      setLocalError(
        "Tanggal selesai tidak boleh sebelum tanggal mulai."
      );

      return;
    }


    await onSubmit({
      pembimbingId,

      divisi:
        divisi.trim(),

      posisi:
        posisi.trim(),

      tanggalMulai,

      tanggalSelesai:
        tanggalSelesai ||
        null,
    });
  }


  return (
    <ModalContainer>

      <ModalHeader
        icon={
          <BriefcaseBusiness
            size={21}
          />
        }
        iconClass="bg-blue-50 text-blue-600"
        title="Atur Penempatan"
        description="Tentukan divisi, posisi, pembimbing, dan periode magang."
        disabled={
          saving
        }
        onClose={
          onClose
        }
      />


      <div className="space-y-5 p-6">

        {(error ||
          localError) && (

            <ErrorBox
              message={
                localError ||
                error
              }
            />

          )}


        <ParticipantPreview
          participant={
            participant
          }
        />


        <MasterPlacementSelects
          divisi={
            divisi
          }
          posisi={
            posisi
          }
          onDivisiChange={
            setDivisi
          }
          onPosisiChange={
            setPosisi
          }
          disabled={
            saving
          }
        />


        <FormLabel title="Pembimbing">

          <select
            value={
              pembimbingId
            }
            disabled={
              pembimbingLoading
            }
            onChange={(
              event
            ) =>
              handleSupervisorChange(
                event.target.value
              )
            }
            className={
              inputClass
            }
          >

            <option value="">
              {pembimbingLoading
                ? "Memuat pembimbing..."
                : "Pilih pembimbing"}
            </option>


            {pembimbingOptions.map(
              (
                item
              ) => (

                <option
                  key={
                    item.id
                  }
                  value={
                    item.id
                  }
                >
                  {item.nama}
                  {" — "}
                  {item.divisi}
                </option>

              )
            )}

          </select>

        </FormLabel>


        <div className="grid gap-4 sm:grid-cols-2">

          <FormLabel title="Tanggal Mulai">

            <input
              type="date"
              value={
                tanggalMulai
              }
              onChange={(
                event
              ) =>
                setTanggalMulai(
                  event.target.value
                )
              }
              className={
                inputClass
              }
            />

          </FormLabel>


          <FormLabel title="Tanggal Selesai">

            <input
              type="date"
              value={
                tanggalSelesai
              }
              min={
                tanggalMulai ||
                undefined
              }
              onChange={(
                event
              ) =>
                setTanggalSelesai(
                  event.target.value
                )
              }
              className={
                inputClass
              }
            />

          </FormLabel>

        </div>


        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

          <div className="flex gap-3">

            <MapPin
              size={18}
              className="mt-0.5 shrink-0 text-blue-600"
            />


            <div>

              <p className="text-sm font-semibold text-blue-800">
                Penempatan Peserta
              </p>


              <p className="mt-1 text-xs leading-5 text-blue-600">
                Pembimbing yang dipilih akan menjadi pembimbing aktif
                peserta. Periode magang juga akan disinkronkan.
              </p>

            </div>

          </div>

        </div>

      </div>


      <ModalFooter
        saving={
          saving
        }
        submitText="Simpan Penempatan"
        onClose={
          onClose
        }
        onSubmit={
          submit
        }
      />

    </ModalContainer>
  );
}


// =====================================================
// MUTATION MODAL
// =====================================================

function MutationModal({
  open,
  participant,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open:
  boolean;

  participant:
  AdminParticipant;

  saving:
  boolean;

  error:
  string;

  onClose:
  () => void;

  onSubmit:
  (
    payload:
      MutateAdminParticipantPayload
  ) => Promise<void>;
}) {
  const [
    pembimbingOptions,
    setPembimbingOptions,
  ] =
    useState<
      PembimbingOption[]
    >([]);


  const [
    pembimbingLoading,
    setPembimbingLoading,
  ] =
    useState(false);


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


  const [
    localError,
    setLocalError,
  ] =
    useState("");


  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }


      setTanggalMutasi(
        getToday()
      );


      setPembimbingId(
        participant.pembimbingId ??
        ""
      );


      setDivisi(
        cleanFormValue(
          participant.divisi
        )
      );


      setPosisi(
        cleanFormValue(
          participant.posisi
        )
      );


      setTanggalSelesai(
        participant.tanggalSelesai ??
        ""
      );


      setAlasan("");
      setLocalError("");

    },
    [
      open,
      participant,
    ]
  );


  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }


      async function loadPembimbing() {
        try {
          setPembimbingLoading(
            true
          );


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
                user_id,
                divisi
              `);


          if (
            pembimbingError
          ) {
            throw pembimbingError;
          }


          const rows =
            pembimbingData ??
            [];


          const userIds =
            rows
              .map(
                (
                  row
                ) =>
                  row.user_id
              )
              .filter(
                (
                  id
                ): id is string =>
                  Boolean(id)
              );


          let profiles:
            Array<{
              id: string;

              nama_lengkap:
              string | null;
            }> =
            [];


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


            profiles =
              profileData ??
              [];
          }


          setPembimbingOptions(
            rows.map(
              (
                row
              ) => {
                const supervisorProfile =
                  profiles.find(
                    (
                      profile
                    ) =>
                      profile.id ===
                      row.user_id
                  );


                return {
                  id:
                    row.id,

                  nama:
                    supervisorProfile
                      ?.nama_lengkap ??
                    "Pembimbing",

                  divisi:
                    row.divisi ??
                    "-",
                };
              }
            )
          );

        } catch (
        error
        ) {
          console.warn(
            "LOAD PEMBIMBING:",
            error
          );


          setPembimbingOptions([]);

        } finally {
          setPembimbingLoading(
            false
          );
        }
      }


      loadPembimbing();

    },
    [
      open,
    ]
  );


  if (
    !open
  ) {
    return null;
  }


  async function submit() {
    setLocalError("");


    if (
      !tanggalMutasi
    ) {
      setLocalError(
        "Tanggal mutasi wajib diisi."
      );

      return;
    }


    if (
      !divisi.trim()
    ) {
      setLocalError(
        "Divisi wajib diisi."
      );

      return;
    }


    if (
      !posisi.trim()
    ) {
      setLocalError(
        "Posisi wajib diisi."
      );

      return;
    }


    if (
      tanggalSelesai &&
      tanggalSelesai <
      tanggalMutasi
    ) {
      setLocalError(
        "Tanggal selesai tidak boleh sebelum tanggal mutasi."
      );

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
    <ModalContainer>

      <ModalHeader
        icon={
          <ArrowRightLeft
            size={21}
          />
        }
        iconClass="bg-blue-50 text-blue-600"
        title="Mutasi Peserta"
        description="Ubah divisi, posisi, pembimbing, atau periode peserta aktif."
        disabled={
          saving
        }
        onClose={
          onClose
        }
      />


      <div className="space-y-5 p-6">

        {(error ||
          localError) && (

            <ErrorBox
              message={
                localError ||
                error
              }
            />

          )}


        <ParticipantPreview
          participant={
            participant
          }
        />


        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">

          <p className="text-sm font-semibold text-blue-800">
            Mutasi Internal
          </p>


          <p className="mt-1 text-xs leading-5 text-blue-600">
            Peserta tetap aktif. Perubahan divisi, posisi, pembimbing,
            atau periode akan masuk ke Riwayat Kerja.
          </p>

        </div>


        <FormLabel title="Tanggal Mutasi">

          <input
            type="date"
            value={
              tanggalMutasi
            }
            onChange={(
              event
            ) =>
              setTanggalMutasi(
                event.target.value
              )
            }
            className={
              inputClass
            }
          />

        </FormLabel>


        <MasterPlacementSelects
          divisi={
            divisi
          }
          posisi={
            posisi
          }
          onDivisiChange={
            setDivisi
          }
          onPosisiChange={
            setPosisi
          }
          disabled={
            saving
          }
        />


        <FormLabel title="Pembimbing Baru">

          <select
            value={
              pembimbingId
            }
            disabled={
              pembimbingLoading
            }
            onChange={(
              event
            ) =>
              setPembimbingId(
                event.target.value
              )
            }
            className={
              inputClass
            }
          >

            <option value="">
              Tanpa pembimbing
            </option>


            {pembimbingOptions.map(
              (
                item
              ) => (

                <option
                  key={
                    item.id
                  }
                  value={
                    item.id
                  }
                >
                  {item.nama}
                  {" — "}
                  {item.divisi}
                </option>

              )
            )}

          </select>

        </FormLabel>


        <FormLabel title="Tanggal Selesai Rencana">

          <input
            type="date"
            value={
              tanggalSelesai
            }
            onChange={(
              event
            ) =>
              setTanggalSelesai(
                event.target.value
              )
            }
            className={
              inputClass
            }
          />

        </FormLabel>


        <FormLabel title="Alasan Mutasi">

          <textarea
            rows={4}
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
            className={`${inputClass} resize-none`}
          />

        </FormLabel>

      </div>


      <ModalFooter
        saving={
          saving
        }
        submitText="Simpan Mutasi"
        onClose={
          onClose
        }
        onSubmit={
          submit
        }
      />

    </ModalContainer>
  );
}


// =====================================================
// TERMINATION MODAL
// =====================================================

function TerminationModal({
  open,
  participant,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open:
  boolean;

  participant:
  AdminParticipant;

  saving:
  boolean;

  error:
  string;

  onClose:
  () => void;

  onSubmit:
  (
    payload:
      TerminateAdminParticipantPayload
  ) => Promise<void>;
}) {
  const [
    tanggalBerhenti,
    setTanggalBerhenti,
  ] =
    useState("");


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
    useState("");


  const [
    detail,
    setDetail,
  ] =
    useState("");


  const [
    localError,
    setLocalError,
  ] =
    useState("");


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


      setPerusahaanTujuan("");
      setDetail("");
      setLocalError("");

    },
    [
      open,
      participant.id,
    ]
  );


  const finalReason =
    useMemo(
      () => {
        const extra =
          detail.trim();


        switch (
        reasonType
        ) {
          case "mengundurkan_diri":
            return [
              "Mengundurkan diri / Drop Out.",
              extra,
            ]
              .filter(Boolean)
              .join(" ");


          case "mutasi_keluar":
            return [
              perusahaanTujuan.trim()
                ? `Mutasi keluar perusahaan ke ${perusahaanTujuan.trim()}.`
                : "Mutasi keluar perusahaan.",

              extra,
            ]
              .filter(Boolean)
              .join(" ");


          case "permintaan_sekolah":
            return [
              "Penghentian atas permintaan sekolah/kampus.",
              extra,
            ]
              .filter(Boolean)
              .join(" ");


          case "diberhentikan_perusahaan":
            return [
              "Diberhentikan oleh perusahaan.",
              extra,
            ]
              .filter(Boolean)
              .join(" ");


          case "pelanggaran":
            return [
              "Diberhentikan karena pelanggaran.",
              extra,
            ]
              .filter(Boolean)
              .join(" ");


          case "lainnya":
            return extra;


          default:
            return extra;
        }
      },
      [
        reasonType,
        perusahaanTujuan,
        detail,
      ]
    );


  if (
    !open
  ) {
    return null;
  }


  async function submit() {
    setLocalError("");


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
        "Nama perusahaan tujuan wajib diisi."
      );

      return;
    }


    if (
      finalReason.trim()
        .length <
      5
    ) {
      setLocalError(
        "Alasan penghentian minimal 5 karakter."
      );

      return;
    }


    await onSubmit({
      tanggalBerhenti,

      alasan:
        finalReason.trim(),
    });
  }


  return (
    <ModalContainer>

      <ModalHeader
        icon={
          <AlertTriangle
            size={21}
          />
        }
        iconClass="bg-red-50 text-red-600"
        title="Hentikan Magang"
        description="Akhiri kegiatan magang peserta di perusahaan."
        disabled={
          saving
        }
        onClose={
          onClose
        }
      />


      <div className="space-y-5 p-6">

        {(error ||
          localError) && (

            <ErrorBox
              message={
                localError ||
                error
              }
            />

          )}


        <ParticipantPreview
          participant={
            participant
          }
        />


        <div className="rounded-2xl border border-red-100 bg-red-50 p-4">

          <p className="text-sm font-semibold text-red-800">
            Status akan menjadi Diberhentikan
          </p>


          <p className="mt-1 text-xs leading-5 text-red-600">
            Peserta tidak lagi dianggap aktif dan tidak masuk
            penyelesaian magang normal.
          </p>

        </div>


        <FormLabel title="Tanggal Berhenti">

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
            className={
              inputClass
            }
          />

        </FormLabel>


        <FormLabel title="Jenis Penghentian">

          <select
            value={
              reasonType
            }
            onChange={(
              event
            ) =>
              setReasonType(
                event.target
                  .value as
                TerminationReason
              )
            }
            className={
              inputClass
            }
          >

            <option value="mengundurkan_diri">
              Mengundurkan diri / Drop Out
            </option>

            <option value="mutasi_keluar">
              Mutasi keluar perusahaan
            </option>

            <option value="permintaan_sekolah">
              Permintaan sekolah / kampus
            </option>

            <option value="diberhentikan_perusahaan">
              Diberhentikan perusahaan
            </option>

            <option value="pelanggaran">
              Pelanggaran
            </option>

            <option value="lainnya">
              Lainnya
            </option>

          </select>

        </FormLabel>


        {reasonType ===
          "mutasi_keluar" && (

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

              <div className="flex gap-3">

                <Building2
                  size={18}
                  className="mt-0.5 shrink-0 text-blue-600"
                />


                <div className="w-full">

                  <p className="text-sm font-semibold text-blue-800">
                    Perusahaan Tujuan
                  </p>


                  <input
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
                    placeholder="Contoh: PT ABC Indonesia"
                    className={`${inputClass} mt-3`}
                  />

                </div>

              </div>

            </div>

          )}


        <FormLabel
          title={
            reasonType ===
              "lainnya"
              ? "Alasan"
              : "Keterangan Tambahan"
          }
        >

          <textarea
            rows={4}
            value={
              detail
            }
            onChange={(
              event
            ) =>
              setDetail(
                event.target.value
              )
            }
            className={`${inputClass} resize-none`}
          />

        </FormLabel>


        <div className="rounded-2xl border border-neutral-200 p-4">

          <div className="flex items-center gap-3">

            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              Aktif
            </span>


            <ArrowRight
              size={16}
              className="text-neutral-300"
            />


            <span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
              Diberhentikan
            </span>

          </div>


          <p className="mt-4 text-xs leading-5 text-neutral-500">
            {finalReason ||
              "Alasan penghentian akan tampil di sini."}
          </p>

        </div>

      </div>


      <ModalFooter
        saving={
          saving
        }
        submitText="Hentikan Magang"
        danger
        onClose={
          onClose
        }
        onSubmit={
          submit
        }
      />

    </ModalContainer>
  );
}


// =====================================================
// REACTIVATION MODAL
// =====================================================

function ReactivationModal({
  open,
  participant,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open:
  boolean;

  participant:
  AdminParticipant;

  saving:
  boolean;

  error:
  string;

  onClose:
  () => void;

  onSubmit:
  (
    payload:
      ReactivateAdminParticipantPayload
  ) => Promise<void>;
}) {
  const [
    pembimbingOptions,
    setPembimbingOptions,
  ] =
    useState<
      PembimbingOption[]
    >([]);


  const [
    pembimbingLoading,
    setPembimbingLoading,
  ] =
    useState(false);


  const [
    tanggalMulai,
    setTanggalMulai,
  ] =
    useState("");


  const [
    tanggalSelesai,
    setTanggalSelesai,
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
    alasan,
    setAlasan,
  ] =
    useState("");


  const [
    localError,
    setLocalError,
  ] =
    useState("");


  // ===================================================
  // PREFILL
  // ===================================================

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }


      const today =
        getToday();


      const minimumDate =
        participant.tanggalSelesai &&
          participant.tanggalSelesai >
          today
          ? participant.tanggalSelesai
          : today;


      setTanggalMulai(
        minimumDate
      );


      setTanggalSelesai("");
      setPembimbingId("");
      setDivisi("");
      setPosisi("");
      setAlasan("");
      setLocalError("");

    },
    [
      open,
      participant.id,
      participant.tanggalSelesai,
    ]
  );


  // ===================================================
  // LOAD PEMBIMBING
  // ===================================================

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }


      async function loadPembimbing() {
        try {
          setPembimbingLoading(
            true
          );


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
                user_id,
                divisi
              `);


          if (
            pembimbingError
          ) {
            throw pembimbingError;
          }


          const rows =
            pembimbingData ??
            [];


          const userIds =
            rows
              .map(
                (
                  row
                ) =>
                  row.user_id
              )
              .filter(
                (
                  id
                ): id is string =>
                  Boolean(id)
              );


          let profiles:
            Array<{
              id: string;

              nama_lengkap:
              string | null;
            }> =
            [];


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


            profiles =
              profileData ??
              [];
          }


          const formatted:
            PembimbingOption[] =
            rows.map(
              (
                row
              ) => {
                const pembimbingProfile =
                  profiles.find(
                    (
                      item
                    ) =>
                      item.id ===
                      row.user_id
                  );


                return {
                  id:
                    row.id,

                  nama:
                    pembimbingProfile
                      ?.nama_lengkap ??
                    "Pembimbing",

                  divisi:
                    row.divisi ??
                    "-",
                };
              }
            );


          formatted.sort(
            (
              a,
              b
            ) =>
              a.nama.localeCompare(
                b.nama,
                "id"
              )
          );


          setPembimbingOptions(
            formatted
          );

        } catch (
        error
        ) {
          console.warn(
            "LOAD PEMBIMBING REACTIVATION:",
            error
          );


          setPembimbingOptions([]);

        } finally {
          setPembimbingLoading(
            false
          );
        }
      }


      loadPembimbing();

    },
    [
      open,
    ]
  );


  if (
    !open
  ) {
    return null;
  }


  async function submit() {
    setLocalError("");


    if (
      !tanggalMulai
    ) {
      setLocalError(
        "Tanggal mulai kembali wajib diisi."
      );

      return;
    }


    if (
      participant.tanggalSelesai &&
      tanggalMulai <
      participant.tanggalSelesai
    ) {
      setLocalError(
        "Tanggal mulai kembali tidak boleh sebelum tanggal pemberhentian."
      );

      return;
    }


    if (
      !divisi.trim()
    ) {
      setLocalError(
        "Divisi wajib dipilih."
      );

      return;
    }


    if (
      !posisi.trim()
    ) {
      setLocalError(
        "Posisi wajib dipilih."
      );

      return;
    }


    if (
      !pembimbingId
    ) {
      setLocalError(
        "Pembimbing wajib dipilih."
      );

      return;
    }


    if (
      tanggalSelesai &&
      tanggalSelesai <
      tanggalMulai
    ) {
      setLocalError(
        "Tanggal selesai tidak boleh sebelum tanggal mulai."
      );

      return;
    }


    if (
      alasan.trim().length <
      5
    ) {
      setLocalError(
        "Alasan aktivasi kembali minimal 5 karakter."
      );

      return;
    }


    await onSubmit({
      tanggalMulai,

      pembimbingId,

      divisi:
        divisi.trim(),

      posisi:
        posisi.trim(),

      tanggalSelesai:
        tanggalSelesai ||
        null,

      alasan:
        alasan.trim(),
    });
  }


  return (
    <ModalContainer>

      <ModalHeader
        icon={
          <UserRoundCheck
            size={21}
          />
        }
        iconClass="bg-emerald-50 text-emerald-600"
        title="Aktifkan Kembali Peserta"
        description="Aktifkan kembali peserta yang sebelumnya diberhentikan dengan penempatan baru."
        disabled={
          saving
        }
        onClose={
          onClose
        }
      />


      <div className="space-y-5 p-6">

        {(error ||
          localError) && (

            <ErrorBox
              message={
                localError ||
                error
              }
            />

          )}


        <ParticipantPreview
          participant={
            participant
          }
        />


        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

          <p className="text-sm font-semibold text-emerald-800">
            Riwayat lama tetap tersimpan
          </p>


          <p className="mt-1 text-xs leading-5 text-emerald-700">
            Aktivasi kembali tidak menghapus riwayat pemberhentian,
            biodata, dokumen, absensi, tugas, jurnal, laporan, maupun
            penilaian peserta.
          </p>

        </div>


        <div className="rounded-2xl border border-neutral-200 p-4">

          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
            Penempatan Terakhir
          </p>


          <p className="mt-2 text-sm font-semibold text-neutral-800">
            {participant.divisi}
            {" — "}
            {participant.posisi}
          </p>


          <p className="mt-1 text-xs text-neutral-500">
            Berakhir:{" "}
            {participant.tanggalSelesai
              ? formatDate(
                participant.tanggalSelesai
              )
              : "-"}
          </p>

        </div>


        <FormLabel title="Tanggal Mulai Kembali">

          <input
            type="date"
            min={
              participant.tanggalSelesai ||
              undefined
            }
            value={
              tanggalMulai
            }
            onChange={(
              event
            ) =>
              setTanggalMulai(
                event.target.value
              )
            }
            className={
              inputClass
            }
          />

        </FormLabel>


        <MasterPlacementSelects
          divisi={
            divisi
          }
          posisi={
            posisi
          }
          onDivisiChange={
            setDivisi
          }
          onPosisiChange={
            setPosisi
          }
          disabled={
            saving
          }
        />


        <FormLabel title="Pembimbing Baru">

          <select
            value={
              pembimbingId
            }
            disabled={
              saving ||
              pembimbingLoading
            }
            onChange={(
              event
            ) =>
              setPembimbingId(
                event.target.value
              )
            }
            className={
              inputClass
            }
          >

            <option value="">
              {pembimbingLoading
                ? "Memuat pembimbing..."
                : "Pilih pembimbing"}
            </option>


            {pembimbingOptions.map(
              (
                item
              ) => (

                <option
                  key={
                    item.id
                  }
                  value={
                    item.id
                  }
                >
                  {item.nama}
                  {" — "}
                  {item.divisi}
                </option>

              )
            )}

          </select>

        </FormLabel>


        <FormLabel title="Tanggal Selesai Rencana">

          <input
            type="date"
            min={
              tanggalMulai ||
              undefined
            }
            value={
              tanggalSelesai
            }
            onChange={(
              event
            ) =>
              setTanggalSelesai(
                event.target.value
              )
            }
            className={
              inputClass
            }
          />

        </FormLabel>


        <FormLabel title="Alasan Aktivasi Kembali">

          <textarea
            rows={4}
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
            placeholder="Contoh: Peserta mendapat izin untuk melanjutkan kembali program magang."
            className={`${inputClass} resize-none`}
          />

        </FormLabel>


        <div className="rounded-2xl border border-neutral-200 p-4">

          <div className="flex items-center gap-3">

            <span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
              Diberhentikan
            </span>


            <ArrowRight
              size={16}
              className="text-neutral-300"
            />


            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              Aktif
            </span>

          </div>

        </div>

      </div>


      <ModalFooter
        saving={
          saving
        }
        submitText="Aktifkan Kembali"
        onClose={
          onClose
        }
        onSubmit={
          submit
        }
      />

    </ModalContainer>
  );
}


// =====================================================
// PROFILE
// =====================================================

function ProfileTab({
  peserta,
  profile,
  pendidikan,
  penempatan,
}: {
  peserta:
  PesertaData;

  profile:
  ProfileData | null;

  pendidikan:
  PendidikanData;

  penempatan:
  PenempatanData;
}) {
  return (
    <div>

      <SectionTitle
        title="Informasi Peserta"
        description="Informasi identitas, pendidikan, dan penempatan peserta."
      />


      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <InfoCard
          icon={User}
          label="Nama Lengkap"
          value={
            profile?.nama ??
            "-"
          }
        />


        <InfoCard
          icon={Mail}
          label="Email"
          value={
            profile?.email ??
            "-"
          }
        />


        <InfoCard
          icon={Phone}
          label="Nomor HP"
          value={
            profile?.nomorHp ??
            "-"
          }
        />


        <InfoCard
          icon={GraduationCap}
          label="Sekolah / Kampus"
          value={
            pendidikan.sekolah
          }
        />


        <InfoCard
          icon={BookOpen}
          label="Jurusan"
          value={
            pendidikan.jurusan
          }
        />


        <InfoCard
          icon={BriefcaseBusiness}
          label="Posisi"
          value={
            penempatan.posisi
          }
        />


        <InfoCard
          icon={MapPin}
          label="Divisi"
          value={
            penempatan.divisi
          }
        />


        <InfoCard
          icon={User}
          label="Pembimbing"
          value={
            penempatan.pembimbing
          }
        />


        <InfoCard
          icon={ShieldCheck}
          label="Status"
          value={
            formatStatus(
              peserta.status
            )
          }
        />

      </div>

    </div>
  );
}


// =====================================================
// ABSENSI
// =====================================================

function AbsensiTab({
  rows,
}: {
  rows:
  GenericRow[];
}) {
  if (
    rows.length ===
    0
  ) {
    return (
      <EmptyState
        text="Belum ada data absensi."
      />
    );
  }


  return (
    <SimpleListSection
      title="Riwayat Absensi"
      description={`${rows.length} data absensi ditemukan.`}
    >

      {rows.map(
        (
          row,
          index
        ) => (

          <DataRow
            key={
              getKey(
                row,
                index
              )
            }
            title={
              formatDate(
                getNullableString(
                  row.tanggal
                )
              )
            }
            subtitle={`Masuk: ${getString(
              row.jam_masuk
            )} • Pulang: ${getString(
              row.jam_pulang
            )}`}
            status={
              getString(
                row.status
              )
            }
          />

        )
      )}

    </SimpleListSection>
  );
}


// =====================================================
// TUGAS
// =====================================================

function TugasTab({
  rows,
  tugasMap,
}: {
  rows:
  GenericRow[];

  tugasMap:
  Map<
    string,
    GenericRow
  >;
}) {
  if (
    rows.length ===
    0
  ) {
    return (
      <EmptyState
        text="Belum ada tugas peserta."
      />
    );
  }


  return (
    <SimpleListSection
      title="Tugas Peserta"
      description={`${rows.length} tugas ditemukan.`}
    >

      {rows.map(
        (
          row,
          index
        ) => {
          const taskId =
            getNullableString(
              row.tugas_id
            );


          const task =
            taskId
              ? tugasMap.get(
                taskId
              )
              : undefined;


          return (
            <DataRow
              key={
                getKey(
                  row,
                  index
                )
              }
              title={
                getString(
                  task?.judul,
                  "Tugas"
                )
              }
              subtitle={
                getString(
                  task?.deskripsi,
                  "Tidak ada deskripsi."
                )
              }
              status={
                getString(
                  row.status
                )
              }
            />
          );
        }
      )}

    </SimpleListSection>
  );
}


// =====================================================
// JURNAL
// =====================================================

function JurnalTab({
  rows,
}: {
  rows:
  GenericRow[];
}) {
  if (
    rows.length ===
    0
  ) {
    return (
      <EmptyState
        text="Belum ada jurnal peserta."
      />
    );
  }


  return (
    <SimpleListSection
      title="Jurnal Peserta"
      description={`${rows.length} jurnal ditemukan.`}
    >

      {rows.map(
        (
          row,
          index
        ) => (

          <DataRow
            key={
              getKey(
                row,
                index
              )
            }
            title={
              getString(
                row.judul,
                getString(
                  row.kegiatan,
                  "Jurnal Kegiatan"
                )
              )
            }
            subtitle={
              formatDate(
                getNullableString(
                  row.tanggal
                )
              )
            }
            status={
              getString(
                row.status
              )
            }
          />

        )
      )}

    </SimpleListSection>
  );
}


// =====================================================
// IZIN
// =====================================================

function IzinTab({
  rows,
}: {
  rows:
  GenericRow[];
}) {
  if (
    rows.length ===
    0
  ) {
    return (
      <EmptyState
        text="Belum ada pengajuan izin."
      />
    );
  }


  return (
    <SimpleListSection
      title="Pengajuan Izin"
      description={`${rows.length} pengajuan ditemukan.`}
    >

      {rows.map(
        (
          row,
          index
        ) => (

          <DataRow
            key={
              getKey(
                row,
                index
              )
            }
            title={
              getString(
                row.alasan,
                "Pengajuan Izin"
              )
            }
            subtitle={`${formatDate(
              getNullableString(
                row.tanggal_mulai
              )
            )} — ${formatDate(
              getNullableString(
                row.tanggal_selesai
              )
            )}`}
            status={
              getString(
                row.status
              )
            }
          />

        )
      )}

    </SimpleListSection>
  );
}


// =====================================================
// LAPORAN
// =====================================================

function LaporanTab({
  rows,
}: {
  rows:
  GenericRow[];
}) {
  if (
    rows.length ===
    0
  ) {
    return (
      <EmptyState
        text="Belum ada laporan."
      />
    );
  }


  return (
    <SimpleListSection
      title="Laporan Peserta"
      description={`${rows.length} laporan ditemukan.`}
    >

      {rows.map(
        (
          row,
          index
        ) => (

          <DataRow
            key={
              getKey(
                row,
                index
              )
            }
            title={
              getString(
                row.judul,
                getString(
                  row.tipe,
                  "Laporan"
                )
              )
            }
            subtitle={
              getString(
                row.periode
              )
            }
            status={
              getString(
                row.status
              )
            }
          />

        )
      )}

    </SimpleListSection>
  );
}


// =====================================================
// PENILAIAN
// =====================================================

function PenilaianTab({
  data,
  nilaiAkhir,
}: {
  data:
  PenilaianData | null;

  nilaiAkhir:
  number | null;
}) {
  if (
    !data
  ) {
    return (
      <EmptyState
        text="Penilaian pembimbing belum tersedia."
      />
    );
  }


  const scores = [
    {
      label:
        "Kehadiran",

      value:
        data.kehadiran,
    },

    {
      label:
        "Kedisiplinan",

      value:
        data.kedisiplinan,
    },

    {
      label:
        "Tanggung Jawab",

      value:
        data.tanggung_jawab,
    },

    {
      label:
        "Sikap",

      value:
        data.sikap,
    },

    {
      label:
        "Komunikasi",

      value:
        data.komunikasi,
    },

    {
      label:
        "Kerja Sama",

      value:
        data.kerja_sama,
    },

    {
      label:
        "Tugas",

      value:
        data.tugas,
    },

    {
      label:
        "Laporan",

      value:
        data.laporan,
    },
  ];


  return (
    <div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <SectionTitle
          title="Penilaian Pembimbing"
          description="Penilaian berdasarkan delapan aspek."
        />


        <div className="rounded-2xl bg-blue-50 px-5 py-3">

          <p className="text-xs font-medium text-blue-500">
            Nilai Rata-rata
          </p>


          <p className="mt-1 text-2xl font-bold text-blue-700">
            {nilaiAkhir !==
              null
              ? `${nilaiAkhir} / 100`
              : "-"}
          </p>

        </div>

      </div>


      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {scores.map(
          (
            score
          ) => (

            <div
              key={
                score.label
              }
              className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
            >

              <p className="text-xs font-medium text-neutral-400">
                {score.label}
              </p>


              <p className="mt-2 text-xl font-bold text-neutral-800">
                {score.value !==
                  null &&
                  score.value !==
                  undefined
                  ? score.value
                  : "-"}
              </p>

            </div>

          )
        )}

      </div>


      <div className="mt-5 rounded-2xl border border-neutral-200 p-5">

        <p className="text-sm font-semibold text-neutral-800">
          Catatan Pembimbing
        </p>


        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-neutral-500">
          {data.catatan ||
            "Tidak ada catatan."}
        </p>

      </div>

    </div>
  );
}


// =====================================================
// DOKUMEN
// =====================================================

function DokumenTab({
  rows,
}: {
  rows:
  GenericRow[];
}) {
  if (
    rows.length ===
    0
  ) {
    return (
      <EmptyState
        text="Belum ada dokumen peserta."
      />
    );
  }


  return (
    <SimpleListSection
      title="Dokumen Peserta"
      description={`${rows.length} dokumen ditemukan.`}
    >

      {rows.map(
        (
          row,
          index
        ) => {
          const url =
            getNullableString(
              row.file_url
            );


          return (
            <div
              key={
                getKey(
                  row,
                  index
                )
              }
              className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >

              <div className="flex items-start gap-3">

                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">

                  <FileText
                    size={18}
                  />

                </div>


                <div>

                  <p className="text-sm font-semibold text-neutral-800">
                    {getString(
                      row.nama_dokumen,
                      getString(
                        row.jenis_dokumen,
                        "Dokumen"
                      )
                    )}
                  </p>


                  <p className="mt-1 text-xs text-neutral-400">
                    Status:{" "}
                    {formatStatus(
                      getString(
                        row.status
                      )
                    )}
                  </p>

                </div>

              </div>


              {url && (

                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
                >
                  Lihat File
                </a>

              )}

            </div>
          );
        }
      )}

    </SimpleListSection>
  );
}


// =====================================================
// WORK HISTORY
// =====================================================

function WorkHistoryTab({
  loading,
  rows,
}: {
  loading:
  boolean;

  rows:
  AdminParticipantWorkHistory[];
}) {
  if (
    loading
  ) {
    return (
      <div className="flex min-h-[220px] items-center justify-center">

        <Loader2
          size={26}
          className="animate-spin text-blue-600"
        />

      </div>
    );
  }


  if (
    rows.length ===
    0
  ) {
    return (
      <EmptyState
        text="Belum ada riwayat kerja peserta."
      />
    );
  }


  return (
    <div>

      <SectionTitle
        title="Riwayat Kerja"
        description="Riwayat penempatan awal, mutasi, penyelesaian, penghentian, dan aktivasi kembali."
      />


      <div className="space-y-4">

        {rows.map(
          (
            history
          ) => (

            <div
              key={
                history.id
              }
              className="rounded-2xl border border-neutral-200 p-5"
            >

              <div className="flex flex-wrap items-center gap-2">

                <WorkHistoryBadge
                  event={
                    history.jenisEvent
                  }
                />


                <span className="text-xs text-neutral-400">
                  {formatDate(
                    history.tanggalEvent
                  )}
                </span>

              </div>


              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">

                <PlacementHistoryCard
                  label="Sebelum"
                  divisi={
                    history.dari.divisi
                  }
                  posisi={
                    history.dari.posisi
                  }
                  pembimbing={
                    history.dari
                      .pembimbingNama
                  }
                />


                <ArrowRight
                  size={18}
                  className="hidden shrink-0 text-neutral-300 lg:block"
                />


                <PlacementHistoryCard
                  label="Sesudah"
                  divisi={
                    history.ke.divisi
                  }
                  posisi={
                    history.ke.posisi
                  }
                  pembimbing={
                    history.ke
                      .pembimbingNama
                  }
                />

              </div>


              {history.alasan && (

                <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-3">

                  <p className="text-xs font-medium text-neutral-400">
                    Alasan / Keterangan
                  </p>


                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    {history.alasan}
                  </p>

                </div>

              )}

            </div>

          )
        )}

      </div>

    </div>
  );
}


// =====================================================
// SHARED
// =====================================================

function SimpleListSection({
  title,
  description,
  children,
}: {
  title:
  string;

  description:
  string;

  children:
  ReactNode;
}) {
  return (
    <div>

      <SectionTitle
        title={
          title
        }
        description={
          description
        }
      />


      <div className="space-y-3">
        {children}
      </div>

    </div>
  );
}


function SectionTitle({
  title,
  description,
}: {
  title:
  string;

  description:
  string;
}) {
  return (
    <div className="mb-5">

      <h2 className="text-lg font-semibold text-neutral-900">
        {title}
      </h2>


      <p className="mt-1 text-sm text-neutral-500">
        {description}
      </p>

    </div>
  );
}


function SummaryCard({
  icon:
  Icon,
  label,
  value,
}: {
  icon:
  LucideIcon;

  label:
  string;

  value:
  string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">

          <Icon
            size={18}
          />

        </div>


        <div className="min-w-0">

          <p className="text-xs text-neutral-400">
            {label}
          </p>


          <p className="mt-1 truncate text-sm font-semibold text-neutral-800">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}


function InfoCard({
  icon:
  Icon,
  label,
  value,
}: {
  icon:
  LucideIcon;

  label:
  string;

  value:
  string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-4">

      <Icon
        size={17}
        className="text-blue-600"
      />


      <p className="mt-3 text-xs text-neutral-400">
        {label}
      </p>


      <p className="mt-1 break-words text-sm font-semibold text-neutral-800">
        {value}
      </p>

    </div>
  );
}


function DataRow({
  title,
  subtitle,
  status,
}: {
  title:
  string;

  subtitle:
  string;

  status:
  string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between">

      <div>

        <p className="text-sm font-semibold text-neutral-800">
          {title}
        </p>


        <p className="mt-1 text-xs leading-5 text-neutral-400">
          {subtitle}
        </p>

      </div>


      <StatusPill
        status={
          status
        }
      />

    </div>
  );
}


function EmptyState({
  text,
}: {
  text:
  string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center text-center">

      <ClipboardCheck
        size={28}
        className="text-neutral-300"
      />


      <p className="mt-3 text-sm text-neutral-400">
        {text}
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
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
        Aktif
      </span>
    );
  }


  if (
    normalized ===
    "diterima"
  ) {
    return (
      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        Diterima
      </span>
    );
  }


  if (
    normalized ===
    "selesai"
  ) {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        Selesai
      </span>
    );
  }


  if (
    normalized ===
    "diberhentikan"
  ) {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
        Diberhentikan
      </span>
    );
  }


  return (
    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
      {formatStatus(
        status
      )}
    </span>
  );
}


function StatusPill({
  status,
}: {
  status:
  string;
}) {
  const normalized =
    normalizeStatus(
      status
    );


  const success = [
    "selesai",
    "disetujui",
    "hadir",
    "diterima",
  ].includes(
    normalized
  );


  const warning = [
    "menunggu",
    "pending",
    "revisi",
    "direvisi",
    "terlambat",
    "menunggu_konfirmasi",
  ].includes(
    normalized
  );


  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-[11px] font-semibold ${success
        ? "bg-emerald-50 text-emerald-700"
        : warning
          ? "bg-amber-50 text-amber-700"
          : "bg-neutral-100 text-neutral-500"
        }`}
    >
      {formatStatus(
        status
      )}
    </span>
  );
}


function WorkHistoryBadge({
  event,
}: {
  event:
  string;
}) {
  if (
    event ===
    "penempatan_awal"
  ) {
    return (
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
        Penempatan Awal
      </span>
    );
  }


  if (
    event ===
    "mutasi"
  ) {
    return (
      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
        Mutasi
      </span>
    );
  }


  if (
    event ===
    "selesai"
  ) {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        Selesai
      </span>
    );
  }


  if (
    event ===
    "diberhentikan"
  ) {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
        Diberhentikan
      </span>
    );
  }


  if (
    event ===
    "diaktifkan_kembali"
  ) {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        Diaktifkan Kembali
      </span>
    );
  }


  return (
    <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
      {formatStatus(
        event
      )}
    </span>
  );
}


// =====================================================
// HISTORY CARD
// =====================================================

function PlacementHistoryCard({
  label,
  divisi,
  posisi,
  pembimbing,
}: {
  label:
  string;

  divisi:
  string | null;

  posisi:
  string | null;

  pembimbing:
  string;
}) {
  return (
    <div className="min-w-0 flex-1 rounded-xl bg-neutral-50 p-4">

      <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
        {label}
      </p>


      <p className="mt-2 text-sm font-semibold text-neutral-800">
        {divisi ||
          "-"}
      </p>


      <p className="mt-1 text-xs text-neutral-500">
        {posisi ||
          "-"}
      </p>


      <p className="mt-2 text-xs text-neutral-400">
        Pembimbing:{" "}
        {pembimbing ||
          "-"}
      </p>

    </div>
  );
}


// =====================================================
// MODAL
// =====================================================

function ModalContainer({
  children,
}: {
  children:
  ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]" />


      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">

        <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
          {children}
        </div>

      </div>
    </>
  );
}


function ModalHeader({
  icon,
  iconClass,
  title,
  description,
  disabled,
  onClose,
}: {
  icon:
  ReactNode;

  iconClass:
  string;

  title:
  string;

  description:
  string;

  disabled:
  boolean;

  onClose:
  () => void;
}) {
  return (
    <div className="flex items-start justify-between border-b border-neutral-100 px-6 py-5">

      <div className="flex gap-3">

        <div
          className={`grid h-11 w-11 place-items-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>


        <div>

          <h2 className="text-xl font-bold text-neutral-900">
            {title}
          </h2>


          <p className="mt-1 text-sm text-neutral-500">
            {description}
          </p>

        </div>

      </div>


      <button
        type="button"
        disabled={
          disabled
        }
        onClick={
          onClose
        }
        className="grid h-10 w-10 place-items-center rounded-xl text-neutral-400 transition hover:bg-neutral-100 disabled:opacity-40"
      >
        <X
          size={20}
        />
      </button>

    </div>
  );
}


function ModalFooter({
  saving,
  submitText,
  danger = false,
  onClose,
  onSubmit,
}: {
  saving:
  boolean;

  submitText:
  string;

  danger?:
  boolean;

  onClose:
  () => void;

  onSubmit:
  () => void;
}) {
  return (
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
          saving
        }
        onClick={
          onSubmit
        }
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${danger
          ? "bg-red-600 hover:bg-red-700"
          : "bg-blue-600 hover:bg-blue-700"
          }`}
      >

        {saving && (

          <Loader2
            size={16}
            className="animate-spin"
          />

        )}


        {saving
          ? "Memproses..."
          : submitText}

      </button>

    </div>
  );
}


function ParticipantPreview({
  participant,
}: {
  participant:
  AdminParticipant;
}) {
  return (
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

        {" • "}

        {participant.posisi}
      </p>

    </div>
  );
}


function ErrorBox({
  message,
}: {
  message:
  string;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      {message}
    </div>
  );
}


function FormLabel({
  title,
  children,
}: {
  title:
  string;

  children:
  ReactNode;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-medium text-neutral-700">
        {title}
      </span>


      {children}

    </label>
  );
}


// =====================================================
// HELPERS
// =====================================================

const inputClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50";


function decodeRouteParam(
  value:
    string |
    undefined
) {
  if (
    !value
  ) {
    return "";
  }


  try {
    return decodeURIComponent(
      value
    );
  } catch {
    return value;
  }
}


function isValidUuid(
  value:
    string
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}


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


function getString(
  value:
    unknown,

  fallback =
    "-"
) {
  if (
    typeof value ===
    "string" &&
    value.trim()
  ) {
    return value;
  }


  if (
    typeof value ===
    "number"
  ) {
    return String(
      value
    );
  }


  return fallback;
}


function getNullableString(
  value:
    unknown
):
  string | null {
  if (
    typeof value ===
    "string" &&
    value.trim()
  ) {
    return value;
  }


  return null;
}


function getKey(
  row:
    GenericRow,

  index:
    number
) {
  return typeof row.id ===
    "string"
    ? row.id
    : String(
      index
    );
}


function formatDate(
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
    return value;
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


function cleanFormValue(
  value:
    string |
    null |
    undefined
) {
  if (
    !value ||
    value ===
    "-"
  ) {
    return "";
  }


  return value;
}


function formatDatabaseError(
  label:
    string,

  error:
    unknown
) {
  const dbError =
    error as {
      message?:
      string;

      details?:
      string;

      code?:
      string;

      hint?:
      string;
    };


  const message =
    [
      `[${label}]`,

      dbError
        ?.message ||
      "Database query gagal.",

      dbError
        ?.code
        ? `code: ${dbError.code}`
        : null,

      dbError
        ?.hint
        ? `hint: ${dbError.hint}`
        : null,

      dbError
        ?.details
        ? `details: ${dbError.details}`
        : null,
    ]
      .filter(Boolean)
      .join(" | ");


  console.warn(
    `${label} QUERY WARNING:`,
    {
      message:
        dbError?.message,

      code:
        dbError?.code,

      hint:
        dbError?.hint,

      details:
        dbError?.details,
    }
  );


  return message;
}