"use client";

import { Eye } from "lucide-react";
import type { Applicant } from "@/types/applicant";

interface Props {
  data: Applicant[];
  onDetail: (applicant: Applicant) => void;
}

export default function ApplicantTable({
  data,
  onDetail,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-left text-sm text-gray-500">
              <th className="px-6 py-4">Pelamar</th>
              <th className="px-6 py-4">Sekolah</th>
              <th className="px-6 py-4">Posisi</th>
              <th className="px-6 py-4">Tanggal</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                className="border-t hover:bg-gray-50"
              >
                <td className="px-6 py-5">
                  <div>
                    <p className="font-semibold">
                      {item.nama}
                    </p>

                    <p className="text-sm text-gray-500">
                      {item.email}
                    </p>
                  </div>
                </td>

                <td className="px-6 py-5">
                  {item.sekolah}
                </td>

                <td className="px-6 py-5">
                  {item.posisi}
                </td>

                <td className="px-6 py-5">
                  {item.tanggal}
                </td>

                <td className="px-6 py-5">
                  <StatusBadge
                    status={item.status}
                  />
                </td>

                <td className="px-6 py-5 text-center">
                  <button
                    onClick={() => onDetail(item)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
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

      {/* PAGINATION */}

      <div className="flex items-center justify-between border-t px-6 py-4">
        <p className="text-sm text-gray-500">
          Menampilkan {data.length} pelamar
        </p>

        <div className="flex gap-2">
          <button className="rounded-lg border px-3 py-1 hover:bg-gray-100">
            ←
          </button>

          <button className="rounded-lg bg-blue-600 px-3 py-1 text-white">
            1
          </button>

          <button className="rounded-lg border px-3 py-1 hover:bg-gray-100">
            2
          </button>

          <button className="rounded-lg border px-3 py-1 hover:bg-gray-100">
            →
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let color = "bg-gray-100 text-gray-700";

  if (status === "Menunggu") {
    color = "bg-yellow-100 text-yellow-700";
  }

  if (status === "Diperiksa") {
    color = "bg-blue-100 text-blue-700";
  }

  if (status === "Revisi") {
    color = "bg-orange-100 text-orange-700";
  }

  if (status === "Diterima") {
    color = "bg-green-100 text-green-700";
  }

  if (status === "Ditolak") {
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