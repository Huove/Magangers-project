"use client";

import {
  useEffect,
  useState,
} from "react";

import StatCard from "@/components/admin/dashboard/StatisticCard";

import {
  getAdminAuditLogs,
  type AdminAuditLog,
  type AuditPagination,
  type AuditStats,
} from "@/lib/admin/auditService";

import {
  Activity,
  Bot,
  ShieldCheck,
  Search,
  RefreshCw,
  Eye,
  X,
  UserRound,
  ChevronLeft,
  ChevronRight,
  Database,
} from "lucide-react";


// =====================================================
// INITIAL
// =====================================================

const initialStats:
  AuditStats = {
    total:
      0,

    admin:
      0,

    system:
      0,
};


const initialPagination:
  AuditPagination = {
    page:
      1,

    pageSize:
      20,

    total:
      0,

    totalPages:
      1,
};


// =====================================================
// PAGE
// =====================================================

export default function AuditPage() {
  // ===================================================
  // DATA
  // ===================================================

  const [
    logs,
    setLogs,
  ] =
    useState<
      AdminAuditLog[]
    >([]);


  const [
    stats,
    setStats,
  ] =
    useState<
      AuditStats
    >(
      initialStats
    );


  const [
    pagination,
    setPagination,
  ] =
    useState<
      AuditPagination
    >(
      initialPagination
    );


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
    entity,
    setEntity,
  ] =
    useState(
      "semua"
    );


  const [
    action,
    setAction,
  ] =
    useState(
      "semua"
    );


  // ===================================================
  // DETAIL
  // ===================================================

  const [
    selected,
    setSelected,
  ] =
    useState<
      AdminAuditLog
      | null
    >(
      null
    );


  // ===================================================
  // INITIAL
  // ===================================================

  useEffect(() => {
    loadLogs(
      1
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ===================================================
  // LOAD
  // ===================================================

  async function loadLogs(
    targetPage =
      pagination.page,

    refresh =
      false
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


      const result =
        await getAdminAuditLogs({
          page:
            targetPage,

          pageSize:
            20,

          entity,

          action,

          search:
            search.trim(),
        });


      setLogs(
        result.logs
      );


      setStats(
        result.stats
      );


      setPagination(
        result.pagination
      );

    } catch (err) {
      console.error(
        "LOAD AUDIT ERROR:",
        err
      );


      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil audit log."
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

  async function handleFilter() {
    await loadLogs(
      1
    );
  }


  function handleReset() {
    setSearch(
      ""
    );

    setEntity(
      "semua"
    );

    setAction(
      "semua"
    );
  }


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-3xl font-bold">
            Audit Log
          </h1>

          <p className="mt-2 text-gray-500">
            Pantau perubahan data
            dan aktivitas backend
            Admin.
          </p>

        </div>


        <button
          type="button"
          disabled={
            refreshing
          }
          onClick={() =>
            loadLogs(
              pagination.page,
              true
            )
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


      {/* ERROR */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-600">
          {error}
        </div>
      )}


      {/* STATS */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">

        <StatCard
          title="Total Aktivitas"
          value={
            stats.total
          }
          icon={
            Activity
          }
          color="#2563EB"
        />


        <StatCard
          title="Aktivitas Admin"
          value={
            stats.admin
          }
          icon={
            ShieldCheck
          }
          color="#22C55E"
        />


        <StatCard
          title="Aktivitas Sistem"
          value={
            stats.system
          }
          icon={
            Bot
          }
          color="#7C3AED"
        />

      </div>


      {/* FILTER */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_200px_200px_auto]">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
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
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  handleFilter();
                }
              }}
              placeholder="Cari deskripsi aktivitas..."
              className="w-full rounded-xl border border-gray-300 py-3 pl-11 pr-4 outline-none focus:border-blue-600"
            />

          </div>


          {/* ENTITY */}

          <select
            value={
              entity
            }
            onChange={(
              event
            ) =>
              setEntity(
                event.target.value
              )
            }
            className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
          >
            <option value="semua">
              Semua Entity
            </option>

            <option value="peserta">
              Peserta
            </option>

            <option value="penempatan">
              Penempatan
            </option>

            <option value="laporan">
              Laporan
            </option>

            <option value="pengumuman">
              Pengumuman
            </option>

            <option value="pembimbing">
              Pembimbing
            </option>

            <option value="pendidikan">
              Pendidikan
            </option>
          </select>


          {/* ACTION */}

          <select
            value={
              action
            }
            onChange={(
              event
            ) =>
              setAction(
                event.target.value
              )
            }
            className="rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
          >
            <option value="semua">
              Semua Aksi
            </option>

            <option value="INSERT">
              INSERT
            </option>

            <option value="UPDATE">
              UPDATE
            </option>

            <option value="DELETE">
              DELETE
            </option>

            <option value="AUTO_PUBLISH">
              AUTO PUBLISH
            </option>

            <option value="AUTO_ACTIVATE">
              AUTO ACTIVATE
            </option>

            <option value="AUTO_FINISH">
              AUTO FINISH
            </option>
          </select>


          <div className="flex gap-2">

            <button
              type="button"
              onClick={
                handleFilter
              }
              className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              Terapkan
            </button>


            <button
              type="button"
              onClick={
                handleReset
              }
              className="rounded-xl border border-gray-300 px-4 py-3 text-gray-600 transition hover:bg-gray-50"
            >
              Reset
            </button>

          </div>

        </div>

      </div>


      {/* TABLE */}

      {loading ? (

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Memuat audit log...
          </p>
        </div>

      ) : logs.length ===
        0 ? (

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

          <Database
            size={40}
            className="mx-auto text-gray-300"
          />

          <p className="mt-4 font-medium text-gray-700">
            Audit log kosong
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Tidak ada aktivitas
            yang sesuai filter.
          </p>

        </div>

      ) : (

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead className="border-b bg-gray-50">

                <tr className="text-left text-sm text-gray-500">

                  <th className="px-6 py-4 font-medium">
                    Pelaku
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Aksi
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Entity
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Peserta
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Deskripsi
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Waktu
                  </th>

                  <th className="px-6 py-4 text-right font-medium">
                    Detail
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y">

                {logs.map(
                  (
                    item
                  ) => (

                    <tr
                      key={
                        item.id
                      }
                      className="align-top transition hover:bg-gray-50"
                    >

                      {/* ACTOR */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">

                            {item.actorId ? (
                              <UserRound
                                size={17}
                              />
                            ) : (
                              <Bot
                                size={17}
                              />
                            )}

                          </div>


                          <div>

                            <p className="text-sm font-medium text-gray-900">
                              {item.actorName}
                            </p>

                            {item.actorId && (
                              <p className="mt-0.5 text-xs text-gray-400">
                                {item.actorEmail}
                              </p>
                            )}

                          </div>

                        </div>

                      </td>


                      {/* ACTION */}

                      <td className="px-6 py-5">
                        <ActionBadge
                          action={
                            item.action
                          }
                        />
                      </td>


                      {/* ENTITY */}

                      <td className="px-6 py-5">

                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
                          {item.entity}
                        </span>

                      </td>


                      {/* PARTICIPANT */}

                      <td className="px-6 py-5">

                        {item.pesertaName ? (
                          <>
                            <p className="text-sm font-medium text-gray-700">
                              {item.pesertaName}
                            </p>

                            {item.nomorPeserta && (
                              <p className="mt-1 text-xs text-gray-400">
                                {item.nomorPeserta}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">
                            -
                          </span>
                        )}

                      </td>


                      {/* DESCRIPTION */}

                      <td className="max-w-[300px] px-6 py-5">

                        <p className="line-clamp-2 text-sm leading-6 text-gray-600">
                          {item.description ||
                            "-"}
                        </p>

                      </td>


                      {/* DATE */}

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-500">
                        {formatDateTime(
                          item.createdAt
                        )}
                      </td>


                      {/* DETAIL */}

                      <td className="px-6 py-5 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            setSelected(
                              item
                            )
                          }
                          className="inline-flex rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                        >
                          <Eye
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


          {/* PAGINATION */}

          <div className="flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

            <p className="text-sm text-gray-500">
              Menampilkan halaman{" "}
              {pagination.page}
              {" dari "}
              {pagination.totalPages}
              {" • "}
              {pagination.total}
              {" data"}
            </p>


            <div className="flex gap-2">

              <button
                type="button"
                disabled={
                  pagination.page <=
                  1
                }
                onClick={() =>
                  loadLogs(
                    pagination.page -
                      1
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft
                  size={16}
                />

                Sebelumnya
              </button>


              <button
                type="button"
                disabled={
                  pagination.page >=
                  pagination.totalPages
                }
                onClick={() =>
                  loadLogs(
                    pagination.page +
                      1
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Selanjutnya

                <ChevronRight
                  size={16}
                />
              </button>

            </div>

          </div>

        </div>

      )}


      {/* DETAIL MODAL */}

      {selected && (
        <>

          <div
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={() =>
              setSelected(
                null
              )
            }
          />


          <div className="fixed left-1/2 top-1/2 z-[70] max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b px-6 py-5">

              <div>

                <h2 className="text-xl font-bold">
                  Detail Audit
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  ID: {selected.id}
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelected(
                    null
                  )
                }
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X
                  size={22}
                />
              </button>

            </div>


            <div className="space-y-6 p-6">

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <DetailItem
                  label="Pelaku"
                  value={
                    selected.actorName
                  }
                />

                <DetailItem
                  label="Aksi"
                  value={
                    selected.action
                  }
                />

                <DetailItem
                  label="Entity"
                  value={
                    selected.entity
                  }
                />

                <DetailItem
                  label="Entity ID"
                  value={
                    selected.entityId ??
                    "-"
                  }
                />

                <DetailItem
                  label="Peserta"
                  value={
                    selected.pesertaName ??
                    "-"
                  }
                />

                <DetailItem
                  label="Waktu"
                  value={
                    formatDateTime(
                      selected.createdAt
                    )
                  }
                />

              </div>


              <div>

                <p className="mb-2 text-sm font-medium text-gray-700">
                  Deskripsi
                </p>

                <div className="rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                  {selected.description ||
                    "-"}
                </div>

              </div>


              <div>

                <p className="mb-2 text-sm font-medium text-gray-700">
                  Metadata
                </p>

                <pre className="max-h-[350px] overflow-auto rounded-xl bg-gray-950 p-4 text-xs leading-6 text-gray-100">
                  {JSON.stringify(
                    selected.metadata,
                    null,
                    2
                  )}
                </pre>

              </div>

            </div>

          </div>

        </>
      )}

    </div>
  );
}


// =====================================================
// ACTION BADGE
// =====================================================

function ActionBadge({
  action,
}: {
  action:
    string;
}) {
  if (
    action ===
      "INSERT"
  ) {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        INSERT
      </span>
    );
  }


  if (
    action ===
      "UPDATE"
  ) {
    return (
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
        UPDATE
      </span>
    );
  }


  if (
    action ===
      "DELETE"
  ) {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
        DELETE
      </span>
    );
  }


  return (
    <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
      {action.replace(
        /_/g,
        " "
      )}
    </span>
  );
}


// =====================================================
// DETAIL ITEM
// =====================================================

function DetailItem({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">

      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-2 break-all text-sm font-medium text-gray-700">
        {value}
      </p>

    </div>
  );
}


// =====================================================
// DATE
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


  return date.toLocaleString(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",

      second:
        "2-digit",
    }
  );
}