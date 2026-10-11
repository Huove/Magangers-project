"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";

import {
  Bell,
  CalendarDays,
  X,
  Megaphone,
  ChevronRight,
} from "lucide-react";

import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Pengumuman = {
  id: string;
  judul: string;
  isi: string;
  tanggal: string;
  kategori: "Informasi" | "Penting" | "Kegiatan";
};

const kategoriStyle = {
  Informasi: "bg-blue-50 text-blue-600",
  Penting: "bg-red-50 text-red-600",
  Kegiatan: "bg-emerald-50 text-emerald-600",
};

export default function PengumumanPopup() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);

  const [pengumuman, setPengumuman] = useState<
    Pengumuman[]
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPengumuman() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("pengumuman")
          .select(`
          id,
          judul,
          isi,
          created_at
        `)
          .order("created_at", {
            ascending: false,
          })
          .limit(3);

        if (error) {
          console.error(
            "Gagal mengambil pengumuman:",
            error
          );
          return;
        }

        const formattedData: Pengumuman[] = (
          data || []
        ).map((item) => ({
          id: item.id,
          judul: item.judul,
          isi: item.isi,

          tanggal: new Date(
            item.created_at
          ).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),

          kategori: "Informasi",
        }));

        setPengumuman(formattedData);

        // =====================================
        // CEK APAKAH POPUP SUDAH PERNAH MUNCUL
        // =====================================

        const sudahMuncul =
          sessionStorage.getItem(
            "pengumuman_popup_sudah_muncul"
          );

        const halamanSekarang =
          window.location.pathname;

        // Popup hanya muncul:
        // 1. Ada pengumuman
        // 2. Belum pernah muncul pada sesi ini
        // 3. Tidak sedang di halaman pengumuman
        if (
          formattedData.length > 0 &&
          !sudahMuncul &&
          halamanSekarang !== "/aktif/pengumuman"
        ) {
          setOpen(true);

          // Tandai popup sudah pernah ditampilkan
          sessionStorage.setItem(
            "pengumuman_popup_sudah_muncul",
            "true"
          );
        }
      } catch (err) {
        console.error(
          "Error fetch pengumuman:",
          err
        );
      } finally {
        setLoading(false);
      }
    }

    fetchPengumuman();
  }, []);
  // =========================================
  // TUTUP KALAU MASUK HALAMAN PENGUMUMAN
  // =========================================

  const handleGoToPengumuman = () => {
    setOpen(false);
  };

  // =========================================
  // LOADING / DATA KOSONG
  // =========================================

  if (loading) {
    return null;
  }

  if (pengumuman.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>

      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
        >

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
              y: 30,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              y: 30,
            }}
            transition={{
              duration: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            className="relative max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >

            {/* =================================
                HEADER
            ================================= */}

            <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Bell size={21} />
                </div>

                <div>

                  <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                    Informasi Terbaru
                  </p>

                  <h2 className="text-lg font-semibold text-neutral-900">
                    Pengumuman
                  </h2>

                </div>

              </div>

              <button
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X size={19} />
              </button>

            </div>

            {/* =================================
                CONTENT
            ================================= */}

            <div className="max-h-[60vh] overflow-y-auto p-6">

              <p className="mb-4 text-sm leading-relaxed text-neutral-500">
                Berikut adalah pengumuman terbaru yang
                perlu kamu ketahui.
              </p>

              <div className="space-y-3">

                {pengumuman.map(
                  (item, index) => (

                    <motion.div
                      key={item.id}
                      initial={{
                        opacity: 0,
                        y: 15,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      transition={{
                        delay: index * 0.08,
                        duration: 0.25,
                      }}
                      className="group rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/20"
                    >

                      <div className="flex items-start gap-4">

                        {/* ICON */}

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <Megaphone size={18} />
                        </div>

                        {/* DATA */}

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="text-sm font-semibold text-neutral-900">
                              {item.judul}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${kategoriStyle[
                                item.kategori
                                ]
                                }`}
                            >
                              {item.kategori}
                            </span>

                          </div>

                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-500">
                            {item.isi}
                          </p>

                          <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-400">

                            <CalendarDays
                              size={13}
                            />

                            {item.tanggal}

                          </div>

                        </div>

                        {/* DETAIL */}

                        <Link
                          href="/aktif/pengumuman"
                          onClick={
                            handleGoToPengumuman
                          }
                        >

                          <ChevronRight
                            size={17}
                            className="mt-1 shrink-0 text-neutral-300 transition group-hover:translate-x-1 group-hover:text-blue-500"
                          />

                        </Link>

                      </div>

                    </motion.div>

                  )
                )}

              </div>

            </div>

            <div className="border-t border-neutral-100 bg-neutral-50 px-6 py-4">

              <div className="flex gap-3">

                <button
                  onClick={() =>
                    setOpen(false)
                  }
                  className="flex-1 rounded-full border border-neutral-200 bg-white py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
                >
                  Mengerti
                </button>

                <Link
                  href="/aktif/pengumuman"
                  onClick={
                    handleGoToPengumuman
                  }
                  className="flex-1"
                >
                  <div className="flex h-full items-center justify-center rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                    Lihat Semua
                  </div>
                </Link>

              </div>

            </div>

          </motion.div>

        </motion.div>
      )}

    </AnimatePresence>
  );
}