import { NextResponse } from "next/server";
import { supabaseServer } from "./supabaseServer";
import { supabaseAdmin } from "./supabaseAdmin";

function getToken(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length);
}

export async function requireUser(req: Request) {
  const token = getToken(req);
  if (!token) {
    return { ok: false as const, res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  const sb = supabaseServer(token);
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) {
    return { ok: false as const, res: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  return { ok: true as const, user: data.user, token };
}

export async function requireAdmin(req: Request) {
  const u = await requireUser(req);
  if (!u.ok) return u;

  const admin = supabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", u.user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, user: u.user };
}