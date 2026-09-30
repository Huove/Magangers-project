import { NextResponse } from "next/server";
import { supabaseAdmin } from "./supabaseAdmin";

function getBearer(req: Request) {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice("Bearer ".length);
}

export async function requireUser(req: Request) {
  const token = getBearer(req);
  if (!token || token === "null" || token === "undefined") {
    return {
      ok: false as const,
      res: NextResponse.json(
        {
          message: "Unauthorized",
          detail: "Missing/invalid Authorization Bearer token",
        },
        { status: 401 }
      ),
    };
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);

  if (error || !data.user) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { message: "Unauthorized", detail: error?.message ?? "No user from token" },
        { status: 401 }
      ),
    };
  }

  return { ok: true as const, user: data.user };
}

export async function requireAdmin(req: Request) {
  const u = await requireUser(req);
  if (!u.ok) return u;

  const admin = supabaseAdmin();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", u.user.id)
    .maybeSingle();

  if (error) {
    return {
      ok: false as const,
      res: NextResponse.json(
        { message: "Profile error", detail: error.message },
        { status: 500 }
      ),
    };
  }

  if (!profile) {
    return {
      ok: false as const,
      res: NextResponse.json(
        {
          message: "Forbidden",
          detail: `Profile not found for user_id=${u.user.id}`,
        },
        { status: 403 }
      ),
    };
  }

  if (profile.role !== "admin") {
    return {
      ok: false as const,
      res: NextResponse.json(
        {
          message: "Forbidden",
          detail: `role=${profile.role}, user_id=${u.user.id}`,
        },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, user: u.user };
}