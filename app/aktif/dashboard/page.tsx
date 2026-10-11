"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  User,
  CheckCircle2,
  FileText,
  ClipboardList,
  Megaphone,
  Plus,
  BookOpen,
  UserCheck,
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type ProfilePeserta = {
  nama: string;
  fotoUrl: string | null;
  nomorPeserta: string;
  pembimbing: string;
  sekolah: string;
  divisi: string;
  status: string;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
};

type AbsensiHariIni = {
  jamMasuk: string;
  jamPulang: string;
  status: string;
};

type JadwalHariIni = {
  jamMulai: string;
  jamSelesai: string;
};

type TugasHariIni = {
  id: string;
  judul: string;
};

type PengumumanTerbaru = {
  judul: string;
  isi: string;
  createdAt: string;
};

type DashboardCount = {
  hadir: number;
  sakit: number;
  izin: number;
  tugas: number;
  jurnal: number;
  tugasSelesai: number;
};

// =========================================
// INITIAL DATA
// =========================================

const initialProfile: ProfilePeserta = {
  nama: "Peserta Magang",
  fotoUrl: null,
  nomorPeserta: "-",
  pembimbing: "-",
  sekolah: "-",
  divisi: "-",
  status: "-",
  tanggalMulai: null,
  tanggalSelesai: null,
};

const initialCount: DashboardCount = {
  hadir: 0,
  sakit: 0,
  izin: 0,
  tugas: 0,
  jurnal: 0,
  tugasSelesai: 0,
};

// =========================================
// QUICK ACTIONS
// =========================================

const quickActions = [
  {
    key: "absen",
    label: "Absen",
    href: "/aktif/absensi",
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: UserCheck,
  },
  {
    key: "izin",
    label: "Ajukan izin",
    href: "/aktif/absensi",
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: FileText,
  },
  {
    key: "jurnal",
    label: "Lihat jurnal",
    href: "/aktif/jurnal",
    bg: "bg-pink-100",
    text: "text-pink-700",
    icon: BookOpen,
  },
  {
    key: "tambah-jurnal",
    label: "Tambah jurnal",
    href: "/aktif/jurnal",
    bg: "bg-red-100",
    text: "text-red-700",
    icon: Plus,
  },
  {
    key: "tugas",
    label: "Lihat tugas",
    href: "/aktif/tugas",
    bg: "bg-violet-100",
    text: "text-violet-700",
    icon: ClipboardList,
  },
];

// =========================================
// PAGE
// =========================================

export default function DashboardPesertaPage() {
  const [
    avatarError,
    setAvatarError,
  ] = useState(false);

  const [profile, setProfile] =
    useState<ProfilePeserta>(
      initialProfile
    );

  const [counts, setCounts] =
    useState<DashboardCount>(
      initialCount
    );

  const [
    absensiHariIni,
    setAbsensiHariIni,
  ] = useState<AbsensiHariIni | null>(
    null
  );

  const [
    jadwalHariIni,
    setJadwalHariIni,
  ] = useState<JadwalHariIni | null>(
    null
  );

  const [
    tugasHariIni,
    setTugasHariIni,
  ] = useState<TugasHariIni[]>([]);

  const [
    pengumumanTerbaru,
    setPengumumanTerbaru,
  ] =
    useState<PengumumanTerbaru | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =========================================
  // TANGGAL HARI INI
  // =========================================

  const today =
    getLocalDate();

  const tanggalHariIni =
    new Date(
      `${today}T00:00:00`
    ).toLocaleDateString(
      "id-ID",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );

  // =========================================
  // FETCH DASHBOARD
  // =========================================

  const fetchDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        // =====================================
        // USER LOGIN
        // =====================================

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setError(
            "User tidak ditemukan. Silakan login kembali."
          );
          return;
        }

        // =====================================
        // PROFILE
        // =====================================

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(`
            nama_lengkap,
            foto_url
          `)
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        // =====================================
        // PESERTA
        // =====================================

        const {
          data: peserta,
          error: pesertaError,
        } = await supabase
          .from("peserta")
          .select(`
            id,
            nomor_peserta,
            status,
            tanggal_mulai,
            tanggal_selesai
          `)
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

        if (pesertaError) {
          throw pesertaError;
        }

        if (!peserta) {
          setError(
            "Data peserta tidak ditemukan."
          );
          return;
        }

        const pesertaId =
          peserta.id;

        // =====================================
        // AMBIL DATA SECARA PARALEL
        // =====================================

        const [
          pendidikanResult,
          penempatanResult,
          absensiResult,
          absensiHariIniResult,
          jadwalResult,
          jurnalResult,
          tugasPesertaResult,
          pengumumanResult,
        ] = await Promise.all([
          // PENDIDIKAN

          supabase
            .from("pendidikan")
            .select("sekolah")
            .eq(
              "peserta_id",
              pesertaId
            )
            .maybeSingle(),

          // PENEMPATAN

          supabase
            .from("penempatan")
            .select(`
              divisi,
              pembimbing_id
            `)
            .eq(
              "peserta_id",
              pesertaId
            )
            .maybeSingle(),

          // SEMUA ABSENSI

          supabase
            .from("absensi")
            .select("status")
            .eq(
              "peserta_id",
              pesertaId
            ),

          // ABSENSI HARI INI

          supabase
            .from("absensi")
            .select(`
              jam_masuk,
              jam_pulang,
              status,
              created_at
            `)
            .eq(
              "peserta_id",
              pesertaId
            )
            .eq(
              "tanggal",
              today
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            )
            .limit(1)
            .maybeSingle(),

          // JADWAL HARI INI

          supabase
            .from("jadwal")
            .select(`
              jam_mulai,
              jam_selesai
            `)
            .eq(
              "tanggal",
              today
            )
            .order(
              "jam_mulai",
              {
                ascending: true,
              }
            )
            .limit(1)
            .maybeSingle(),

          // JURNAL

          supabase
            .from("jurnal")
            .select(
              "id",
              {
                count: "exact",
                head: true,
              }
            )
            .eq(
              "peserta_id",
              pesertaId
            ),

          // TUGAS PESERTA

          supabase
            .from("tugas_peserta")
            .select(`
              id,
              tugas_id,
              status
            `)
            .eq(
              "peserta_id",
              pesertaId
            ),

          // PENGUMUMAN TERBARU

          supabase
            .from("pengumuman")
            .select(`
              judul,
              isi,
              created_at
            `)
            .order(
              "created_at",
              {
                ascending: false,
              }
            )
            .limit(1)
            .maybeSingle(),
        ]);

        // =====================================
        // CHECK ERROR
        // =====================================

        if (
          pendidikanResult.error
        ) {
          console.error(
            "PENDIDIKAN ERROR:",
            pendidikanResult.error
          );
        }

        if (
          penempatanResult.error
        ) {
          console.error(
            "PENEMPATAN ERROR:",
            penempatanResult.error
          );
        }

        if (
          absensiResult.error
        ) {
          throw absensiResult.error;
        }

        if (
          absensiHariIniResult.error
        ) {
          throw absensiHariIniResult.error;
        }

        if (
          jadwalResult.error
        ) {
          throw jadwalResult.error;
        }

        if (
          jurnalResult.error
        ) {
          throw jurnalResult.error;
        }

        if (
          tugasPesertaResult.error
        ) {
          throw tugasPesertaResult.error;
        }

        if (
          pengumumanResult.error
        ) {
          console.error(
            "PENGUMUMAN ERROR:",
            pengumumanResult.error
          );
        }

        // =====================================
        // PEMBIMBING
        // =====================================

        let namaPembimbing = "-";

        const pembimbingId =
          penempatanResult.data?.pembimbing_id;

        if (pembimbingId) {
          const {
            data: pembimbingProfile,
            error: pembimbingProfileError,
          } = await supabase.rpc(
            "get_pembimbing_peserta",
            {
              p_pembimbing_id: pembimbingId,
            }
          );

          if (pembimbingProfileError) {
            console.error(
              "PEMBIMBING PROFILE ERROR:",
              pembimbingProfileError
            );
          } else {
            namaPembimbing =
              pembimbingProfile?.[0]?.nama_lengkap ||
              "-";
          }
        }

        // =====================================
        // SET PROFILE
        // =====================================

        setProfile({
          nama:
            profileData
              ?.nama_lengkap ||
            "Peserta Magang",

          fotoUrl:
            profileData
              ?.foto_url ||
            null,

          nomorPeserta:
            peserta.nomor_peserta ||
            "-",

          pembimbing:
            namaPembimbing,

          sekolah:
            pendidikanResult
              .data
              ?.sekolah ||
            "-",

          divisi:
            penempatanResult
              .data
              ?.divisi ||
            "-",

          status:
            peserta.status ||
            "-",

          tanggalMulai:
            peserta.tanggal_mulai ||
            null,

          tanggalSelesai:
            peserta.tanggal_selesai ||
            null,
        });

        // =====================================
        // ABSENSI COUNTS
        // =====================================

        const semuaAbsensi =
          absensiResult.data ||
          [];

        const jumlahHadir =
          semuaAbsensi.filter(
            (item) =>
              item.status ===
              "hadir" ||
              item.status ===
              "terlambat"
          ).length;

        const jumlahSakit =
          semuaAbsensi.filter(
            (item) =>
              item.status ===
              "sakit"
          ).length;

        const jumlahIzin =
          semuaAbsensi.filter(
            (item) =>
              item.status ===
              "izin"
          ).length;

        // =====================================
        // TUGAS
        // =====================================

        const tugasPeserta =
          tugasPesertaResult.data ||
          [];

        const tugasSelesai =
          tugasPeserta.filter(
            (item) =>
              item.status ===
              "selesai"
          ).length;

        // =====================================
        // SET COUNT
        // =====================================

        setCounts({
          hadir:
            jumlahHadir,

          sakit:
            jumlahSakit,

          izin:
            jumlahIzin,

          tugas:
            tugasPeserta.length,

          jurnal:
            jurnalResult.count ||
            0,

          tugasSelesai,
        });

        // =====================================
        // ABSENSI HARI INI
        // =====================================

        if (
          absensiHariIniResult.data
        ) {
          const absensi =
            absensiHariIniResult.data;

          setAbsensiHariIni({
            jamMasuk:
              formatJam(
                absensi.jam_masuk
              ),

            jamPulang:
              formatJam(
                absensi.jam_pulang
              ),

            status:
              absensi.status ||
              "belum_absen",
          });
        } else {
          setAbsensiHariIni(
            null
          );
        }

        // =====================================
        // JADWAL HARI INI
        // =====================================

        if (
          jadwalResult.data
        ) {
          setJadwalHariIni({
            jamMulai:
              formatJam(
                jadwalResult
                  .data
                  .jam_mulai
              ),

            jamSelesai:
              formatJam(
                jadwalResult
                  .data
                  .jam_selesai
              ),
          });
        } else {
          setJadwalHariIni(
            null
          );
        }

        // =====================================
        // TUGAS HARI INI
        // =====================================

        if (
          tugasPeserta.length >
          0
        ) {
          const tugasIds =
            tugasPeserta.map(
              (item) =>
                item.tugas_id
            );

          const {
            data: tugasData,
            error: tugasError,
          } = await supabase
            .from("tugas")
            .select(`
              id,
              judul,
              deadline
            `)
            .in(
              "id",
              tugasIds
            )
            .order(
              "deadline",
              {
                ascending: true,
              }
            );

          if (tugasError) {
            console.error(
              "TUGAS ERROR:",
              tugasError
            );
          } else {
            const statusMap =
              new Map(
                tugasPeserta.map(
                  (item) => [
                    String(
                      item.tugas_id
                    ),
                    item.status,
                  ]
                )
              );

            const todayTasks =
              (
                tugasData || []
              )
                .filter(
                  (item) => {
                    // jangan tampilkan
                    // tugas selesai

                    const status =
                      statusMap.get(
                        String(
                          item.id
                        )
                      );

                    if (
                      status ===
                      "selesai"
                    ) {
                      return false;
                    }

                    if (
                      !item.deadline
                    ) {
                      return false;
                    }

                    return (
                      getDateOnly(
                        item.deadline
                      ) === today
                    );
                  }
                )
                .slice(0, 3)
                .map(
                  (item) => ({
                    id:
                      String(
                        item.id
                      ),

                    judul:
                      item.judul ||
                      "Tugas",
                  })
                );

            setTugasHariIni(
              todayTasks
            );
          }
        } else {
          setTugasHariIni(
            []
          );
        }

        // =====================================
        // PENGUMUMAN
        // =====================================

        if (
          pengumumanResult.data
        ) {
          setPengumumanTerbaru({
            judul:
              pengumumanResult
                .data
                .judul,

            isi:
              pengumumanResult
                .data
                .isi,

            createdAt:
              pengumumanResult
                .data
                .created_at,
          });
        } else {
          setPengumumanTerbaru(
            null
          );
        }
      } catch (err) {
        console.error(
          "DASHBOARD ERROR:",
          err
        );

        setError(
          "Gagal mengambil data dashboard."
        );
      } finally {
        setLoading(false);
      }
    }, [today]);

  // =========================================
  // LOAD
  // =========================================

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // =========================================
  // PROGRESS MAGANG
  // =========================================

  const progressMagang =
    useMemo(() => {
      return hitungProgressMagang(
        profile.tanggalMulai,
        profile.tanggalSelesai
      );
    }, [
      profile.tanggalMulai,
      profile.tanggalSelesai,
    ]);

  useEffect(() => {
    async function selesaikanMagangOtomatis() {
      if (
        progressMagang.persen < 100 ||
        profile.status !== "aktif"
      ) {
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("peserta")
        .update({
          status: "selesai",
        })
        .eq("user_id", user.id)
        .eq("status", "aktif");

      if (error) {
        console.error(error);
        return;
      }

      setProfile((prev) => ({
        ...prev,
        status: "selesai",
      }));
    }

    selesaikanMagangOtomatis();
  }, [
    progressMagang.persen,
    profile.status,
  ]);

  // =========================================
  // PROGRESS TUGAS
  // =========================================

  const progressTugas =
    useMemo(() => {
      if (
        counts.tugas === 0
      ) {
        return 0;
      }

      return Math.round(
        (counts.tugasSelesai /
          counts.tugas) *
        100
      );
    }, [
      counts.tugas,
      counts.tugasSelesai,
    ]);

  // =========================================
  // STAT CARD
  // =========================================

  const stats =
    useMemo(
      () => [
        {
          key: "hadir",
          label: "Hadir",
          value:
            counts.hadir,
          bg: "bg-emerald-100",
          text: "text-emerald-700",
          icon: CheckCircle2,
        },
        {
          key: "sakit",
          label: "Sakit",
          value:
            counts.sakit,
          bg: "bg-amber-100",
          text: "text-amber-700",
          icon: AlertCircle,
        },
        {
          key: "izin",
          label: "Izin",
          value:
            counts.izin,
          bg: "bg-blue-100",
          text: "text-blue-700",
          icon: FileText,
        },
        {
          key: "tugas",
          label: "Tugas",
          value:
            counts.tugas,
          bg: "bg-pink-100",
          text: "text-pink-700",
          icon: ClipboardList,
        },
      ],
      [counts]
    );

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">

        <div className="text-center">

          <BriefcaseBusiness
            size={32}
            className="mx-auto mb-3 animate-pulse text-blue-500"
          />

          <p className="text-sm text-neutral-500">
            Memuat dashboard...
          </p>

        </div>

      </div>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
          {error}
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white p-6 md:p-8">

      {/* =====================================
          PROFILE + PROGRESS
      ===================================== */}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">

        {/* PROFILE */}

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-6 md:flex-row md:items-center">

            {/* FOTO */}

            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">

              {profile.fotoUrl ? (
                <img
                  src={profile.fotoUrl}
                  alt={`Foto profil ${profile.nama}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User
                  size={42}
                  strokeWidth={1.5}
                  className="text-neutral-400"
                />
              )}

            </div>

            {/* DATA PESERTA */}

            <div className="min-w-0 flex-1">

              <div className="mb-4">

                <p className="text-sm font-medium text-blue-600">
                  PESERTA MAGANG
                </p>

                <h1 className="mt-1 text-xl font-semibold text-neutral-900">
                  {profile.nama}
                </h1>

              </div>

              <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">

                <InfoItem
                  label="No peserta"
                  value={
                    profile.nomorPeserta
                  }
                />

                <InfoItem
                  label="Pembimbing"
                  value={
                    profile.pembimbing
                  }
                />

                <InfoItem
                  label="Sekolah"
                  value={
                    profile.sekolah
                  }
                />

                <InfoItem
                  label="Divisi"
                  value={
                    profile.divisi
                  }
                />

              </div>

            </div>

            {/* STATUS */}

            <div
              className={`flex shrink-0 items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-medium md:self-center ${profile.status ===
                "aktif"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-neutral-100 text-neutral-600"
                }`}
            >

              <span
                className={`h-2 w-2 rounded-full ${profile.status ===
                  "aktif"
                  ? "bg-emerald-500"
                  : "bg-neutral-400"
                  }`}
              />

              {formatStatusPeserta(
                profile.status
              )}

            </div>

          </div>

        </div>

        {/* =====================================
            PROGRESS MAGANG
        ===================================== */}

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <div>

              <p className="text-sm text-neutral-500">
                Progress magang
              </p>

              <p className="mt-1 text-xl font-semibold text-neutral-900">
                {progressMagang.persen}%
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">

              <BriefcaseBusiness
                size={20}
              />

            </div>

          </div>

          <div className="mb-2 h-2 overflow-hidden rounded-full bg-neutral-100">

            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${progressMagang.persen}%`,
              }}
            />

          </div>

          <div className="flex justify-between gap-2 text-xs text-neutral-400">

            <span>
              {
                progressMagang.hariBerjalan
              }{" "}
              hari berjalan
            </span>

            <span>
              {
                progressMagang.sisaHari
              }{" "}
              hari tersisa
            </span>

          </div>

        </div>

      </div>

      {/* =====================================
          INFORMASI HARI INI
      ===================================== */}

      <div className="mt-8">

        <div className="mb-4">

          <h2 className="mt-1 text-xl font-semibold text-neutral-900">
            {tanggalHariIni}
          </h2>

        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr_320px]">

          {/* ===================================
              KEHADIRAN
          =================================== */}

          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h3 className="text-base font-semibold text-neutral-900">
                  Kehadiran
                </h3>

                <p className="mt-1 text-xs text-neutral-500">
                  Status kehadiran hari ini
                </p>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">

                <UserCheck
                  size={19}
                />

              </div>

            </div>

            <div className="space-y-4">

              <InfoRow
                label="Jadwal"
                value={
                  jadwalHariIni
                    ? `${jadwalHariIni.jamMulai} - ${jadwalHariIni.jamSelesai}`
                    : "Tidak ada jadwal"
                }
              />

              <InfoRow
                label="Jam masuk"
                value="09:00"
              />

              <InfoRow
                label="Jam pulang"
                value="15:00"
              />

              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">
                  Status
                </span>

                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${getAttendanceStyle(
                    absensiHariIni?.status
                  )}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${getAttendanceDot(
                      absensiHariIni?.status
                    )}`}
                  />

                  {formatAttendanceStatus(
                    absensiHariIni?.status
                  )}
                </span>
              </div>

            </div>

            <Link
              href="/aktif/absensi"
              className="mt-6 flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-blue-50 hover:text-blue-700"
            >

              <span>
                Lihat absensi
              </span>

              <ArrowRight
                size={16}
              />

            </Link>

          </div>

          {/* ===================================
              TUGAS + PENGUMUMAN
          =================================== */}

          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

            {/* TUGAS */}

            <div>

              <div className="mb-4 flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-600">

                    <ClipboardList
                      size={19}
                    />

                  </div>

                  <div>

                    <h3 className="text-base font-semibold text-neutral-900">
                      Tugas hari ini
                    </h3>

                    <p className="text-xs text-neutral-500">
                      Tugas yang perlu dikerjakan
                    </p>

                  </div>

                </div>

                <Link
                  href="/aktif/tugas"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Lihat semua
                </Link>

              </div>

              {tugasHariIni.length >
                0 ? (

                <div className="space-y-2">

                  {tugasHariIni.map(
                    (tugas) => (

                      <TaskItem
                        key={
                          tugas.id
                        }
                        text={
                          tugas.judul
                        }
                      />

                    )
                  )}

                </div>

              ) : (

                <div className="rounded-xl bg-neutral-50 px-4 py-4">

                  <p className="text-sm text-neutral-500">
                    Tidak ada tugas dengan
                    deadline hari ini.
                  </p>

                </div>

              )}

            </div>

            <div className="my-6 border-t border-neutral-100" />

            {/* =================================
                PENGUMUMAN
            ================================= */}

            <div>

              <div className="mb-4 flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                  <Megaphone
                    size={19}
                  />

                </div>

                <div>

                  <h3 className="text-base font-semibold text-neutral-900">
                    Pengumuman terbaru
                  </h3>

                  <p className="text-xs text-neutral-500">
                    Informasi terbaru dari
                    pembimbing
                  </p>

                </div>

              </div>

              {pengumumanTerbaru ? (

                <Link
                  href="/aktif/pengumuman"
                  className="block rounded-2xl bg-blue-50/60 p-4 transition hover:bg-blue-50"
                >

                  <p className="text-sm font-medium text-neutral-800">
                    {
                      pengumumanTerbaru
                        .judul
                    }
                  </p>

                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                    {
                      pengumumanTerbaru
                        .isi
                    }
                  </p>

                  <p className="mt-2 text-[11px] text-blue-600">
                    {formatPengumumanTime(
                      pengumumanTerbaru
                        .createdAt
                    )}
                  </p>

                </Link>

              ) : (

                <div className="rounded-2xl bg-neutral-50 p-4">

                  <p className="text-sm text-neutral-500">
                    Belum ada pengumuman.
                  </p>

                </div>

              )}

            </div>

          </div>

          {/* ===================================
              STATISTICS
          =================================== */}

          <div className="grid grid-cols-2 gap-3">

            {stats.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <div
                    key={
                      item.key
                    }
                    className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                  >

                    <div
                      className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${item.bg} ${item.text}`}
                    >
                      <Icon
                        size={17}
                      />
                    </div>

                    <p className="text-xs text-neutral-500">
                      {item.label}
                    </p>

                    <p className="mt-1 text-lg font-semibold text-neutral-900">
                      {item.value}
                    </p>

                  </div>
                );
              }
            )}

            {/* JURNAL */}

            <div className="col-span-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-xs text-neutral-500">
                    Total jurnal
                  </p>

                  <p className="mt-1 text-lg font-semibold text-neutral-900">
                    {counts.jurnal}
                  </p>

                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">

                  <BookOpen
                    size={17}
                  />

                </div>

              </div>

            </div>

            {/* PROGRESS TUGAS */}

            <div className="col-span-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">

              <div className="mb-2 flex items-center justify-between">

                <p className="text-xs text-neutral-500">
                  Progress tugas
                </p>

                <p className="text-xs font-semibold text-blue-600">
                  {progressTugas}%
                </p>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-neutral-100">

                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{
                    width: `${progressTugas}%`,
                  }}
                />

              </div>

              <p className="mt-2 text-[11px] text-neutral-400">

                {counts.tugasSelesai} dari{" "}
                {counts.tugas} tugas
                selesai

              </p>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================
          QUICK ACTION
      ===================================== */}

      <div className="mt-8">

        <div className="mb-4">

          <h2 className="mt-1 text-xl font-semibold text-neutral-900">
            Action Forward
          </h2>

        </div>

        <div className="flex flex-wrap gap-3">

          {quickActions.map(
            (action) => {
              const Icon =
                action.icon;

              return (
                <Link
                  key={
                    action.key
                  }
                  href={
                    action.href
                  }
                  className="group flex items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >

                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${action.bg} ${action.text}`}
                  >
                    <Icon
                      size={16}
                    />
                  </span>

                  <span>
                    {
                      action.label
                    }
                  </span>

                  <ArrowRight
                    size={14}
                    className="text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500"
                  />

                </Link>
              );
            }
          )}

        </div>

      </div>

    </div>
  );
}

// =========================================
// INFO ITEM
// =========================================

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <p className="text-neutral-500">

      {label}{" "}

      <span className="font-medium text-neutral-900">
        {value}
      </span>

    </p>
  );
}

// =========================================
// INFO ROW
// =========================================

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0">

      <span className="text-sm text-neutral-500">
        {label}
      </span>

      <span className="text-sm font-medium text-neutral-800">
        {value}
      </span>

    </div>
  );
}

// =========================================
// TASK ITEM
// =========================================

function TaskItem({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-neutral-50 px-3 py-2.5">

      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-400 shadow-sm">

        <ClipboardList
          size={14}
        />

      </div>

      <span className="text-sm text-neutral-700">
        {text}
      </span>

    </div>
  );
}

// =========================================
// GET LOCAL DATE
// =========================================

function getLocalDate() {
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

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

// =========================================
// DATE ONLY
// =========================================

function getDateOnly(
  value: string
) {
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return value;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

// =========================================
// FORMAT JAM
// Support TIME dan TIMESTAMP
// =========================================

function formatJam(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "-";
  }

  // Contoh:
  // 08:30:00

  if (
    /^\d{2}:\d{2}/.test(
      value
    )
  ) {
    return value.slice(
      0,
      5
    );
  }

  // TIMESTAMP

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleTimeString(
    "id-ID",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  );
}

// =========================================
// PROGRESS MAGANG
// =========================================

function hitungProgressMagang(
  tanggalMulai: string | null,
  tanggalSelesai: string | null
) {
  if (
    !tanggalMulai ||
    !tanggalSelesai
  ) {
    return {
      persen: 0,
      hariBerjalan: 0,
      sisaHari: 0,
    };
  }

  const mulai =
    new Date(
      `${tanggalMulai}T00:00:00`
    );

  const selesai =
    new Date(
      `${tanggalSelesai}T00:00:00`
    );

  const sekarang =
    new Date();

  sekarang.setHours(
    0,
    0,
    0,
    0
  );

  const oneDay =
    1000 *
    60 *
    60 *
    24;

  const totalHari =
    Math.max(
      1,
      Math.ceil(
        (selesai.getTime() -
          mulai.getTime()) /
        oneDay
      ) + 1
    );

  let hariBerjalan =
    Math.floor(
      (sekarang.getTime() -
        mulai.getTime()) /
      oneDay
    ) + 1;

  hariBerjalan =
    Math.max(
      0,
      Math.min(
        hariBerjalan,
        totalHari
      )
    );

  const sisaHari =
    Math.max(
      totalHari -
      hariBerjalan,
      0
    );

  const persen =
    Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (hariBerjalan /
            totalHari) *
          100
        )
      )
    );

  return {
    persen,
    hariBerjalan,
    sisaHari,
  };
}

// =========================================
// STATUS PESERTA
// =========================================

function formatStatusPeserta(
  status: string
) {
  switch (status) {
    case "aktif":
      return "Aktif";

    case "selesai":
      return "Selesai";

    case "diterima":
      return "Diterima";

    case "mengajukan":
      return "Mengajukan";

    case "ditolak":
      return "Ditolak";

    case "tidak_aktif":
      return "Tidak Aktif";

    default:
      return status || "-";
  }
}

// =========================================
// STATUS ABSENSI
// =========================================

function formatAttendanceStatus(
  status:
    | string
    | undefined
) {
  switch (status) {
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
      return "Belum Absen";
  }
}

function getAttendanceStyle(
  status:
    | string
    | undefined
) {
  switch (status) {
    case "hadir":
      return "bg-emerald-100 text-emerald-700";

    case "terlambat":
      return "bg-amber-100 text-amber-700";

    case "izin":
      return "bg-blue-100 text-blue-700";

    case "sakit":
      return "bg-orange-100 text-orange-700";

    case "alpha":
      return "bg-red-100 text-red-700";

    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

function getAttendanceDot(
  status:
    | string
    | undefined
) {
  switch (status) {
    case "hadir":
      return "bg-emerald-500";

    case "terlambat":
      return "bg-amber-500";

    case "izin":
      return "bg-blue-500";

    case "sakit":
      return "bg-orange-500";

    case "alpha":
      return "bg-red-500";

    default:
      return "bg-neutral-400";
  }
}

// =========================================
// PENGUMUMAN TIME
// =========================================

function formatPengumumanTime(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  const sekarang =
    new Date();

  const isToday =
    date.getDate() ===
    sekarang.getDate() &&
    date.getMonth() ===
    sekarang.getMonth() &&
    date.getFullYear() ===
    sekarang.getFullYear();

  const jam =
    date.toLocaleTimeString(
      "id-ID",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    );

  if (isToday) {
    return `Hari ini • ${jam}`;
  }

  const tanggal =
    date.toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  return `${tanggal} • ${jam}`;
}