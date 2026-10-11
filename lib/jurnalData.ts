export type StatusJurnal = "Menunggu" | "Disetujui" | "Perlu Revisi";

export type Jurnal = {
  id: string;
  pesertaNama: string;
  tanggal: string;
  judulJurnal: string;
  isiJurnal: string;
  status: StatusJurnal;
};

// NOTE: data ini disimpan di memori (module-level array), bukan database
// sungguhan. Begitu backend siap, ganti isi file ini dengan pemanggilan API.
let JURNAL_LIST: Jurnal[] = [
  {
    id: "1",
    pesertaNama: "Sasa Shahidah",
    tanggal: "15 Jul 2026",
    judulJurnal: "UI/UX Aplikasi Absensi",
    isiJurnal:
      "Hari ini saya merancang wireframe untuk fitur absensi karyawan, termasuk alur check-in dan check-out. Saya juga melakukan riset singkat terhadap aplikasi sejenis untuk referensi pola interaksi.",
    status: "Menunggu",
  },
  {
    id: "2",
    pesertaNama: "Nobeng",
    tanggal: "16 Jul 2026",
    judulJurnal: "Pengembangan CMS Sederhana",
    isiJurnal:
      "Melanjutkan pengembangan modul manajemen konten, menambahkan fitur upload gambar dan validasi form pada sisi backend.",
    status: "Menunggu",
  },
  {
    id: "3",
    pesertaNama: "Daffa Capt",
    tanggal: "17 Jul 2026",
    judulJurnal: "Integrasi Payment Gateway",
    isiJurnal:
      "Melakukan integrasi dengan payment gateway pihak ketiga, menguji alur pembayaran di lingkungan sandbox, dan menangani beberapa kasus error response.",
    status: "Menunggu",
  },
  {
    id: "4",
    pesertaNama: "Adan Abiyyu",
    tanggal: "18 Jul 2026",
    judulJurnal: "Dashboard Monitoring KPI",
    isiJurnal:
      "Membuat komponen chart untuk menampilkan data KPI tim secara real-time, serta menyesuaikan tampilan agar responsif di perangkat mobile.",
    status: "Menunggu",
  },
  {
    id: "5",
    pesertaNama: "Wulandari",
    tanggal: "19 Jul 2026",
    judulJurnal: "Optimasi Query SQL",
    isiJurnal:
      "Menganalisis query yang lambat pada modul laporan, menambahkan index yang sesuai, dan berhasil menurunkan waktu eksekusi secara signifikan.",
    status: "Menunggu",
  },
];

export const STATUS_OPTIONS: StatusJurnal[] = [
  "Menunggu",
  "Disetujui",
  "Perlu Revisi",
];

export function getAllJurnal() {
  return JURNAL_LIST;
}

export function getJurnalById(id: string) {
  return JURNAL_LIST.find((j) => j.id === id);
}

export function updateJurnalStatus(id: string, status: StatusJurnal) {
  JURNAL_LIST = JURNAL_LIST.map((j) => (j.id === id ? { ...j, status } : j));
}

export function getTanggalOptions() {
  return Array.from(new Set(JURNAL_LIST.map((j) => j.tanggal)));
}

export function getInisial(nama: string) {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
