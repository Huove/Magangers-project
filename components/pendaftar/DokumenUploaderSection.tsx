"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/components/pendaftar/UserContext";
import { FileText, Upload, X, CheckCircle2, Files } from "lucide-react";

type DocKey = "kartuPelajar" | "ktp" | "cv" | "suratPengantar" | "pasFoto";

type DocItem = {
  jenis: DocKey;
  path: string;
  mime_type: string | null;
  size: number | null;
  uploaded_at: string;
  url: string | null; // signed url
};

export default function DokumenUploaderSection() {
  const { documents, setDocuments } = useUser();

  // documents di context kamu kita treat sebagai map: key -> signedUrl
  const docsMap = (documents ?? {}) as Record<DocKey, string | undefined>;

  const [loadingKey, setLoadingKey] = useState<DocKey | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [loadLoading, setLoadLoading] = useState<boolean>(false);

  const documentList: { key: DocKey; label: string; description: string }[] = [
    { key: "kartuPelajar", label: "Kartu Pelajar / Mahasiswa", description: "Kartu identitas pelajar atau mahasiswa." },
    { key: "ktp", label: "KTP / KK", description: "Kartu identitas atau kartu keluarga." },
    { key: "cv", label: "Curriculum Vitae", description: "CV terbaru peserta magang." },
    { key: "suratPengantar", label: "Surat Pengantar", description: "Surat pengantar dari sekolah atau kampus." },
    { key: "pasFoto", label: "Pas Foto", description: "Pas foto terbaru peserta." },
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
    setLoadError("");
    setLoadLoading(true);

    try {
      const token = await getToken();
      if (!token) {
        setLoadError("Session tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await fetch("/api/pendaftar/dokumen/list", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = await safeJson(res);
      if (!res.ok) {
        setLoadError(
          (json?.message ?? "Gagal load dokumen") +
            (json?.detail ? ` (${json.detail})` : "")
        );
        return;
      }

      const rows: DocItem[] = json?.data ?? [];

      const map: Partial<Record<DocKey, string | undefined>> = {};
      for (const r of rows) map[r.jenis] = r.url ?? undefined;

      // ✅ jangan pakai callback prev => ... (biar aman dengan typing context kamu)
      setDocuments({ ...(documents as any), ...(map as any) } as any);
    } finally {
      setLoadLoading(false);
    }
  }

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadToBackend(file: File, key: DocKey) {
    setLoadingKey(key);
    setLoadError("");

    try {
      const token = await getToken();
      if (!token) {
        setLoadError("Session tidak ditemukan. Silakan login ulang.");
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
        setLoadError(
          (json?.message ?? "Upload gagal") +
            (json?.detail ? ` (${json.detail})` : "")
        );
        return;
      }

      await loadDocs();
    } finally {
      setLoadingKey(null);
    }
  }

  // OPTIONAL: tombol X “hapus” ini cuma hapus tampilan lokal (tidak hapus dari DB/Storage)
  // biar tidak bikin error, kita keep local only.
  function removeLocal(key: DocKey) {
    const next = { ...(documents as any) };
    delete next[key];
    setDocuments(next as any);
  }

  const uploadedDocuments = documentList.filter((d) => Boolean(docsMap[d.key])).length;
  const totalDocuments = documentList.length;
  const percentage = Math.round((uploadedDocuments / totalDocuments) * 100);
  const isDocumentsComplete = uploadedDocuments === totalDocuments;

  return (
    <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Files size={20} />
        </div>

        <div className="flex-1">
          <h2 className="text-lg font-semibold text-neutral-900">Dokumen Peserta</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Upload dokumen yang diperlukan untuk melengkapi data peserta.
          </p>
        </div>

        <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 sm:block">
          {uploadedDocuments}/{totalDocuments}
        </span>
      </div>

      {loadError && (
        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {loadLoading && (
        <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Loading dokumen...
        </div>
      )}

      <div className="mb-6 rounded-2xl bg-neutral-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-800">Kelengkapan Dokumen</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              {uploadedDocuments} dari {totalDocuments} dokumen telah diupload
            </p>
          </div>
          <span className="text-sm font-semibold text-blue-600">{percentage}%</span>
        </div>

        <div className="h-2.5 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {isDocumentsComplete && (
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600">
            <CheckCircle2 size={15} />
            Semua dokumen sudah lengkap
          </div>
        )}
      </div>

      <div className="space-y-3">
        {documentList.map((doc) => {
          const fileUrl = docsMap[doc.key];
          const isUploaded = Boolean(fileUrl);
          const isUploading = loadingKey === doc.key;

          const isImage =
            typeof fileUrl === "string" &&
            /(\.png|\.jpg|\.jpeg|\.webp)(\?|$)/i.test(fileUrl);

          return (
            <div
              key={doc.key}
              className="group flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/20 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border ${
                    isUploaded ? "border-blue-100 bg-blue-50" : "border-neutral-200 bg-neutral-50"
                  }`}
                >
                  {isUploaded ? (
                    isImage ? (
                      <img src={fileUrl} alt={doc.label} className="h-full w-full object-cover" />
                    ) : (
                      <FileText size={22} className="text-blue-600" />
                    )
                  ) : (
                    <FileText size={21} className="text-neutral-300" />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-800">{doc.label}</p>
                  <p className="mt-1 hidden text-xs text-neutral-400 sm:block">{doc.description}</p>

                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${isUploaded ? "bg-emerald-500" : "bg-red-400"}`} />
                    <p className={`text-xs font-medium ${isUploaded ? "text-emerald-600" : "text-neutral-400"}`}>
                      {isUploaded ? "Sudah Upload" : "Belum Upload"}
                    </p>
                  </div>

                  {isUploaded && fileUrl ? (
                    <a className="mt-1 inline-block text-xs text-blue-600 underline" href={fileUrl} target="_blank" rel="noreferrer">
                      Lihat / Unduh
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isUploaded && (
                  <button
                    type="button"
                    onClick={() => removeLocal(doc.key)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100"
                    title="Hapus tampilan lokal (tidak menghapus di server)"
                    disabled={isUploading}
                  >
                    <X size={16} />
                  </button>
                )}

                <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition active:scale-[0.98] ${
                  isUploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}>
                  <Upload size={15} />
                  {isUploading ? "Uploading..." : isUploaded ? "Ganti" : "Upload"}

                  <input
                    type="file"
                    hidden
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      uploadToBackend(file, doc.key);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}