export type AdminApplicant = {
  peserta_id: string;        // 1 peserta 1 row
  pengajuan_id: string;      // pengajuan terbaru
  total_pengajuan: number;

  nama: string;
  email: string;
  sekolah: string;
  jurusan: string;
  posisi: string;
  alamat: string;
  nohp: string;

  tanggal: string;
  status: string;      // label UI
  raw_status: string;  // status DB
  catatan?: string | null;
};