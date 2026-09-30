import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.res;

  const admin = supabaseAdmin();

  const { data: peserta } = await admin
    .from("peserta")
    .select("id")
    .eq("user_id", auth.user.id)
    .single();

  if (!peserta) return NextResponse.json({ message: "Peserta tidak ditemukan" }, { status: 404 });

  const { data: history } = await admin
    .from("status_history")
    .select("*")
    .eq("peserta_id", peserta.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ history: history ?? [] });
}