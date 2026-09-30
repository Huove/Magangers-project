"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Building2,
  BriefcaseBusiness,
  CheckCircle2,
  CircleOff,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  createMasterDivisi,
  createMasterPosisi,
  deleteMasterDivisi,
  deleteMasterPosisi,
  getMasterDivisions,
  getMasterPositions,
  updateMasterDivisi,
  updateMasterPosisi,
  type MasterDivisi,
  type MasterPosisi,
} from "@/lib/admin/masterDataService";


// =====================================================
// TYPES
// =====================================================

type TabType =
  | "divisi"
  | "posisi";


// =====================================================
// PAGE
// =====================================================

export default function MasterDataPage() {
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<TabType>(
      "divisi"
    );


  const [
    divisi,
    setDivisi,
  ] =
    useState<
      MasterDivisi[]
    >([]);


  const [
    posisi,
    setPosisi,
  ] =
    useState<
      MasterPosisi[]
    >([]);


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
    search,
    setSearch,
  ] =
    useState("");


  const [
    filterDivisi,
    setFilterDivisi,
  ] =
    useState("");


  // ===================================================
  // MODAL DIVISI
  // ===================================================

  const [
    divisiOpen,
    setDivisiOpen,
  ] =
    useState(false);


  const [
    editingDivisi,
    setEditingDivisi,
  ] =
    useState<
      MasterDivisi | null
    >(null);


  const [
    divisiNama,
    setDivisiNama,
  ] =
    useState("");


  const [
    divisiDeskripsi,
    setDivisiDeskripsi,
  ] =
    useState("");


  const [
    divisiAktif,
    setDivisiAktif,
  ] =
    useState(true);


  // ===================================================
  // MODAL POSISI
  // ===================================================

  const [
    posisiOpen,
    setPosisiOpen,
  ] =
    useState(false);


  const [
    editingPosisi,
    setEditingPosisi,
  ] =
    useState<
      MasterPosisi | null
    >(null);


  const [
    posisiDivisiId,
    setPosisiDivisiId,
  ] =
    useState("");


  const [
    posisiNama,
    setPosisiNama,
  ] =
    useState("");


  const [
    posisiDeskripsi,
    setPosisiDeskripsi,
  ] =
    useState("");


  const [
    posisiAktif,
    setPosisiAktif,
  ] =
    useState(true);


  // ===================================================
  // SAVE
  // ===================================================

  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    modalError,
    setModalError,
  ] =
    useState("");


  // ===================================================
  // LOAD
  // ===================================================

  async function loadData(
    refresh = false
  ) {
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


      setError("");


      const [
        divisiData,
        posisiData,
      ] =
        await Promise.all([
          getMasterDivisions(),

          getMasterPositions(),
        ]);


      setDivisi(
        divisiData
      );


      setPosisi(
        posisiData
      );

    } catch (
      error
    ) {
      console.warn(
        "LOAD MASTER DATA:",
        error
      );


      setError(
        error instanceof Error
          ? error.message
          : "Gagal memuat master data."
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


  useEffect(
    () => {
      loadData();
    },
    []
  );


  // ===================================================
  // FILTER DIVISI
  // ===================================================

  const filteredDivisi =
    useMemo(
      () => {
        const keyword =
          search
            .trim()
            .toLowerCase();


        if (
          !keyword
        ) {
          return divisi;
        }


        return divisi.filter(
          (
            item
          ) =>
            item.nama
              .toLowerCase()
              .includes(
                keyword
              ) ||
            (
              item.deskripsi ??
              ""
            )
              .toLowerCase()
              .includes(
                keyword
              )
        );
      },
      [
        divisi,
        search,
      ]
    );


  // ===================================================
  // FILTER POSISI
  // ===================================================

  const filteredPosisi =
    useMemo(
      () => {
        const keyword =
          search
            .trim()
            .toLowerCase();


        return posisi.filter(
          (
            item
          ) => {
            const matchSearch =
              !keyword ||
              item.nama
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              item.divisiNama
                .toLowerCase()
                .includes(
                  keyword
                ) ||
              (
                item.deskripsi ??
                ""
              )
                .toLowerCase()
                .includes(
                  keyword
                );


            const matchDivisi =
              !filterDivisi ||
              item.divisiId ===
                filterDivisi;


            return (
              matchSearch &&
              matchDivisi
            );
          }
        );
      },
      [
        posisi,
        search,
        filterDivisi,
      ]
    );


  // ===================================================
  // STATS
  // ===================================================

  const activeDivisi =
    divisi.filter(
      (
        item
      ) =>
        item.aktif
    ).length;


  const activePosisi =
    posisi.filter(
      (
        item
      ) =>
        item.aktif
    ).length;


  // ===================================================
  // OPEN DIVISI
  // ===================================================

  function openCreateDivisi() {
    setEditingDivisi(
      null
    );


    setDivisiNama("");
    setDivisiDeskripsi("");
    setDivisiAktif(true);
    setModalError("");


    setDivisiOpen(
      true
    );
  }


  function openEditDivisi(
    item:
      MasterDivisi
  ) {
    setEditingDivisi(
      item
    );


    setDivisiNama(
      item.nama
    );


    setDivisiDeskripsi(
      item.deskripsi ??
      ""
    );


    setDivisiAktif(
      item.aktif
    );


    setModalError("");


    setDivisiOpen(
      true
    );
  }


  // ===================================================
  // SAVE DIVISI
  // ===================================================

  async function saveDivisi() {
    const nama =
      divisiNama.trim();


    if (
      !nama
    ) {
      setModalError(
        "Nama divisi wajib diisi."
      );

      return;
    }


    try {
      setSaving(
        true
      );


      setModalError("");


      if (
        editingDivisi
      ) {
        await updateMasterDivisi(
          editingDivisi.id,
          {
            nama,

            deskripsi:
              divisiDeskripsi.trim() ||
              null,

            aktif:
              divisiAktif,
          }
        );

      } else {
        await createMasterDivisi({
          nama,

          deskripsi:
            divisiDeskripsi.trim() ||
            null,

          aktif:
            divisiAktif,
        });
      }


      setDivisiOpen(
        false
      );


      await loadData(
        true
      );

    } catch (
      error
    ) {
      setModalError(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan divisi."
      );

    } finally {
      setSaving(
        false
      );
    }
  }


  // ===================================================
  // DELETE DIVISI
  // ===================================================

  async function handleDeleteDivisi(
    item:
      MasterDivisi
  ) {
    const confirmed =
      window.confirm(
        `Hapus divisi "${item.nama}"?\n\nDivisi yang masih memiliki posisi tidak dapat dihapus.`
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {
      await deleteMasterDivisi(
        item.id
      );


      await loadData(
        true
      );

    } catch (
      error
    ) {
      alert(
        error instanceof Error
          ? error.message
          : "Gagal menghapus divisi."
      );
    }
  }


  // ===================================================
  // OPEN POSISI
  // ===================================================

  function openCreatePosisi() {
    setEditingPosisi(
      null
    );


    setPosisiDivisiId(
      filterDivisi ||
      divisi.find(
        (
          item
        ) =>
          item.aktif
      )?.id ||
      ""
    );


    setPosisiNama("");
    setPosisiDeskripsi("");
    setPosisiAktif(true);
    setModalError("");


    setPosisiOpen(
      true
    );
  }


  function openEditPosisi(
    item:
      MasterPosisi
  ) {
    setEditingPosisi(
      item
    );


    setPosisiDivisiId(
      item.divisiId
    );


    setPosisiNama(
      item.nama
    );


    setPosisiDeskripsi(
      item.deskripsi ??
      ""
    );


    setPosisiAktif(
      item.aktif
    );


    setModalError("");


    setPosisiOpen(
      true
    );
  }


  // ===================================================
  // SAVE POSISI
  // ===================================================

  async function savePosisi() {
    if (
      !posisiDivisiId
    ) {
      setModalError(
        "Divisi wajib dipilih."
      );

      return;
    }


    const nama =
      posisiNama.trim();


    if (
      !nama
    ) {
      setModalError(
        "Nama posisi wajib diisi."
      );

      return;
    }


    try {
      setSaving(
        true
      );


      setModalError("");


      if (
        editingPosisi
      ) {
        await updateMasterPosisi(
          editingPosisi.id,
          {
            divisiId:
              posisiDivisiId,

            nama,

            deskripsi:
              posisiDeskripsi.trim() ||
              null,

            aktif:
              posisiAktif,
          }
        );

      } else {
        await createMasterPosisi({
          divisiId:
            posisiDivisiId,

          nama,

          deskripsi:
            posisiDeskripsi.trim() ||
            null,

          aktif:
            posisiAktif,
        });
      }


      setPosisiOpen(
        false
      );


      await loadData(
        true
      );

    } catch (
      error
    ) {
      setModalError(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan posisi."
      );

    } finally {
      setSaving(
        false
      );
    }
  }


  // ===================================================
  // DELETE POSISI
  // ===================================================

  async function handleDeletePosisi(
    item:
      MasterPosisi
  ) {
    const confirmed =
      window.confirm(
        `Hapus posisi "${item.nama}" dari ${item.divisiNama}?`
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {
      await deleteMasterPosisi(
        item.id
      );


      await loadData(
        true
      );

    } catch (
      error
    ) {
      alert(
        error instanceof Error
          ? error.message
          : "Gagal menghapus posisi."
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
            size={30}
            className="mx-auto animate-spin text-blue-600"
          />


          <p className="mt-3 text-sm text-neutral-500">
            Memuat master data...
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

      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h1 className="text-2xl font-bold text-neutral-900">
            Master Data
          </h1>


          <p className="mt-1 text-sm text-neutral-500">
            Kelola pilihan divisi dan posisi peserta magang.
          </p>

        </div>


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
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>

      </div>


      {/* ERROR */}

      {error && (

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>

      )}


      {/* STAT */}

      <div className="grid gap-4 md:grid-cols-3">

        <StatCard
          icon={
            Building2
          }
          label="Total Divisi"
          value={
            divisi.length
          }
          detail={`${activeDivisi} aktif`}
        />


        <StatCard
          icon={
            BriefcaseBusiness
          }
          label="Total Posisi"
          value={
            posisi.length
          }
          detail={`${activePosisi} aktif`}
        />


        <StatCard
          icon={
            CheckCircle2
          }
          label="Pilihan Aktif"
          value={
            activeDivisi +
            activePosisi
          }
          detail="Siap digunakan penempatan"
        />

      </div>


      {/* TAB */}

      <div className="rounded-2xl border border-neutral-200 bg-white p-2">

        <div className="flex gap-2">

          <button
            type="button"
            onClick={() => {
              setActiveTab(
                "divisi"
              );

              setSearch("");
            }}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeTab ===
              "divisi"
                ? "bg-blue-600 text-white"
                : "text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            Divisi
          </button>


          <button
            type="button"
            onClick={() => {
              setActiveTab(
                "posisi"
              );

              setSearch("");
            }}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              activeTab ===
              "posisi"
                ? "bg-blue-600 text-white"
                : "text-neutral-500 hover:bg-neutral-100"
            }`}
          >
            Posisi
          </button>

        </div>

      </div>


      {/* TOOLBAR */}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex flex-1 flex-col gap-3 sm:flex-row">

          <div className="relative flex-1">

            <Search
              size={17}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />


            <input
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
              placeholder={
                activeTab ===
                "divisi"
                  ? "Cari divisi..."
                  : "Cari posisi..."
              }
              className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />

          </div>


          {activeTab ===
            "posisi" && (

            <select
              value={
                filterDivisi
              }
              onChange={(
                event
              ) =>
                setFilterDivisi(
                  event.target.value
                )
              }
              className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 outline-none"
            >

              <option value="">
                Semua Divisi
              </option>


              {divisi.map(
                (
                  item
                ) => (

                <option
                  key={
                    item.id
                  }
                  value={
                    item.id
                  }
                >
                  {item.nama}
                </option>

                )
              )}

            </select>

          )}

        </div>


        <button
          type="button"
          onClick={
            activeTab ===
            "divisi"
              ? openCreateDivisi
              : openCreatePosisi
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus
            size={17}
          />

          {activeTab ===
          "divisi"
            ? "Tambah Divisi"
            : "Tambah Posisi"}
        </button>

      </div>


      {/* DIVISI */}

      {activeTab ===
        "divisi" && (

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">

          {filteredDivisi.length ===
          0 ? (

            <EmptyState
              text="Belum ada data divisi."
            />

          ) : (

            <div className="divide-y divide-neutral-100">

              {filteredDivisi.map(
                (
                  item
                ) => (

                <div
                  key={
                    item.id
                  }
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div className="flex gap-4">

                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">

                      <Building2
                        size={20}
                      />

                    </div>


                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="font-semibold text-neutral-900">
                          {item.nama}
                        </p>


                        <ActiveBadge
                          active={
                            item.aktif
                          }
                        />

                      </div>


                      <p className="mt-1 text-sm leading-6 text-neutral-500">
                        {item.deskripsi ||
                          "Tidak ada deskripsi."}
                      </p>


                      <p className="mt-2 text-xs text-neutral-400">
                        {
                          posisi.filter(
                            (
                              position
                            ) =>
                              position.divisiId ===
                              item.id
                          ).length
                        }{" "}
                        posisi
                      </p>

                    </div>

                  </div>


                  <div className="flex gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        openEditDivisi(
                          item
                        )
                      }
                      className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Pencil
                        size={16}
                      />
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteDivisi(
                          item
                        )
                      }
                      className="grid h-10 w-10 place-items-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50"
                    >
                      <Trash2
                        size={16}
                      />
                    </button>

                  </div>

                </div>

                )
              )}

            </div>

          )}

        </div>

      )}


      {/* POSISI */}

      {activeTab ===
        "posisi" && (

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">

          {filteredPosisi.length ===
          0 ? (

            <EmptyState
              text="Belum ada data posisi."
            />

          ) : (

            <div className="divide-y divide-neutral-100">

              {filteredPosisi.map(
                (
                  item
                ) => (

                <div
                  key={
                    item.id
                  }
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div className="flex gap-4">

                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600">

                      <BriefcaseBusiness
                        size={20}
                      />

                    </div>


                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="font-semibold text-neutral-900">
                          {item.nama}
                        </p>


                        <ActiveBadge
                          active={
                            item.aktif
                          }
                        />

                      </div>


                      <p className="mt-1 text-sm font-medium text-blue-600">
                        {item.divisiNama}
                      </p>


                      <p className="mt-1 text-sm leading-6 text-neutral-500">
                        {item.deskripsi ||
                          "Tidak ada deskripsi."}
                      </p>

                    </div>

                  </div>


                  <div className="flex gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        openEditPosisi(
                          item
                        )
                      }
                      className="grid h-10 w-10 place-items-center rounded-xl border border-neutral-200 text-neutral-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Pencil
                        size={16}
                      />
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        handleDeletePosisi(
                          item
                        )
                      }
                      className="grid h-10 w-10 place-items-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50"
                    >
                      <Trash2
                        size={16}
                      />
                    </button>

                  </div>

                </div>

                )
              )}

            </div>

          )}

        </div>

      )}


      {/* MODAL DIVISI */}

      {divisiOpen && (

        <Modal>

          <ModalHeader
            title={
              editingDivisi
                ? "Edit Divisi"
                : "Tambah Divisi"
            }
            onClose={() => {
              if (
                !saving
              ) {
                setDivisiOpen(
                  false
                );
              }
            }}
          />


          <div className="space-y-5 p-6">

            {modalError && (

              <ErrorBox
                text={
                  modalError
                }
              />

            )}


            <FormField label="Nama Divisi">

              <input
                value={
                  divisiNama
                }
                onChange={(
                  event
                ) =>
                  setDivisiNama(
                    event.target.value
                  )
                }
                placeholder="Contoh: IT Development"
                className={
                  inputClass
                }
              />

            </FormField>


            <FormField label="Deskripsi">

              <textarea
                rows={4}
                value={
                  divisiDeskripsi
                }
                onChange={(
                  event
                ) =>
                  setDivisiDeskripsi(
                    event.target.value
                  )
                }
                placeholder="Deskripsi divisi..."
                className={`${inputClass} resize-none`}
              />

            </FormField>


            <ActiveCheckbox
              checked={
                divisiAktif
              }
              onChange={
                setDivisiAktif
              }
            />

          </div>


          <ModalFooter
            saving={
              saving
            }
            onCancel={() =>
              setDivisiOpen(
                false
              )
            }
            onSave={
              saveDivisi
            }
          />

        </Modal>

      )}


      {/* MODAL POSISI */}

      {posisiOpen && (

        <Modal>

          <ModalHeader
            title={
              editingPosisi
                ? "Edit Posisi"
                : "Tambah Posisi"
            }
            onClose={() => {
              if (
                !saving
              ) {
                setPosisiOpen(
                  false
                );
              }
            }}
          />


          <div className="space-y-5 p-6">

            {modalError && (

              <ErrorBox
                text={
                  modalError
                }
              />

            )}


            <FormField label="Divisi">

              <select
                value={
                  posisiDivisiId
                }
                onChange={(
                  event
                ) =>
                  setPosisiDivisiId(
                    event.target.value
                  )
                }
                className={
                  inputClass
                }
              >

                <option value="">
                  Pilih divisi
                </option>


                {divisi.map(
                  (
                    item
                  ) => (

                  <option
                    key={
                      item.id
                    }
                    value={
                      item.id
                    }
                  >
                    {item.nama}
                    {!item.aktif
                      ? " (Nonaktif)"
                      : ""}
                  </option>

                  )
                )}

              </select>

            </FormField>


            <FormField label="Nama Posisi">

              <input
                value={
                  posisiNama
                }
                onChange={(
                  event
                ) =>
                  setPosisiNama(
                    event.target.value
                  )
                }
                placeholder="Contoh: Frontend Developer"
                className={
                  inputClass
                }
              />

            </FormField>


            <FormField label="Deskripsi">

              <textarea
                rows={4}
                value={
                  posisiDeskripsi
                }
                onChange={(
                  event
                ) =>
                  setPosisiDeskripsi(
                    event.target.value
                  )
                }
                placeholder="Deskripsi posisi..."
                className={`${inputClass} resize-none`}
              />

            </FormField>


            <ActiveCheckbox
              checked={
                posisiAktif
              }
              onChange={
                setPosisiAktif
              }
            />

          </div>


          <ModalFooter
            saving={
              saving
            }
            onCancel={() =>
              setPosisiOpen(
                false
              )
            }
            onSave={
              savePosisi
            }
          />

        </Modal>

      )}

    </div>
  );
}


// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  icon:
    Icon,
  label,
  value,
  detail,
}: {
  icon:
    typeof Building2;

  label:
    string;

  value:
    number;

  detail:
    string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">

      <div className="flex items-center gap-4">

        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">

          <Icon
            size={20}
          />

        </div>


        <div>

          <p className="text-xs text-neutral-400">
            {label}
          </p>


          <p className="mt-1 text-2xl font-bold text-neutral-900">
            {value}
          </p>


          <p className="mt-1 text-xs text-neutral-400">
            {detail}
          </p>

        </div>

      </div>

    </div>
  );
}


// =====================================================
// ACTIVE BADGE
// =====================================================

function ActiveBadge({
  active,
}: {
  active:
    boolean;
}) {
  return active ? (

    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">

      <CheckCircle2
        size={12}
      />

      Aktif

    </span>

  ) : (

    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-500">

      <CircleOff
        size={12}
      />

      Nonaktif

    </span>
  );
}


// =====================================================
// MODAL
// =====================================================

function Modal({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]" />


      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">

        <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
          {children}
        </div>

      </div>
    </>
  );
}


function ModalHeader({
  title,
  onClose,
}: {
  title:
    string;

  onClose:
    () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">

      <div>

        <h2 className="text-xl font-bold text-neutral-900">
          {title}
        </h2>


        <p className="mt-1 text-sm text-neutral-500">
          Master Data Magang
        </p>

      </div>


      <button
        type="button"
        onClick={
          onClose
        }
        className="grid h-10 w-10 place-items-center rounded-xl text-neutral-400 hover:bg-neutral-100"
      >
        <X
          size={20}
        />
      </button>

    </div>
  );
}


function ModalFooter({
  saving,
  onCancel,
  onSave,
}: {
  saving:
    boolean;

  onCancel:
    () => void;

  onSave:
    () => void;
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-neutral-100 px-6 py-5">

      <button
        type="button"
        disabled={
          saving
        }
        onClick={
          onCancel
        }
        className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-600 disabled:opacity-50"
      >
        Batal
      </button>


      <button
        type="button"
        disabled={
          saving
        }
        onClick={
          onSave
        }
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >

        {saving && (

          <Loader2
            size={15}
            className="animate-spin"
          />

        )}

        {saving
          ? "Menyimpan..."
          : "Simpan"}

      </button>

    </div>
  );
}


// =====================================================
// FORM
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

      <span className="mb-2 block text-sm font-semibold text-neutral-700">
        {label}
      </span>


      {children}

    </label>
  );
}


function ActiveCheckbox({
  checked,
  onChange,
}: {
  checked:
    boolean;

  onChange:
    (
      value:
        boolean
    ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-4">

      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.checked
          )
        }
        className="mt-1 h-4 w-4"
      />


      <div>

        <p className="text-sm font-semibold text-neutral-800">
          Aktif
        </p>


        <p className="mt-1 text-xs leading-5 text-neutral-500">
          Data aktif akan tersedia sebagai pilihan saat penempatan
          dan mutasi peserta.
        </p>

      </div>

    </label>
  );
}


function ErrorBox({
  text,
}: {
  text:
    string;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      {text}
    </div>
  );
}


function EmptyState({
  text,
}: {
  text:
    string;
}) {
  return (
    <div className="py-16 text-center">

      <BriefcaseBusiness
        size={32}
        className="mx-auto text-neutral-300"
      />


      <p className="mt-3 text-sm text-neutral-400">
        {text}
      </p>

    </div>
  );
}


const inputClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50";