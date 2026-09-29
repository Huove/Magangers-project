"use client";

import { X, ShieldCheck } from "lucide-react";
import { createPortal } from "react-dom";
import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

type OtpModalProps = {
  email: string;
  codeLength?: number;
  resendAvailableAt: number;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
};

function maskEmail(email: string) {
  const at = email.lastIndexOf("@");
  if (at < 1) return email;
  const name = email.slice(0, at);
  return `${name.slice(0, Math.min(2, name.length))}***${email.slice(at)}`;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function OtpModal({
  email,
  codeLength = 6,
  resendAvailableAt,
  onClose,
  onVerify,
  onResend,
}: OtpModalProps) {
  const [digits, setDigits] = useState<string[]>(Array(codeLength).fill(""));
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const operationInFlight = useRef(false);
  const active = useRef(false);
  const busy = submitting || resending;
  const secondsLeft = Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));

  useEffect(() => {
    active.current = true;
    setMounted(true);
    return () => { active.current = false; };
  }, []);

  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);

  useEffect(() => {
    if (!mounted) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputsRef.current[0]?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [mounted]);

  function closeModal() {
    if (!operationInFlight.current) onClose();
  }

  function fillDigits(index: number, value: string) {
    if (operationInFlight.current) return;
    const clean = value.replace(/\D/g, "").slice(0, codeLength - index);
    const next = [...digits];
    if (!clean) next[index] = "";
    else clean.split("").forEach((char, offset) => { next[index + offset] = char; });
    setDigits(next);
    setError("");
    setMessage("");
    if (clean) inputsRef.current[Math.min(index + clean.length, codeLength - 1)]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const offset = event.key === "ArrowLeft" ? -1 : 1;
      inputsRef.current[Math.max(0, Math.min(index + offset, codeLength - 1))]?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    if (operationInFlight.current) return;
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, codeLength);
    if (!pasted) return;
    const next: string[] = Array(codeLength).fill("");
    pasted.split("").forEach((char, index) => { next[index] = char; });
    setDigits(next);
    setError("");
    setMessage("");
    inputsRef.current[Math.min(pasted.length, codeLength - 1)]?.focus();
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex="0"]',
    ));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (operationInFlight.current) return;
    const code = digits.join("");
    if (!new RegExp(`^\\d{${codeLength}}$`).test(code)) {
      setError(`Masukkan ${codeLength} digit kode verifikasi.`);
      return;
    }
    operationInFlight.current = true;
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      // Callback menunggu verifyOtp Supabase; tidak ada kode dummy atau timer sukses.
      await onVerify(code);
    } catch (err) {
      if (active.current) setError(errorMessage(err, "Kode belum dapat diverifikasi. Coba lagi."));
    } finally {
      operationInFlight.current = false;
      if (active.current) setSubmitting(false);
    }
  }

  async function handleResend() {
    if (operationInFlight.current || Date.now() < resendAvailableAt) return;
    operationInFlight.current = true;
    setResending(true);
    setError("");
    setMessage("");
    try {
      await onResend();
      if (active.current) {
        setDigits(Array(codeLength).fill(""));
        setNow(Date.now());
        setMessage("Permintaan kirim ulang berhasil. Periksa kotak masuk atau folder spam dan gunakan kode terbaru.");
      }
    } catch (err) {
      if (active.current) setError(errorMessage(err, "Email belum dapat dikirim ulang. Coba lagi."));
    } finally {
      operationInFlight.current = false;
      if (active.current) setResending(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={closeModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="otp-modal-title"
        aria-describedby="otp-modal-description"
        aria-busy={busy}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
        className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300"
      >
        <button type="button" onClick={closeModal} disabled={busy} aria-label="Tutup"
          className="absolute right-5 top-5 text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-40">
          <X className="h-5 w-5" />
        </button>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-brand-blue">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h2 id="otp-modal-title" className="mt-4 text-xl font-extrabold text-slate-900">Verifikasi Email</h2>
        <p id="otp-modal-description" className="mt-1.5 text-sm text-slate-500">
          Masukkan kode {codeLength} digit dari email untuk{" "}
          <span className="break-all font-semibold text-slate-700">{maskEmail(email)}</span>.
          Periksa juga folder spam jika email belum terlihat.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mt-6 flex justify-between gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { inputsRef.current[index] = element; }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={codeLength}
                aria-label={`Digit kode ${index + 1}`}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "otp-error" : undefined}
                disabled={busy}
                value={digit}
                onFocus={(event) => event.target.select()}
                onChange={(event) => fillDigits(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
                className="h-14 w-full min-w-0 max-w-[46px] rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-bold text-slate-900 outline-none transition-colors focus:border-brand-blue focus:bg-white disabled:opacity-60"
              />
            ))}
          </div>
          {error && <p id="otp-error" role="alert" className="mt-3 text-sm font-medium text-red-500">{error}</p>}
          {message && <p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>}
          <button type="submit" disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-transform hover:-translate-y-0.5 hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-60">
            {submitting ? "Memverifikasi..." : "Verifikasi Kode"}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
          Tidak menerima kode?{" "}
          {secondsLeft > 0 ? (
            <span className="font-medium text-slate-400">Kirim ulang dalam {secondsLeft} detik</span>
          ) : (
            <button type="button" onClick={handleResend} disabled={busy}
              className="font-semibold text-brand-blue hover:underline disabled:opacity-60">
              {resending ? "Mengirim..." : "Kirim ulang"}
            </button>
          )}
        </p>
      </div>
    </div>,
    document.body,
  );
}
