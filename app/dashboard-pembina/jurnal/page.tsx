"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronRight,
  ChevronDown,
  Calendar,
  Eye,
  MoreVertical,
  BookOpen,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Check,
  RotateCcw,
} from "lucide-react";

import Link from "next/link";

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
// JOURNAL UI
// =====================================================

type JurnalItem = {
  id: string;

  pesertaId: string;

  pesertaNama: string;

  tanggalRaw: string;

  tanggal: string;

  judulJurnal: string;

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

type PenempatanRow = {
  peserta_id: string;
};


type PesertaRow = {
  id: string;

  user_id:
    | string
    | null;

  nama_lengkap:
    | string
    | null;
};


type ProfileRow = {
  id: string;

  nama_lengkap:
    | string
    | null;
};


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
// STATUS OPTIONS
// =====================================================

const STATUS_OPTIONS:
  StatusJurnal[] = [
    "Menunggu",
    "Disetujui",
    "Perlu Revisi",
  ];


// =====================================================
// STATUS STYLE
// =====================================================

function statusBadgeClasses(
  status:
    StatusJurnal
) {
  if (
    status ===
    "Menunggu"
  ) {
    return "bg-amber-100 text-amber-700";
  }


  if (
    status ===
    "Disetujui"
  ) {
    return "bg-emerald-100 text-emerald-700";
  }


  return "bg-red-100 text-red-700";
}


function statusDotClasses(
  status:
    StatusJurnal
) {
  if (
    status ===
    "Menunggu"
  ) {
    return "bg-amber-500";
  }


  if (
    status ===
    "Disetujui"
  ) {
    return "bg-emerald-500";
  }


  return "bg-red-500";
}


// =====================================================
// PAGE
// =====================================================

export default function PemeriksaanJurnalPage() {
  // ===================================================
  // DATA
  // ===================================================

  const [
    jurnalList,
    setJurnalList,
  ] =
    useState<
      JurnalItem[]
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


  const [
    processingId,
    setProcessingId,
  ] =
    useState<
      string | null
    >(null);


  // ===================================================
  // FILTER
  // ===================================================

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      | "Semua Status"
      | StatusJurnal
    >(
      "Semua Status"
    );


  const [
    tanggalFilter,
    setTanggalFilter,
  ] =
    useState(
      "Pilih Tanggal"
    );


  const [
    openMenuId,
    setOpenMenuId,
  ] =
    useState<
      string | null
    >(null);


  // ===================================================
  // FETCH JOURNAL
  // ===================================================

  const fetchJurnal =
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


          setPembimbingId(
            pembimbing.id
          );


          // =============================================
          // 3. PESERTA BIMBINGAN
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


          const penempatan =
            (
              penempatanData ??
              []
            ) as PenempatanRow[];


          const pesertaIds = [
            ...new Set(
              penempatan.map(
                (
                  item
                ) =>
                  item.peserta_id
              )
            ),
          ];


          // =============================================
          // BELUM ADA PESERTA BIMBINGAN
          // =============================================

          if (
            pesertaIds.length ===
            0
          ) {
            setJurnalList(
              []
            );

            return;
          }


          // =============================================
          // 4. DATA PESERTA
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
                nama_lengkap
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
          // 5. PROFILE FALLBACK
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
          }


          // =============================================
          // 6. MAP PESERTA
          // =============================================

          const pesertaMap =
            new Map<
              string,
              string
            >();


          for (
            const peserta
            of pesertaRows
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


          // =============================================
          // 7. JURNAL PESERTA
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
              .in(
                "peserta_id",
                pesertaIds
              )
              .order(
                "tanggal",
                {
                  ascending:
                    false,
                }
              )
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              );


          if (
            jurnalError
          ) {
            throw jurnalError;
          }


          // =============================================
          // 8. FORMAT
          // =============================================

          const formatted:
            JurnalItem[] =
            (
              (
                jurnalData ??
                []
              ) as JurnalDatabaseRow[]
            ).map(
              (
                item
              ) => ({
                id:
                  item.id,

                pesertaId:
                  item.peserta_id,

                pesertaNama:
                  pesertaMap.get(
                    item.peserta_id
                  ) ??
                  "Peserta",

                tanggalRaw:
                  item.tanggal,

                tanggal:
                  formatTanggal(
                    item.tanggal
                  ),

                judulJurnal:
                  item.judul ||
                  "Jurnal Kegiatan",

                kegiatan:
                  item.kegiatan,

                hasil:
                  item.hasil,

                fileUrl:
                  item.file_url,

                status:
                  formatStatusJurnal(
                    item.status
                  ),

                rawStatus:
                  item.status ??
                  "menunggu",

                catatanPembimbing:
                  item
                    .catatan_pembimbing,

                disetujuiOleh:
                  item
                    .disetujui_oleh,

                disetujuiAt:
                  item
                    .disetujui_at,

                createdAt:
                  item.created_at,
              })
            );


          setJurnalList(
            formatted
          );

        } catch (
          err
        ) {
          console.error(
            "PEMERIKSAAN JURNAL ERROR:",
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil data jurnal."
          );


          setJurnalList(
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
    fetchJurnal();
  }, [
    fetchJurnal,
  ]);


  // ===================================================
  // DATE OPTIONS
  // ===================================================

  const tanggalOptions =
    useMemo(
      () => {
        const uniqueDates = [
          ...new Set(
            jurnalList.map(
              (
                item
              ) =>
                item.tanggalRaw
            )
          ),
        ];


        return uniqueDates.sort(
          (
            a,
            b
          ) =>
            new Date(
              b
            ).getTime() -
            new Date(
              a
            ).getTime()
        );
      },
      [
        jurnalList,
      ]
    );


  // ===================================================
  // FILTER
  // ===================================================

  const filtered =
    useMemo(
      () => {
        return jurnalList.filter(
          (
            jurnal
          ) => {
            const matchStatus =
              statusFilter ===
                "Semua Status" ||

              jurnal.status ===
                statusFilter;


            const matchTanggal =
              tanggalFilter ===
                "Pilih Tanggal" ||

              jurnal.tanggalRaw ===
                tanggalFilter;


            return (
              matchStatus &&
              matchTanggal
            );
          }
        );
      },
      [
        jurnalList,
        statusFilter,
        tanggalFilter,
      ]
    );


  // ===================================================
  // UPDATE STATUS
  // ===================================================

  async function handleStatusUpdate(
    jurnal:
      JurnalItem,

    newStatus:
      "disetujui"
      | "revisi"
  ) {
    if (
      !pembimbingId
    ) {
      alert(
        "Data pembimbing tidak ditemukan."
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
      setProcessingId(
        jurnal.id
      );


      setError(
        ""
      );


      // =============================================
      // APPROVE
      // =============================================

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

              disetujui_oleh:
                pembimbingId,

              disetujui_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              jurnal.id
            );


        if (
          updateError
        ) {
          throw updateError;
        }
      }


      // =============================================
      // REVISION
      // =============================================

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

              disetujui_oleh:
                null,

              disetujui_at:
                null,
            })
            .eq(
              "id",
              jurnal.id
            );


        if (
          updateError
        ) {
          throw updateError;
        }
      }


      // =============================================
      // CLOSE MENU
      // =============================================

      setOpenMenuId(
        null
      );


      // =============================================
      // REFRESH
      // =============================================

      await fetchJurnal();

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
      setProcessingId(
        null
      );
    }
  }


  // ===================================================
  // TODAY
  // ===================================================

  const today =
    new Intl.DateTimeFormat(
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
      }
    ).format(
      new Date()
    );


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">

        <div>

          <h1 className="text-2xl font-extrabold text-slate-900">
            Pemeriksaan Jurnal
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
              Pemeriksaan Jurnal
            </span>

          </div>

        </div>


        <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm">

          <Calendar className="h-4 w-4 text-slate-400" />

          {today}

          <ChevronDown className="h-4 w-4 text-slate-400" />

        </span>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>
            {error}
          </span>

        </div>

      )}


      {/* =================================================
          FILTERS
      ================================================= */}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">

        {/* STATUS */}

        <div className="relative flex-1 sm:max-w-xs">

          <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />


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
                  | StatusJurnal
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


        {/* DATE */}

        <div className="relative flex-1 sm:max-w-xs">

          <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />


          <select
            value={
              tanggalFilter
            }
            onChange={(
              event
            ) =>
              setTanggalFilter(
                event.target.value
              )
            }
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-brand-blue"
          >

            <option value="Pilih Tanggal">
              Pilih Tanggal
            </option>


            {tanggalOptions.map(
              (
                tanggal
              ) => (

                <option
                  key={
                    tanggal
                  }
                  value={
                    tanggal
                  }
                >
                  {formatTanggal(
                    tanggal
                  )}
                </option>

              )
            )}

          </select>


          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        </div>

      </div>


      {/* =================================================
          TABLE
      ================================================= */}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">

        {/* LOADING */}

        {loading ? (

          <div className="flex items-center justify-center gap-3 p-14 text-sm text-slate-400">

            <Loader2 className="h-5 w-5 animate-spin" />

            Memuat jurnal peserta...

          </div>

        ) : filtered.length ===
          0 ? (

          /* EMPTY */

          <div className="flex flex-col items-center gap-2 p-14 text-center">

            <BookOpen className="h-8 w-8 text-slate-300" />


            <p className="text-sm text-slate-400">
              Tidak ada jurnal yang cocok dengan filter ini.
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
                  Peserta
                </th>


                <th className="px-4 py-4 font-medium">
                  Tanggal
                </th>


                <th className="px-4 py-4 font-medium">
                  Judul Jurnal
                </th>


                <th className="px-4 py-4 font-medium">
                  Status
                </th>


                <th className="px-6 py-4 font-medium">
                  Aksi
                </th>

              </tr>

            </thead>


            <tbody>

              {filtered.map(
                (
                  jurnal,
                  index
                ) => (

                <tr
                  key={
                    jurnal.id
                  }
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60"
                >

                  {/* NO */}

                  <td className="px-6 py-4">

                    <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
                      {index + 1}
                    </span>

                  </td>


                  {/* PESERTA */}

                  <td className="px-4 py-4">

                    <div className="flex items-center gap-2.5">

                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-xs font-bold text-blue-600">

                        {getInisial(
                          jurnal.pesertaNama
                        )}

                      </span>


                      <span className="font-medium text-slate-700">
                        {jurnal.pesertaNama}
                      </span>

                    </div>

                  </td>


                  {/* DATE */}

                  <td className="px-4 py-4 text-slate-500">
                    {jurnal.tanggal}
                  </td>


                  {/* TITLE */}

                  <td className="px-4 py-4">

                    <p className="font-semibold text-slate-900">
                      {jurnal.judulJurnal}
                    </p>


                    <p className="mt-1 line-clamp-1 max-w-[300px] text-xs text-slate-400">
                      {jurnal.kegiatan}
                    </p>

                  </td>


                  {/* STATUS */}

                  <td className="px-4 py-4">

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(
                        jurnal.status
                      )}`}
                    >

                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusDotClasses(
                          jurnal.status
                        )}`}
                      />


                      {jurnal.status}

                    </span>

                  </td>


                  {/* ACTION */}

                  <td className="px-6 py-4">

                    <div className="flex items-center gap-2">

                      {/* DETAIL */}

                      <Link
                        href={`/dashboard-pembina/jurnal/${jurnal.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3.5 py-2 text-xs font-semibold text-brand-blue transition-colors hover:bg-blue-100"
                      >
                        <Eye className="h-3.5 w-3.5" />

                        Detail
                      </Link>


                      {/* MENU */}

                      <div className="relative">

                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId ===
                                jurnal.id
                                ? null
                                : jurnal.id
                            )
                          }
                          aria-label="Aksi lain"
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>


                        {openMenuId ===
                          jurnal.id && (

                          <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg">

                            {/* APPROVE */}

                            <button
                              type="button"
                              disabled={
                                processingId ===
                                jurnal.id
                              }
                              onClick={() =>
                                handleStatusUpdate(
                                  jurnal,
                                  "disetujui"
                                )
                              }
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                            >

                              {processingId ===
                              jurnal.id ? (

                                <Loader2 className="h-3.5 w-3.5 animate-spin" />

                              ) : (

                                <Check className="h-3.5 w-3.5" />

                              )}

                              Tandai Disetujui

                            </button>


                            {/* REVISI */}

                            <button
                              type="button"
                              disabled={
                                processingId ===
                                jurnal.id
                              }
                              onClick={() =>
                                handleStatusUpdate(
                                  jurnal,
                                  "revisi"
                                )
                              }
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                            >

                              {processingId ===
                              jurnal.id ? (

                                <Loader2 className="h-3.5 w-3.5 animate-spin" />

                              ) : (

                                <RotateCcw className="h-3.5 w-3.5" />

                              )}

                              Minta Revisi

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
            {" jurnal"}
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
              <ChevronRight className="h-4 w-4" />
            </button>

          </div>

        </div>

      )}

    </div>
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
// DATE
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