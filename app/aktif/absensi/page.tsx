
"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import dynamic from "next/dynamic";

import {
  Camera,
  Check,
  Clock,
  FileText,
  MapPin,
  X,
  Navigation,
  ShieldCheck,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const BUCKET_ABSENSI = "bukti-absensi";
const MAX_FOTO_SIZE = 5 * 1024 * 1024;

const LocationMap = dynamic(
  () => import("@/components/aktif/map/locationMap"),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4 flex h-52 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
        <div className="text-center">
          <MapPin
            size={24}
            className="mx-auto mb-2 animate-pulse text-blue-500"
          />
          <p className="text-xs text-neutral-500">
            Memuat peta...
          </p>
        </div>
      </div>
    ),
  }
);

type StatusAbsensi =
  | "Hadir"
  | "Terlambat"
  | "Izin"
  | "Sakit"
  | "Tidak hadir";

type Riwayat = {
  id: string;
  tanggal: string;
  tanggalSort: string;
  masuk: string;
  pulang: string;
  durasi: string;
  status: StatusAbsensi;
  catatan: string;
};

type ModalType = "absensi" | "izin" | null;

type JadwalHariIni = {
  jam_mulai: string;
  jam_selesai: string;
} | null;

const statusStyle: Record<StatusAbsensi, string> = {
  Hadir: "bg-emerald-100 text-emerald-700",
  Terlambat: "bg-amber-100 text-amber-700",
  Izin: "bg-blue-100 text-blue-700",
  Sakit: "bg-orange-100 text-orange-700",
  "Tidak hadir": "bg-red-100 text-red-700",
};

export default function AbsensiPage() {
  const [pesertaId, setPesertaId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [absensiHariIniId, setAbsensiHariIniId] =
    useState<string | null>(null);

  const [jamMasuk, setJamMasuk] = useState<string | null>(null);
  const [jamPulang, setJamPulang] = useState<string | null>(null);

  const [jadwalHariIni, setJadwalHariIni] =
    useState<JadwalHariIni>(null);

  const [modal, setModal] = useState<ModalType>(null);

  const [jenisIzin, setJenisIzin] =
    useState<"Izin" | "Sakit">("Izin");

  const [alasan, setAlasan] = useState("");
  const [fotoIzin, setFotoIzin] = useState<File | null>(null);

  // Foto untuk absensi masuk dan pulang
  const [fotoAbsensi, setFotoAbsensi] = useState<File | null>(null);
  const [fotoAbsensiPreview, setFotoAbsensiPreview] =
    useState<string | null>(null);
  const [fotoAbsensiError, setFotoAbsensiError] = useState("");

  const [lokasi, setLokasi] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [lokasiLoading, setLokasiLoading] = useState(false);
  const [lokasiError, setLokasiError] = useState("");

  const [riwayat, setRiwayat] = useState<Riwayat[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // =========================================
  // PREVIEW FOTO ABSENSI
  // =========================================

  useEffect(() => {
    if (!fotoAbsensi) {
      setFotoAbsensiPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(fotoAbsensi);
    setFotoAbsensiPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [fotoAbsensi]);

  // =========================================
  // TANGGAL HARI INI
  // =========================================

  const tanggalHariIni = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  // =========================================
  // STATUS HARI INI
  // =========================================

  const statusHariIni = useMemo(() => {
    if (!jamMasuk) return "belum-masuk";
    if (jamMasuk && !jamPulang) return "sudah-masuk";
    return "selesai";
  }, [jamMasuk, jamPulang]);

  // =========================================
  // FETCH DATA
  // =========================================

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setError("User tidak ditemukan. Silakan login kembali.");
        return;
      }

      setUserId(user.id);

      // Ambil data peserta
      const {
        data: peserta,
        error: pesertaError,
      } = await supabase
        .from("peserta")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (pesertaError) throw pesertaError;

      if (!peserta) {
        setError("Data peserta tidak ditemukan.");
        return;
      }

      setPesertaId(peserta.id);

      const today = getLocalDate();

      // Ambil absensi hari ini
      const {
        data: absensiHariIni,
        error: absensiHariIniError,
      } = await supabase
        .from("absensi")
        .select("id, jam_masuk, jam_pulang, status")
        .eq("peserta_id", peserta.id)
        .eq("tanggal", today)
        .maybeSingle();

      if (absensiHariIniError) throw absensiHariIniError;

      if (absensiHariIni) {
        setAbsensiHariIniId(absensiHariIni.id);

        setJamMasuk(
          absensiHariIni.jam_masuk
            ? formatJam(absensiHariIni.jam_masuk)
            : null
        );

        setJamPulang(
          absensiHariIni.jam_pulang
            ? formatJam(absensiHariIni.jam_pulang)
            : null
        );
      } else {
        setAbsensiHariIniId(null);
        setJamMasuk(null);
        setJamPulang(null);
      }

      // Ambil jadwal hari ini
      const {
        data: jadwal,
        error: jadwalError,
      } = await supabase
        .from("jadwal")
        .select("jam_mulai, jam_selesai")
        .eq("tanggal", today)
        .order("jam_mulai", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (jadwalError) {
        console.error("Error jadwal:", jadwalError);
      }

      setJadwalHariIni(jadwal || null);

      // Riwayat absensi
      const {
        data: absensiData,
        error: absensiError,
      } = await supabase
        .from("absensi")
        .select(`
          id,
          tanggal,
          jam_masuk,
          jam_pulang,
          status,
          catatan
        `)
        .eq("peserta_id", peserta.id)
        .order("tanggal", { ascending: false });

      if (absensiError) throw absensiError;

      const riwayatAbsensi: Riwayat[] = (absensiData || []).map(
        (item) => ({
          id: `absensi-${item.id}`,
          tanggal: formatTanggal(item.tanggal),
          tanggalSort: item.tanggal,
          masuk: item.jam_masuk
            ? formatJam(item.jam_masuk)
            : "-",
          pulang: item.jam_pulang
            ? formatJam(item.jam_pulang)
            : "-",
          durasi: hitungDurasi(
            item.jam_masuk,
            item.jam_pulang
          ),
          status: convertStatus(item.status),
          catatan: item.catatan || "-",
        })
      );

      // Riwayat pengajuan izin
      const {
        data: izinData,
        error: izinError,
      } = await supabase
        .from("pengajuan_izin")
        .select(`
          id,
          tanggal_mulai,
          tanggal_selesai,
          jenis,
          alasan,
          file_bukti_url,
          status,
          catatan,
          created_at
        `)
        .eq("peserta_id", peserta.id)
        .order("created_at", { ascending: false });

      if (izinError) {
        console.error("Error izin:", izinError);
      }

      const riwayatIzin: Riwayat[] = (izinData || []).map(
        (item) => {
          const jenis: StatusAbsensi =
            item.jenis === "sakit" ? "Sakit" : "Izin";

          let tanggal = formatTanggal(item.tanggal_mulai);

          if (item.tanggal_mulai !== item.tanggal_selesai) {
            tanggal = `${formatTanggal(item.tanggal_mulai)} - ${formatTanggal(item.tanggal_selesai)}`;
          }

          return {
            id: `izin-${item.id}`,
            tanggal,
            tanggalSort: item.tanggal_mulai,
            masuk: "-",
            pulang: "-",
            durasi: "-",
            status: jenis,
            catatan: `${item.alasan} • ${formatStatusPengajuan(item.status)}`,
          };
        }
      );

      const semuaRiwayat = [
        ...riwayatAbsensi,
        ...riwayatIzin,
      ].sort(
        (a, b) =>
          new Date(b.tanggalSort).getTime() -
          new Date(a.tanggalSort).getTime()
      );

      setRiwayat(semuaRiwayat);
    } catch (err) {
      console.error("Gagal mengambil data absensi:", err);
      setError("Gagal mengambil data absensi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =========================================
  // AMBIL LOKASI
  // =========================================

  const handleAmbilLokasi = () => {
    if (!navigator.geolocation) {
      setLokasiError(
        "Browser kamu tidak mendukung fitur lokasi."
      );
      return;
    }

    setLokasiLoading(true);
    setLokasiError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setLokasi({ latitude, longitude });
        setLokasiLoading(false);
      },
      (err) => {
        setLokasiLoading(false);

        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLokasiError(
              "Izin lokasi ditolak. Silakan izinkan akses lokasi dari browser."
            );
            break;

          case err.POSITION_UNAVAILABLE:
            setLokasiError(
              "Lokasi tidak tersedia. Pastikan GPS atau Location Service aktif."
            );
            break;

          case err.TIMEOUT:
            setLokasiError(
              "Pengambilan lokasi terlalu lama. Silakan coba lagi."
            );
            break;

          default:
            setLokasiError("Gagal mendapatkan lokasi.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // =========================================
  // PILIH FOTO ABSENSI
  // =========================================


  const handleFotoAbsensi = (file: File) => {
    setFotoAbsensiError("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setFotoAbsensiError(
        "Format foto harus JPG, PNG, atau WEBP."
      );
      return;
    }

    if (file.size > MAX_FOTO_SIZE) {
      setFotoAbsensiError(
        "Ukuran foto maksimal 5 MB."
      );
      return;
    }

    setFotoAbsensi(file);
  };


  // =========================================
  // UPLOAD FOTO ABSENSI
  // =========================================

  const uploadBuktiAbsensi = async (
    file: File,
    jenis: "masuk" | "pulang"
  ): Promise<string> => {
    if (!userId || !pesertaId) {
      throw new Error(
        "Data user atau peserta tidak ditemukan."
      );
    }

    const extensionByType: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension = extensionByType[file.type];

    if (!extension) {
      throw new Error(
        "Format foto tidak didukung."
      );
    }

    const filePath =
      `${userId}/${pesertaId}/${getLocalDate()}/` +
      `${jenis}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_ABSENSI)
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    return filePath;
  };

  // =========================================
  // ABSEN MASUK / PULANG
  // =========================================

  const handleKonfirmasiAbsensi = async () => {
    if (!pesertaId || !userId) {
      alert("Data peserta atau user tidak ditemukan.");
      return;
    }

    if (!fotoAbsensi) {
      setFotoAbsensiError(
        "Silakan ambil foto terlebih dahulu."
      );
      return;
    }

    if (
      statusHariIni === "belum-masuk" &&
      !lokasi
    ) {
      setLokasiError(
        "Lokasi wajib diambil sebelum melakukan absen masuk."
      );
      return;
    }

    if (
      statusHariIni === "sudah-masuk" &&
      !absensiHariIniId
    ) {
      alert("Data absensi masuk tidak ditemukan.");
      return;
    }

    let uploadedFilePath: string | null = null;

    try {
      setSubmitting(true);
      setError("");

      const sekarang = new Date();

      // =====================================
      // ABSEN MASUK
      // =====================================

      if (statusHariIni === "belum-masuk") {
        const status = cekTerlambat(
          jadwalHariIni?.jam_mulai
        )
          ? "terlambat"
          : "hadir";

        uploadedFilePath = await uploadBuktiAbsensi(
          fotoAbsensi,
          "masuk"
        );

        const { error: insertError } = await supabase
          .from("absensi")
          .insert({
            peserta_id: pesertaId,
            tanggal: getLocalDate(),
            jam_masuk: sekarang.toISOString(),
            jam_pulang: null,
            status,
            latitude_masuk: lokasi!.latitude,
            longitude_masuk: lokasi!.longitude,
            latitude_pulang: null,
            longitude_pulang: null,
            catatan: null,
            foto_masuk_path: uploadedFilePath,
          });

        if (insertError) throw insertError;

        setFotoAbsensi(null);
        setFotoAbsensiError("");
        setLokasi(null);
        setModal(null);

        await fetchData();
        return;
      }

      // =====================================
      // ABSEN PULANG
      // =====================================

      if (statusHariIni === "sudah-masuk") {
        uploadedFilePath = await uploadBuktiAbsensi(
          fotoAbsensi,
          "pulang"
        );

        const { error: updateError } = await supabase
          .from("absensi")
          .update({
            jam_pulang: sekarang.toISOString(),
            foto_pulang_path: uploadedFilePath,
          })
          .eq("id", absensiHariIniId!)
          .eq("peserta_id", pesertaId);

        if (updateError) throw updateError;

        setFotoAbsensi(null);
        setFotoAbsensiError("");
        setModal(null);

        await fetchData();
      }
    } catch (err) {
      console.error("Gagal melakukan absensi:", err);

      // Hapus foto jika upload berhasil tetapi simpan DB gagal
      if (uploadedFilePath) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET_ABSENSI)
          .remove([uploadedFilePath]);

        if (removeError) {
          console.error(
            "Foto gagal dibersihkan dari Storage:",
            removeError
          );
        }
      }

      const message =
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan yang tidak diketahui.";

      alert(`Gagal menyimpan absensi. ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================
  // FOTO IZIN
  // =========================================

  const handleFotoIzin = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      alert("Lampiran harus berupa gambar.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FOTO_SIZE) {
      alert("Ukuran lampiran maksimal 5 MB.");
      event.target.value = "";
      return;
    }

    setFotoIzin(selectedFile);
  };

  // =========================================
  // UPLOAD BUKTI IZIN
  // =========================================

  const uploadBuktiIzin = async (
    file: File
  ): Promise<string> => {
    if (!userId) {
      throw new Error("User tidak ditemukan.");
    }

    const extension = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("bukti-izin")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return filePath;
  };

  // =========================================
  // AJUKAN IZIN
  // =========================================

  const handleAjukanIzin = async () => {
    if (!pesertaId) {
      alert("Data peserta tidak ditemukan.");
      return;
    }

    if (!alasan.trim()) return;

    try {
      setSubmitting(true);

      let filePath: string | null = null;

      if (fotoIzin) {
        filePath = await uploadBuktiIzin(fotoIzin);
      }

      const today = getLocalDate();

      const { error: izinError } = await supabase
        .from("pengajuan_izin")
        .insert({
          peserta_id: pesertaId,
          tanggal_mulai: today,
          tanggal_selesai: today,
          jenis: jenisIzin.toLowerCase(),
          alasan: alasan.trim(),
          file_bukti_url: filePath,
          status: "menunggu",
        });

      if (izinError) throw izinError;

      setAlasan("");
      setFotoIzin(null);
      setJenisIzin("Izin");
      setModal(null);

      await fetchData();
    } catch (err) {
      console.error("Gagal mengajukan izin:", err);

      const message =
        err instanceof Error ? err.message : "";

      alert(
        `Gagal mengirim pengajuan izin. ${message}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-neutral-500">
          Memuat data absensi...
        </p>
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
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Kehadiran Hari Ini
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {tanggalHariIni}
        </p>
      </div>

      {/* ABSENSI HARI INI */}
      <div className="mb-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-7">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-neutral-500">
              Status absensi hari ini
            </p>

            <h2 className="mt-1 text-xl font-semibold text-neutral-900">
              {statusHariIni === "belum-masuk" &&
                "Belum melakukan absensi"}
              {statusHariIni === "sudah-masuk" &&
                "Sudah melakukan absensi masuk"}
              {statusHariIni === "selesai" &&
                "Absensi hari ini selesai"}
            </h2>

            {jadwalHariIni && (
              <p className="mt-2 text-xs text-neutral-400">
                Jadwal hari ini{" "}
                {formatJamTime(jadwalHariIni.jam_mulai)} -{" "}
                {formatJamTime(jadwalHariIni.jam_selesai)}
              </p>
            )}
          </div>

          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${statusHariIni === "selesai"
              ? "bg-emerald-100 text-emerald-600"
              : "bg-blue-100 text-blue-600"
              }`}
          >
            {statusHariIni === "selesai" ? (
              <Check size={22} />
            ) : (
              <Clock size={22} />
            )}
          </div>
        </div>

        {/* JAM MASUK / PULANG */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-xs text-neutral-500">
              Jam masuk
            </p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">
              {jamMasuk || "--:--"}
            </p>
          </div>

          <div className="rounded-2xl bg-neutral-50 p-4">
            <p className="text-xs text-neutral-500">
              Jam pulang
            </p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">
              {jamPulang || "--:--"}
            </p>
          </div>
        </div>

        {/* LOCATION INFO */}
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <MapPin size={19} />
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-800">
              Verifikasi lokasi
            </p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Lokasi wajib digunakan saat absen masuk.
              Pastikan layanan lokasi kamu aktif.
            </p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex flex-wrap gap-3">
          {statusHariIni !== "selesai" && (
            <button
              onClick={() => {
                setLokasiError("");
                setFotoAbsensiError("");
                setFotoAbsensi(null);
                setModal("absensi");
              }}
              className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {statusHariIni === "belum-masuk"
                ? "Absen Masuk"
                : "Absen Pulang"}
            </button>
          )}

          <button
            onClick={() => setModal("izin")}
            className="rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
          >
            Ajukan Izin / Sakit
          </button>
        </div>
      </div>

      {/* RIWAYAT */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">
            Riwayat Absensi
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Riwayat kehadiran dan pengajuan izin kamu.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="hidden grid-cols-6 gap-4 border-b border-neutral-200 bg-neutral-50 px-5 py-3 text-xs font-semibold text-neutral-500 md:grid">
            <span>Tanggal</span>
            <span>Masuk</span>
            <span>Pulang</span>
            <span>Durasi</span>
            <span>Status</span>
            <span>Catatan</span>
          </div>

          {riwayat.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-400">
              Belum ada riwayat absensi.
            </div>
          ) : (
            riwayat.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-2 gap-3 border-b border-neutral-100 px-5 py-4 text-sm transition-colors last:border-0 hover:bg-blue-50/40 md:grid-cols-6 md:items-center md:gap-4"
              >
                <div>
                  <p className="text-xs text-neutral-400 md:hidden">
                    Tanggal
                  </p>
                  <p className="font-medium text-neutral-800">
                    {row.tanggal}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-neutral-400 md:hidden">
                    Masuk
                  </p>
                  <p
                    className={`font-medium ${row.masuk === "-"
                      ? "text-neutral-400"
                      : "text-neutral-600"
                      }`}
                  >
                    {row.masuk}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-neutral-400 md:hidden">
                    Pulang
                  </p>
                  <p
                    className={`font-medium ${row.pulang === "-"
                      ? "text-neutral-400"
                      : "text-neutral-600"
                      }`}
                  >
                    {row.pulang}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-neutral-400 md:hidden">
                    Durasi
                  </p>
                  <p
                    className={`font-medium ${row.durasi === "-"
                      ? "text-neutral-400"
                      : "text-neutral-600"
                      }`}
                  >
                    {row.durasi}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs text-neutral-400 md:hidden">
                    Status
                  </p>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusStyle[row.status]}`}
                  >
                    {row.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-neutral-400 md:hidden">
                    Catatan
                  </p>
                  <p
                    title={row.catatan}
                    className={`truncate ${row.catatan === "-"
                      ? "text-neutral-400"
                      : "text-neutral-600"
                      }`}
                  >
                    {row.catatan}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => {
                setModal(null);
                setFotoAbsensi(null);
                setFotoAbsensiError("");
              }}
              aria-label="Tutup modal"
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200"
            >
              <X size={18} />
            </button>

            {/* MODAL ABSENSI */}
            {modal === "absensi" && (
              <>
                <div className="mb-6 pr-10">
                  <p className="text-sm font-medium text-blue-600">
                    VERIFIKASI ABSENSI
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-neutral-900">
                    {statusHariIni === "belum-masuk"
                      ? "Absen Masuk"
                      : "Absen Pulang"}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                    {statusHariIni === "belum-masuk"
                      ? "Ambil lokasi dan foto sebagai bukti absensi masuk."
                      : "Ambil foto sebagai bukti absensi pulang. Lokasi tidak diwajibkan."}
                  </p>
                </div>

                {/* LOKASI ABSEN MASUK */}
                {statusHariIni === "belum-masuk" && (
                  <div className="mb-5">
                    <div
                      className={`rounded-2xl border p-5 ${lokasi
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-neutral-200 bg-neutral-50"
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${lokasi
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-blue-100 text-blue-600"
                            }`}
                        >
                          {lokasi ? (
                            <ShieldCheck size={21} />
                          ) : (
                            <MapPin size={21} />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {lokasi
                              ? "Lokasi berhasil diperoleh"
                              : "Lokasi belum diperoleh"}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                            {lokasi
                              ? "Lokasi siap digunakan untuk verifikasi absensi."
                              : "Tekan tombol untuk mengambil lokasi saat ini."}
                          </p>
                        </div>
                      </div>

                      {lokasi && (
                        <LocationMap
                          latitude={lokasi.latitude}
                          longitude={lokasi.longitude}
                        />
                      )}

                      <button
                        onClick={handleAmbilLokasi}
                        disabled={lokasiLoading}
                        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition disabled:opacity-50 ${lokasi
                          ? "border border-neutral-200 bg-white text-neutral-700"
                          : "bg-blue-600 text-white"
                          }`}
                      >
                        <Navigation size={16} />
                        {lokasiLoading
                          ? "Mengambil lokasi..."
                          : lokasi
                            ? "Ambil Ulang Lokasi"
                            : "Ambil Lokasi"}
                      </button>
                    </div>

                    {lokasiError && (
                      <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600">
                        {lokasiError}
                      </div>
                    )}
                  </div>
                )}

                {/* FOTO ABSENSI MASUK / PULANG */}
                <FotoAbsensiInput
                  preview={fotoAbsensiPreview}
                  fileName={fotoAbsensi?.name ?? null}
                  error={fotoAbsensiError}
                  disabled={submitting}
                  onChange={handleFotoAbsensi}
                  onRemove={() => {
                    setFotoAbsensi(null);
                    setFotoAbsensiError("");
                  }}
                />

                <button
                  onClick={handleKonfirmasiAbsensi}
                  disabled={
                    submitting ||
                    !fotoAbsensi ||
                    (statusHariIni === "belum-masuk" && !lokasi)
                  }
                  className="mt-5 w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting
                    ? "Mengunggah foto dan menyimpan..."
                    : statusHariIni === "belum-masuk"
                      ? "Konfirmasi Absen Masuk"
                      : "Konfirmasi Absen Pulang"}
                </button>
              </>
            )}

            {/* MODAL IZIN */}
            {modal === "izin" && (
              <>
                <div className="mb-6 pr-10">
                  <p className="text-sm font-medium text-blue-600">
                    PENGAJUAN ABSENSI
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-neutral-900">
                    Izin / Sakit
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    Sampaikan alasan ketidakhadiran kepada pembimbing.
                  </p>
                </div>

                <div className="mb-5">
                  <p className="mb-2 text-xs font-medium text-neutral-500">
                    Jenis pengajuan
                  </p>
                  <div className="flex gap-2">
                    {(["Izin", "Sakit"] as const).map((jenis) => (
                      <button
                        key={jenis}
                        onClick={() => setJenisIzin(jenis)}
                        className={`rounded-full px-5 py-2 text-sm font-medium ${jenisIzin === jenis
                          ? "bg-blue-600 text-white"
                          : "bg-neutral-100 text-neutral-600"
                          }`}
                      >
                        {jenis}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <label
                    htmlFor="alasan-izin"
                    className="mb-2 block text-sm font-medium text-neutral-800"
                  >
                    Alasan
                  </label>
                  <textarea
                    id="alasan-izin"
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    rows={5}
                    placeholder="Tuliskan alasan ketidakhadiran..."
                    className="w-full resize-none rounded-2xl border border-neutral-200 p-4 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* LAMPIRAN IZIN */}
                <div>
                  <div className="mb-2 flex justify-between">
                    <label className="text-sm font-medium text-neutral-800">
                      Lampiran foto
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      Opsional
                    </span>
                  </div>

                  {!fotoIzin ? (
                    <label
                      htmlFor="foto-izin"
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                        <Camera size={19} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-800">
                          Tambahkan foto
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          Surat atau bukti pendukung.
                        </p>
                      </div>
                      <input
                        id="foto-izin"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleFotoIzin}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText
                          size={18}
                          className="shrink-0 text-blue-600"
                        />
                        <p className="truncate text-sm">
                          {fotoIzin.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Hapus lampiran"
                        onClick={() => setFotoIzin(null)}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAjukanIzin}
                  disabled={!alasan.trim() || submitting}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  <FileText size={17} />
                  {submitting ? "Mengirim..." : "Kirim Pengajuan"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================
// INPUT FOTO ABSENSI
// =========================================


type FotoAbsensiInputProps = {
  preview: string | null;
  fileName: string | null;
  error: string;
  disabled: boolean;
  onChange: (file: File) => void;
  onRemove: () => void;
};

function FotoAbsensiInput({
  preview,
  fileName,
  error,
  disabled,
  onChange,
  onRemove,
}: FotoAbsensiInputProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let active = true;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Browser tidak mendukung akses webcam. Gunakan HTTPS atau localhost."
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          await videoRef.current.play();

          if (active) {
            setCameraReady(true);
          }
        }
      } catch (err) {
        console.error("Gagal membuka kamera:", err);

        if (active) {
          setCameraError(
            err instanceof Error
              ? err.message
              : "Kamera gagal dibuka. Periksa izin kamera browser."
          );
        }
      }
    };

    void startCamera();

    return () => {
      active = false;

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    };
  }, []);

  const handleJepret = async () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setCameraError("Kamera belum siap. Coba beberapa saat lagi.");
      return;
    }

    setCapturing(true);
    setCameraError("");

    try {
      const canvas = document.createElement("canvas");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Gagal memproses gambar kamera.");
      }

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error("Gagal mengambil foto."));
            }
          },
          "image/jpeg",
          0.9
        );
      });

      if (blob.size > MAX_FOTO_SIZE) {
        throw new Error(
          "Ukuran foto melebihi 5 MB. Coba ambil foto lagi."
        );
      }

      const file = new File(
        [blob],
        `absensi-${Date.now()}.jpg`,
        {
          type: "image/jpeg",
          lastModified: Date.now(),
        }
      );

      onChange(file);
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil foto."
      );
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-800">
          Foto bukti absensi
        </label>

        <span className="text-xs font-semibold text-red-500">
          Wajib
        </span>
      </div>

      {/* Video webcam tetap terpasang agar kamera dapat digunakan */}
      <div
        className={`overflow-hidden rounded-2xl border border-neutral-200 bg-black ${preview ? "hidden" : ""
          }`}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="aspect-video w-full object-cover"
        />
      </div>

      {!preview && (
        <div className="text-center">
          <p className="text-xs text-neutral-500">
            {cameraReady
              ? "Arahkan kamera, lalu tekan tombol jepret."
              : "Sedang membuka kamera..."}
          </p>

          <button
            type="button"
            onClick={handleJepret}
            disabled={!cameraReady || disabled || capturing}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Camera size={19} />

            {capturing
              ? "Mengambil foto..."
              : "Jepret Foto!"}
          </button>
        </div>
      )}

      {preview && (
        <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/50">
          <img
            src={preview}
            alt="Hasil foto absensi"
            className="max-h-64 w-full bg-neutral-100 object-contain"
          />

          <div className="p-3">
            <p className="truncate text-xs text-neutral-600">
              {fileName || "Foto berhasil diambil"}
            </p>

            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white py-2.5 text-sm font-semibold text-neutral-700 disabled:opacity-50"
            >
              <RefreshCw size={15} />
              Jepret Ulang
            </button>
          </div>
        </div>
      )}

      {(cameraError || error) && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-600">
          {cameraError || error}
        </div>
      )}
    </div>
  );
}


// =========================================
// LOCAL DATE YYYY-MM-DD
// =========================================

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =========================================
// FORMAT TANGGAL
// =========================================

function formatTanggal(tanggal: string) {
  return new Date(`${tanggal}T00:00:00`).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

// =========================================
// FORMAT TIMESTAMP
// =========================================

function formatJam(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// =========================================
// FORMAT TIME DATABASE
// =========================================

function formatJamTime(waktu: string) {
  return waktu.slice(0, 5);
}

// =========================================
// DURASI
// =========================================

function hitungDurasi(
  masuk: string | null,
  pulang: string | null
) {
  if (!masuk || !pulang) return "-";

  const mulai = new Date(masuk).getTime();
  const selesai = new Date(pulang).getTime();
  const selisih = selesai - mulai;

  if (selisih < 0) return "-";

  const totalMenit = Math.floor(selisih / 60000);
  const jam = Math.floor(totalMenit / 60);
  const menit = totalMenit % 60;

  return `${jam}j ${menit}m`;
}

// =========================================
// HADIR / TERLAMBAT
// =========================================

function cekTerlambat(jamJadwal: string | undefined) {
  if (!jamJadwal) return false;

  const [jam, menit] = jamJadwal.split(":").map(Number);

  const sekarang = new Date();
  const menitSekarang =
    sekarang.getHours() * 60 + sekarang.getMinutes();

  const menitJadwal = jam * 60 + menit;

  return menitSekarang > menitJadwal;
}

// =========================================
// STATUS DATABASE → UI
// =========================================

function convertStatus(status: string): StatusAbsensi {
  switch (status) {
    case "hadir":
      return "Hadir";
    case "terlambat":
      return "Terlambat";
    case "izin":
      return "Izin";
    case "sakit":
      return "Sakit";
    case "alpha":
      return "Tidak hadir";
    default:
      return "Tidak hadir";
  }
}

// =========================================
// STATUS PENGAJUAN
// =========================================

function formatStatusPengajuan(status: string) {
  switch (status) {
    case "menunggu":
      return "Menunggu persetujuan";
    case "diterima":
      return "Disetujui";
    case "ditolak":
      return "Ditolak";
    default:
      return status;
  }
}
