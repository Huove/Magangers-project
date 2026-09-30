import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * URL: /api/admin/wawancara/peserta/[id]/decision
 * Di sini [id] = peserta_id
 *
 * Body contoh:
 * { "decision": "lulus" }  atau { "decision": "tidak_lulus" }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const { id } = await context.params; // ✅ id dari folder [id]
  if (!id) {
    return NextResponse.json(
      { message: "Bad request", detail: "Missing params.id" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const decision = body?.decision as "lulus" | "tidak_lulus" | undefined;

  if (!decision) {
    return NextResponse.json(
      { message: "Bad request", detail: "decision wajib: lulus | tidak_lulus" },
      { status: 400 }
    );
  }

  const admin = supabaseAdmin();

  // update status peserta
  const pesertaStatus = decision === "lulus" ? "diterima" : "ditolak";

  const { data: peserta, error: pErr } = await admin
    .from("peserta")
    .update({ status: pesertaStatus })
    .eq("id", id)
    .select("id,user_id")
    .single();

  if (pErr) {
    return NextResponse.json(
      { message: "Update peserta error", detail: pErr.message },
      { status: 500 }
    );
  }

  // OPTIONAL: kalau lulus -> role jadi "peserta" (hapus kalau tidak dipakai di sistem temanmu)
  if (decision === "lulus" && peserta?.user_id) {
    await admin.from("profiles").update({ role: "peserta" }).eq("id", peserta.user_id);
  }

  return NextResponse.json({ message: "OK" });
}