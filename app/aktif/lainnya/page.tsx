import FocusCards from "@/components/aktif/ui/focus_card";

export default function DashboardPage() {
  const cards = [
    {
      title: "Jadwal",
      src: "/jadwal.jpg",
      href: "/aktif/menu/jadwal",
    },
    {
      title: "Materi",
      src: "/Materi.webp",
      href: "/aktif/menu/materi",
    },
    {
      title: "Laporan",
      src: "/laporan.jpg",
      href: "/aktif/menu/laporan",
    },
    {
      title: "Penilaian",
      src: "/penilaian.jpg",
      href: "/aktif/menu/penilaian",
    },
    {
      title: "Sertifikat",
      src: "/sertifikat.webp",
      href: "/aktif/menu/sertifikat",
    },
  ];

  return (
    <section className="min-h-screen w-full bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <FocusCards cards={cards} />
      </div>
    </section>
  );
}