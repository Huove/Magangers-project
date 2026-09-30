import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.res;

  const admin = supabaseAdmin();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("role,nama_lengkap,email")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { message: "Profile error", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    user_id: auth.user.id,
    email: auth.user.email,
    role: profile?.role ?? null,
    nama_lengkap: profile?.nama_lengkap ?? null,
  });
}