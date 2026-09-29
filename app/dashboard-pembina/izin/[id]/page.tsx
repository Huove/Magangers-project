"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  Loader2,
  UserRound,
  X,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  XCircle,
  School,
  BriefcaseBusiness,
} from "lucide-react";

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
// DETAIL
// =====================================================

type IzinDetail = {
  id: string;

  pesertaId: string;

  pesertaNama: string;

  nomorPeserta: string;

  sekolah: string;

  jurusan: string;

  divisi: string;

  posisi: string;

  tanggalMulai: string;

  tanggalSelesai: string;

  alasan: string;

  status: StatusIzin;

  fileBuktiUrl:
    | string
    | null;

  catatan:
    | string
    | null;

  createdAt: string;

  diprosesOleh:
    | string
    | null;

  diprosesOlehNama:
    | string
    | null;
};


// =====================================================
// DATABASE
// =====================================================

type PengajuanIzinRow = {
  id: string;

  peserta_id: string;

  tanggal_mulai: string;

  tanggal_selesai: string;

  alasan: string;

  file_bukti_url:
    | string
    | null;

  status:
    | string
    | null;

  diproses_oleh:
    | string
    | null;

  catatan:
    | string
    | null;

  created_at: string;
};


// =====================================================
// PAGE
// =====================================================

export default function DetailIzinPage() {
  const params =
    useParams<{
      id: string;
    }>();


  const router =
    useRouter();


  const izinId =
    params?.id;


  // ===================================================
  // STATE
  // ===================================================

  const [
    izin,
    setIzin,
  ] =
    useState<
      IzinDetail | null
    >(null);


  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    processing,
    setProcessing,
  ] =
    useState(
      false
    );


  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  const [
    catatan,
    setCatatan,
  ] =
    useState(
      ""
    );


  // ===================================================
  // FETCH DETAIL
  // ===================================================

  const fetchDetail =
    useCallback(
      async () => {
        if (!izinId) {
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
          // 3. PENGAJUAN IZIN BERDASARKAN ID URL
          // =============================================

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
              .eq(
                "id",
                izinId
              )
              .maybeSingle();


          if (
            izinError
          ) {
            throw izinError;
          }


          if (!izinData) {
            throw new Error(
              "Pengajuan izin tidak ditemukan."
            );
          }


          const izinRow =
            izinData as
              PengajuanIzinRow;


          // =============================================
          // 4. VERIFIKASI PESERTA MEMANG BIMBINGAN
          // =============================================

          const {
            data:
              penempatan,
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
                posisi
              `)
              .eq(
                "peserta_id",
                izinRow
                  .peserta_id
              )
              .eq(
                "pembimbing_id",
                pembimbing.id
              )
              .maybeSingle();


          if (
            penempatanError
          ) {
            throw penempatanError;
          }


          // Tidak boleh melihat izin
          // peserta pembimbing lain.
          if (
            !penempatan
          ) {
            throw new Error(
              "Anda tidak memiliki akses ke pengajuan izin ini."
            );
          }


          // =============================================
          // 5. PESERTA
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
                nama_lengkap,
                nomor_peserta
              `)
              .eq(
                "id",
                izinRow
                  .peserta_id
              )
              .maybeSingle();


          if (
            pesertaError
          ) {
            throw pesertaError;
          }


          if (!peserta) {
            throw new Error(
              "Data peserta tidak ditemukan."
            );
          }


          // =============================================
          // 6. NAMA PESERTA
          //
          // peserta.nama_lengkap
          // fallback profiles
          // =============================================

          let pesertaNama =
            peserta
              .nama_lengkap ??
            "";


          if (
            !pesertaNama &&
            peserta.user_id
          ) {
            const {
              data:
                participantProfile,
            } =
              await supabase
                .from(
                  "profiles"
                )
                .select(`
                  nama_lengkap
                `)
                .eq(
                  "id",
                  peserta.user_id
                )
                .maybeSingle();


            pesertaNama =
              participantProfile
                ?.nama_lengkap ??
              "";
          }


          // =============================================
          // 7. PENDIDIKAN
          // =============================================

          let sekolah =
            "-";


          let jurusan =
            "-";


          const {
            data:
              pendidikan,
            error:
              pendidikanError,
          } =
            await supabase
              .from(
                "pendidikan"
              )
              .select(`
                sekolah,
                jurusan
              `)
              .eq(
                "peserta_id",
                peserta.id
              )
              .maybeSingle();


          if (
            pendidikanError
          ) {
            console.error(
              "PENDIDIKAN ERROR:",
              pendidikanError
            );
          }


          if (
            pendidikan
          ) {
            sekolah =
              pendidikan
                .sekolah ??
              "-";


            jurusan =
              pendidikan
                .jurusan ??
              "-";
          }


          // =============================================
          // 8. PEMROSES
          // =============================================

          let diprosesOlehNama:
            string | null =
            null;


          if (
            izinRow
              .diproses_oleh
          ) {
            const {
              data:
                processorProfile,
            } =
              await supabase
                .from(
                  "profiles"
                )
                .select(`
                  nama_lengkap
                `)
                .eq(
                  "id",
                  izinRow
                    .diproses_oleh
                )
                .maybeSingle();


            diprosesOlehNama =
              processorProfile
                ?.nama_lengkap ??
              null;
          }


          // =============================================
          // 9. FORMAT
          // =============================================

          const detail:
            IzinDetail =
            {
              id:
                izinRow.id,

              pesertaId:
                peserta.id,

              pesertaNama:
                pesertaNama ||
                "Peserta",

              nomorPeserta:
                peserta
                  .nomor_peserta ??
                "-",

              sekolah,

              jurusan,

              divisi:
                penempatan
                  .divisi ??
                "-",

              posisi:
                penempatan
                  .posisi ??
                "-",

              tanggalMulai:
                izinRow
                  .tanggal_mulai,

              tanggalSelesai:
                izinRow
                  .tanggal_selesai,

              alasan:
                izinRow
                  .alasan,

              status:
                formatStatus(
                  izinRow.status
                ),

              fileBuktiUrl:
                izinRow
                  .file_bukti_url,

              catatan:
                izinRow
                  .catatan,

              createdAt:
                izinRow
                  .created_at,

              diprosesOleh:
                izinRow
                  .diproses_oleh,

              diprosesOlehNama,
            };


          setIzin(
            detail
          );


          setCatatan(
            detail.catatan ??
              ""
          );

        } catch (
          err
        ) {
          console.error(
            "DETAIL IZIN ERROR:",
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil detail izin."
          );


          setIzin(
            null
          );

        } finally {
          setLoading(
            false
          );
        }
      },
      [
        izinId,
      ]
    );


  // ===================================================
  // LOAD
  // ===================================================

  useEffect(() => {
    fetchDetail();
  }, [
    fetchDetail,
  ]);


  // ===================================================
  // UPDATE STATUS
  // ===================================================

  async function handleStatus(
    status:
      "Disetujui"
      | "Ditolak"
  ) {
    if (!izin) {
      return;
    }


    const action =
      status ===
        "Disetujui"
        ? "menyetujui"
        : "menolak";


    const confirmed =
      window.confirm(
        `Yakin ingin ${action} pengajuan izin ${izin.pesertaNama}?`
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {
      setProcessing(
        true
      );


      setError(
        ""
      );


      // =============================================
      // USER PEMROSES
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
      // UPDATE DATABASE
      // =============================================

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
              status ===
                "Disetujui"
                ? "disetujui"
                : "ditolak",

            diproses_oleh:
              user.id,

            catatan:
              catatan
                .trim() ||
              null,
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


      // =============================================
      // REFRESH DATABASE
      // =============================================

      await fetchDetail();


      alert(
        status ===
          "Disetujui"
          ? "Pengajuan izin berhasil disetujui."
          : "Pengajuan izin berhasil ditolak."
      );

    } catch (
      err
    ) {
      console.error(
        "UPDATE IZIN ERROR:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal memperbarui pengajuan izin.";


      setError(
        message
      );


      alert(
        message
      );

    } finally {
      setProcessing(
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

          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />


          <p className="mt-3 text-sm text-slate-500">
            Memuat detail pengajuan izin...
          </p>

        </div>

      </div>
    );
  }


  // ===================================================
  // ERROR / NOT FOUND
  // ===================================================

  if (
    error &&
    !izin
  ) {
    return (
      <div>

        <Link
          href="/dashboard-pembina/izin"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />

          Kembali
        </Link>


        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

          <AlertCircle className="mx-auto h-9 w-9 text-red-500" />


          <h2 className="mt-3 font-bold text-red-700">
            Detail izin tidak dapat ditampilkan
          </h2>


          <p className="mt-2 text-sm text-red-600">
            {error}
          </p>

        </div>

      </div>
    );
  }


  if (
    !izin
  ) {
    return null;
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
        href="/dashboard-pembina/izin"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />

        Kembali ke Persetujuan Izin
      </Link>


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>

          <p className="text-sm font-semibold text-blue-600">
            DETAIL PENGAJUAN
          </p>


          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
            Pengajuan Izin
          </h1>


          <p className="mt-1 text-sm text-slate-500">
            Diajukan{" "}
            {formatDateTime(
              izin.createdAt
            )}
          </p>

        </div>


        <StatusBadge
          status={
            izin.status
          }
        />

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}


      {/* =================================================
          PESERTA
      ================================================= */}

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

        <div className="mb-5 flex items-center gap-3">

          <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-blue-600">
            <UserRound className="h-5 w-5" />
          </div>


          <div>

            <p className="text-lg font-bold text-slate-900">
              {izin.pesertaNama}
            </p>


            <p className="text-sm text-slate-400">
              {izin.nomorPeserta}
            </p>

          </div>

        </div>


        <div className="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">

          <InfoItem
            icon={
              School
            }
            label="Sekolah / Kampus"
            value={
              izin.sekolah
            }
          />


          <InfoItem
            icon={
              School
            }
            label="Jurusan"
            value={
              izin.jurusan
            }
          />


          <InfoItem
            icon={
              BriefcaseBusiness
            }
            label="Divisi"
            value={
              izin.divisi
            }
          />


          <InfoItem
            icon={
              BriefcaseBusiness
            }
            label="Posisi"
            value={
              izin.posisi
            }
          />

        </div>

      </section>


      {/* =================================================
          DETAIL IZIN
      ================================================= */}

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-bold text-slate-900">
          Detail Izin
        </h2>


        <div className="mt-5 grid gap-5 sm:grid-cols-2">

          {/* TYPE */}

          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Jenis Pengajuan
            </p>


            <p className="mt-1 font-semibold text-slate-800">
              Izin
            </p>

          </div>


          {/* STATUS */}

          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Status
            </p>


            <div className="mt-2">
              <StatusBadge
                status={
                  izin.status
                }
              />
            </div>

          </div>


          {/* START */}

          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Tanggal Mulai
            </p>


            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">

              <CalendarDays className="h-4 w-4 text-blue-500" />

              {formatDate(
                izin.tanggalMulai
              )}

            </div>

          </div>


          {/* END */}

          <div>

            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Tanggal Selesai
            </p>


            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">

              <CalendarDays className="h-4 w-4 text-blue-500" />

              {formatDate(
                izin.tanggalSelesai
              )}

            </div>

          </div>

        </div>


        {/* ALASAN */}

        <div className="mt-6">

          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Alasan / Keterangan
          </p>


          <div className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {izin.alasan}
          </div>

        </div>


        {/* FILE */}

        <div className="mt-6">

          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Bukti Pendukung
          </p>


          {izin.fileBuktiUrl ? (

            <a
              href={
                izin.fileBuktiUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
            >
              <FileText className="h-4 w-4" />

              Lihat Lampiran

              <ExternalLink className="h-3.5 w-3.5" />
            </a>

          ) : (

            <div className="mt-2 rounded-xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-400">
              Peserta tidak menyertakan bukti pendukung.
            </div>

          )}

        </div>

      </section>


      {/* =================================================
          CATATAN PEMBIMBING
      ================================================= */}

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">

        <h2 className="text-lg font-bold text-slate-900">
          Catatan Pembimbing
        </h2>


        <p className="mt-1 text-sm text-slate-500">
          Catatan akan disimpan bersama hasil persetujuan izin.
        </p>


        {izin.status ===
        "Menunggu" ? (

          <textarea
            value={
              catatan
            }
            onChange={(
              event
            ) =>
              setCatatan(
                event.target.value
              )
            }
            rows={4}
            placeholder="Tambahkan catatan jika diperlukan..."
            className="mt-4 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

        ) : (

          <div className="mt-4 rounded-xl bg-slate-50 p-4">

            <p className="text-sm leading-6 text-slate-600">
              {izin.catatan ||
                "Tidak ada catatan."}
            </p>

          </div>

        )}


        {/* PEMROSES */}

        {izin.diprosesOlehNama && (

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">

            <Clock3 className="h-3.5 w-3.5" />

            Diproses oleh{" "}

            <span className="font-semibold text-slate-600">
              {izin.diprosesOlehNama}
            </span>

          </div>

        )}

      </section>


      {/* =================================================
          ACTION
      ================================================= */}

      {izin.status ===
        "Menunggu" ? (

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:justify-end">

          {/* REJECT */}

          <button
            type="button"
            disabled={
              processing
            }
            onClick={() =>
              handleStatus(
                "Ditolak"
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {processing ? (

              <Loader2 className="h-4 w-4 animate-spin" />

            ) : (

              <X className="h-4 w-4" />

            )}

            Tolak Pengajuan

          </button>


          {/* APPROVE */}

          <button
            type="button"
            disabled={
              processing
            }
            onClick={() =>
              handleStatus(
                "Disetujui"
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {processing ? (

              <Loader2 className="h-4 w-4 animate-spin" />

            ) : (

              <Check className="h-4 w-4" />

            )}

            Setujui Pengajuan

          </button>

        </div>

      ) : (

        <div
          className={`flex items-center gap-3 rounded-2xl border p-5 ${
            izin.status ===
            "Disetujui"
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50"
          }`}
        >

          {izin.status ===
          "Disetujui" ? (

            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />

          ) : (

            <XCircle className="h-6 w-6 shrink-0 text-red-600" />

          )}


          <div>

            <p
              className={`font-semibold ${
                izin.status ===
                "Disetujui"
                  ? "text-emerald-700"
                  : "text-red-700"
              }`}
            >
              Pengajuan{" "}
              {izin.status}
            </p>


            <p
              className={`mt-0.5 text-sm ${
                izin.status ===
                "Disetujui"
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              Pengajuan ini telah selesai diproses.
            </p>

          </div>

        </div>

      )}

    </div>
  );
}


// =====================================================
// INFO ITEM
// =====================================================

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon:
    React.ElementType;

  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-500">
        <Icon className="h-4 w-4" />
      </div>


      <div>

        <p className="text-xs text-slate-400">
          {label}
        </p>


        <p className="mt-1 text-sm font-semibold text-slate-700">
          {value}
        </p>

      </div>

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
    StatusIzin;
}) {
  if (
    status ===
    "Disetujui"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">

        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

        Disetujui

      </span>
    );
  }


  if (
    status ===
    "Ditolak"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">

        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

        Ditolak

      </span>
    );
  }


  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">

      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />

      Menunggu

    </span>
  );
}


// =====================================================
// DATABASE STATUS → UI
// =====================================================

function formatStatus(
  status:
    | string
    | null
): StatusIzin {
  switch (
    status
  ) {
    case "disetujui":
      return "Disetujui";


    case "ditolak":
      return "Ditolak";


    default:
      return "Menunggu";
  }
}


// =====================================================
// DATE
// =====================================================

function formatDate(
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
        "long",

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
        "long",

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