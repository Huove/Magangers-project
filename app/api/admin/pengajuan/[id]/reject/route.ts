import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function findPengajuan(admin: ReturnType<typeof supabaseAdmin>, id: string) {
  const a = await admin
    .from("pengajuan_magang")
    .select("id,peserta_id")
    .eq("id", id)
    .maybeSingle();

  if (a.data) return { pengajuan: a.data, error: a.error, used: "pengajuan_id" as const };
  if (a.error) return { pengajuan: null, error: a.error, used: "pengajuan_id" as const };

  const b = await admin
    .from("pengajuan_magang")
    .select("id,peserta_id")
    .eq("peserta_id", id)
    .order("tanggal_pengajuan", { ascending: false })
    .limit(1)
    .maybeSingle();

  return { pengajuan: b.data ?? null, error: b.error, used: "peserta_id" as const };
}

export async function POST(req: Request, { params }: { params: any }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.res;

  const { id } = await Promise.resolve(params ?? {});
  if (!id) {
    return NextResponse.json(
      { message: "Bad request", detail: "Missing params.id" },
      { status: 400 }
    );
  }

  const admin = supabaseAdmin();

  const found = await findPengajuan(admin, id);

  if (found.error) {
    return NextResponse.json(
      { message: "Query pengajuan error", detail: found.error.message },
      { status: 500 }
    );
  }

  if (!found.pengajuan) {
    return NextResponse.json(
      { message: "Pengajuan tidak ditemukan", detail: `id=${id}` },
      { status: 404 }
    );
  }

  const pengajuanId = found.pengajuan.id;

  const { error: upPengajuanErr } = await admin
    .from("pengajuan_magang")
    .update({
      status: "ditolak",
      diproses_oleh: auth.user.id,
      diproses_at: new Date().toISOString(),
    })
    .eq("id", pengajuanId);

  if (upPengajuanErr) {
    return NextResponse.json(
      { message: "Update pengajuan error", detail: upPengajuanErr.message },
      { status: 500 }
    );
  }

  const { error: upPesertaErr } = await admin
    .from("peserta")
    .update({ status: "ditolak" })
    .eq("id", found.pengajuan.peserta_id);

  if (upPesertaErr) {
    return NextResponse.json(
      { message: "Update peserta error", detail: upPesertaErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "OK",
    detail: `matched_by=${found.used}, pengajuan_id=${pengajuanId}`,
  });
}