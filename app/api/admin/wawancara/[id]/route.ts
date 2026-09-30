import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const { id } = await context.params; // ✅
  if (!id) {
    return NextResponse.json({ message: "Missing params.id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const { action, tanggal, jam, interviewer, metode, lokasi, catatan } = body;

  const admin = supabaseAdmin();

  if (action === "reschedule") {
    if (!tanggal || !jam) {
      return NextResponse.json({ message: "tanggal & jam wajib" }, { status: 400 });
    }

    const { error } = await admin
      .from("jadwal_wawancara")
      .update({
        interviewer: interviewer ?? undefined,
        tanggal,
        jam,
        metode: metode ?? undefined,
        lokasi: lokasi ?? undefined,
        status: "Dijadwalkan",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { message: "Reschedule error", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "OK" });
  }

  if (action === "lulus" || action === "tidak_lulus") {
    const newStatus = "Selesai";

    const { data: jadwal, error: jErr } = await admin
      .from("jadwal_wawancara")
      .update({
        status: newStatus,
        catatan: catatan ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("peserta_id")
      .single();

    if (jErr) {
      return NextResponse.json(
        { message: "Update jadwal error", detail: jErr.message },
        { status: 500 }
      );
    }

    const pesertaStatus = action === "lulus" ? "diterima" : "ditolak";
    const { error: pErr } = await admin
      .from("peserta")
      .update({ status: pesertaStatus })
      .eq("id", jadwal.peserta_id);

    if (pErr) {
      return NextResponse.json(
        { message: "Update peserta error", detail: pErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "OK" });
  }

  return NextResponse.json({ message: "Action tidak valid" }, { status: 400 });
}