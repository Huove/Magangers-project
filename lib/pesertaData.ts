export type StatusPeserta = "Aktif" | "Menunggu Verifikasi" | "Selesai";

export type Peserta = {
  id: string;
  nama: string;
  kampus: string;
  posisi: string;
  email: string;
  telepon: string;
  status: StatusPeserta;
  progress: number; // 0-100, progres pengumpulan jurnal/tugas
  needsAttention: boolean;
  attentionNote?: string;
  periodeMagang: string;
  pembimbing: string;
  tempatTanggalLahir: string;
  jenisKelamin: string;
  alamat: string;
  asalInstansi: string;
  jurusan: string;
  semester: string;
};

export const PESERTA_LIST: Peserta[] = [
  {
    id: "1",
    nama: "Sasa Shahidah",
    kampus: "Universitas Brawijaya",
    posisi: "UI/UX Designer",
    email: "sasa.shahidah@gmail.com",
    telepon: "0812-3456-7890",
    status: "Aktif",
    progress: 80,
    needsAttention: false,
    periodeMagang: "1 Juli 2026 - 31 Agustus 2026",
    pembimbing: "Bambang",
    tempatTanggalLahir: "Malang, 12 Maret 2003",
    jenisKelamin: "Perempuan",
    alamat: "Jl. Raya Tlogomas No. 45, Malang",
    asalInstansi: "Universitas Brawijaya",
    jurusan: "Informatika",
    semester: "6",
  },
  {
    id: "2",
    nama: "Dimas Saputra",
    kampus: "Universitas Negeri Malang",
    posisi: "Frontend Developer",
    email: "dimas.saputra@gmail.com",
    telepon: "0813-1122-3344",
    status: "Aktif",
    progress: 45,
    needsAttention: true,
    attentionNote: "Jurnal belum dikumpulkan 3 hari",
    periodeMagang: "1 Juli 2026 - 31 Agustus 2026",
    pembimbing: "Bambang",
    tempatTanggalLahir: "Malang, 4 Januari 2003",
    jenisKelamin: "Laki-laki",
    alamat: "Jl. Sumbersari No. 12, Malang",
    asalInstansi: "Universitas Negeri Malang",
    jurusan: "Sistem Informasi",
    semester: "6",
  },
  {
    id: "3",
    nama: "Nadia Safitri",
    kampus: "Politeknik Negeri Malang",
    posisi: "Backend Developer",
    email: "nadia.safitri@gmail.com",
    telepon: "0821-5566-7788",
    status: "Aktif",
    progress: 60,
    needsAttention: true,
    attentionNote: "Tugas menunggu pemeriksaan 5 hari",
    periodeMagang: "1 Juli 2026 - 31 Agustus 2026",
    pembimbing: "Bambang",
    tempatTanggalLahir: "Kediri, 20 Mei 2003",
    jenisKelamin: "Perempuan",
    alamat: "Jl. Soekarno Hatta No. 8, Malang",
    asalInstansi: "Politeknik Negeri Malang",
    jurusan: "Teknik Informatika",
    semester: "5",
  },
  {
    id: "4",
    nama: "Yoga Firmansyah",
    kampus: "Universitas Brawijaya",
    posisi: "Quality Assurance",
    email: "yoga.firmansyah@gmail.com",
    telepon: "0857-2233-4455",
    status: "Menunggu Verifikasi",
    progress: 10,
    needsAttention: true,
    attentionNote: "Pengajuan izin menunggu persetujuan",
    periodeMagang: "5 Juli 2026 - 5 September 2026",
    pembimbing: "Bambang",
    tempatTanggalLahir: "Blitar, 2 Februari 2003",
    jenisKelamin: "Laki-laki",
    alamat: "Jl. Veteran No. 22, Malang",
    asalInstansi: "Universitas Brawijaya",
    jurusan: "Informatika",
    semester: "6",
  },
  {
    id: "5",
    nama: "Nobeng Pratama",
    kampus: "Universitas Negeri Malang",
    posisi: "Data Analyst",
    email: "nobeng.pratama@gmail.com",
    telepon: "0838-9900-1122",
    status: "Selesai",
    progress: 100,
    needsAttention: false,
    periodeMagang: "1 April 2026 - 30 Juni 2026",
    pembimbing: "Bambang",
    tempatTanggalLahir: "Malang, 15 Agustus 2002",
    jenisKelamin: "Laki-laki",
    alamat: "Jl. Ijen No. 30, Malang",
    asalInstansi: "Universitas Negeri Malang",
    jurusan: "Statistika",
    semester: "7",
  },
  {
    id: "6",
    nama: "Daffa Capt",
    kampus: "Politeknik Negeri Malang",
    posisi: "Mobile Developer",
    email: "daffa.capt@gmail.com",
    telepon: "0819-4433-2211",
    status: "Aktif",
    progress: 70,
    needsAttention: false,
    periodeMagang: "1 Juli 2026 - 31 Agustus 2026",
    pembimbing: "Bambang",
    tempatTanggalLahir: "Surabaya, 9 Juni 2003",
    jenisKelamin: "Laki-laki",
    alamat: "Jl. Bendungan Sigura-gura No. 5, Malang",
    asalInstansi: "Politeknik Negeri Malang",
    jurusan: "Teknik Informatika",
    semester: "5",
  },
  {
    id: "7",
    nama: "Adan Abiyyu",
    kampus: "Universitas Brawijaya",
    posisi: "UI/UX Designer",
    email: "adan.abiyyu@gmail.com",
    telepon: "0851-7788-9900",
    status: "Aktif",
    progress: 55,
    needsAttention: false,
    periodeMagang: "1 Juli 2026 - 31 Agustus 2026",
    pembimbing: "Bambang",
    tempatTanggalLahir: "Malang, 30 Oktober 2003",
    jenisKelamin: "Laki-laki",
    alamat: "Jl. Kawi No. 18, Malang",
    asalInstansi: "Universitas Brawijaya",
    jurusan: "Informatika",
    semester: "6",
  },
];

export function getPesertaById(id: string) {
  return PESERTA_LIST.find((p) => p.id === id);
}
