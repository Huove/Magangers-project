const applicants = [
  {
    name: "Ahmad Fauzi",
    school: "SMKN 8 Malang",
    position: "Frontend Developer",
    status: "Menunggu Pemeriksaan",
  },
  {
    name: "Nisa Putri",
    school: "Universitas Brawijaya",
    position: "UI/UX Designer",
    status: "Pengajuan Baru",
  },
  {
    name: "Bagas Pratama",
    school: "Politeknik Negeri Malang",
    position: "Backend Developer",
    status: "Menunggu Wawancara",
  },
  {
    name: "Rizki Ramadhan",
    school: "SMKN 4 Malang",
    position: "Data Analyst",
    status: "Diterima",
  },
];

export default function RecentApplications() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      <div className="mb-5 flex items-center justify-between">

        <h2 className="text-lg font-semibold">
          Pengajuan Terbaru
        </h2>

        <button className="text-sm font-medium text-blue-600 hover:underline">
          Lihat Semua
        </button>

      </div>

      <table className="w-full">

        <thead>

          <tr className="border-b">

            <th className="py-3 text-left text-sm font-semibold">
              Nama
            </th>

            <th className="text-left text-sm font-semibold">
              Sekolah / Kampus
            </th>

            <th className="text-left text-sm font-semibold">
              Posisi
            </th>

            <th className="text-left text-sm font-semibold">
              Status
            </th>

          </tr>

        </thead>

        <tbody>

          {applicants.map((item) => (

            <tr
              key={item.name}
              className="border-b hover:bg-gray-50"
            >

              <td className="py-4 font-medium">
                {item.name}
              </td>

              <td>
                {item.school}
              </td>

              <td>
                {item.position}
              </td>

              <td>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {item.status}
                </span>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}