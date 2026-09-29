"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { supabase } from "@/lib/supabase";

const LOGIN_PATH = "/masuk";
const MIN_PASSWORD_LENGTH = 8; // Samakan dengan kebijakan password proyek.

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [logoutWarning, setLogoutWarning] = useState("");
  const initialized = useRef(false);
  const tokenHash = useRef<string | null>(null);
  const verifiedUserId = useRef<string | null>(null);
  const requestPending = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    // Template Reset Password harus memakai #token_hash={{ .TokenHash }}.
    // Simpan hanya di memori dan hapus dari address bar. Tidak disimpan di storage.
    const params = new URLSearchParams(window.location.hash.slice(1));
    tokenHash.current = params.get("token_hash");
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    setInvalidLink(!tokenHash.current);
    setReady(true);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestPending.current || !ready || invalidLink || done) return;
    setError("");
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password minimal ${MIN_PASSWORD_LENGTH} karakter.`);
      return;
    }
    if (password !== confirmation) {
      setError("Konfirmasi password belum sama.");
      return;
    }

    requestPending.current = true;
    setBusy(true);
    try {
      // Verifikasi hanya saat pengguna menekan tombol, bukan saat halaman dibuka.
      // Jangan izinkan sesi login biasa menggantikan bukti pemulihan dari email.
      if (!verifiedUserId.current) {
        if (!tokenHash.current) { setInvalidLink(true); return; }
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash.current,
          type: "recovery",
        });
        if (verifyError) {
          if (verifyError.code === "otp_expired" || verifyError.status === 403) {
            tokenHash.current = null;
            setInvalidLink(true);
          } else {
            setError("Tautan belum dapat diverifikasi. Coba lagi atau minta tautan baru.");
          }
          return;
        }
        if (!data.session || !data.user) {
          setInvalidLink(true);
          return;
        }
        verifiedUserId.current = data.user.id;
        tokenHash.current = null;
      }

      // Periksa ulang akun sesi, termasuk jika pengguna login di tab lain.
      const { data: current, error: userError } = await supabase.auth.getUser();
      if (userError || !current.user || current.user.id !== verifiedUserId.current) {
        verifiedUserId.current = null;
        setInvalidLink(true);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        if (updateError.code === "same_password") {
          setError("Gunakan password yang berbeda dari password sebelumnya.");
        } else if (updateError.code === "weak_password") {
          setError("Password belum memenuhi kebijakan keamanan. Gunakan password lebih panjang dengan huruf besar, huruf kecil, angka, dan simbol.");
        } else if (updateError.status === 429) {
          setError("Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.");
        } else {
          setError("Password belum dapat disimpan. Silakan coba lagi.");
        }
        return;
      }

      setPassword("");
      setConfirmation("");
      verifiedUserId.current = null;
      // Kegagalan logout tidak boleh ditampilkan sebagai kegagalan mengganti password.
      try {
        const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
        if (signOutError) setLogoutWarning("Password sudah diubah, tetapi sesi belum berhasil ditutup. Logout sebelum mencoba login kembali.");
      } catch {
        setLogoutWarning("Password sudah diubah, tetapi sesi belum berhasil ditutup. Logout sebelum mencoba login kembali.");
      }
      setDone(true);
    } catch {
      setError("Koneksi terputus. Periksa internet lalu coba lagi.");
    } finally {
      requestPending.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center text-2xl font-extrabold tracking-tight">Magang<span className="text-blue-600">-ers</span></p>
        <section aria-labelledby="reset-title" className="rounded-3xl border border-slate-100 bg-white p-7 shadow-sm sm:p-9">
          <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
            {done ? <CheckCircle2 aria-hidden="true" className="h-7 w-7" /> : <LockKeyhole aria-hidden="true" className="h-7 w-7" />}
          </span>
          <h1 id="reset-title" className="text-2xl font-extrabold">{done ? "Password berhasil diubah" : "Buat password baru"}</h1>
          {!ready ? <p role="status" className="mt-4 text-sm text-slate-500">Menyiapkan halaman...</p> : done ? (
            <div role="status" className="mt-4 space-y-5">
              <p className="text-sm leading-6 text-slate-500">Gunakan password baru untuk masuk ke akun Magang-ers.</p>
              {logoutWarning && <p className="text-sm text-amber-700">{logoutWarning}</p>}
              <Link href={LOGIN_PATH} className="block rounded-xl bg-blue-600 px-4 py-3.5 text-center text-sm font-semibold text-white hover:bg-blue-700">Kembali ke login</Link>
            </div>
          ) : invalidLink ? (
            <div className="mt-4 space-y-5">
              <p role="alert" className="text-sm leading-6 text-red-600">Tautan tidak tersedia, sudah digunakan, atau sudah kedaluwarsa. Buka kembali tautan terbaru dari email atau minta tautan baru.</p>
              <Link href="/lupa-password" className="block rounded-xl bg-blue-600 px-4 py-3.5 text-center text-sm font-semibold text-white hover:bg-blue-700">Minta tautan baru</Link>
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm leading-6 text-slate-500">Gunakan password baru yang berbeda dari sebelumnya, minimal {MIN_PASSWORD_LENGTH} karakter.</p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-5" aria-busy={busy}>
                <div>
                  <label htmlFor="new-password" className="mb-2 block text-sm font-semibold">Password baru</label>
                  <div className="relative">
                    <input id="new-password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} value={password} disabled={busy} onChange={(event) => { setPassword(event.target.value); setError(""); }} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-12 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-60" />
                    <button type="button" disabled={busy} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-4 text-slate-500">
                      {showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold">Konfirmasi password baru</label>
                  <input id="confirm-password" name="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} value={confirmation} disabled={busy} onChange={(event) => { setConfirmation(event.target.value); setError(""); }} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:opacity-60" />
                </div>
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {busy && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}{busy ? "Menyimpan..." : "Simpan password baru"}
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
