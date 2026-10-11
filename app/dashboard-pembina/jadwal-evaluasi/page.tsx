"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";


// =====================================================
// TYPES
// =====================================================

type JadwalStatus =
  | "terjadwal"
  | "selesai"
  | "dibatalkan";


type JenisEvaluasi =
  | "mingguan"
  | "bulanan"
  | "tengah_periode"
  | "akhir"
  | "lainnya";


type ParticipantOption = {
  isBimbingan: boolean;
  namaTersedia: boolean;
  pesertaId: string;

  userId: string;

  nomorPeserta: string;

  nama: string;

  sekolah: string;

  divisi: string;

  posisi: string;

  status: string;
};


type EvaluationSchedule = {
  id: string;

  pembimbingId: string;

  pesertaId: string;

  jenisEvaluasi:
    JenisEvaluasi;

  judul: string;

  tanggal: string;

  jamMulai: string;

  jamSelesai: string | null;

  lokasi: string | null;

  catatan: string | null;

  status: JadwalStatus;

  createdAt: string | null;

  updatedAt: string | null;
};


type FormState = {
  pesertaId: string;

  jenisEvaluasi:
    JenisEvaluasi;

  judul: string;

  tanggal: string;

  jamMulai: string;

  jamSelesai: string;

  lokasi: string;

  catatan: string;

  status: JadwalStatus;
};


type FilterStatus =
  | "semua"
  | JadwalStatus;


// =====================================================
// INITIAL FORM
// =====================================================

const initialForm: FormState = {
  pesertaId: "",

  jenisEvaluasi:
    "mingguan",

  judul: "",

  tanggal: "",

  jamMulai: "",

  jamSelesai: "",

  lokasi: "",

  catatan: "",

  status:
    "terjadwal",
};


// =====================================================
// PAGE
// =====================================================

export default function JadwalEvaluasiPage() {
  const [nameWarning, setNameWarning] = useState("");
  // ===================================================
  // GENERAL
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
    error,
    setError,
  ] =
    useState("");


  const [
    pembimbingId,
    setPembimbingId,
  ] =
    useState<string | null>(
      null
    );


  // ===================================================
  // DATA
  // ===================================================

  const [
    participants,
    setParticipants,
  ] =
    useState<
      ParticipantOption[]
    >([]);


  const [
    schedules,
    setSchedules,
  ] =
    useState<
      EvaluationSchedule[]
    >([]);


  // ===================================================
  // FILTER
  // ===================================================

  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<FilterStatus>(
      "semua"
    );


  // ===================================================
  // MODAL
  // ===================================================

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);


  const [
    editingId,
    setEditingId,
  ] =
    useState<string | null>(
      null
    );


  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      initialForm
    );


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    formError,
    setFormError,
  ] =
    useState("");


  // ===================================================
  // LOAD DATA
  // ===================================================

  const loadData =
    useCallback(
      async (
        refresh = false
      ) => {
        try {
          if (refresh) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }


          setError("");
          setNameWarning("");


          // =============================================
          // AUTH USER
          // =============================================

          const {
            data:
              userData,

            error:
              userError,
          } =
            await supabase.auth
              .getUser();


          if (userError) {
            throw userError;
          }


          const user =
            userData.user;


          if (!user) {
            throw new Error(
              "User belum login."
            );
          }


          // =============================================
          // PEMBIMBING
          // =============================================

          const {
            data:
              mentor,

            error:
              mentorError,
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


          if (mentorError) {
            throw mentorError;
          }


          if (!mentor) {
            throw new Error(
              "Data pembimbing tidak ditemukan."
            );
          }


          setPembimbingId(
            mentor.id
          );


          // =============================================
          // JADWAL EVALUASI
          // =============================================

          const {
            data:
              scheduleData,

            error:
              scheduleError,
          } =
            await supabase
              .from(
                "jadwal_evaluasi"
              )
              .select(`
                id,
                pembimbing_id,
                peserta_id,
                jenis_evaluasi,
                judul,
                tanggal,
                jam_mulai,
                jam_selesai,
                lokasi,
                catatan,
                status,
                created_at,
                updated_at
              `)
              .eq(
                "pembimbing_id",
                mentor.id
              )
              .order(
                "tanggal",
                {
                  ascending:
                    true,
                }
              )
              .order(
                "jam_mulai",
                {
                  ascending:
                    true,
                }
              );


          if (scheduleError) {
            throw scheduleError;
          }


          // =============================================
          // PENEMPATAN PESERTA BIMBINGAN
          // =============================================

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
                peserta_id,
                pembimbing_id,
                divisi,
                posisi
              `)
              .eq(
                "pembimbing_id",
                mentor.id
              );


          if (placementError) {
            throw placementError;
          }


          const placements =
            placementData ??
            [];


          const rawSchedules =
            scheduleData ??
            [];


          // =============================================
          // SEMUA PESERTA YANG DIPERLUKAN
          //
          // termasuk peserta dari jadwal lama agar
          // nama tetap tampil.
          // =============================================

          const participantIds = [
            ...new Set([
              ...placements.map(
                (
                  row
                ) =>
                  row.peserta_id
              ),

              ...rawSchedules.map(
                (
                  row
                ) =>
                  row.peserta_id
              ),
            ]),
          ].filter(Boolean);


          // =============================================
          // TIDAK ADA PESERTA
          // =============================================

          if (
            participantIds.length ===
            0
          ) {
            setParticipants(
              []
            );


            setSchedules(
              rawSchedules.map(
                mapSchedule
              )
            );


            return;
          }


          // =============================================
          // PESERTA
          // =============================================

          const {
            data:
              participantData,

            error:
              participantError,
          } =
            await supabase
              .from(
                "peserta"
              )
              .select(`
                id,
                user_id,
                nomor_peserta,
                status
              `)
              .in(
                "id",
                participantIds
              );


          if (
            participantError
          ) {
            throw participantError;
          }


          const participantRows =
            participantData ??
            [];


          // =============================================
          // PROFILE
          // =============================================

          const userIds = [
            ...new Set(
              participantRows
                .map(
                  (
                    row
                  ) =>
                    row.user_id
                )
                .filter(Boolean)
            ),
          ];


          // Nama peserta berada di profiles, terhubung melalui peserta.user_id.
          const profileNames = new Map<string, string>();
          if (userIds.length > 0) {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("id, nama_lengkap")
              .in("id", userIds);

            if (!profileError) {
              for (const profile of profileData ?? []) {
                const name = profile.nama_lengkap?.trim();
                if (name) profileNames.set(profile.id, name);
              }
            }

            // RLS dapat mengembalikan [] tanpa error. RPC ini hanya membaca
            // ID dan nama peserta yang terkait pembimbing login, sesuai SQL terlampir.
            if (userIds.some((id) => !profileNames.has(id))) {
              const { data: nameData, error: nameError } = await supabase
                .rpc("get_nama_peserta_evaluasi");

              if (!nameError && Array.isArray(nameData)) {
                for (const row of nameData as Array<{ id: string; nama_lengkap: string | null }>) {
                  const name = row.nama_lengkap?.trim();
                  if (name && userIds.includes(row.id)) profileNames.set(row.id, name);
                }
              }
            }
          }

          // =============================================
          // PENDIDIKAN
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
                peserta_id,
                sekolah
              `)
              .in(
                "peserta_id",
                participantIds
              );


          if (
            educationError
          ) {
            throw educationError;
          }


          const educations =
            educationData ??
            [];


          // =============================================
          // FORMAT PESERTA
          // =============================================

          const formattedParticipants:
            ParticipantOption[] =
            participantRows.map(
              (
                participant
              ) => {
                const nama = profileNames.get(participant.user_id);

                const education =
                  educations.find(
                    (
                      row
                    ) =>
                      row.peserta_id ===
                      participant.id
                  );


                const placement =
                  placements.find(
                    (
                      row
                    ) =>
                      row.peserta_id ===
                      participant.id
                  );


                return {
                  isBimbingan: Boolean(placement),
                  namaTersedia: Boolean(nama),
                  pesertaId:
                    participant.id,

                  userId:
                    participant.user_id,

                  nomorPeserta:
                    participant
                      .nomor_peserta ??
                    "-",

                  nama: nama || `Nama belum tersedia (${participant.nomor_peserta || participant.id.slice(0, 8)})`,

                  sekolah:
                    education
                      ?.sekolah ??
                    "-",

                  divisi:
                    placement
                      ?.divisi ??
                    "-",

                  posisi:
                    placement
                      ?.posisi ??
                    "-",

                  status:
                    participant
                      .status ??
                    "-",
                };
              }
            );


          formattedParticipants.sort((a, b) => a.nama.localeCompare(b.nama, "id"));
          const missingNames = formattedParticipants.filter((item) => !item.namaTersedia);
          if (missingNames.length > 0) {
            setNameWarning(`${missingNames.length} nama peserta belum dapat ditampilkan. Hubungi admin untuk melengkapi data nama atau aksesnya.`);
          }

          setParticipants(
            formattedParticipants
          );


          setSchedules(
            rawSchedules.map(
              mapSchedule
            )
          );

        } catch (
          err
        ) {
          console.error(
            "JADWAL EVALUASI ERROR:",
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil jadwal evaluasi."
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
  // INITIAL
  // ===================================================

  useEffect(
    () => {
      loadData();
    },
    [
      loadData,
    ]
  );


  // ===================================================
  // PARTICIPANT LOOKUP
  // ===================================================

  const participantMap =
    useMemo(
      () => {
        return new Map(
          participants.map(
            (
              participant
            ) => [
              participant
                .pesertaId,

              participant,
            ]
          )
        );
      },
      [
        participants,
      ]
    );


  // ===================================================
  // AVAILABLE PARTICIPANTS
  // ===================================================

  const availableParticipants =
    useMemo(
      () => {
        return participants.filter(
          (
            participant
          ) =>
            (participant.isBimbingan &&
              normalizeStatus(participant.status) === "aktif") ||
            participant
              .pesertaId ===
              form.pesertaId
        );
      },
      [
        participants,
        form.pesertaId,
      ]
    );


  // ===================================================
  // FILTER
  // ===================================================

  const filteredSchedules =
    useMemo(
      () => {
        const keyword =
          search
            .trim()
            .toLowerCase();


        return schedules.filter(
          (
            schedule
          ) => {
            const participant =
              participantMap.get(
                schedule.pesertaId
              );


            const matchSearch =
              !keyword ||
              schedule.judul
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              (
                schedule.lokasi ??
                ""
              )
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              (
                participant?.nama ??
                ""
              )
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              (
                participant?.sekolah ??
                ""
              )
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              (
                participant?.posisi ??
                ""
              )
                .toLowerCase()
                .includes(
                  keyword
                );


            const matchStatus =
              statusFilter ===
                "semua" ||
              schedule.status ===
                statusFilter;


            return (
              matchSearch &&
              matchStatus
            );
          }
        );
      },
      [
        schedules,
        search,
        statusFilter,
        participantMap,
      ]
    );


  // ===================================================
  // STATS
  // ===================================================

  const statistics =
    useMemo(
      () => {
        return {
          total:
            schedules.length,

          scheduled:
            schedules.filter(
              (
                item
              ) =>
                item.status ===
                "terjadwal"
            ).length,

          done:
            schedules.filter(
              (
                item
              ) =>
                item.status ===
                "selesai"
            ).length,
        };
      },
      [
        schedules,
      ]
    );


  // ===================================================
  // OPEN CREATE
  // ===================================================

  function openCreate() {
    setEditingId(
      null
    );


    setForm({
      ...initialForm,

      tanggal:
        getToday(),
    });


    setFormError("");

    setModalOpen(
      true
    );
  }


  // ===================================================
  // OPEN EDIT
  // ===================================================

  function openEdit(
    schedule:
      EvaluationSchedule
  ) {
    setEditingId(
      schedule.id
    );


    setForm({
      pesertaId:
        schedule.pesertaId,

      jenisEvaluasi:
        schedule.jenisEvaluasi,

      judul:
        schedule.judul,

      tanggal:
        schedule.tanggal,

      jamMulai:
        cleanTime(
          schedule.jamMulai
        ),

      jamSelesai:
        schedule.jamSelesai
          ? cleanTime(
              schedule.jamSelesai
            )
          : "",

      lokasi:
        schedule.lokasi ??
        "",

      catatan:
        schedule.catatan ??
        "",

      status:
        schedule.status,
    });


    setFormError("");

    setModalOpen(
      true
    );
  }


  // ===================================================
  // CLOSE
  // ===================================================

  function closeModal() {
    if (saving) {
      return;
    }


    setModalOpen(
      false
    );

    setEditingId(
      null
    );

    setForm(
      initialForm
    );

    setFormError("");
  }


  // ===================================================
  // CHANGE FORM
  // ===================================================

  function updateForm<
    K extends keyof FormState
  >(
    key: K,
    value: FormState[K]
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,

        [key]:
          value,
      })
    );
  }


  // ===================================================
  // SAVE
  // ===================================================

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();


    if (!pembimbingId) {
      setFormError(
        "Data pembimbing tidak ditemukan."
      );

      return;
    }


    if (!form.pesertaId) {
      setFormError(
        "Peserta wajib dipilih."
      );

      return;
    }


    if (!form.judul.trim()) {
      setFormError(
        "Judul evaluasi wajib diisi."
      );

      return;
    }


    if (!form.tanggal) {
      setFormError(
        "Tanggal evaluasi wajib diisi."
      );

      return;
    }


    if (!form.jamMulai) {
      setFormError(
        "Jam mulai wajib diisi."
      );

      return;
    }


    if (
      form.jamSelesai &&
      form.jamSelesai <=
        form.jamMulai
    ) {
      setFormError(
        "Jam selesai harus setelah jam mulai."
      );

      return;
    }


    try {
      setSaving(
        true
      );

      setFormError("");


      const payload = {
        pembimbing_id:
          pembimbingId,

        peserta_id:
          form.pesertaId,

        jenis_evaluasi:
          form.jenisEvaluasi,

        judul:
          form.judul.trim(),

        tanggal:
          form.tanggal,

        jam_mulai:
          form.jamMulai,

        jam_selesai:
          form.jamSelesai ||
          null,

        lokasi:
          form.lokasi.trim() ||
          null,

        catatan:
          form.catatan.trim() ||
          null,

        status:
          form.status,

        updated_at:
          new Date()
            .toISOString(),
      };


      // =============================================
      // UPDATE
      // =============================================

      if (editingId) {
        const {
          error:
            updateError,
        } =
          await supabase
            .from(
              "jadwal_evaluasi"
            )
            .update(
              payload
            )
            .eq(
              "id",
              editingId
            )
            .eq(
              "pembimbing_id",
              pembimbingId
            );


        if (updateError) {
          throw updateError;
        }

      } else {
        // ===========================================
        // INSERT
        // ===========================================

        const {
          error:
            insertError,
        } =
          await supabase
            .from(
              "jadwal_evaluasi"
            )
            .insert({
              ...payload,

              created_at:
                new Date()
                  .toISOString(),
            });


        if (insertError) {
          throw insertError;
        }
      }


      closeModal();


      await loadData(
        true
      );

    } catch (
      err
    ) {
      console.error(
        "SAVE JADWAL EVALUASI:",
        err
      );


      setFormError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan jadwal evaluasi."
      );

    } finally {
      setSaving(
        false
      );
    }
  }


  // ===================================================
  // DELETE
  // ===================================================

  async function handleDelete(
    schedule:
      EvaluationSchedule
  ) {
    if (!pembimbingId) {
      return;
    }


    const confirmed =
      window.confirm(
        `Hapus jadwal "${schedule.judul}"?`
      );


    if (!confirmed) {
      return;
    }


    try {
      const {
        error:
          deleteError,
      } =
        await supabase
          .from(
            "jadwal_evaluasi"
          )
          .delete()
          .eq(
            "id",
            schedule.id
          )
          .eq(
            "pembimbing_id",
            pembimbingId
          );


      if (deleteError) {
        throw deleteError;
      }


      await loadData(
        true
      );

    } catch (
      err
    ) {
      console.error(
        "DELETE JADWAL EVALUASI:",
        err
      );


      alert(
        err instanceof Error
          ? err.message
          : "Gagal menghapus jadwal evaluasi."
      );
    }
  }


  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">

        <div className="text-center">

          <Loader2
            size={30}
            className="mx-auto animate-spin text-blue-600"
          />


          <p className="mt-3 text-sm text-neutral-500">
            Memuat jadwal evaluasi...
          </p>

        </div>

      </div>
    );
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-7">

      {/* =================================================
          HEADER
      ================================================= */}

      <div>

        <h1 className="text-3xl font-bold text-slate-950">
          Jadwal Evaluasi
        </h1>


        <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">

          <span>
            Dashboard
          </span>

          <span>
            ›
          </span>

          <span className="text-slate-500">
            Jadwal Evaluasi
          </span>

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {nameWarning && (
        <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{nameWarning}</p>
      )}

      {error && (

        <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">

          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-red-600"
          />


          <div>

            <p className="font-semibold text-red-700">
              Gagal memuat data
            </p>


            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>

          </div>

        </div>

      )}


      {/* =================================================
          STATS
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <div className="flex items-center gap-3">

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">

              <CalendarClock
                size={20}
              />

            </div>


            <div>

              <p className="text-sm text-slate-400">
                Total Jadwal
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {statistics.total}
              </p>

            </div>

          </div>

        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <div className="flex items-center gap-3">

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600">

              <Clock3
                size={20}
              />

            </div>


            <div>

              <p className="text-sm text-slate-400">
                Terjadwal
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {statistics.scheduled}
              </p>

            </div>

          </div>

        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <div className="flex items-center gap-3">

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600">

              <CheckCircle2
                size={20}
              />

            </div>


            <div>

              <p className="text-sm text-slate-400">
                Selesai
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {statistics.done}
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />


            <input
              type="text"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Cari peserta, sekolah, posisi, atau evaluasi..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />

          </div>


          {/* STATUS */}

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
                  FilterStatus
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          >

            <option value="semua">
              Semua Status
            </option>

            <option value="terjadwal">
              Terjadwal
            </option>

            <option value="selesai">
              Selesai
            </option>

            <option value="dibatalkan">
              Dibatalkan
            </option>

          </select>


          {/* REFRESH */}

          <button
            type="button"
            disabled={
              refreshing
            }
            onClick={() =>
              loadData(
                true
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >

            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>


          {/* ADD */}

          <button
            type="button"
            onClick={
              openCreate
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >

            <Plus
              size={17}
            />

            Tambah Jadwal
          </button>

        </div>

      </div>


      {/* =================================================
          TABLE
      ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {filteredSchedules.length ===
        0 ? (

          <div className="flex min-h-[280px] flex-col items-center justify-center text-center">

            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">

              <CalendarClock
                size={26}
              />

            </div>


            <p className="mt-4 font-semibold text-slate-700">
              Belum ada jadwal evaluasi
            </p>


            <p className="mt-1 text-sm text-slate-400">
              Tambahkan jadwal evaluasi untuk peserta bimbingan.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead className="bg-slate-50">

                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">

                  <th className="px-6 py-4">
                    No
                  </th>

                  <th className="px-4 py-4">
                    Peserta
                  </th>

                  <th className="px-4 py-4">
                    Evaluasi
                  </th>

                  <th className="px-4 py-4">
                    Jadwal
                  </th>

                  <th className="px-4 py-4">
                    Lokasi
                  </th>

                  <th className="px-4 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right">
                    Aksi
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100">

                {filteredSchedules.map(
                  (
                    schedule,
                    index
                  ) => {
                    const participant =
                      participantMap.get(
                        schedule.pesertaId
                      );


                    return (
                      <tr
                        key={
                          schedule.id
                        }
                        className="transition hover:bg-slate-50/60"
                      >

                        <td className="px-6 py-4">

                          <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
                            {index + 1}
                          </div>

                        </td>


                        {/* PESERTA */}

                        <td className="px-4 py-4">

                          <div className="flex items-center gap-3">

                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                              {getInitial(
                                participant
                                  ?.nama ??
                                "P"
                              )}
                            </div>


                            <div>

                              <p className="font-semibold text-slate-800">
                                {participant
                                  ?.nama ??
                                  "Peserta"}
                              </p>


                              <p className="mt-1 text-xs text-slate-400">
                                {participant
                                  ?.sekolah ??
                                  "-"}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* EVALUASI */}

                        <td className="px-4 py-4">

                          <p className="font-medium text-slate-700">
                            {schedule.judul}
                          </p>


                          <p className="mt-1 text-xs text-slate-400">
                            {formatJenisEvaluasi(
                              schedule.jenisEvaluasi
                            )}
                          </p>

                        </td>


                        {/* JADWAL */}

                        <td className="px-4 py-4">

                          <p className="text-sm font-medium text-slate-700">
                            {formatDate(
                              schedule.tanggal
                            )}
                          </p>


                          <p className="mt-1 text-xs text-slate-400">
                            {cleanTime(
                              schedule.jamMulai
                            )}

                            {schedule.jamSelesai
                              ? ` - ${cleanTime(
                                  schedule.jamSelesai
                                )}`
                              : ""}
                          </p>

                        </td>


                        {/* LOKASI */}

                        <td className="px-4 py-4">

                          <div className="flex items-center gap-2 text-sm text-slate-600">

                            <MapPin
                              size={15}
                              className="shrink-0 text-slate-400"
                            />

                            {schedule.lokasi ||
                              "-"}

                          </div>

                        </td>


                        {/* STATUS */}

                        <td className="px-4 py-4">

                          <StatusBadge
                            status={
                              schedule.status
                            }
                          />

                        </td>


                        {/* ACTION */}

                        <td className="px-6 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                openEdit(
                                  schedule
                                )
                              }
                              className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                              title="Edit"
                            >
                              <Pencil
                                size={15}
                              />
                            </button>


                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  schedule
                                )
                              }
                              className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                              title="Hapus"
                            >
                              <Trash2
                                size={15}
                              />
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =================================================
          MODAL
      ================================================= */}

      {modalOpen && (

        <>
          <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]" />


          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">

            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    {editingId
                      ? "Edit Jadwal Evaluasi"
                      : "Tambah Jadwal Evaluasi"}
                  </h2>


                  <p className="mt-1 text-sm text-slate-500">
                    Tentukan waktu evaluasi peserta bimbingan.
                  </p>

                </div>


                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    closeModal
                  }
                  className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <X
                    size={20}
                  />
                </button>

              </div>


              <form
                onSubmit={
                  handleSubmit
                }
              >

                <div className="space-y-5 p-6">

                  {formError && (

                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {formError}
                    </div>

                  )}


                  {/* PESERTA */}

                  {nameWarning && (
                    <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{nameWarning}</p>
                  )}

                  <FormField label="Peserta">

                    <select
                      value={
                        form.pesertaId
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "pesertaId",
                          event.target.value
                        )
                      }
                      className={
                        inputClass
                      }
                    >

                      <option value="">
                        Pilih peserta
                      </option>


                      {availableParticipants.map(
                        (
                          participant
                        ) => (

                        <option
                          key={
                            participant.pesertaId
                          }
                          value={
                            participant.pesertaId
                          }
                        >
                          {participant.nama}
                          {participant.posisi !== "-" ? ` — ${participant.posisi}` : ""}
                        </option>

                        )
                      )}

                    </select>

                  </FormField>


                  {/* TYPE + TITLE */}

                  <div className="grid gap-4 sm:grid-cols-2">

                    <FormField label="Jenis Evaluasi">

                      <select
                        value={
                          form.jenisEvaluasi
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "jenisEvaluasi",
                            event.target
                              .value as
                              JenisEvaluasi
                          )
                        }
                        className={
                          inputClass
                        }
                      >

                        <option value="mingguan">
                          Mingguan
                        </option>

                        <option value="bulanan">
                          Bulanan
                        </option>

                        <option value="tengah_periode">
                          Tengah Periode
                        </option>

                        <option value="akhir">
                          Evaluasi Akhir
                        </option>

                        <option value="lainnya">
                          Lainnya
                        </option>

                      </select>

                    </FormField>


                    <FormField label="Judul">

                      <input
                        type="text"
                        value={
                          form.judul
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "judul",
                            event.target.value
                          )
                        }
                        placeholder="Contoh: Evaluasi Minggu Ke-2"
                        className={
                          inputClass
                        }
                      />

                    </FormField>

                  </div>


                  {/* DATE */}

                  <FormField label="Tanggal">

                    <input
                      type="date"
                      value={
                        form.tanggal
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "tanggal",
                          event.target.value
                        )
                      }
                      className={
                        inputClass
                      }
                    />

                  </FormField>


                  {/* TIME */}

                  <div className="grid gap-4 sm:grid-cols-2">

                    <FormField label="Jam Mulai">

                      <input
                        type="time"
                        value={
                          form.jamMulai
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "jamMulai",
                            event.target.value
                          )
                        }
                        className={
                          inputClass
                        }
                      />

                    </FormField>


                    <FormField label="Jam Selesai">

                      <input
                        type="time"
                        value={
                          form.jamSelesai
                        }
                        onChange={(
                          event
                        ) =>
                          updateForm(
                            "jamSelesai",
                            event.target.value
                          )
                        }
                        className={
                          inputClass
                        }
                      />

                    </FormField>

                  </div>


                  {/* LOCATION */}

                  <FormField label="Lokasi / Media">

                    <input
                      type="text"
                      value={
                        form.lokasi
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "lokasi",
                          event.target.value
                        )
                      }
                      placeholder="Contoh: Ruang Meeting / Google Meet"
                      className={
                        inputClass
                      }
                    />

                  </FormField>


                  {/* STATUS */}

                  <FormField label="Status">

                    <select
                      value={
                        form.status
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "status",
                          event.target
                            .value as
                            JadwalStatus
                        )
                      }
                      className={
                        inputClass
                      }
                    >

                      <option value="terjadwal">
                        Terjadwal
                      </option>

                      <option value="selesai">
                        Selesai
                      </option>

                      <option value="dibatalkan">
                        Dibatalkan
                      </option>

                    </select>

                  </FormField>


                  {/* NOTE */}

                  <FormField label="Catatan">

                    <textarea
                      rows={4}
                      value={
                        form.catatan
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "catatan",
                          event.target.value
                        )
                      }
                      placeholder="Catatan atau materi yang akan dibahas..."
                      className={`${inputClass} resize-none`}
                    />

                  </FormField>

                </div>


                {/* FOOTER */}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={
                      closeModal
                    }
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Batal
                  </button>


                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >

                    {saving && (

                      <Loader2
                        size={16}
                        className="animate-spin"
                      />

                    )}


                    {saving
                      ? "Menyimpan..."
                      : editingId
                        ? "Simpan Perubahan"
                        : "Tambah Jadwal"}

                  </button>

                </div>

              </form>

            </div>

          </div>
        </>

      )}

    </div>
  );
}


// =====================================================
// FORM FIELD
// =====================================================

function FormField({
  label,
  children,
}: {
  label:
    string;

  children:
    ReactNode;
}) {
  return (
    <label className="block">

      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>


      {children}

    </label>
  );
}


// =====================================================
// STATUS BADGE
// =====================================================

function StatusBadge({
  status,
}: {
  status:
    JadwalStatus;
}) {
  if (
    status ===
    "selesai"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600">

        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

        Selesai

      </span>
    );
  }


  if (
    status ===
    "dibatalkan"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">

        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

        Dibatalkan

      </span>
    );
  }


  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600">

      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />

      Terjadwal

    </span>
  );
}


// =====================================================
// HELPERS
// =====================================================

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50";


function mapSchedule(
  row: {
    id: string;

    pembimbing_id: string;

    peserta_id: string;

    jenis_evaluasi: string;

    judul: string;

    tanggal: string;

    jam_mulai: string;

    jam_selesai:
      string | null;

    lokasi:
      string | null;

    catatan:
      string | null;

    status: string;

    created_at:
      string | null;

    updated_at:
      string | null;
  }
): EvaluationSchedule {
  return {
    id:
      row.id,

    pembimbingId:
      row.pembimbing_id,

    pesertaId:
      row.peserta_id,

    jenisEvaluasi:
      row.jenis_evaluasi as
        JenisEvaluasi,

    judul:
      row.judul,

    tanggal:
      row.tanggal,

    jamMulai:
      row.jam_mulai,

    jamSelesai:
      row.jam_selesai,

    lokasi:
      row.lokasi,

    catatan:
      row.catatan,

    status:
      row.status as
        JadwalStatus,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
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


function cleanTime(
  value:
    string
) {
  return value
    .slice(
      0,
      5
    );
}


function formatDate(
  value:
    string
) {
  const date =
    new Date(
      `${value}T00:00:00`
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


function formatJenisEvaluasi(
  value:
    JenisEvaluasi
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

    default:
      return "Evaluasi Lainnya";
  }
}


function getInitial(
  value:
    string
) {
  const clean =
    value.trim();


  if (!clean) {
    return "P";
  }


  const words =
    clean.split(
      /\s+/
    );


  if (
    words.length ===
    1
  ) {
    return words[0]
      .slice(
        0,
        1
      )
      .toUpperCase();
  }


  return (
    words[0][0] +
    words[1][0]
  ).toUpperCase();
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