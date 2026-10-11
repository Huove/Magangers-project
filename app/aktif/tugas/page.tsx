"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  Star,
  Paperclip,
  Clock,
  User,
  ClipboardList,
  ListFilter,
  ChevronDown,
} from "lucide-react";

import { supabase } from "@/lib/supabase";


// =========================================
// TYPE STATUS
// =========================================

type StatusTugas =
  | "Belum Dikerjakan"
  | "Menunggu Konfirmasi"
  | "Revisi"
  | "Selesai";


// =========================================
// TYPE URUTAN
// =========================================

type UrutanTugas =
  | "Tugas Terbaru"
  | "Tugas Lama";


// =========================================
// STATUS FILTER OPTIONS
// =========================================

const STATUS_FILTER_OPTIONS:
  StatusTugas[] = [
    "Belum Dikerjakan",
    "Menunggu Konfirmasi",
    "Revisi",
    "Selesai",
  ];


// =========================================
// TYPE TUGAS
// =========================================

type Tugas = {
  id: string;

  tugasPesertaId: string;

  judul: string;

  deskripsi: string;

  pembimbing: string;

  tanggalDiberikan: string;

  batasWaktu: string;

  createdAt: string;

  status: StatusTugas;

  prioritas: boolean;
};


// =========================================
// STATUS STYLE
// =========================================

const statusStyle: Record<
  StatusTugas,
  string
> = {
  "Belum Dikerjakan":
    "bg-red-100 text-red-600",

  "Menunggu Konfirmasi":
    "bg-amber-100 text-amber-700",

  Revisi:
    "bg-orange-100 text-orange-700",

  Selesai:
    "bg-emerald-100 text-emerald-700",
};


// =========================================
// PAGE
// =========================================

export default function TugasPage() {
  // =======================================
  // PESERTA
  // =======================================

  const [
    pesertaId,
    setPesertaId,
  ] =
    useState<
      string | null
    >(
      null
    );


  // =======================================
  // DATA TUGAS
  // =======================================

  const [
    tugasList,
    setTugasList,
  ] =
    useState<
      Tugas[]
    >(
      []
    );


  // =======================================
  // LOADING
  // =======================================

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  // =======================================
  // ERROR
  // =======================================

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  // =======================================
  // UPDATE PRIORITAS
  // =======================================

  const [
    updatingId,
    setUpdatingId,
  ] =
    useState<
      string | null
    >(
      null
    );


  // =======================================
  // URUTAN TUGAS
  // =======================================

  const [
    urutanAktif,
    setUrutanAktif,
  ] =
    useState<UrutanTugas>(
      "Tugas Terbaru"
    );


  // =======================================
  // DROPDOWN FOCUS
  //
  // Supaya dropdown berubah biru saat
  // diklik / sedang aktif.
  // =======================================

  const [
    urutanFocus,
    setUrutanFocus,
  ] =
    useState(
      false
    );


  // =======================================
  // FILTER STATUS
  //
  // null = tampilkan semua status
  // =======================================

  const [
    statusAktif,
    setStatusAktif,
  ] =
    useState<
      StatusTugas | null
    >(
      null
    );


  // =========================================
  // FETCH TUGAS
  // =========================================

  const fetchTugas =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );


          // =====================================
          // USER LOGIN
          // =====================================

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
            setError(
              "User tidak ditemukan. Silakan login kembali."
            );

            return;
          }


          // =====================================
          // PESERTA
          // =====================================

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
              .select(
                "id"
              )
              .eq(
                "user_id",
                user.id
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
            setError(
              "Data peserta tidak ditemukan."
            );

            return;
          }


          setPesertaId(
            peserta.id
          );


          // =====================================
          // TUGAS PESERTA
          // =====================================

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
                status,
                prioritas
              `)
              .eq(
                "peserta_id",
                peserta.id
              );


          if (
            tugasPesertaError
          ) {
            throw tugasPesertaError;
          }


          if (
            !tugasPesertaData ||
            tugasPesertaData.length ===
              0
          ) {
            setTugasList(
              []
            );

            return;
          }


          // =====================================
          // ID TUGAS
          // =====================================

          const tugasIds =
            tugasPesertaData.map(
              (
                item
              ) =>
                item.tugas_id
            );


          // =====================================
          // DATA TUGAS
          // =====================================

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
              .in(
                "id",
                tugasIds
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


          // =====================================
          // ID PEMBIMBING
          // =====================================

          const pembimbingIds = [
            ...new Set(
              (
                tugasData ||
                []
              )
                .map(
                  (
                    item
                  ) =>
                    item
                      .pembimbing_id
                )
                .filter(
                  (
                    id
                  ): id is string =>
                    Boolean(
                      id
                    )
                )
            ),
          ];


          // =====================================
          // MAP PEMBIMBING
          // =====================================

          const pembimbingMap:
            Record<
              string,
              string
            > =
            {};


          // =====================================
          // DATA PEMBIMBING
          // =====================================

          if (
            pembimbingIds.length >
            0
          ) {
            const {
              data:
                pembimbingData,

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
                .in(
                  "id",
                  pembimbingIds
                );


            if (
              pembimbingError
            ) {
              console.warn(
                "PEMBIMBING ERROR:",
                pembimbingError
              );
            }


            if (
              pembimbingData &&
              pembimbingData.length >
                0
            ) {
              const userIds =
                pembimbingData
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
                      Boolean(
                        id
                      )
                  );


              // =================================
              // PROFILE PEMBIMBING
              // =================================

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


                if (
                  profileError
                ) {
                  console.warn(
                    "PROFILE PEMBIMBING ERROR:",
                    profileError
                  );
                }


                const profileMap:
                  Record<
                    string,
                    string
                  > =
                  {};


                (
                  profileData ||
                  []
                ).forEach(
                  (
                    profile
                  ) => {
                    profileMap[
                      profile.id
                    ] =
                      profile
                        .nama_lengkap ||
                      "Pembimbing";
                  }
                );


                pembimbingData.forEach(
                  (
                    pembimbing
                  ) => {
                    pembimbingMap[
                      pembimbing.id
                    ] =
                      profileMap[
                        pembimbing
                          .user_id
                      ] ||
                      "Pembimbing";
                  }
                );
              }
            }
          }


          // =====================================
          // MAP TUGAS PESERTA
          // =====================================

          const tugasPesertaMap =
            new Map<
              string,
              (
                typeof tugasPesertaData
              )[number]
            >();


          tugasPesertaData.forEach(
            (
              item
            ) => {
              tugasPesertaMap.set(
                String(
                  item.tugas_id
                ),

                item
              );
            }
          );


          // =====================================
          // FORMAT TUGAS
          // =====================================

          const hasil:
            Tugas[] =
            (
              tugasData ||
              []
            )
              .map(
                (
                  tugas
                ) => {
                  const assignment =
                    tugasPesertaMap.get(
                      String(
                        tugas.id
                      )
                    );


                  if (
                    !assignment
                  ) {
                    return null;
                  }


                  return {
                    id:
                      String(
                        tugas.id
                      ),

                    tugasPesertaId:
                      String(
                        assignment.id
                      ),

                    judul:
                      tugas.judul ||
                      "Tanpa Judul",

                    deskripsi:
                      tugas.deskripsi ||
                      "-",

                    pembimbing:
                      tugas
                        .pembimbing_id
                        ? pembimbingMap[
                            tugas
                              .pembimbing_id
                          ] ||
                          "Pembimbing"
                        : "Belum ditentukan",

                    tanggalDiberikan:
                      formatTanggalWaktu(
                        tugas
                          .created_at
                      ),

                    batasWaktu:
                      tugas.deadline
                        ? formatTanggalWaktu(
                            tugas
                              .deadline
                          )
                        : "Tidak ada deadline",

                    createdAt:
                      tugas
                        .created_at ||
                      "",

                    status:
                      convertStatus(
                        assignment.status
                      ),

                    prioritas:
                      assignment
                        .prioritas ??
                      false,
                  };
                }
              )
              .filter(
                (
                  item
                ): item is Tugas =>
                  item !==
                  null
              );


          setTugasList(
            hasil
          );

        } catch (
          err
        ) {
          console.error(
            "GAGAL MENGAMBIL TUGAS:",
            err
          );


          setError(
            "Gagal mengambil data tugas."
          );

        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );


  // =========================================
  // LOAD
  // =========================================

  useEffect(() => {
    fetchTugas();
  }, [
    fetchTugas,
  ]);


  // =========================================
  // PRIORITAS
  // =========================================

  const togglePrioritas =
    async (
      tugas:
        Tugas
    ) => {
      if (
        !pesertaId
      ) {
        return;
      }


      try {
        setUpdatingId(
          tugas.tugasPesertaId
        );


        const prioritasBaru =
          !tugas.prioritas;


        const {
          error:
            updateError,
        } =
          await supabase
            .from(
              "tugas_peserta"
            )
            .update({
              prioritas:
                prioritasBaru,
            })
            .eq(
              "id",
              tugas.tugasPesertaId
            )
            .eq(
              "peserta_id",
              pesertaId
            );


        if (
          updateError
        ) {
          throw updateError;
        }


        setTugasList(
          (
            prev
          ) =>
            prev.map(
              (
                item
              ) =>
                item.id ===
                tugas.id
                  ? {
                      ...item,

                      prioritas:
                        prioritasBaru,
                    }
                  : item
            )
        );

      } catch (
        err
      ) {
        console.error(
          "GAGAL UPDATE PRIORITAS:",
          err
        );


        alert(
          "Gagal mengubah prioritas tugas."
        );

      } finally {
        setUpdatingId(
          null
        );
      }
    };


  // =========================================
  // FILTER + SORTING
  // =========================================

  const filteredTugas =
    useMemo(
      () => {
        let data = [
          ...tugasList,
        ];


        // =====================================
        // FILTER STATUS
        // =====================================

        if (
          statusAktif
        ) {
          data =
            data.filter(
              (
                tugas
              ) =>
                tugas.status ===
                statusAktif
            );
        }


        // =====================================
        // SORTING
        // =====================================

        if (
          urutanAktif ===
          "Tugas Lama"
        ) {
          data.sort(
            (
              a,
              b
            ) =>
              getTimestamp(
                a.createdAt
              ) -
              getTimestamp(
                b.createdAt
              )
          );

        } else {
          data.sort(
            (
              a,
              b
            ) =>
              getTimestamp(
                b.createdAt
              ) -
              getTimestamp(
                a.createdAt
              )
          );
        }


        return data;
      },
      [
        tugasList,
        statusAktif,
        urutanAktif,
      ]
    );


  // =========================================
  // STATUS COUNT
  // =========================================

  function getStatusCount(
    status:
      StatusTugas
  ) {
    return tugasList.filter(
      (
        tugas
      ) =>
        tugas.status ===
        status
    ).length;
  }


  // =========================================
  // RESET FILTER
  // =========================================

  function resetFilter() {
    setStatusAktif(
      null
    );

    setUrutanAktif(
      "Tugas Terbaru"
    );
  }


  // =========================================
  // LOADING
  // =========================================

  if (
    loading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">

        <div className="text-center">

          <ClipboardList
            size={
              30
            }
            className="mx-auto mb-3 animate-pulse text-blue-500"
          />


          <p className="text-sm text-neutral-500">
            Memuat tugas...
          </p>

        </div>

      </div>
    );
  }


  // =========================================
  // ERROR
  // =========================================

  if (
    error
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
          {error}
        </div>

      </div>
    );
  }


  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="mb-8">

        <h1 className="text-2xl font-semibold text-neutral-900">
          Kegiatan Magang
        </h1>


        <p className="mt-1 text-sm text-neutral-500">
          Lihat dan kelola tugas yang diberikan
          oleh pembimbing.
        </p>

      </div>


      {/* =====================================
          FILTER
      ===================================== */}

      {tugasList.length >
        0 && (

        <div className="mb-7">

          {/* =================================
              FILTER TITLE
          ================================= */}

          <div className="mb-3 flex items-center gap-2">

            <ListFilter
              size={
                17
              }
              className="text-neutral-500"
            />


            <p className="text-sm font-medium text-neutral-700">
              Filter Tugas
            </p>

          </div>


          {/* =================================
              FILTER CONTROL
          ================================= */}

          <div className="overflow-x-auto pb-2">

            <div className="flex min-w-max items-center gap-2">

              {/* =============================
                  DROPDOWN URUTAN
              ============================= */}

              <div className="relative shrink-0">

                <select
                  value={
                    urutanAktif
                  }
                  onFocus={() =>
                    setUrutanFocus(
                      true
                    )
                  }
                  onBlur={() =>
                    setUrutanFocus(
                      false
                    )
                  }
                  onChange={(
                    event
                  ) =>
                    setUrutanAktif(
                      event.target
                        .value as
                        UrutanTugas
                    )
                  }
                  className={`
                    h-[42px]
                    appearance-none
                    rounded-full
                    border
                    py-2
                    pl-4
                    pr-10
                    text-sm
                    font-medium
                    outline-none
                    transition-all
                    duration-200

                    ${
                      urutanFocus
                        ? `
                          border-blue-600
                          bg-blue-600
                          text-white
                          shadow-sm
                        `
                        : `
                          border-neutral-200
                          bg-white
                          text-neutral-600
                          hover:border-blue-200
                          hover:bg-blue-50
                          hover:text-blue-600
                        `
                    }
                  `}
                >

                  <option
                    value="Tugas Terbaru"
                    className="bg-white text-neutral-700"
                  >
                    Tugas Terbaru
                  </option>


                  <option
                    value="Tugas Lama"
                    className="bg-white text-neutral-700"
                  >
                    Tugas Lama
                  </option>

                </select>


                <ChevronDown
                  size={
                    15
                  }
                  className={`
                    pointer-events-none
                    absolute
                    right-3.5
                    top-1/2
                    -translate-y-1/2
                    transition-colors
                    duration-200

                    ${
                      urutanFocus
                        ? "text-white"
                        : "text-neutral-400"
                    }
                  `}
                />

              </div>


              {/* =============================
                  STATUS FILTER
              ============================= */}

              {STATUS_FILTER_OPTIONS.map(
                (
                  status
                ) => {
                  const active =
                    statusAktif ===
                    status;


                  const count =
                    getStatusCount(
                      status
                    );


                  return (
                    <button
                      key={
                        status
                      }
                      type="button"
                      onClick={() =>
                        setStatusAktif(
                          (
                            current
                          ) =>
                            current ===
                            status
                              ? null
                              : status
                        )
                      }
                      className={`
                        flex
                        h-[42px]
                        items-center
                        gap-2
                        whitespace-nowrap
                        rounded-full
                        border
                        px-4
                        text-sm
                        font-medium
                        transition-all
                        duration-200

                        ${
                          active
                            ? `
                              border-blue-600
                              bg-blue-600
                              text-white
                              shadow-sm
                            `
                            : `
                              border-neutral-200
                              bg-white
                              text-neutral-600
                              hover:border-blue-200
                              hover:bg-blue-50
                              hover:text-blue-600
                            `
                        }
                      `}
                    >

                      <span>
                        {status}
                      </span>


                      <span
                        className={`
                          flex
                          min-w-6
                          items-center
                          justify-center
                          rounded-full
                          px-1.5
                          py-0.5
                          text-xs
                          font-semibold

                          ${
                            active
                              ? "bg-white/20 text-white"
                              : "bg-neutral-100 text-neutral-500"
                          }
                        `}
                      >
                        {count}
                      </span>

                    </button>
                  );
                }
              )}

            </div>

          </div>


          {/* =================================
              FILTER INFO
          ================================= */}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">

            <p className="text-xs text-neutral-400">

              Menampilkan{" "}

              <span className="font-medium text-neutral-600">
                {filteredTugas.length}
              </span>

              {" "}
              dari{" "}

              <span className="font-medium text-neutral-600">
                {tugasList.length}
              </span>

              {" "}
              tugas

            </p>


            <div className="flex items-center gap-2 text-xs text-neutral-400">

              <span>
                Urutan:{" "}

                <span className="font-medium text-blue-600">
                  {urutanAktif}
                </span>
              </span>


              <span>
                •
              </span>


              <span>
                Status:{" "}

                <span className="font-medium text-blue-600">
                  {statusAktif ||
                    "Semua"}
                </span>
              </span>


              {(
                statusAktif ||
                urutanAktif !==
                  "Tugas Terbaru"
              ) && (

                <button
                  type="button"
                  onClick={
                    resetFilter
                  }
                  className="ml-1 font-medium text-neutral-500 underline underline-offset-2 transition hover:text-blue-600"
                >
                  Reset
                </button>

              )}

            </div>

          </div>

        </div>

      )}


      {/* =====================================
          EMPTY
      ===================================== */}

      {filteredTugas.length ===
      0 ? (

        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-50 px-6 text-center">

          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">

            <ClipboardList
              size={
                24
              }
              className="text-neutral-400"
            />

          </div>


          <h3 className="text-sm font-semibold text-neutral-800">

            {tugasList.length ===
            0
              ? "Belum ada tugas"
              : "Tidak ada tugas pada filter ini"}

          </h3>


          <p className="mt-1 max-w-sm text-xs leading-5 text-neutral-500">

            {tugasList.length ===
            0
              ? "Belum ada tugas yang diberikan oleh pembimbing."
              : statusAktif
                ? `Tidak ditemukan tugas dengan status "${statusAktif}".`
                : "Tidak ditemukan tugas."}

          </p>


          {tugasList.length >
            0 && (

            <button
              type="button"
              onClick={
                resetFilter
              }
              className="mt-4 rounded-full bg-blue-600 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-blue-700"
            >
              Lihat Semua Tugas
            </button>

          )}

        </div>

      ) : (

        // =====================================
        // LIST TUGAS
        // =====================================

        <div className="space-y-5">

          {filteredTugas.map(
            (
              tugas
            ) => (

            <div
              key={
                tugas.id
              }
              className="relative rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-neutral-300 hover:shadow-md md:p-7"
            >

              {/* =================================
                  PRIORITAS
              ================================= */}

              <button
                type="button"
                disabled={
                  updatingId ===
                  tugas.tugasPesertaId
                }
                onClick={() =>
                  togglePrioritas(
                    tugas
                  )
                }
                className="absolute right-6 top-6 flex items-center gap-1.5 text-sm text-neutral-400 transition hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <Star
                  size={
                    17
                  }
                  className={
                    tugas.prioritas
                      ? "fill-amber-400 text-amber-400"
                      : ""
                  }
                />


                <span className="hidden sm:inline">
                  Prioritas
                </span>

              </button>


              {/* =================================
                  JUDUL
              ================================= */}

              <div className="pr-24">

                <div className="flex flex-wrap items-center gap-2">

                  <h2 className="text-xl font-semibold text-neutral-900">
                    {tugas.judul}
                  </h2>


                  {tugas.prioritas && (

                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-600">
                      Prioritas
                    </span>

                  )}

                </div>


                <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-500">
                  {tugas.deskripsi}
                </p>

              </div>


              {/* =================================
                  INFORMASI
              ================================= */}

              <div className="mt-6 grid gap-4 border-t border-neutral-100 pt-5 sm:grid-cols-3">

                {/* PEMBIMBING */}

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                    <User
                      size={
                        17
                      }
                    />

                  </div>


                  <div>

                    <p className="text-xs text-neutral-400">
                      Pembimbing
                    </p>


                    <p className="mt-0.5 text-sm font-medium text-neutral-700">
                      {tugas.pembimbing}
                    </p>

                  </div>

                </div>


                {/* TANGGAL DIBERIKAN */}

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                    <Clock
                      size={
                        17
                      }
                    />

                  </div>


                  <div>

                    <p className="text-xs text-neutral-400">
                      Tanggal diberikan
                    </p>


                    <p className="mt-0.5 text-sm font-medium text-neutral-700">
                      {tugas.tanggalDiberikan}
                    </p>

                  </div>

                </div>


                {/* DEADLINE */}

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">

                    <Clock
                      size={
                        17
                      }
                    />

                  </div>


                  <div>

                    <p className="text-xs text-neutral-400">
                      Batas waktu
                    </p>


                    <p className="mt-0.5 text-sm font-medium text-neutral-700">
                      {tugas.batasWaktu}
                    </p>

                  </div>

                </div>

              </div>


              {/* =================================
                  ACTION
              ================================= */}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-5">

                {/* STATUS */}

                <span
                  className={`
                    inline-flex
                    items-center
                    rounded-full
                    px-5
                    py-2.5
                    text-sm
                    font-medium

                    ${
                      statusStyle[
                        tugas.status
                      ]
                    }
                  `}
                >
                  {tugas.status}
                </span>


                {/* LAMPIRAN */}

                <Link
                  href={`/aktif/tugas/lampiran/${tugas.id}`}
                  className="flex items-center gap-2 rounded-full bg-neutral-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
                >

                  <Paperclip
                    size={
                      16
                    }
                  />


                  Lampiran Tugas

                </Link>

              </div>

            </div>

            )
          )}

        </div>

      )}

    </div>
  );
}


// =========================================
// STATUS DATABASE → UI
// =========================================

function convertStatus(
  status:
    string | null
):
StatusTugas {
  switch (
    status
  ) {
    case "menunggu_konfirmasi":
      return "Menunggu Konfirmasi";


    case "selesai":
      return "Selesai";


    case "revisi":
      return "Revisi";


    default:
      return "Belum Dikerjakan";
  }
}


// =========================================
// TIMESTAMP UNTUK SORTING
// =========================================

function getTimestamp(
  value:
    string
) {
  if (!value) {
    return 0;
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
    return 0;
  }


  return date.getTime();
}


// =========================================
// FORMAT TANGGAL
// =========================================

function formatTanggalWaktu(
  value:
    string | null
) {
  if (!value) {
    return "-";
  }


  // =======================================
  // DATE
  // =======================================

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    const [
      year,
      month,
      day,
    ] =
      value.split(
        "-"
      );


    const date =
      new Date(
        Number(
          year
        ),

        Number(
          month
        ) -
          1,

        Number(
          day
        )
      );


    return date
      .toLocaleDateString(
        "id-ID",
        {
          day:
            "2-digit",

          month:
            "2-digit",

          year:
            "numeric",
        }
      );
  }


  // =======================================
  // TIMESTAMP
  // =======================================

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


  return date.toLocaleString(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false,
    }
  );
}