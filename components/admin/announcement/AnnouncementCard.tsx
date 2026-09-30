"use client";

import {
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  Users,
  Paperclip,
} from "lucide-react";

import { Announcement } from "@/app/admin/pengumuman/page";

interface Props {
  data: Announcement[];
  onDetail: (announcement: Announcement) => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string) => void;
}

export default function AnnouncementCard({
  data,
  onDetail,
  onEdit,
  onDelete,
}: Props) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">

        <p className="text-lg font-semibold">
          Pengumuman tidak ditemukan
        </p>

        <p className="mt-2 text-sm text-gray-500">
          Coba gunakan kata kunci pencarian lain.
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-5">

      {data.map((item) => (

        <div
          key={item.id}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >

          {/* CONTENT */}

          <div className="flex items-start justify-between gap-5">

            <div className="min-w-0">

              <h2 className="text-xl font-semibold">
                {item.judul}
              </h2>

              <p className="mt-2 text-gray-600">
                {item.isi}
              </p>

              {/* INFO */}

              <div className="mt-5 flex flex-wrap gap-6 text-sm text-gray-500">

                <div className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {item.tanggal}
                </div>

                <div className="flex items-center gap-2">
                  <Users size={16} />
                  {item.target}
                </div>

                {item.attachment && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Paperclip size={16} />
                    {item.attachment.name}
                  </div>
                )}

              </div>

            </div>

            <StatusBadge
              status={item.status}
            />

          </div>

          {/* BUTTON */}

          <div className="mt-6 flex justify-end gap-3">

            {/* DETAIL */}

            <button
              type="button"
              title="Lihat detail"
              onClick={() =>
                onDetail(item)
              }
              className="rounded-xl border border-blue-600 p-2.5 text-blue-600 transition hover:bg-blue-600 hover:text-white"
            >
              <Eye size={18} />
            </button>

            {/* EDIT */}

            <button
              type="button"
              title="Edit"
              onClick={() =>
                onEdit(item)
              }
              className="rounded-xl border border-yellow-500 p-2.5 text-yellow-600 transition hover:bg-yellow-500 hover:text-white"
            >
              <Pencil size={18} />
            </button>

            {/* DELETE */}

            <button
              type="button"
              title="Hapus"
              onClick={() =>
                onDelete(item.id)
              }
              className="rounded-xl border border-red-500 p-2.5 text-red-600 transition hover:bg-red-500 hover:text-white"
            >
              <Trash2 size={18} />
            </button>

          </div>

        </div>

      ))}

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

  if (status === "Dipublikasikan") {
    color =
      "bg-green-100 text-green-700";
  }

  if (status === "Draft") {
    color =
      "bg-yellow-100 text-yellow-700";
  }

  if (status === "Terjadwal") {
    color =
      "bg-blue-100 text-blue-700";
  }

  return (
    <span
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${color}`}
    >
      {status}
    </span>
  );
}