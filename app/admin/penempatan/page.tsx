"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import StatCard from "@/components/admin/dashboard/StatisticCard";

import {
  getAdminPlacements,
  saveAdminPlacement,
  type AdminPlacement,
} from "@/lib/admin/penempatanService";

import {
  getAdminSupervisors,
  type AdminSupervisor,
} from "@/lib/admin/pembimbingService";

import {
  Users,
  UserCheck,
  UserRoundX,
  BriefcaseBusiness,
  Search,
  RefreshCw,
  Pencil,
  X,
  UserRound,
  CalendarDays,
  MapPin,
} from "lucide-react";


// =====================================================
// TYPE TAMBAHAN
//
// Tidak mengubah AdminPlacement asli.
// Kalau backend sudah mengirim hasPlacement,
// kita tetap bisa membacanya.
// =====================================================

type AdminPlacementWithFlag =
  AdminPlacement & {
    hasPlacement?: boolean;
  };


// =====================================================
// PAGE
// =====================================================

export default function PenempatanPage() {
  // ===================================================
  // DATA
  // ===================================================

  const [
    placements,
    setPlacements,
  ] =
    useState<
      AdminPlacement[]
    >([]);


  const [
    supervisors,
    setSupervisors,
  ] =
    useState<
      AdminSupervisor[]
    >([]);


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
    saving,
    setSaving,
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
    placementFilter,
    setPlacementFilter,
  ] =
    useState(
      "Semua"
    );


  // ===================================================
  // EDIT
  // ===================================================

  const [
    selected,
    setSelected,
  ] =
    useState<
      AdminPlacement | null
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
    pembimbingId,
    setPembimbingId,
  ] =
    useState(
      ""
    );


  const [
    divisi,
    setDivisi,
  ] =
    useState(
      ""
    );


  const [
    posisi,
    setPosisi,
  ] =
    useState(
      ""
    );


  const [
    tanggalMulai,
    setTanggalMulai,
  ] =
    useState(
      ""
    );


  const [
    tanggalSelesai,
    setTanggalSelesai,
  ] =
    useState(
      ""
    );


  // ===================================================
  // INITIAL
  // ===================================================

  useEffect(() => {
    loadData();
  }, []);


  // ===================================================
  // LOAD
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
        placementResult,
        supervisorResult,
      ] =
        await Promise.allSettled([
          getAdminPlacements(),
          getAdminSupervisors(),
        ]);


      // ===============================================
      // PENEMPATAN
      // ===============================================

      if (
        placementResult.status ===
        "fulfilled"
      ) {
        setPlacements(
          placementResult.value
        );


        setSelected(
          (
            current
          ) => {
            if (!current) {
              return null;
            }


            return (
              placementResult.value.find(
                (
                  item
                ) =>
                  item.pesertaId ===
                  current.pesertaId
              ) ??
              current
            );
          }
        );

      } else {
        console.error(
          "PLACEMENT LOAD ERROR:",
          placementResult.reason
        );


        throw placementResult.reason;
      }


      // ===============================================
      // PEMBIMBING
      // ===============================================

      if (
        supervisorResult.status ===
        "fulfilled"
      ) {
        setSupervisors(
          supervisorResult.value
        );
      } else {
        console.error(
          "SUPERVISOR LOAD ERROR:",
          supervisorResult.reason
        );
      }

    } catch (
      err
    ) {
      console.error(
        "LOAD PENEMPATAN ERROR:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data penempatan."
      );

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
    useMemo(
      () => {
        const keyword =
          search
            .trim()
            .toLowerCase();


        return placements.filter(
          (
            item
          ) => {
            // ===========================================
            // SEARCH
            // ===========================================

            const matchSearch =
              !keyword ||

              item.peserta
                .toLowerCase()
                .includes(
                  keyword
                ) ||

              item.nomorPeserta
                .toLowerCase()
                .includes(
                  keyword
                ) ||

              item.pembimbing
                .toLowerCase()
                .includes(
                  keyword
                ) ||

              item.divisi
                .toLowerCase()
                .includes(
                  keyword
                ) ||

              item.posisi
                .toLowerCase()
                .includes(
                  keyword
                );


            // ===========================================
            // PLACEMENT
            // ===========================================

            const placed =
              isPlaced(
                item
              );


            let matchPlacement =
              true;


            if (
              placementFilter ===
              "Sudah Ditempatkan"
            ) {
              matchPlacement =
                placed;
            }


            if (
              placementFilter ===
              "Belum Ditempatkan"
            ) {
              matchPlacement =
                !placed;
            }


            if (
              placementFilter ===
              "Tanpa Pembimbing"
            ) {
              matchPlacement =
                placed &&
                !item.pembimbingId;
            }


            return (
              matchSearch &&
              matchPlacement
            );
          }
        );
      },
      [
        placements,
        search,
        placementFilter,
      ]
    );


  // ===================================================
  // OPEN EDIT
  // ===================================================

  function handleEdit(
    placement:
      AdminPlacement
  ) {
    setSelected(
      placement
    );


    setPembimbingId(
      placement
        .pembimbingId ??
      ""
    );


    setDivisi(
      cleanDisplayValue(
        placement.divisi
      )
    );


    setPosisi(
      cleanDisplayValue(
        placement.posisi
      )
    );


    setTanggalMulai(
      placement
        .tanggalMulai ??
      ""
    );


    setTanggalSelesai(
      placement
        .tanggalSelesai ??
      ""
    );


    setModalOpen(
      true
    );
  }


  // ===================================================
  // CLOSE
  // ===================================================

  function closeModal() {
    if (
      saving
    ) {
      return;
    }


    setModalOpen(
      false
    );


    setSelected(
      null
    );


    resetForm();
  }


  // ===================================================
  // RESET
  // ===================================================

  function resetForm() {
    setPembimbingId(
      ""
    );


    setDivisi(
      ""
    );


    setPosisi(
      ""
    );


    setTanggalMulai(
      ""
    );


    setTanggalSelesai(
      ""
    );
  }


  // ===================================================
  // SAVE
  // ===================================================

  async function handleSave() {
    if (
      !selected
    ) {
      return;
    }


    // ===============================================
    // VALIDATION
    // ===============================================

    if (
      !tanggalMulai
    ) {
      alert(
        "Tanggal mulai wajib diisi."
      );

      return;
    }


    if (
      tanggalSelesai &&
      tanggalSelesai <
        tanggalMulai
    ) {
      alert(
        "Tanggal selesai tidak boleh sebelum tanggal mulai."
      );

      return;
    }


    try {
      setSaving(
        true
      );


      setError(
        ""
      );


      // ===============================================
      // SERVICE
      // ===============================================

      const result =
        await saveAdminPlacement(
          selected.pesertaId,
          {
            pembimbingId:
              pembimbingId ||
              null,

            divisi:
              cleanNullable(
                divisi
              ),

            posisi:
              cleanNullable(
                posisi
              ),

            tanggalMulai,

            tanggalSelesai:
              tanggalSelesai ||
              null,
          }
        );


      console.log(
        "PLACEMENT SAVED:",
        result
      );


      // ===============================================
      // REFRESH
      // ===============================================

      await loadData(
        true
      );


      setModalOpen(
        false
      );


      setSelected(
        null
      );


      resetForm();

    } catch (
      err
    ) {
      console.error(
        "SAVE PLACEMENT ERROR:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal menyimpan penempatan.";


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
  // SUPERVISOR CHANGE
  // ===================================================

  function handleSupervisorChange(
    id:
      string
  ) {
    setPembimbingId(
      id
    );


    if (!id) {
      return;
    }


    const supervisor =
      supervisors.find(
        (
          item
        ) =>
          item.id ===
          id
      );


    // ===============================================
    // Jika divisi masih kosong,
    // otomatis isi dari pembimbing.
    // ===============================================

    if (
      supervisor &&
      !divisi.trim()
    ) {
      setDivisi(
        cleanDisplayValue(
          supervisor.divisi
        )
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


    setPlacementFilter(
      "Semua"
    );


    await loadData(
      true
    );
  }


  // ===================================================
  // STATS
  // ===================================================

  const total =
    placements.length;


  const placed =
    placements.filter(
      (
        item
      ) =>
        isPlaced(
          item
        )
    ).length;


  const notPlaced =
    placements.filter(
      (
        item
      ) =>
        !isPlaced(
          item
        )
    ).length;


  const withoutSupervisor =
    placements.filter(
      (
        item
      ) =>
        isPlaced(
          item
        ) &&
        !item.pembimbingId
    ).length;


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
            Penempatan Peserta
          </h1>


          <p className="mt-2 text-gray-500">
            Kelola pembimbing, divisi, posisi, dan periode magang peserta.
          </p>

        </div>


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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total Peserta"
          value={
            total
          }
          icon={
            Users
          }
          color="#2563EB"
        />


        <StatCard
          title="Sudah Ditempatkan"
          value={
            placed
          }
          icon={
            BriefcaseBusiness
          }
          color="#22C55E"
        />


        <StatCard
          title="Belum Ditempatkan"
          value={
            notPlaced
          }
          icon={
            UserRoundX
          }
          color="#F59E0B"
        />


        <StatCard
          title="Tanpa Pembimbing"
          value={
            withoutSupervisor
          }
          icon={
            UserCheck
          }
          color="#EF4444"
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
              placeholder="Cari peserta, pembimbing, posisi, divisi..."
              className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-blue-600"
            />

          </div>


          {/* FILTER */}

          <select
            value={
              placementFilter
            }
            onChange={(
              event
            ) =>
              setPlacementFilter(
                event.target.value
              )
            }
            className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
          >

            <option>
              Semua
            </option>


            <option>
              Sudah Ditempatkan
            </option>


            <option>
              Belum Ditempatkan
            </option>


            <option>
              Tanpa Pembimbing
            </option>

          </select>

        </div>

      </div>


      {/* =================================================
          TABLE
      ================================================= */}

      {loading ? (

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

          <p className="text-sm text-gray-500">
            Memuat penempatan...
          </p>

        </div>

      ) : filtered.length ===
        0 ? (

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

          <BriefcaseBusiness
            size={40}
            className="mx-auto text-gray-300"
          />


          <p className="mt-4 font-medium text-gray-700">
            Data tidak ditemukan
          </p>


          <p className="mt-1 text-sm text-gray-500">
            Tidak ada peserta yang sesuai pencarian atau filter.
          </p>

        </div>

      ) : (

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1150px]">

              <thead className="border-b bg-gray-50">

                <tr className="text-left text-sm text-gray-500">

                  <th className="px-6 py-4 font-medium">
                    Peserta
                  </th>


                  <th className="px-6 py-4 font-medium">
                    Status
                  </th>


                  <th className="px-6 py-4 font-medium">
                    Pembimbing
                  </th>


                  <th className="px-6 py-4 font-medium">
                    Divisi
                  </th>


                  <th className="px-6 py-4 font-medium">
                    Posisi
                  </th>


                  <th className="px-6 py-4 font-medium">
                    Periode
                  </th>


                  <th className="px-6 py-4 font-medium">
                    Penempatan
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
                  ) => {
                    const placed =
                      isPlaced(
                        item
                      );


                    return (
                      <tr
                        key={
                          item.pesertaId
                        }
                        className="transition hover:bg-gray-50"
                      >

                        {/* =============================
                            PESERTA
                        ============================= */}

                        <td className="px-6 py-5">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">

                              <UserRound
                                size={18}
                              />

                            </div>


                            <div>

                              <p className="font-medium text-gray-900">
                                {item.peserta}
                              </p>


                              <p className="mt-0.5 text-xs text-gray-400">
                                {item.nomorPeserta}
                              </p>

                            </div>

                          </div>

                        </td>


                        {/* =============================
                            STATUS
                        ============================= */}

                        <td className="px-6 py-5">

                          <ParticipantStatusBadge
                            status={
                              item.statusPeserta
                            }
                          />

                        </td>


                        {/* =============================
                            PEMBIMBING
                        ============================= */}

                        <td className="px-6 py-5 text-sm text-gray-600">

                          {item.pembimbingId ? (

                            <span className="font-medium text-gray-700">
                              {item.pembimbing}
                            </span>

                          ) : (

                            <span className="text-amber-600">
                              Belum ada
                            </span>

                          )}

                        </td>


                        {/* =============================
                            DIVISI
                        ============================= */}

                        <td className="px-6 py-5 text-sm text-gray-600">
                          {item.divisi}
                        </td>


                        {/* =============================
                            POSISI
                        ============================= */}

                        <td className="px-6 py-5 text-sm text-gray-600">
                          {item.posisi}
                        </td>


                        {/* =============================
                            PERIODE
                        ============================= */}

                        <td className="px-6 py-5">

                          {item.tanggalMulai ? (

                            <div className="flex items-start gap-2">

                              <CalendarDays
                                size={16}
                                className="mt-0.5 shrink-0 text-gray-400"
                              />


                              <p className="text-xs leading-5 text-gray-500">

                                {formatDate(
                                  item.tanggalMulai
                                )}

                                <br />

                                sampai{" "}

                                {item.tanggalSelesai
                                  ? formatDate(
                                      item.tanggalSelesai
                                    )
                                  : "Belum ditentukan"}

                              </p>

                            </div>

                          ) : (

                            <span className="text-sm text-amber-600">
                              Belum diatur
                            </span>

                          )}

                        </td>


                        {/* =============================
                            PENEMPATAN STATUS
                        ============================= */}

                        <td className="px-6 py-5">

                          {placed ? (

                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                              Ditempatkan
                            </span>

                          ) : (

                            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                              Belum Ditempatkan
                            </span>

                          )}

                        </td>


                        {/* =============================
                            ACTION
                        ============================= */}

                        <td className="px-6 py-5 text-right">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                item
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                          >

                            <Pencil
                              size={16}
                            />


                            {placed
                              ? "Edit"
                              : "Tempatkan"}

                          </button>

                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* =================================================
          MODAL
      ================================================= */}

      {modalOpen &&
        selected && (

        <>

          {/* OVERLAY */}

          <div
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={
              closeModal
            }
          />


          {/* MODAL */}

          <div className="fixed left-1/2 top-1/2 z-[70] max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* =========================================
                HEADER
            ========================================= */}

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>

                <h2 className="text-xl font-bold">

                  {isPlaced(
                    selected
                  )
                    ? "Edit Penempatan"
                    : "Tempatkan Peserta"}

                </h2>


                <p className="mt-1 text-sm text-gray-500">

                  {selected.peserta}

                  {" • "}

                  {selected.nomorPeserta}

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
                className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
              >

                <X
                  size={22}
                />

              </button>

            </div>


            {/* =========================================
                BODY
            ========================================= */}

            <div className="space-y-5 p-6">

              {/* =======================================
                  PESERTA
              ======================================= */}

              <div className="flex items-center gap-4 rounded-xl bg-blue-50 p-4">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue-600">

                  <UserRound
                    size={20}
                  />

                </div>


                <div>

                  <p className="font-semibold text-gray-900">
                    {selected.peserta}
                  </p>


                  <p className="mt-1 text-xs text-gray-500">

                    {formatParticipantStatus(
                      selected.statusPeserta
                    )}

                  </p>

                </div>

              </div>


              {/* =======================================
                  PEMBIMBING
              ======================================= */}

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Pembimbing
                </label>


                <select
                  value={
                    pembimbingId
                  }
                  onChange={(
                    event
                  ) =>
                    handleSupervisorChange(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                >

                  <option value="">
                    Belum Ada Pembimbing
                  </option>


                  {supervisors.map(
                    (
                      supervisor
                    ) => (

                    <option
                      key={
                        supervisor.id
                      }
                      value={
                        supervisor.id
                      }
                    >

                      {supervisor.nama}

                      {" — "}

                      {supervisor.divisi}

                    </option>

                    )
                  )}

                </select>

              </div>


              {/* =======================================
                  DIVISI + POSISI
              ======================================= */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Divisi
                  </label>


                  <input
                    type="text"
                    value={
                      divisi
                    }
                    onChange={(
                      event
                    ) =>
                      setDivisi(
                        event.target.value
                      )
                    }
                    placeholder="IT Development"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Posisi
                  </label>


                  <input
                    type="text"
                    value={
                      posisi
                    }
                    onChange={(
                      event
                    ) =>
                      setPosisi(
                        event.target.value
                      )
                    }
                    placeholder="Software Engineer"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  />

                </div>

              </div>


              {/* =======================================
                  PERIODE
              ======================================= */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Tanggal Mulai
                  </label>


                  <input
                    type="date"
                    value={
                      tanggalMulai
                    }
                    onChange={(
                      event
                    ) =>
                      setTanggalMulai(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  />

                </div>


                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Tanggal Selesai
                  </label>


                  <input
                    type="date"
                    value={
                      tanggalSelesai
                    }
                    min={
                      tanggalMulai ||
                      undefined
                    }
                    onChange={(
                      event
                    ) =>
                      setTanggalSelesai(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  />

                </div>

              </div>


              {/* =======================================
                  INFORMATION
              ======================================= */}

              <div className="flex gap-3 rounded-xl bg-gray-50 p-4">

                <MapPin
                  size={18}
                  className="mt-0.5 shrink-0 text-gray-400"
                />


                <p className="text-xs leading-5 text-gray-500">

                  Menyimpan penempatan juga akan menyinkronkan periode magang peserta.

                  Peserta akan menerima notifikasi perubahan penempatan.

                </p>

              </div>


              {/* =======================================
                  ACTION
              ======================================= */}

              <div className="flex justify-end gap-3 border-t pt-5">

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={
                    closeModal
                  }
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
                    handleSave
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {saving
                    ? "Menyimpan..."
                    : isPlaced(
                        selected
                      )
                      ? "Simpan Perubahan"
                      : "Simpan Penempatan"}

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
// CEK APAKAH PESERTA SUDAH PUNYA PENEMPATAN
// =====================================================

function isPlaced(
  item:
    AdminPlacement
) {
  // ===================================================
  // Kalau API sebenarnya sudah mengirim hasPlacement,
  // gunakan nilai itu.
  //
  // Type service lama mungkin belum mendeklarasikannya,
  // jadi kita baca menggunakan extended type.
  // ===================================================

  const itemWithFlag =
    item as
      AdminPlacementWithFlag;


  if (
    typeof itemWithFlag.hasPlacement ===
    "boolean"
  ) {
    return itemWithFlag.hasPlacement;
  }


  // ===================================================
  // FALLBACK
  //
  // Jika API belum mengirim hasPlacement,
  // anggap sudah ditempatkan jika ada salah satu
  // informasi penempatan.
  // ===================================================

  return Boolean(
    item.pembimbingId ||
    cleanDisplayValue(
      item.divisi
    ) ||
    cleanDisplayValue(
      item.posisi
    ) ||
    item.tanggalMulai ||
    item.tanggalSelesai
  );
}


// =====================================================
// PARTICIPANT BADGE
// =====================================================

function ParticipantStatusBadge({
  status,
}: {
  status:
    string;
}) {
  const label =
    formatParticipantStatus(
      status
    );


  if (
    status ===
    "aktif"
  ) {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        {label}
      </span>
    );
  }


  if (
    status ===
    "diterima"
  ) {
    return (
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
        {label}
      </span>
    );
  }


  if (
    status ===
    "selesai"
  ) {
    return (
      <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
        {label}
      </span>
    );
  }


  return (
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
      {label}
    </span>
  );
}


// =====================================================
// STATUS
// =====================================================

function formatParticipantStatus(
  status:
    string
) {
  switch (
    status
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
      return "Tidak Aktif";


    default:
      return status;
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


// =====================================================
// CLEAN DISPLAY VALUE
// =====================================================

function cleanDisplayValue(
  value:
    string
) {
  if (
    !value ||
    value ===
      "-"
  ) {
    return "";
  }


  return value;
}


// =====================================================
// CLEAN NULLABLE
// =====================================================

function cleanNullable(
  value:
    string
) {
  const result =
    value.trim();


  return result ||
    null;
}