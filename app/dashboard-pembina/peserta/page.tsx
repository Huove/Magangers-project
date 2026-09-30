"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  LayoutGrid,
  List as ListIcon,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Mail,
  Phone,
  Loader2,
  BriefcaseBusiness,
} from "lucide-react";

import Link from "next/link";

import {
  supabase,
} from "@/lib/supabase";


// =====================================================
// STATUS UI
// =====================================================

type StatusPeserta =
  | "Diterima"
  | "Aktif"
  | "Selesai"
  | "Tidak Aktif"
  | "Mengajukan"
  | "Ditolak";


// =====================================================
// PESERTA UI
// =====================================================

type PesertaBimbingan = {
  id: string;

  userId:
    | string
    | null;

  nomorPeserta: string;

  nama: string;

  email: string;

  telepon: string;

  kampus: string;

  jurusan: string;

  divisi: string;

  posisi: string;

  status:
    StatusPeserta;

  progress: number;

  tanggalMulai:
    | string
    | null;

  tanggalSelesai:
    | string
    | null;

  needsAttention: boolean;

  attentionNote:
    | string
    | null;
};


// =====================================================
// DATABASE TYPES
// =====================================================

type PenempatanRow = {
  peserta_id: string;

  pembimbing_id:
    | string
    | null;

  divisi:
    | string
    | null;

  posisi:
    | string
    | null;

  tanggal_mulai: string;

  tanggal_selesai:
    | string
    | null;
};


type PesertaRow = {
  id: string;

  user_id:
    | string
    | null;

  nomor_peserta:
    | string
    | null;

  nama_lengkap:
    | string
    | null;

  email:
    | string
    | null;

  nomor_hp:
    | string
    | null;

  status:
    | string
    | null;

  tanggal_mulai:
    | string
    | null;

  tanggal_selesai:
    | string
    | null;
};


type PendidikanRow = {
  peserta_id: string;

  sekolah:
    | string
    | null;

  jurusan:
    | string
    | null;
};


type ProfileRow = {
  id: string;

  nama_lengkap:
    | string
    | null;

  email:
    | string
    | null;

  nomor_hp:
    | string
    | null;
};


type TugasRow = {
  id: string;

  deadline:
    | string
    | null;
};


type TugasPesertaRow = {
  tugas_id: string;

  peserta_id: string;

  status:
    | string
    | null;

  dikumpulkan_at:
    | string
    | null;
};


// =====================================================
// FILTER
// =====================================================

const STATUS_FILTERS:
  Array<
    StatusPeserta |
    "Semua"
  > = [
    "Semua",
    "Diterima",
    "Aktif",
    "Selesai",
  ];


// =====================================================
// PAGE
// =====================================================

export default function PesertaListPage() {
  // ===================================================
  // DATA
  // ===================================================

  const [
    pesertaList,
    setPesertaList,
  ] =
    useState<
      PesertaBimbingan[]
    >([]);


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
  // UI
  // ===================================================

  const [
    view,
    setView,
  ] =
    useState<
      "table" |
      "grid"
    >(
      "table"
    );


  const [
    query,
    setQuery,
  ] =
    useState(
      ""
    );


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      StatusPeserta |
      "Semua"
    >(
      "Semua"
    );


  // ===================================================
  // FETCH
  // ===================================================

  const fetchPeserta =
    useCallback(
      async () => {
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


          // =============================================
          // 3. PENEMPATAN PESERTA
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
                peserta_id,
                pembimbing_id,
                divisi,
                posisi,
                tanggal_mulai,
                tanggal_selesai
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


          const placements =
            (
              penempatanData ??
              []
            ) as PenempatanRow[];


          // =============================================
          // BELUM PUNYA PESERTA
          // =============================================

          if (
            placements.length ===
            0
          ) {
            setPesertaList(
              []
            );

            return;
          }


          // =============================================
          // 4. PARTICIPANT IDS
          // =============================================

          const pesertaIds = [
            ...new Set(
              placements.map(
                (
                  item
                ) =>
                  item.peserta_id
              )
            ),
          ];


          // =============================================
          // 5. PESERTA
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
                nomor_peserta,
                nama_lengkap,
                email,
                nomor_hp,
                status,
                tanggal_mulai,
                tanggal_selesai
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
          // 6. PENDIDIKAN
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
          // 7. PROFILES
          //
          // FALLBACK:
          // nama
          // email
          // nomor hp
          // =============================================

          const profileIds =
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


          let profileRows:
            ProfileRow[] =
            [];


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
                  nama_lengkap,
                  email,
                  nomor_hp
                `)
                .in(
                  "id",
                  profileIds
                );


            if (
              profileError
            ) {
              console.error(
                "PROFILE ERROR:",
                profileError
              );
            } else {
              profileRows =
                (
                  profileData ??
                  []
                ) as ProfileRow[];
            }
          }


          // =============================================
          // 8. TUGAS PEMBIMBING
          //
          // Dipakai menentukan:
          // Butuh Perhatian
          // =============================================

          let tugasRows:
            TugasRow[] =
            [];


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
                deadline
              `)
              .eq(
                "pembimbing_id",
                pembimbing.id
              );


          if (
            tugasError
          ) {
            console.error(
              "TUGAS ERROR:",
              tugasError
            );
          } else {
            tugasRows =
              (
                tugasData ??
                []
              ) as TugasRow[];
          }


          // =============================================
          // 9. TUGAS PESERTA
          // =============================================

          let tugasPesertaRows:
            TugasPesertaRow[] =
            [];


          const tugasIds =
            tugasRows.map(
              (
                item
              ) =>
                item.id
            );


          if (
            tugasIds.length >
            0
          ) {
            const {
              data:
                tugasPesertaData,
              error:
                tugasPesertaError,
            } =
              await supabase
                .from(
                  "tugas_peserta"
                )
                .select(`
                  tugas_id,
                  peserta_id,
                  status,
                  dikumpulkan_at
                `)
                .in(
                  "tugas_id",
                  tugasIds
                )
                .in(
                  "peserta_id",
                  pesertaIds
                );


            if (
              tugasPesertaError
            ) {
              console.error(
                "TUGAS PESERTA ERROR:",
                tugasPesertaError
              );
            } else {
              tugasPesertaRows =
                (
                  tugasPesertaData ??
                  []
                ) as TugasPesertaRow[];
            }
          }


          // =============================================
          // 10. MAP DATA
          // =============================================

          const placementMap =
            new Map<
              string,
              PenempatanRow
            >();


          for (
            const item
            of placements
          ) {
            placementMap.set(
              item.peserta_id,
              item
            );
          }


          const pendidikanMap =
            new Map<
              string,
              PendidikanRow
            >();


          for (
            const item
            of pendidikanRows
          ) {
            pendidikanMap.set(
              item.peserta_id,
              item
            );
          }


          const profileMap =
            new Map<
              string,
              ProfileRow
            >();


          for (
            const item
            of profileRows
          ) {
            profileMap.set(
              item.id,
              item
            );
          }


          const deadlineMap =
            new Map<
              string,
              string | null
            >();


          for (
            const item
            of tugasRows
          ) {
            deadlineMap.set(
              item.id,
              item.deadline
            );
          }


          // =============================================
          // 11. FORMAT PESERTA
          // =============================================

          const formatted =
            pesertaRows.map(
              (
                peserta
              ):
                PesertaBimbingan => {

                const placement =
                  placementMap.get(
                    peserta.id
                  );


                const pendidikan =
                  pendidikanMap.get(
                    peserta.id
                  );


                const profile =
                  peserta.user_id
                    ? profileMap.get(
                        peserta.user_id
                      )
                    : undefined;


                // =======================================
                // NAMA
                // =======================================

                const nama =
                  peserta
                    .nama_lengkap ||

                  profile
                    ?.nama_lengkap ||

                  "Peserta";


                // =======================================
                // EMAIL
                // =======================================

                const email =
                  peserta.email ||

                  profile
                    ?.email ||

                  "-";


                // =======================================
                // PHONE
                // =======================================

                const telepon =
                  peserta
                    .nomor_hp ||

                  profile
                    ?.nomor_hp ||

                  "-";


                // =======================================
                // PERIOD
                // =======================================

                const tanggalMulai =
                  placement
                    ?.tanggal_mulai ||

                  peserta
                    .tanggal_mulai ||

                  null;


                const tanggalSelesai =
                  placement
                    ?.tanggal_selesai ||

                  peserta
                    .tanggal_selesai ||

                  null;


                // =======================================
                // STATUS
                // =======================================

                const status =
                  formatStatusPeserta(
                    peserta.status
                  );


                // =======================================
                // PROGRESS
                // =======================================

                const progress =
                  calculateProgress(
                    status,
                    tanggalMulai,
                    tanggalSelesai
                  );


                // =======================================
                // ATTENTION
                // =======================================

                const attention =
                  getParticipantAttention(
                    peserta.id,
                    tugasPesertaRows,
                    deadlineMap
                  );


                return {
                  id:
                    peserta.id,

                  userId:
                    peserta.user_id,

                  nomorPeserta:
                    peserta
                      .nomor_peserta ??
                    "-",

                  nama,

                  email,

                  telepon,

                  kampus:
                    pendidikan
                      ?.sekolah ??
                    "-",

                  jurusan:
                    pendidikan
                      ?.jurusan ??
                    "-",

                  divisi:
                    placement
                      ?.divisi ??
                    "-",

                  posisi:
                    placement
                      ?.posisi ??
                    "-",

                  status,

                  progress,

                  tanggalMulai,

                  tanggalSelesai,

                  needsAttention:
                    attention
                      .needsAttention,

                  attentionNote:
                    attention.note,
                };
              }
            );


          // =============================================
          // 12. SORT
          //
          // Aktif di atas.
          // =============================================

          formatted.sort(
            (
              a,
              b
            ) => {
              const priority:
                Record<
                  StatusPeserta,
                  number
                > = {
                Aktif: 1,

                Diterima: 2,

                Selesai: 3,

                "Tidak Aktif": 4,

                Mengajukan: 5,

                Ditolak: 6,
              };


              const difference =
                priority[
                  a.status
                ] -
                priority[
                  b.status
                ];


              if (
                difference !==
                0
              ) {
                return difference;
              }


              return a.nama
                .localeCompare(
                  b.nama
                );
            }
          );


          setPesertaList(
            formatted
          );

        } catch (
          err
        ) {
          console.error(
            "PESERTA BIMBINGAN ERROR:",
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil peserta bimbingan."
          );


          setPesertaList(
            []
          );

        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );


  // ===================================================
  // LOAD
  // ===================================================

  useEffect(() => {
    fetchPeserta();
  }, [
    fetchPeserta,
  ]);


  // ===================================================
  // STATS
  // ===================================================

  const stats =
    useMemo(
      () => {
        const total =
          pesertaList.length;


        const aktif =
          pesertaList.filter(
            (
              peserta
            ) =>
              peserta.status ===
              "Aktif"
          ).length;


        const diterima =
          pesertaList.filter(
            (
              peserta
            ) =>
              peserta.status ===
              "Diterima"
          ).length;


        const butuhPerhatian =
          pesertaList.filter(
            (
              peserta
            ) =>
              peserta
                .needsAttention
          ).length;


        return {
          total,

          aktif,

          diterima,

          butuhPerhatian,
        };
      },
      [
        pesertaList,
      ]
    );


  // ===================================================
  // FILTER
  // ===================================================

  const filtered =
    useMemo(
      () => {
        const keyword =
          query
            .trim()
            .toLowerCase();


        return pesertaList.filter(
          (
            peserta
          ) => {
            // =============================================
            // SEARCH
            // =============================================

            const matchQuery =
              !keyword ||

              peserta.nama
                .toLowerCase()
                .includes(
                  keyword
                ) ||

              peserta.kampus
                .toLowerCase()
                .includes(
                  keyword
                ) ||

              peserta.posisi
                .toLowerCase()
                .includes(
                  keyword
                ) ||

              peserta.divisi
                .toLowerCase()
                .includes(
                  keyword
                ) ||

              peserta.email
                .toLowerCase()
                .includes(
                  keyword
                );


            // =============================================
            // STATUS
            // =============================================

            const matchStatus =
              statusFilter ===
                "Semua" ||

              peserta.status ===
                statusFilter;


            return (
              matchQuery &&
              matchStatus
            );
          }
        );
      },
      [
        pesertaList,
        query,
        statusFilter,
      ]
    );


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6">

        <h1 className="text-2xl font-extrabold text-slate-900">
          Peserta Bimbingan
        </h1>


        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">

          <Link
            href="/dashboard-pembina"
            className="hover:text-slate-600"
          >
            Dashboard
          </Link>


          <ChevronRight className="h-3.5 w-3.5" />


          <span className="text-slate-500">
            Peserta Bimbingan
          </span>

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

          <div className="flex items-start gap-2">

            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              {error}
            </span>

          </div>

        </div>

      )}


      {/* =================================================
          STATS
      ================================================= */}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

        {/* TOTAL */}

        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100">

            <Users className="h-5 w-5 text-blue-500" />

          </span>


          <div>

            <p className="text-xl font-extrabold text-slate-900">
              {loading
                ? "-"
                : stats.total}
            </p>


            <p className="text-xs text-slate-500">
              Total Peserta
            </p>

          </div>

        </div>


        {/* AKTIF */}

        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100">

            <CheckCircle2 className="h-5 w-5 text-emerald-500" />

          </span>


          <div>

            <p className="text-xl font-extrabold text-slate-900">
              {loading
                ? "-"
                : stats.aktif}
            </p>


            <p className="text-xs text-slate-500">
              Aktif
            </p>

          </div>

        </div>


        {/* DITERIMA */}

        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100">

            <Clock className="h-5 w-5 text-amber-500" />

          </span>


          <div>

            <p className="text-xl font-extrabold text-slate-900">
              {loading
                ? "-"
                : stats.diterima}
            </p>


            <p className="text-xs text-slate-500">
              Diterima
            </p>

          </div>

        </div>


        {/* ATTENTION */}

        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">

          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-100">

            <AlertCircle className="h-5 w-5 text-red-500" />

          </span>


          <div>

            <p className="text-xl font-extrabold text-slate-900">
              {loading
                ? "-"
                : stats.butuhPerhatian}
            </p>


            <p className="text-xs text-slate-500">
              Butuh Perhatian
            </p>

          </div>

        </div>

      </div>


      {/* =================================================
          CONTROLS
      ================================================= */}

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

        {/* SEARCH */}

        <div className="relative w-full sm:max-w-sm">

          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />


          <input
            type="text"
            value={
              query
            }
            onChange={(
              event
            ) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Cari nama atau kampus..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-brand-blue focus:bg-white"
          />

        </div>


        <div className="flex flex-wrap items-center gap-3">

          {/* STATUS FILTER */}

          <div className="flex flex-wrap gap-1.5">

            {STATUS_FILTERS.map(
              (
                status
              ) => (

                <button
                  type="button"
                  key={
                    status
                  }
                  onClick={() =>
                    setStatusFilter(
                      status
                    )
                  }
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilter ===
                    status
                      ? "bg-brand-blue text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status}
                </button>

              )
            )}

          </div>


          {/* VIEW */}

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-1">

            <button
              type="button"
              onClick={() =>
                setView(
                  "table"
                )
              }
              aria-label="Tampilan tabel"
              className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
                view ===
                "table"
                  ? "bg-brand-blue text-white"
                  : "text-slate-400 hover:bg-slate-100"
              }`}
            >
              <ListIcon className="h-4 w-4" />
            </button>


            <button
              type="button"
              onClick={() =>
                setView(
                  "grid"
                )
              }
              aria-label="Tampilan kartu"
              className={`grid h-8 w-8 place-items-center rounded-lg transition-colors ${
                view ===
                "grid"
                  ? "bg-brand-blue text-white"
                  : "text-slate-400 hover:bg-slate-100"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>

          </div>

        </div>

      </div>


      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (

        <div className="mt-6 flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm">

          <div className="text-center">

            <Loader2 className="mx-auto h-7 w-7 animate-spin text-blue-600" />


            <p className="mt-3 text-sm text-slate-400">
              Memuat peserta bimbingan...
            </p>

          </div>

        </div>

      )}


      {/* =================================================
          EMPTY
      ================================================= */}

      {!loading &&
        filtered.length ===
          0 && (

        <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-sm">

          <Users className="mx-auto h-8 w-8 text-slate-300" />


          <p className="mt-3 text-sm font-medium text-slate-500">
            Tidak ada peserta
          </p>


          <p className="mt-1 text-xs text-slate-400">
            Tidak ada peserta yang cocok dengan pencarian atau filter ini.
          </p>

        </div>

      )}


      {/* =================================================
          TABLE
      ================================================= */}

      {!loading &&
        filtered.length >
          0 &&
        view ===
          "table" && (

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">

          <table className="w-full min-w-[900px] text-left text-sm">

            <thead>

              <tr className="border-b border-slate-100 text-slate-400">

                <th className="px-6 py-4 font-medium">
                  Peserta
                </th>


                <th className="px-4 py-4 font-medium">
                  Kampus
                </th>


                <th className="px-4 py-4 font-medium">
                  Status
                </th>


                <th className="px-4 py-4 font-medium">
                  Progress
                </th>


                <th className="px-6 py-4 font-medium" />

              </tr>

            </thead>


            <tbody>

              {filtered.map(
                (
                  peserta
                ) => (

                <tr
                  key={
                    peserta.id
                  }
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                >

                  {/* PESERTA */}

                  <td className="px-6 py-4">

                    <div className="flex items-center gap-3">

                      <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-sm font-bold text-blue-600">

                        {getInisial(
                          peserta.nama
                        )}


                        {peserta.needsAttention && (

                          <span
                            title={
                              peserta.attentionNote ??
                              "Butuh perhatian"
                            }
                            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-red-500"
                          />

                        )}

                      </span>


                      <div>

                        <p className="font-semibold text-slate-900">
                          {peserta.nama}
                        </p>


                        <p className="text-xs text-slate-400">
                          {peserta.posisi}
                        </p>

                      </div>

                    </div>

                  </td>


                  {/* KAMPUS */}

                  <td className="px-4 py-4">

                    <p className="text-slate-500">
                      {peserta.kampus}
                    </p>


                    {peserta.jurusan !==
                      "-" && (

                      <p className="mt-0.5 text-xs text-slate-400">
                        {peserta.jurusan}
                      </p>

                    )}

                  </td>


                  {/* STATUS */}

                  <td className="px-4 py-4">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(
                        peserta.status
                      )}`}
                    >
                      {peserta.status}
                    </span>

                  </td>


                  {/* PROGRESS */}

                  <td className="px-4 py-4">

                    <div className="flex items-center gap-2">

                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full bg-brand-blue"
                          style={{
                            width:
                              `${peserta.progress}%`,
                          }}
                        />

                      </div>


                      <span className="text-xs text-slate-400">
                        {peserta.progress}%
                      </span>

                    </div>

                  </td>


                  {/* DETAIL */}

                  <td className="px-6 py-4 text-right">

                    <Link
                      href={`/dashboard-pembina/peserta/${peserta.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline"
                    >
                      Detail

                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>

                  </td>

                </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}


      {/* =================================================
          GRID
      ================================================= */}

      {!loading &&
        filtered.length >
          0 &&
        view ===
          "grid" && (

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {filtered.map(
            (
              peserta
            ) => (

            <Link
              key={
                peserta.id
              }
              href={`/dashboard-pembina/peserta/${peserta.id}`}
              className="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >

              {/* HEADER */}

              <div className="flex items-start justify-between">

                <span className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-base font-bold text-blue-600">

                  {getInisial(
                    peserta.nama
                  )}


                  {peserta.needsAttention && (

                    <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />

                  )}

                </span>


                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(
                    peserta.status
                  )}`}
                >
                  {peserta.status}
                </span>

              </div>


              {/* NAME */}

              <h3 className="mt-3 font-bold text-slate-900 group-hover:text-brand-blue">
                {peserta.nama}
              </h3>


              <p className="text-sm text-slate-500">
                {peserta.posisi}
              </p>


              <p className="mt-1 text-xs text-slate-400">
                {peserta.kampus}
              </p>


              {/* DIVISION */}

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">

                <BriefcaseBusiness className="h-3.5 w-3.5 text-slate-400" />

                {peserta.divisi}

              </div>


              {/* CONTACT */}

              <div className="mt-4 space-y-1.5 text-xs text-slate-500">

                <p className="flex items-center gap-2">

                  <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                  <span className="truncate">
                    {peserta.email}
                  </span>

                </p>


                <p className="flex items-center gap-2">

                  <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                  {peserta.telepon}

                </p>

              </div>


              {/* PROGRESS */}

              <div className="mt-4 flex items-center gap-2">

                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-brand-blue"
                    style={{
                      width:
                        `${peserta.progress}%`,
                    }}
                  />

                </div>


                <span className="text-xs text-slate-400">
                  {peserta.progress}%
                </span>

              </div>


              {/* PERIOD */}

              <p className="mt-2 text-[11px] text-slate-400">
                {formatPeriode(
                  peserta.tanggalMulai,
                  peserta.tanggalSelesai
                )}
              </p>


              {/* ATTENTION */}

              {peserta.needsAttention &&
                peserta.attentionNote && (

                <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">

                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                  {peserta.attentionNote}

                </p>

              )}

            </Link>

            )
          )}

        </div>

      )}

    </div>
  );
}


// =====================================================
// STATUS DATABASE → UI
// =====================================================

function formatStatusPeserta(
  value:
    string | null
): StatusPeserta {
  switch (
    value
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
    default:
      return "Tidak Aktif";
  }
}


// =====================================================
// STATUS STYLE
// =====================================================

function statusBadgeClasses(
  status:
    StatusPeserta
) {
  switch (
    status
  ) {
    case "Aktif":
      return "bg-emerald-50 text-emerald-600";


    case "Diterima":
      return "bg-blue-50 text-blue-600";


    case "Selesai":
      return "bg-slate-100 text-slate-500";


    case "Mengajukan":
      return "bg-amber-50 text-amber-600";


    case "Ditolak":
      return "bg-red-50 text-red-600";


    default:
      return "bg-slate-100 text-slate-500";
  }
}


// =====================================================
// PROGRESS MAGANG
// =====================================================

function calculateProgress(
  status:
    StatusPeserta,

  tanggalMulai:
    string | null,

  tanggalSelesai:
    string | null
) {
  // ===================================================
  // SUDAH SELESAI
  // ===================================================

  if (
    status ===
    "Selesai"
  ) {
    return 100;
  }


  // ===================================================
  // BELUM PUNYA PERIODE
  // ===================================================

  if (
    !tanggalMulai ||
    !tanggalSelesai
  ) {
    return 0;
  }


  const start =
    new Date(
      `${tanggalMulai}T00:00:00+07:00`
    ).getTime();


  const end =
    new Date(
      `${tanggalSelesai}T23:59:59+07:00`
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


  // ===================================================
  // BELUM MULAI
  // ===================================================

  if (
    now <= start
  ) {
    return 0;
  }


  // ===================================================
  // SUDAH MELEWATI PERIODE
  // ===================================================

  if (
    now >= end
  ) {
    return 100;
  }


  // ===================================================
  // BERJALAN
  // ===================================================

  const progress =
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
    100;


  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        progress
      )
    )
  );
}


// =====================================================
// ATTENTION
// =====================================================

function getParticipantAttention(
  pesertaId:
    string,

  assignments:
    TugasPesertaRow[],

  deadlineMap:
    Map<
      string,
      string | null
    >
) {
  const pesertaAssignments =
    assignments.filter(
      (
        assignment
      ) =>
        assignment.peserta_id ===
        pesertaId
    );


  // ===================================================
  // PERLU REVISI
  // ===================================================

  const revision =
    pesertaAssignments.find(
      (
        assignment
      ) => {
        const status =
          normalizeStatus(
            assignment.status
          );


        return (
          status ===
            "perlu_revisi" ||

          status ===
            "perlu_perbaikan" ||

          status ===
            "revisi" ||

          status ===
            "direvisi"
        );
      }
    );


  if (
    revision
  ) {
    return {
      needsAttention:
        true,

      note:
        "Ada tugas yang perlu diperbaiki.",
    };
  }


  // ===================================================
  // TERLAMBAT MENGERJAKAN TUGAS
  // ===================================================

  const overdue =
    pesertaAssignments.find(
      (
        assignment
      ) => {
        const deadline =
          deadlineMap.get(
            assignment.tugas_id
          );


        if (!deadline) {
          return false;
        }


        const deadlineDate =
          new Date(
            deadline
          );


        if (
          Number.isNaN(
            deadlineDate
              .getTime()
          )
        ) {
          return false;
        }


        const status =
          normalizeStatus(
            assignment.status
          );


        const completed =
          status ===
            "selesai" ||

          status ===
            "disetujui" ||

          status ===
            "approved";


        return (
          !completed &&
          deadlineDate.getTime() <
            Date.now()
        );
      }
    );


  if (
    overdue
  ) {
    return {
      needsAttention:
        true,

      note:
        "Ada tugas yang melewati batas waktu.",
    };
  }


  return {
    needsAttention:
      false,

    note:
      null,
  };
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
// INITIAL
// =====================================================

function getInisial(
  nama:
    string
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
// PERIODE
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
// FORMAT DATE
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