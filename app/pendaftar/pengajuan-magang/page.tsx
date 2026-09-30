"use client";

import { useUser } from "@/components/pendaftar/UserContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function PengajuanMagangPage() {
  const { status, setStatus } = useUser();

  const [form, setForm] = useState({
    bidang: "",
    divisi: "",
    mulai: "",
    selesai: "",
    tujuan: "",
    kemampuan: "",
    pengalaman: "",
    catatan: "",
  });

  const [checkbox, setCheckbox] = useState({
    dataBenar: false,
    peraturan: false,
    rahasia: false,
    seleksi: false,
  });

  const [error, setError] = useState("");

  /* ================= LOAD DRAFT ================= */
  useEffect(() => {
    const draft = localStorage.getItem("draft-pengajuan");
    if (draft) setForm(JSON.parse(draft));

    const savedCheckbox = localStorage.getItem("draft-checkbox");
    if (savedCheckbox) setCheckbox(JSON.parse(savedCheckbox));
  }, []);

  /* ================= SAVE DRAFT ================= */
  useEffect(() => {
    localStorage.setItem("draft-pengajuan", JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    localStorage.setItem("draft-checkbox", JSON.stringify(checkbox));
  }, [checkbox]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCheckbox = (name: string) => {
    setCheckbox({
      ...checkbox,
      [name]: !checkbox[name as keyof typeof checkbox],
    });
  };

  /* ================= VALIDATION ================= */
  const isFormComplete = Object.values(form).every((v) => v.trim() !== "");
  const isCheckboxComplete = Object.values(checkbox).every(Boolean);
  const canSubmit = isFormComplete && isCheckboxComplete;

  const filledFields = Object.values(form).filter((v) => v.trim() !== "").length;
  const totalFields = Object.keys(form).length;
  const percentage = Math.round((filledFields / totalFields) * 100);

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("⚠ Semua field dan pernyataan wajib diisi!");
      return;
    }

    setError("");

    // ✅ Ambil session token
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) {
      setError("⚠ Gagal mengambil session. Silakan login ulang.");
      return;
    }

    const accessToken = sessionData.session?.access_token;

    console.log("TOKEN EXISTS?", !!accessToken);

    if (!accessToken) {
      setError("⚠ Session tidak ditemukan. Silakan login ulang.");
      return;
    }

    // ✅ Kirim ke backend
    const res = await fetch("/api/pengajuan/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        posisi: form.bidang,
        catatan: form.catatan,

        // field tambahan (opsional) untuk future
        bidang: form.bidang,
        divisi: form.divisi,
        mulai: form.mulai,
        selesai: form.selesai,
        tujuan: form.tujuan,
        kemampuan: form.kemampuan,
        pengalaman: form.pengalaman,
        pernyataan: checkbox,
      }),
    });

    const text = await res.text();

    console.log("SUBMIT STATUS:", res.status);
    console.log("SUBMIT BODY:", text);

    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { message: text };
    }

    if (!res.ok) {
      // ✅ tampilkan message + detail kalau ada
      const msg =
        (json?.message ?? "⚠ Pengajuan gagal dikirim.") +
        (json?.detail ? ` (${json.detail})` : "");
      setError(msg);
      return;
    }

    // ✅ Jika sukses, update UI lokal
    setStatus("mengajukan");

    // ✅ Hapus draft
    localStorage.removeItem("draft-pengajuan");
    localStorage.removeItem("draft-checkbox");

    alert("✅ Pengajuan berhasil dikirim!");
  };

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-sm font-medium mb-3">
            Pengajuan Magang
          </div>

          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Form Pengajuan Magang
          </h1>

          <p className="text-gray-500 mt-2">
            Lengkapi seluruh informasi pengajuan sebelum mengirim permohonan magang.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-gray-900">Progress Pengisian</h2>
              <p className="text-sm text-gray-500 mt-1">
                {filledFields} dari {totalFields} field telah diisi
              </p>
            </div>

            <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
          </div>

          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Form utama */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Informasi Pengajuan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bidang atau Posisi yang Diminati
              </label>
              <input
                name="bidang"
                value={form.bidang}
                onChange={handleChange}
                placeholder="Contoh: Frontend Developer, UI/UX Designer"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Divisi Tujuan
              </label>
              <input
                name="divisi"
                value={form.divisi}
                onChange={handleChange}
                placeholder="Contoh: IT Development"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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

        {/* Tujuan */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Tujuan dan Kemampuan
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tujuan Mengikuti Magang
              </label>
              <textarea
                name="tujuan"
                value={form.tujuan}
                onChange={handleChange}
                rows={4}
                placeholder="Jelaskan tujuan dan harapan kamu mengikuti program magang ini..."
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kemampuan yang Dimiliki
              </label>
              <textarea
                name="kemampuan"
                value={form.kemampuan}
                onChange={handleChange}
                rows={4}
                placeholder="Contoh: HTML, CSS, JavaScript, React, desain UI, komunikasi, dan lain-lain..."
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Pengalaman */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Pengalaman dan Catatan
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pengalaman Organisasi atau Kegiatan
              </label>
              <textarea
                name="pengalaman"
                value={form.pengalaman}
                onChange={handleChange}
                rows={4}
                placeholder="Jelaskan pengalaman organisasi, kepanitiaan, proyek, atau kegiatan lain yang relevan..."
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan Tambahan
              </label>
              <textarea
                name="catatan"
                value={form.catatan}
                onChange={handleChange}
                rows={3}
                placeholder="Tuliskan informasi tambahan jika diperlukan..."
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Pernyataan */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Pernyataan Persetujuan
          </h2>

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
                className="flex items-start gap-3 rounded-2xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checkbox[item.key as keyof typeof checkbox]}
                  onChange={() => handleCheckbox(item.key)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  {item.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full rounded-3xl px-6 py-4 text-base font-semibold transition-all duration-300 ${
            canSubmit
              ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.99]"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {canSubmit ? "Ajukan Magang" : "Lengkapi Form Terlebih Dahulu"}
        </button>
      </div>
    </div>
  );
}