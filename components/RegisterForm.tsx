"use client";

import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  GraduationCap,
  Rocket,
  BarChart3,
} from "lucide-react";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { supabase } from "@/lib/supabase";
import OtpModal from "@/components/OtpModal";

const FEATURES = [
  {
    icon: GraduationCap,
    color: "bg-brand-blue",
    title: "Kesempatan Terpercaya",
    subtitle: "Dari Perusahaan Terbaik",
  },
  {
    icon: Rocket,
    color: "bg-brand-orange",
    title: "Pengalaman Berkualitas",
    subtitle: "Tingkatkan Skill & Kompetensi",
  },
  {
    icon: BarChart3,
    color: "bg-brand-green",
    title: "Masa Depan Lebih Cerah",
    subtitle: "Persiapkan Kariermu Sekarang",
  },
];

// Samakan dengan panjang Email OTP pada pengaturan Supabase Auth.
const EMAIL_OTP_LENGTH = 8;
const RESEND_SECONDS = 60;

function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    const authError = error as { code?: string; status?: number; message?: string };
    if (authError.status === 429 || authError.code === "over_email_send_rate_limit" || authError.code === "over_request_rate_limit") {
      return "Terlalu banyak permintaan. Tunggu beberapa saat sebelum mencoba lagi.";
    }
    if (authError.code === "otp_expired") {
      return "Kode salah atau sudah kedaluwarsa. Gunakan kode terbaru atau kirim ulang.";
    }
    if (authError.message) return authError.message;
  }
  return fallback;
}

export default function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  // Simpan email yang benar-benar dipakai signUp, terpisah dari input formulir.
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const registerInFlight = useRef(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (registerInFlight.current) return;
    setError("");
    setPasswordError("");

    const formData = new FormData(e.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const nomorHp = phone.trim();

    if (!fullName || !email || !nomorHp) {
      setError("Nama lengkap, email, dan nomor handphone wajib diisi.");
      return;
    }
    // Membuka modal yang ditutup tidak perlu membuat akun/mengirim email lagi.
    if (verificationEmail === email) {
      setShowOtpModal(true);
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Password dan konfirmasi password tidak cocok.");
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password minimal 8 karakter.");
      return;
    }

    registerInFlight.current = true;
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nama_lengkap: fullName, nomor_hp: nomorHp },
        },
      });
      if (authError) throw authError;
      if (!data.user) throw new Error("Pendaftaran belum berhasil. Silakan coba lagi.");

      // Pembuatan profiles dan peserta tetap ditangani trigger database proyek.
      // Saat Confirm email aktif, signUp belum memberikan session.
      if (data.session && data.user.email_confirmed_at) {
        router.replace("/pendaftar/beranda");
        router.refresh();
        return;
      }

      setVerificationEmail(email);
      setResendAvailableAt(Date.now() + RESEND_SECONDS * 1000);
      setPassword("");
      setConfirmPassword("");
      setShowOtpModal(true);
    } catch (err) {
      setError(getAuthErrorMessage(err, "Terjadi kesalahan saat melakukan registrasi."));
    } finally {
      registerInFlight.current = false;
      setLoading(false);
    }
  }

  async function handleVerifyOtp(code: string): Promise<void> {
    if (!verificationEmail) throw new Error("Email verifikasi belum tersedia. Silakan daftar terlebih dahulu.");
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: verificationEmail,
      token: code.trim(),
      type: "email",
    });
    if (verifyError) {
      throw new Error(getAuthErrorMessage(verifyError, "Kode tidak dapat diverifikasi. Silakan coba lagi."));
    }
    if (!data.session || !data.user?.email_confirmed_at) {
      throw new Error("Verifikasi belum menghasilkan sesi masuk. Silakan coba masuk melalui halaman login.");
    }

    setVerificationEmail("");
    setShowOtpModal(false);
    router.replace("/pendaftar/beranda");
    router.refresh();
  }

  async function handleResendOtp(): Promise<void> {
    if (!verificationEmail) throw new Error("Email verifikasi belum tersedia.");
    if (Date.now() < resendAvailableAt) {
      throw new Error("Tunggu hitung mundur selesai sebelum mengirim ulang.");
    }
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: verificationEmail,
    });
    if (resendError) {
      // Beri jeda juga saat server membatasi permintaan.
      if (resendError.status === 429) {
        setResendAvailableAt(Date.now() + RESEND_SECONDS * 1000);
      }
      throw new Error(getAuthErrorMessage(resendError, "Email belum dapat dikirim ulang."));
    }
    setResendAvailableAt(Date.now() + RESEND_SECONDS * 1000);
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <section className="relative overflow-hidden rounded-b-[2.5rem] bg-slate-100 pb-20 pt-32 sm:pt-36">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="absolute inset-x-0 top-0 -z-20 h-[620px] overflow-hidden lg:h-[680px]">

        <Image
          src="/kantor.png"
          alt="Suasana kantor"
          fill
          className="object-cover object-top"
        />

      </div>

      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-white/85 to-white/40" />

      <div className="absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />

      <div className="absolute -right-10 bottom-0 -z-10 h-64 w-64 rounded-full bg-blue-300/40 blur-3xl" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-8">

        {/* =================================================
            FORM
        ================================================= */}

        <div className="relative z-10 mx-auto w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">

          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-brand-blue">

            <User className="h-3.5 w-3.5" />

            Bergabung Sekarang

          </span>

          <h1 className="text-3xl font-extrabold text-slate-900">
            Registrasi Magang-ers
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Mulai perjalananmu menuju masa depan yang lebih cerah
          </p>

          {/* ERROR */}

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {verificationEmail && (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-600">
              <p>Verifikasi email pendaftaranmu untuk melanjutkan.</p>
              <button
                type="button"
                disabled={loading}
                onClick={() => { setError(""); setShowOtpModal(true); }}
                className="mt-2 font-semibold text-brand-blue hover:underline disabled:opacity-60"
              >
                Lanjutkan verifikasi email
              </button>
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-4"
          >

            {/* NAMA */}

            <div className="relative">

              <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                name="fullName"
                placeholder="Nama Lengkap"
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-blue focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />

            </div>

            {/* EMAIL */}

            <div className="relative">

              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                disabled={loading}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-blue focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />

            </div>

            {/* NOMOR HP */}

            <div className="relative">

              <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="tel"
                name="phone"
                placeholder="Nomor Handphone"
                required
                disabled={loading}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-blue focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />

            </div>

            {/* PASSWORD */}

            <div className="relative">

              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Password"
                required
                minLength={8}
                disabled={loading}
                value={password}
                onChange={(e) => {
                  setPassword(
                    e.target.value
                  );

                  setPasswordError("");
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-11 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-brand-blue focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >

                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}

              </button>

            </div>

            {/* KONFIRMASI PASSWORD */}

            <div>

              <div className="relative">

                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  placeholder="Konfirmasi Password"
                  required
                  minLength={8}
                  disabled={loading}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(
                      e.target.value
                    );

                    setPasswordError("");
                  }}
                  className={`w-full rounded-xl border bg-slate-50 py-3.5 pl-11 pr-11 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 ${
                    passwordError
                      ? "border-red-300 focus:border-red-400"
                      : "border-slate-200 focus:border-brand-blue"
                  }`}
                />

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                >

                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}

                </button>

              </div>

              {passwordError && (
                <p className="mt-1.5 text-xs font-medium text-red-500">
                  {passwordError}
                </p>
              )}

            </div>

            {/* TOMBOL REGISTER */}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-transform hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >

              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                  Membuat Akun...
                </>
              ) : (
                <>
                  Daftar Sekarang

                  <ArrowRight className="h-4 w-4" />
                </>
              )}

            </button>

          </form>

          {/* LOGIN */}

          <p className="mt-6 text-center text-sm text-slate-500">

            Sudah punya akun?{" "}

            <a
              href="/masuk"
              className="font-semibold text-brand-blue hover:underline"
            >
              Masuk di sini
            </a>

          </p>

        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] lg:min-h-[640px]">

          <Image
            src="/student.png"
            alt="Mahasiswa magang"
            fill
            className="object-contain"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent" />

          <div className="relative z-10 max-w-md px-2 py-10 sm:px-6">

            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">

              Daftar Sekarang
              <br />

              dan Raih
              <br />

              <span className="text-brand-blue">
                Masa Depanmu!
              </span>

            </h2>

            <p className="mt-6 text-slate-600">
              Platform magang terpercaya yang menghubungkan mahasiswa dengan kesempatan terbaik untuk belajar, berkembang, dan bersiap menghadapi dunia kerja.
            </p>

            <div className="mt-8 flex flex-col gap-3">

              {FEATURES.map(
                ({
                  icon: Icon,
                  color,
                  title,
                  subtitle,
                }) => (

                  <div
                    key={title}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur"
                  >

                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`}
                    >

                      <Icon className="h-5 w-5 text-white" />

                    </span>

                    <div className="leading-tight">

                      <p className="text-sm font-semibold text-slate-900">
                        {title}
                      </p>

                      <p className="text-xs text-slate-500">
                        {subtitle}
                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          OTP MODAL
      ================================================= */}

      {showOtpModal && verificationEmail && (
        <OtpModal
          email={verificationEmail}
          codeLength={EMAIL_OTP_LENGTH}
          resendAvailableAt={resendAvailableAt}
          onClose={() => setShowOtpModal(false)}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
        />
      )}

    </section>
  );
}