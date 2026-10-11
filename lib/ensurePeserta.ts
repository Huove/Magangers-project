import { supabaseAdmin } from "@/lib/supabaseAdmin";

function makeNomorPeserta() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replaceAll("-", "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `P-${ymd}-${rand}`;
}

/**
 * Pastikan row peserta ada untuk user_id tertentu.
 * Kalau belum ada => dibuat.
 */
export async function ensurePesertaByUserId(userId: string) {
  const admin = supabaseAdmin();

  const { data: existing, error: qErr } = await admin
    .from("peserta")
    .select("id,user_id,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (qErr) throw new Error(qErr.message);
  if (existing) return existing;

  // buat row baru (kolom wajib: user_id, nomor_peserta, status)
  const { data: created, error: iErr } = await admin
    .from("peserta")
    .insert({
      user_id: userId,
      nomor_peserta: makeNomorPeserta(),
      status: "tidak_aktif",
    })
    .select("id,user_id,status")
    .single();

  if (iErr) throw new Error(iErr.message);
  return created;
}