"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";

import {
  useParams,
} from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  Send,
  AlertCircle,
  UserRound,
  CalendarDays,
  Timer,
  ExternalLink,
} from "lucide-react";

import {
  FileUpload,
} from "@/components/aktif/ui/file_upload";

import {
  supabase,
} from "@/lib/supabase";

// =========================================
// TYPE
// =========================================

type StatusPengumpulan =
  | "Belum dikumpulkan"
  | "Menunggu Konfirmasi"
  | "Disetujui"
  | "Perlu Perbaikan";

type DetailTugas = {
  id: string;
  judul: string;
  deskripsi: string;
  pembimbing: string;
  tanggalDiberikan: string;
  batasWaktu: string;
};

type TugasPeserta = {
  id: string;
  status: string | null;
  fileUrl: string | null;
  jawaban: string;
  dikumpulkanAt: string | null;
};

// =========================================
// PAGE
// =========================================

export default function PengumpulanTugasPage() {
  const params =
    useParams();

  const rawId =
    params.id;

  const tugasId =
    Array.isArray(rawId)
      ? rawId[0]
      : rawId;

  const [pesertaId, setPesertaId] =
    useState<string | null>(null);

  const [file, setFile] =
    useState<File | null>(null);

  const [catatan, setCatatan] =
    useState("");

  const [
    detailTugas,
    setDetailTugas,
  ] =
    useState<DetailTugas | null>(
      null
    );

  const [
    tugasPeserta,
    setTugasPeserta,
  ] =
    useState<TugasPeserta | null>(
      null
    );

  const [
    status,
    setStatus,
  ] =
    useState<StatusPengumpulan>(
      "Belum dikumpulkan"
    );

  const [loading, setLoading] =
    useState(true);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [error, setError] =
    useState("");

  // =========================================
  // FETCH DETAIL
  // =========================================

  const fetchDetail =
    useCallback(async () => {
      if (!tugasId) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        // =====================================
        // USER
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
        // PESERTA
        // =====================================

        const {
          data: peserta,
          error: pesertaError,
        } = await supabase
          .from("peserta")
          .select("id")
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

        setPesertaId(
          peserta.id
        );

        // =====================================
        // TUGAS PESERTA
        // =====================================

        const {
          data: assignment,
          error:
            assignmentError,
        } = await supabase
          .from(
            "tugas_peserta"
          )
          .select(`
            id,
            status,
            file_url,
            jawaban,
            dikumpulkan_at
          `)
          .eq(
            "peserta_id",
            peserta.id
          )
          .eq(
            "tugas_id",
            tugasId
          )
          .maybeSingle();

        if (assignmentError) {
          throw assignmentError;
        }

        if (!assignment) {
          setError(
            "Tugas ini tidak diberikan kepada kamu."
          );

          return;
        }

        const assignmentData: TugasPeserta =
          {
            id:
              String(
                assignment.id
              ),

            status:
              assignment.status,

            fileUrl:
              assignment.file_url ||
              null,

            jawaban:
              assignment.jawaban ||
              "",

            dikumpulkanAt:
              assignment.dikumpulkan_at ||
              null,
          };

        setTugasPeserta(
          assignmentData
        );

        setCatatan(
          assignmentData.jawaban
        );

        setStatus(
          convertStatus(
            assignment.status
          )
        );

        // =====================================
        // TUGAS
        // =====================================

        const {
          data: tugas,
          error: tugasError,
        } = await supabase
          .from("tugas")
          .select(`
            id,
            judul,
            deskripsi,
            pembimbing_id,
            deadline,
            created_at
          `)
          .eq(
            "id",
            tugasId
          )
          .maybeSingle();

        if (tugasError) {
          throw tugasError;
        }

        if (!tugas) {
          setError(
            "Detail tugas tidak ditemukan."
          );

          return;
        }

        // =====================================
        // PEMBIMBING
        // =====================================

        let namaPembimbing =
          "Belum ditentukan";

        if (
          tugas.pembimbing_id
        ) {
          const {
            data:
              pembimbingData,
            error:
              pembimbingError,
          } = await supabase
            .from("pembimbing")
            .select("user_id")
            .eq(
              "id",
              tugas.pembimbing_id
            )
            .maybeSingle();

          if (
            pembimbingError
          ) {
            console.error(
              "PEMBIMBING ERROR:",
              pembimbingError
            );
          }

          if (
            pembimbingData?.user_id
          ) {
            const {
              data:
                profileData,
              error:
                profileError,
            } = await supabase
              .from("profiles")
              .select(
                "nama_lengkap"
              )
              .eq(
                "id",
                pembimbingData.user_id
              )
              .maybeSingle();

            if (profileError) {
              console.error(
                "PROFILE PEMBIMBING ERROR:",
                profileError
              );
            }

            namaPembimbing =
              profileData?.nama_lengkap ||
              "Pembimbing";
          }
        }

        // =====================================
        // SET DETAIL
        // =====================================

        setDetailTugas({
          id:
            String(
              tugas.id
            ),

          judul:
            tugas.judul ||
            "Tanpa Judul",

          deskripsi:
            tugas.deskripsi ||
            "-",

          pembimbing:
            namaPembimbing,

          tanggalDiberikan:
            formatTanggalWaktu(
              tugas.created_at
            ),

          batasWaktu:
            tugas.deadline
              ? formatTanggalWaktu(
                  tugas.deadline
                )
              : "Tidak ada deadline",
        });
      } catch (err) {
        console.error(
          "GAGAL MENGAMBIL DETAIL:",
          err
        );

        setError(
          "Gagal mengambil detail tugas."
        );
      } finally {
        setLoading(false);
      }
    }, [tugasId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // =========================================
  // FILE CHANGE
  // =========================================

  const handleFileChange = (
    files: File[]
  ) => {
    if (
      files.length === 0
    ) {
      setFile(null);
      return;
    }

    setFile(
      files[0]
    );
  };

  // =========================================
  // SUBMIT
  // =========================================

  const handleSubmit =
    async () => {
      if (
        !file ||
        !tugasPeserta ||
        !tugasId ||
        !pesertaId
      ) {
        return;
      }

      // Hanya boleh ketika belum atau revisi

      if (
        status ===
          "Menunggu Konfirmasi" ||
        status ===
          "Disetujui"
      ) {
        return;
      }

      try {
        setSubmitting(true);

        // =====================================
        // USER
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
          throw new Error(
            "User tidak ditemukan."
          );
        }

        // =====================================
        // EXTENSION
        // =====================================

        const allowedExtensions = [
          "pdf",
          "doc",
          "docx",
          "xls",
          "xlsx",
          "ppt",
          "pptx",
          "zip",
          "jpg",
          "jpeg",
          "png",
        ];

        const extension =
          file.name
            .split(".")
            .pop()
            ?.toLowerCase();

        if (
          !extension ||
          !allowedExtensions.includes(
            extension
          )
        ) {
          alert(
            "Format file tidak didukung."
          );

          return;
        }

        // =====================================
        // MAX 20 MB
        // =====================================

        const maxSize =
          20 *
          1024 *
          1024;

        if (
          file.size > maxSize
        ) {
          alert(
            "Ukuran file maksimal 20 MB."
          );

          return;
        }

        // =====================================
        // FILE NAME
        // =====================================

        const cleanFileName =
          file.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          );

        const filePath =
          `${user.id}/${tugasId}/${Date.now()}-${cleanFileName}`;

        // =====================================
        // UPLOAD STORAGE
        // =====================================

        const {
          error: uploadError,
        } = await supabase.storage
          .from("tugas")
          .upload(
            filePath,
            file,
            {
              cacheControl:
                "3600",

              upsert:
                false,
            }
          );

        if (uploadError) {
          throw uploadError;
        }

        // =====================================
        // PUBLIC URL
        // =====================================

        const {
          data: publicUrlData,
        } = supabase.storage
          .from("tugas")
          .getPublicUrl(
            filePath
          );

        const fileUrl =
          publicUrlData.publicUrl;

        const now =
          new Date().toISOString();

        // =====================================
        // UPDATE TUGAS PESERTA
        // =====================================

        const {
          error: updateError,
        } = await supabase
          .from("tugas_peserta")
          .update({
            file_url:
              fileUrl,

            jawaban:
              catatan.trim() ||
              null,

            dikumpulkan_at:
              now,

            // OTOMATIS
            status:
              "menunggu_konfirmasi",
          })
          .eq(
            "id",
            tugasPeserta.id
          )
          .eq(
            "peserta_id",
            pesertaId
          );

        if (updateError) {
          throw updateError;
        }

        // =====================================
        // UI
        // =====================================

        setStatus(
          "Menunggu Konfirmasi"
        );

        setTugasPeserta(
          (prev) =>
            prev
              ? {
                  ...prev,

                  fileUrl,

                  jawaban:
                    catatan,

                  dikumpulkanAt:
                    now,

                  status:
                    "menunggu_konfirmasi",
                }
              : prev
        );

        setFile(null);

        alert(
          "Tugas berhasil dikumpulkan."
        );
      } catch (err) {
        console.error(
          "GAGAL MENGUMPULKAN TUGAS:",
          err
        );

        alert(
          "Gagal mengumpulkan tugas. Cek console."
        );
      } finally {
        setSubmitting(false);
      }
    };

  // =========================================
  // STATUS CONFIG
  // =========================================

  const statusConfig: Record<
    StatusPengumpulan,
    {
      icon: React.ReactNode;
      className: string;
    }
  > = {
    "Belum dikumpulkan": {
      icon: (
        <Clock3
          size={17}
        />
      ),

      className:
        "bg-neutral-100 text-neutral-600",
    },

    "Menunggu Konfirmasi": {
      icon: (
        <Clock3
          size={17}
        />
      ),

      className:
        "bg-amber-100 text-amber-700",
    },

    Disetujui: {
      icon: (
        <CheckCircle2
          size={17}
        />
      ),

      className:
        "bg-emerald-100 text-emerald-700",
    },

    "Perlu Perbaikan": {
      icon: (
        <AlertCircle
          size={17}
        />
      ),

      className:
        "bg-red-100 text-red-700",
    },
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">

        <div className="text-center">

          <FileText
            size={30}
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
    error ||
    !detailTugas ||
    !tugasPeserta
  ) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-8">

        <Link
          href="/aktif/tugas"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-blue-600"
        >
          <ArrowLeft size={17} />

          Kembali ke Tugas
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error ||
            "Tugas tidak ditemukan."}
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="mb-8">

        <Link
          href="/aktif/tugas"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-blue-600"
        >
          <ArrowLeft
            size={17}
          />

          Kembali ke Tugas
        </Link>

        <h1 className="text-2xl font-semibold text-neutral-900">
          {detailTugas.judul}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          Kumpulkan hasil tugas untuk diperiksa
          oleh pembimbing.
        </p>

      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">

        {/* ===================================
            LEFT
        =================================== */}

        <div className="space-y-6">

          {/* =================================
              DETAIL TUGAS
          ================================= */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

            <div className="mb-5">

              <h2 className="text-lg font-semibold text-neutral-900">
                Detail Tugas
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Mohon kerjakan dengan baik dan teliti sebelum mengumpulkan tugas.
              </p>

            </div>

            <div className="rounded-2xl bg-neutral-50 p-5">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                  <FileText
                    size={20}
                  />

                </div>

                <div className="min-w-0">

                  <h3 className="text-base font-semibold text-neutral-900">
                    {detailTugas.judul}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                    {detailTugas.deskripsi}
                  </p>

                </div>

              </div>

              <div className="mt-6 grid gap-4 border-t border-neutral-200 pt-5 sm:grid-cols-2">

                {/* PEMBIMBING */}

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-500">
                    <UserRound size={16} />
                  </div>

                  <div>

                    <p className="text-xs text-neutral-400">
                      Pembimbing
                    </p>

                    <p className="mt-1 text-sm font-medium text-neutral-800">
                      {detailTugas.pembimbing}
                    </p>

                  </div>

                </div>

                {/* DEADLINE */}

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-500">
                    <Timer size={16} />
                  </div>

                  <div>

                    <p className="text-xs text-neutral-400">
                      Batas Waktu
                    </p>

                    <p className="mt-1 text-sm font-medium text-neutral-800">
                      {detailTugas.batasWaktu}
                    </p>

                  </div>

                </div>

                {/* TANGGAL */}

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-500">
                    <CalendarDays size={16} />
                  </div>

                  <div>

                    <p className="text-xs text-neutral-400">
                      Tanggal Diberikan
                    </p>

                    <p className="mt-1 text-sm font-medium text-neutral-800">
                      {
                        detailTugas
                          .tanggalDiberikan
                      }
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </section>

          {/* =================================
              PENGUMPULAN
          ================================= */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

            <div className="mb-5">

              <h2 className="text-lg font-semibold text-neutral-900">
                Pengumpulan Tugas
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Upload hasil pekerjaan kamu
                untuk dikirim kepada pembimbing.
              </p>

            </div>

            {/* FILE YANG SUDAH DIKIRIM */}

            {tugasPeserta.fileUrl && (

              <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

                <p className="text-xs font-semibold text-emerald-700">
                  File yang telah dikumpulkan
                </p>

                <a
                  href={
                    tugasPeserta.fileUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-emerald-700 underline"
                >
                  <ExternalLink
                    size={15}
                  />

                  Lihat file tugas
                </a>

                {tugasPeserta
                  .dikumpulkanAt && (

                  <p className="mt-2 text-xs text-emerald-600">
                    Dikumpulkan{" "}
                    {formatTanggalWaktu(
                      tugasPeserta
                        .dikumpulkanAt
                    )}
                  </p>

                )}

              </div>

            )}

            {/* =================================
                UPLOAD
            ================================= */}

            {status !==
              "Disetujui" &&
              status !==
                "Menunggu Konfirmasi" && (

              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">

                <FileUpload
                  onChange={
                    handleFileChange
                  }
                />

              </div>

            )}

            {/* FORMAT */}

            {status !==
              "Disetujui" &&
              status !==
                "Menunggu Konfirmasi" && (

              <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3">

                <div className="flex items-start gap-3">

                  <FileText
                    size={17}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <div>

                    <p className="text-xs font-semibold text-blue-700">
                      Format file yang dapat
                      dikumpulkan
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-blue-600">
                      PDF, DOC, DOCX, XLS, XLSX,
                      PPT, PPTX, ZIP, JPG, JPEG,
                      dan PNG. Maksimal 20 MB.
                    </p>

                  </div>

                </div>

              </div>

            )}

            {/* CATATAN */}

            <div className="mt-5">

              <label className="mb-2 block text-sm font-medium text-neutral-800">

                Catatan untuk pembimbing

                <span className="ml-1 font-normal text-neutral-400">
                  (opsional)
                </span>

              </label>

              <textarea
                value={catatan}
                disabled={
                  status ===
                    "Disetujui" ||
                  status ===
                    "Menunggu Konfirmasi"
                }
                onChange={(event) =>
                  setCatatan(
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Tambahkan catatan mengenai tugas yang dikumpulkan..."
                className="w-full resize-none rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-neutral-50"
              />

            </div>

            {/* BUTTON */}

            <button
              onClick={
                handleSubmit
              }
              disabled={
                !file ||
                submitting ||
                status ===
                  "Menunggu Konfirmasi" ||
                status ===
                  "Disetujui"
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Send size={17} />

              {submitting
                ? "Mengirim..."
                : status ===
                    "Menunggu Konfirmasi"
                  ? "Menunggu Konfirmasi"
                  : status ===
                      "Disetujui"
                    ? "Tugas Telah Disetujui"
                    : status ===
                        "Perlu Perbaikan"
                      ? "Kirim Perbaikan"
                      : "Kirim Tugas"}

            </button>

          </section>

        </div>

        {/* ===================================
            RIGHT
        =================================== */}

        <aside className="space-y-6">

          {/* STATUS */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-blue-600">
              STATUS PENGUMPULAN
            </p>

            <h2 className="mt-1 text-lg font-semibold text-neutral-900">
              Status Tugas
            </h2>

            <div
              className={`mt-5 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium ${
                statusConfig[
                  status
                ].className
              }`}
            >

              {
                statusConfig[
                  status
                ].icon
              }

              {status}

            </div>

            <div className="mt-6 space-y-5">

              <div className="flex gap-3">

                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                </div>

                <div>

                  <p className="text-sm font-medium text-neutral-800">
                    Pengumpulan
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                    File tugas dikirim oleh
                    peserta.
                  </p>

                </div>

              </div>

              <div className="flex gap-3">

                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                </div>

                <div>

                  <p className="text-sm font-medium text-neutral-800">
                    Konfirmasi
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                    Pembimbing akan memeriksa
                    tugas yang dikirim.
                  </p>

                </div>

              </div>

              <div className="flex gap-3">

                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>

                <div>

                  <p className="text-sm font-medium text-neutral-800">
                    Selesai
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                    Tugas disetujui oleh
                    pembimbing.
                  </p>

                </div>

              </div>

            </div>

          </section>

          {/* PERHATIAN */}

          <section className="rounded-3xl border border-blue-100 bg-blue-50/50 p-6">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                <FileText
                  size={17}
                />

              </div>

              <div>

                <h3 className="text-sm font-semibold text-neutral-900">
                  Perhatian
                </h3>

                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  Pastikan file yang kamu upload
                  merupakan hasil pekerjaan
                  terbaru sebelum mengirimkannya
                  kepada pembimbing.
                </p>

              </div>

            </div>

          </section>

        </aside>

      </div>

    </div>
  );
}

// =========================================
// STATUS DATABASE → UI
// =========================================

function convertStatus(
  status: string | null
): StatusPengumpulan {
  switch (status) {
    case "menunggu_konfirmasi":
      return "Menunggu Konfirmasi";

    case "selesai":
      return "Disetujui";

    case "revisi":
      return "Perlu Perbaikan";

    default:
      return "Belum dikumpulkan";
  }
}

// =========================================
// FORMAT TANGGAL
// =========================================

function formatTanggalWaktu(
  value: string | null
) {
  if (!value) {
    return "-";
  }

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    const [
      year,
      month,
      day,
    ] = value.split("-");

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    return date.toLocaleDateString(
      "id-ID",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  const date =
    new Date(value);

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
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  );
}