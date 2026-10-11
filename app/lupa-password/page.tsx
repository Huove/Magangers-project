"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

const LOGIN_PATH = "/masuk"; // Sesuaikan jika alamat halaman login berbeda.
const RESEND_SECONDS = 60;

export default function LupaPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const availableAt = useRef(0);
  const requestPending = useRef(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((availableAt.current - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  function startCooldown() {
    availableAt.current = Date.now() + RESEND_SECONDS * 1000;
    setSecondsLeft(RESEND_SECONDS);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestPending.current || Date.now() < availableAt.current) return;
    requestPending.current = true;
    setBusy(true);
    setError("");
    setSent(false);

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      if (authError) {
        if (authError.status === 429 || authError.code === "over_email_send_rate_limit") {
          startCooldown();
          setError("Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi.");
        } else {
          setError("Permintaan belum dapat diproses. Silakan coba lagi nanti.");
        }
        return;
      }
      setSent(true);
      startCooldown();
    } catch {
      setError("Tidak dapat terhubung. Periksa koneksi internet lalu coba lagi.");
    } finally {
      requestPending.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center text-2xl font-extrabold tracking-tight">Magang<span className="text-blue-600">-ers</span></p>
        <section aria-labelledby="forgot-title" className="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm sm:p-9">
          <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Mail aria-hidden="true" className="h-7 w-7" /></span>
          <h1 id="forgot-title" className="text-2xl font-extrabold">Lupa password?</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Masukkan email yang kamu gunakan saat mendaftar. Kami akan mengirimkan tautan untuk membuat password baru.</p>

          {sent && (
            <div role="status" className="mt-6 flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              <p>Jika email tersebut terdaftar, kamu akan menerima tautan reset password. Periksa kotak masuk dan folder spam.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5" aria-busy={busy}>
            <div>
              <label htmlFor="recovery-email" className="mb-2 block text-sm font-semibold">Alamat email</label>
              <input id="recovery-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} disabled={busy}
                onChange={(event) => { setEmail(event.target.value); setError(""); setSent(false); }}
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-60" />
            </div>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={busy || secondsLeft > 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
              {busy && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
              {busy ? "Mengirim..." : secondsLeft > 0 ? `Kirim ulang dalam ${secondsLeft} detik` : sent ? "Kirim ulang tautan" : "Kirim tautan reset"}
            </button>
          </form>
          <Link href={LOGIN_PATH} className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 hover:underline"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Kembali ke login</Link>
        </section>
      </div>
    </main>
  );
}
