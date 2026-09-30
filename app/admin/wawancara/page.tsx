"use client";

import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

import InterviewFilter from "@/components/admin/interview/InterviewFilter";
import InterviewTable from "@/components/admin/interview/InterviewTable";
import InterviewDrawer from "@/components/admin/interview/InterviewDrawer";
import StatCard from "@/components/admin/dashboard/StatisticCard";

import { CalendarClock, Clock3, Users, BadgeCheck } from "lucide-react";

export interface Interview {
  // ini dipakai untuk memilih peserta
  peserta_id: string;

  // jadwal id kalau sudah ada jadwal
  jadwal_id: string | null;

  nama: string;
  email: string;
  sekolah: string;
  posisi: string;

  interviewer: string;
  tanggal: string; // "YYYY-MM-DD" atau "" kalau belum ada
  jam: string;     // "HH:MM" atau "" kalau belum ada
  metode: string;
  lokasi: string;

  // sesuai UI kamu: "Menunggu" | "Dijadwalkan" | "Selesai" | dll
  status: string;
}

type ScheduleData = {
  peserta_id: string;
  interviewer: string;
  tanggal: string;
  jam: string;
  metode: string;
  lokasi: string;
};

export default function WawancaraPage() {
  const [data, setData] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Semua Status");

  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);

  const [schedule, setSchedule] = useState<ScheduleData>({
    peserta_id: "",
    interviewer: "",
    tanggal: "",
    jam: "",
    metode: "Offline",
    lokasi: "",
  });

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function safeJson(res: Response) {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  async function fetchInterviews() {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Session admin tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await fetch("/api/admin/wawancara", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setError((json?.message ?? "Gagal load data") + (json?.detail ? ` (${json.detail})` : ""));
        return;
      }

      // endpoint /api/admin/wawancara harus return { data: Interview[] }
      setData(json?.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInterviews();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = item.nama.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === "Semua Status" || item.status === status;
      return matchSearch && matchStatus;
    });
  }, [data, search, status]);

  /* =========================
     STATISTIK
  ========================= */
  const totalInterview = data.length;

  const waitingInterview = data.filter(
    (item) => item.status === "Menunggu" || item.status === "Dijadwalkan"
  ).length;

  const finishedInterview = data.filter((item) => item.status === "Selesai").length;

  const todayInterview = data.filter((item) => {
    if (!item.tanggal) return false;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return item.tanggal === today;
  }).length;

  /* =========================
     BUKA DETAIL
  ========================= */
  function openDrawer(interview: Interview) {
    setSelectedInterview(interview);
    setDrawerOpen(true);
  }

  /* =========================
     BUKA MODAL BUAT/RESCHEDULE
  ========================= */
  function handleOpenReschedule() {
    if (!selectedInterview) return;

    // prefill schedule dari data peserta yang dipilih
    setSchedule({
      peserta_id: selectedInterview.peserta_id,
      interviewer: selectedInterview.interviewer !== "-" ? selectedInterview.interviewer : "",
      tanggal: selectedInterview.tanggal ?? "",
      jam: selectedInterview.jam ?? "",
      metode: selectedInterview.metode || "Offline",
      lokasi: selectedInterview.lokasi || "",
    });

    setRescheduleModalOpen(true);
  }

  /* =========================
     SIMPAN JADWAL (BUAT atau RESCHEDULE)
  ========================= */
  async function handleSaveScheduleFromDrawer() {
    if (!selectedInterview) return;

    if (!schedule.interviewer || !schedule.tanggal || !schedule.jam) {
      alert("Interviewer, tanggal, dan jam wajib diisi.");
      return;
    }

    const token = await getToken();
    if (!token) {
      alert("Session admin tidak ditemukan.");
      return;
    }

    // kalau sudah ada jadwal -> PATCH reschedule
    if (selectedInterview.jadwal_id) {
      const res = await fetch(`/api/admin/wawancara/${selectedInterview.jadwal_id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reschedule",
          interviewer: schedule.interviewer,
          tanggal: schedule.tanggal,
          jam: schedule.jam,
          metode: schedule.metode,
          lokasi: schedule.lokasi,
        }),
      });

      const json = await safeJson(res);
      if (!res.ok) {
        alert((json?.message ?? "Gagal reschedule") + (json?.detail ? ` (${json.detail})` : ""));
        return;
      }

      setRescheduleModalOpen(false);
      setDrawerOpen(false);
      setSelectedInterview(null);
      await fetchInterviews();
      return;
    }

    // kalau belum ada jadwal -> POST buat jadwal
    const res = await fetch("/api/admin/wawancara", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        peserta_id: selectedInterview.peserta_id,
        interviewer: schedule.interviewer,
        tanggal: schedule.tanggal,
        jam: schedule.jam,
        metode: schedule.metode,
        lokasi: schedule.lokasi,
      }),
    });

    const json = await safeJson(res);
    if (!res.ok) {
      alert((json?.message ?? "Gagal buat jadwal") + (json?.detail ? ` (${json.detail})` : ""));
      return;
    }

    setRescheduleModalOpen(false);
    setDrawerOpen(false);
    setSelectedInterview(null);
    await fetchInterviews();
  }

  /* =========================
     TAMBAH JADWAL (DARI TOMBOL FILTER)
  ========================= */
  function handleOpenAdd() {
    setSchedule({
      peserta_id: "",
      interviewer: "",
      tanggal: "",
      jam: "",
      metode: "Offline",
      lokasi: "",
    });
    setAddModalOpen(true);
  }

  async function handleAddSchedule() {
    if (!schedule.peserta_id || !schedule.interviewer || !schedule.tanggal || !schedule.jam) {
      alert("Peserta, interviewer, tanggal, dan jam wajib diisi.");
      return;
    }

    const token = await getToken();
    if (!token) {
      alert("Session admin tidak ditemukan.");
      return;
    }

    const res = await fetch("/api/admin/wawancara", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        peserta_id: schedule.peserta_id,
        interviewer: schedule.interviewer,
        tanggal: schedule.tanggal,
        jam: schedule.jam,
        metode: schedule.metode,
        lokasi: schedule.lokasi,
      }),
    });

    const json = await safeJson(res);
    if (!res.ok) {
      alert((json?.message ?? "Gagal simpan jadwal") + (json?.detail ? ` (${json.detail})` : ""));
      return;
    }

    setAddModalOpen(false);
    await fetchInterviews();
  }

  /* =========================
     LULUS / TIDAK LULUS (butuh jadwal_id)
  ========================= */
  async function handlePass() {
    if (!selectedInterview?.jadwal_id) {
      alert("Belum ada jadwal. Buat jadwal dulu.");
      return;
    }

    const token = await getToken();
    const res = await fetch(`/api/admin/wawancara/${selectedInterview.jadwal_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "lulus" }),
    });

    const json = await safeJson(res);
    if (!res.ok) {
      alert((json?.message ?? "Gagal") + (json?.detail ? ` (${json.detail})` : ""));
      return;
    }

    setDrawerOpen(false);
    setSelectedInterview(null);
    await fetchInterviews();
  }

  async function handleFail() {
    if (!selectedInterview?.jadwal_id) {
      alert("Belum ada jadwal. Buat jadwal dulu.");
      return;
    }

    const token = await getToken();
    const res = await fetch(`/api/admin/wawancara/${selectedInterview.jadwal_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "tidak_lulus" }),
    });

    const json = await safeJson(res);
    if (!res.ok) {
      alert((json?.message ?? "Gagal") + (json?.detail ? ` (${json.detail})` : ""));
      return;
    }

    setDrawerOpen(false);
    setSelectedInterview(null);
    await fetchInterviews();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Pengelolaan Wawancara</h1>
        <p className="mt-2 text-gray-500">Kelola jadwal, interviewer, dan hasil wawancara peserta magang.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-4 gap-5">
        <StatCard title="Total Wawancara" value={totalInterview} icon={CalendarClock} color="#2563EB" />
        <StatCard title="Hari Ini" value={todayInterview} icon={Clock3} color="#F59E0B" />
        <StatCard title="Menunggu" value={waitingInterview} icon={Users} color="#7C3AED" />
        <StatCard title="Selesai" value={finishedInterview} icon={BadgeCheck} color="#22C55E" />
      </div>

      <InterviewFilter
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        onAdd={handleOpenAdd}
      />

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <InterviewTable data={filteredData} onDetail={openDrawer} />
      )}

      <InterviewDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        interview={selectedInterview as any}
        onPass={handlePass}
        onFail={handleFail}
        onReschedule={handleOpenReschedule}
      />

      {/* MODAL TAMBAH JADWAL (PILIH PESERTA) */}
      {addModalOpen && (
        <ScheduleModal
          title="Tambah Jadwal Wawancara"
          data={schedule}
          setData={setSchedule}
          pesertaOptions={data.map((d) => ({
            value: d.peserta_id,
            label: `${d.nama} — ${d.posisi}`,
          }))}
          onClose={() => setAddModalOpen(false)}
          onSubmit={handleAddSchedule}
        />
      )}

      {/* MODAL BUAT/RESCHEDULE DARI DRAWER */}
      {rescheduleModalOpen && (
        <ScheduleModal
          title={selectedInterview?.jadwal_id ? "Jadwalkan Ulang Wawancara" : "Buat Jadwal Wawancara"}
          data={schedule}
          setData={setSchedule}
          pesertaOptions={null} // dari drawer: peserta sudah fixed
          onClose={() => setRescheduleModalOpen(false)}
          onSubmit={handleSaveScheduleFromDrawer}
        />
      )}
    </div>
  );
}

/* ================= MODAL SCHEDULE ================= */

function ScheduleModal({
  title,
  data,
  setData,
  pesertaOptions,
  onClose,
  onSubmit,
}: {
  title: string;
  data: ScheduleData;
  setData: React.Dispatch<React.SetStateAction<ScheduleData>>;
  pesertaOptions: { value: string; label: string }[] | null;
  onClose: () => void;
  onSubmit: () => void;
}) {
  function updateField(field: keyof ScheduleData, value: string) {
    setData((current) => ({ ...current, [field]: value }));
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-5">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b px-6 py-5">
            <div>
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="mt-1 text-sm text-gray-500">Masukkan informasi jadwal wawancara.</p>
            </div>
            <button onClick={onClose} className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100">
              ✕
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-5">
              {/* pilih peserta hanya kalau modal Add */}
              {pesertaOptions && (
                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-medium">Pilih Peserta</label>
                  <select
                    value={data.peserta_id}
                    onChange={(e) => updateField("peserta_id", e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                  >
                    <option value="">-- Pilih Peserta --</option>
                    {pesertaOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium">Interviewer</label>
                <select
                  value={data.interviewer}
                  onChange={(e) => updateField("interviewer", e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option value="">Pilih Interviewer</option>
                  <option>Kak Fitri</option>
                  <option>Pak Budi</option>
                  <option>Kak Andi</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Tanggal</label>
                <input
                  type="date"
                  value={data.tanggal}
                  onChange={(e) => updateField("tanggal", e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Jam</label>
                <input
                  type="time"
                  value={data.jam}
                  onChange={(e) => updateField("jam", e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Metode</label>
                <select
                  value={data.metode}
                  onChange={(e) => updateField("metode", e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option value="Offline">Offline</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="mb-2 block text-sm font-medium">Lokasi / Link Meeting</label>
                <input
                  type="text"
                  value={data.lokasi}
                  onChange={(e) => updateField("lokasi", e.target.value)}
                  placeholder="Meeting Room / Google Meet"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t px-6 py-5">
            <button onClick={onClose} className="rounded-xl border border-gray-300 px-5 py-2.5 hover:bg-gray-50">
              Batal
            </button>
            <button onClick={onSubmit} className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700">
              Simpan Jadwal
            </button>
          </div>
        </div>
      </div>
    </>
  );
}