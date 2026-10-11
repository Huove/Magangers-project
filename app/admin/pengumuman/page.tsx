"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import StatCard from "@/components/admin/dashboard/StatisticCard";
import AnnouncementFilter from "@/components/admin/announcement/AnnouncementFilter";
import AnnouncementCard from "@/components/admin/announcement/AnnouncementCard";
import AnnouncementDrawer from "@/components/admin/announcement/AnnouncementDrawer";

import {
  getAdminAnnouncements,
  createAdminAnnouncement,
  updateAdminAnnouncement,
  deleteAdminAnnouncement,
  publishAdminAnnouncement,
  type AdminAnnouncement,
  type AdminAnnouncementStatus,
} from "@/lib/admin/pengumumanService";

import {
  Bell,
  Send,
  FileText,
  Clock3,
  X,
  Upload,
} from "lucide-react";


// =====================================================
// TYPE ATTACHMENT
// =====================================================

export interface AnnouncementAttachment {
  name: string;

  size: number;

  type: string;

  // Signed URL sementara.
  url: string;

  // Path asli di Storage.
  path: string;
}


// =====================================================
// TYPE FRONTEND
// =====================================================

export interface Announcement {
  id: string;

  judul: string;

  isi: string;

  target: string;

  // Untuk tampilan
  tanggal: string;

  // YYYY-MM-DD
  tanggalRaw: string;

  status: string;

  dibuatOleh:
    | string
    | null;

  createdAt: string;

  publishedAt:
    | string
    | null;

  attachment?:
    AnnouncementAttachment;
}


// =====================================================
// PAGE
// =====================================================

export default function PengumumanPage() {
  // ===================================================
  // DATA
  // ===================================================

  const [
    data,
    setData,
  ] =
    useState<Announcement[]>(
      []
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  // ===================================================
  // SEARCH
  // ===================================================

  const [
    search,
    setSearch,
  ] =
    useState("");


  // ===================================================
  // DRAWER
  // ===================================================

  const [
    selected,
    setSelected,
  ] =
    useState<Announcement | null>(
      null
    );


  const [
    drawerOpen,
    setDrawerOpen,
  ] =
    useState(false);


  // ===================================================
  // FORM
  // ===================================================

  const [
    formOpen,
    setFormOpen,
  ] =
    useState(false);


  const [
    editingId,
    setEditingId,
  ] =
    useState<string | null>(
      null
    );


  const [
    judul,
    setJudul,
  ] =
    useState("");


  const [
    isi,
    setIsi,
  ] =
    useState("");


  const [
    target,
    setTarget,
  ] =
    useState(
      "Semua Peserta"
    );


  const [
    tanggal,
    setTanggal,
  ] =
    useState("");


  const [
    status,
    setStatus,
  ] =
    useState(
      "Draft"
    );


  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null
    );


  // ===================================================
  // INITIAL
  // ===================================================

  useEffect(() => {
    fetchAnnouncements();
  }, []);


  // ===================================================
  // FETCH
  //
  // PAGE
  // ↓
  // pengumumanService.ts
  // ↓
  // GET /api/admin/pengumuman
  // ↓
  // requireAdmin()
  // ↓
  // DB + PRIVATE STORAGE
  // ===================================================

  async function fetchAnnouncements() {
    try {
      setLoading(
        true
      );

      setError(
        ""
      );


      const result =
        await getAdminAnnouncements();


      const formatted =
        result.map(
          mapAdminAnnouncement
        );


      setData(
        formatted
      );


      // ===============================================
      // REFRESH DRAWER
      // ===============================================

      setSelected(
        (
          current
        ) => {
          if (!current) {
            return null;
          }


          return (
            formatted.find(
              (item) =>
                item.id ===
                current.id
            ) ??
            current
          );
        }
      );

    } catch (err) {
      console.error(
        "FETCH PENGUMUMAN ERROR:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengambil data pengumuman.";


      setError(
        message
      );


      setData(
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
        search
          .trim()
          .toLowerCase();


      if (!keyword) {
        return data;
      }


      return data.filter(
        (item) =>
          item.judul
            .toLowerCase()
            .includes(
              keyword
            ) ||

          item.isi
            .toLowerCase()
            .includes(
              keyword
            ) ||

          item.target
            .toLowerCase()
            .includes(
              keyword
            ) ||

          item.status
            .toLowerCase()
            .includes(
              keyword
            )
      );

    }, [
      data,
      search,
    ]);


  // ===================================================
  // RESET FORM
  // ===================================================

  function resetForm() {
    setJudul(
      ""
    );

    setIsi(
      ""
    );

    setTarget(
      "Semua Peserta"
    );

    setTanggal(
      ""
    );

    setStatus(
      "Draft"
    );

    setFile(
      null
    );

    setEditingId(
      null
    );
  }


  // ===================================================
  // TAMBAH
  // ===================================================

  function handleAdd() {
    resetForm();

    setFormOpen(
      true
    );
  }


  // ===================================================
  // EDIT
  // ===================================================

  function handleEdit(
    announcement: Announcement
  ) {
    setEditingId(
      announcement.id
    );


    setJudul(
      announcement.judul
    );


    setIsi(
      announcement.isi
    );


    setTarget(
      announcement.target
    );


    setTanggal(
      announcement.tanggalRaw
    );


    setStatus(
      announcement.status
    );


    setFile(
      null
    );


    setDrawerOpen(
      false
    );


    setFormOpen(
      true
    );
  }


  // ===================================================
  // SIMPAN TAMBAH / EDIT
  //
  // PAGE
  // ↓
  // SERVICE
  // ↓
  // POST / PUT API
  // ↓
  // STORAGE + DATABASE
  // ===================================================

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();


    // ===============================================
    // VALIDASI
    // ===============================================

    if (
      !judul.trim()
    ) {
      alert(
        "Judul pengumuman wajib diisi."
      );

      return;
    }


    if (
      !isi.trim()
    ) {
      alert(
        "Isi pengumuman wajib diisi."
      );

      return;
    }


    if (
      !tanggal
    ) {
      alert(
        "Tanggal wajib diisi."
      );

      return;
    }


    if (
      file &&
      file.size >
        10 * 1024 * 1024
    ) {
      alert(
        "Ukuran lampiran maksimal 10 MB."
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
      // STATUS UI → DATABASE
      // ===============================================

      const databaseStatus =
        getDatabaseStatus(
          status
        );


      const payload = {
        judul:
          judul.trim(),

        isi:
          isi.trim(),

        target,

        tanggal,

        status:
          databaseStatus,

        file,
      };


      // ===============================================
      // EDIT
      // ===============================================

      if (
        editingId
      ) {
        const result =
          await updateAdminAnnouncement(
            editingId,
            payload
          );


        console.log(
          "ANNOUNCEMENT UPDATED:",
          result
        );


        if (
          result.warnings &&
          result.warnings.length >
            0
        ) {
          console.warn(
            "ANNOUNCEMENT WARNINGS:",
            result.warnings
          );
        }
      }


      // ===============================================
      // TAMBAH
      // ===============================================

      else {
        const result =
          await createAdminAnnouncement(
            payload
          );


        console.log(
          "ANNOUNCEMENT CREATED:",
          result
        );
      }


      // ===============================================
      // REFRESH
      // ===============================================

      await fetchAnnouncements();


      setFormOpen(
        false
      );


      resetForm();

    } catch (err) {
      console.error(
        "SAVE PENGUMUMAN ERROR:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal menyimpan pengumuman.";


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
  //
  // PAGE
  // ↓
  // DELETE /api/admin/pengumuman/:id
  // ↓
  // DELETE DATABASE
  // ↓
  // CLEANUP STORAGE
  // ===================================================

  async function handleDelete(
    id: string
  ) {
    const announcement =
      data.find(
        (item) =>
          item.id ===
          id
      );


    if (!announcement) {
      return;
    }


    const confirmed =
      window.confirm(
        `Yakin ingin menghapus pengumuman "${announcement.judul}"?`
      );


    if (!confirmed) {
      return;
    }


    try {
      setError(
        ""
      );


      const result =
        await deleteAdminAnnouncement(
          id
        );


      console.log(
        "ANNOUNCEMENT DELETED:",
        result
      );


      if (
        result.warnings &&
        result.warnings.length >
          0
      ) {
        console.warn(
          "DELETE WARNINGS:",
          result.warnings
        );
      }


      await fetchAnnouncements();


      if (
        selected?.id ===
        id
      ) {
        setSelected(
          null
        );

        setDrawerOpen(
          false
        );
      }

    } catch (err) {
      console.error(
        "DELETE PENGUMUMAN ERROR:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal menghapus pengumuman.";


      setError(
        message
      );


      alert(
        message
      );
    }
  }


  // ===================================================
  // PUBLISH
  //
  // Drawer
  // ↓
  // publishAdminAnnouncement()
  // ↓
  // POST /api/admin/pengumuman/:id/publish
  // ===================================================

  async function handlePublish(
    announcement: Announcement
  ) {
    try {
      setError(
        ""
      );


      const result =
        await publishAdminAnnouncement(
          announcement.id
        );


      console.log(
        "ANNOUNCEMENT PUBLISHED:",
        result
      );


      // ===============================================
      // REFRESH
      // ===============================================

      await fetchAnnouncements();

    } catch (err) {
      console.error(
        "PUBLISH PENGUMUMAN ERROR:",
        err
      );


      const message =
        err instanceof Error
          ? err.message
          : "Gagal mempublikasikan pengumuman.";


      setError(
        message
      );


      alert(
        message
      );


      throw err;
    }
  }


  // ===================================================
  // DETAIL
  // ===================================================

  function handleDetail(
    announcement: Announcement
  ) {
    setSelected(
      announcement
    );


    setDrawerOpen(
      true
    );
  }


  // ===================================================
  // EXPORT CSV
  // ===================================================

  function handleExport() {
    if (
      data.length ===
      0
    ) {
      alert(
        "Tidak ada data untuk diexport."
      );

      return;
    }


    const header = [
      "ID",
      "Judul",
      "Isi",
      "Target",
      "Tanggal",
      "Status",
      "Lampiran",
    ];


    const rows =
      data.map(
        (item) => [
          item.id,
          item.judul,
          item.isi,
          item.target,
          item.tanggal,
          item.status,

          item.attachment
            ?.name ||
          "-",
        ]
      );


    const csv = [
      header,
      ...rows,
    ]
      .map(
        (row) =>
          row
            .map(
              (value) =>
                `"${String(
                  value
                ).replace(
                  /"/g,
                  '""'
                )}"`
            )
            .join(",")
      )
      .join("\n");


    const blob =
      new Blob(
        [
          "\uFEFF",
          csv,
        ],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    const link =
      document.createElement(
        "a"
      );


    link.href =
      url;


    link.download =
      "data-pengumuman.csv";


    document.body.appendChild(
      link
    );


    link.click();


    document.body.removeChild(
      link
    );


    URL.revokeObjectURL(
      url
    );
  }


  // ===================================================
  // STATISTIK
  // ===================================================

  const total =
    data.length;


  const published =
    data.filter(
      (item) =>
        item.status ===
        "Dipublikasikan"
    ).length;


  const draft =
    data.filter(
      (item) =>
        item.status ===
        "Draft"
    ).length;


  const scheduled =
    data.filter(
      (item) =>
        item.status ===
        "Terjadwal"
    ).length;


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="space-y-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div>

        <h1 className="text-3xl font-bold">
          Pengumuman
        </h1>

        <p className="mt-2 text-gray-500">
          Kelola seluruh
          informasi dan
          pengumuman peserta
          magang.
        </p>

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
          STATISTIK
      ================================================= */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Total"
          value={total}
          icon={Bell}
          color="#2563EB"
        />


        <StatCard
          title="Dipublikasikan"
          value={published}
          icon={Send}
          color="#22C55E"
        />


        <StatCard
          title="Draft"
          value={draft}
          icon={FileText}
          color="#F59E0B"
        />


        <StatCard
          title="Terjadwal"
          value={scheduled}
          icon={Clock3}
          color="#7C3AED"
        />

      </div>


      {/* =================================================
          FILTER
      ================================================= */}

      <AnnouncementFilter
        search={search}
        setSearch={
          setSearch
        }
        onAdd={
          handleAdd
        }
        onExport={
          handleExport
        }
      />


      {/* =================================================
          CARD
      ================================================= */}

      {loading ? (

        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">

          <p className="text-sm text-gray-500">
            Memuat pengumuman...
          </p>

        </div>

      ) : (

        <AnnouncementCard
          data={
            filtered
          }
          onDetail={
            handleDetail
          }
          onEdit={
            handleEdit
          }
          onDelete={
            handleDelete
          }
        />

      )}


      {/* =================================================
          DRAWER
      ================================================= */}

      <AnnouncementDrawer
        open={
          drawerOpen
        }
        onClose={() => {
          setDrawerOpen(
            false
          );

          setSelected(
            null
          );
        }}
        announcement={
          selected
        }
        onEdit={
          handleEdit
        }
        onPublish={
          handlePublish
        }
      />


      {/* =================================================
          MODAL TAMBAH / EDIT
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
                  {editingId
                    ? "Edit Pengumuman"
                    : "Tambah Pengumuman"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Isi informasi
                  pengumuman di
                  bawah ini.
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
                className="rounded-lg p-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X
                  size={22}
                />
              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5 p-6"
            >

              {/* JUDUL */}

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Judul Pengumuman
                </label>

                <input
                  type="text"
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
                  placeholder="Contoh: Jadwal Evaluasi Mingguan"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                />

              </div>


              {/* ISI */}

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Isi Pengumuman
                </label>

                <textarea
                  value={
                    isi
                  }
                  onChange={(
                    event
                  ) =>
                    setIsi(
                      event.target.value
                    )
                  }
                  rows={5}
                  placeholder="Tuliskan isi pengumuman..."
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                />

              </div>


              {/* TARGET + STATUS */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* TARGET */}

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Target Peserta
                  </label>

                  <select
                    value={
                      target
                    }
                    onChange={(
                      event
                    ) =>
                      setTarget(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  >
                    <option>
                      Semua Peserta
                    </option>

                    <option>
                      Frontend
                    </option>

                    <option>
                      Backend
                    </option>

                    <option>
                      UI/UX
                    </option>

                    <option>
                      Mobile Developer
                    </option>

                    <option>
                      Data Analyst
                    </option>
                  </select>

                </div>


                {/* STATUS */}

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Status
                  </label>

                  <select
                    value={
                      status
                    }
                    onChange={(
                      event
                    ) =>
                      setStatus(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  >
                    <option>
                      Draft
                    </option>

                    <option>
                      Terjadwal
                    </option>

                    <option>
                      Dipublikasikan
                    </option>
                  </select>

                </div>

              </div>


              {/* TANGGAL */}

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Tanggal
                </label>

                <input
                  type="date"
                  value={
                    tanggal
                  }
                  onChange={(
                    event
                  ) =>
                    setTanggal(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                />

                {status ===
                  "Terjadwal" && (
                  <p className="mt-2 text-xs text-gray-500">
                    Pengumuman akan
                    dipublikasikan otomatis
                    ketika tanggal jadwal
                    tiba.
                  </p>
                )}

              </div>


              {/* =================================================
                  FILE
              ================================================= */}

              <div>

                <label className="mb-2 block text-sm font-medium">
                  Lampiran
                </label>


                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-8 transition hover:border-blue-500 hover:bg-blue-50">

                  <Upload
                    size={30}
                    className="mb-3 text-blue-600"
                  />

                  <span className="font-medium">
                    Klik untuk memilih file
                  </span>

                  <span className="mt-1 text-sm text-gray-500">
                    PDF, DOC, DOCX,
                    XLS, XLSX, JPG,
                    PNG — maksimal 10 MB
                  </span>

                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    onChange={(
                      event
                    ) => {
                      const selectedFile =
                        event.target
                          .files?.[0];


                      if (
                        !selectedFile
                      ) {
                        return;
                      }


                      if (
                        selectedFile.size >
                          10 *
                          1024 *
                          1024
                      ) {
                        alert(
                          "Ukuran file maksimal 10 MB."
                        );

                        event.target.value =
                          "";

                        return;
                      }


                      setFile(
                        selectedFile
                      );
                    }}
                  />

                </label>


                {/* FILE BARU */}

                {file && (
                  <div className="mt-3 rounded-xl bg-blue-50 p-4">

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <p className="text-sm font-medium text-blue-700">
                          File dipilih:
                        </p>

                        <p className="mt-1 break-all text-sm text-blue-600">
                          {file.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatFileSize(
                            file.size
                          )}
                        </p>

                      </div>


                      <button
                        type="button"
                        onClick={() => {
                          setFile(
                            null
                          );
                        }}
                        className="shrink-0 rounded-lg p-1 text-gray-500 hover:bg-blue-100 hover:text-gray-700"
                      >
                        <X
                          size={17}
                        />
                      </button>

                    </div>

                  </div>
                )}


                {/* FILE LAMA */}

                {!file &&
                  editingId &&
                  data.find(
                    (item) =>
                      item.id ===
                      editingId
                  )
                    ?.attachment && (

                    <div className="mt-3 rounded-xl bg-gray-50 p-4">

                      <p className="text-sm font-medium text-gray-700">
                        Lampiran saat ini:
                      </p>

                      <p className="mt-1 break-all text-sm text-gray-500">
                        {
                          data.find(
                            (item) =>
                              item.id ===
                              editingId
                          )
                            ?.attachment
                            ?.name
                        }
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Pilih file baru jika
                        ingin mengganti
                        lampiran.
                      </p>

                    </div>

                  )}

              </div>


              {/* BUTTON */}

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
                  className="rounded-xl border border-gray-300 px-6 py-3 font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal
                </button>


                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : editingId
                      ? "Simpan Perubahan"
                      : "Tambah Pengumuman"}
                </button>

              </div>

            </form>

          </div>

        </>
      )}

    </div>
  );
}


// =====================================================
// API DATA → UI DATA
// =====================================================

function mapAdminAnnouncement(
  item: AdminAnnouncement
): Announcement {
  return {
    id:
      item.id,

    judul:
      item.judul,

    isi:
      item.isi,

    target:
      item.target,

    tanggal:
      formatTanggal(
        item.tanggal
      ),

    tanggalRaw:
      item.tanggal,

    status:
      formatStatus(
        item.status
      ),

    dibuatOleh:
      item.dibuatOleh ??
      null,

    createdAt:
      item.createdAt,

    publishedAt:
      item.publishedAt,

    attachment:
      item.attachment
        ? {
            name:
              item.attachment
                .name,

            size:
              item.attachment
                .size,

            type:
              item.attachment
                .type,

            path:
              item.attachment
                .path,

            url:
              item.attachment
                .url ??
              "",
          }
        : undefined,
  };
}


// =====================================================
// UI STATUS → DATABASE
// =====================================================

function getDatabaseStatus(
  status: string
): AdminAnnouncementStatus {
  switch (status) {
    case "Terjadwal":
      return "terjadwal";

    case "Dipublikasikan":
      return "dipublikasikan";

    case "Draft":
    default:
      return "draft";
  }
}


// =====================================================
// DATABASE STATUS → UI
// =====================================================

function formatStatus(
  status:
    AdminAnnouncementStatus
) {
  switch (status) {
    case "terjadwal":
      return "Terjadwal";

    case "dipublikasikan":
      return "Dipublikasikan";

    case "draft":
    default:
      return "Draft";
  }
}


// =====================================================
// FORMAT TANGGAL
// =====================================================

function formatTanggal(
  value: string
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
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}


// =====================================================
// FILE SIZE
// =====================================================

function formatFileSize(
  bytes: number
) {
  if (!bytes) {
    return "0 KB";
  }


  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(
      1
    )} KB`;
  }


  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(
    1
  )} MB`;
}