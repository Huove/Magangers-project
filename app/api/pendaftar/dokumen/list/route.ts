import { NextResponse } from "next/server";
import { requireUser } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const BUCKET = "dokumen-peserta";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (!auth.ok) return auth.res;

  const admin = supabaseAdmin();

  const { data: peserta, error: pErr } = await admin
    .from("peserta")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (pErr) {
    return NextResponse.json(
      { message: "Query peserta error", detail: pErr.message },
      { status: 500 }
    );
  }
  if (!peserta) {
    return NextResponse.json(
      { message: "Peserta belum ada" },
      { status: 400 }
    );
  }

  const { data: rows, error } = await admin
    .from("dokumen_peserta")
    .select("jenis,path,mime_type,size,uploaded_at")
    .eq("peserta_id", peserta.id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  // buat signed url 1 jam
  const withUrl = await Promise.all(
    (rows ?? []).map(async (r) => {
      const { data: signed, error: sErr } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(r.path, 60 * 60);

      return {
        ...r,
        url: sErr ? null : signed?.signedUrl ?? null,
      };
    })
  );

  return NextResponse.json({ data: withUrl }, { status: 200 });
}