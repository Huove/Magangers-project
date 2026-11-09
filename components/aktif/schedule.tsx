
"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, BookOpen } from "lucide-react";

import { Calendar } from "@/components/aktif/ui/calendar";
import { supabase } from "@/lib/supabase";

type PengumumanJadwal = {
    id: string;
    judul: string;
    isi: string | null;
    tanggal: string;
    status: string;
};

function tanggalLokal(date: Date): string {
    const tahun = date.getFullYear();
    const bulan = String(date.getMonth() + 1).padStart(2, "0");
    const hari = String(date.getDate()).padStart(2, "0");

    return `${tahun}-${bulan}-${hari}`;
}

function formatTanggal(tanggal: string): string {
    return new Date(`${tanggal}T00:00:00`).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

export default function ScheduleWidget() {
    const [data, setData] = useState<PengumumanJadwal[]>([]);
    const [tanggalDipilih, setTanggalDipilih] = useState<Date>(
        () => new Date()
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let aktif = true;

        async function fetchJadwal() {
            setLoading(true);
            setError(false);

            try {
                const { data: pengumuman, error: queryError } = await supabase
                    .from("pengumuman")
                    .select("id, judul, isi, tanggal, status")
                    .not("tanggal", "is", null)
                    .in("status", ["dipublikasikan", "terjadwal"])
                    .order("tanggal", { ascending: true });

                if (queryError) throw queryError;

                if (aktif) {
                    setData(
                        (pengumuman ?? [])
                            .filter((item) => item.tanggal)
                            .map((item) => ({
                                id: String(item.id),
                                judul: item.judul,
                                isi: item.isi,
                                tanggal: item.tanggal,
                                status: item.status,
                            }))
                    );
                }
            } catch (err) {
                console.error("Gagal mengambil jadwal dashboard:", err);
                if (aktif) setError(true);
            } finally {
                if (aktif) setLoading(false);
            }
        }

        fetchJadwal();

        return () => {
            aktif = false;
        };
    }, []);

    const tanggalString = tanggalLokal(tanggalDipilih);

    const jadwalTerpilih = useMemo(
        () => data.filter((item) => item.tanggal === tanggalString),
        [data, tanggalString]
    );

    const tanggalAdaJadwal = useMemo(
        () =>
            data.map((item) => new Date(`${item.tanggal}T00:00:00`)),
        [data]
    );

    const jadwalMendatang = useMemo(() => {
        const hariIni = tanggalLokal(new Date());

        return data
            .filter((item) => item.tanggal >= hariIni)
            .slice(0, 4);
    }, [data]);

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <CalendarDays size={19} className="text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">
                            Jadwal Kegiatan
                        </h2>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                        Kalender pengumuman dan kegiatan mendatang.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex min-h-40 items-center justify-center">
                    <div className="text-sm text-gray-500">Memuat jadwal...</div>
                </div>
            ) : error ? (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                    Jadwal gagal dimuat. Periksa koneksi atau konfigurasi Supabase.
                </div>
            ) : (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50/60 p-2 sm:p-3">
                        <Calendar
                            mode="single"
                            selected={tanggalDipilih}
                            onSelect={(date) => {
                                if (date) setTanggalDipilih(date);
                            }}
                            modifiers={{
                                adaJadwal: tanggalAdaJadwal,
                            }}
                            modifiersClassNames={{
                                adaJadwal: "bg-blue-50 font-semibold text-blue-700",
                                selected: "bg-blue-100 text-blue-700 hover:bg-blue-100",
                            }}
                            className="mx-auto w-full max-w-sm"
                            classNames={{
                                months: "w-full",
                                month: "w-full space-y-3",
                                month_grid: "w-full",
                                weekdays: "flex w-full",
                                weekday: "flex-1 text-center text-xs text-gray-400",
                                week: "mt-1 flex w-full",
                                day: "relative flex-1",
                            }}
                        />

                        <div className="mt-2 flex items-center justify-center gap-2 border-t border-gray-100 pt-3">
                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                            <span className="text-xs text-gray-500">
                                Tanggal memiliki jadwal
                            </span>
                        </div>
                    </div>

                    <div className="min-w-0 space-y-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                                Tanggal dipilih
                            </p>
                            <h3 className="mt-1 text-sm font-semibold text-gray-900">
                                {formatTanggal(tanggalString)}
                            </h3>
                        </div>

                        {jadwalTerpilih.length > 0 ? (
                            <div className="space-y-2">
                                {jadwalTerpilih.map((item) => (
                                    <article
                                        key={item.id}
                                        className="rounded-xl border border-blue-100 bg-blue-50/60 p-3"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
                                                <BookOpen size={17} />
                                            </div>

                                            <div className="min-w-0">
                                                <h4 className="break-words text-sm font-semibold text-gray-900">
                                                    {item.judul}
                                                </h4>
                                                {item.isi && (
                                                    <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs leading-relaxed text-gray-600">
                                                        {item.isi}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center">
                                <CalendarDays
                                    size={24}
                                    className="mx-auto mb-2 text-gray-300"
                                />
                                <p className="text-sm font-medium text-gray-700">
                                    Tidak ada jadwal
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    Belum ada pengumuman bertanggal pada hari ini.
                                </p>
                            </div>
                        )}

                        <div className="border-t border-gray-100 pt-3">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Jadwal Mendatang
                                </h3>
                                <span className="text-xs text-gray-400">
                                    {jadwalMendatang.length} kegiatan
                                </span>
                            </div>

                            {jadwalMendatang.length > 0 ? (
                                <div className="space-y-2">
                                    {jadwalMendatang.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() =>
                                                setTanggalDipilih(
                                                    new Date(`${item.tanggal}T00:00:00`)
                                                )
                                            }
                                            className="group flex w-full items-center gap-3 rounded-lg border border-gray-100 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
                                        >
                                            <div className="min-w-[48px] rounded-lg bg-gray-50 px-2 py-2 text-center group-hover:bg-white">
                                                <span className="block text-xs text-gray-500">
                                                    {new Date(
                                                        `${item.tanggal}T00:00:00`
                                                    ).toLocaleDateString("id-ID", {
                                                        month: "short",
                                                    })}
                                                </span>
                                                <span className="block text-lg font-semibold text-blue-600">
                                                    {new Date(
                                                        `${item.tanggal}T00:00:00`
                                                    ).getDate()}
                                                </span>
                                            </div>

                                            <span className="min-w-0 flex-1">
                                                <span className="block break-words text-sm font-medium text-gray-800">
                                                    {item.judul}
                                                </span>
                                                <span className="mt-1 block text-xs text-gray-500">
                                                    {formatTanggal(item.tanggal)}
                                                </span>
                                            </span>

                                            <ChevronRight
                                                size={16}
                                                className="shrink-0 text-gray-400 transition group-hover:text-blue-600"
                                            />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Belum ada jadwal mendatang.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
