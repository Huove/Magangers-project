export type StatusIzin = "Menunggu" | "Disetujui" | "Ditolak";
export type TipeBukti = "gambar" | "dokumen" | null;

export type Izin = {
  id: string;
  pesertaNama: string;
  tanggal: string;
  jenisIzin: string;
  keterangan: string;
  status: StatusIzin;
  bukti: {
    tipe: TipeBukti;
    namaFile: string | null;
  };
  catatanPembimbing?: string;
};

// NOTE: data ini disimpan di memori (module-level array), bukan database
// sungguhan. Begitu backend siap, ganti isi file ini dengan pemanggilan API,
// dan `bukti` idealnya berupa URL file yang di-upload peserta (gambar/PDF).
let IZIN_LIST: Izin[] = [
  {
    id: "1",
    pesertaNama: "Sasa Shahidah",
    tanggal: "15 Jul 2026",
    jenisIzin: "Izin Sakit",
    keterangan: "Sakit Demam",
    status: "Menunggu",
    bukti: { tipe: "gambar", namaFile: "surat_dokter_sasa.jpg" },
  },
  {
    id: "2",
    pesertaNama: "Nobeng",
    tanggal: "16 Jul 2026",
    jenisIzin: "Izin Keperluan Keluarga",
    keterangan: "Acara Keluarga",
    status: "Menunggu",
    bukti: { tipe: null, namaFile: null },
  },
  {
    id: "3",
    pesertaNama: "Daffa Capt",
    tanggal: "17 Jul 2026",
    jenisIzin: "Izin Kuliah",
    keterangan: "Acara Kampus",
    status: "Menunggu",
    bukti: { tipe: "dokumen", namaFile: "surat_undangan_kampus.pdf" },
  },
];

export const STATUS_OPTIONS: StatusIzin[] = ["Menunggu", "Disetujui", "Ditolak"];

export function getAllIzin() {
  return IZIN_LIST;
}

export function getIzinById(id: string) {
  return IZIN_LIST.find((i) => i.id === id);
}

export function updateIzinStatus(
  id: string,
  status: StatusIzin,
  catatanPembimbing?: string
) {
  IZIN_LIST = IZIN_LIST.map((i) =>
    i.id === id ? { ...i, status, catatanPembimbing } : i
  );
}

export function getInisial(nama: string) {
  return nama
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
