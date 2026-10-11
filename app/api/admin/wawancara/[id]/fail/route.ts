import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const { id } = await context.params; // ✅ params di-await

  const admin = supabaseAdmin();

  // Anggap id = jadwal_wawancara.id
  const { data: jadwal, error: jErr } = await admin
    .from("jadwal_wawancara")
    .update({
      status: "Tidak Lulus",
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

  const { error: pErr } = await admin
    .from("peserta")
    .update({ status: "ditolak" })
    .eq("id", jadwal.peserta_id);

  if (pErr) {
    return NextResponse.json(
      { message: "Update peserta error", detail: pErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "OK" });
}