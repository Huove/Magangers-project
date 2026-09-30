"use client";

import { useUser } from "@/components/pendaftar/UserContext";
import { FileText, Camera, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type DocKey = "kartuPelajar" | "ktp" | "cv" | "suratPengantar" | "pasFoto";

type DocItem = {
  jenis: DocKey;
  path: string;
  mime_type: string | null;
  size: number | null;
  uploaded_at: string;
  url: string | null; // signed url
};

export default function DokumenPage() {
  const { documents, setDocuments } = useUser();

  // biar enak diakses by key
  const docsMap = (documents ?? {}) as Record<DocKey, string | undefined>;

  const [dragOver, setDragOver] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const docList: { key: DocKey; label: string }[] = [
    { key: "kartuPelajar", label: "Kartu Pelajar / Mahasiswa" },
    { key: "ktp", label: "KTP / Kartu Keluarga" },
    { key: "cv", label: "Curriculum Vitae" },
    { key: "suratPengantar", label: "Surat Pengantar Sekolah / Kampus" },
    { key: "pasFoto", label: "Pas Foto" },
  ];

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function safeJson(res: Response) {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  async function loadDocs() {
    setError("");

    const token = await getToken();
    if (!token) {
      setError("Session tidak ditemukan. Silakan login ulang.");
      return;
    }

    const res = await fetch("/api/pendaftar/dokumen/list", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const json = await safeJson(res);
    if (!res.ok) {
      setError(
        (json?.message ?? "Gagal load dokumen") +
          (json?.detail ? ` (${json.detail})` : "")
      );
      return;
    }

    const rows: DocItem[] = json?.data ?? [];

    // mapping: jenis -> signedUrl
    const map: Partial<Record<DocKey, string | undefined>> = {};
    for (const r of rows) {
      map[r.jenis] = r.url ?? undefined;
    }

    // ✅ FIX: jangan pakai callback prev => ...
    // karena setDocuments di context kamu kemungkinan typed sebagai (docs: DocumentType) => void
    setDocuments({ ...(documents as any), ...(map as any) } as any);
  }

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadToBackend(file: File, key: DocKey) {
    setLoading(true);
    setError("");

    try {
      const token = await getToken();
      if (!token) {
        setError("Session tidak ditemukan. Silakan login ulang.");
        return;
      }

      const fd = new FormData();
      fd.append("jenis", key);
      fd.append("file", file);

      const res = await fetch("/api/pendaftar/dokumen/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const json = await safeJson(res);
      if (!res.ok) {
        setError(
          (json?.message ?? "Upload gagal") +
            (json?.detail ? ` (${json.detail})` : "")
        );
        return;
      }

      // refresh list agar dapat signed url terbaru
      await loadDocs();
    } finally {
      setLoading(false);
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, key: DocKey) => {
    e.preventDefault();
    setDragOver(null);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    uploadToBackend(file, key);
  };

  const total = docList.length;
  const uploaded = docList.filter((doc) => Boolean(docsMap[doc.key])).length;
  const percentage = Math.round((uploaded / total) * 100);

  return (
    <div className="min-h-screen bg-gray-50/60">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Dokumen Peserta
          </h1>
          <p className="text-gray-500 mt-2">
            Unggah seluruh dokumen yang diperlukan untuk proses pendaftaran magang.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            Mengupload... mohon tunggu
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Kelengkapan Dokumen</h2>
              <p className="text-sm text-gray-500 mt-1">
                {uploaded} dari {total} dokumen telah diunggah
              </p>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{percentage}%</div>
              <div className="text-xs text-gray-500">Selesai</div>
            </div>
          </div>

          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {docList.map((doc) => {
            const fileUrl = docsMap[doc.key];
            const isUploaded = Boolean(fileUrl);

            // signedUrl biasanya masih mengandung nama file .png/.jpg/.jpeg/.webp di path
            const isImage =
              typeof fileUrl === "string" &&
              /(\.png|\.jpg|\.jpeg|\.webp)(\?|$)/i.test(fileUrl);

            return (
              <div
                key={doc.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(doc.key);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, doc.key)}
                className={`group relative bg-white border rounded-3xl p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                  dragOver === doc.key
                    ? "border-blue-400 ring-4 ring-blue-100 shadow-lg"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                        isUploaded
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <FileText size={20} />
                    </div>

                    <div>
                      <h2 className="font-semibold text-gray-900 leading-snug">
                        {doc.label}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Format JPG, PNG, WEBP, atau PDF
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-dashed border-gray-200 flex items-center justify-center">
                  {isUploaded ? (
                    isImage ? (
                      <img
                        src={fileUrl}
                        alt={doc.label}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-gray-600">
                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3">
                          <FileText size={28} />
                        </div>
                        <span className="text-sm font-medium">File sudah tersimpan</span>
                        {fileUrl && (
                          <a
                            className="mt-2 text-sm text-blue-600 underline"
                            href={fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Lihat / Unduh
                          </a>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 px-4 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-3">
                        <Camera size={28} />
                      </div>

                      <span className="text-sm font-medium text-gray-600">
                        Drag & drop file di sini
                      </span>

                      <span className="text-xs text-gray-400 mt-1">
                        atau klik tombol upload
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <label className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-medium text-white cursor-pointer transition-all duration-200 hover:bg-blue-700 hover:shadow-md active:scale-[0.98]">
                    <Upload size={16} />
                    {isUploaded ? "Ganti File" : "Upload File"}

                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        uploadToBackend(file, doc.key);
                      }}
                    />
                  </label>

                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      isUploaded
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isUploaded ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    {isUploaded ? "Sudah Upload" : "Belum Upload"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}