"use client";

import * as React from "react";

import {
  CalendarDate,
  getLocalTimeZone,
  today,
  parseDate,
} from "@internationalized/date";

import { Calendar } from "@/components/aktif/ui/calendar";

import {
  Clock,
  MapPin,
  CalendarDays,
  BookOpen,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Jadwal = {
  id: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  kegiatan: string;
  lokasi: string;
  keterangan?: string | null;
};

function dateToString(date: CalendarDate) {
  return `${date.year}-${String(date.month).padStart(
    2,
    "0"
  )}-${String(date.day).padStart(2, "0")}`;
}

function jsDateToString(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(
    2,
    "0"
  )}`;
}

function formatTanggal(tanggal: string) {
  const date = new Date(`${tanggal}T00:00:00`);

  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function JadwalPage() {
  const tanggalSekarang = today(getLocalTimeZone());

  const [selectedDate, setSelectedDate] =
    React.useState<CalendarDate>(tanggalSekarang);

  const [jadwalData, setJadwalData] =
    React.useState<Jadwal[]>([]);

  const [loading, setLoading] = React.useState(true);

  const [error, setError] = React.useState<string | null>(
    null
  );

  const selectedDateString = dateToString(selectedDate);

  React.useEffect(() => {
    async function fetchJadwal() {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("jadwal")
        .select(`
          id,
          tanggal,
          kegiatan,
          jam_mulai,
          jam_selesai,
          lokasi,
          keterangan
        `)
        .order("tanggal", { ascending: true })
        .order("jam_mulai", { ascending: true });
      console.log("DATA JADWAL:", data);
      console.log("ERROR JADWAL:", error);

      if (error) {
        console.error(
          "Gagal mengambil data jadwal:",
          error
        );

        setError("Gagal mengambil data jadwal.");
        setJadwalData([]);
        setLoading(false);

        return;
      }

      const formattedData: Jadwal[] = (data ?? []).map(
        (item) => ({
          id: item.id,
          tanggal: item.tanggal,
          kegiatan: item.kegiatan,
          jamMulai:
            item.jam_mulai?.slice(0, 5) ?? "",
          jamSelesai:
            item.jam_selesai?.slice(0, 5) ?? "",
          lokasi: item.lokasi,
          keterangan: item.keterangan,
        })
      );

      setJadwalData(formattedData);
      setLoading(false);
    }

    fetchJadwal();
  }, []);

  /*
   * =====================================================
   * JADWAL PADA TANGGAL YANG DIPILIH
   * =====================================================
   */
  const jadwalHariIni = React.useMemo(() => {
    return jadwalData.filter(
      (jadwal) =>
        jadwal.tanggal === selectedDateString
    );
  }, [jadwalData, selectedDateString]);

  /*
   * =====================================================
   * TANGGAL YANG MEMILIKI JADWAL
   * =====================================================
   */
  const tanggalAdaJadwal = React.useMemo(() => {
    return jadwalData.map((jadwal) =>
      parseDate(jadwal.tanggal)
    );
  }, [jadwalData]);

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-8">
        <div className="mb-8">
          <div className="mb-1 flex items-center gap-2">
            <CalendarDays
              size={18}
              className="text-neutral-900"
            />

            <p className="text-2xl font-semibold text-neutral-900">
              Jadwal Peserta
            </p>
          </div>

          <p className="mt-1 text-sm text-neutral-500">
            Lihat jadwal kegiatan magang berdasarkan
            tanggal.
          </p>
        </div>

        <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-neutral-200 bg-white shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-blue-600" />

            <p className="text-sm text-neutral-500">
              Memuat jadwal...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * ERROR
   * =====================================================
   */
  if (error) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-8">
        <div className="mb-8">
          <div className="mb-1 flex items-center gap-2">
            <CalendarDays
              size={18}
              className="text-neutral-900"
            />

            <p className="text-2xl font-semibold text-neutral-900">
              Jadwal Peserta
            </p>
          </div>

          <p className="mt-1 text-sm text-neutral-500">
            Lihat jadwal kegiatan magang berdasarkan
            tanggal.
          </p>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * PAGE
   * =====================================================
   */
  return (
    <div className="min-h-screen bg-white p-6 md:p-8">
      {/* HEADER */}
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <CalendarDays
            size={18}
            className="text-neutral-900"
          />

          <p className="text-2xl font-semibold text-neutral-900">
            Jadwal Peserta
          </p>
        </div>

        <p className="mt-1 text-sm text-neutral-500">
          Lihat jadwal kegiatan magang berdasarkan
          tanggal.
        </p>
      </div>

      {/* KALENDER + DETAIL */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* KALENDER */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-neutral-900">
              Kalender
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Tanggal yang memiliki titik biru mempunyai
              jadwal.
            </p>
          </div>

          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={
                new Date(
                  selectedDate.year,
                  selectedDate.month - 1,
                  selectedDate.day
                )
              }
              onSelect={(date) => {
                if (!date) return;

                const dateString =
                  jsDateToString(date);

                setSelectedDate(
                  parseDate(dateString)
                );
              }}
              captionLayout="dropdown"
              showOutsideDays
              modifiers={{
                adaJadwal: tanggalAdaJadwal.map(
                  (date) =>
                    new Date(
                      date.year,
                      date.month - 1,
                      date.day
                    )
                ),
              }}
              modifiersClassNames={{
                adaJadwal:
                  "bg-blue-50 text-blue-700",
              }}
              className="w-full max-w-xl rounded-2xl border border-neutral-100 bg-white p-3"
              classNames={{
                months: "w-full",
                month: "w-full space-y-4",
                month_grid: "w-full",
                weekdays: "flex w-full",
                weekday:
                  "flex-1 text-center text-xs font-medium text-neutral-400",
                week: "mt-2 flex w-full",
                day: "relative flex-1",
              }}
              components={{
                DayButton: ({
                  day,
                  modifiers,
                  ...props
                }) => {
                  const dateString =
                    jsDateToString(day.date);

                  const punyaJadwal =
                    jadwalData.some(
                      (jadwal) =>
                        jadwal.tanggal ===
                        dateString
                    );

                  const selected =
                    modifiers.selected;

                  const outside =
                    modifiers.outside;

                  const todayDate =
                    modifiers.today;

                  return (
                    <button
                      {...props}
                      type="button"
                      className={`
                        relative
                        flex
                        aspect-square
                        w-full
                        flex-col
                        items-center
                        justify-center
                        rounded-xl
                        text-sm
                        transition-all
                        duration-200
                        ${selected
                          ? "bg-blue-600 font-semibold text-white shadow-sm"
                          : outside
                            ? "text-neutral-300"
                            : "text-neutral-700 hover:bg-blue-50 hover:text-blue-700"
                        }
                        ${todayDate && !selected
                          ? "ring-1 ring-blue-200"
                          : ""
                        }
                      `}
                    >
                      <span>
                        {day.date.getDate()}
                      </span>

                      {punyaJadwal && (
                        <span
                          className={`
                            absolute
                            bottom-1.5
                            h-1.5
                            w-1.5
                            rounded-full
                            ${selected
                              ? "bg-white"
                              : "bg-blue-600"
                            }
                          `}
                        />
                      )}
                    </button>
                  );
                },
              }}
            />
          </div>

          {/* LEGEND */}
          <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-neutral-100 pt-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600" />

              <span className="text-xs text-neutral-500">
                Ada jadwal
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-600" />

              <span className="text-xs text-neutral-500">
                Tanggal dipilih
              </span>
            </div>
          </div>
        </div>

        {/* DETAIL JADWAL */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-sm font-medium text-blue-600">
              DETAIL JADWAL
            </p>

            <h2 className="mt-1 text-xl font-semibold text-neutral-900">
              {formatTanggal(selectedDateString)}
            </h2>
          </div>

          <div className="max-h-[650px] space-y-4 overflow-y-auto pr-2">
            {jadwalHariIni.length === 0 ? (
              <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl bg-neutral-50 px-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                  <CalendarDays
                    size={24}
                    className="text-neutral-400"
                  />
                </div>

                <h3 className="text-sm font-semibold text-neutral-800">
                  Tidak ada jadwal
                </h3>

                <p className="mt-1 max-w-xs text-xs leading-relaxed text-neutral-500">
                  Tidak ada kegiatan yang dijadwalkan
                  pada tanggal ini.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {jadwalHariIni.map((jadwal) => (
                  <div
                    key={jadwal.id}
                    className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5"
                  >
                    {/* TITLE */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                          <BookOpen size={19} />
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-neutral-900">
                            {jadwal.kegiatan}
                          </h3>

                          <p className="mt-1 text-xs text-neutral-500">
                            Kegiatan magang
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        Jadwal
                      </span>
                    </div>

                    {/* INFO */}
                    <div className="space-y-3">
                      {/* WAKTU */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-600">
                          <Clock size={16} />
                        </div>

                        <div>
                          <p className="text-[11px] text-neutral-400">
                            Waktu
                          </p>

                          <p className="text-sm font-medium text-neutral-700">
                            {jadwal.jamMulai} -{" "}
                            {jadwal.jamSelesai}
                          </p>
                        </div>
                      </div>

                      {/* LOKASI */}
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-600">
                          <MapPin size={16} />
                        </div>

                        <div>
                          <p className="text-[11px] text-neutral-400">
                            Lokasi
                          </p>

                          <p className="text-sm font-medium text-neutral-700">
                            {jadwal.lokasi}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* KETERANGAN */}
                    {jadwal.keterangan && (
                      <div className="mt-4 border-t border-blue-100 pt-4">
                        <p className="text-[11px] text-neutral-400">
                          Keterangan
                        </p>

                        <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                          {jadwal.keterangan}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* JADWAL MENDATANG */}
      <div className="mt-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-neutral-900">
            Jadwal Mendatang
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Beberapa jadwal kegiatan yang akan datang.
          </p>
        </div>

        <div className="max-h-[300px] overflow-y-auto pr-2">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {jadwalData
              .filter(
                (jadwal) =>
                  jadwal.tanggal >= dateToString(tanggalSekarang)
              )
              .map((jadwal) => (
                <button
                  key={jadwal.id}
                  type="button"
                  onClick={() =>
                    setSelectedDate(
                      parseDate(jadwal.tanggal)
                    )
                  }
                  className="group rounded-2xl border border-neutral-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-blue-600">
                        {formatTanggal(jadwal.tanggal)}
                      </p>

                      <h3 className="mt-1 text-sm font-semibold text-neutral-900">
                        {jadwal.kegiatan}
                      </h3>
                    </div>

                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-100">
                      <CalendarDays size={16} />
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                    <Clock size={14} />

                    {jadwal.jamMulai} - {jadwal.jamSelesai}
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}