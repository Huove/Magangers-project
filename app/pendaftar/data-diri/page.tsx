"use client";

import DokumenUploaderSection from "@/components/pendaftar/DokumenUploaderSection";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/components/pendaftar/UserContext";
import { useState, useEffect, useRef } from "react";
import {
  Camera,
  ChevronDown,
  FileText,
  X,
  CheckCircle2,
  UserRound,
  GraduationCap,
  Files,
  Save,
  Upload,
} from "lucide-react";

export default function DataDiriPage() {
  const {
    photo,
    setPhoto,
    userData,
    setUserData,
    documents,
    setDocuments,
  } = useUser();

  const [genderOpen, setGenderOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    /* DATA PRIBADI */
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

    /* DATA PENDIDIKAN */
    jenjang: "",
    sekolah: "",
    jurusan: "",
    kelas: "",
    nisn: "",
    pembimbing: "",
    hpPembimbing: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    const draft = localStorage.getItem("draft-data-diri");

    if (draft) {
      try {
        setForm(JSON.parse(draft));
      } catch {
        console.log("Draft data diri tidak valid.");
      }
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "draft-data-diri",
      JSON.stringify(form)
    );
  }, [form]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setGenderOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  useEffect(() => {
    const main = document.querySelector(
      "main"
    ) as HTMLElement | null;

    if (modalMessage && main) {
      main.style.overflow = "hidden";
    } else if (main) {
      main.style.overflow = "auto";
    }

    return () => {
      if (main) {
        main.style.overflow = "auto";
      }
    };
  }, [modalMessage]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    if (
      name === "hp" ||
      name === "hpPembimbing"
    ) {
      const onlyNumbers = value.replace(/\D/g, "");

      setForm((prev) => ({
        ...prev,
        [name]: onlyNumbers,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ================= PHOTO ================= */

  const handlePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  /* ================= DOCUMENT ================= */

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setDocuments({
        ...documents,
        [key]: reader.result as string,
      });
    };

    reader.readAsDataURL(file);
  };

  /* ================= SAVE ================= */

const handleConfirm = async () => {
  const isComplete = Object.values(form).every((value) => value.trim() !== "");

  if (!isComplete) {
    setError("Masih ada data yang belum lengkap. Silakan periksa kembali.");
    setModalMessage(
      "Beberapa data belum lengkap. Silakan lengkapi seluruh field terlebih dahulu."
    );
    return;
  }

  setError("");

  // ambil token login user
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) {
    setError("Gagal mengambil session. Silakan login ulang.");
    setModalMessage("Gagal mengambil session. Silakan login ulang.");
    return;
  }

  const token = sessionData.session?.access_token;
  if (!token) {
    setError("Session tidak ditemukan. Silakan login ulang.");
    setModalMessage("Session tidak ditemukan. Silakan login ulang.");
    return;
  }

  // simpan ke DB lewat API baru
  const res = await fetch("/api/pendaftar/data-diri", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(form),
  });

  let json: any = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { message: text };
  }

  if (!res.ok) {
    const msg =
      (json?.message ?? "Gagal menyimpan data diri.") +
      (json?.detail ? ` (${json.detail})` : "");
    setError(msg);
    setModalMessage(msg);
    return;
  }

  // kalau sukses: update context & bersihkan draft
  setUserData({
    pribadi: form,
    pendidikan: form,
  });

  localStorage.removeItem("draft-data-diri");

  const main = document.querySelector("main");
  main?.scrollTo({ top: 0, behavior: "smooth" });

  setModalMessage("Data diri berhasil disimpan!");
};

  /* ================= DOCUMENT DATA ================= */

  const documentList = [
    {
      key: "kartuPelajar",
      label: "Kartu Pelajar / Mahasiswa",
      description:
        "Kartu identitas pelajar atau mahasiswa.",
    },
    {
      key: "ktp",
      label: "KTP / KK",
      description:
        "Kartu identitas atau kartu keluarga.",
    },
    {
      key: "cv",
      label: "Curriculum Vitae",
      description:
        "CV terbaru peserta magang.",
    },
    {
      key: "suratPengantar",
      label: "Surat Pengantar",
      description:
        "Surat pengantar dari sekolah atau kampus.",
    },
    {
      key: "pasFoto",
      label: "Pas Foto",
      description:
        "Pas foto terbaru peserta.",
    },
  ];

  const uploadedDocuments =
    Object.values(documents).filter(Boolean).length;

  const totalDocuments = documentList.length;

  const percentage = Math.round(
    (uploadedDocuments / totalDocuments) * 100
  );

  const isDocumentsComplete =
    uploadedDocuments === totalDocuments;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8">

      {modalMessage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 px-4 backdrop-blur-sm">

          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl">

            <div className="flex flex-col items-center px-6 pb-6 pt-7 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                {modalMessage.includes(
                  "berhasil"
                ) ? (
                  <CheckCircle2 size={27} />
                ) : (
                  <UserRound size={27} />
                )}
              </div>

              <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                {modalMessage.includes(
                  "berhasil"
                )
                  ? "Berhasil"
                  : "Data Belum Lengkap"}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                {modalMessage}
              </p>

            </div>

            <div className="border-t border-neutral-100 bg-neutral-50 p-4">

              <button
                onClick={() =>
                  setModalMessage(null)
                }
                className="w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]"
              >
                Mengerti
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mx-auto mb-8 max-w-7xl">

        <div className="flex items-center gap-3">

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-600">
            </p>

            <h1 className="mt-0.5 text-2xl font-semibold text-neutral-900">
            </h1>

          </div>

        </div>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500">
        </p>

      </div>

      {/* =====================================================
          MAIN LAYOUT
      ====================================================== */}

      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-start">

        {/* =====================================================
            PROFILE CARD
        ====================================================== */}

        <aside className="w-full shrink-0 lg:w-[280px]">

          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

            {/* HEADER */}

            <div className="h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600" />

            {/* PROFILE */}

            <div className="-mt-14 px-6 pb-6">

              <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-3xl border-4 border-white bg-gradient-to-br from-neutral-100 to-neutral-200 shadow-lg">

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

                <p className="text-base font-semibold text-neutral-900">
                  {form.nama ||
                    "Nama Peserta"}
                </p>

                <p className="mt-1 text-xs text-neutral-400">
                  Peserta Magang
                </p>

              </div>

              <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]">

                <Camera size={16} />

                {photo
                  ? "Ganti Foto"
                  : "Pilih Foto"}

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handlePhotoChange}
                />

              </label>

              <div className="mt-5 rounded-2xl bg-blue-50/70 p-4">

                <p className="text-xs font-medium text-blue-700">
                  Tips
                </p>

                <p className="mt-1 text-xs leading-relaxed text-blue-600/80">
                  Gunakan foto yang jelas dan
                  mudah dikenali untuk kebutuhan
                  administrasi peserta.
                </p>

              </div>

            </div>

          </div>

        </aside>

        {/* =====================================================
            CONTENT
        ====================================================== */}

        <main className="min-w-0 flex-1 space-y-6">

          {/* ===================================================
              DATA PRIBADI
          ==================================================== */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">

            <div className="mb-6 flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UserRound size={19} />
              </div>

              <div>

                <h2 className="text-lg font-semibold text-neutral-900">
                  Data Pribadi
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Informasi dasar mengenai identitas
                  peserta magang.
                </p>

              </div>

            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              {/* NAMA */}

              <InputField
                name="nama"
                label="Nama Lengkap"
                value={form.nama}
                onChange={handleChange}
                required
              />

              {/* NIK */}

              <InputField
                name="nik"
                label="NIK"
                value={form.nik}
                onChange={handleChange}
                required
              />

              {/* TEMPAT */}

              <InputField
                name="tempat"
                label="Tempat Lahir"
                value={form.tempat}
                onChange={handleChange}
                required
              />

              {/* TANGGAL */}

              <div>

                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Tanggal Lahir
                </label>

                <input
                  type="date"
                  name="tanggal"
                  value={form.tanggal}
                  onChange={handleChange}
                  className="h-12 w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                />

              </div>

              {/* GENDER */}

              <div
                className="relative sm:col-span-2"
                ref={dropdownRef}
              >

                <label className="mb-2 block text-sm font-medium text-neutral-700">
                  Jenis Kelamin
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setGenderOpen(!genderOpen)
                  }
                  className="flex h-12 w-full items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 text-left text-sm text-neutral-700 outline-none transition hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                >

                  <span
                    className={
                      form.gender
                        ? "text-neutral-700"
                        : "text-neutral-400"
                    }
                  >
                    {form.gender ||
                      "Pilih jenis kelamin"}
                  </span>

                  <ChevronDown
                    size={18}
                    className={`text-neutral-400 transition-transform ${
                      genderOpen
                        ? "rotate-180"
                        : ""
                    }`}
                  />

                </button>

                {genderOpen && (
                  <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1 shadow-xl">

                    {[
                      "Laki-laki",
                      "Perempuan",
                    ].map((gender) => (
                      <button
                        type="button"
                        key={gender}
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            gender,
                          }));

                          setGenderOpen(false);
                        }}
                        className="w-full rounded-xl px-4 py-3 text-left text-sm text-neutral-700 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        {gender}
                      </button>
                    ))}

                  </div>
                )}

              </div>

              {/* ALAMAT */}

              <div className="sm:col-span-2">

                <InputField
                  name="alamat"
                  label="Alamat Lengkap"
                  value={form.alamat}
                  onChange={handleChange}
                  required
                />

              </div>

              {/* KOTA */}

              <InputField
                name="kota"
                label="Kota"
                value={form.kota}
                onChange={handleChange}
                required
              />

              {/* PROVINSI */}

              <InputField
                name="provinsi"
                label="Provinsi"
                value={form.provinsi}
                onChange={handleChange}
                required
              />

              {/* EMAIL */}

              <InputField
                name="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />

              {/* HP */}

              <InputField
                name="hp"
                label="No. HP Aktif"
                value={form.hp}
                onChange={handleChange}
                required
              />

            </div>

          </section>

          {/* ===================================================
              PENDIDIKAN
          ==================================================== */}

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">

            <div className="mb-6 flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <GraduationCap size={20} />
              </div>

              <div>

                <h2 className="text-lg font-semibold text-neutral-900">
                  Data Pendidikan
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Informasi sekolah atau kampus dan
                  pembimbing peserta.
                </p>

              </div>

            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              <InputField
                name="jenjang"
                label="Jenjang Pendidikan"
                value={form.jenjang}
                onChange={handleChange}
                required
              />

              <InputField
                name="sekolah"
                label="Nama Sekolah / Kampus"
                value={form.sekolah}
                onChange={handleChange}
                required
              />

              <InputField
                name="jurusan"
                label="Jurusan"
                value={form.jurusan}
                onChange={handleChange}
                required
              />

              <InputField
                name="kelas"
                label="Kelas / Semester"
                value={form.kelas}
                onChange={handleChange}
                required
              />

              <InputField
                name="nisn"
                label="Nomor Induk"
                value={form.nisn}
                onChange={handleChange}
                required
              />

              <InputField
                name="pembimbing"
                label="Nama Pembimbing"
                value={form.pembimbing}
                onChange={handleChange}
                required
              />

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

          {/* ===================================================
              DOKUMEN
          ==================================================== */}

        <DokumenUploaderSection />

          {/* ===================================================
              SAVE BUTTON
          ==================================================== */}

          <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">

            <button
              onClick={handleConfirm}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 hover:shadow-xl active:scale-[0.99]"
            >

              <Save size={18} />

              Simpan Data

            </button>

            <p className="mt-3 text-center text-xs text-neutral-400">
              Pastikan seluruh informasi yang
              dimasukkan sudah benar sebelum
              menyimpan.
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
  name: string;
  label: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-neutral-700"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-400">
            *
          </span>
        )}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={`Masukkan ${label.toLowerCase()}`}
        className="h-12 w-full rounded-2xl border border-neutral-200 bg-neutral-50/50 px-4 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 hover:bg-white focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />

    </div>
  );
}