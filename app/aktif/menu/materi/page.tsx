"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    motion,
    AnimatePresence,
} from "motion/react";

import {
    ChevronDown,
    FileText,
    FileSpreadsheet,
    Presentation,
    Download,
    Eye,
    FolderOpen,
    Search,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type FileType =
    | "PDF"
    | "DOCX"
    | "XLSX"
    | "PPTX"
    | "FILE";

type MateriFile = {
    id: string;
    nama: string;
    tipe: FileType;
    ukuran: string;
    tanggal: string;
    deskripsi: string;
    fileUrl: string;
};

type KategoriMateri = {
    nama: string;
    deskripsi: string;
    files: MateriFile[];
};

type MateriDatabase = {
    id: string;
    judul: string;
    deskripsi: string | null;
    file_url: string | null;
    kategori: string | null;
    ukuran: string | null;
    created_at: string;
};

const kategoriMaster = [
    {
        nama: "Peraturan Perusahaan",
        deskripsi:
            "Peraturan dan ketentuan yang berlaku selama kegiatan magang.",
    },
    {
        nama: "Panduan Peserta Magang",
        deskripsi:
            "Panduan yang membantu peserta memahami kegiatan magang.",
    },
    {
        nama: "Materi Orientasi",
        deskripsi:
            "Materi pengenalan perusahaan, lingkungan kerja, dan budaya kerja.",
    },
    {
        nama: "Materi Pelatihan",
        deskripsi:
            "Materi pembelajaran dan pelatihan yang diberikan oleh pembimbing.",
    },
    {
        nama: "Prosedur Kerja",
        deskripsi:
            "Dokumen mengenai prosedur dan alur kerja selama magang.",
    },
    {
        nama: "Template Jurnal",
        deskripsi:
            "Template yang digunakan untuk mencatat kegiatan harian magang.",
    },
    {
        nama: "Template Laporan",
        deskripsi:
            "Template yang digunakan untuk menyusun laporan akhir magang.",
    },
    {
        nama: "Surat Penerimaan",
        deskripsi:
            "Dokumen resmi terkait penerimaan peserta magang.",
    },
];

export default function MateriPage() {
    const [
        openCategory,
        setOpenCategory,
    ] = useState<string | null>(null);

    const [search, setSearch] =
        useState("");

    const [materi, setMateri] =
        useState<MateriDatabase[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    // =========================================
    // AMBIL DATA MATERI
    // =========================================

    useEffect(() => {
        async function fetchMateri() {
            try {
                setLoading(true);
                setError("");

                const {
                    data,
                    error: materiError,
                } = await supabase
                    .from("materi")
                    .select(`
            id,
            judul,
            deskripsi,
            file_url,
            kategori,
            ukuran,
            created_at
          `)
                    .order("created_at", {
                        ascending: false,
                    });

                if (materiError) {
                    throw materiError;
                }

                console.log(
                    "DATA MATERI:",
                    data
                );

                setMateri(data || []);
            } catch (err) {
                console.error(
                    "Gagal mengambil materi:",
                    err
                );

                setError(
                    "Gagal mengambil data materi."
                );
            } finally {
                setLoading(false);
            }
        }

        fetchMateri();
    }, []);

    // =========================================
    // GROUP BERDASARKAN KATEGORI
    // =========================================

    const kategoriMateri = useMemo(() => {
        const hasil: KategoriMateri[] =
            kategoriMaster.map((kategori) => {
                const files = materi
                    .filter(
                        (item) =>
                            (
                                item.kategori ||
                                "Materi Umum"
                            )
                                .trim()
                                .toLowerCase() ===
                            kategori.nama
                                .trim()
                                .toLowerCase()
                    )
                    .map((item) => ({
                        id: item.id,

                        nama: item.judul,

                        tipe: getFileType(
                            item.file_url
                        ),

                        ukuran:
                            item.ukuran || "-",

                        tanggal: formatTanggal(
                            item.created_at
                        ),

                        deskripsi:
                            item.deskripsi || "",

                        fileUrl:
                            item.file_url || "",
                    }));

                return {
                    nama: kategori.nama,
                    deskripsi:
                        kategori.deskripsi,
                    files,
                };
            });

        return hasil;
    }, [materi]);

    // =========================================
    // SEARCH
    // =========================================

    const filteredData =
        useMemo(() => {
            const keyword =
                search
                    .toLowerCase()
                    .trim();

            if (!keyword) {
                return kategoriMateri;
            }

            return kategoriMateri
                .map((category) => ({
                    ...category,

                    files:
                        category.files.filter(
                            (file) =>
                                file.nama
                                    .toLowerCase()
                                    .includes(
                                        keyword
                                    ) ||
                                file.deskripsi
                                    .toLowerCase()
                                    .includes(
                                        keyword
                                    )
                        ),
                }))
                .filter(
                    (category) =>
                        category.nama
                            .toLowerCase()
                            .includes(
                                keyword
                            ) ||
                        category.files
                            .length > 0
                );
        }, [
            kategoriMateri,
            search,
        ]);

    // =========================================
    // TOGGLE CATEGORY
    // =========================================

    const toggleCategory = (
        nama: string
    ) => {
        setOpenCategory(
            (current) =>
                current === nama
                    ? null
                    : nama
        );
    };

    // =========================================
    // LIHAT FILE
    // =========================================

    const handleLihat = (
        file: MateriFile
    ) => {
        if (!file.fileUrl) {
            alert(
                "File belum tersedia."
            );

            return;
        }

        window.open(
            file.fileUrl,
            "_blank",
            "noopener,noreferrer"
        );
    };

    // =========================================
    // DOWNLOAD FILE
    // =========================================

    const handleDownload = (
        file: MateriFile
    ) => {
        if (!file.fileUrl) {
            alert(
                "File belum tersedia."
            );

            return;
        }

        const link =
            document.createElement(
                "a"
            );

        link.href = file.fileUrl;

        link.download =
            file.nama;

        link.target = "_blank";

        document.body.appendChild(
            link
        );

        link.click();

        document.body.removeChild(
            link
        );
    };

    // =========================================
    // LOADING
    // =========================================

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">

                <div className="text-center">

                    <FolderOpen
                        size={30}
                        className="mx-auto mb-3 animate-pulse text-blue-500"
                    />

                    <p className="text-sm text-neutral-500">
                        Memuat materi...
                    </p>

                </div>

            </div>
        );
    }

    // =========================================
    // ERROR
    // =========================================

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white p-6">

                <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
                    {error}
                </div>

            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-6 md:p-8">

            {/* =====================================
          HEADER
      ===================================== */}

            <div className="mb-8">

                <div className="mb-1 flex items-center gap-2">

                    <FolderOpen
                        size={18}
                        className="text-neutral-900"
                    />

                    <p className="text-2xl font-semibold text-neutral-900">
                        Materi & Dokumen
                    </p>

                </div>

                <p className="mt-1 max-w-2xl text-sm text-neutral-500">
                    Akses berbagai materi, panduan,
                    dan dokumen yang diberikan oleh
                    pembimbing selama kegiatan magang.
                </p>

            </div>

            {/* =====================================
          SEARCH
      ===================================== */}

            <div className="mb-6">

                <div className="relative max-w-xl">

                    <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                    />

                    <input
                        type="text"
                        placeholder="Cari materi atau dokumen..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm text-neutral-700 outline-none transition placeholder:text-neutral-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />

                </div>

            </div>

            {/* =====================================
          INFO
      ===================================== */}

            <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">

                <div className="flex items-start gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">

                        <FileText
                            size={18}
                        />

                    </div>

                    <div>

                        <p className="text-sm font-semibold text-neutral-900">
                            Materi dari pembimbing
                        </p>

                        <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                            Dokumen dan materi di halaman
                            ini dapat diperbarui oleh
                            pembimbing sesuai kebutuhan
                            kegiatan magang.
                        </p>

                    </div>

                </div>

            </div>

            {/* =====================================
          CATEGORY
      ===================================== */}

            <div className="space-y-3">

                {filteredData.map(
                    (category) => {
                        const isOpen =
                            openCategory ===
                            category.nama;

                        return (
                            <div
                                key={
                                    category.nama
                                }
                                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition"
                            >

                                {/* CATEGORY HEADER */}

                                <button
                                    onClick={() =>
                                        toggleCategory(
                                            category.nama
                                        )
                                    }
                                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-neutral-50"
                                >

                                    <div className="flex min-w-0 items-center gap-4">

                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                                            <FolderOpen
                                                size={20}
                                            />

                                        </div>

                                        <div className="min-w-0">

                                            <div className="flex flex-wrap items-center gap-2">

                                                <h2 className="text-sm font-semibold text-neutral-900">
                                                    {
                                                        category.nama
                                                    }
                                                </h2>

                                                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
                                                    {
                                                        category
                                                            .files
                                                            .length
                                                    }{" "}
                                                    file
                                                </span>

                                            </div>

                                            <p className="mt-1 text-xs text-neutral-500">
                                                {category.deskripsi}
                                            </p>

                                        </div>

                                    </div>

                                    <ChevronDown
                                        size={19}
                                        className={`shrink-0 text-neutral-400 transition-transform duration-200 ${isOpen
                                            ? "rotate-180"
                                            : ""
                                            }`}
                                    />

                                </button>

                                <AnimatePresence
                                    initial={false}
                                >

                                    {isOpen && (

                                        <motion.div
                                            initial={{
                                                height: 0,
                                                opacity: 0,
                                            }}
                                            animate={{
                                                height: "auto",
                                                opacity: 1,
                                            }}
                                            exit={{
                                                height: 0,
                                                opacity: 0,
                                            }}
                                            transition={{
                                                height: {
                                                    duration: 0.3,
                                                    ease: [
                                                        0.4,
                                                        0,
                                                        0.2,
                                                        1,
                                                    ],
                                                },

                                                opacity: {
                                                    duration:
                                                        0.2,
                                                },
                                            }}
                                            className="overflow-hidden border-t border-neutral-100 bg-neutral-50/40"
                                        >

                                            <div className="px-4 py-4 md:px-5">

                                                <div className="space-y-2">

                                                    {category.files.length === 0 ? (

                                                        <div className="flex min-h-[120px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-6 text-center">

                                                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
                                                                <FileText size={18} />
                                                            </div>

                                                            <p className="text-sm font-medium text-neutral-600">
                                                                Belum ada materi
                                                            </p>

                                                            <p className="mt-1 text-xs text-neutral-400">
                                                                Belum ada file atau dokumen pada kategori ini.
                                                            </p>

                                                        </div>

                                                    ) : (

                                                        category.files.map((file) => (
                                                            <motion.div
                                                                key={file.id}
                                                                initial={{
                                                                    opacity: 0,
                                                                    y: -8,
                                                                }}
                                                                animate={{
                                                                    opacity: 1,
                                                                    y: 0,
                                                                }}
                                                                transition={{
                                                                    duration: 0.2,
                                                                }}
                                                                className="group flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-blue-100 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                                                            >

                                                                {/* FILE INFO */}

                                                                <div className="flex min-w-0 items-center gap-3">

                                                                    <div
                                                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getFileStyle(
                                                                            file.tipe
                                                                        )}`}
                                                                    >
                                                                        {getFileIcon(
                                                                            file.tipe
                                                                        )}
                                                                    </div>

                                                                    <div className="min-w-0">

                                                                        <h3 className="truncate text-sm font-medium text-neutral-800">
                                                                            {file.nama}
                                                                        </h3>

                                                                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-400">

                                                                            <span>
                                                                                {file.tipe}
                                                                            </span>

                                                                            <span>•</span>

                                                                            <span>
                                                                                {file.ukuran}
                                                                            </span>

                                                                            <span>•</span>

                                                                            <span>
                                                                                Upload{" "}
                                                                                {file.tanggal}
                                                                            </span>

                                                                        </div>

                                                                        {file.deskripsi && (
                                                                            <p className="mt-1 hidden text-xs text-neutral-500 md:block">
                                                                                {file.deskripsi}
                                                                            </p>
                                                                        )}

                                                                    </div>

                                                                </div>

                                                                {/* ACTION */}

                                                                <div className="flex shrink-0 gap-2">

                                                                    <button
                                                                        onClick={() =>
                                                                            handleLihat(file)
                                                                        }
                                                                        disabled={
                                                                            !file.fileUrl
                                                                        }
                                                                        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-medium text-neutral-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    >
                                                                        <Eye size={15} />
                                                                        Lihat
                                                                    </button>

                                                                    <button
                                                                        onClick={() =>
                                                                            handleDownload(file)
                                                                        }
                                                                        disabled={
                                                                            !file.fileUrl
                                                                        }
                                                                        className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                                                                    >
                                                                        <Download size={15} />
                                                                        Download
                                                                    </button>

                                                                </div>

                                                            </motion.div>
                                                        ))

                                                    )}

                                                </div>

                                            </div>

                                        </motion.div>

                                    )}

                                </AnimatePresence>

                            </div>
                        );
                    }
                )}

            </div>

            {/* =====================================
          EMPTY
      ===================================== */}

            {filteredData.length ===
                0 && (

                    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-50 px-6 text-center">

                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">

                            <Search
                                size={24}
                                className="text-neutral-400"
                            />

                        </div>

                        <h3 className="text-sm font-semibold text-neutral-800">

                            {materi.length === 0
                                ? "Belum ada materi"
                                : "Materi tidak ditemukan"}

                        </h3>

                        <p className="mt-1 max-w-sm text-xs text-neutral-500">

                            {materi.length === 0
                                ? "Belum ada materi atau dokumen yang diberikan."
                                : "Coba gunakan kata kunci lain untuk mencari materi atau dokumen."}

                        </p>

                    </div>

                )}

        </div>
    );
}

// =========================================
// GET FILE TYPE
// =========================================

function getFileType(
    url: string | null
): FileType {
    if (!url) {
        return "FILE";
    }

    const cleanUrl =
        url
            .split("?")[0]
            .toLowerCase();

    if (
        cleanUrl.endsWith(
            ".pdf"
        )
    ) {
        return "PDF";
    }

    if (
        cleanUrl.endsWith(
            ".docx"
        ) ||
        cleanUrl.endsWith(
            ".doc"
        )
    ) {
        return "DOCX";
    }

    if (
        cleanUrl.endsWith(
            ".xlsx"
        ) ||
        cleanUrl.endsWith(
            ".xls"
        )
    ) {
        return "XLSX";
    }

    if (
        cleanUrl.endsWith(
            ".pptx"
        ) ||
        cleanUrl.endsWith(
            ".ppt"
        )
    ) {
        return "PPTX";
    }

    return "FILE";
}

// =========================================
// ICON
// =========================================

function getFileIcon(
    type: FileType
) {
    if (type === "XLSX") {
        return (
            <FileSpreadsheet
                size={20}
            />
        );
    }

    if (type === "PPTX") {
        return (
            <Presentation
                size={20}
            />
        );
    }

    return (
        <FileText
            size={20}
        />
    );
}

// =========================================
// STYLE
// =========================================

function getFileStyle(
    type: FileType
) {
    switch (type) {
        case "PDF":
            return "bg-red-50 text-red-500";

        case "DOCX":
            return "bg-blue-50 text-blue-600";

        case "XLSX":
            return "bg-emerald-50 text-emerald-600";

        case "PPTX":
            return "bg-orange-50 text-orange-600";

        default:
            return "bg-neutral-50 text-neutral-600";
    }
}

// =========================================
// FORMAT TANGGAL
// =========================================

function formatTanggal(
    tanggal: string
) {
    return new Date(
        tanggal
    ).toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
        }
    );
}