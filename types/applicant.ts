export type Applicant = {
  id: string;
  pengajuan_id: string;
  total_pengajuan: number;

  nama: string;
  email: string;
  sekolah: string;
  jurusan: string;
  posisi: string;
  alamat: string;
  nohp: string;

  tanggal: string;
  status: string;
  raw_status: string;

  catatan?: string | null;
};