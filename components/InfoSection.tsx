"use client";

import { useState } from "react";
import { ChevronRight, X, BookOpen } from "lucide-react";
import Image from "next/image";

const CARDS = [
  {
    id: 1,
    title: "Informasi Magang",
    desc: "Informasi mengenai program dan pelaksanaan magang.",
    content:
      "Program magang memberikan kesempatan kepada peserta untuk mendapatkan pengalaman kerja secara langsung di dunia industri. Selama mengikuti program, peserta akan mendapatkan berbagai kegiatan, tugas, serta bimbingan dari pembina.",
  },
  {
    id: 2,
    title: "Panduan Peserta",
    desc: "Panduan dan ketentuan yang perlu diperhatikan peserta.",
    content:
      "Peserta wajib mengikuti seluruh kegiatan magang sesuai dengan jadwal yang telah ditentukan. Peserta juga perlu mengisi absensi, mengerjakan tugas, serta mengisi jurnal secara rutin selama pelaksanaan magang.",
  },
];

export default function InfoSection() {
  const [selectedCard, setSelectedCard] = useState<
    (typeof CARDS)[number] | null
  >(null);

  return (
    <>
      <div
        id="informasi"
        className="grid grid-cols-1 gap-6 sm:grid-cols-[0.9fr_1.6fr]"
      >
        {/* Left: mascot pointing at cards */}
        <div className="relative flex items-end justify-center rounded-3xl bg-slate-50 px-6 pt-10">
          <div className="relative w-full max-w-[220px]">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-3xl">
              <Image
                src="/siswi.png"
                alt="Mahasiswa"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="absolute -left-6 top-10 -z-10 h-24 w-24 rounded-full bg-blue-100 blur-2xl" />
        </div>

        {/* Informasi cards */}
        <div>
          <h2 className="mb-1 text-center text-2xl font-bold text-slate-900 sm:text-left">
            Informasi
          </h2>

          <div className="mx-auto mb-8 h-1 w-14 rounded-full bg-brand-blue sm:mx-0" />

          <div className="grid grid-cols-1 gap-6 min-[480px]:grid-cols-2">
            {CARDS.map((card) => (
              <article
                key={card.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Card Image/Icon */}
                <div className="relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-amber-50 to-slate-200">
                  <BookOpen className="h-10 w-10 text-slate-400" />
                </div>

                {/* Card Content */}
                <div className="p-5">
                  <h3 className="mb-1 font-semibold text-slate-900">
                    {card.title}
                  </h3>

                  <div className="flex items-end justify-between gap-3">
                    <p className="text-sm text-slate-500">
                      {card.desc}
                    </p>

                    {/* Tombol Pop-up */}
                    <button
                      onClick={() => setSelectedCard(card)}
                      aria-label={`Lihat ${card.title}`}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-blue text-white transition-transform hover:scale-105"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* ================= POP-UP ================= */}

      {selectedCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setSelectedCard(null)}
        >
          {/* Modal */}
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tombol Close */}
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Icon */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <BookOpen className="h-6 w-6 text-brand-blue" />
            </div>

            {/* Title */}
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              {selectedCard.title}
            </h2>

            {/* Content */}
            <p className="text-sm leading-7 text-slate-600">
              {selectedCard.content}
            </p>

            {/* Close */}
            <button
              onClick={() => setSelectedCard(null)}
              className="mt-6 rounded-xl bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}