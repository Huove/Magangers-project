import { MessageCircle } from "lucide-react";

export default function HubungiSection() {
  return (
    <div
      id="hubungi"
      className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-50 to-green-50 p-8"
    >
      <div>
        <h2 className="mb-1 text-2xl font-bold text-slate-900">Hubungi</h2>
        <div className="mb-6 h-1 w-14 rounded-full bg-brand-green" />

        <p className="text-sm leading-relaxed text-slate-600">
          &ldquo;Punya pertanyaan atau mengalami kendala selama program magang? Jangan ragu untuk menghubungi kami. Tim Magang-ers siap membantu memberikan informasi dan solusi agar proses magang kamu berjalan lancar dan nyaman.&rdquo;
        </p>
      </div>

      <a
        href="https://wa.me/6280000000000"
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition-transform hover:-translate-y-0.5 hover:bg-emerald-700"
      >
        <MessageCircle className="h-4 w-4" />
        Hubungi Sekarang
      </a>

      {/* Decorative leaf */}
      <svg
        className="pointer-events-none absolute -bottom-4 -right-4 h-32 w-32 text-emerald-700/20"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M50 10 C20 30, 20 70, 50 90 C55 60, 55 40, 50 10 Z" />
        <path d="M50 10 C80 30, 80 70, 50 90 C45 60, 45 40, 50 10 Z" opacity="0.6" />
      </svg>
    </div>
  );
}
