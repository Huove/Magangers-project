"use client";

import { Eye } from "lucide-react";

import type { Report } from "@/app/admin/laporan/page";

interface Props {
  data: Report[];
  onDetail: (report: Report) => void;
}

export default function ReportTable({
  data,
  onDetail,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-gray-50">

            <tr className="text-left text-sm text-gray-500">

              <th className="px-6 py-4">
                Peserta
              </th>

              <th className="px-6 py-4">
                Judul
              </th>

              <th className="px-6 py-4">
                Pembimbing
              </th>

              <th className="px-6 py-4">
                Tanggal
              </th>

              <th className="px-6 py-4">
                Status
              </th>

              <th className="px-6 py-4 text-center">
                Aksi
              </th>

            </tr>

          </thead>

          <tbody>

            {data.length === 0 ? (

              <tr>

                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Tidak ada laporan ditemukan.
                </td>

              </tr>

            ) : (

              data.map((item) => (

                <tr
                  key={item.id}
                  className="border-t transition hover:bg-gray-50"
                >

                  <td className="px-6 py-5">

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600">

                        {item.peserta
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}

                      </div>

                      <div>

                        <p className="font-semibold">
                          {item.peserta}
                        </p>

                      </div>

                    </div>

                  </td>

                  <td className="px-6 py-5">
                    {item.judul}
                  </td>

                  <td className="px-6 py-5">
                    {item.pembimbing}
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
                      type="button"
                      onClick={() => onDetail(item)}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-600 hover:text-white"
                    >

                      <Eye size={16} />

                      Detail

                    </button>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let color =
    "bg-gray-100 text-gray-700";

  if (status === "Menunggu") {
    color =
      "bg-yellow-100 text-yellow-700";
  }

  if (status === "Direvisi") {
    color =
      "bg-orange-100 text-orange-700";
  }

  if (status === "Disetujui") {
    color =
      "bg-green-100 text-green-700";
  }

  if (status === "Ditolak") {
    color =
      "bg-red-100 text-red-700";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}
    >
      {status}
    </span>
  );
}