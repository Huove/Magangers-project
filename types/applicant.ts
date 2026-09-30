export type Applicant = {
  id: string; // ✅ peserta_id (1 peserta 1 row)
  pengajuan_id: string; // ✅ pengajuan terbaru (buat approve/reject/revisi + dokumen)
  total_pengajuan: number; // ✅ jumlah pengajuan peserta ini

  nama: string;
  email: string;
  sekolah: string;
  jurusan: string;
  posisi: string;
  alamat: string;
  nohp: string;

  tanggal: string; // ISO string dari pengajuan terbaru
  status: string; // label UI (Menunggu/Diperiksa/dll)
  raw_status: string; // status asli di DB (diajukan/diproses/revisi/dll)

  catatan?: string | null;
};