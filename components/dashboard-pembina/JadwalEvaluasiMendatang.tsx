"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import JadwalEvaluasiKalender, {
  type JadwalEvaluasi,
} from "./JadwalEvaluasiKalender";

type ScheduleRow = {
  id: string;
  peserta_id: string;
  judul: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string | null;
  lokasi: string | null;
};

type Props = {
  /** Gunakan href dari tombol "Lihat semua" dashboard yang sudah ada. */
  lihatSemuaHref?: string;
  /** Naikkan nilainya setelah menyimpan jadwal jika kalender tetap terpasang. */
  refreshKey?: number;
};

function tanggalHariIni() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function pesanError(error: unknown) {
  // Error Supabase dapat berupa object biasa, bukan instance Error.
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Gagal mengambil jadwal evaluasi.";
}

/** Pasang komponen ini pada dashboard pembimbing.
 * Jadwal hari ini tetap tampil selama statusnya terjadwal.
 * Tidak menulis/mengubah data; menggunakan Supabase client proyek yang sudah ada.
 */
export default function JadwalEvaluasiMendatang({ lihatSemuaHref, refreshKey = 0 }: Props) {
  const [jadwal, setJadwal] = useState<JadwalEvaluasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Reload saat login/logout/pergantian akun; jangan await query dalam callback auth.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setJadwal([]);
        setLoading(true);
        setReloadKey((value) => value + 1);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!userData.user) throw new Error("User belum login.");
        if (!active) return;

        const { data: mentor, error: mentorError } = await supabase
          .from("pembimbing")
          .select("id")
          .eq("user_id", userData.user.id)
          .maybeSingle();
        if (mentorError) throw mentorError;
        if (!mentor) throw new Error("Data pembimbing tidak ditemukan.");
        if (!active) return;

        const schedules: ScheduleRow[] = [];
        const today = tanggalHariIni();
        const pageSize = 200;
        // Ambil semua halaman agar garis penanda tidak kehilangan jadwal akibat limit.
        for (let offset = 0; ; ) {
          const { data, error: scheduleError } = await supabase
            .from("jadwal_evaluasi")
            .select("id, peserta_id, judul, tanggal, jam_mulai, jam_selesai, lokasi")
            .eq("pembimbing_id", mentor.id)
            .eq("status", "terjadwal")
            .gte("tanggal", today)
            .order("tanggal", { ascending: true })
            .order("jam_mulai", { ascending: true })
            .order("id", { ascending: true })
            .range(offset, offset + pageSize - 1);
          if (scheduleError) throw scheduleError;
          if (!active) return;
          const rows = data ?? [];
          if (rows.length === 0) break;
          schedules.push(...rows);
          offset += rows.length;
        }

        const participantIds = [...new Set(schedules.map((row) => row.peserta_id).filter(Boolean))];
        const participants: Array<{ id: string; user_id: string | null; nomor_peserta: string | null }> = [];
        for (let offset = 0; offset < participantIds.length; offset += pageSize) {
          const { data, error: participantError } = await supabase
            .from("peserta")
            .select("id, user_id, nomor_peserta")
            .in("id", participantIds.slice(offset, offset + pageSize));
          if (participantError) throw participantError;
          if (!active) return;
          participants.push(...(data ?? []));
        }

        const userIds = [...new Set(participants.map((row) => row.user_id).filter((id): id is string => Boolean(id)))];
        const profiles: Array<{ id: string; nama_lengkap: string | null }> = [];
        for (let offset = 0; offset < userIds.length; offset += pageSize) {
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select("id, nama_lengkap")
            .in("id", userIds.slice(offset, offset + pageSize));
          if (profileError) throw profileError;
          if (!active) return;
          profiles.push(...(data ?? []));
        }

        const participantMap = new Map(participants.map((row) => [row.id, row]));
        const profileMap = new Map(profiles.map((row) => [row.id, row.nama_lengkap]));
        const formatted: JadwalEvaluasi[] = schedules.map((row) => {
          const participant = participantMap.get(row.peserta_id);
          const name = participant?.user_id ? profileMap.get(participant.user_id) : null;
          return {
            id: row.id,
            tanggal: row.tanggal,
            jamMulai: row.jam_mulai,
            jamSelesai: row.jam_selesai,
            namaPeserta: name?.trim() || (participant?.nomor_peserta ? `Peserta ${participant.nomor_peserta}` : "Peserta (nama tidak tersedia)"),
            judul: row.judul,
            lokasi: row.lokasi,
          };
        });
        if (active) setJadwal(formatted);
      } catch (err) {
        if (active) {
          setJadwal([]);
          setError(pesanError(err));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();
    return () => { active = false; };
  }, [refreshKey, reloadKey]);

  return (
    <div>
      <JadwalEvaluasiKalender
        jadwal={jadwal}
        loading={loading}
        error={error}
        lihatSemuaHref={lihatSemuaHref}
        timeZone="Asia/Jakarta"
      />
      {error && (
        <button type="button" onClick={() => setReloadKey((value) => value + 1)}
          className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          Coba lagi
        </button>
      )}
    </div>
  );
}
