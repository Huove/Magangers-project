"use client";

import { useMemo, useState, useEffect } from "react";
import ApplicantFilter from "@/components/admin/application/ApplicantFilter";
import ApplicantTable from "@/components/admin/application/ApplicantTable";
import ApplicantDrawer from "@/components/admin/application/ApplicantDrawer";
import { X, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Applicant } from "../../../types/applicant";

export type AdminDoc = {
  jenis: string;
  url: string | null;
  path: string;
  mime_type: string | null;
  size: number | null;
  uploaded_at: string;
};

export type ApplicantHistoryItem = {
  id: string;           // pengajuan_id
  tanggal: string;      // tanggal_pengajuan
  posisi: string;
  status: string;       // label
  raw_status: string;   // db status
  catatan: string | null;
  diproses_at: string | null;
};

export default function PelamarPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  // error list
  const [error, setError] = useState<string | null>(null);

  // FILTER
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Semua Status");
  const [position, setPosition] = useState("Semua Posisi");

  // DRAWER
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  // DOCS
  const [docs, setDocs] = useState<AdminDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  // HISTORY
  const [history, setHistory] = useState<ApplicantHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Admin info (debug forbidden)
  const [adminInfo, setAdminInfo] = useState<{
    user_id: string;
    email: string;
    role: string | null;
    nama_lengkap?: string | null;
  } | null>(null);
  const [adminInfoErr, setAdminInfoErr] = useState<string | null>(null);

  // MODAL TAMBAH (UI-only)
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    email: "",
    sekolah: "",
    jurusan: "",
    posisi: "",
    alamat: "",
    nohp: "",
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

  async function fetchAdminMe() {
    setAdminInfoErr(null);

    const token = await getToken();
    if (!token) {
      setAdminInfoErr("Session tidak ditemukan. Silakan login ulang.");
      return;
    }

    const res = await fetch("/api/admin/me", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const json = await safeJson(res);

    if (!res.ok) {
      setAdminInfoErr(
        (json?.message ?? "Gagal cek admin") + (json?.detail ? ` (${json.detail})` : "")
      );
      return;
    }

    setAdminInfo(json);
  }

  async function fetchApplicants() {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Session admin tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await fetch("/api/admin/pengajuan", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setError((json?.message ?? `Gagal load data (${res.status})`) + (json?.detail ? ` (${json.detail})` : ""));
        return;
      }

      setApplicants(json?.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function fetchApplicantDocs(pengajuanId: string) {
    setDocs([]);
    setDocsError(null);
    setDocsLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        setDocsError("Session admin tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await fetch(`/api/admin/pengajuan/${pengajuanId}/dokumen`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setDocsError((json?.message ?? `Gagal load dokumen (${res.status})`) + (json?.detail ? ` (${json.detail})` : ""));
        return;
      }

      setDocs(json?.data ?? []);
    } finally {
      setDocsLoading(false);
    }
  }

  async function fetchHistory(pesertaId: string) {
    setHistory([]);
    setHistoryError(null);
    setHistoryLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        setHistoryError("Session admin tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await fetch(`/api/admin/peserta/${pesertaId}/pengajuan`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setHistoryError((json?.message ?? `Gagal load history (${res.status})`) + (json?.detail ? ` (${json.detail})` : ""));
        return;
      }

      setHistory(json?.data ?? []);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await fetchAdminMe();
      await fetchApplicants();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredApplicants = useMemo(() => {
    return applicants.filter((item) => {
      const matchSearch = item.nama.toLowerCase().includes(search.toLowerCase());
      const matchStatus = status === "Semua Status" || item.status === status;
      const matchPosition = position === "Semua Posisi" || item.posisi === position;
      return matchSearch && matchStatus && matchPosition;
    });
  }, [applicants, search, status, position]);

  function openDrawer(applicant: Applicant) {
    setSelectedApplicant(applicant);
    setDrawerOpen(true);

    // ✅ docs pakai pengajuan terbaru
    if (applicant.pengajuan_id) fetchApplicantDocs(applicant.pengajuan_id);

    // ✅ history pakai peserta_id
    fetchHistory(applicant.id);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedApplicant(null);

    setDocs([]);
    setDocsError(null);
    setDocsLoading(false);

    setHistory([]);
    setHistoryError(null);
    setHistoryLoading(false);
  }

  async function updateStatus(newStatus: "Diterima" | "Ditolak" | "Revisi") {
    if (!selectedApplicant) return;

    const token = await getToken();
    if (!token) {
      alert("Session admin tidak ditemukan, silakan login ulang.");
      return;
    }

    // ✅ semua action harus pakai pengajuan terbaru
    const pengajuanId = selectedApplicant.pengajuan;
    if (!pengajuanId) {
      alert("Pengajuan terbaru tidak ditemukan untuk peserta ini.");
      return;
    }

    try {
      if (newStatus === "Diterima") {
        const res = await fetch(`/api/admin/pengajuan/${pengajuanId}/approve`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const j = await safeJson(res);
          alert((j?.message ?? "Gagal approve") + (j?.detail ? ` (${j.detail})` : ""));
          return;
        }
      }

      if (newStatus === "Ditolak") {
        const res = await fetch(`/api/admin/pengajuan/${pengajuanId}/reject`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const j = await safeJson(res);
          alert((j?.message ?? "Gagal reject") + (j?.detail ? ` (${j.detail})` : ""));
          return;
        }
      }

      if (newStatus === "Revisi") {
        const note = prompt("Masukkan catatan revisi untuk pendaftar:");
        if (!note) return;

        const res = await fetch(`/api/admin/pengajuan/${pengajuanId}/revisi`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ note }),
        });

        if (!res.ok) {
          const j = await safeJson(res);
          alert((j?.message ?? "Gagal revisi") + (j?.detail ? ` (${j.detail})` : ""));
          return;
        }
      }

      closeDrawer();
      await fetchApplicants();
    } catch (e) {
      alert("Gagal update status. Cek console/server.");
      console.error(e);
    }
  }

  function handleInputChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleAddApplicant() {
    alert("Fitur tambah pelamar masih UI-only. Kalau mau, bisa kita buat backend juga.");
    setAddModalOpen(false);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Pemeriksaan Pengajuan</h1>
        <p className="mt-2 text-gray-500">
          Kelola data pelamar dan lakukan pemeriksaan dokumen sebelum proses wawancara.
        </p>
      </div>

      <ApplicantFilter
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        position={position}
        setPosition={setPosition}
        onAdd={() => setAddModalOpen(true)}
      />

      {/* INFO LOGIN ADMIN */}
      {adminInfoErr && (
        <div className="my-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {adminInfoErr}
        </div>
      )}

      {adminInfo && adminInfo.role !== "admin" && (
        <div className="my-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Kamu sedang login sebagai: <b>{adminInfo.email}</b> (role: <b>{String(adminInfo.role)}</b>)
          <br />
          Ini bukan admin, jadi tombol approve/revisi/reject akan <b>Forbidden</b>.
          <br />
          User ID: <code>{adminInfo.user_id}</code>
        </div>
      )}

      {error && (
        <div className="my-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <ApplicantTable data={filteredApplicants} onDetail={openDrawer} />
      )}

      <ApplicantDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        applicant={selectedApplicant}
        onAccept={() => updateStatus("Diterima")}
        onReject={() => updateStatus("Ditolak")}
        onRevision={() => updateStatus("Revisi")}
        docs={docs}
        docsLoading={docsLoading}
        docsError={docsError}
        history={history}
        historyLoading={historyLoading}
        historyError={historyError}
      />

      {/* MODAL TAMBAH PELAMAR (UI-only) */}
      {addModalOpen && (
        <>
          <div
            onClick={() => setAddModalOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                    <UserPlus size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Tambah Pelamar</h2>
                    <p className="text-sm text-gray-500">Masukkan data pelamar baru</p>
                  </div>
                </div>

                <button
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto p-6">
                <div className="grid grid-cols-2 gap-5">
                  <FormInput
                    label="Nama Lengkap"
                    placeholder="Masukkan nama lengkap"
                    value={form.nama}
                    onChange={(v) => handleInputChange("nama", v)}
                  />
                  <FormInput
                    label="Email"
                    placeholder="contoh@email.com"
                    type="email"
                    value={form.email}
                    onChange={(v) => handleInputChange("email", v)}
                  />
                  <FormInput
                    label="Sekolah / Kampus"
                    placeholder="Nama sekolah atau kampus"
                    value={form.sekolah}
                    onChange={(v) => handleInputChange("sekolah", v)}
                  />
                  <FormInput
                    label="Jurusan"
                    placeholder="Contoh: RPL"
                    value={form.jurusan}
                    onChange={(v) => handleInputChange("jurusan", v)}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Posisi Magang
                    </label>
                    <select
                      value={form.posisi}
                      onChange={(e) => handleInputChange("posisi", e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                    >
                      <option value="">Pilih posisi</option>
                      <option>Frontend Developer</option>
                      <option>Backend Developer</option>
                      <option>UI/UX Designer</option>
                      <option>Mobile Developer</option>
                      <option>Data Analyst</option>
                    </select>
                  </div>

                  <FormInput
                    label="No. Handphone"
                    placeholder="08xxxxxxxxxx"
                    value={form.nohp}
                    onChange={(v) => handleInputChange("nohp", v)}
                  />

                  <div className="col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Alamat
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Masukkan alamat lengkap"
                      value={form.alamat}
                      onChange={(e) => handleInputChange("alamat", e.target.value)}
                      className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t px-6 py-5">
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 font-medium hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddApplicant}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
                >
                  Simpan Pelamar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FormInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
      />
    </div>
  );
}