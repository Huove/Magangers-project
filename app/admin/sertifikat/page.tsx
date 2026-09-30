"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import {
  getAdminCertificateParticipants,
  saveAdminCertificate,
  type AdminCertificateParticipant,
  type SaveAdminCertificatePayload,
} from "@/lib/admin/sertifikatService";

import CertificateModal from "@/components/admin/sertifikat/CertificateModal";


// =====================================================
// FILTER
// =====================================================

type CertificateFilter =
  | "semua"
  | "layak"
  | "belum_layak"
  | "diterbitkan";


// =====================================================
// PAGE
// =====================================================

export default function AdminCertificatePage() {
  // ===================================================
  // DATA
  // ===================================================

  const [
    participants,
    setParticipants,
  ] =
    useState<
      AdminCertificateParticipant[]
    >(
      []
    );


  // ===================================================
  // LOADING
  // ===================================================

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    refreshing,
    setRefreshing,
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


  // ===================================================
  // FILTER
  // ===================================================

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );


  const [
    filter,
    setFilter,
  ] =
    useState<CertificateFilter>(
      "semua"
    );


  // ===================================================
  // MODAL
  // ===================================================

  const [
    selectedParticipant,
    setSelectedParticipant,
  ] =
    useState<
      AdminCertificateParticipant | null
    >(
      null
    );


  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(
      false
    );


  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );


  const [
    modalError,
    setModalError,
  ] =
    useState(
      ""
    );


  // ===================================================
  // FETCH
  // ===================================================

  const fetchParticipants =
    useCallback(
      async (
        refresh =
          false
      ) => {
        try {
          if (
            refresh
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }


          setError(
            ""
          );


          const data =
            await getAdminCertificateParticipants();


          setParticipants(
            data
          );

        } catch (
          err
        ) {
          console.error(
            "ADMIN CERTIFICATE PAGE ERROR:",
            err
          );


          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil data sertifikat."
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
      fetchParticipants();
    },
    [
      fetchParticipants,
    ]
  );


  // ===================================================
  // STATS
  // ===================================================

  const statistics =
    useMemo(
      () => {
        const total =
          participants.length;


        const selesai =
          participants.filter(
            (
              item
            ) =>
              item.status ===
              "selesai"
          ).length;


        const layak =
          participants.filter(
            (
              item
            ) =>
              item.eligible &&
              !item.certificate
          ).length;


        const diterbitkan =
          participants.filter(
            (
              item
            ) =>
              Boolean(
                item.certificate
              )
          ).length;


        return {
          total,
          selesai,
          layak,
          diterbitkan,
        };
      },
      [
        participants,
      ]
    );


  // ===================================================
  // FILTERED
  // ===================================================

  const filteredParticipants =
    useMemo(
      () => {
        const keyword =
          search
            .trim()
            .toLowerCase();


        return participants.filter(
          (
            item
          ) => {
            // =========================================
            // SEARCH
            // =========================================

            const matchSearch =
              !keyword ||
              item.nama
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              item.nomorPeserta
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              item.email
                .toLowerCase()
                .includes(
                  keyword
                );


            // =========================================
            // FILTER
            // =========================================

            let matchFilter =
              true;


            if (
              filter ===
              "layak"
            ) {
              matchFilter =
                item.eligible &&
                !item.certificate;
            }


            if (
              filter ===
              "belum_layak"
            ) {
              matchFilter =
                !item.eligible &&
                !item.certificate;
            }


            if (
              filter ===
              "diterbitkan"
            ) {
              matchFilter =
                Boolean(
                  item.certificate
                );
            }


            return (
              matchSearch &&
              matchFilter
            );
          }
        );
      },
      [
        participants,
        search,
        filter,
      ]
    );


  // ===================================================
  // OPEN MODAL
  // ===================================================

  function handleOpenCertificate(
    participant:
      AdminCertificateParticipant
  ) {
    setSelectedParticipant(
      participant
    );


    setModalError(
      ""
    );


    setModalOpen(
      true
    );
  }


  // ===================================================
  // CLOSE MODAL
  // ===================================================

  function handleCloseModal() {
    if (
      saving
    ) {
      return;
    }


    setModalOpen(
      false
    );


    setSelectedParticipant(
      null
    );


    setModalError(
      ""
    );
  }


  // ===================================================
  // SAVE
  // ===================================================

  async function handleSaveCertificate(
    payload:
      SaveAdminCertificatePayload
  ) {
    try {
      setSaving(
        true
      );


      setModalError(
        ""
      );


      await saveAdminCertificate(
        payload
      );


      await fetchParticipants(
        true
      );


      setModalOpen(
        false
      );


      setSelectedParticipant(
        null
      );

    } catch (
      err
    ) {
      console.error(
        "SAVE CERTIFICATE ERROR:",
        err
      );


      setModalError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan sertifikat."
      );

    } finally {
      setSaving(
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
            size={
              30
            }
            className="mx-auto animate-spin text-blue-600"
          />


          <p className="mt-4 text-sm text-neutral-500">
            Memuat data sertifikat...
          </p>

        </div>

      </div>
    );
  }


  // ===================================================
  // ERROR
  // ===================================================

  if (
    error
  ) {
    return (
      <div className="space-y-6">

        <PageHeader />


        <div className="rounded-3xl border border-red-200 bg-red-50 p-6">

          <div className="flex items-start gap-3">

            <AlertCircle
              size={
                22
              }
              className="mt-0.5 shrink-0 text-red-600"
            />


            <div>

              <h2 className="font-semibold text-red-800">
                Gagal memuat data sertifikat
              </h2>


              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>


              <button
                type="button"
                onClick={() =>
                  fetchParticipants()
                }
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >

                <RefreshCw
                  size={
                    15
                  }
                />

                Coba Lagi

              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

        <PageHeader />


        <button
          type="button"
          disabled={
            refreshing
          }
          onClick={() =>
            fetchParticipants(
              true
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
        >

          <RefreshCw
            size={
              16
            }
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />


          {refreshing
            ? "Memperbarui..."
            : "Refresh"}

        </button>

      </div>


      {/* =================================================
          STATS
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          icon={
            UserCheck
          }
          title="Peserta"
          value={
            statistics.total
          }
          description="Peserta aktif & selesai"
          iconClass="bg-blue-50 text-blue-600"
        />


        <StatCard
          icon={
            CheckCircle2
          }
          title="Selesai Magang"
          value={
            statistics.selesai
          }
          description="Status peserta selesai"
          iconClass="bg-emerald-50 text-emerald-600"
        />


        <StatCard
          icon={
            ShieldCheck
          }
          title="Layak Sertifikat"
          value={
            statistics.layak
          }
          description="Siap diterbitkan"
          iconClass="bg-violet-50 text-violet-600"
        />


        <StatCard
          icon={
            Award
          }
          title="Diterbitkan"
          value={
            statistics.diterbitkan
          }
          description="Sertifikat tersedia"
          iconClass="bg-amber-50 text-amber-600"
        />

      </div>


      {/* =================================================
          FILTER
      ================================================= */}

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search
              size={
                17
              }
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
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
              placeholder="Cari nama, nomor peserta, atau email..."
              className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />

          </div>


          {/* FILTERS */}

          <div className="flex gap-2 overflow-x-auto">

            <FilterButton
              active={
                filter ===
                "semua"
              }
              onClick={() =>
                setFilter(
                  "semua"
                )
              }
            >
              Semua
            </FilterButton>


            <FilterButton
              active={
                filter ===
                "layak"
              }
              onClick={() =>
                setFilter(
                  "layak"
                )
              }
            >
              Layak
            </FilterButton>


            <FilterButton
              active={
                filter ===
                "belum_layak"
              }
              onClick={() =>
                setFilter(
                  "belum_layak"
                )
              }
            >
              Belum Layak
            </FilterButton>


            <FilterButton
              active={
                filter ===
                "diterbitkan"
              }
              onClick={() =>
                setFilter(
                  "diterbitkan"
                )
              }
            >
              Diterbitkan
            </FilterButton>

          </div>

        </div>

      </div>


      {/* =================================================
          LIST
      ================================================= */}

      <div className="rounded-3xl border border-neutral-200 bg-white shadow-sm">

        {/* HEADER */}

        <div className="border-b border-neutral-100 px-6 py-5">

          <h2 className="font-semibold text-neutral-900">
            Daftar Sertifikat Peserta
          </h2>


          <p className="mt-1 text-sm text-neutral-500">

            Menampilkan{" "}

            <span className="font-medium text-neutral-700">
              {filteredParticipants.length}
            </span>

            {" "}peserta.

          </p>

        </div>


        {/* EMPTY */}

        {filteredParticipants.length ===
        0 ? (

          <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">

            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">

              <Award
                size={
                  25
                }
              />

            </div>


            <h3 className="mt-4 font-semibold text-neutral-700">
              Tidak ada data
            </h3>


            <p className="mt-1 text-sm text-neutral-400">
              Tidak ada peserta yang cocok dengan filter saat ini.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-neutral-100">

            {filteredParticipants.map(
              (
                participant
              ) => (

              <ParticipantCertificateRow
                key={
                  participant.id
                }
                participant={
                  participant
                }
                onOpen={
                  handleOpenCertificate
                }
              />

              )
            )}

          </div>

        )}

      </div>


      {/* =================================================
          MODAL
      ================================================= */}

      <CertificateModal
        open={
          modalOpen
        }
        participant={
          selectedParticipant
        }
        saving={
          saving
        }
        error={
          modalError
        }
        onClose={
          handleCloseModal
        }
        onSubmit={
          handleSaveCertificate
        }
      />

    </div>
  );
}


// =====================================================
// HEADER
// =====================================================

function PageHeader() {
  return (
    <div>

      <div className="flex items-center gap-2">

        <Award
          size={
            21
          }
          className="text-blue-600"
        />


        <h1 className="text-2xl font-bold text-neutral-900">
          Sertifikat Peserta
        </h1>

      </div>


      <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
        Periksa kelayakan peserta dan terbitkan sertifikat setelah seluruh
        persyaratan program magang terpenuhi.
      </p>

    </div>
  );
}


// =====================================================
// PARTICIPANT ROW
// =====================================================

function ParticipantCertificateRow({
  participant,
  onOpen,
}: {
  participant:
    AdminCertificateParticipant;

  onOpen:
    (
      participant:
        AdminCertificateParticipant
    ) => void;
}) {
  const certificate =
    participant.certificate;


  return (
    <div className="p-5 transition hover:bg-neutral-50/70 md:p-6">

      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">

        {/* =================================================
            PARTICIPANT
        ================================================= */}

        <div className="min-w-0 flex-1">

          <div className="flex flex-wrap items-center gap-2">

            <h3 className="font-semibold text-neutral-900">
              {participant.nama}
            </h3>


            <ParticipantStatus
              status={
                participant.status
              }
            />

          </div>


          <p className="mt-1 text-xs text-neutral-400">
            {participant.nomorPeserta}
            {" • "}
            {participant.email}
          </p>


          {/* REQUIREMENTS */}

          <div className="mt-4 flex flex-wrap gap-2">

            <RequirementChip
              complete={
                participant
                  .requirements
                  .magangSelesai
              }
              text="Magang"
            />


            <RequirementChip
              complete={
                participant
                  .requirements
                  .semuaTugasSelesai
              }
              text={`Tugas ${participant.tugasSelesai}/${participant.totalTugas}`}
            />


            <RequirementChip
              complete={
                participant
                  .requirements
                  .laporanAkhirDisetujui
              }
              text="Laporan"
            />


            <RequirementChip
              complete={
                participant
                  .requirements
                  .penilaianSelesai
              }
              text="Penilaian"
            />

          </div>

        </div>


        {/* =================================================
            PROGRESS
        ================================================= */}

        <div className="w-full xl:w-44">

          <div className="flex items-center justify-between text-xs">

            <span className="text-neutral-400">
              Persyaratan
            </span>


            <span className="font-semibold text-neutral-700">

              {participant.completedRequirements}
              /
              {participant.totalRequirements}

            </span>

          </div>


          <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">

            <div
              className={`h-full rounded-full ${
                participant.eligible
                  ? "bg-emerald-500"
                  : "bg-blue-500"
              }`}
              style={{
                width:
                  `${
                    (
                      participant.completedRequirements /
                      participant.totalRequirements
                    ) *
                    100
                  }%`,
              }}
            />

          </div>


          <p className="mt-2 text-xs text-neutral-400">

            Nilai:{" "}

            <span className="font-semibold text-neutral-700">

              {participant.nilaiAkhir !==
              null
                ? participant.nilaiAkhir
                : "-"}

            </span>

          </p>

        </div>


        {/* =================================================
            CERTIFICATE
        ================================================= */}

        <div className="w-full xl:w-56">

          {certificate ? (

            <div>

              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">

                <FileCheck2
                  size={
                    16
                  }
                />

                Diterbitkan

              </div>


              <p className="mt-1 truncate text-xs text-neutral-500">
                {certificate.nomorSertifikat ||
                  "-"}
              </p>


              <p className="mt-1 text-xs text-neutral-400">
                {formatDate(
                  certificate
                    .tanggalTerbit
                )}
              </p>

            </div>

          ) : participant.eligible ? (

            <div className="flex items-center gap-2 text-sm font-semibold text-violet-600">

              <ShieldCheck
                size={
                  16
                }
              />

              Siap diterbitkan

            </div>

          ) : (

            <div className="flex items-center gap-2 text-sm font-medium text-neutral-400">

              <Clock3
                size={
                  16
                }
              />

              Belum memenuhi syarat

            </div>

          )}

        </div>


        {/* =================================================
            ACTION
        ================================================= */}

        <div className="flex shrink-0 flex-wrap gap-2">

          {/* VIEW */}

          {certificate
            ?.fileUrl && (

            <a
              href={
                certificate.fileUrl
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50"
            >

              <Eye
                size={
                  15
                }
              />

              Lihat

            </a>

          )}


          {/* DOWNLOAD */}

          {certificate
            ?.fileUrl && (

            <a
              href={
                certificate.fileUrl
              }
              target="_blank"
              rel="noreferrer"
              download
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-50"
            >

              <Download
                size={
                  15
                }
              />

              Download

            </a>

          )}


          {/* ISSUE / EDIT */}

          {(participant.eligible ||
            certificate) && (

            <button
              type="button"
              onClick={() =>
                onOpen(
                  participant
                )
              }
              className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${
                certificate
                  ? "bg-neutral-800 hover:bg-neutral-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >

              {certificate
                ? "Edit"
                : "Terbitkan"}

            </button>

          )}

        </div>

      </div>

    </div>
  );
}


// =====================================================
// REQUIREMENT CHIP
// =====================================================

function RequirementChip({
  complete,
  text,
}: {
  complete:
    boolean;

  text:
    string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        complete
          ? "bg-emerald-50 text-emerald-700"
          : "bg-neutral-100 text-neutral-400"
      }`}
    >

      {complete ? (

        <CheckCircle2
          size={
            12
          }
        />

      ) : (

        <Clock3
          size={
            12
          }
        />

      )}


      {text}

    </span>
  );
}


// =====================================================
// STATUS
// =====================================================

function ParticipantStatus({
  status,
}: {
  status:
    string;
}) {
  const normalized =
    status
      .toLowerCase()
      .trim();


  if (
    normalized ===
    "selesai"
  ) {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        Selesai
      </span>
    );
  }


  if (
    normalized ===
    "aktif"
  ) {
    return (
      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
        Aktif
      </span>
    );
  }


  if (
    normalized ===
    "diberhentikan"
  ) {
    return (
      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
        Diberhentikan
      </span>
    );
  }


  return (
    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-500">
      {status}
    </span>
  );
}


// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  icon:
    Icon,

  title,

  value,

  description,

  iconClass,
}: {
  icon:
    typeof Award;

  title:
    string;

  value:
    number;

  description:
    string;

  iconClass:
    string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

      <div
        className={`grid h-11 w-11 place-items-center rounded-xl ${iconClass}`}
      >
        <Icon
          size={
            20
          }
        />
      </div>


      <p className="mt-4 text-sm text-neutral-500">
        {title}
      </p>


      <p className="mt-1 text-2xl font-bold text-neutral-900">
        {value}
      </p>


      <p className="mt-1 text-xs text-neutral-400">
        {description}
      </p>

    </div>
  );
}


// =====================================================
// FILTER BUTTON
// =====================================================

function FilterButton({
  active,
  onClick,
  children,
}: {
  active:
    boolean;

  onClick:
    () => void;

  children:
    string;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
        active
          ? "bg-blue-600 text-white"
          : "bg-neutral-100 text-neutral-500 hover:bg-blue-50 hover:text-blue-600"
      }`}
    >
      {children}
    </button>
  );
}


// =====================================================
// DATE
// =====================================================

function formatDate(
  value:
    string | null
) {
  if (
    !value
  ) {
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


  return date.toLocaleDateString(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  );
}