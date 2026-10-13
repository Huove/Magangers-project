"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  School,
  UserCheck,
  UserRound,
  Users,
  XCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
// =====================================================
// TAB
// =====================================================
type TabType =
  | "ringkasan"
  | "absensi"
  | "tugas"
  | "jurnal"
  | "izin"
  | "laporan"
  | "nilai";
// =====================================================
// PROFILE
// =====================================================
type ParticipantDetail = {
  id: string;
  userId:
  | string
  | null;
  nama: string;
  fotoUrl:
  | string
  | null;
  email: string;
  nomorHp: string;
  nomorPeserta: string;
  status: string;
  statusKelulusan: string;
  sekolah: string;
  jurusan: string;
  kelas: string;
  divisi: string;
  posisi: string;
  tanggalMulai:
  | string
  | null;
  tanggalSelesai:
  | string
  | null;
  progress: number;
};
// =====================================================
// ABSENSI
// =====================================================
type AbsensiItem = {
  id: string;
  tanggal: string;
  jamMasuk:
  | string
  | null;
  jamPulang:
  | string
  | null;
  status: string;
  catatan:
  | string
  | null;
};
// =====================================================
// TUGAS
// =====================================================
type TugasItem = {
  assignmentId: string;
  tugasId: string;
  judul: string;
  deskripsi: string;
  deadline:
  | string
  | null;
  status: string;
  jawaban:
  | string
  | null;
  fileUrl:
  | string
  | null;
  dikumpulkanAt:
  | string
  | null;
};
// =====================================================
// JURNAL
// =====================================================
type JurnalItem = {
  id: string;
  tanggal: string;
  judul: string;
  kegiatan: string;
  hasil:
  | string
  | null;
  status: string;
  fileUrl:
  | string
  | null;
};
// =====================================================
// IZIN
// =====================================================
type IzinItem = {
  id: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  alasan: string;
  status: string;
  catatan:
  | string
  | null;
  fileBuktiUrl:
  | string
  | null;
};
// =====================================================
// LAPORAN
// =====================================================
type LaporanItem = {
  id: string;
  tipe:
  string | null;
  judul: string;
  periode:
  string | null;
  status:
  string | null;
  fileUrl:
  string | null;
  createdAt:
  string;
};
// =====================================================
// NILAI
// =====================================================
type PenilaianData = {
  kehadiran: number | null;
  kedisiplinan: number | null;
  tanggungJawab: number | null;
  sikap: number | null;
  komunikasi: number | null;
  kerjasama: number | null;
  tugas: number | null;
  laporan: number | null;
  nilaiAkhir: number | null;
  catatan: string | null;
};
// =====================================================
// PAGE
// =====================================================
export default function ParticipantDetailPage() {
  const params = useParams<{ id: string; }>();
  const pesertaId = params?.id;
  if (!pesertaId) return <p role="alert">ID peserta tidak tersedia.</p>;
  // Setiap peserta memiliki state sendiri, termasuk saat navigasi antar-ID.
  return <ParticipantDetailContent key={pesertaId} pesertaId={pesertaId} />;
}

function ParticipantDetailContent({ pesertaId }: { pesertaId: string; }) {
  const requestId = useRef(0);
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<DataSectionKey, string>>>({});
  const [updatingKelulusan, setUpdatingKelulusan] = useState(false);
  // ===================================================
  // STATE
  // ===================================================
  const [
    participant,
    setParticipant,
  ] =
    useState<
      ParticipantDetail | null
    >(null);
  const [
    absensi,
    setAbsensi,
  ] =
    useState<
      AbsensiItem[]
    >([]);
  const [
    tugas,
    setTugas,
  ] =
    useState<
      TugasItem[]
    >([]);
  const [
    jurnal,
    setJurnal,
  ] =
    useState<
      JurnalItem[]
    >([]);
  const [
    izin,
    setIzin,
  ] =
    useState<
      IzinItem[]
    >([]);
  const [
    laporan,
    setLaporan,
  ] =
    useState<
      LaporanItem[]
    >([]);
  const [
    penilaian,
    setPenilaian,
  ] =
    useState<
      PenilaianData | null
    >(null);
  const [
    activeTab,
    setActiveTab,
  ] =
    useState<TabType>(
      "ringkasan"
    );
  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );
  const [
    error,
    setError,
  ] =
    useState(
      ""
    );
  // ===================================================
  // FETCH
  // ===================================================
  const fetchParticipant = useCallback(async () => {
    const request = ++requestId.current;
    setLoading(true);
    setError("");
    setSectionErrors({});
    setParticipant(null);
    setAbsensi([]); setTugas([]); setJurnal([]); setIzin([]); setLaporan([]); setPenilaian(null);
    try {
      const rows = await readParticipantSection("peserta", pesertaId);
      if (request !== requestId.current) return;
      const row = rows[0];
      if (!row || rowText(row, "id") !== pesertaId) throw new Error("Peserta tidak ditemukan.");
      const tanggalMulai = rowText(row, "tanggal_mulai");
      const tanggalSelesai = rowText(row, "tanggal_selesai");
      const status = rowText(row, "status") ?? "tidak_aktif";

      // Status kelulusan dibaca melalui RPC agar pemeriksaan akses pembimbing
      // tetap dilakukan di sisi database.
      const {
        data: statusKelulusanData,
        error: statusKelulusanError,
      } = await supabase.rpc("pembimbing_status_kelulusan", {
        p_peserta_id: pesertaId,
      });

      if (statusKelulusanError) throw statusKelulusanError;

      const statusKelulusan =
        typeof statusKelulusanData === "string"
          ? statusKelulusanData
          : "menunggu";

      setParticipant({
        id: pesertaId, userId: rowText(row, "user_id"), nama: rowText(row, "nama_lengkap") ?? "Nama belum tersedia",
        fotoUrl: safeFileUrl(rowText(row, "foto_url")), email: rowText(row, "email") ?? "-",
        nomorHp: rowText(row, "nomor_hp") ?? "-", nomorPeserta: rowText(row, "nomor_peserta") ?? "-",
        status, statusKelulusan, sekolah: rowText(row, "sekolah") ?? "-", jurusan: rowText(row, "jurusan") ?? "-",
        kelas: rowText(row, "kelas") ?? "-", divisi: rowText(row, "divisi") ?? "-", posisi: rowText(row, "posisi") ?? "-",
        tanggalMulai, tanggalSelesai, progress: calculateProgress(status, tanggalMulai, tanggalSelesai),
      });
      const sections = ["absensi", "tugas", "jurnal", "izin", "laporan", "nilai"] as const;
      const results = await Promise.allSettled(sections.map((section) => readParticipantSection(section, pesertaId)));
      if (request !== requestId.current) return;
      const errors: Partial<Record<DataSectionKey, string>> = {};
      const data = (section: typeof sections[number]): DataRow[] => {
        const result = results[sections.indexOf(section)];
        if (result.status === "fulfilled") return result.value;
        console.error(`Gagal membaca ${section}:`, result.reason);
        errors[section] = dataError(result.reason);
        return [];
      };
      setAbsensi(data("absensi").map((r) => ({
        id: rowText(r, "id")!, tanggal: rowText(r, "tanggal") ?? "", jamMasuk: rowText(r, "jam_masuk"),
        jamPulang: rowText(r, "jam_pulang"), status: rowText(r, "status") ?? "-",
        catatan: rowText(r, "catatan") ?? rowText(r, "keterangan"),
      })));
      setTugas(data("tugas").map((r) => ({
        assignmentId: rowText(r, "id")!, tugasId: rowText(r, "tugas_id")!, judul: rowText(r, "judul") ?? "Tugas",
        deskripsi: rowText(r, "deskripsi") ?? "-", deadline: rowText(r, "deadline"),
        status: rowText(r, "status") ?? "belum_dikerjakan", jawaban: rowText(r, "jawaban"),
        fileUrl: safeFileUrl(rowText(r, "file_url")), dikumpulkanAt: rowText(r, "dikumpulkan_at"),
      })));
      setJurnal(data("jurnal").map((r) => ({
        id: rowText(r, "id")!, tanggal: rowText(r, "tanggal") ?? "", judul: rowText(r, "judul") ?? "Jurnal Kegiatan",
        kegiatan: rowText(r, "kegiatan") ?? "-", hasil: rowText(r, "hasil"), status: rowText(r, "status") ?? "menunggu",
        fileUrl: safeFileUrl(rowText(r, "file_url")),
      })));
      setIzin(data("izin").map((r) => ({
        id: rowText(r, "id")!, tanggalMulai: rowText(r, "tanggal_mulai") ?? "", tanggalSelesai: rowText(r, "tanggal_selesai") ?? "",
        alasan: rowText(r, "alasan") ?? "-", status: rowText(r, "status") ?? "menunggu", catatan: rowText(r, "catatan"),
        fileBuktiUrl: safeFileUrl(rowText(r, "file_bukti_url")),
      })));
      setLaporan(data("laporan").map((r) => ({
        id: rowText(r, "id")!, tipe: rowText(r, "tipe"), judul: rowText(r, "judul") ?? "Laporan",
        periode: rowText(r, "periode"), status: rowText(r, "status"), fileUrl: safeFileUrl(rowText(r, "file_url")),
        createdAt: rowText(r, "created_at") ?? "",
      })));

      const nilai = data("nilai")[0];

      if (nilai) {
        const aspek = [
          "kehadiran",
          "kedisiplinan",
          "tanggung_jawab",
          "sikap",
          "komunikasi",
          "kerja_sama",
          "tugas",
          "laporan",
        ];

        const values: Array<number | null> = aspek.map((key) =>
          rowNumber(nilai, key)
        );

        // Ambil hanya nilai yang tidak null.
        const nilaiTerisi = values.filter(
          (value): value is number => value !== null
        );

        // Nilai akhir hanya dihitung jika semua 8 aspek sudah terisi.
        let nilaiAkhir: number | null = null;

        if (nilaiTerisi.length === aspek.length) {
          const totalNilai = nilaiTerisi.reduce(
            (jumlah, value) => jumlah + value,
            0
          );

          nilaiAkhir = totalNilai / nilaiTerisi.length;
        }

        setPenilaian({
          kehadiran: values[0],
          kedisiplinan: values[1],
          tanggungJawab: values[2],
          sikap: values[3],
          komunikasi: values[4],
          kerjasama: values[5],
          tugas: values[6],
          laporan: values[7],
          nilaiAkhir,
          catatan: rowText(nilai, "catatan"),
        });
      }

      setSectionErrors(errors);
    } catch (err) {
      if (request !== requestId.current) return;
      console.error("Gagal memuat peserta:", err);
      setParticipant(null);
      setError(dataError(err));
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [pesertaId]);

  useEffect(() => {
    void fetchParticipant();
    return () => { requestId.current += 1; };
  }, [fetchParticipant]);

  // ===================================================
  // KONFIRMASI KELULUSAN
  // ===================================================
  const handleNyatakanLulus = useCallback(async () => {
    if (!participant) return;

    if (normalizeStatus(participant.statusKelulusan) === "lulus") {
      alert("Peserta ini sudah dinyatakan lulus.");
      return;
    }

    if (normalizeStatus(participant.status) !== "selesai") {
      alert("Kelulusan hanya dapat dikonfirmasi setelah masa magang dinyatakan selesai.");
      return;
    }

    const confirmed = window.confirm(
      `Apakah kamu yakin ingin menyatakan ${participant.nama} lulus?`
    );
    if (!confirmed) return;

    setUpdatingKelulusan(true);
    setError("");

    try {
      const { error: kelulusanError } = await supabase.rpc(
        "pembimbing_nyatakan_lulus",
        { p_peserta_id: pesertaId }
      );

      if (kelulusanError) throw kelulusanError;

      setParticipant((current) =>
        current ? { ...current, statusKelulusan: "lulus" } : current
      );

      alert(`${participant.nama} berhasil dinyatakan lulus.`);
    } catch (err) {
      console.error("Gagal mengonfirmasi kelulusan:", err);
      const detail = err as { message?: string; } | null;
      setError(detail?.message || dataError(err));
    } finally {
      setUpdatingKelulusan(false);
    }
  }, [participant, pesertaId]);

  // ===================================================
  // SUMMARY
  // ===================================================
  const summary =
    useMemo(
      () => {
        const hadir =
          absensi.filter(
            (
              item
            ) =>
              normalizeStatus(
                item.status
              ) ===
              "hadir"
          ).length;
        const terlambat =
          absensi.filter(
            (
              item
            ) =>
              normalizeStatus(
                item.status
              ) ===
              "terlambat"
          ).length;
        const izinCount =
          absensi.filter(
            (
              item
            ) => {
              const status =
                normalizeStatus(
                  item.status
                );
              return (
                status ===
                "izin" ||
                status ===
                "sakit"
              );
            }
          ).length;
        const tugasSelesai =
          tugas.filter(
            (
              item
            ) =>
              isCompletedStatus(
                item.status
              )
          ).length;
        const jurnalDisetujui =
          jurnal.filter(
            (
              item
            ) =>
              isCompletedStatus(
                item.status
              )
          ).length;
        return {
          hadir,
          terlambat,
          izin:
            izinCount,
          tugasSelesai,
          jurnalDisetujui,
        };
      },
      [
        absensi,
        tugas,
        jurnal,
      ]
    );
  // ===================================================
  // LOADING
  // ===================================================
  if (
    loading
  ) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-slate-500">
            Memuat detail peserta...
          </p>
        </div>
      </div>
    );
  }
  // ===================================================
  // ERROR
  // ===================================================
  if (
    !participant
  ) {
    return (
      <div>
        <Link
          href="/dashboard-pembina/peserta"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-red-500" />
          <h2 className="mt-3 font-bold text-red-700">
            Peserta tidak dapat ditampilkan
          </h2>
          <p className="mt-2 text-sm text-red-600">
            {error ||
              "Peserta tidak ditemukan."}
          </p>
        </div>
      </div>
    );
  }
  // ===================================================
  // RENDER
  // ===================================================
  return (
    <div className="space-y-6">
      {/* =================================================
          BACK
      ================================================= */}
      <Link
        href="/dashboard-pembina/peserta"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Peserta Bimbingan
      </Link>
      {/* =================================================
          ERROR
      ================================================= */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {/* =================================================
          PROFILE HEADER
      ================================================= */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          {/* PROFILE */}
          <div className="flex items-center gap-4">
            {participant.fotoUrl ? (
              <img
                src={
                  participant.fotoUrl
                }
                alt={
                  participant.nama
                }
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-xl font-bold text-blue-600">
                {getInisial(
                  participant.nama
                )}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {participant.nama}
                </h1>
                <ParticipantStatusBadge
                  status={
                    participant.status
                  }
                />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {participant.nomorPeserta}
              </p>
              <p className="mt-1 text-sm font-medium text-blue-600">
                {participant.posisi}
              </p>
            </div>
          </div>
          {/* PROGRESS */}
          <div className="w-full max-w-xs">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                Progress Magang
              </p>
              <p className="text-sm font-bold text-blue-600">
                {participant.progress}%
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-blue transition-all"
                style={{
                  width:
                    `${participant.progress}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {formatPeriode(
                participant.tanggalMulai,
                participant.tanggalSelesai
              )}
            </p>
          </div>
        </div>

        {/* =================================================
            KONFIRMASI KELULUSAN
        ================================================= */}
        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Status Kelulusan
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {normalizeStatus(participant.statusKelulusan) === "lulus"
                ? "Pembimbing telah mengonfirmasi bahwa peserta dinyatakan lulus."
                : normalizeStatus(participant.status) === "selesai"
                  ? "Konfirmasikan kelulusan peserta untuk menyelesaikan kategori Dinyatakan Lulus pada halaman Sertifikat."
                  : "Konfirmasi kelulusan tersedia setelah masa magang dinyatakan selesai."}
            </p>
          </div>

          {normalizeStatus(participant.statusKelulusan) === "lulus" ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Sudah Dinyatakan Lulus
            </span>
          ) : (
            <button
              type="button"
              onClick={handleNyatakanLulus}
              disabled={
                updatingKelulusan ||
                normalizeStatus(participant.status) !== "selesai"
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              title={
                normalizeStatus(participant.status) !== "selesai"
                  ? "Masa magang harus selesai sebelum konfirmasi kelulusan."
                  : "Konfirmasi kelulusan peserta"
              }
            >
              {updatingKelulusan ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GraduationCap className="h-4 w-4" />
              )}
              {updatingKelulusan ? "Memproses..." : "Nyatakan Lulus"}
            </button>
          )}
        </div>
      </section>
      {/* =================================================
          INFORMATION
      ================================================= */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={
            School
          }
          label="Sekolah / Kampus"
          value={
            participant.sekolah
          }
          secondary={
            participant.jurusan
          }
        />
        <InfoCard
          icon={
            BriefcaseBusiness
          }
          label="Penempatan"
          value={
            participant.divisi
          }
          secondary={
            participant.posisi
          }
        />
        <InfoCard
          icon={
            Mail
          }
          label="Email"
          value={
            participant.email
          }
          secondary={
            participant.nomorHp
          }
        />
        <InfoCard
          icon={
            CalendarDays
          }
          label="Periode Magang"
          value={
            formatTanggal(
              participant.tanggalMulai
            )
          }
          secondary={`s/d ${formatTanggal(
            participant.tanggalSelesai
          )}`}
        />
      </section>
      {/* =================================================
          TABS
      ================================================= */}
      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto border-b border-slate-100">
          <div className="flex min-w-max px-4">
            <TabButton
              label="Ringkasan"
              active={
                activeTab ===
                "ringkasan"
              }
              onClick={() =>
                setActiveTab(
                  "ringkasan"
                )
              }
            />
            <TabButton
              label={`Absensi (${sectionErrors.absensi ? "!" : absensi.length})`}
              active={
                activeTab ===
                "absensi"
              }
              onClick={() =>
                setActiveTab(
                  "absensi"
                )
              }
            />
            <TabButton
              label={`Tugas (${sectionErrors.tugas ? "!" : tugas.length})`}
              active={
                activeTab ===
                "tugas"
              }
              onClick={() =>
                setActiveTab(
                  "tugas"
                )
              }
            />
            <TabButton
              label={`Jurnal (${sectionErrors.jurnal ? "!" : jurnal.length})`}
              active={
                activeTab ===
                "jurnal"
              }
              onClick={() =>
                setActiveTab(
                  "jurnal"
                )
              }
            />
            <TabButton
              label={`Izin (${sectionErrors.izin ? "!" : izin.length})`}
              active={
                activeTab ===
                "izin"
              }
              onClick={() =>
                setActiveTab(
                  "izin"
                )
              }
            />
            <TabButton
              label={`Laporan (${sectionErrors.laporan ? "!" : laporan.length})`}
              active={
                activeTab ===
                "laporan"
              }
              onClick={() =>
                setActiveTab(
                  "laporan"
                )
              }
            />
            <TabButton
              label={`Nilai (${sectionErrors.nilai ? "!" : penilaian ? "1" : "0"})`}
              active={
                activeTab ===
                "nilai"
              }
              onClick={() =>
                setActiveTab(
                  "nilai"
                )
              }
            />
          </div>
        </div>
        {/* =================================================
            CONTENT
        ================================================= */}
        <div className="p-6">
          <div className="mb-5 flex justify-end">
            <button type="button" onClick={() => void fetchParticipant()} className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">Muat ulang data</button>
          </div>
          {activeTab !== "ringkasan" && sectionErrors[activeTab] && (
            <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{sectionErrors[activeTab]}</p>
          )}
          {activeTab === "ringkasan" && Object.keys(sectionErrors).length > 0 && (
            <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Sebagian data belum berhasil dimuat. Buka tab bertanda (!) atau klik Muat ulang data.</p>
          )}

          {/* ===============================================
              RINGKASAN
          =============================================== */}
          {activeTab ===
            "ringkasan" && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <SummaryCard
                    icon={
                      UserCheck
                    }
                    label="Hadir"
                    value={
                      (sectionErrors.absensi ? "—" : summary.hadir)
                    }
                    className="bg-emerald-50 text-emerald-600"
                  />
                  <SummaryCard
                    icon={
                      Clock3
                    }
                    label="Terlambat"
                    value={
                      (sectionErrors.absensi ? "—" : summary.terlambat)
                    }
                    className="bg-amber-50 text-amber-600"
                  />
                  <SummaryCard
                    icon={
                      CalendarDays
                    }
                    label="Izin / Sakit"
                    value={
                      (sectionErrors.absensi ? "—" : summary.izin)
                    }
                    className="bg-blue-50 text-blue-600"
                  />
                  <SummaryCard
                    icon={
                      ClipboardCheck
                    }
                    label="Tugas Selesai"
                    value={
                      (sectionErrors.tugas ? "—" : summary.tugasSelesai)
                    }
                    className="bg-purple-50 text-purple-600"
                  />
                  <SummaryCard
                    icon={
                      BookOpen
                    }
                    label="Jurnal Disetujui"
                    value={
                      (sectionErrors.jurnal ? "—" : summary.jurnalDisetujui)
                    }
                    className="bg-cyan-50 text-cyan-600"
                  />
                </div>
                {/* DETAIL */}
                <div className="rounded-2xl bg-slate-50 p-5">
                  <h2 className="font-bold text-slate-900">
                    Informasi Peserta
                  </h2>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <DetailRow
                      label="Nama Lengkap"
                      value={
                        participant.nama
                      }
                    />
                    <DetailRow
                      label="Nomor Peserta"
                      value={
                        participant.nomorPeserta
                      }
                    />
                    <DetailRow
                      label="Email"
                      value={
                        participant.email
                      }
                    />
                    <DetailRow
                      label="Nomor HP"
                      value={
                        participant.nomorHp
                      }
                    />
                    <DetailRow
                      label="Sekolah / Kampus"
                      value={
                        participant.sekolah
                      }
                    />
                    <DetailRow
                      label="Jurusan"
                      value={
                        participant.jurusan
                      }
                    />
                    <DetailRow
                      label="Kelas"
                      value={
                        participant.kelas
                      }
                    />
                    <DetailRow
                      label="Divisi"
                      value={
                        participant.divisi
                      }
                    />
                    <DetailRow
                      label="Posisi"
                      value={
                        participant.posisi
                      }
                    />
                    <DetailRow
                      label="Status"
                      value={
                        formatStatusPeserta(
                          participant.status
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          {/* ===============================================
              ABSENSI
          =============================================== */}
          {activeTab ===
            "absensi" && !sectionErrors.absensi && (
              <DataSection
                empty={
                  absensi.length ===
                  0
                }
                emptyText="Belum ada riwayat absensi."
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400">
                        <th className="pb-3 font-medium">
                          Tanggal
                        </th>
                        <th className="pb-3 font-medium">
                          Masuk
                        </th>
                        <th className="pb-3 font-medium">
                          Pulang
                        </th>
                        <th className="pb-3 font-medium">
                          Status
                        </th>
                        <th className="pb-3 font-medium">
                          Catatan
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {absensi.map(
                        (
                          item
                        ) => (
                          <tr
                            key={
                              item.id
                            }
                            className="border-b border-slate-50 last:border-0"
                          >
                            <td className="py-4 text-slate-600">
                              {formatTanggal(
                                item.tanggal
                              )}
                            </td>
                            <td className="py-4 text-slate-600">
                              {formatJam(
                                item.jamMasuk
                              )}
                            </td>
                            <td className="py-4 text-slate-600">
                              {formatJam(
                                item.jamPulang
                              )}
                            </td>
                            <td className="py-4">
                              <SimpleStatusBadge
                                status={
                                  item.status
                                }
                              />
                            </td>
                            <td className="py-4 text-slate-500">
                              {item.catatan ||
                                "-"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </DataSection>
            )}
          {/* ===============================================
              TUGAS
          =============================================== */}
          {activeTab ===
            "tugas" && !sectionErrors.tugas && (
              <DataSection
                empty={
                  tugas.length ===
                  0
                }
                emptyText="Belum ada tugas untuk peserta ini."
              >
                <div className="space-y-4">
                  {tugas.map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item.assignmentId
                        }
                        className="rounded-2xl border border-slate-100 p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900">
                              {item.judul}
                            </h3>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              {item.deskripsi}
                            </p>
                          </div>
                          <SimpleStatusBadge
                            status={
                              item.status
                            }
                          />
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <span>
                            Deadline:{" "}
                            {item.deadline
                              ? formatDateTime(
                                item.deadline
                              )
                              : "-"}
                          </span>
                          <span>
                            Dikumpulkan:{" "}
                            {item.dikumpulkanAt
                              ? formatDateTime(
                                item.dikumpulkanAt
                              )
                              : "Belum"}
                          </span>
                        </div>
                        {item.jawaban && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{item.jawaban}</p>}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/dashboard-pembina/tugas/${item.tugasId}`}
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                          >
                            Lihat Detail
                          </Link>
                          {item.fileUrl && (
                            <a
                              href={
                                item.fileUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                            >
                              File
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </DataSection>
            )}
          {/* ===============================================
              JURNAL
          =============================================== */}
          {activeTab ===
            "jurnal" && !sectionErrors.jurnal && (
              <DataSection
                empty={
                  jurnal.length ===
                  0
                }
                emptyText="Belum ada jurnal peserta."
              >
                <div className="space-y-4">
                  {jurnal.map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item.id
                        }
                        className="rounded-2xl border border-slate-100 p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-medium text-blue-600">
                              {formatTanggal(
                                item.tanggal
                              )}
                            </p>
                            <h3 className="mt-1 font-bold text-slate-900">
                              {item.judul}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-500">
                              {item.kegiatan}
                            </p>
                          </div>
                          <SimpleStatusBadge
                            status={
                              item.status
                            }
                          />
                        </div>
                        {item.hasil && (
                          <div className="mt-4 rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold text-slate-400">
                              HASIL
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {item.hasil}
                            </p>
                          </div>
                        )}
                        {item.fileUrl && (
                          <a
                            href={
                              item.fileUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
                          >
                            Lihat lampiran
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )
                  )}
                </div>
              </DataSection>
            )}
          {/* ===============================================
              IZIN
          =============================================== */}
          {activeTab ===
            "izin" && !sectionErrors.izin && (
              <DataSection
                empty={
                  izin.length ===
                  0
                }
                emptyText="Belum ada pengajuan izin."
              >
                <div className="space-y-4">
                  {izin.map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item.id
                        }
                        className="rounded-2xl border border-slate-100 p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                          <div>
                            <p className="text-xs text-slate-400">
                              {formatTanggal(
                                item.tanggalMulai
                              )}
                              {" - "}
                              {formatTanggal(
                                item.tanggalSelesai
                              )}
                            </p>
                            <p className="mt-2 font-semibold text-slate-900">
                              {item.alasan}
                            </p>
                          </div>
                          <SimpleStatusBadge
                            status={
                              item.status
                            }
                          />
                        </div>
                        {item.catatan && (
                          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                            Catatan:{" "}
                            {item.catatan}
                          </p>
                        )}
                        <div className="mt-3 flex gap-3">
                          <Link
                            href={`/dashboard-pembina/izin/${item.id}`}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            Detail Izin
                          </Link>
                          {item.fileBuktiUrl && (
                            <a
                              href={
                                item.fileBuktiUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"
                            >
                              Bukti
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </DataSection>
            )}
          {/* ===============================================
              LAPORAN
          =============================================== */}
          {activeTab ===
            "laporan" && !sectionErrors.laporan && (
              <DataSection
                empty={
                  laporan.length ===
                  0
                }
                emptyText="Belum ada laporan peserta."
              >
                <div className="space-y-4">
                  {laporan.map(
                    (
                      item
                    ) => (
                      <div
                        key={
                          item.id
                        }
                        className="flex flex-col gap-4 rounded-2xl border border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-xs font-medium text-blue-600">
                            {item.tipe ||
                              "Laporan"}
                          </p>
                          <h3 className="mt-1 font-bold text-slate-900">
                            {item.judul}
                          </h3>
                          <p className="mt-1 text-xs text-slate-400">
                            {item.periode ||
                              formatDateTime(
                                item.createdAt
                              )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <SimpleStatusBadge
                            status={
                              item.status ||
                              "menunggu"
                            }
                          />
                          {item.fileUrl && (
                            <a
                              href={
                                item.fileUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </DataSection>
            )}
          {/* ===============================================
              NILAI
          =============================================== */}
          {activeTab ===
            "nilai" && !sectionErrors.nilai && (
              <div>
                {!penilaian ? (
                  <EmptyState
                    text="Belum ada penilaian untuk peserta ini."
                  />
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm text-slate-500">Penilaian terbaru. Nilai akhir merupakan rata-rata delapan aspek.</p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <ScoreCard label="Kehadiran" value={penilaian.kehadiran} />
                      <ScoreCard label="Kedisiplinan" value={penilaian.kedisiplinan} />
                      <ScoreCard label="Tanggung Jawab" value={penilaian.tanggungJawab} />
                      <ScoreCard label="Sikap" value={penilaian.sikap} />
                      <ScoreCard label="Komunikasi" value={penilaian.komunikasi} />
                      <ScoreCard label="Kerja Sama" value={penilaian.kerjasama} />
                      <ScoreCard label="Tugas" value={penilaian.tugas} />
                      <ScoreCard label="Laporan" value={penilaian.laporan} />
                      <ScoreCard label="Nilai Akhir" value={penilaian.nilaiAkhir} primary />
                    </div>
                    {penilaian.nilaiAkhir === null && <p className="text-sm text-amber-700">Nilai akhir menunggu seluruh delapan aspek terisi.</p>}
                    <div className="rounded-2xl bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Catatan Penilaian
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {penilaian.catatan ||
                          "Belum ada catatan penilaian."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </section>
    </div>
  );
}
// =====================================================
// TAB BUTTON
// =====================================================
function TabButton({
  label,
  active,
  onClick,
}: {
  label:
  string;
  active:
  boolean;
  onClick:
  () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`relative px-4 py-4 text-sm font-semibold transition-colors ${active
        ? "text-blue-600"
        : "text-slate-400 hover:text-slate-600"
        }`}
    >
      {label}
      {active && (
        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-600" />
      )}
    </button>
  );
}
// =====================================================
// INFO CARD
// =====================================================
function InfoCard({
  icon: Icon,
  label,
  value,
  secondary,
}: {
  icon:
  ElementType;
  label:
  string;
  value:
  string;
  secondary?:
  string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-xs text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-slate-800">
        {value}
      </p>
      {secondary &&
        secondary !==
        "-" && (
          <p className="mt-1 text-xs text-slate-400">
            {secondary}
          </p>
        )}
    </div>
  );
}
// =====================================================
// SUMMARY CARD
// =====================================================
function SummaryCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon:
  ElementType;
  label:
  string;
  value:
  number | string;
  className:
  string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <div
        className={`grid h-9 w-9 place-items-center rounded-xl ${className}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-2xl font-extrabold text-slate-900">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">
        {label}
      </p>
    </div>
  );
}
// =====================================================
// DETAIL ROW
// =====================================================
function DetailRow({
  label,
  value,
}: {
  label:
  string;
  value:
  string;
}) {
  return (
    <div>
      <p className="text-xs text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}
// =====================================================
// DATA SECTION
// =====================================================
function DataSection({
  empty,
  emptyText,
  children,
}: {
  empty:
  boolean;
  emptyText:
  string;
  children:
  React.ReactNode;
}) {
  if (
    empty
  ) {
    return (
      <EmptyState
        text={
          emptyText
        }
      />
    );
  }
  return (
    <>
      {children}
    </>
  );
}
// =====================================================
// EMPTY
// =====================================================
function EmptyState({
  text,
}: {
  text:
  string;
}) {
  return (
    <div className="py-14 text-center">
      <FileText className="mx-auto h-8 w-8 text-slate-300" />
      <p className="mt-3 text-sm text-slate-400">
        {text}
      </p>
    </div>
  );
}
// =====================================================
// SCORE
// =====================================================
function ScoreCard({
  label,
  value,
  primary = false,
}: {
  label:
  string;
  value:
  number | null;
  primary?:
  boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 ${primary
        ? "bg-blue-600 text-white"
        : "border border-slate-100 bg-white"
        }`}
    >
      <p
        className={`text-xs ${primary
          ? "text-blue-100"
          : "text-slate-400"
          }`}
      >
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-extrabold ${primary
          ? "text-white"
          : "text-slate-900"
          }`}
      >
        {formatNilai(
          value
        )}
      </p>
    </div>
  );
}
// =====================================================
// PARTICIPANT STATUS
// =====================================================
function ParticipantStatusBadge({
  status,
}: {
  status:
  string;
}) {
  const normalized =
    normalizeStatus(
      status
    );
  if (
    normalized ===
    "aktif"
  ) {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
        Aktif
      </span>
    );
  }
  if (
    normalized ===
    "diterima"
  ) {
    return (
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
        Diterima
      </span>
    );
  }
  if (
    normalized ===
    "selesai"
  ) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
        Selesai
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
      {formatStatusPeserta(
        status
      )}
    </span>
  );
}
// =====================================================
// SIMPLE STATUS
// =====================================================
function SimpleStatusBadge({
  status,
}: {
  status:
  string;
}) {
  const normalized =
    normalizeStatus(
      status
    );
  if (
    normalized ===
    "selesai" ||
    normalized ===
    "disetujui" ||
    normalized ===
    "approved" ||
    normalized ===
    "hadir"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
        <CheckCircle2 className="h-3 w-3" />
        {formatStatus(
          status
        )}
      </span>
    );
  }
  if (
    normalized ===
    "ditolak" ||
    normalized ===
    "perlu_revisi" ||
    normalized ===
    "revisi" ||
    normalized ===
    "perlu_perbaikan"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
        <XCircle className="h-3 w-3" />
        {formatStatus(
          status
        )}
      </span>
    );
  }
  if (
    normalized ===
    "terlambat"
  ) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
        <Clock3 className="h-3 w-3" />
        Terlambat
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
      <Clock3 className="h-3 w-3" />
      {formatStatus(
        status
      )}
    </span>
  );
}
// =====================================================
// STATUS PESERTA
// =====================================================
function formatStatusPeserta(
  value:
    string
) {
  switch (
  normalizeStatus(
    value
  )
  ) {
    case "aktif":
      return "Aktif";
    case "diterima":
      return "Diterima";
    case "selesai":
      return "Selesai";
    case "mengajukan":
      return "Mengajukan";
    case "ditolak":
      return "Ditolak";
    case "tidak_aktif":
      return "Tidak Aktif";
    default:
      return value;
  }
}
// =====================================================
// FORMAT STATUS UMUM
// =====================================================
function formatStatus(
  value:
    string
) {
  const normalized =
    normalizeStatus(
      value
    );
  switch (
  normalized
  ) {
    case "belum_dikerjakan":
      return "Belum Dikerjakan";
    case "sedang_dikerjakan":
      return "Sedang Dikerjakan";
    case "sudah_dikirim":
    case "dikumpulkan":
    case "menunggu_pemeriksaan":
    case "menunggu_konfirmasi":
      return "Menunggu Pemeriksaan";
    case "menunggu":
      return "Menunggu";
    case "perlu_revisi":
    case "perlu_perbaikan":
    case "revisi":
    case "direvisi":
      return "Perlu Perbaikan";
    case "selesai":
      return "Selesai";
    case "disetujui":
      return "Disetujui";
    case "ditolak":
      return "Ditolak";
    case "hadir":
      return "Hadir";
    case "terlambat":
      return "Terlambat";
    case "izin":
      return "Izin";
    case "sakit":
      return "Sakit";
    case "alpha":
      return "Alpha";
    default:
      return value
        .replace(
          /_/g,
          " "
        )
        .replace(
          /\b\w/g,
          (
            char
          ) =>
            char.toUpperCase()
        );
  }
}
// =====================================================
// COMPLETE STATUS
// =====================================================
function isCompletedStatus(
  status:
    string
) {
  const normalized =
    normalizeStatus(
      status
    );
  return (
    normalized ===
    "selesai" ||
    normalized ===
    "disetujui" ||
    normalized ===
    "approved"
  );
}
// =====================================================
// NORMALIZE
// =====================================================
function normalizeStatus(
  value:
    string | null
) {
  return (
    value ??
    ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[\s-]+/g,
      "_"
    );
}
// =====================================================
// PROGRESS
// =====================================================
function calculateProgress(
  status:
    string,
  mulai:
    string | null,
  selesai:
    string | null
) {
  if (
    normalizeStatus(
      status
    ) ===
    "selesai"
  ) {
    return 100;
  }
  if (
    !mulai ||
    !selesai
  ) {
    return 0;
  }
  const start =
    new Date(
      `${mulai}T00:00:00+07:00`
    ).getTime();
  const end =
    new Date(
      `${selesai}T23:59:59+07:00`
    ).getTime();
  const now =
    Date.now();
  if (
    Number.isNaN(
      start
    ) ||
    Number.isNaN(
      end
    ) ||
    end <= start
  ) {
    return 0;
  }
  if (
    now <= start
  ) {
    return 0;
  }
  if (
    now >= end
  ) {
    return 100;
  }
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (
          (
            now -
            start
          ) /
          (
            end -
            start
          )
        ) *
        100
      )
    )
  );
}
// =====================================================
// INITIAL
// =====================================================
function getInisial(
  nama:
    string
) {
  const parts =
    nama
      .trim()
      .split(
        /\s+/
      )
      .filter(
        Boolean
      );
  if (
    parts.length ===
    0
  ) {
    return "-";
  }
  if (
    parts.length ===
    1
  ) {
    return parts[0]
      .slice(
        0,
        2
      )
      .toUpperCase();
  }
  return (
    parts[0][0] +
    parts[
    parts.length -
    1
    ][0]
  ).toUpperCase();
}
// =====================================================
// DATE
// =====================================================
function formatTanggal(
  value:
    string | null
) {
  if (!value) {
    return "-";
  }
  const date =
    new Date(
      `${value}T00:00:00`
    );
  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
    }
  ).format(
    date
  );
}
// =====================================================
// DATE TIME
// =====================================================
function formatDateTime(
  value:
    string
) {
  const date =
    new Date(
      value
    );
  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      timeZone:
        "Asia/Jakarta",
      day:
        "2-digit",
      month:
        "short",
      year:
        "numeric",
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  ).format(
    date
  );
}
// =====================================================
// JAM
// =====================================================
function formatJam(
  value:
    string | null
) {
  if (!value) {
    return "-";
  }
  const date =
    new Date(
      value
    );
  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      timeZone:
        "Asia/Jakarta",
      hour:
        "2-digit",
      minute:
        "2-digit",
    }
  ).format(
    date
  );
}
// =====================================================
// PERIOD
// =====================================================
function formatPeriode(
  mulai:
    string | null,
  selesai:
    string | null
) {
  if (
    !mulai &&
    !selesai
  ) {
    return "Periode belum ditentukan";
  }
  return `${formatTanggal(
    mulai
  )} - ${formatTanggal(
    selesai
  )}`;
}
// =====================================================
// NILAI
// =====================================================
function formatNilai(
  value:
    number | null
) {
  if (
    value ===
    null ||
    value ===
    undefined
  ) {
    return "-";
  }
  return Number(
    value
  ).toFixed(
    Number.isInteger(
      Number(
        value
      )
    )
      ? 0
      : 1
  );
}

// Baca data melalui RPC yang memeriksa pembimbing dan penempatan di server.
type DataRow = Record<string, unknown>;
type DataSectionKey = "peserta" | "absensi" | "tugas" | "jurnal" | "izin" | "laporan" | "nilai";
function rowText(row: DataRow, key: string): string | null {
  const value = row[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function rowNumber(row: DataRow, key: string): number | null {
  const value = row[key];
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}
function dataError(error: unknown): string {
  const detail = error as { code?: string; message?: string; } | null;
  if (detail?.code === "PGRST202" || detail?.code === "42883") {
    return "Fitur data peserta belum siap. Hubungi admin untuk mengaktifkannya.";
  }
  if (detail?.code === "42501") return "Akses peserta ditolak. Pastikan akun pembimbing dan penempatannya sesuai.";
  return "Data belum dapat dimuat. Coba muat ulang atau hubungi admin.";
}
async function readParticipantSection(section: DataSectionKey, pesertaId: string | null = null): Promise<DataRow[]> {
  const result: DataRow[] = [];
  const pageSize = 200;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.rpc("pembimbing_peserta_data", {
      p_section: section, p_peserta_id: pesertaId, p_offset: offset, p_limit: pageSize,
    });
    if (error) throw error;
    if (!Array.isArray(data) || data.some((row) => !row || typeof row !== "object" || Array.isArray(row))) {
      throw new Error("Respons data peserta tidak valid.");
    }
    result.push(...(data as DataRow[]));
    if (data.length < pageSize) break;
  }
  return result;
}
function safeFileUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}
