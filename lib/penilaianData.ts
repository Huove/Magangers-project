export type StatusAspek = "Sudah Dinilai" | "Belum Dinilai";

export type AspekPenilaian = {
  id: string;
  aspek: string;
  bobot: number; // dalam persen, misal 10 = 10%
  nilai: number; // skala 1-100
  status: StatusAspek;
};

const DEFAULT_ASPEK: AspekPenilaian[] = [
  { id: "kehadiran", aspek: "Kehadiran", bobot: 10, nilai: 80, status: "Sudah Dinilai" },
  { id: "kedisiplinan", aspek: "Kedisiplinan", bobot: 10, nilai: 90, status: "Sudah Dinilai" },
  { id: "sikap", aspek: "Sikap", bobot: 10, nilai: 85, status: "Sudah Dinilai" },
];

// NOTE: disimpan di memori (module-level map), bukan database sungguhan.
// Key-nya adalah id peserta (mengacu ke lib/pesertaData.ts).
const PENILAIAN_MAP = new Map<string, AspekPenilaian[]>();

export function getPenilaianByPesertaId(pesertaId: string): AspekPenilaian[] {
  if (!PENILAIAN_MAP.has(pesertaId)) {
    // clone supaya tiap peserta punya array sendiri, tidak saling nimpa
    PENILAIAN_MAP.set(
      pesertaId,
      DEFAULT_ASPEK.map((a) => ({ ...a }))
    );
  }
  return PENILAIAN_MAP.get(pesertaId)!;
}

export function savePenilaian(pesertaId: string, aspek: AspekPenilaian[]) {
  PENILAIAN_MAP.set(pesertaId, aspek);
}

export function hitungNilaiAkhir(nilai: number) {
  // Konversi skala 1-100 ke skala 1-10
  return (nilai / 10).toFixed(1);
}

export function hitungNilaiTotal(aspek: AspekPenilaian[]) {
  const totalBobot = aspek.reduce((sum, a) => sum + a.bobot, 0) || 1;
  const totalTerbobot = aspek.reduce(
    (sum, a) => sum + (a.nilai * a.bobot) / 100,
    0
  );
  // Normalisasi kalau total bobot belum 100%, lalu ubah ke skala 1-10
  const nilaiSkala100 = (totalTerbobot / totalBobot) * 100;
  return (nilaiSkala100 / 10).toFixed(1);
}
