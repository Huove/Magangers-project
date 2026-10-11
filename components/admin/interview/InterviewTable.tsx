"use client";

import { Eye } from "lucide-react";
import type { Interview } from "@/app/admin/wawancara/page";

interface Props {
  data: Interview[];
  onDetail: (interview: Interview) => void;
}

export default function InterviewTable({
  data,
  onDetail,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-500">
              <th className="px-6 py-4">Peserta</th>
              <th className="px-6 py-4">Sekolah</th>
              <th className="px-6 py-4">Posisi</th>
              <th className="px-6 py-4">Jadwal</th>
              <th className="px-6 py-4">Interviewer</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr
                key={item.email}
                className="border-t transition hover:bg-gray-50"
              >
                {/* Peserta */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">
                      {item.nama
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>

                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.nama}
                      </p>

                      <p className="text-sm text-gray-500">
                        {item.email}
                      </p>

                      <p className="text-xs text-gray-400">
                        {item.sekolah}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Sekolah */}
                <td className="px-6 py-5">
                  {item.sekolah}
                </td>

                {/* Posisi */}
                <td className="px-6 py-5">
                  {item.posisi}
                </td>

                {/* Jadwal */}
                <td className="px-6 py-5">
                  <div>
                    <p className="font-medium">
                      {item.tanggal}
                    </p>

                    <p className="text-sm text-blue-600">
                      {item.jam}
                    </p>
                  </div>
                </td>

                {/* Interviewer */}
                <td className="px-6 py-5">
                  {item.interviewer}
                </td>

                {/* Status */}
                <td className="px-6 py-5">
                  <InterviewStatusBadge status={item.status} />
                </td>

                {/* Aksi */}
                <td className="px-6 py-5 text-center">
                  <button
                    type="button"
                    onClick={() => onDetail(item)}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-600 hover:text-white"
                  >
                    <Eye size={16} />
                    Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t px-6 py-4">
        <p className="text-sm text-gray-500">
          Menampilkan {data.length} jadwal wawancara
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg border px-3 py-1 hover:bg-gray-100"
          >
            ←
          </button>

          <button
            type="button"
            className="rounded-lg bg-blue-600 px-3 py-1 text-white"
          >
            1
          </button>

          <button
            type="button"
            className="rounded-lg border px-3 py-1 hover:bg-gray-100"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

function InterviewStatusBadge({
  status,
}: {
  status: string;
}) {
  let color = "bg-gray-100 text-gray-700";

  if (status === "Menunggu") {
    color = "bg-yellow-100 text-yellow-700";
  }

  if (status === "Dijadwalkan") {
    color = "bg-blue-100 text-blue-700";
  }

  if (status === "Selesai") {
    color = "bg-green-100 text-green-700";
  }

  if (status === "Lulus") {
    color = "bg-emerald-100 text-emerald-700";
  }

  if (status === "Tidak Lulus") {
    color = "bg-red-100 text-red-700";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}
    >
      {status}
    </span>
  );
}