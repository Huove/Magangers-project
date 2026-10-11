"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { useOutsideClick } from "@/hooks/use-outside-click";
import { GlowingEffect } from "@/components/aktif/ui/glowing-effect";
import { supabase } from "@/lib/supabase";

type Announcement = {
  id: string;
  title: string;
  date: string;
  category: string;
  image: string;
  description: string;
};

export default function Pengumuman() {
  // =========================
  // STATE
  // =========================

  const [announcements, setAnnouncements] = useState<
    Announcement[]
  >([]);

  const [active, setActive] =
    useState<Announcement | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null
  );

  const ref = useRef<HTMLDivElement>(null);

  // =========================
  // FETCH DATA SUPABASE
  // =========================

  useEffect(() => {
    async function fetchAnnouncements() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("pengumuman")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      console.log("SUPABASE DATA:", data);
      console.log("SUPABASE ERROR:", error);

      if (error) {
        console.error(
          "Gagal mengambil pengumuman:",
          error
        );

        setError(
          "Gagal mengambil data pengumuman."
        );

        setLoading(false);
        return;
      }

      console.log(
        "Data pengumuman dari Supabase:",
        data
      );

      const formattedData: Announcement[] = (
        data || []
      ).map((item) => ({
        id: item.id,
        title: item.judul,
        date: new Date(
          item.created_at
        ).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }),
        category: "Informasi",
        image: "/pengumuman.jpg",
        description: item.isi,
      }));

      setAnnouncements(formattedData);

      setLoading(false);
    }

    fetchAnnouncements();
  }, []);

  // =========================
  // OUTSIDE CLICK
  // =========================

  useOutsideClick(ref, () => {
    setActive(null);
  });

  // =========================
  // LOCK BODY SCROLL
  // =========================

  useEffect(() => {
    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  // =========================
  // RENDER
  // =========================

  return (
    <section className="relative min-h-screen w-full bg-[#F8FAFC] px-6 py-10 md:px-8 lg:px-10">

      {/* =========================
          HEADER
      ========================= */}

      <div className="mb-10">

        <h1 className="text-2xl font-bold tracking-tight text-[#1E293B] md:text-2xl">
          Informasi & Pengumuman Magang
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-[#64748B] md:text-base">
          Temukan informasi terbaru mengenai kegiatan,
          jadwal, dan pemberitahuan selama masa magang.
        </p>

      </div>

      {/* =========================
          LOADING
      ========================= */}

      {loading && (
        <div className="flex min-h-[300px] items-center justify-center">

          <div className="text-sm text-[#64748B]">
            Memuat pengumuman...
          </div>

        </div>
      )}

      {/* =========================
          ERROR
      ========================= */}

      {!loading && error && (
        <div className="flex min-h-[300px] items-center justify-center">

          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
            {error}
          </div>

        </div>
      )}

      {/* =========================
          EMPTY
      ========================= */}

      {!loading &&
        !error &&
        announcements.length === 0 && (
          <div className="flex min-h-[300px] items-center justify-center">

            <div className="rounded-xl border border-[#E6EAF0] bg-white px-6 py-4 text-sm text-[#64748B] shadow-sm">
              Belum ada pengumuman.
            </div>

          </div>
        )}

      {/* =========================
          BACKDROP
      ========================= */}

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* =========================
          CARD
      ========================= */}

      {!loading &&
        !error &&
        announcements.length > 0 && (
          <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

            {announcements.map(
              (announcement) => (
                <motion.div
                  key={announcement.id}
                  layoutId={`announcement-${announcement.id}`}
                  onClick={() =>
                    setActive(announcement)
                  }
                  whileHover={{
                    y: -6,
                  }}
                  transition={{
                    duration: 0.25,
                  }}
                  className="group relative cursor-pointer rounded-3xl"
                >

                  <GlowingEffect
                    disabled={false}
                    spread={30}
                    borderWidth={1.5}
                    proximity={60}
                    inactiveZone={0.6}
                  />

                  <div className="relative z-10 overflow-hidden rounded-3xl border border-[#E6EAF0] bg-gray-100 shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-shadow duration-300 group-hover:shadow-[0_12px_30px_rgba(37,99,235,0.10)]">

                    {/* IMAGE */}

                    <motion.div
                      layoutId={`image-${announcement.id}`}
                      className="relative h-48 w-full overflow-hidden"
                    >

                      <img
                        src={announcement.image}
                        alt={announcement.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                      <div className="absolute left-4 top-4">

                        <span className="inline-flex rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#334155] shadow-sm backdrop-blur-md">
                          {announcement.category}
                        </span>

                      </div>

                    </motion.div>

                    {/* CONTENT */}

                    <div className="p-5">

                      <motion.p
                        layoutId={`date-${announcement.id}`}
                        className="mb-2 text-xs font-medium text-[#94A3B8]"
                      >
                        {announcement.date}
                      </motion.p>

                      <motion.h2
                        layoutId={`title-${announcement.id}`}
                        className="text-lg font-bold leading-snug text-[#1E293B]"
                      >
                        {announcement.title}
                      </motion.h2>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#64748B]">
                        {announcement.description}
                      </p>

                      <div className="mt-6 flex items-center justify-between">

                        <span className="text-sm font-semibold text-[#2563EB]">
                          Baca selengkapnya
                        </span>

                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB] transition-all duration-300 group-hover:bg-[#2563EB] group-hover:text-white">
                          →
                        </span>

                      </div>

                    </div>

                  </div>

                </motion.div>
              )
            )}

          </div>
        )}

      {/* =========================
          DETAIL MODAL
      ========================= */}

      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

            <motion.div
              ref={ref}
              layoutId={`announcement-${active.id}`}
              className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#E6EAF0] bg-gray-100 shadow-[0_25px_70px_rgba(15,23,42,0.18)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >

              {/* CLOSE */}

              <button
                onClick={() =>
                  setActive(null)
                }
                aria-label="Tutup pengumuman"
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/90 text-xl font-medium text-[#475569] shadow-md backdrop-blur-md transition-all duration-200 hover:bg-white hover:text-[#1E293B] hover:shadow-lg"
              >
                x
              </button>

              {/* IMAGE */}

              <motion.div
                layoutId={`image-${active.id}`}
                className="relative h-64 w-full overflow-hidden md:h-80"
              >

                <img
                  src={active.image}
                  alt={active.title}
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                <div className="absolute bottom-5 left-6">

                  <span className="rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#334155] shadow-sm backdrop-blur-md">
                    {active.category}
                  </span>

                </div>

              </motion.div>

              {/* DETAIL CONTENT */}

              <div className="p-6 md:p-8">

                <motion.p
                  layoutId={`date-${active.id}`}
                  className="mb-2 text-sm font-medium text-[#94A3B8]"
                >
                  {active.date}
                </motion.p>

                <motion.h2
                  layoutId={`title-${active.id}`}
                  className="text-2xl font-bold leading-tight text-[#1E293B] md:text-3xl"
                >
                  {active.title}
                </motion.h2>

                <motion.div
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.15,
                  }}
                  className="mt-6 space-y-4 text-sm leading-7 text-[#64748B]"
                >

                  <p>
                    {active.description}
                  </p>

                  <p>
                    Pastikan seluruh peserta membaca
                    informasi ini dengan seksama.
                    Apabila terdapat pertanyaan lebih
                    lanjut, silakan menghubungi
                    pembimbing atau pihak yang
                    bertanggung jawab.
                  </p>

                  <p>
                    Informasi ini dibuat sebagai bagian
                    dari penyampaian informasi resmi
                    kepada seluruh peserta magang.
                  </p>

                </motion.div>

                {/* CLOSE BUTTON */}

                <div className="mt-8 flex justify-end">

                  <button
                    onClick={() =>
                      setActive(null)
                    }
                    className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1D4ED8] hover:shadow-md active:scale-[0.98]"
                  >
                    Tutup
                  </button>

                </div>

              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </section>
  );
}