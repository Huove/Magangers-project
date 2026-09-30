import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const { id } = await context.params; // ✅

  const admin = supabaseAdmin();

  // ambil wawancara -> peserta_id
  const { data: w, error: wErr } = await admin
    .from("wawancara")
    .select("id,peserta_id")
    .eq("id", id)
    .single();

  if (wErr) {
    return NextResponse.json(
      { message: "Query wawancara error", detail: wErr.message },
      { status: 500 }
    );
  }

  if (!w) {
    return NextResponse.json(
      { message: "Wawancara tidak ditemukan", detail: `id=${id}` },
      { status: 404 }
    );
  }

  // update wawancara
  const { error: upWErr } = await admin
    .from("wawancara")
    .update({ status: "selesai", hasil: "lulus" })
    .eq("id", w.id);

  if (upWErr) {
    return NextResponse.json(
      { message: "Update wawancara error", detail: upWErr.message },
      { status: 500 }
    );
  }

  // update peserta.status -> diterima
  const { data: peserta, error: pQErr } = await admin
    .from("peserta")
    .select("user_id")
    .eq("id", w.peserta_id)
    .single();

  if (pQErr) {
    return NextResponse.json(
      { message: "Query peserta error", detail: pQErr.message },
      { status: 500 }
    );
  }

  const { error: pUErr } = await admin
    .from("peserta")
    .update({ status: "diterima" })
    .eq("id", w.peserta_id);

  if (pUErr) {
    return NextResponse.json(
      { message: "Update peserta error", detail: pUErr.message },
      { status: 500 }
    );
  }

  // update pengajuan terakhir -> diterima
  const { data: lastPengajuan, error: lastErr } = await admin
    .from("pengajuan_magang")
    .select("id")
    .eq("peserta_id", w.peserta_id)
    .order("tanggal_pengajuan", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastErr) {
    return NextResponse.json(
      { message: "Query pengajuan error", detail: lastErr.message },
      { status: 500 }
    );
  }

  if (lastPengajuan) {
    await admin
      .from("pengajuan_magang")
      .update({ status: "diterima" })
      .eq("id", lastPengajuan.id);
  }

  // role jadi peserta
  if (peserta?.user_id) {
    const { error: roleErr } = await admin
      .from("profiles")
      .update({ role: "peserta" })
      .eq("id", peserta.user_id);

    if (roleErr) {
      return NextResponse.json(
        { message: "Update role error", detail: roleErr.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ message: "Lulus -> diterima, role peserta" });
}