
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const CRITERIA = [
  "komunikasi",
  "motivasi",
  "kemampuan_dasar",
  "pemecahan_masalah",
  "kesiapan_magang",
] as const;

const FORMAT_MARKER = "__PENILAIAN_WAWANCARA_V1__";

type Criterion = (typeof CRITERIA)[number];

type InterviewScore = {
  jadwal_wawancara_id: string;
  peserta_id: string;
  komunikasi: number;
  motivasi: number;
  kemampuan_dasar: number;
  pemecahan_masalah: number;
  kesiapan_magang: number;
  catatan: string;
  penjelasan?: Record<string, string>;
};

function parseCatatan(raw: unknown): {
  catatan: string;
  penjelasan: Record<string, string>;
} {
  if (typeof raw !== "string" || !raw) {
    return { catatan: "", penjelasan: {} };
  }

  const markerIndex = raw.indexOf(FORMAT_MARKER);

  if (markerIndex === -1) {
    return { catatan: raw, penjelasan: {} };
  }

  const catatan = raw.slice(0, markerIndex).trim();
  const jsonText = raw
    .slice(markerIndex + FORMAT_MARKER.length)
    .trim();

  try {
    const parsed = JSON.parse(jsonText);

    return {
      catatan:
        typeof parsed.catatan === "string"
          ? parsed.catatan
          : catatan,
      penjelasan:
        parsed.penjelasan &&
        typeof parsed.penjelasan === "object" &&
        !Array.isArray(parsed.penjelasan)
          ? parsed.penjelasan
          : {},
    };
  } catch {
    return { catatan, penjelasan: {} };
  }
}

function encodeCatatan(
  catatan: string,
  penjelasan: Record<string, string> = {}
) {
  return `${catatan.trim()}\n${FORMAT_MARKER}${JSON.stringify({
    catatan: catatan.trim(),
    penjelasan,
  })}`;
}

function parseScoreRow<T extends { catatan: unknown }>(row: T) {
  const parsed = parseCatatan(row.catatan);

  return {
    ...row,
    catatan: parsed.catatan,
    penjelasan: parsed.penjelasan,
  };
}

function isValidScore(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 100
  );
}

// GET
// Tanpa jadwal_id: daftar semua penilaian.
// Dengan jadwal_id: detail penilaian satu jadwal.
export async function GET(req: Request) {
  const auth = await requireAdmin(req);

  if (!auth.ok) {
    return auth.res;
  }

  const admin = supabaseAdmin();
  const url = new URL(req.url);
  const jadwalId = url.searchParams.get("jadwal_id");

  const columns = `
    id,
    jadwal_wawancara_id,
    peserta_id,
    komunikasi,
    motivasi,
    kemampuan_dasar,
    pemecahan_masalah,
    kesiapan_magang,
    catatan,
    created_at,
    updated_at
  `;

  if (jadwalId) {
    const { data, error } = await admin
      .from("penilaian_wawancara")
      .select(columns)
      .eq("jadwal_wawancara_id", jadwalId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          message: "Gagal mengambil detail penilaian.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data ? parseScoreRow(data) : null,
    });
  }

  const { data, error } = await admin
    .from("penilaian_wawancara")
    .select(columns)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        message: "Gagal mengambil daftar penilaian.",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data: (data ?? []).map((row) => parseScoreRow(row)),
  });
}

// POST
// Admin menyimpan atau memperbarui nilai wawancara.
export async function POST(req: Request) {
  const auth = await requireAdmin(req);

  if (!auth.ok) {
    return auth.res;
  }

  let body: Partial<InterviewScore>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { message: "Format data yang dikirim tidak valid." },
      { status: 400 }
    );
  }

  const jadwalId = body.jadwal_wawancara_id;
  const catatan =
    typeof body.catatan === "string" ? body.catatan : "";
  const penjelasan =
    body.penjelasan &&
    typeof body.penjelasan === "object" &&
    !Array.isArray(body.penjelasan)
      ? body.penjelasan
      : {};

  if (!jadwalId) {
    return NextResponse.json(
      { message: "Jadwal wawancara wajib dipilih." },
      { status: 400 }
    );
  }

  for (const criterion of CRITERIA) {
    if (!isValidScore(body[criterion])) {
      return NextResponse.json(
        {
          message: `Nilai ${criterion.replaceAll("_", " ")} harus berupa bilangan bulat 0–100.`,
        },
        { status: 400 }
      );
    }
  }

  const admin = supabaseAdmin();

  // Pastikan jadwal benar-benar tersedia dan memiliki peserta.
  const { data: jadwal, error: jadwalError } = await admin
    .from("jadwal_wawancara")
    .select("id, peserta_id")
    .eq("id", jadwalId)
    .maybeSingle();

  if (jadwalError) {
    return NextResponse.json(
      {
        message: "Gagal memeriksa jadwal wawancara.",
        detail: jadwalError.message,
      },
      { status: 500 }
    );
  }

  if (!jadwal) {
    return NextResponse.json(
      { message: "Jadwal wawancara tidak ditemukan." },
      { status: 404 }
    );
  }

  const pesertaId = String(jadwal.peserta_id);

  const values = {
    jadwal_wawancara_id: jadwalId,
    peserta_id: pesertaId,
    pembimbing_id: null,
    komunikasi: body.komunikasi!,
    motivasi: body.motivasi!,
    kemampuan_dasar: body.kemampuan_dasar!,
    pemecahan_masalah: body.pemecahan_masalah!,
    kesiapan_magang: body.kesiapan_magang!,
    catatan: encodeCatatan(catatan, penjelasan),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("penilaian_wawancara")
    .upsert(values, {
      onConflict: "jadwal_wawancara_id",
    })
    .select(`
      id,
      jadwal_wawancara_id,
      peserta_id,
      komunikasi,
      motivasi,
      kemampuan_dasar,
      pemecahan_masalah,
      kesiapan_magang,
      catatan,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    return NextResponse.json(
      {
        message: "Gagal menyimpan penilaian wawancara.",
        detail: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Penilaian wawancara berhasil disimpan.",
    data: parseScoreRow(data),
  });
}
