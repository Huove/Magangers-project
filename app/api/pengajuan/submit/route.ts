import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ensurePesertaByUserId } from "@/lib/ensurePeserta";

export async function POST(req: Request) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.res;

    const body = await req.json().catch(() => ({}));
    const admin = supabaseAdmin();

    // ✅ auto-create peserta kalau belum ada
    const peserta = await ensurePesertaByUserId(auth.user.id);

    const { data: pengajuan, error: insErr } = await admin
      .from("pengajuan_magang")
      .insert({
        peserta_id: peserta.id,
        tanggal_pengajuan: new Date().toISOString(),
        status: "diajukan",
        posisi: body?.posisi ?? null,
        catatan: body?.catatan ?? null,
      })
      .select("id,peserta_id,status,tanggal_pengajuan,posisi,catatan")
      .single();

    if (insErr) {
      return NextResponse.json(
        { message: "Insert pengajuan error", detail: insErr.message },
        { status: 500 }
      );
    }

    // update status peserta (mengajukan)
    const { error: upErr } = await admin
      .from("peserta")
      .update({ status: "mengajukan" })
      .eq("id", peserta.id);

    if (upErr) {
      return NextResponse.json(
        { message: "Update peserta error", detail: upErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "OK", pengajuan });
  } catch (err: any) {
    return NextResponse.json(
      { message: "Route crash", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}