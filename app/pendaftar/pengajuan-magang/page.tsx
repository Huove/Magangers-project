"use client";

import { useUser } from "@/components/pendaftar/UserContext";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

type MasterDivisiOption = {
  id: string;
  nama: string;
  deskripsi: string | null;
};

type MasterPosisiOption = {
  id: string;
  nama: string;
  deskripsi: string | null;
  divisiId: string;
  divisiNama: string;
};

export default function PengajuanMagangPage() {
  const { setStatus } = useUser();
  const router = useRouter();

  // =====================================================
  // MASTER DATA (DIVISI & POSISI)
  // =====================================================

  const [masterDivisi, setMasterDivisi] = useState<MasterDivisiOption[]>([]);
  const [masterPosisi, setMasterPosisi] = useState<MasterPosisiOption[]>([]);
  const [masterLoading, setMasterLoading] = useState(true);
  const [masterError, setMasterError] = useState("");

  // untuk migrasi draft lama (yang masih simpan "bidang/divisi" berupa teks)
  const [legacyDraft, setLegacyDraft] = useState<{ bidang?: string; divisi?: string } | null>(null);

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

  async function fetchMasterData() {
    setMasterLoading(true);
    setMasterError("");

    try {
      const token = await getToken();
      if (!token) {
        setMasterError("Session tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await fetch("/api/pendaftar/master-data", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        setMasterError((json?.message ?? "Gagal memuat master data") + (json?.detail ? ` (${json.detail})` : ""));
        return;
      }

      setMasterDivisi(json?.divisi ?? []);
      setMasterPosisi(json?.posisi ?? []);
    } catch (e) {
      setMasterError(e instanceof Error ? e.message : "Gagal memuat master data.");
    } finally {
      setMasterLoading(false);
    }
  }

  // =====================================================
  // FORM
  // =====================================================

  const [form, setForm] = useState({
    // BARU: simpan ID supaya konsisten dengan master data
    divisiId: "",
    posisiId: "",

    mulai: "",
    selesai: "",
    tujuan: "",
    kemampuan: "",
    pengalaman: "",
    catatan: "",
  });

  // =====================================================
  // CHECKBOX
  // =====================================================

  const [checkbox, setCheckbox] = useState({
    dataBenar: false,
    peraturan: false,
    rahasia: false,
    seleksi: false,
  });

  // =====================================================
  // STATE
  // =====================================================

  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // =====================================================
  // LOAD DRAFT + LOAD MASTER
  // =====================================================

  useEffect(() => {
    const draft = localStorage.getItem("draft-pengajuan");

    if (draft) {
      try {
        const parsed = JSON.parse(draft);

        // draft versi baru
        setForm((prev) => ({
          ...prev,
          divisiId: parsed.divisiId ?? "",
          posisiId: parsed.posisiId ?? "",

          mulai: parsed.mulai ?? "",
          selesai: parsed.selesai ?? "",
          tujuan: parsed.tujuan ?? "",
          kemampuan: parsed.kemampuan ?? "",
          pengalaman: parsed.pengalaman ?? "",
          catatan: parsed.catatan ?? "",
        }));

        // draft versi lama (teks bebas)
        if (!parsed.posisiId && (parsed.bidang || parsed.divisi)) {
          setLegacyDraft({
            bidang: parsed.bidang,
            divisi: parsed.divisi,
          });
        }
      } catch {
        console.error("Draft pengajuan tidak valid.");
      }
    }

    const savedCheckbox = localStorage.getItem("draft-checkbox");
    if (savedCheckbox) {
      try {
        setCheckbox(JSON.parse(savedCheckbox));
      } catch {
        console.error("Draft checkbox tidak valid.");
      }
    }

    fetchMasterData();
  }, []);

  // mapping draft lama -> id master (kalau match nama)
  useEffect(() => {
    if (masterLoading) return;
    if (!legacyDraft) return;
    if (masterError) return;

    setForm((prev) => {
      let next = { ...prev };

      if (!next.divisiId && legacyDraft.divisi) {
        const d = masterDivisi.find((x) => x.nama.toLowerCase() === legacyDraft.divisi!.toLowerCase());
        if (d) next.divisiId = d.id;
      }

      if (!next.posisiId && legacyDraft.bidang) {
        const p = masterPosisi.find((x) => x.nama.toLowerCase() === legacyDraft.bidang!.toLowerCase());
        if (p) {
          next.posisiId = p.id;
          if (!next.divisiId) next.divisiId = p.divisiId;
        }
      }

      return next;
    });

    setLegacyDraft(null);
  }, [masterLoading, masterError, legacyDraft, masterDivisi, masterPosisi]);

  // =====================================================
  // SAVE DRAFT
  // =====================================================

  useEffect(() => {
    localStorage.setItem("draft-pengajuan", JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    localStorage.setItem("draft-checkbox", JSON.stringify(checkbox));
  }, [checkbox]);

  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleDivisiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const divisiId = e.target.value;

    // kalau posisi yang dipilih tidak sesuai divisi baru, reset posisi
    setForm((prev) => {
      const currentPos = masterPosisi.find((p) => p.id === prev.posisiId);
      const posisiStillValid = currentPos ? currentPos.divisiId === divisiId : true;

      return {
        ...prev,
        divisiId,
        posisiId: posisiStillValid ? prev.posisiId : "",
      };
    });
  };

  const handlePosisiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const posisiId = e.target.value;
    const pos = masterPosisi.find((p) => p.id === posisiId) ?? null;

    setForm((prev) => ({
      ...prev,
      posisiId,
      // auto set divisi mengikuti posisi (biar konsisten)
      divisiId: pos?.divisiId ?? prev.divisiId,
    }));
  };

  const posisiOptions = useMemo(() => {
    if (!form.divisiId) return masterPosisi;
    return masterPosisi.filter((p) => p.divisiId === form.divisiId);
  }, [masterPosisi, form.divisiId]);

  // =====================================================
  // VALIDATION
  // =====================================================

  const isFormComplete = Object.values(form).every((v) => v.trim() !== "");
  const isCheckboxComplete = Object.values(checkbox).every(Boolean);

  const canSubmit =
    isFormComplete &&
    isCheckboxComplete &&
    !masterLoading &&
    !masterError;

  // =====================================================
  // PROGRESS
  // =====================================================

  const filledFields = Object.values(form).filter((v) => v.trim() !== "").length;
  const totalFields = Object.keys(form).length;

  const percentage = Math.round((filledFields / totalFields) * 100);

  // =====================================================
  // SCROLL TO TOP
  // =====================================================

  const scrollToTop = () => {
    const topElement = document.getElementById("pengajuan-top");

    if (topElement) {
      topElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  // =====================================================
  // KEMBALI KE BERANDA
  // =====================================================

  const handleBackToHome = () => {
    setShowSuccessModal(false);
    router.push("/pendaftar/beranda");
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("⚠ Semua field dan pernyataan wajib diisi!");
      return;
    }

    setError("");

    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();

      if (sessionErr) {
        setError("⚠ Gagal mengambil session. Silakan login ulang.");
        return;
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setError("⚠ Session tidak ditemukan. Silakan login ulang.");
        return;
      }

      const selectedPosisi = masterPosisi.find((p) => p.id === form.posisiId);
      const selectedDivisi =
        masterDivisi.find((d) => d.id === form.divisiId) ??
        (selectedPosisi ? masterDivisi.find((d) => d.id === selectedPosisi.divisiId) : null);

      if (!selectedPosisi || !selectedDivisi) {
        setError("⚠ Posisi/Divisi tidak valid. Silakan pilih ulang.");
        return;
      }

      const posisiNama = selectedPosisi.nama;
      const divisiNama = selectedDivisi.nama;

      const res = await fetch("/api/pengajuan/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          // kompatibel dengan backend lama (string)
          posisi: posisiNama,
          bidang: posisiNama,
          divisi: divisiNama,

          // optional: kalau suatu saat kamu mau simpan ID juga
          posisi_id: form.posisiId,
          divisi_id: form.divisiId,

          mulai: form.mulai,
          selesai: form.selesai,
          tujuan: form.tujuan,
          kemampuan: form.kemampuan,
          pengalaman: form.pengalaman,
          catatan: form.catatan,

          pernyataan: checkbox,
        }),
      });

      const text = await res.text();

      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = { message: text };
      }

      if (!res.ok) {
        const msg =
          (json?.message ?? "⚠ Pengajuan gagal dikirim.") +
          (json?.detail ? ` (${json.detail})` : "");
        setError(msg);
        return;
      }

      setStatus("mengajukan");

      localStorage.removeItem("draft-pengajuan");
      localStorage.removeItem("draft-checkbox");

      scrollToTop();

      setTimeout(() => {
        setShowSuccessModal(true);
      }, 500);
    } catch (error) {
      console.error("SUBMIT ERROR:", error);
      setError("⚠ Terjadi kesalahan saat mengirim pengajuan.");
    }
  };

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div id="pengajuan-top" className="min-h-screen bg-gray-50/60">
      <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        {/* HEADER */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            Pengajuan Magang
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Form Pengajuan Magang
          </h1>

          <p className="mt-2 text-gray-500">
            Lengkapi seluruh informasi pengajuan sebelum mengirim permohonan magang.
          </p>
        </div>

        {/* PROGRESS */}
        <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Progress Pengisian</h2>
              <p className="mt-1 text-sm text-gray-500">
                {filledFields} dari {totalFields} field telah diisi
              </p>
            </div>

            <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* INFORMASI PENGAJUAN */}
        <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-900">Informasi Pengajuan</h2>

          {(masterLoading || masterError) && (
            <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              {masterLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat pilihan divisi & posisi...
                </div>
              ) : (
                <div className="text-red-700">
                  Gagal memuat master data: {masterError}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* DIVISI */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Divisi Tujuan
              </label>

              <select
                value={form.divisiId}
                onChange={handleDivisiChange}
                disabled={masterLoading || !!masterError}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
              >
                <option value="">-- Pilih Divisi --</option>
                {masterDivisi.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nama}
                  </option>
                ))}
              </select>
            </div>

            <div />

            {/* POSISI */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bidang atau Posisi yang Diminati
              </label>

              <select
                value={form.posisiId}
                onChange={handlePosisiChange}
                disabled={masterLoading || !!masterError}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
              >
                <option value="">
                  {form.divisiId ? "-- Pilih Posisi --" : "-- Pilih Posisi (boleh pilih divisi dulu) --"}
                </option>

                {posisiOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama} — {p.divisiNama}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-gray-500">
                Pilihan ini otomatis mengikuti master data dari admin.
              </p>
            </div>

            {/* TANGGAL */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tanggal Mulai
              </label>
              <input
                type="date"
                name="mulai"
                value={form.mulai}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tanggal Selesai
              </label>
              <input
                type="date"
                name="selesai"
                value={form.selesai}
                onChange={handleChange}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* TUJUAN DAN KEMAMPUAN */}
        <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-900">Tujuan dan Kemampuan</h2>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tujuan Mengikuti Magang
              </label>
              <textarea
                name="tujuan"
                value={form.tujuan}
                onChange={handleChange}
                rows={4}
                placeholder="Jelaskan tujuan dan harapan kamu mengikuti program magang ini..."
                className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Kemampuan yang Dimiliki
              </label>
              <textarea
                name="kemampuan"
                value={form.kemampuan}
                onChange={handleChange}
                rows={4}
                placeholder="Contoh: HTML, CSS, JavaScript, React, desain UI, komunikasi, dan lain-lain..."
                className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* PENGALAMAN DAN CATATAN */}
        <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-900">Pengalaman dan Catatan</h2>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Pengalaman Organisasi atau Kegiatan
              </label>
              <textarea
                name="pengalaman"
                value={form.pengalaman}
                onChange={handleChange}
                rows={4}
                placeholder="Jelaskan pengalaman organisasi, kepanitiaan, proyek, atau kegiatan lain yang relevan..."
                className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Catatan Tambahan
              </label>
              <textarea
                name="catatan"
                value={form.catatan}
                onChange={handleChange}
                rows={3}
                placeholder="Tuliskan informasi tambahan jika diperlukan..."
                className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        {/* PERNYATAAN */}
        <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-900">Pernyataan Persetujuan</h2>

          <div className="space-y-4">
            {[
              {
                key: "dataBenar",
                text: "Saya menyatakan bahwa seluruh data yang dimasukkan adalah benar dan dapat dipertanggungjawabkan.",
              },
              {
                key: "peraturan",
                text: "Saya bersedia mengikuti seluruh peraturan dan ketentuan yang berlaku di perusahaan.",
              },
              {
                key: "rahasia",
                text: "Saya bersedia menjaga kerahasiaan data dan informasi perusahaan selama menjalani magang.",
              },
              {
                key: "seleksi",
                text: "Saya bersedia mengikuti proses seleksi, verifikasi, dan wawancara apabila diperlukan.",
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={checkbox[item.key as keyof typeof checkbox]}
                  onChange={() =>
                    setCheckbox((prev) => ({
                      ...prev,
                      [item.key]: !prev[item.key as keyof typeof checkbox],
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm leading-relaxed text-gray-700">
                  {item.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full rounded-3xl px-6 py-4 text-base font-semibold transition-all duration-300 ${
            canSubmit
              ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99]"
              : "cursor-not-allowed bg-gray-200 text-gray-500"
          }`}
        >
          {canSubmit ? "Ajukan Magang" : "Lengkapi Form Terlebih Dahulu"}
        </button>
      </div>

      {/* SUCCESS POPUP */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={handleBackToHome}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleBackToHome}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={36} className="text-emerald-600" />
            </div>

            <div className="mt-5 text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Pengajuan Berhasil!
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Data pengajuan magang kamu telah berhasil dikirim. Silakan menunggu proses verifikasi dan informasi selanjutnya dari pihak terkait.
              </p>

              <button
                type="button"
                onClick={handleBackToHome}
                className="mt-7 w-full rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 