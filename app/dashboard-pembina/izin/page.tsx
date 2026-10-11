"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronRight,
  ChevronDown,
  Calendar,
  Search,
  Eye,
  X,
  Check,
  FileCheck2,
  ChevronLeft,
  Loader2,
} from "lucide-react";

import Link from "next/link";

import {
  supabase,
} from "@/lib/supabase";


// =====================================================
// STATUS
// =====================================================

type StatusIzin =
  | "Menunggu"
  | "Disetujui"
  | "Ditolak";


// =====================================================
// IZIN FRONTEND
// =====================================================

type Izin = {
  id:
    string;

  pesertaId:
    string;

  pesertaNama:
    string;

  tanggalRaw:
    string;

  tanggal:
    string;

  tanggalSelesaiRaw:
    string;

  tanggalSelesai:
    string;

  jenisIzin:
    string;

  keterangan:
    string;

  status:
    StatusIzin;

  fileBuktiUrl:
    string | null;

  catatan:
    string | null;

  createdAt:
    string;
};


// =====================================================
// DATABASE TYPE
// =====================================================

type PengajuanIzinRow = {
  id:
    string;

  peserta_id:
    string;

  tanggal_mulai:
    string;

  tanggal_selesai:
    string;

  alasan:
    string;

  file_bukti_url:
    string | null;

  status:
    string | null;

  diproses_oleh:
    string | null;

  catatan:
    string | null;

  created_at:
    string;
};


type PesertaRow = {
  id:
    string;

  user_id:
    string | null;

  nama_lengkap:
    string | null;
};


type PenempatanRow = {
  peserta_id:
    string;
};


// =====================================================
// STATUS OPTIONS
// =====================================================

const STATUS_OPTIONS:
  StatusIzin[] = [
    "Menunggu",
    "Disetujui",
    "Ditolak",
  ];


// =====================================================
// STATUS STYLE
// =====================================================

function statusBadgeClasses(
  status:
    StatusIzin
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
    StatusIzin
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

export default function PersetujuanIzinPage() {
  // ===================================================
  // DATA
  // ===================================================

  const [
    izinList,
    setIzinList,
  ] =
    useState<Izin[]>(
      []
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
    useState<
      string | null
    >(
      null
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
      | StatusIzin
    >(
      "Semua Status"
    );


  const [
    tanggalFilter,
    setTanggalFilter,
  ] =
    useState(
      ""
    );


  const [
    query,
    setQuery,
  ] =
    useState(
      ""
    );


  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchIzin();
  }, []);


  // ===================================================
  // FETCH IZIN
  // ===================================================

  async function fetchIzin() {
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
      // 2. CARI PEMBIMBING LOGIN
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


      // ===============================================
      // 3. CARI PESERTA BIMBINGAN
      // ===============================================

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


      // ===============================================
      // BELUM PUNYA PESERTA BIMBINGAN
      // ===============================================

      if (
        pesertaIds.length ===
        0
      ) {
        setIzinList(
          []
        );

        return;
      }


      // ===============================================
      // 4. DATA PESERTA
      // ===============================================

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


      const peserta =
        (
          pesertaData ??
          []
        ) as PesertaRow[];


      // ===============================================
      // 5. PROFILE FALLBACK
      //
      // Kalau nama_lengkap pada peserta kosong,
      // ambil dari profiles.
      // ===============================================

      const userIds =
        peserta
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
            "Gagal mengambil profile peserta:",
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


      // ===============================================
      // 6. PESERTA MAP
      // ===============================================

      const pesertaMap =
        new Map<
          string,
          string
        >();


      for (
        const item
        of peserta
      ) {
        const nama =
          item
            .nama_lengkap ||

          (
            item.user_id
              ? profileMap.get(
                  item.user_id
                )
              : null
          ) ||

          "Peserta";


        pesertaMap.set(
          item.id,
          nama
        );
      }


      // ===============================================
      // 7. AMBIL PENGAJUAN IZIN
      // ===============================================

      const {
        data:
          izinData,
        error:
          izinError,
      } =
        await supabase
          .from(
            "pengajuan_izin"
          )
          .select(`
            id,
            peserta_id,
            tanggal_mulai,
            tanggal_selesai,
            alasan,
            file_bukti_url,
            status,
            diproses_oleh,
            catatan,
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
          );


      if (
        izinError
      ) {
        throw izinError;
      }


      // ===============================================
      // 8. FORMAT DATABASE → UI
      // ===============================================

      const formatted:
        Izin[] =
        (
          (
            izinData ??
            []
          ) as PengajuanIzinRow[]
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
              item
                .tanggal_mulai,

            tanggal:
              formatTanggal(
                item
                  .tanggal_mulai
              ),

            tanggalSelesaiRaw:
              item
                .tanggal_selesai,

            tanggalSelesai:
              formatTanggal(
                item
                  .tanggal_selesai
              ),

            /*
             * Database pengajuan_izin saat ini
             * belum mempunyai kolom jenis_izin.
             *
             * Jadi kita tampilkan "Izin"
             * sebagai jenis umum.
             *
             * Alasan sebenarnya tetap
             * ditampilkan di kolom Keterangan.
             */
            jenisIzin:
              "Izin",

            keterangan:
              item.alasan,

            status:
              formatStatusIzin(
                item.status
              ),

            fileBuktiUrl:
              item
                .file_bukti_url,

            catatan:
              item.catatan,

            createdAt:
              item.created_at,
          })
        );


      setIzinList(
        formatted
      );

    } catch (
      err
    ) {
      console.error(
        "Gagal mengambil data izin:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data izin."
      );


      setIzinList(
        []
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  // ===================================================
  // FILTER
  // ===================================================

  const filtered =
    useMemo(() => {
      const keyword =
        query
          .trim()
          .toLowerCase();


      return izinList.filter(
        (
          izin
        ) => {
          // =============================================
          // STATUS
          // =============================================

          const matchStatus =
            statusFilter ===
              "Semua Status" ||

            izin.status ===
              statusFilter;


          // =============================================
          // SEARCH
          // =============================================

          const matchQuery =
            !keyword ||

            izin.pesertaNama
              .toLowerCase()
              .includes(
                keyword
              ) ||

            izin.jenisIzin
              .toLowerCase()
              .includes(
                keyword
              ) ||

            izin.keterangan
              .toLowerCase()
              .includes(
                keyword
              );


          // =============================================
          // DATE
          // =============================================

          const matchTanggal =
            !tanggalFilter ||

            izin.tanggalRaw ===
              tanggalFilter ||

            izin.tanggalSelesaiRaw ===
              tanggalFilter;


          return (
            matchStatus &&
            matchQuery &&
            matchTanggal
          );
        }
      );

    }, [
      izinList,
      statusFilter,
      query,
      tanggalFilter,
    ]);


  // ===================================================
  // QUICK ACTION
  // ===================================================

  async function handleQuickAction(
    izin:
      Izin,

    newStatus:
      StatusIzin
  ) {
    try {
      // ===============================================
      // KONFIRMASI
      // ===============================================

      const actionText =
        newStatus ===
          "Disetujui"
          ? "menyetujui"
          : "menolak";


      const confirmed =
        window.confirm(
          `Yakin ingin ${actionText} pengajuan izin ${izin.pesertaNama}?`
        );


      if (
        !confirmed
      ) {
        return;
      }


      setProcessingId(
        izin.id
      );


      setError(
        ""
      );


      // ===============================================
      // USER PEMROSES
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
      // UPDATE DATABASE
      // ===============================================

      const {
        error:
          updateError,
      } =
        await supabase
          .from(
            "pengajuan_izin"
          )
          .update({
            status:
              getDatabaseStatus(
                newStatus
              ),

            diproses_oleh:
              user.id,
          })
          .eq(
            "id",
            izin.id
          );


      if (
        updateError
      ) {
        throw updateError;
      }


      // ===============================================
      // UPDATE STATE
      // ===============================================

      setIzinList(
        (
          previous
        ) =>
          previous.map(
            (
              item
            ) =>
              item.id ===
              izin.id
                ? {
                    ...item,

                    status:
                      newStatus,
                  }
                : item
          )
      );

    } catch (
      err
    ) {
      console.error(
        "Gagal mengubah status izin:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengubah status izin.";


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
            Persetujuan Izin
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
              Persetujuan Izin
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

        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>

      )}


      {/* =================================================
          FILTER
      ================================================= */}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">

        {/* STATUS */}

        <div className="relative sm:w-56">

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
                  | StatusIzin
              )
            }
            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-brand-blue"
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

        <div className="relative sm:w-52">

          <input
            type="date"
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
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-brand-blue"
          />


          <Calendar className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        </div>


        {/* SEARCH */}

        <div className="relative flex-1">

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
            placeholder="Cari izin..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-brand-blue"
          />

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

            Memuat pengajuan izin...

          </div>

        ) : filtered.length ===
          0 ? (

          /* EMPTY */

          <div className="flex flex-col items-center gap-2 p-14 text-center">

            <FileCheck2 className="h-8 w-8 text-slate-300" />


            <p className="text-sm text-slate-400">
              Tidak ada pengajuan izin yang cocok dengan filter ini.
            </p>

          </div>

        ) : (

          /* TABLE */

          <table className="w-full min-w-[900px] text-left text-sm">

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
                  Jenis Izin
                </th>


                <th className="px-4 py-4 font-medium">
                  Keterangan
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
                  izin,
                  index
                ) => (

                  <tr
                    key={
                      izin.id
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
                            izin.pesertaNama
                          )}
                        </span>


                        <span className="font-medium text-slate-700">
                          {izin.pesertaNama}
                        </span>

                      </div>

                    </td>


                    {/* DATE */}

                    <td className="px-4 py-4 text-slate-500">

                      {izin.tanggalRaw ===
                      izin.tanggalSelesaiRaw ? (

                        izin.tanggal

                      ) : (

                        <div>

                          <p>
                            {izin.tanggal}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            s/d{" "}
                            {izin.tanggalSelesai}
                          </p>

                        </div>

                      )}

                    </td>


                    {/* TYPE */}

                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {izin.jenisIzin}
                    </td>


                    {/* DESCRIPTION */}

                    <td className="max-w-[320px] px-4 py-4 text-slate-500">

                      <p className="line-clamp-2">
                        {izin.keterangan}
                      </p>

                    </td>


                    {/* STATUS */}

                    <td className="px-4 py-4">

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(
                          izin.status
                        )}`}
                      >

                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusDotClasses(
                            izin.status
                          )}`}
                        />


                        {izin.status}

                      </span>

                    </td>


                    {/* ACTION */}

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-2">

                        {/* DETAIL */}

                        <Link
                          href={`/dashboard-pembina/izin/${izin.id}`}
                          aria-label="Lihat detail"
                          className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-brand-blue transition-colors hover:bg-blue-100"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>


                        {/* =================================
                            HANYA TAMPILKAN APPROVE / REJECT
                            JIKA MASIH MENUNGGU
                        ================================= */}

                        {izin.status ===
                          "Menunggu" && (
                          <>

                            {/* REJECT */}

                            <button
                              type="button"
                              disabled={
                                processingId ===
                                izin.id
                              }
                              onClick={() =>
                                handleQuickAction(
                                  izin,
                                  "Ditolak"
                                )
                              }
                              aria-label="Tolak"
                              title="Tolak pengajuan"
                              className="grid h-9 w-9 place-items-center rounded-lg bg-red-500 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              {processingId ===
                              izin.id ? (

                                <Loader2 className="h-4 w-4 animate-spin" />

                              ) : (

                                <X className="h-4 w-4" />

                              )}

                            </button>


                            {/* APPROVE */}

                            <button
                              type="button"
                              disabled={
                                processingId ===
                                izin.id
                              }
                              onClick={() =>
                                handleQuickAction(
                                  izin,
                                  "Disetujui"
                                )
                              }
                              aria-label="Setujui"
                              title="Setujui pengajuan"
                              className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500 text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >

                              {processingId ===
                              izin.id ? (

                                <Loader2 className="h-4 w-4 animate-spin" />

                              ) : (

                                <Check className="h-4 w-4" />

                              )}

                            </button>

                          </>
                        )}

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
            {" izin"}
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

function formatStatusIzin(
  status:
    | string
    | null
): StatusIzin {
  const value =
    (
      status ??
      ""
    )
      .trim()
      .toLowerCase();


  if (
    value ===
    "disetujui"
  ) {
    return "Disetujui";
  }


  if (
    value ===
    "ditolak"
  ) {
    return "Ditolak";
  }


  return "Menunggu";
}


// =====================================================
// UI STATUS → DATABASE
// =====================================================

function getDatabaseStatus(
  status:
    StatusIzin
):
  | "menunggu"
  | "disetujui"
  | "ditolak" {
  switch (
    status
  ) {
    case "Disetujui":
      return "disetujui";


    case "Ditolak":
      return "ditolak";


    default:
      return "menunggu";
  }
}


// =====================================================
// FORMAT DATE
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