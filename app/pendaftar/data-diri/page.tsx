// app/pendaftar/data-diri/page.tsx
"use client";

import DokumenUploaderSection from "@/components/pendaftar/DokumenUploaderSection";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/components/pendaftar/UserContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Loader2,
  Save,
  UserRound,
} from "lucide-react";

type FormState = {
  /* DATA PRIBADI */
  nama: string;
  nik: string;
  tempat: string;
  tanggal: string;
  gender: string;
  alamat: string;
  kota: string;
  provinsi: string;
  email: string;
  hp: string;

  /* DATA PENDIDIKAN */
  jenjang: string;
  sekolah: string;
  jurusan: string;
  kelas: string;
  nisn: string;
  pembimbing: string;
  hpPembimbing: string;
};

const EMPTY_FORM: FormState = {
  nama: "",
  nik: "",
  tempat: "",
  tanggal: "",
  gender: "",
  alamat: "",
  kota: "",
  provinsi: "",
  email: "",
  hp: "",

  jenjang: "",
  sekolah: "",
  jurusan: "",
  kelas: "",
  nisn: "",
  pembimbing: "",
  hpPembimbing: "",
};

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function toStr(v: any) {
  return v === null || v === undefined ? "" : String(v);
}

function pesertaToForm(peserta: any): FormState {
  return {
    nama: toStr(peserta?.nama_lengkap),
    email: toStr(peserta?.email),
    hp: toStr(peserta?.nomor_hp),
    nik: toStr(peserta?.nik),
    tempat: toStr(peserta?.tempat_lahir),
    tanggal: toStr(peserta?.tanggal_lahir), // biasanya sudah "YYYY-MM-DD"
    gender: toStr(peserta?.jenis_kelamin),
    alamat: toStr(peserta?.alamat),
    kota: toStr(peserta?.kota),
    provinsi: toStr(peserta?.provinsi),

    jenjang: toStr(peserta?.jenjang),
    sekolah: toStr(peserta?.sekolah),
    jurusan: toStr(peserta?.jurusan),
    kelas: toStr(peserta?.kelas),
    nisn: toStr(peserta?.nisn),
    pembimbing: toStr(peserta?.pembimbing),
    hpPembimbing: toStr(peserta?.hp_pembimbing),
  };
}

function isComplete(data: FormState) {
  return Object.values(data).every((v) => v.trim() !== "");
}

export default function DataDiriPage() {
  const router = useRouter();
  const { photo, setPhoto, setUserData } = useUser();

  const [genderOpen, setGenderOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string>("");

  // kalau DB sudah lengkap → tampilkan “lanjut pengajuan”
  // user masih bisa klik “Edit Data Diri”
  const [editMode, setEditMode] = useState(false);

  async function fetchMeAndFillForm() {
    setLoading(true);
    setPageError("");

    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        setPageError("Gagal mengambil session. Silakan login ulang.");
        return;
      }

      const token = sessionData.session?.access_token;
      if (!token) {
        setPageError("Session tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await fetch("/api/pendaftar/me", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = await safeJson(res);

      if (!res.ok) {
        const msg =
          (json?.message ?? "Gagal memuat data diri.") +
          (json?.detail ? ` (${json.detail})` : "");
        setPageError(msg);
        return;
      }

      const peserta = json?.peserta ?? null;

      // kalau belum ada row peserta, tetap tampil form kosong
      if (!peserta) {
        setForm(EMPTY_FORM);
        return;
      }

      const normalized = pesertaToForm(peserta);

      setForm(normalized);

      // update context (biar halaman lain yang pakai userData ikut keisi)
      setUserData({
        pribadi: normalized,
        pendidikan: normalized,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMeAndFillForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // lock scroll saat modal muncul (tetap kayak kode kamu)
  useEffect(() => {
    const main = document.querySelector("main") as HTMLElement | null;

    if (modalMessage && main) {
      main.style.overflow = "hidden";
    } else if (main) {
      main.style.overflow = "auto";
    }

    return () => {
      if (main) main.style.overflow = "auto";
    };
  }, [modalMessage]);

  // close gender dropdown kalau klik luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setGenderOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const completeFromDB = useMemo(() => isComplete(form), [form]);
  const showDoneView = !loading && !pageError && completeFromDB && !editMode;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "hp" || name === "hpPembimbing") {
      const onlyNumbers = value.replace(/\D/g, "");
      setForm((prev) => ({ ...prev, [name]: onlyNumbers } as FormState));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value } as FormState));
  };

  /* ================= PHOTO ================= */

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ================= SAVE ================= */

  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    const ok = isComplete(form);

    if (!ok) {
      setModalMessage(
        "Beberapa data belum lengkap. Silakan lengkapi seluruh field terlebih dahulu."
      );
      return;
    }

    setSaving(true);
    setPageError("");

    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        setModalMessage("Gagal mengambil session. Silakan login ulang.");
        return;
      }

      const token = sessionData.session?.access_token;
      if (!token) {
        setModalMessage("Session tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await fetch("/api/pendaftar/data-diri", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const json = await safeJson(res);

      if (!res.ok) {
        const msg =
          (json?.message ?? "Gagal menyimpan data diri.") +
          (json?.detail ? ` (${json.detail})` : "");
        setModalMessage(msg);
        return;
      }

      // sukses -> update context & langsung tampil mode “lanjut pengajuan”
      setUserData({
        pribadi: form,
        pendidikan: form,
      });

      setEditMode(false);
      setModalMessage(null);

      // optional: sync ulang dari DB (biar benar-benar pasti)
      // tapi biar UI gak "kedip", ini bisa kamu comment kalau gak perlu
      await fetchMeAndFillForm();
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DONE VIEW
  // =========================
  if (showDoneView) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f8fafc] px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Soft decorative background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-100/50 blur-3xl"
        />

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
          <section className="w-full overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_24px_80px_-36px_rgba(30,64,175,0.24)]">
            {/* Top accent */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500" />

            <div className="px-5 py-8 sm:px-10 sm:py-11">
              <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 scale-125 rounded-full bg-emerald-100/70 blur-xl" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-[26px] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-600 shadow-sm shadow-emerald-900/5">
                    <CheckCircle2 size={38} strokeWidth={1.8} />
                  </div>
                  <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-[3px] border-white bg-emerald-500" />
                </div>

                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  DATA BERHASIL DILENGKAPI
                </span>

                <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Data diri kamu sudah lengkap!
                </h1>

                <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500 sm:text-base">
                  Terima kasih sudah melengkapi informasi diri. Selangkah lagi, kamu bisa melanjutkan proses pengajuan magang.
                </p>

                {/* Progress overview */}
                <div className="mt-8 grid w-full gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-left sm:grid-cols-2 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <CheckCircle2 size={19} />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-semibold text-slate-800">Data diri</p>
                      <p className="mt-1 text-xs leading-5 text-emerald-700">Sudah lengkap dan tersimpan</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <ArrowRight size={19} />
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-semibold text-slate-800">Pengajuan magang</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Lanjutkan untuk mengisi pengajuan</p>
                    </div>
                  </div>
                </div>

                <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={() => router.push("/pendaftar/pengajuan-magang")}
                    className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25 active:translate-y-0 active:scale-[0.99] sm:w-auto"
                  >
                    Lanjut ke Pengajuan Magang
                    <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition duration-200 hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-700 active:scale-[0.99] sm:w-auto"
                  >
                    Edit Data Diri
                  </button>
                </div>

                <p className="mt-6 text-xs leading-5 text-slate-400">
                  Status kelengkapan data diperiksa dari database secara otomatis.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  // =========================
  // FORM VIEW (UI kamu)
  // =========================
  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      {/* MODAL */}
      {modalMessage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-md">
          <div className="w-full max-w-sm overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex flex-col items-center px-6 pb-7 pt-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <UserRound size={27} />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                Periksa Data
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                {modalMessage}
              </p>
            </div>

            <div className="border-t border-slate-100 bg-slate-50/80 p-4">
              <button
                onClick={() => setModalMessage(null)}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-blue-700 active:scale-[0.98]"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR / LOADING */}
      {(loading || pageError) && (
        <div className="mx-auto mb-6 max-w-7xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {loading ? (
            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat data diri dari database...
            </div>
          ) : (
            <div className="text-sm text-red-600">{pageError}</div>
          )}
        </div>
      )}

      {/* =====================================================
          PAGE HEADER (tetap sesuai file kamu: memang kosong)
      ====================================================== */}
      <div className="mx-auto mb-7 max-w-7xl">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Profil Peserta</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Lengkapi Data Diri</h1>
          </div>
        </div>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">Pastikan informasi pribadi, pendidikan, dan dokumen kamu sudah benar sebelum melanjutkan pengajuan magang.</p>
      </div>

      {/* =====================================================
          MAIN LAYOUT
      ====================================================== */}
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-7">
        {/* PROFILE CARD */}
        <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-[280px]">
          <div className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_12px_36px_-24px_rgba(15,23,42,0.25)] transition-shadow duration-300 hover:shadow-[0_18px_45px_-24px_rgba(15,23,42,0.28)]">
            <div className="h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600" />

            <div className="-mt-14 px-6 pb-6">
              <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-[26px] border-4 border-white bg-gradient-to-br from-slate-100 to-slate-200 shadow-xl shadow-slate-900/10 ring-1 ring-slate-100">
                {photo ? (
                  <img
                    src={photo}
                    alt="Foto profil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-neutral-400">
                    <Camera size={38} />
                  </div>
                )}
              </div>

              <div className="mt-5 text-center">
                <p className="break-words text-base font-semibold tracking-tight text-slate-900">
                  {form.nama || "Nama Peserta"}
                </p>

                <p className="mt-1 text-xs font-medium text-slate-400">Peserta Magang</p>
              </div>

              <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 active:scale-[0.98]">
                <Camera size={16} />
                {photo ? "Ganti Foto" : "Pilih Foto"}
                <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              </label>

              <div className="mt-5 rounded-2xl border border-blue-100/80 bg-blue-50/70 p-4">
                <p className="text-xs font-medium text-blue-700">Tips</p>
                <p className="mt-1 text-xs leading-relaxed text-blue-600/80">
                  Gunakan foto yang jelas dan mudah dikenali untuk kebutuhan administrasi peserta.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="min-w-0 flex-1 space-y-6">
          {/* DATA PRIBADI */}
          <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_36px_-24px_rgba(15,23,42,0.22)] sm:p-7">
            <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100/80">
                <UserRound size={19} />
              </div>

              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Data Pribadi</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Informasi dasar mengenai identitas peserta magang.
                </p>
              </div>
            </div>

            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              <InputField name="nama" label="Nama Lengkap" value={form.nama} onChange={handleChange} required />
              <InputField name="nik" label="NIK" value={form.nik} onChange={handleChange} required />
              <InputField name="tempat" label="Tempat Lahir" value={form.tempat} onChange={handleChange} required />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Tanggal Lahir <span className="ml-1 text-red-400">*</span>
                </label>

                <input
                  type="date"
                  name="tanggal"
                  value={form.tanggal}
                  onChange={handleChange}
                  className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-700 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/70"
                />
              </div>

              <div className="relative sm:col-span-2" ref={dropdownRef}>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Jenis Kelamin <span className="ml-1 text-red-400">*</span>
                </label>

                <button
                  type="button"
                  onClick={() => setGenderOpen(!genderOpen)}
                  className="flex h-[50px] w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-left text-sm text-slate-700 outline-none transition duration-200 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/70"
                >
                  <span className={form.gender ? "text-neutral-700" : "text-neutral-400"}>
                    {form.gender || "Pilih jenis kelamin"}
                  </span>

                  <ChevronDown
                    size={18}
                    className={`text-neutral-400 transition-transform ${genderOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {genderOpen && (
                  <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                    {["Laki-laki", "Perempuan"].map((gender) => (
                      <button
                        type="button"
                        key={gender}
                        onClick={() => {
                          setForm((prev) => ({ ...prev, gender }));
                          setGenderOpen(false);
                        }}
                        className="w-full rounded-xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <InputField name="alamat" label="Alamat Lengkap" value={form.alamat} onChange={handleChange} required />
              </div>

              <InputField name="kota" label="Kota" value={form.kota} onChange={handleChange} required />
              <InputField name="provinsi" label="Provinsi" value={form.provinsi} onChange={handleChange} required />
              <InputField name="email" label="Email" type="email" value={form.email} onChange={handleChange} required />
              <InputField name="hp" label="No. HP Aktif" value={form.hp} onChange={handleChange} required />
            </div>
          </section>

          {/* PENDIDIKAN */}
          <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_36px_-24px_rgba(15,23,42,0.22)] sm:p-7">
            <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100/80">
                <GraduationCap size={20} />
              </div>

              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Data Pendidikan</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Informasi sekolah atau kampus dan pembimbing peserta.
                </p>
              </div>
            </div>

            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              <InputField name="jenjang" label="Jenjang Pendidikan" value={form.jenjang} onChange={handleChange} required />
              <InputField name="sekolah" label="Nama Sekolah / Kampus" value={form.sekolah} onChange={handleChange} required />
              <InputField name="jurusan" label="Jurusan" value={form.jurusan} onChange={handleChange} required />
              <InputField name="kelas" label="Kelas / Semester" value={form.kelas} onChange={handleChange} required />
              <InputField name="nisn" label="Nomor Induk" value={form.nisn} onChange={handleChange} required />
              <InputField name="pembimbing" label="Nama Pembimbing" value={form.pembimbing} onChange={handleChange} required />

              <div className="sm:col-span-2">
                <InputField
                  name="hpPembimbing"
                  label="No. HP Pembimbing"
                  value={form.hpPembimbing}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </section>

          {/* DOKUMEN */}
          <DokumenUploaderSection />

          {/* SAVE BUTTON */}
          <div className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} />}
              {saving ? "Menyimpan..." : "Simpan Data"}
            </button>

            <p className="mt-3 text-center text-xs text-neutral-400">
              Pastikan seluruh informasi yang dimasukkan sudah benar sebelum menyimpan.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   INPUT COMPONENT
============================================================ */

function InputField({
  name,
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  name: keyof FormState;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={String(name)}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>

      <input
        id={String(name)}
        name={String(name)}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={`Masukkan ${label.toLowerCase()}`}
        className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 text-sm text-slate-700 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/70"
      />
    </div>
  );
}