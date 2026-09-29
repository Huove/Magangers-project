"use client";

import { useEffect, useId, useMemo, useState } from "react";

/** Map data dari API ke bentuk ini. Tanggal harus YYYY-MM-DD, jam HH:mm.
 * Berikan seluruh jadwal mendatang (jangan dibatasi hanya 3/5 record).
 * Waktu mengikuti zona Asia/Jakarta; sesuaikan timeZone bila diperlukan.
 */
export type JadwalEvaluasi = {
  id: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai?: string | null;
  namaPeserta: string;
  judul?: string | null;
  lokasi?: string | null;
};

type Props = {
  jadwal: JadwalEvaluasi[];
  loading?: boolean;
  error?: string | null;
  lihatSemuaHref?: string;
  timeZone?: string;
};

const HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function tanggalHariIni(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function tanggalUTC(tanggal: string) {
  const [tahun, bulan, hari] = tanggal.split("-").map(Number);
  return new Date(Date.UTC(tahun, bulan - 1, hari));
}

function formatTanggal(tanggal: string) {
  return tanggalUTC(tanggal).toLocaleDateString("id-ID", {
    timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function geserBulan(bulan: string, langkah: number) {
  const tanggal = tanggalUTC(`${bulan}-01`);
  tanggal.setUTCMonth(tanggal.getUTCMonth() + langkah);
  return tanggal.toISOString().slice(0, 7);
}

export default function JadwalEvaluasiKalender({
  jadwal,
  loading = false,
  error = null,
  lihatSemuaHref,
  timeZone = "Asia/Jakarta",
}: Props) {
  const headingId = useId();
  const [hariIni, setHariIni] = useState("");
  const [bulan, setBulan] = useState("");
  const [tanggalDipilih, setTanggalDipilih] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const sekarang = tanggalHariIni(timeZone);
      setHariIni(sekarang);
      setBulan((sebelumnya) => sebelumnya || sekarang.slice(0, 7));
    };
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [timeZone]);

  const perTanggal = useMemo(() => {
    const groups = new Map<string, JadwalEvaluasi[]>();
    [...jadwal]
      .filter((item) => item.tanggal >= hariIni)
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jamMulai.localeCompare(b.jamMulai))
      .forEach((item) => {
        const items = groups.get(item.tanggal) ?? [];
        items.push(item);
        groups.set(item.tanggal, items);
      });
    return groups;
  }, [jadwal, hariIni]);

  const daftarBulan = [...perTanggal.entries()].filter(([tanggal]) => tanggal.startsWith(`${bulan}-`));
  const daftarTampil = tanggalDipilih
    ? daftarBulan.filter(([tanggal]) => tanggal === tanggalDipilih)
    : daftarBulan;
  const jumlahEvaluasi = daftarBulan.reduce((jumlah, [, items]) => jumlah + items.length, 0);
  const siap = Boolean(bulan && hariIni);
  const awalBulan = siap ? tanggalUTC(`${bulan}-01`) : null;
  const offset = awalBulan ? (awalBulan.getUTCDay() + 6) % 7 : 0;
  const jumlahHari = awalBulan
    ? new Date(Date.UTC(awalBulan.getUTCFullYear(), awalBulan.getUTCMonth() + 1, 0)).getUTCDate()
    : 0;
  const jumlahSel = Math.ceil((offset + jumlahHari) / 7) * 7;
  const judulBulan = awalBulan?.toLocaleDateString("id-ID", {
    timeZone: "UTC", month: "long", year: "numeric",
  });

  function pindahBulan(langkah: number) {
    setBulan((sebelumnya) => geserBulan(sebelumnya, langkah));
    setTanggalDipilih(null);
  }

  const tombolNavigasi = "flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600";

  return (
    <section aria-labelledby={headingId} aria-busy={loading || !siap}
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg font-bold text-slate-900 sm:text-xl">
          Jadwal Evaluasi Mendatang
        </h2>
        {lihatSemuaHref && (
          <a href={lihatSemuaHref} className="rounded text-sm font-semibold text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            Lihat semua
          </a>
        )}
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
      ) : loading || !siap ? (
        <p role="status" className="py-16 text-center text-sm text-slate-500">Memuat jadwal evaluasi...</p>
      ) : (
        <div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="mb-5 flex items-center justify-between gap-2">
              <h3 className="font-semibold text-slate-900" aria-live="polite">{judulBulan}</h3>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setBulan(hariIni.slice(0, 7)); setTanggalDipilih(null); }}
                  className="rounded-lg px-2 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                  Hari ini
                </button>
                <button type="button" onClick={() => pindahBulan(-1)} aria-label="Bulan sebelumnya" className={tombolNavigasi}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button type="button" onClick={() => pindahBulan(1)} aria-label="Bulan berikutnya" className={tombolNavigasi}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {HARI.map((hari) => <span key={hari} className="pb-2 text-xs font-medium text-slate-500">{hari}</span>)}
              {Array.from({ length: jumlahSel }, (_, index) => {
                const hari = index - offset + 1;
                if (hari < 1 || hari > jumlahHari) return <span key={`kosong-${index}`} aria-hidden="true" />;
                const tanggal = `${bulan}-${String(hari).padStart(2, "0")}`;
                const jumlah = perTanggal.get(tanggal)?.length ?? 0;
                const dipilih = tanggalDipilih === tanggal;
                return (
                  <button key={tanggal} type="button" aria-pressed={dipilih}
                    aria-current={tanggal === hariIni ? "date" : undefined}
                    aria-label={`${formatTanggal(tanggal)}, ${jumlah ? `${jumlah} jadwal evaluasi` : "tidak ada evaluasi mendatang"}`}
                    onClick={() => setTanggalDipilih(dipilih ? null : tanggal)}
                    className={`relative flex h-11 items-center justify-center rounded-xl pb-1 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      dipilih ? "bg-blue-100 font-bold text-blue-800 ring-1 ring-blue-300"
                        : tanggal === hariIni ? "bg-slate-100 font-semibold text-blue-700 hover:bg-blue-50"
                          : "text-slate-700 hover:bg-blue-50"
                    }`}>
                    {hari}
                    {jumlah > 0 && <span aria-hidden="true" className="absolute bottom-1.5 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-blue-600" />}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <span aria-hidden="true" className="h-1 w-5 rounded-full bg-blue-600" />Ada jadwal evaluasi
            </p>
          </div>

          <div className="min-w-0 border-t border-slate-100 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">{tanggalDipilih ? formatTanggal(tanggalDipilih) : `Evaluasi ${judulBulan}`}</h3>
                <p className="mt-1 text-xs text-slate-500">{jumlahEvaluasi} evaluasi mendatang bulan ini</p>
              </div>
              {tanggalDipilih && <button type="button" onClick={() => setTanggalDipilih(null)}
                className="rounded text-xs font-semibold text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                Semua tanggal
              </button>}
            </div>

            <div role="region" aria-label="Daftar jadwal evaluasi" tabIndex={0}
              className="max-h-80 space-y-4 overflow-y-auto rounded-xl pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              {daftarTampil.length === 0 ? (
                <p role="status" className="rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  {tanggalDipilih ? "Tidak ada evaluasi mendatang pada tanggal ini." : "Belum ada jadwal evaluasi mendatang pada bulan ini."}
                </p>
              ) : daftarTampil.map(([tanggal, items]) => (
                <div key={tanggal}>
                  <p className="mb-2 text-sm font-semibold text-slate-700"><time dateTime={tanggal}>{formatTanggal(tanggal)}</time></p>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item.id} className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                        <p className="break-words text-sm font-semibold text-slate-900">{item.judul || "Evaluasi Peserta"}</p>
                        <p className="mt-1 break-words text-sm text-slate-600">Dengan {item.namaPeserta}</p>
                        <p className="mt-2 text-sm font-medium text-blue-700">
                          Pukul {item.jamMulai.slice(0, 5)}{item.jamSelesai ? `–${item.jamSelesai.slice(0, 5)}` : ""}
                        </p>
                        {item.lokasi && <p className="mt-1 break-words text-xs text-slate-500">{item.lokasi}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
