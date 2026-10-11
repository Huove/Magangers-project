"use client";
import { ArrowRight, GraduationCap, Rocket, BarChart3 } from "lucide-react";
import Image from "next/image";
import { FlipWords } from "@/components/ui/flip-words";


const FEATURES = [
  {
    icon: GraduationCap,
    color: "bg-brand-blue",
    title: "Kesempatan",
    subtitle: "Terpercaya",
  },
  {
    icon: Rocket,
    color: "bg-brand-orange",
    title: "Pengalaman",
    subtitle: "Berkualitas",
  },
  {
    icon: BarChart3,
    color: "bg-brand-green",
    title: "Masa Depan",
    subtitle: "Lebih Cerah",
  },
];

export default function Hero() {
  return (
    <section
        id="top"
        className="relative isolate overflow-hidden rounded-b-[2.5rem] bg-slate-100 pb-20 pt-32 sm:pt-36"
      >
      {/* Background photo layer */}
        <div className="absolute inset-x-0 top-0 -z-20 h-[620px] overflow-hidden lg:h-[760px]">
          <Image
            src="/kantor.png"
            alt="Suasana kantor"
            fill
            priority
            className="object-cover object-top"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white via-white/85 to-white/10" />
        <div className="absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="absolute -right-10 bottom-0 -z-10 h-64 w-64 rounded-full bg-blue-300/40 blur-3xl" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-end gap-12 px-6 lg:grid-cols-2 lg:gap-8">
        {/* Left: copy */}
        <div>
          <p className="mb-3 text-sm font-medium text-slate-600 sm:text-base">
            Mulai Langkahmu, Raih Pengalaman, Bangun{" "}
            <span className="font-semibold text-brand-orange underline decoration-2 underline-offset-4">
              Masa Depan
            </span>
          </p>

          <h1 className="text-left text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.1]">
            Rasakan{" "}
            <span className="inline-flex items-baseline min-w-[260px] -ml-1">
              <FlipWords
                words={["Kemudahan", "Pengalaman", "Kesempatan"]}
                duration={2500}
                className="px-1"
              />
            </span>
            <br />
            <span className="text-brand-blue">
              dengan Magang-ers!
            </span>
          </h1>

          <p className="mt-6 max-w-md text-slate-600">
            Platform magang terpercaya yang menghubungkan mahasiswa dengan
            kesempatan terbaik untuk belajar, berkembang, dan bersiap
            menghadapi dunia kerja.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-transform hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Daftar Sekarang
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#informasi"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-400"
            >
              Pelajari Lebih Lanjut
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Feature pills */}
          <div className="mt-10 flex flex-wrap gap-3">
            {FEATURES.map(({ icon: Icon, color, title, subtitle }) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-full ${color}`}
                >
                  <Icon className="h-4 w-4 text-white" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-900">
                    {title}
                  </p>
                  <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: portrait + quote bubble */}
        <div className="relative mx-auto w-full max-w-sm lg:max-w-md">
          {/* Portrait placeholder — swap for a real photo at /public/student.png */}
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2rem]">
            <Image
              src="/student.png"
              alt="Mahasiswa magang"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Quote bubble */}
          <div className="absolute -right-4 top-6 w-52 rounded-2xl rounded-bl-none bg-white p-4 text-sm font-medium text-slate-700 shadow-xl sm:-right-10">
            <span className="text-2xl leading-none text-brand-orange">
              &ldquo;
            </span>
            Pengalaman magang yang mengubah langkahku
            <span className="float-right text-2xl leading-none text-brand-orange">
              &rdquo;
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
