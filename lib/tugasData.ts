export type StatusTugas = "Menunggu" | "Selesai" | "Terlambat";

export type Tugas = {
  id: string;
  judul: string;
  kategori: string;
  deskripsi: string;
  pesertaNama: string;
  batasWaktu: string;
  status: StatusTugas;
};

// NOTE: ini disimpan di memori (module-level array), BUKAN database
// sungguhan. Data akan hilang setiap kali server dev di-restart atau
// browser di-refresh penuh. Begitu kamu punya backend, ganti seluruh isi
// file ini dengan pemanggilan API (GET /tugas, POST /tugas, dst).
let TUGAS_LIST: Tugas[] = [
  {
    id: "1",
    judul: "Membuat UI Dashboard",
    kategori: "Desain UI",
    deskripsi:
      "Buat rancangan antarmuka dashboard utama sesuai wireframe yang sudah disepakati, termasuk versi desktop dan mobile.",
    pesertaNama: "Sasa Shahidah",
    batasWaktu: "15 Jul 2026",
    status: "Menunggu",
  },
  {
    id: "2",
    judul: "Analisis Kebutuhan Sistem",
    kategori: "Analisis",
    deskripsi:
      "Susun dokumen kebutuhan fungsional dan non-fungsional untuk modul pengajuan magang.",
    pesertaNama: "Nobeng",
    batasWaktu: "16 Jul 2026",
    status: "Menunggu",
  },
  {
    id: "3",
    judul: "Pembuatan API Dokumentasi",
    kategori: "Dokumentasi",
    deskripsi:
      "Dokumentasikan seluruh endpoint API yang sudah dibuat menggunakan format OpenAPI/Swagger.",
    pesertaNama: "Daffa Capt",
    batasWaktu: "17 Jul 2026",
    status: "Menunggu",
  },
  {
    id: "4",
    judul: "Testing Aplikasi",
    kategori: "Testing",
    deskripsi:
      "Lakukan pengujian fungsional pada fitur pendaftaran dan login, catat bug yang ditemukan.",
    pesertaNama: "Adan Abiyyu",
    batasWaktu: "18 Jul 2026",
    status: "Menunggu",
  },
  {
    id: "5",
    judul: "Membuat Laporan Akhir",
    kategori: "Laporan",
    deskripsi:
      "Susun laporan akhir magang yang mencakup ringkasan aktivitas, pencapaian, dan pembelajaran selama magang.",
    pesertaNama: "Wulandari",
    batasWaktu: "19 Jul 2026",
    status: "Menunggu",
  },
];

export const STATUS_OPTIONS: StatusTugas[] = ["Menunggu", "Selesai", "Terlambat"];

export const KATEGORI_OPTIONS = [
  "Desain UI",
  "Analisis",
  "Dokumentasi",
  "Testing",
  "Laporan",
];

export function getAllTugas() {
  return TUGAS_LIST;
}

export function getTugasById(id: string) {
  return TUGAS_LIST.find((t) => t.id === id);
}

export function addTugas(data: Omit<Tugas, "id">) {
  const newTugas: Tugas = { ...data, id: Date.now().toString() };
  TUGAS_LIST = [newTugas, ...TUGAS_LIST];
  return newTugas;
}

export function updateTugasStatus(id: string, status: StatusTugas) {
  TUGAS_LIST = TUGAS_LIST.map((t) => (t.id === id ? { ...t, status } : t));
}

export function getPesertaNames() {
  return Array.from(new Set(TUGAS_LIST.map((t) => t.pesertaNama)));
}

export function getInisial(nama: string) {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
