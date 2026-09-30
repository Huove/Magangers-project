"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import StatCard from "@/components/admin/dashboard/StatisticCard";

import {
  getAdminSupervisors,
  updateAdminSupervisor,
  type AdminSupervisor,
  type SupervisorParticipant,
} from "@/lib/admin/pembimbingService";

import {
  Users,
  UserCheck,
  BriefcaseBusiness,
  UserRoundX,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  X,
  UserRound,
  Mail,
  Phone,
  BadgeCheck,
  CalendarDays,
} from "lucide-react";


// =====================================================
// PAGE
// =====================================================

export default function PembimbingPage() {
  // ===================================================
  // DATA
  // ===================================================

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
  // SEARCH
  // ===================================================

  const [
    search,
    setSearch,
  ] =
    useState("");


  // ===================================================
  // DETAIL
  // ===================================================

  const [
    selected,
    setSelected,
  ] =
    useState<
      AdminSupervisor
      | null
    >(null);


  const [
    drawerOpen,
    setDrawerOpen,
  ] =
    useState(false);


  // ===================================================
  // EDIT
  // ===================================================

  const [
    editOpen,
    setEditOpen,
  ] =
    useState(false);


  const [
    editId,
    setEditId,
  ] =
    useState<
      string | null
    >(null);


  const [
    nama,
    setNama,
  ] =
    useState("");


  const [
    nip,
    setNip,
  ] =
    useState("");


  const [
    divisi,
    setDivisi,
  ] =
    useState("");


  const [
    nomorHp,
    setNomorHp,
  ] =
    useState("");


  // ===================================================
  // INITIAL
  // ===================================================

  useEffect(() => {
    loadSupervisors();
  }, []);


  // ===================================================
  // LOAD
  // ===================================================

  async function loadSupervisors(
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


      const data =
        await getAdminSupervisors();


      setSupervisors(
        data
      );


      // ===============================================
      // REFRESH DETAIL JIKA DRAWER TERBUKA
      // ===============================================

      setSelected(
        (
          current
        ) => {
          if (!current) {
            return null;
          }


          return (
            data.find(
              (
                item
              ) =>
                item.id ===
                current.id
            ) ??
            current
          );
        }
      );

    } catch (err) {
      console.error(
        "LOAD SUPERVISORS ERROR:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data pembimbing."
      );


      setSupervisors(
        []
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
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();


      if (!keyword) {
        return supervisors;
      }


      return supervisors.filter(
        (
          item
        ) =>
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

          item.nip
            .toLowerCase()
            .includes(
              keyword
            ) ||

          item.divisi
            .toLowerCase()
            .includes(
              keyword
            ) ||

          item.nomorHp
            .toLowerCase()
            .includes(
              keyword
            )
      );

    }, [
      supervisors,
      search,
    ]);


  // ===================================================
  // DETAIL
  // ===================================================

  function handleDetail(
    supervisor:
      AdminSupervisor
  ) {
    setSelected(
      supervisor
    );


    setDrawerOpen(
      true
    );
  }


  // ===================================================
  // OPEN EDIT
  // ===================================================

  function handleEdit(
    supervisor:
      AdminSupervisor
  ) {
    setEditId(
      supervisor.id
    );


    setNama(
      cleanDisplayValue(
        supervisor.nama
      )
    );


    setNip(
      cleanDisplayValue(
        supervisor.nip
      )
    );


    setDivisi(
      cleanDisplayValue(
        supervisor.divisi
      )
    );


    setNomorHp(
      cleanDisplayValue(
        supervisor.nomorHp
      )
    );


    setDrawerOpen(
      false
    );


    setEditOpen(
      true
    );
  }


  // ===================================================
  // RESET EDIT
  // ===================================================

  function resetEdit() {
    setEditId(
      null
    );


    setNama(
      ""
    );


    setNip(
      ""
    );


    setDivisi(
      ""
    );


    setNomorHp(
      ""
    );
  }


  // ===================================================
  // SAVE
  // ===================================================

  async function handleSave() {
    if (!editId) {
      return;
    }


    if (
      !nama.trim()
    ) {
      alert(
        "Nama pembimbing wajib diisi."
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


      const result =
        await updateAdminSupervisor(
          editId,
          {
            nama:
              nama.trim(),

            nip:
              cleanNullable(
                nip
              ),

            divisi:
              cleanNullable(
                divisi
              ),

            nomorHp:
              cleanNullable(
                nomorHp
              ),
          }
        );


      console.log(
        "SUPERVISOR UPDATED:",
        result
      );


      await loadSupervisors(
        true
      );


      setEditOpen(
        false
      );


      resetEdit();

    } catch (err) {
      console.error(
        "UPDATE SUPERVISOR ERROR:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal memperbarui pembimbing.";


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
  // REFRESH
  // ===================================================

  async function handleRefresh() {
    setSearch(
      ""
    );


    await loadSupervisors(
      true
    );
  }


  // ===================================================
  // STATS
  // ===================================================

  const totalSupervisor =
    supervisors.length;


  const totalParticipants =
    supervisors.reduce(
      (
        total,
        item
      ) =>
        total +
        item.totalPeserta,
      0
    );


  const activeParticipants =
    supervisors.reduce(
      (
        total,
        item
      ) =>
        total +
        item.pesertaAktif,
      0
    );


  const withoutParticipants =
    supervisors.filter(
      (
        item
      ) =>
        item.totalPeserta ===
        0
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
            Pembimbing
          </h1>

          <p className="mt-2 text-gray-500">
            Kelola pembimbing dan
            pantau peserta magang
            yang berada di bawah
            bimbingannya.
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
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
          title="Total Pembimbing"
          value={
            totalSupervisor
          }
          icon={
            Users
          }
          color="#2563EB"
        />


        <StatCard
          title="Peserta Dibimbing"
          value={
            totalParticipants
          }
          icon={
            BriefcaseBusiness
          }
          color="#7C3AED"
        />


        <StatCard
          title="Peserta Aktif"
          value={
            activeParticipants
          }
          icon={
            UserCheck
          }
          color="#22C55E"
        />


        <StatCard
          title="Tanpa Peserta"
          value={
            withoutParticipants
          }
          icon={
            UserRoundX
          }
          color="#F59E0B"
        />

      </div>


      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="relative">

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
            placeholder="Cari nama, email, NIP, divisi..."
            className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none transition focus:border-blue-600"
          />

        </div>

      </div>


      {/* =================================================
          TABLE
      ================================================= */}

      {loading ? (

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

          <p className="text-sm text-gray-500">
            Memuat pembimbing...
          </p>

        </div>

      ) : filtered.length ===
        0 ? (

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

          <Users
            size={40}
            className="mx-auto text-gray-300"
          />

          <p className="mt-4 font-medium text-gray-700">
            Pembimbing tidak ditemukan
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Belum ada data atau
            tidak cocok dengan pencarian.
          </p>

        </div>

      ) : (

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px]">

              <thead className="border-b bg-gray-50">

                <tr className="text-left text-sm text-gray-500">

                  <th className="px-6 py-4 font-medium">
                    Pembimbing
                  </th>

                  <th className="px-6 py-4 font-medium">
                    NIP
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Divisi
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Peserta
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Aktif
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Kontak
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
                      className="transition hover:bg-gray-50"
                    >

                      {/* PEMBIMBING */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-blue-600">

                            {item.fotoUrl ? (

                              <img
                                src={
                                  item.fotoUrl
                                }
                                alt={
                                  item.nama
                                }
                                className="h-full w-full object-cover"
                              />

                            ) : (

                              <UserRound
                                size={19}
                              />

                            )}

                          </div>


                          <div>

                            <p className="font-medium text-gray-900">
                              {item.nama}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500">
                              {item.email}
                            </p>

                          </div>

                        </div>

                      </td>


                      {/* NIP */}

                      <td className="px-6 py-5 text-sm text-gray-600">
                        {item.nip}
                      </td>


                      {/* DIVISI */}

                      <td className="px-6 py-5">

                        <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                          {item.divisi}
                        </span>

                      </td>


                      {/* TOTAL */}

                      <td className="px-6 py-5">

                        <span className="font-semibold text-gray-800">
                          {item.totalPeserta}
                        </span>

                        <span className="ml-1 text-sm text-gray-400">
                          peserta
                        </span>

                      </td>


                      {/* ACTIVE */}

                      <td className="px-6 py-5">

                        <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                          {item.pesertaAktif} aktif
                        </span>

                      </td>


                      {/* CONTACT */}

                      <td className="px-6 py-5">

                        <p className="text-sm text-gray-600">
                          {item.nomorHp}
                        </p>

                      </td>


                      {/* ACTION */}

                      <td className="px-6 py-5">

                        <div className="flex justify-end gap-1">

                          <button
                            type="button"
                            title="Detail"
                            onClick={() =>
                              handleDetail(
                                item
                              )
                            }
                            className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                          >
                            <Eye
                              size={18}
                            />
                          </button>


                          <button
                            type="button"
                            title="Edit"
                            onClick={() =>
                              handleEdit(
                                item
                              )
                            }
                            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
                          >
                            <Pencil
                              size={18}
                            />
                          </button>

                        </div>

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
          DETAIL DRAWER
      ================================================= */}

      {drawerOpen &&
        selected && (
        <>

          {/* OVERLAY */}

          <div
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={() => {
              setDrawerOpen(
                false
              );

              setSelected(
                null
              );
            }}
          />


          {/* DRAWER */}

          <div className="fixed right-0 top-0 z-[70] h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">

              <div>

                <h2 className="text-xl font-bold">
                  Detail Pembimbing
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Informasi dan peserta
                  bimbingan.
                </p>

              </div>


              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(
                    false
                  );

                  setSelected(
                    null
                  );
                }}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X
                  size={22}
                />
              </button>

            </div>


            {/* BODY */}

            <div className="space-y-7 p-6">

              {/* PROFILE */}

              <div className="rounded-2xl border border-gray-200 p-5">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-blue-600">

                    {selected.fotoUrl ? (

                      <img
                        src={
                          selected.fotoUrl
                        }
                        alt={
                          selected.nama
                        }
                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <UserRound
                        size={25}
                      />

                    )}

                  </div>


                  <div>

                    <h3 className="font-semibold text-gray-900">
                      {selected.nama}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {selected.divisi}
                    </p>

                  </div>

                </div>


                <div className="mt-5 space-y-3">

                  <InfoRow
                    icon={BadgeCheck}
                    label="NIP"
                    value={
                      selected.nip
                    }
                  />

                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={
                      selected.email
                    }
                  />

                  <InfoRow
                    icon={Phone}
                    label="Nomor HP"
                    value={
                      selected.nomorHp
                    }
                  />

                  <InfoRow
                    icon={BriefcaseBusiness}
                    label="Divisi"
                    value={
                      selected.divisi
                    }
                  />

                </div>


                <button
                  type="button"
                  onClick={() =>
                    handleEdit(
                      selected
                    )
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  <Pencil
                    size={16}
                  />

                  Edit Pembimbing
                </button>

              </div>


              {/* SUMMARY */}

              <div className="grid grid-cols-2 gap-4">

                <div className="rounded-xl bg-blue-50 p-4">

                  <p className="text-sm text-blue-600">
                    Total Peserta
                  </p>

                  <p className="mt-2 text-2xl font-bold text-blue-700">
                    {selected.totalPeserta}
                  </p>

                </div>


                <div className="rounded-xl bg-green-50 p-4">

                  <p className="text-sm text-green-600">
                    Peserta Aktif
                  </p>

                  <p className="mt-2 text-2xl font-bold text-green-700">
                    {selected.pesertaAktif}
                  </p>

                </div>

              </div>


              {/* PARTICIPANTS */}

              <div>

                <h3 className="font-semibold text-gray-900">
                  Peserta Bimbingan
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Penempatan terbaru
                  setiap peserta.
                </p>


                {selected
                  .participants
                  .length ===
                0 ? (

                  <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-8 text-center">

                    <Users
                      size={30}
                      className="mx-auto text-gray-300"
                    />

                    <p className="mt-3 text-sm text-gray-500">
                      Belum memiliki
                      peserta bimbingan.
                    </p>

                  </div>

                ) : (

                  <div className="mt-4 space-y-3">

                    {selected
                      .participants
                      .map(
                        (
                          participant
                        ) => (

                          <ParticipantCard
                            key={
                              participant
                                .pesertaId
                            }
                            participant={
                              participant
                            }
                          />

                        )
                      )}

                  </div>

                )}

              </div>

            </div>

          </div>

        </>
      )}


      {/* =================================================
          EDIT MODAL
      ================================================= */}

      {editOpen && (
        <>

          <div
            className="fixed inset-0 z-[80] bg-black/40"
            onClick={() => {
              if (saving) {
                return;
              }


              setEditOpen(
                false
              );


              resetEdit();
            }}
          />


          <div className="fixed left-1/2 top-1/2 z-[90] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>

                <h2 className="text-xl font-bold">
                  Edit Pembimbing
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Perbarui informasi
                  pembimbing.
                </p>

              </div>


              <button
                type="button"
                disabled={
                  saving
                }
                onClick={() => {
                  setEditOpen(
                    false
                  );


                  resetEdit();
                }}
                className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
              >
                <X
                  size={22}
                />
              </button>

            </div>


            {/* FORM */}

            <div className="space-y-5 p-6">

              {/* NAMA */}

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Nama Lengkap
                </label>

                <input
                  type="text"
                  value={
                    nama
                  }
                  onChange={(
                    event
                  ) =>
                    setNama(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                />

              </div>


              {/* NIP */}

              <div>

                <label className="mb-2 block text-sm font-medium">
                  NIP
                </label>

                <input
                  type="text"
                  value={
                    nip
                  }
                  onChange={(
                    event
                  ) =>
                    setNip(
                      event.target.value
                    )
                  }
                  placeholder="Masukkan NIP"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                />

              </div>


              {/* DIVISI */}

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
                  placeholder="Contoh: IT Development"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                />

              </div>


              {/* PHONE */}

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Nomor HP
                </label>

                <input
                  type="text"
                  value={
                    nomorHp
                  }
                  onChange={(
                    event
                  ) =>
                    setNomorHp(
                      event.target.value
                    )
                  }
                  placeholder="08xxxxxxxxxx"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                />

              </div>


              {/* ACTION */}

              <div className="flex justify-end gap-3 border-t pt-5">

                <button
                  type="button"
                  disabled={
                    saving
                  }
                  onClick={() => {
                    setEditOpen(
                      false
                    );


                    resetEdit();
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
                    handleSave
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : "Simpan Perubahan"}
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
// PARTICIPANT CARD
// =====================================================

function ParticipantCard({
  participant,
}: {
  participant:
    SupervisorParticipant;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="font-medium text-gray-900">
            {participant.nama}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {participant.nomorPeserta}
          </p>

        </div>


        <StatusBadge
          status={
            participant.status
          }
        />

      </div>


      <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">

        <div>

          <p className="text-xs text-gray-400">
            Posisi
          </p>

          <p className="mt-1 font-medium text-gray-700">
            {participant.posisi}
          </p>

        </div>


        <div>

          <p className="text-xs text-gray-400">
            Divisi
          </p>

          <p className="mt-1 font-medium text-gray-700">
            {participant.divisi}
          </p>

        </div>

      </div>


      <div className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 p-3">

        <CalendarDays
          size={16}
          className="mt-0.5 shrink-0 text-gray-400"
        />

        <p className="text-xs leading-5 text-gray-500">
          {formatDate(
            participant.tanggalMulai
          )}
          {" — "}
          {participant.tanggalSelesai
            ? formatDate(
                participant.tanggalSelesai
              )
            : "Belum ditentukan"}
        </p>

      </div>

    </div>
  );
}


// =====================================================
// INFO ROW
// =====================================================

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon:
    React.ComponentType<{
      size?: number;
      className?: string;
    }>;

  label:
    string;

  value:
    string;
}) {
  return (
    <div className="flex items-start gap-3">

      <Icon
        size={17}
        className="mt-0.5 shrink-0 text-gray-400"
      />

      <div>

        <p className="text-xs text-gray-400">
          {label}
        </p>

        <p className="mt-0.5 text-sm font-medium text-gray-700">
          {value}
        </p>

      </div>

    </div>
  );
}


// =====================================================
// STATUS
// =====================================================

function StatusBadge({
  status,
}: {
  status:
    string;
}) {
  const label =
    formatStatus(
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


  if (
    status ===
    "ditolak"
  ) {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
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
// STATUS FORMAT
// =====================================================

function formatStatus(
  status:
    string
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
// CLEAN
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


function cleanNullable(
  value:
    string
) {
  const result =
    value.trim();


  if (!result) {
    return null;
  }


  return result;
}