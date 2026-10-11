"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import StatCard from "@/components/admin/dashboard/StatisticCard";

import {
  getAdminNotifications,
  sendParticipantNotification,
  sendBulkNotification,
  deleteAdminNotification,
  type AdminNotification,
  type AdminNotificationStats,
  type ParticipantStatus,
} from "@/lib/admin/notifikasiService";

import {
  getAdminParticipants,
  type AdminParticipant,
} from "@/lib/admin/pesertaService";

import {
  Bell,
  Send,
  MailOpen,
  Clock3,
  Search,
  Plus,
  X,
  Trash2,
  UserRound,
  Users,
  Megaphone,
  RefreshCw,
} from "lucide-react";


// =====================================================
// TYPE
// =====================================================

type SendMode =
  | "peserta"
  | "massal";


// =====================================================
// INITIAL STATS
// =====================================================

const initialStats:
  AdminNotificationStats = {
    total: 0,
    dibaca: 0,
    belumDibaca: 0,
  };


// =====================================================
// PAGE
// =====================================================

export default function NotifikasiPage() {
  // ===================================================
  // DATA
  // ===================================================

  const [
    notifications,
    setNotifications,
  ] =
    useState<
      AdminNotification[]
    >([]);


  const [
    participants,
    setParticipants,
  ] =
    useState<
      AdminParticipant[]
    >([]);


  const [
    stats,
    setStats,
  ] =
    useState<
      AdminNotificationStats
    >(
      initialStats
    );


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
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  // ===================================================
  // FILTER
  // ===================================================

  const [
    search,
    setSearch,
  ] =
    useState("");


  const [
    readFilter,
    setReadFilter,
  ] =
    useState(
      "Semua"
    );


  // ===================================================
  // MODAL
  // ===================================================

  const [
    formOpen,
    setFormOpen,
  ] =
    useState(false);


  const [
    mode,
    setMode,
  ] =
    useState<SendMode>(
      "peserta"
    );


  const [
    pesertaId,
    setPesertaId,
  ] =
    useState("");


  const [
    bulkStatus,
    setBulkStatus,
  ] =
    useState<
      ParticipantStatus
      | ""
    >("");


  const [
    judul,
    setJudul,
  ] =
    useState("");


  const [
    pesan,
    setPesan,
  ] =
    useState("");


  // ===================================================
  // INITIAL
  // ===================================================

  useEffect(() => {
    loadData();
  }, []);


  // ===================================================
  // LOAD
  //
  // PAGE
  // ↓
  // SERVICE
  // ↓
  // /api/admin/notifikasi
  // ↓
  // requireAdmin()
  // ===================================================

  async function loadData(
    refresh = false
  ) {
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


      setError(
        ""
      );


      const [
        notificationResult,
        participantResult,
      ] =
        await Promise.allSettled([
          getAdminNotifications(
            200
          ),

          getAdminParticipants(),
        ]);


      // ===============================================
      // NOTIFIKASI
      // ===============================================

      if (
        notificationResult.status ===
        "fulfilled"
      ) {
        setNotifications(
          notificationResult
            .value
            .notifications
        );


        setStats(
          notificationResult
            .value
            .stats
        );
      } else {
        console.error(
          "NOTIFICATION LOAD ERROR:",
          notificationResult.reason
        );


        setError(
          notificationResult.reason
            instanceof Error
            ? notificationResult
                .reason.message
            : "Gagal mengambil notifikasi."
        );
      }


      // ===============================================
      // PESERTA
      // ===============================================

      if (
        participantResult.status ===
        "fulfilled"
      ) {
        setParticipants(
          participantResult.value
        );
      } else {
        console.error(
          "PARTICIPANT LOAD ERROR:",
          participantResult.reason
        );
      }

    } finally {
      setLoading(
        false
      );

      setRefreshing(
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
        search
          .trim()
          .toLowerCase();


      return notifications.filter(
        (item) => {
          const matchSearch =
            !keyword ||

            item.nama
              .toLowerCase()
              .includes(
                keyword
              ) ||

            item.email
              .toLowerCase()
              .includes(
                keyword
              ) ||

            item.judul
              .toLowerCase()
              .includes(
                keyword
              ) ||

            item.pesan
              .toLowerCase()
              .includes(
                keyword
              ) ||

            item.nomorPeserta
              .toLowerCase()
              .includes(
                keyword
              );


          const matchRead =
            readFilter ===
              "Semua" ||

            (
              readFilter ===
                "Sudah Dibaca" &&
              item.dibaca
            ) ||

            (
              readFilter ===
                "Belum Dibaca" &&
              !item.dibaca
            );


          return (
            matchSearch &&
            matchRead
          );
        }
      );

    }, [
      notifications,
      search,
      readFilter,
    ]);


  // ===================================================
  // OPEN MODAL
  // ===================================================

  function handleOpenForm() {
    resetForm();

    setFormOpen(
      true
    );
  }


  // ===================================================
  // RESET
  // ===================================================

  function resetForm() {
    setMode(
      "peserta"
    );

    setPesertaId(
      ""
    );

    setBulkStatus(
      ""
    );

    setJudul(
      ""
    );

    setPesan(
      ""
    );
  }


  // ===================================================
  // SEND
  // ===================================================

  async function handleSend() {
    try {
      setError(
        ""
      );


      // ===============================================
      // VALIDATION
      // ===============================================

      if (
        !judul.trim()
      ) {
        alert(
          "Judul notifikasi wajib diisi."
        );

        return;
      }


      if (
        !pesan.trim()
      ) {
        alert(
          "Pesan notifikasi wajib diisi."
        );

        return;
      }


      if (
        mode ===
          "peserta" &&
        !pesertaId
      ) {
        alert(
          "Pilih peserta tujuan terlebih dahulu."
        );

        return;
      }


      setSaving(
        true
      );


      // ===============================================
      // PERSONAL
      // ===============================================

      if (
        mode ===
        "peserta"
      ) {
        const result =
          await sendParticipantNotification({
            pesertaId,

            judul:
              judul.trim(),

            pesan:
              pesan.trim(),
          });


        alert(
          result.message
        );
      }


      // ===============================================
      // MASSAL
      // ===============================================

      else {
        const result =
          await sendBulkNotification({
            judul:
              judul.trim(),

            pesan:
              pesan.trim(),

            // "" berarti:
            // diterima + aktif
            status:
              bulkStatus ||
              null,
          });


        alert(
          result.message
        );
      }


      // ===============================================
      // REFRESH
      // ===============================================

      await loadData(
        true
      );


      setFormOpen(
        false
      );


      resetForm();

    } catch (err) {
      console.error(
        "SEND NOTIFICATION ERROR:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengirim notifikasi.";


      setError(
        message
      );


      alert(
        message
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
    notification:
      AdminNotification
  ) {
    const confirmed =
      window.confirm(
        `Hapus notifikasi "${notification.judul}" untuk ${notification.nama}?`
      );


    if (!confirmed) {
      return;
    }


    try {
      setError(
        ""
      );


      const result =
        await deleteAdminNotification(
          notification.id
        );


      console.log(
        "NOTIFICATION DELETED:",
        result
      );


      await loadData(
        true
      );

    } catch (err) {
      console.error(
        "DELETE NOTIFICATION ERROR:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal menghapus notifikasi.";


      setError(
        message
      );


      alert(
        message
      );
    }
  }


  // ===================================================
  // REFRESH
  // ===================================================

  async function handleRefresh() {
    setSearch(
      ""
    );

    setReadFilter(
      "Semua"
    );


    await loadData(
      true
    );
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Notifikasi
          </h1>

          <p className="mt-2 text-gray-500">
            Kirim notifikasi personal
            atau massal kepada peserta
            magang.
          </p>

        </div>


        <div className="flex gap-3">

          <button
            type="button"
            disabled={
              refreshing
            }
            onClick={
              handleRefresh
            }
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
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


          <button
            type="button"
            onClick={
              handleOpenForm
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus
              size={18}
            />

            Kirim Notifikasi
          </button>

        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-600">
          {error}
        </div>
      )}


      {/* =================================================
          STATS
      ================================================= */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

        <StatCard
          title="Total Notifikasi"
          value={
            stats.total
          }
          icon={Bell}
          color="#2563EB"
        />


        <StatCard
          title="Sudah Dibaca"
          value={
            stats.dibaca
          }
          icon={MailOpen}
          color="#22C55E"
        />


        <StatCard
          title="Belum Dibaca"
          value={
            stats.belumDibaca
          }
          icon={Clock3}
          color="#F59E0B"
        />

      </div>


      {/* =================================================
          FILTER
      ================================================= */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="flex flex-col gap-4 md:flex-row">

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
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
              placeholder="Cari nama, email, judul atau pesan..."
              className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-blue-600"
            />

          </div>


          {/* READ FILTER */}

          <select
            value={
              readFilter
            }
            onChange={(
              event
            ) =>
              setReadFilter(
                event.target.value
              )
            }
            className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
          >
            <option>
              Semua
            </option>

            <option>
              Belum Dibaca
            </option>

            <option>
              Sudah Dibaca
            </option>
          </select>

        </div>

      </div>


      {/* =================================================
          HISTORY
      ================================================= */}

      {loading ? (

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

          <p className="text-sm text-gray-500">
            Memuat notifikasi...
          </p>

        </div>

      ) : filtered.length ===
        0 ? (

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

          <Bell
            size={38}
            className="mx-auto text-gray-300"
          />

          <p className="mt-4 font-medium text-gray-700">
            Tidak ada notifikasi
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Belum ada data yang sesuai
            dengan filter.
          </p>

        </div>

      ) : (

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px]">

              <thead className="border-b bg-gray-50">

                <tr className="text-left text-sm text-gray-500">

                  <th className="px-6 py-4 font-medium">
                    Peserta
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Notifikasi
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Status Peserta
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Dibaca
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Waktu
                  </th>

                  <th className="px-6 py-4 text-right font-medium">
                    Aksi
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y">

                {filtered.map(
                  (
                    item
                  ) => (

                    <tr
                      key={
                        item.id
                      }
                      className="align-top transition hover:bg-gray-50"
                    >

                      {/* PESERTA */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">

                            <UserRound
                              size={19}
                            />

                          </div>


                          <div>

                            <p className="font-medium text-gray-900">
                              {item.nama}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500">
                              {item.email}
                            </p>

                            {item.nomorPeserta !==
                              "-" && (
                              <p className="mt-0.5 text-xs text-gray-400">
                                {item.nomorPeserta}
                              </p>
                            )}

                          </div>

                        </div>

                      </td>


                      {/* MESSAGE */}

                      <td className="max-w-[360px] px-6 py-5">

                        <p className="font-medium text-gray-900">
                          {item.judul}
                        </p>

                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-500">
                          {item.pesan}
                        </p>

                      </td>


                      {/* PARTICIPANT STATUS */}

                      <td className="px-6 py-5">

                        <ParticipantStatusBadge
                          status={
                            item.statusPeserta
                          }
                        />

                      </td>


                      {/* READ STATUS */}

                      <td className="px-6 py-5">

                        {item.dibaca ? (

                          <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                            Sudah Dibaca
                          </span>

                        ) : (

                          <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                            Belum Dibaca
                          </span>

                        )}

                      </td>


                      {/* TIME */}

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-500">
                        {formatDateTime(
                          item.createdAt
                        )}
                      </td>


                      {/* ACTION */}

                      <td className="px-6 py-5 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(
                              item
                            )
                          }
                          className="inline-flex rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                          title="Hapus"
                        >
                          <Trash2
                            size={18}
                          />
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* =================================================
          MODAL SEND
      ================================================= */}

      {formOpen && (
        <>

          {/* OVERLAY */}

          <div
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={() => {
              if (saving) {
                return;
              }

              setFormOpen(
                false
              );

              resetForm();
            }}
          />


          {/* MODAL */}

          <div className="fixed left-1/2 top-1/2 z-[70] max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>

                <h2 className="text-xl font-bold">
                  Kirim Notifikasi
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Kirim ke satu peserta
                  atau beberapa peserta
                  sekaligus.
                </p>

              </div>


              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() => {
                  setFormOpen(
                    false
                  );

                  resetForm();
                }}
                className="rounded-lg p-2 transition hover:bg-gray-100 disabled:opacity-50"
              >
                <X
                  size={22}
                />
              </button>

            </div>


            {/* BODY */}

            <div className="space-y-6 p-6">

              {/* MODE */}

              <div>

                <label className="mb-3 block text-sm font-medium">
                  Jenis Pengiriman
                </label>


                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <button
                    type="button"
                    onClick={() =>
                      setMode(
                        "peserta"
                      )
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      mode ===
                      "peserta"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <UserRound
                      size={21}
                      className={
                        mode ===
                        "peserta"
                          ? "text-blue-600"
                          : "text-gray-500"
                      }
                    />

                    <p className="mt-3 font-medium">
                      Satu Peserta
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Kirim ke peserta
                      tertentu.
                    </p>
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      setMode(
                        "massal"
                      )
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      mode ===
                      "massal"
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Users
                      size={21}
                      className={
                        mode ===
                        "massal"
                          ? "text-blue-600"
                          : "text-gray-500"
                      }
                    />

                    <p className="mt-3 font-medium">
                      Massal
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Kirim berdasarkan
                      status peserta.
                    </p>
                  </button>

                </div>

              </div>


              {/* PERSONAL TARGET */}

              {mode ===
                "peserta" && (

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Peserta Tujuan
                  </label>


                  <select
                    value={
                      pesertaId
                    }
                    onChange={(
                      event
                    ) =>
                      setPesertaId(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  >
                    <option value="">
                      Pilih Peserta
                    </option>


                    {participants.map(
                      (
                        participant
                      ) => (

                        <option
                          key={
                            participant.id
                          }
                          value={
                            participant.id
                          }
                        >
                          {participant.nama}
                          {" — "}
                          {formatParticipantStatus(
                            participant.status
                          )}
                        </option>

                      )
                    )}

                  </select>


                  {participants.length ===
                    0 && (
                    <p className="mt-2 text-xs text-amber-600">
                      Belum ada peserta
                      yang tersedia.
                    </p>
                  )}

                </div>

              )}


              {/* MASS TARGET */}

              {mode ===
                "massal" && (

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Target Peserta
                  </label>


                  <select
                    value={
                      bulkStatus
                    }
                    onChange={(
                      event
                    ) =>
                      setBulkStatus(
                        event.target
                          .value as
                          ParticipantStatus
                          | ""
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  >

                    <option value="">
                      Peserta Diterima + Aktif
                    </option>

                    <option value="aktif">
                      Peserta Aktif
                    </option>

                    <option value="diterima">
                      Peserta Diterima
                    </option>

                    <option value="selesai">
                      Peserta Selesai
                    </option>

                    <option value="mengajukan">
                      Peserta Mengajukan
                    </option>

                    <option value="tidak_aktif">
                      Peserta Tidak Aktif
                    </option>

                    <option value="ditolak">
                      Peserta Ditolak
                    </option>

                  </select>


                  <div className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-700">

                    <Megaphone
                      size={17}
                      className="mt-0.5 shrink-0"
                    />

                    <p>
                      Notifikasi massal
                      akan dikirim kepada
                      seluruh peserta yang
                      memenuhi target.
                    </p>

                  </div>

                </div>

              )}


              {/* TITLE */}

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Judul
                </label>


                <input
                  type="text"
                  maxLength={
                    150
                  }
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
                  placeholder="Contoh: Pengingat Jadwal Evaluasi"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                />


                <p className="mt-1 text-right text-xs text-gray-400">
                  {judul.length}/150
                </p>

              </div>


              {/* MESSAGE */}

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Pesan
                </label>


                <textarea
                  rows={6}
                  maxLength={
                    5000
                  }
                  value={
                    pesan
                  }
                  onChange={(
                    event
                  ) =>
                    setPesan(
                      event.target.value
                    )
                  }
                  placeholder="Tuliskan isi notifikasi..."
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                />


                <p className="mt-1 text-right text-xs text-gray-400">
                  {pesan.length}/5000
                </p>

              </div>


              {/* ACTION */}

              <div className="flex justify-end gap-3 border-t pt-5">

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() => {
                    setFormOpen(
                      false
                    );

                    resetForm();
                  }}
                  className="rounded-xl border border-gray-300 px-6 py-3 font-medium transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>


                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    handleSend
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send
                    size={17}
                  />

                  {saving
                    ? "Mengirim..."
                    : mode ===
                      "massal"
                      ? "Kirim Massal"
                      : "Kirim Notifikasi"}
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
// STATUS BADGE
// =====================================================

function ParticipantStatusBadge({
  status,
}: {
  status:
    ParticipantStatus
    | null;
}) {
  if (!status) {
    return (
      <span className="text-sm text-gray-400">
        -
      </span>
    );
  }


  const label =
    formatParticipantStatus(
      status
    );


  switch (status) {
    case "aktif":
      return (
        <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
          {label}
        </span>
      );


    case "diterima":
      return (
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          {label}
        </span>
      );


    case "selesai":
      return (
        <span className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
          {label}
        </span>
      );


    case "ditolak":
      return (
        <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
          {label}
        </span>
      );


    default:
      return (
        <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {label}
        </span>
      );
  }
}


// =====================================================
// STATUS
// =====================================================

function formatParticipantStatus(
  status: string
) {
  switch (status) {
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
      return "Tidak Aktif";

    default:
      return status;
  }
}


// =====================================================
// DATE
// =====================================================

function formatDateTime(
  value: string
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


  return date.toLocaleString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}