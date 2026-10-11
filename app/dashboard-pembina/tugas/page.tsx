"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronRight,
  ChevronDown,
  Search,
  Users,
  Plus,
  Eye,
  MoreVertical,
  ClipboardList,
  ChevronLeft,
  ChevronRight as ChevronNext,
  ArrowUpDown,
  X,
  Loader2,
} from "lucide-react";

import Link from "next/link";

import {
  supabase,
} from "@/lib/supabase";


// =====================================================
// TYPE STATUS
// =====================================================

type StatusTugas =
  | "Menunggu"
  | "Selesai"
  | "Perlu Perbaikan";


// =====================================================
// TYPE PESERTA
// =====================================================

type ParticipantOption = {
  id: string;
  nama: string;
};


// =====================================================
// TYPE TASK ROW
// =====================================================

type TaskRow = {
  // Digunakan untuk key tabel.
  rowId: string;

  // ID tabel tugas.
  id: string;

  // ID tugas_peserta.
  assignmentId:
    | string
    | null;

  judul: string;

  deskripsi: string;

  pesertaId:
    | string
    | null;

  pesertaNama: string;

  deadlineRaw:
    | string
    | null;

  batasWaktu: string;

  status: StatusTugas;

  createdAt: string;
};


// =====================================================
// TYPE DATABASE
// =====================================================

type TaskDatabaseRow = {
  id: string;

  judul: string;

  deskripsi:
    | string
    | null;

  pembimbing_id:
    | string
    | null;

  deadline:
    | string
    | null;

  created_at: string;
};


type AssignmentDatabaseRow = {
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


type ParticipantDatabaseRow = {
  id: string;

  user_id:
    | string
    | null;

  nama_lengkap:
    | string
    | null;

  status:
    | string
    | null;
};


type PlacementDatabaseRow = {
  peserta_id: string;
};


// =====================================================
// STATUS OPTIONS
// =====================================================

const STATUS_OPTIONS:
  StatusTugas[] = [
    "Menunggu",
    "Selesai",
    "Perlu Perbaikan",
  ];


// =====================================================
// STATUS STYLE
// =====================================================

function statusBadgeClasses(
  status: StatusTugas
) {
  if (
    status ===
    "Menunggu"
  ) {
    return "bg-amber-100 text-amber-700";
  }


  if (
    status ===
    "Selesai"
  ) {
    return "bg-emerald-100 text-emerald-700";
  }


  return "bg-red-100 text-red-700";
}


function statusDotClasses(
  status: StatusTugas
) {
  if (
    status ===
    "Menunggu"
  ) {
    return "bg-amber-500";
  }


  if (
    status ===
    "Selesai"
  ) {
    return "bg-emerald-500";
  }


  return "bg-red-500";
}


// =====================================================
// PAGE
// =====================================================

export default function KelolaTugasPage() {
  // ===================================================
  // DATA
  // ===================================================

  const [
    tugasList,
    setTugasList,
  ] =
    useState<TaskRow[]>(
      []
    );


  const [
    pesertaOptions,
    setPesertaOptions,
  ] =
    useState<
      ParticipantOption[]
    >([]);


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
    error,
    setError,
  ] =
    useState(
      ""
    );


  // ===================================================
  // FORM
  // ===================================================

  const [
    showModal,
    setShowModal,
  ] =
    useState(
      false
    );


  const [
    submitting,
    setSubmitting,
  ] =
    useState(
      false
    );


  const [
    judul,
    setJudul,
  ] =
    useState(
      ""
    );


  const [
    deskripsi,
    setDeskripsi,
  ] =
    useState(
      ""
    );


  const [
    selectedPesertaId,
    setSelectedPesertaId,
  ] =
    useState(
      ""
    );


  const [
    deadline,
    setDeadline,
  ] =
    useState(
      ""
    );


  // ===================================================
  // FILTER
  // ===================================================

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      | "Semua Status"
      | StatusTugas
    >(
      "Semua Status"
    );


  const [
    pesertaFilter,
    setPesertaFilter,
  ] =
    useState(
      "Semua Peserta"
    );


  const [
    query,
    setQuery,
  ] =
    useState(
      ""
    );


  const [
    openMenuId,
    setOpenMenuId,
  ] =
    useState<
      string | null
    >(null);


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchTugas();
  }, []);


  // ===================================================
  // FETCH TUGAS
  // ===================================================

  async function fetchTugas() {
    try {
      setLoading(
        true
      );


      setError(
        ""
      );


      // ===============================================
      // 1. USER LOGIN
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
      // 2. PEMBIMBING LOGIN
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


      // ===============================================
      // 3. PESERTA BIMBINGAN
      // ===============================================

      const {
        data:
          placementData,
        error:
          placementError,
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
        placementError
      ) {
        throw placementError;
      }


      const placements =
        (
          placementData ??
          []
        ) as PlacementDatabaseRow[];


      const pesertaBimbinganIds = [
        ...new Set(
          placements.map(
            (
              item
            ) =>
              item.peserta_id
          )
        ),
      ];


      // ===============================================
      // 4. AMBIL DATA PESERTA BIMBINGAN
      // ===============================================

      let pesertaBimbingan:
        ParticipantDatabaseRow[] =
        [];


      if (
        pesertaBimbinganIds.length >
        0
      ) {
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
              status
            `)
            .in(
              "id",
              pesertaBimbinganIds
            );


        if (
          pesertaError
        ) {
          throw pesertaError;
        }


        pesertaBimbingan =
          (
            pesertaData ??
            []
          ) as ParticipantDatabaseRow[];
      }


      // ===============================================
      // 5. PROFILE FALLBACK UNTUK NAMA
      // ===============================================

      const pesertaUserIds =
        pesertaBimbingan
          .map(
            (
              peserta
            ) =>
              peserta.user_id
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
        pesertaUserIds.length >
        0
      ) {
        const {
          data:
            profiles,
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
              pesertaUserIds
            );


        if (
          profileError
        ) {
          console.error(
            "Gagal mengambil profile peserta:",
            profileError
          );
        } else {
          for (
            const profile
            of profiles ??
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


      // ===============================================
      // 6. MAP PESERTA
      // ===============================================

      const pesertaMap =
        new Map<
          string,
          string
        >();


      for (
        const peserta
        of pesertaBimbingan
      ) {
        let nama =
          peserta
            .nama_lengkap;


        if (
          !nama &&
          peserta.user_id
        ) {
          nama =
            profileMap.get(
              peserta.user_id
            ) ??
            null;
        }


        pesertaMap.set(
          peserta.id,
          nama ??
            "Peserta"
        );
      }


      // ===============================================
      // 7. OPTIONS PESERTA UNTUK MODAL
      //
      // HANYA PESERTA AKTIF
      // ===============================================

      const activeParticipantOptions =
        pesertaBimbingan
          .filter(
            (
              item
            ) =>
              item.status ===
              "aktif"
          )
          .map(
            (
              item
            ) => ({
              id:
                item.id,

              nama:
                pesertaMap.get(
                  item.id
                ) ??
                "Peserta",
            })
          )
          .sort(
            (
              a,
              b
            ) =>
              a.nama.localeCompare(
                b.nama
              )
          );


      setPesertaOptions(
        activeParticipantOptions
      );


      // ===============================================
      // 8. AMBIL TUGAS PEMBIMBING
      // ===============================================

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
            "pembimbing_id",
            pembimbing.id
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          );


      if (
        tugasError
      ) {
        throw tugasError;
      }


      const tugas =
        (
          tugasData ??
          []
        ) as TaskDatabaseRow[];


      // ===============================================
      // JIKA BELUM ADA TUGAS
      // ===============================================

      if (
        tugas.length ===
        0
      ) {
        setTugasList(
          []
        );

        return;
      }


      const tugasIds =
        tugas.map(
          (
            item
          ) =>
            item.id
        );


      // ===============================================
      // 9. AMBIL TUGAS PESERTA
      // ===============================================

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
            id,
            tugas_id,
            peserta_id,
            status,
            dikumpulkan_at,
            created_at
          `)
          .in(
            "tugas_id",
            tugasIds
          );


      if (
        tugasPesertaError
      ) {
        throw tugasPesertaError;
      }


      const assignments =
        (
          tugasPesertaData ??
          []
        ) as AssignmentDatabaseRow[];


      // ===============================================
      // 10. PESERTA HISTORIS
      //
      // Bisa saja tugas lama milik peserta
      // yang sudah tidak aktif / selesai.
      // ===============================================

      const assignmentPesertaIds = [
        ...new Set(
          assignments.map(
            (
              item
            ) =>
              item.peserta_id
          )
        ),
      ];


      const missingPesertaIds =
        assignmentPesertaIds.filter(
          (
            id
          ) =>
            !pesertaMap.has(
              id
            )
        );


      if (
        missingPesertaIds.length >
        0
      ) {
        const {
          data:
            missingPesertaData,
          error:
            missingPesertaError,
        } =
          await supabase
            .from(
              "peserta"
            )
            .select(`
              id,
              user_id,
              nama_lengkap,
              status
            `)
            .in(
              "id",
              missingPesertaIds
            );


        if (
          !missingPesertaError
        ) {
          for (
            const peserta
            of (
              missingPesertaData ??
              []
            ) as ParticipantDatabaseRow[]
          ) {
            pesertaMap.set(
              peserta.id,
              peserta
                .nama_lengkap ??
                "Peserta"
            );
          }
        }
      }


      // ===============================================
      // 11. FORMAT KE TABEL
      // ===============================================

      const formatted:
        TaskRow[] =
        [];


      for (
        const task
        of tugas
      ) {
        const taskAssignments =
          assignments.filter(
            (
              assignment
            ) =>
              assignment.tugas_id ===
              task.id
          );


        // =============================================
        // TUGAS YANG BELUM PUNYA PESERTA
        // =============================================

        if (
          taskAssignments.length ===
          0
        ) {
          formatted.push({
            rowId:
              task.id,

            id:
              task.id,

            assignmentId:
              null,

            judul:
              task.judul,

            deskripsi:
              task.deskripsi ??
              "-",

            pesertaId:
              null,

            pesertaNama:
              "-",

            deadlineRaw:
              task.deadline,

            batasWaktu:
              formatDeadline(
                task.deadline
              ),

            status:
              "Menunggu",

            createdAt:
              task.created_at,
          });


          continue;
        }


        // =============================================
        // SATU ROW PER PESERTA
        // =============================================

        for (
          const assignment
          of taskAssignments
        ) {
          formatted.push({
            rowId:
              assignment.id,

            id:
              task.id,

            assignmentId:
              assignment.id,

            judul:
              task.judul,

            deskripsi:
              task.deskripsi ??
              "-",

            pesertaId:
              assignment
                .peserta_id,

            pesertaNama:
              pesertaMap.get(
                assignment
                  .peserta_id
              ) ??
              "Peserta",

            deadlineRaw:
              task.deadline,

            batasWaktu:
              formatDeadline(
                task.deadline
              ),

            status:
              formatStatusTugas(
                assignment.status
              ),

            createdAt:
              task.created_at,
          });
        }
      }


      setTugasList(
        formatted
      );

    } catch (err) {
      console.error(
        "Gagal mengambil data tugas:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data tugas."
      );


      setTugasList(
        []
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  // ===================================================
  // NAMA PESERTA UNTUK FILTER
  // ===================================================

  const pesertaNames =
    useMemo(() => {
      return [
        ...new Set(
          tugasList
            .map(
              (
                item
              ) =>
                item.pesertaNama
            )
            .filter(
              (
                nama
              ) =>
                nama !==
                "-"
            )
        ),
      ].sort(
        (
          a,
          b
        ) =>
          a.localeCompare(
            b
          )
      );

    }, [
      tugasList,
    ]);


  // ===================================================
  // FILTER
  // ===================================================

  const filtered =
    useMemo(() => {
      const keyword =
        query
          .trim()
          .toLowerCase();


      return tugasList.filter(
        (
          tugas
        ) => {
          const matchStatus =
            statusFilter ===
              "Semua Status" ||
            tugas.status ===
              statusFilter;


          const matchPeserta =
            pesertaFilter ===
              "Semua Peserta" ||
            tugas.pesertaNama ===
              pesertaFilter;


          const matchQuery =
            !keyword ||

            tugas.judul
              .toLowerCase()
              .includes(
                keyword
              ) ||

            tugas.deskripsi
              .toLowerCase()
              .includes(
                keyword
              );


          return (
            matchStatus &&
            matchPeserta &&
            matchQuery
          );
        }
      );

    }, [
      tugasList,
      statusFilter,
      pesertaFilter,
      query,
    ]);


  // ===================================================
  // RESET FORM
  // ===================================================

  function resetForm() {
    setJudul(
      ""
    );


    setDeskripsi(
      ""
    );


    setSelectedPesertaId(
      ""
    );


    setDeadline(
      ""
    );
  }


  // ===================================================
  // TAMBAH TUGAS
  // ===================================================

  async function handleAddTugas() {
    if (
      !pembimbingId
    ) {
      alert(
        "Data pembimbing tidak ditemukan."
      );

      return;
    }


    if (
      !judul.trim()
    ) {
      alert(
        "Judul tugas wajib diisi."
      );

      return;
    }


    if (
      !selectedPesertaId
    ) {
      alert(
        "Pilih peserta terlebih dahulu."
      );

      return;
    }


    if (
      !deadline
    ) {
      alert(
        "Batas waktu wajib diisi."
      );

      return;
    }


    try {
      setSubmitting(
        true
      );


      setError(
        ""
      );


      // ===============================================
      // 1. INSERT TUGAS
      // ===============================================

      const {
        data:
          newTask,
        error:
          taskError,
      } =
        await supabase
          .from(
            "tugas"
          )
          .insert({
            judul:
              judul.trim(),

            deskripsi:
              deskripsi.trim() ||
              null,

            pembimbing_id:
              pembimbingId,

            deadline:
              `${deadline}T23:59:59+07:00`,
          })
          .select(
            "id"
          )
          .single();


      if (
        taskError
      ) {
        throw taskError;
      }


      // ===============================================
      // 2. ASSIGN KE PESERTA
      // ===============================================

      const {
        error:
          assignmentError,
      } =
        await supabase
          .from(
            "tugas_peserta"
          )
          .insert({
            tugas_id:
              newTask.id,

            peserta_id:
              selectedPesertaId,

            status:
              "belum_dikerjakan",
          });


      if (
        assignmentError
      ) {
        // Jika assignment gagal,
        // hapus task supaya tidak meninggalkan
        // data yatim.
        await supabase
          .from(
            "tugas"
          )
          .delete()
          .eq(
            "id",
            newTask.id
          );


        throw assignmentError;
      }


      // ===============================================
      // 3. REFRESH
      // ===============================================

      await fetchTugas();


      setShowModal(
        false
      );


      resetForm();

    } catch (err) {
      console.error(
        "Gagal menambah tugas:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal menambah tugas.";


      setError(
        message
      );


      alert(
        message
      );

    } finally {
      setSubmitting(
        false
      );
    }
  }


  // ===================================================
  // DELETE TUGAS
  // ===================================================

  async function handleDelete(
    task:
      TaskRow
  ) {
    if (
      !pembimbingId
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        `Yakin ingin menghapus tugas "${task.judul}"?`
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {
      setError(
        ""
      );


      const {
        error:
          deleteError,
      } =
        await supabase
          .from(
            "tugas"
          )
          .delete()
          .eq(
            "id",
            task.id
          )
          .eq(
            "pembimbing_id",
            pembimbingId
          );


      if (
        deleteError
      ) {
        throw deleteError;
      }


      setOpenMenuId(
        null
      );


      await fetchTugas();

    } catch (err) {
      console.error(
        "Gagal menghapus tugas:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal menghapus tugas.";


      setError(
        message
      );


      alert(
        message
      );
    }
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 sm:p-8">

        <h1 className="text-2xl font-extrabold text-slate-900">
          Kelola Tugas
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
            Kelola Tugas
          </span>

        </div>


        {/* ICON DECORATION */}

        <div className="pointer-events-none absolute -right-2 -top-2 hidden -rotate-6 sm:block">

          <div className="flex h-24 w-20 flex-col gap-2 rounded-2xl border-4 border-blue-400 bg-white p-3 shadow-lg">

            <span className="mx-auto -mt-5 h-4 w-9 rounded-full bg-blue-400" />


            {[1, 2].map(
              (
                i
              ) => (

                <div
                  key={
                    i
                  }
                  className="flex items-center gap-1.5"
                >

                  <span className="grid h-2.5 w-2.5 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-500">

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={4}
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>

                  </span>


                  <span className="h-1.5 flex-1 rounded-full bg-blue-100" />

                </div>

              )
            )}

          </div>

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>

      )}


      {/* =================================================
          FILTER
      ================================================= */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

        {/* STATUS */}

        <div className="relative flex-1 sm:max-w-xs">

          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />


          <select
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
              setStatusFilter(
                event.target
                  .value as
                  | "Semua Status"
                  | StatusTugas
              )
            }
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-brand-blue"
          >

            <option>
              Semua Status
            </option>


            {STATUS_OPTIONS.map(
              (
                status
              ) => (

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


        {/* PESERTA */}

        <div className="relative flex-1 sm:max-w-xs">

          <Users className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />


          <select
            value={
              pesertaFilter
            }
            onChange={(
              event
            ) =>
              setPesertaFilter(
                event.target.value
              )
            }
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-brand-blue"
          >

            <option>
              Semua Peserta
            </option>


            {pesertaNames.map(
              (
                nama
              ) => (

                <option
                  key={
                    nama
                  }
                >
                  {nama}
                </option>

              )
            )}

          </select>


          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        </div>


        {/* SEARCH */}

        <div className="relative flex-1 sm:max-w-xs">

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
            placeholder="Cari judul tugas..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-brand-blue"
          />

        </div>


        {/* TAMBAH */}

        <button
          type="button"
          onClick={() => {
            resetForm();

            setShowModal(
              true
            );
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition-transform hover:-translate-y-0.5 hover:bg-blue-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />

          Tambah Tugas
        </button>

      </div>


      {/* =================================================
          TABLE
      ================================================= */}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">

        {/* LOADING */}

        {loading ? (

          <div className="flex items-center justify-center gap-3 p-14 text-sm text-slate-400">

            <Loader2 className="h-5 w-5 animate-spin" />

            Memuat data tugas...

          </div>

        ) : filtered.length ===
          0 ? (

          <div className="flex flex-col items-center gap-2 p-14 text-center">

            <ClipboardList className="h-8 w-8 text-slate-300" />


            <p className="text-sm text-slate-400">
              Tidak ada tugas yang cocok dengan filter ini.
            </p>

          </div>

        ) : (

          <table className="w-full min-w-[820px] text-left text-sm">

            <thead>

              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500">

                <th className="w-14 px-6 py-4 font-medium">
                  No
                </th>


                <th className="px-4 py-4 font-medium">

                  <span className="inline-flex items-center gap-1">
                    Judul Tugas

                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </span>

                </th>


                <th className="px-4 py-4 font-medium">

                  <span className="inline-flex items-center gap-1">
                    Peserta

                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </span>

                </th>


                <th className="px-4 py-4 font-medium">

                  <span className="inline-flex items-center gap-1">
                    Batas Waktu

                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </span>

                </th>


                <th className="px-4 py-4 font-medium">

                  <span className="inline-flex items-center gap-1">
                    Status

                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </span>

                </th>


                <th className="px-6 py-4 font-medium">
                  Aksi
                </th>

              </tr>

            </thead>


            <tbody>

              {filtered.map(
                (
                  tugas,
                  index
                ) => (

                  <tr
                    key={
                      tugas.rowId
                    }
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                  >

                    {/* NO */}

                    <td className="px-6 py-4">

                      <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
                        {index + 1}
                      </span>

                    </td>


                    {/* JUDUL */}

                    <td className="px-4 py-4">

                      <p className="font-semibold text-slate-900">
                        {tugas.judul}
                      </p>


                      <p className="mt-1 line-clamp-1 max-w-[320px] text-xs text-slate-400">
                        {tugas.deskripsi}
                      </p>

                    </td>


                    {/* PESERTA */}

                    <td className="px-4 py-4">

                      <div className="flex items-center gap-2.5">

                        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-xs font-bold text-blue-600">
                          {getInisial(
                            tugas.pesertaNama
                          )}
                        </span>


                        <span className="font-medium text-slate-700">
                          {tugas.pesertaNama}
                        </span>

                      </div>

                    </td>


                    {/* DEADLINE */}

                    <td className="px-4 py-4 text-slate-500">
                      {tugas.batasWaktu}
                    </td>


                    {/* STATUS */}

                    <td className="px-4 py-4">

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(
                          tugas.status
                        )}`}
                      >

                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusDotClasses(
                            tugas.status
                          )}`}
                        />


                        {tugas.status}

                      </span>

                    </td>


                    {/* ACTION */}

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-2">

                        <Link
                          href={`/dashboard-pembina/tugas/${tugas.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3.5 py-2 text-xs font-semibold text-brand-blue transition-colors hover:bg-blue-100"
                        >
                          <Eye className="h-3.5 w-3.5" />

                          Detail
                        </Link>


                        <div className="relative">

                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId ===
                                  tugas.rowId
                                  ? null
                                  : tugas.rowId
                              )
                            }
                            aria-label="Aksi lain"
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>


                          {openMenuId ===
                            tugas.rowId && (

                            <div className="absolute right-0 z-10 mt-1 w-36 rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg">

                              <button
                                type="button"
                                onClick={() => {
                                  alert(
                                    "Fitur edit tugas akan kita sambungkan selanjutnya."
                                  );

                                  setOpenMenuId(
                                    null
                                  );
                                }}
                                className="block w-full px-4 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                Edit Tugas
                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    tugas
                                  )
                                }
                                className="block w-full px-4 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50"
                              >
                                Hapus Tugas
                              </button>

                            </div>

                          )}

                        </div>

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        )}

      </div>


      {/* =================================================
          PAGINATION
      ================================================= */}

      {!loading &&
        filtered.length >
          0 && (

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-slate-500">

          <p>
            Menampilkan 1 sampai{" "}
            {filtered.length}
            {" dari "}
            {filtered.length}
            {" tugas"}
          </p>


          <div className="flex items-center gap-1.5">

            <button
              type="button"
              disabled
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>


            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-blue text-sm font-semibold text-white">
              1
            </span>


            <button
              type="button"
              disabled
              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-300"
            >
              <ChevronNext className="h-4 w-4" />
            </button>

          </div>

        </div>

      )}


      {/* =================================================
          MODAL TAMBAH TUGAS
      ================================================= */}

      {showModal && (
        <>

          {/* OVERLAY */}

          <div
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={() => {
              if (
                submitting
              ) {
                return;
              }


              setShowModal(
                false
              );


              resetForm();
            }}
          />


          {/* MODAL */}

          <div className="fixed left-1/2 top-1/2 z-[70] max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Tambah Tugas
                </h2>


                <p className="mt-1 text-sm text-slate-500">
                  Berikan tugas kepada peserta bimbingan.
                </p>

              </div>


              <button
                type="button"
                disabled={
                  submitting
                }
                onClick={() => {
                  setShowModal(
                    false
                  );


                  resetForm();
                }}
                className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            {/* BODY */}

            <div className="space-y-5 p-6">

              {/* JUDUL */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Judul Tugas
                </label>


                <input
                  type="text"
                  value={
                    judul
                  }
                  onChange={(
                    event
                  ) =>
                    setJudul(
                      event.target.value
                    )
                  }
                  placeholder="Contoh: Membuat UI Dashboard"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-blue"
                />

              </div>


              {/* DESKRIPSI */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Deskripsi
                </label>


                <textarea
                  value={
                    deskripsi
                  }
                  onChange={(
                    event
                  ) =>
                    setDeskripsi(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Tuliskan deskripsi tugas..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-blue"
                />

              </div>


              {/* PESERTA */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Peserta
                </label>


                <select
                  value={
                    selectedPesertaId
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedPesertaId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-blue"
                >

                  <option value="">
                    Pilih Peserta
                  </option>


                  {pesertaOptions.map(
                    (
                      peserta
                    ) => (

                      <option
                        key={
                          peserta.id
                        }
                        value={
                          peserta.id
                        }
                      >
                        {peserta.nama}
                      </option>

                    )
                  )}

                </select>


                {pesertaOptions.length ===
                  0 && (

                  <p className="mt-2 text-xs text-amber-600">
                    Belum ada peserta aktif yang berada di bawah bimbingan Anda.
                  </p>

                )}

              </div>


              {/* DEADLINE */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Batas Waktu
                </label>


                <input
                  type="date"
                  value={
                    deadline
                  }
                  min={
                    getToday()
                  }
                  onChange={(
                    event
                  ) =>
                    setDeadline(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-blue"
                />

              </div>


              {/* ACTION */}

              <div className="flex justify-end gap-3 border-t pt-5">

                <button
                  type="button"
                  disabled={
                    submitting
                  }
                  onClick={() => {
                    setShowModal(
                      false
                    );


                    resetForm();
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>


                <button
                  type="button"
                  disabled={
                    submitting
                  }
                  onClick={
                    handleAddTugas
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />

                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />

                      Tambah Tugas
                    </>
                  )}

                </button>

              </div>

            </div>

          </div>

        </>
      )}

    </div>
  );
}


// =====================================================
// FORMAT STATUS DATABASE → UI
// =====================================================

function formatStatusTugas(
  status:
    | string
    | null
): StatusTugas {
  const value =
    (
      status ??
      ""
    )
      .trim()
      .toLowerCase()
      .replace(
        /[\s-]+/g,
        "_"
      );


  // ===================================================
  // SELESAI
  // ===================================================

  if (
    value ===
      "selesai" ||
    value ===
      "disetujui" ||
    value ===
      "approved"
  ) {
    return "Selesai";
  }


  // ===================================================
  // PERLU PERBAIKAN
  // ===================================================

  if (
    value ===
      "perlu_perbaikan" ||
    value ===
      "perlu_revisi" ||
    value ===
      "revisi" ||
    value ===
      "direvisi" ||
    value ===
      "ditolak" ||
    value ===
      "rejected"
  ) {
    return "Perlu Perbaikan";
  }


  // ===================================================
  // DEFAULT
  // ===================================================

  return "Menunggu";
}


// =====================================================
// FORMAT DEADLINE
// =====================================================

function formatDeadline(
  value:
    | string
    | null
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
        "short",

      year:
        "numeric",
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
  if (
    !nama ||
    nama ===
      "-"
  ) {
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
// TODAY
// =====================================================

function getToday() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
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
        item
      ) =>
        item.type ===
        "year"
    )?.value;


  const month =
    parts.find(
      (
        item
      ) =>
        item.type ===
        "month"
    )?.value;


  const day =
    parts.find(
      (
        item
      ) =>
        item.type ===
        "day"
    )?.value;


  return `${year}-${month}-${day}`;
}