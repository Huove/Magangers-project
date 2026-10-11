"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "motion/react";

import {
  CalendarDays,
  MapPin,
  NotebookPen,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  FileText,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

// =========================================
// TYPES
// =========================================

type Jurnal = {
  id: string;
  tanggal: string;
  kegiatan: string;
  lokasi: string;
  deskripsi: string;
  status: string;
};

type JurnalForm = {
  tanggal: string;
  kegiatan: string;
  lokasi: string;
  deskripsi: string;
};

const emptyForm: JurnalForm = {
  tanggal: "",
  kegiatan: "",
  lokasi: "",
  deskripsi: "",
};

// =========================================
// PAGE
// =========================================

export default function JurnalPage() {
  const [pesertaId, setPesertaId] =
    useState<string | null>(null);

  const [pesertaStatus, setPesertaStatus] =
    useState("-");

  const [jurnalList, setJurnalList] =
    useState<Jurnal[]>([]);

  const [search, setSearch] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [showDetail, setShowDetail] =
    useState(false);

  const [
    selectedJurnal,
    setSelectedJurnal,
  ] = useState<Jurnal | null>(null);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<JurnalForm>(emptyForm);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  // =========================================
  // FETCH JURNAL
  // =========================================

  const fetchJurnal =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        // =====================================
        // USER LOGIN
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
        // DATA PESERTA
        // =====================================

        const {
          data: peserta,
          error: pesertaError,
        } = await supabase
          .from("peserta")
          .select(`
            id,
            status
          `)
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

        setPesertaStatus(
          peserta.status || "-"
        );

        // =====================================
        // JURNAL PESERTA
        // =====================================

        const {
          data,
          error: jurnalError,
        } = await supabase
          .from("jurnal")
          .select(`
            id,
            tanggal,
            kegiatan,
            lokasi,
            deskripsi,
            status
          `)
          .eq(
            "peserta_id",
            peserta.id
          )
          .order(
            "tanggal",
            {
              ascending: false,
            }
          );

        if (jurnalError) {
          throw jurnalError;
        }

        const formattedData: Jurnal[] = (
          data || []
        ).map((item) => ({
          id: item.id,

          tanggal:
            item.tanggal,

          kegiatan:
            item.kegiatan || "-",

          lokasi:
            item.lokasi || "-",

          deskripsi:
            item.deskripsi || "-",

          status:
            item.status || "menunggu",
        }));

        setJurnalList(
          formattedData
        );
      } catch (err) {
        console.error(
          "Gagal mengambil jurnal:",
          err
        );

        setError(
          "Gagal mengambil data jurnal."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchJurnal();
  }, [fetchJurnal]);

  // =========================================
  // SEARCH
  // =========================================

  const filteredJurnal =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return jurnalList;
      }

      return jurnalList.filter(
        (jurnal) =>
          jurnal.kegiatan
            .toLowerCase()
            .includes(keyword) ||
          jurnal.lokasi
            .toLowerCase()
            .includes(keyword) ||
          jurnal.deskripsi
            .toLowerCase()
            .includes(keyword)
      );
    }, [
      jurnalList,
      search,
    ]);

  // =========================================
  // JURNAL BULAN INI
  // =========================================

  const jurnalBulanIni =
    useMemo(() => {
      const sekarang =
        new Date();

      const tahun =
        sekarang.getFullYear();

      const bulan = String(
        sekarang.getMonth() + 1
      ).padStart(2, "0");

      const bulanSekarang =
        `${tahun}-${bulan}`;

      return jurnalList.filter(
        (jurnal) =>
          jurnal.tanggal.startsWith(
            bulanSekarang
          )
      ).length;
    }, [jurnalList]);

  // =========================================
  // CHANGE FORM
  // =========================================

  const handleChange = (
    field: keyof JurnalForm,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================================
  // TUTUP FORM
  // =========================================

  const closeForm = () => {
    if (submitting) {
      return;
    }

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  // =========================================
  // TAMBAH JURNAL
  // =========================================

  const openTambahForm = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      tanggal:
        getLocalDate(),
    });

    setShowForm(true);
  };

  // =========================================
  // EDIT JURNAL
  // =========================================

  const openEditForm = (
    jurnal: Jurnal
  ) => {
    setEditingId(
      jurnal.id
    );

    setForm({
      tanggal:
        jurnal.tanggal,

      kegiatan:
        jurnal.kegiatan === "-"
          ? ""
          : jurnal.kegiatan,

      lokasi:
        jurnal.lokasi === "-"
          ? ""
          : jurnal.lokasi,

      deskripsi:
        jurnal.deskripsi === "-"
          ? ""
          : jurnal.deskripsi,
    });

    setShowForm(true);
  };

  // =========================================
  // SIMPAN / UPDATE
  // =========================================

  const handleSubmit =
    async () => {
      if (!pesertaId) {
        alert(
          "Data peserta tidak ditemukan."
        );
        return;
      }

      if (
        !form.tanggal ||
        !form.kegiatan.trim() ||
        !form.lokasi.trim() ||
        !form.deskripsi.trim()
      ) {
        alert(
          "Mohon lengkapi semua data jurnal."
        );
        return;
      }

      try {
        setSubmitting(true);

        const payload = {
          tanggal:
            form.tanggal,

          kegiatan:
            form.kegiatan.trim(),

          lokasi:
            form.lokasi.trim(),

          deskripsi:
            form.deskripsi.trim(),
        };

        // ===================================
        // UPDATE
        // ===================================

        if (editingId) {
          const {
            error: updateError,
          } = await supabase
            .from("jurnal")
            .update(payload)
            .eq(
              "id",
              editingId
            )
            .eq(
              "peserta_id",
              pesertaId
            );

          if (updateError) {
            throw updateError;
          }
        }

        // ===================================
        // INSERT
        // ===================================

        else {
          const {
            error: insertError,
          } = await supabase
            .from("jurnal")
            .insert({
              peserta_id:
                pesertaId,

              ...payload,

              status:
                "menunggu",
            });

          if (insertError) {
            throw insertError;
          }
        }

        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);

        await fetchJurnal();
      } catch (err) {
        console.error(
          "Gagal menyimpan jurnal:",
          err
        );

        alert(
          "Gagal menyimpan jurnal. Cek console untuk melihat error."
        );
      } finally {
        setSubmitting(false);
      }
    };

  // =========================================
  // DELETE
  // =========================================

  const handleDelete =
    async (
      id: string
    ) => {
      if (!pesertaId) {
        return;
      }

      const confirmed =
        window.confirm(
          "Yakin ingin menghapus jurnal ini?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeletingId(id);

        const {
          error: deleteError,
        } = await supabase
          .from("jurnal")
          .delete()
          .eq(
            "id",
            id
          )
          .eq(
            "peserta_id",
            pesertaId
          );

        if (deleteError) {
          throw deleteError;
        }

        if (
          selectedJurnal?.id ===
          id
        ) {
          setShowDetail(false);
          setSelectedJurnal(null);
        }

        await fetchJurnal();
      } catch (err) {
        console.error(
          "Gagal menghapus jurnal:",
          err
        );

        alert(
          "Gagal menghapus jurnal."
        );
      } finally {
        setDeletingId(null);
      }
    };

  // =========================================
  // DETAIL
  // =========================================

  const openDetail = (
    jurnal: Jurnal
  ) => {
    setSelectedJurnal(
      jurnal
    );

    setShowDetail(true);
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">

        <div className="text-center">

          <NotebookPen
            size={30}
            className="mx-auto mb-3 animate-pulse text-blue-500"
          />

          <p className="text-sm text-neutral-500">
            Memuat jurnal...
          </p>

        </div>

      </div>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
          {error}
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

        <div>

          <h1 className="text-2xl font-semibold text-neutral-900">
            Jurnal Kegiatan
          </h1>

          <p className="mt-1 text-sm text-neutral-500">
            Catat dan dokumentasikan kegiatan
            magangmu.
          </p>

        </div>

        <button
          onClick={
            openTambahForm
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >

          <Plus size={18} />

          Tambah Jurnal

        </button>

      </div>

      {/* =====================================
          STATISTIK
      ===================================== */}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {/* TOTAL */}

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

              <NotebookPen
                size={20}
              />

            </div>

            <div>

              <p className="text-xs text-neutral-500">
                Total Jurnal
              </p>

              <p className="text-xl font-semibold text-neutral-900">
                {jurnalList.length}
              </p>

            </div>

          </div>

        </div>

        {/* BULAN INI */}

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">

              <CalendarDays
                size={20}
              />

            </div>

            <div>

              <p className="text-xs text-neutral-500">
                Jurnal Bulan Ini
              </p>

              <p className="text-xl font-semibold text-neutral-900">
                {jurnalBulanIni}
              </p>

            </div>

          </div>

        </div>

        {/* STATUS */}

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">

              <FileText
                size={20}
              />

            </div>

            <div>

              <p className="text-xs text-neutral-500">
                Status Peserta
              </p>

              <p
                className={`text-sm font-semibold ${
                  pesertaStatus === "aktif"
                    ? "text-emerald-600"
                    : "text-neutral-700"
                }`}
              >
                {formatStatusPeserta(
                  pesertaStatus
                )}
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================
          SEARCH
      ===================================== */}

      <div className="mb-6">

        <div className="relative max-w-md">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />

          <input
            type="text"
            placeholder="Cari jurnal..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />

        </div>

      </div>

      {/* =====================================
          RIWAYAT
      ===================================== */}

      <div>

        <div className="mb-4">

          <h2 className="text-lg font-semibold text-neutral-900">
            Riwayat Jurnal
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Daftar kegiatan magang yang telah
            kamu catat.
          </p>

        </div>

        {filteredJurnal.length === 0 ? (

          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-50 px-6 text-center">

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">

              <NotebookPen
                size={24}
                className="text-neutral-400"
              />

            </div>

            <h3 className="text-sm font-semibold text-neutral-800">

              {jurnalList.length === 0
                ? "Belum ada jurnal"
                : "Jurnal tidak ditemukan"}

            </h3>

            <p className="mt-1 max-w-sm text-xs leading-relaxed text-neutral-500">

              {jurnalList.length === 0
                ? "Tambahkan jurnal kegiatan magang pertamamu."
                : "Belum ada jurnal yang sesuai dengan pencarianmu."}

            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {filteredJurnal.map(
              (
                jurnal,
                index
              ) => (

                <motion.div
                  key={jurnal.id}
                  initial={{
                    opacity: 0,
                    y: 15,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration:
                      0.25,
                    delay:
                      index *
                      0.05,
                  }}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md md:p-6"
                >

                  {/* HEADER CARD */}

                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                    <div className="flex items-start gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                        <NotebookPen
                          size={20}
                        />

                      </div>

                      <div>

                        <p className="mb-1 text-xs font-medium text-blue-600">
                          {formatTanggal(
                            jurnal.tanggal
                          )}
                        </p>

                        <h3 className="text-base font-semibold text-neutral-900">
                          {jurnal.kegiatan}
                        </h3>

                      </div>

                    </div>

                    {/* ACTION */}

                    <div className="flex flex-wrap items-center gap-2">

                      <button
                        onClick={() =>
                          openDetail(
                            jurnal
                          )
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Eye size={15} />

                        Detail
                      </button>

                      <button
                        onClick={() =>
                          openEditForm(
                            jurnal
                          )
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Pencil size={15} />

                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(
                            jurnal.id
                          )
                        }
                        disabled={
                          deletingId ===
                          jurnal.id
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-red-500 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={15} />

                        {deletingId ===
                        jurnal.id
                          ? "Menghapus..."
                          : "Hapus"}
                      </button>

                    </div>

                  </div>

                  {/* INFO */}

                  <div className="mt-5 grid gap-3 border-t border-neutral-100 pt-4 sm:grid-cols-2">

                    {/* LOKASI */}

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500">
                        <MapPin size={16} />
                      </div>

                      <div>

                        <p className="text-[11px] text-neutral-400">
                          Lokasi
                        </p>

                        <p className="text-sm font-medium text-neutral-700">
                          {jurnal.lokasi}
                        </p>

                      </div>

                    </div>

                    {/* STATUS */}

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <FileText size={16} />
                      </div>

                      <div>

                        <p className="text-[11px] text-neutral-400">
                          Status
                        </p>

                        <p
                          className={`text-sm font-medium ${getStatusStyle(
                            jurnal.status
                          )}`}
                        >
                          {formatStatusJurnal(
                            jurnal.status
                          )}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* DESKRIPSI */}

                  <div className="mt-4 rounded-xl bg-neutral-50 p-4">

                    <p className="mb-1 text-[11px] font-medium text-neutral-400">
                      Deskripsi kegiatan
                    </p>

                    <p className="line-clamp-2 text-sm leading-relaxed text-neutral-600">
                      {jurnal.deskripsi}
                    </p>

                  </div>

                </motion.div>

              )
            )}

          </div>

        )}

      </div>

      {/* =====================================
          FORM MODAL
      ===================================== */}

      <AnimatePresence>

        {showForm && (

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
            onClick={
              closeForm
            }
          >

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
              }}
              transition={{
                duration: 0.25,
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl md:p-7"
            >

              {/* HEADER */}

              <div className="mb-6 flex items-start justify-between">

                <div>

                  <p className="text-xs font-medium text-blue-600">
                    {editingId
                      ? "EDIT JURNAL"
                      : "JURNAL BARU"}
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-neutral-900">
                    {editingId
                      ? "Edit Jurnal Kegiatan"
                      : "Tambah Jurnal Kegiatan"}
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    Catat kegiatan magang yang kamu
                    lakukan.
                  </p>

                </div>

                <button
                  onClick={
                    closeForm
                  }
                  disabled={
                    submitting
                  }
                  className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
                >
                  <X size={20} />
                </button>

              </div>

              {/* FORM */}

              <div className="space-y-5">

                {/* TANGGAL */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Tanggal
                  </label>

                  <input
                    type="date"
                    value={
                      form.tanggal
                    }
                    onChange={(e) =>
                      handleChange(
                        "tanggal",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* KEGIATAN */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Kegiatan
                  </label>

                  <input
                    type="text"
                    value={
                      form.kegiatan
                    }
                    onChange={(e) =>
                      handleChange(
                        "kegiatan",
                        e.target.value
                      )
                    }
                    placeholder="Contoh: Membuat UI dashboard"
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* LOKASI */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Lokasi
                  </label>

                  <input
                    type="text"
                    value={
                      form.lokasi
                    }
                    onChange={(e) =>
                      handleChange(
                        "lokasi",
                        e.target.value
                      )
                    }
                    placeholder="Contoh: Ruang Software Engineer"
                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                {/* DESKRIPSI */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Deskripsi kegiatan
                  </label>

                  <textarea
                    rows={5}
                    value={
                      form.deskripsi
                    }
                    onChange={(e) =>
                      handleChange(
                        "deskripsi",
                        e.target.value
                      )
                    }
                    placeholder="Ceritakan kegiatan yang kamu lakukan hari ini..."
                    className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

              </div>

              {/* BUTTON */}

              <div className="mt-7 flex justify-end gap-3 border-t border-neutral-100 pt-5">

                <button
                  onClick={
                    closeForm
                  }
                  disabled={
                    submitting
                  }
                  className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  onClick={
                    handleSubmit
                  }
                  disabled={
                    submitting
                  }
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {submitting
                    ? "Menyimpan..."
                    : editingId
                      ? "Simpan Perubahan"
                      : "Simpan Jurnal"}

                </button>

              </div>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>

      {/* =====================================
          DETAIL MODAL
      ===================================== */}

      <AnimatePresence>

        {showDetail &&
          selectedJurnal && (

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
            onClick={() =>
              setShowDetail(
                false
              )
            }
          >

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 15,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
                y: 15,
              }}
              transition={{
                duration: 0.25,
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
              className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl md:p-7"
            >

              {/* HEADER */}

              <div className="mb-6 flex items-start justify-between">

                <div>

                  <p className="text-xs font-medium text-blue-600">
                    DETAIL JURNAL
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-neutral-900">
                    {selectedJurnal.kegiatan}
                  </h2>

                  <p className="mt-1 text-sm text-neutral-500">
                    {formatTanggal(
                      selectedJurnal.tanggal
                    )}
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowDetail(
                      false
                    )
                  }
                  className="rounded-xl p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                >
                  <X size={20} />
                </button>

              </div>

              {/* LOKASI */}

              <div className="rounded-xl bg-neutral-50 p-4">

                <div className="mb-2 flex items-center gap-2 text-neutral-400">

                  <MapPin size={16} />

                  <span className="text-xs">
                    Lokasi
                  </span>

                </div>

                <p className="text-sm font-medium text-neutral-800">
                  {selectedJurnal.lokasi}
                </p>

              </div>

              {/* DESKRIPSI */}

              <div className="mt-4 rounded-2xl border border-neutral-200 p-5">

                <div className="mb-2 flex items-center gap-2">

                  <FileText
                    size={16}
                    className="text-blue-600"
                  />

                  <p className="text-sm font-semibold text-neutral-800">
                    Deskripsi Kegiatan
                  </p>

                </div>

                <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">
                  {selectedJurnal.deskripsi}
                </p>

              </div>

              {/* STATUS */}

              <div className="mt-4 rounded-xl bg-neutral-50 p-4">

                <p className="text-xs text-neutral-400">
                  Status Jurnal
                </p>

                <p
                  className={`mt-1 text-sm font-semibold ${getStatusStyle(
                    selectedJurnal.status
                  )}`}
                >
                  {formatStatusJurnal(
                    selectedJurnal.status
                  )}
                </p>

              </div>

              <div className="mt-5 flex justify-end">

                <button
                  onClick={() =>
                    setShowDetail(
                      false
                    )
                  }
                  className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
                >
                  Tutup
                </button>

              </div>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>

    </div>
  );
}

// =========================================
// GET LOCAL DATE
// =========================================

function getLocalDate() {
  const date = new Date();

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =========================================
// FORMAT TANGGAL
// =========================================

function formatTanggal(
  tanggal: string
) {
  const date = new Date(
    `${tanggal}T00:00:00`
  );

  return date.toLocaleDateString(
    "id-ID",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

// =========================================
// STATUS JURNAL
// =========================================

function formatStatusJurnal(
  status: string
) {
  switch (status) {
    case "menunggu":
      return "Menunggu";

    case "disetujui":
      return "Disetujui";

    case "ditolak":
      return "Ditolak";

    case "perlu_revisi":
      return "Perlu Revisi";

    default:
      return status || "-";
  }
}

function getStatusStyle(
  status: string
) {
  switch (status) {
    case "disetujui":
      return "text-emerald-600";

    case "ditolak":
      return "text-red-600";

    case "perlu_revisi":
      return "text-orange-600";

    case "menunggu":
      return "text-amber-600";

    default:
      return "text-neutral-600";
  }
}

// =========================================
// STATUS PESERTA
// =========================================

function formatStatusPeserta(
  status: string
) {
  switch (status) {
    case "aktif":
      return "Aktif";

    case "selesai":
      return "Selesai";

    case "diterima":
      return "Diterima";

    case "mengajukan":
      return "Mengajukan";

    case "ditolak":
      return "Ditolak";

    case "tidak_aktif":
      return "Tidak Aktif";

    default:
      return status || "-";
  }
}