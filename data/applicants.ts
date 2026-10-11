export interface Applicant {
  nama: string;
  email: string;
  sekolah: string;
  jurusan: string;
  posisi: string;
  alamat: string;
  nohp: string;
  tanggal: string;
  status: string;
}

export const applicants: Applicant[] = [
  {
    nama: "Ahmad Fauzi",
    email: "ahmad@gmail.com",
    sekolah: "SMKN 8 Malang",
    jurusan: "RPL",
    posisi: "Frontend Developer",
    alamat: "Malang",
    nohp: "08123456789",
    tanggal: "12 Juli 2026",
    status: "Menunggu",
  },
  {
    nama: "Nabila Putri",
    email: "nabila@gmail.com",
    sekolah: "SMKN 4 Malang",
    jurusan: "RPL",
    posisi: "UI/UX Designer",
    alamat: "Malang",
    nohp: "08129876543",
    tanggal: "13 Juli 2026",
    status: "Diperiksa",
  },
  {
    nama: "Rizky Saputra",
    email: "rizky@gmail.com",
    sekolah: "Universitas Brawijaya",
    jurusan: "Informatika",
    posisi: "Backend Developer",
    alamat: "Malang",
    nohp: "08135678912",
    tanggal: "14 Juli 2026",
    status: "Menunggu",
  },
];