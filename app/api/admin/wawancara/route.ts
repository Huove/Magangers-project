import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const admin = supabaseAdmin();

  // ambil peserta yang sudah lolos administrasi atau sudah wawancara
  const { data, error } = await admin
    .from("peserta")
    .select(`
      id,
      status,
      nama_lengkap,
      email,
      sekolah,
      jurusan,
      pengajuan_magang (id, posisi, status, tanggal_pengajuan),
      jadwal_wawancara (id, interviewer, tanggal, jam, metode, lokasi, status, catatan)
    `)
    .in("status", ["verifikasi", "wawancara"])
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: "Query error", detail: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((row: any) => {
    const pengajuanArr = Array.isArray(row.pengajuan_magang) ? row.pengajuan_magang : [];
    const latestPengajuan = pengajuanArr
      .sort((a: any, b: any) => new Date(b.tanggal_pengajuan).getTime() - new Date(a.tanggal_pengajuan).getTime())[0];

    const jadwalArr = Array.isArray(row.jadwal_wawancara) ? row.jadwal_wawancara : [];
    const jadwal = jadwalArr
      .sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())[0] ?? null;

    return {
      // id untuk frontend (pakai peserta_id biar stabil)
      id: row.id,
      peserta_id: row.id,
      jadwal_id: jadwal?.id ?? null,

      nama: row.nama_lengkap ?? "-",
      email: row.email ?? "-",
      sekolah: row.sekolah ?? "-",
      posisi: latestPengajuan?.posisi ?? "-",

      interviewer: jadwal?.interviewer ?? "-",
      tanggal: jadwal?.tanggal ?? "",
      jam: jadwal?.jam ?? "",
      metode: jadwal?.metode ?? "Offline",
      lokasi: jadwal?.lokasi ?? "",
      status: jadwal?.status ?? "Menunggu", // ⬅️ sesuai UI dummy kamu
    };
  });

  return NextResponse.json({ data: items });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const body = await req.json().catch(() => ({}));
  const { peserta_id, interviewer, tanggal, jam, metode, lokasi } = body;

  if (!peserta_id || !interviewer || !tanggal || !jam) {
    return NextResponse.json({ message: "Data jadwal tidak lengkap" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // upsert jadwal: kalau peserta sudah punya jadwal, update; kalau belum, insert
  const { data: existing } = await admin
    .from("jadwal_wawancara")
    .select("id")
    .eq("peserta_id", peserta_id)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin
      .from("jadwal_wawancara")
      .update({
        interviewer,
        tanggal,
        jam,
        metode: metode ?? "Offline",
        lokasi: lokasi ?? null,
        status: "Dijadwalkan",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ message: "Update jadwal error", detail: error.message }, { status: 500 });
    }

    // ✅ setelah dijadwalkan, status peserta jadi wawancara
    await admin.from("peserta").update({ status: "wawancara" }).eq("id", peserta_id);

    return NextResponse.json({ message: "OK", id: existing.id });
  }

  const { data, error } = await admin
    .from("jadwal_wawancara")
    .insert({
      peserta_id,
      interviewer,
      tanggal,
      jam,
      metode: metode ?? "Offline",
      lokasi: lokasi ?? null,
      status: "Dijadwalkan",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ message: "Insert jadwal error", detail: error.message }, { status: 500 });
  }

  // ✅ setelah dijadwalkan, status peserta jadi wawancara
  await admin.from("peserta").update({ status: "wawancara" }).eq("id", peserta_id);

  return NextResponse.json({ message: "OK", id: data.id });
}