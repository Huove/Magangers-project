import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// =====================================================
// TYPE
// =====================================================

type ReportType =
  | "mingguan"
  | "bulanan"
  | "akhir";

type ReportPayload = {
  id?: string;
  peserta_id?: string;
  tipe?: ReportType;
  judul?: string;
  periode?: string | null;
  deskripsi?: string | null;
  file_url?: string | null;

  tampil_ke_peserta?: boolean;
  tampil_di_laporan?: boolean;
  tampil_di_dashboard?: boolean;
};

type PlacementRow = {
  id?: string;
  peserta_id: string;
  pembimbing_id: string;
  divisi: string | null;
  posisi: string | null;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  created_at: string;
};

// =====================================================
// HELPER
// =====================================================

function cleanText(
  value: unknown,
  maxLength = 20000
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, maxLength);
}

function isValidUuid(
  value: unknown
): value is string {
  if (typeof value !== "string") {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isReportType(
  value: unknown
): value is ReportType {
  return (
    value === "mingguan" ||
    value === "bulanan" ||
    value === "akhir"
  );
}

function jsonError(
  message: string,
  status = 500,
  detail?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(detail
        ? {
            detail:
              typeof detail === "string"
                ? detail
                : String(detail),
          }
        : {}),
    },
    {
      status,
    }
  );
}

// =====================================================
// PEMBIMBING LOGIN
// =====================================================

async function getPembimbingContext(
  req: NextRequest
) {
  const auth = await requireUser(req);

  if (!auth.ok) {
    return {
      ok: false as const,
      res: auth.res,
    };
  }

  const admin = supabaseAdmin();

  const {
    data: pembimbing,
    error,
  } = await admin
    .from("pembimbing")
    .select(`
      id,
      user_id
    `)
    .eq(
      "user_id",
      auth.user.id
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "PEMBIMBING QUERY ERROR:",
      error
    );

    return {
      ok: false as const,
      res: jsonError(
        "Gagal mengambil data pembimbing.",
        500,
        error.message
      ),
    };
  }

  if (!pembimbing) {
    return {
      ok: false as const,
      res: jsonError(
        "Akun ini bukan pembimbing.",
        403
      ),
    };
  }

  return {
    ok: true as const,
    auth,
    admin,
    pembimbing,
  };
}

// =====================================================
// GET
// =====================================================

export async function GET(
  req: NextRequest
) {
  try {
    const context =
      await getPembimbingContext(req);

    if (!context.ok) {
      return context.res;
    }

    const {
      admin,
      pembimbing,
    } = context;

    // =================================================
    // 1. AMBIL PENEMPATAN PESERTA DI BAWAH PEMBIMBING
    // =================================================

    const {
      data: placementRowsRaw,
      error: placementError,
    } = await admin
      .from("penempatan")
      .select(`
        id,
        peserta_id,
        pembimbing_id,
        divisi,
        posisi,
        tanggal_mulai,
        tanggal_selesai,
        created_at
      `)
      .eq(
        "pembimbing_id",
        pembimbing.id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (placementError) {
      console.error(
        "PLACEMENT ERROR:",
        placementError
      );

      return jsonError(
        "Gagal mengambil peserta bimbingan.",
        500,
        placementError.message
      );
    }

    const placements =
      (placementRowsRaw ??
        []) as PlacementRow[];

    // =================================================
    // 2. AMBIL ID PESERTA
    // =================================================

    const pesertaIds = [
      ...new Set(
        placements
          .map(
            (item) =>
              item.peserta_id
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      ),
    ];

    // Tidak ada peserta bimbingan
    if (pesertaIds.length === 0) {
      return NextResponse.json({
        success: true,
        participants: [],
        reports: [],
      });
    }

    // =================================================
    // 3. AMBIL DATA PESERTA
    // =================================================

    const {
      data: pesertaRows,
      error: pesertaError,
    } = await admin
      .from("peserta")
      .select(`
        id,
        user_id,
        nomor_peserta,
        status
      `)
      .in(
        "id",
        pesertaIds
      )
      .in(
        "status",
        [
          "aktif",
          "selesai",
        ]
      );

    if (pesertaError) {
      console.error(
        "PESERTA ERROR:",
        pesertaError
      );

      return jsonError(
        "Gagal mengambil data peserta.",
        500,
        pesertaError.message
      );
    }

    const peserta =
      pesertaRows ?? [];

    // =================================================
    // 4. AMBIL PROFILE
    // =================================================

    const userIds = [
      ...new Set(
        peserta
          .map(
            (item) =>
              item.user_id
          )
          .filter(
            (
              id
            ): id is string =>
              Boolean(id)
          )
      ),
    ];

    type ProfileRow = {
      id: string;
      nama_lengkap:
        | string
        | null;
      foto_url:
        | string
        | null;
    };

    let profiles: ProfileRow[] =
      [];

    if (userIds.length > 0) {
      const {
        data,
        error,
      } = await admin
        .from("profiles")
        .select(`
          id,
          nama_lengkap,
          foto_url
        `)
        .in(
          "id",
          userIds
        );

      if (error) {
        console.error(
          "PROFILE ERROR:",
          error
        );

        return jsonError(
          "Gagal mengambil profil peserta.",
          500,
          error.message
        );
      }

      profiles =
        (data ??
          []) as ProfileRow[];
    }

    // =================================================
    // 5. PROFILE MAP
    // =================================================

    const profileMap =
      new Map<
        string,
        ProfileRow
      >();

    for (const profile of profiles) {
      profileMap.set(
        profile.id,
        profile
      );
    }

    // =================================================
    // 6. PLACEMENT MAP
    // =================================================

    const placementMap =
      new Map<
        string,
        PlacementRow
      >();

    for (const placement of placements) {
      if (
        !placementMap.has(
          placement.peserta_id
        )
      ) {
        placementMap.set(
          placement.peserta_id,
          placement
        );
      }
    }

    // =================================================
    // 7. FORMAT PARTICIPANTS
    // =================================================

    const participants =
      peserta.map(
        (item) => {
          const profile =
            item.user_id
              ? profileMap.get(
                  item.user_id
                )
              : undefined;

          const placement =
            placementMap.get(
              item.id
            );

          return {
            id: item.id,

            user_id:
              item.user_id,

            nomor_peserta:
              item.nomor_peserta,

            nama:
              profile
                ?.nama_lengkap ??
              "Peserta",

            foto_url:
              profile
                ?.foto_url ??
              null,

            status:
              item.status,

            divisi:
              placement
                ?.divisi ??
              null,

            posisi:
              placement
                ?.posisi ??
              null,

            tanggal_mulai:
              placement
                ?.tanggal_mulai ??
              null,

            tanggal_selesai:
              placement
                ?.tanggal_selesai ??
              null,
          };
        }
      );

    // =================================================
    // 8. AMBIL LAPORAN
    // =================================================

    const {
      data: reportRows,
      error: reportError,
    } = await admin
      .from("laporan")
      .select(`
        id,
        peserta_id,
        pembimbing_id,
        tipe,
        judul,
        periode,
        deskripsi,
        file_url,
        status,
        catatan_admin,
        ditinjau_oleh,
        ditinjau_at,
        tampil_ke_peserta,
        tampil_di_laporan,
        tampil_di_dashboard,
        created_at,
        updated_at
      `)
      .eq(
        "pembimbing_id",
        pembimbing.id
      )
      .in(
        "peserta_id",
        pesertaIds
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (reportError) {
      console.error(
        "REPORT ERROR:",
        reportError
      );

      return jsonError(
        "Gagal mengambil laporan.",
        500,
        reportError.message
      );
    }

    // =================================================
    // 9. RESPONSE
    // =================================================

    return NextResponse.json({
      success: true,

      participants,

      reports:
        reportRows ?? [],
    });
  } catch (error) {
    console.error(
      "GET PEMBIMBING LAPORAN:",
      error
    );

    return jsonError(
      "Terjadi kesalahan pada server.",
      500,
      error instanceof Error
        ? error.message
        : error
    );
  }
}

// =====================================================
// POST
// =====================================================

export async function POST(
  req: NextRequest
) {
  try {
    const context =
      await getPembimbingContext(req);

    if (!context.ok) {
      return context.res;
    }

    const {
      admin,
      pembimbing,
    } = context;

    // =================================================
    // BODY
    // =================================================

    let body: ReportPayload;

    try {
      body =
        (await req.json()) as ReportPayload;
    } catch {
      return jsonError(
        "Body request tidak valid.",
        400
      );
    }

    // =================================================
    // VALIDASI PESERTA
    // =================================================

    if (
      !isValidUuid(
        body.peserta_id
      )
    ) {
      return jsonError(
        "Peserta tidak valid.",
        400
      );
    }

    // =================================================
    // VALIDASI TIPE
    // =================================================

    if (
      !isReportType(
        body.tipe
      )
    ) {
      return jsonError(
        "Jenis laporan tidak valid.",
        400
      );
    }

    // =================================================
    // VALIDASI JUDUL
    // =================================================

    const judul =
      cleanText(
        body.judul,
        200
      );

    if (!judul) {
      return jsonError(
        "Judul laporan wajib diisi.",
        400
      );
    }

    // =================================================
    // VALIDASI DESKRIPSI
    // =================================================

    const deskripsi =
      cleanText(
        body.deskripsi
      );

    if (!deskripsi) {
      return jsonError(
        "Isi laporan wajib diisi.",
        400
      );
    }

    // =================================================
    // CEK PESERTA DI BAWAH PEMBIMBING
    // =================================================

    const {
      data: placement,
      error: placementError,
    } = await admin
      .from("penempatan")
      .select(`
        id,
        peserta_id,
        pembimbing_id
      `)
      .eq(
        "peserta_id",
        body.peserta_id
      )
      .eq(
        "pembimbing_id",
        pembimbing.id
      )
      .limit(1)
      .maybeSingle();

    if (placementError) {
      console.error(
        "CHECK PLACEMENT ERROR:",
        placementError
      );

      return jsonError(
        "Gagal memeriksa penempatan peserta.",
        500,
        placementError.message
      );
    }

    if (!placement) {
      return jsonError(
        "Peserta tersebut bukan peserta bimbingan Anda.",
        403
      );
    }

    // =================================================
    // INSERT LAPORAN
    // =================================================

    const {
      data,
      error,
    } = await admin
      .from("laporan")
      .insert({
        peserta_id:
          body.peserta_id,

        pembimbing_id:
          pembimbing.id,

        tipe:
          body.tipe,

        judul,

        periode:
          cleanText(
            body.periode,
            200
          ),

        deskripsi,

        file_url:
          cleanText(
            body.file_url,
            2000
          ),

        // Masuk ke workflow pemeriksaan
        status:
          "menunggu",

        // Visibility
        tampil_ke_peserta:
          Boolean(
            body.tampil_ke_peserta
          ),

        tampil_di_laporan:
          Boolean(
            body.tampil_di_laporan
          ),

        tampil_di_dashboard:
          Boolean(
            body.tampil_di_dashboard
          ),
      })
      .select(`
        id,
        peserta_id,
        pembimbing_id,
        tipe,
        judul,
        periode,
        deskripsi,
        file_url,
        status,
        tampil_ke_peserta,
        tampil_di_laporan,
        tampil_di_dashboard,
        created_at,
        updated_at
      `)
      .single();

if (error) {
  console.error("CREATE LAPORAN DATABASE ERROR:", error);

  return NextResponse.json(
    {
      message: "Gagal menyimpan laporan.",
      detail: error.message,
      code: error.code,
      hint: error.hint,
      details: error.details,
    },
    { status: 500 }
  );
}

    return NextResponse.json(
      {
        success: true,

        message:
          "Laporan berhasil disimpan.",

        data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(  
      "POST PEMBIMBING LAPORAN:",
      error
    );

    return jsonError(
      "Terjadi kesalahan pada server.",
      500,
      error instanceof Error
        ? error.message
        : error
    );
  }
}

// =====================================================
// PATCH
// =====================================================

export async function PATCH(
  req: NextRequest
) {
  try {
    const context =
      await getPembimbingContext(req);

    if (!context.ok) {
      return context.res;
    }

    const {
      admin,
      pembimbing,
    } = context;

    // =================================================
    // BODY
    // =================================================

    let body: ReportPayload;

    try {
      body =
        (await req.json()) as ReportPayload;
    } catch {
      return jsonError(
        "Body request tidak valid.",
        400
      );
    }

    // =================================================
    // VALIDASI ID LAPORAN
    // =================================================

    if (
      !isValidUuid(
        body.id
      )
    ) {
      return jsonError(
        "ID laporan tidak valid.",
        400
      );
    }

    // =================================================
    // DATA UPDATE
    // =================================================

    const updateData:
      Record<
        string,
        unknown
      > = {};

    // =================================================
    // PESERTA
    // =================================================

    if (
      body.peserta_id !==
      undefined
    ) {
      if (
        !isValidUuid(
          body.peserta_id
        )
      ) {
        return jsonError(
          "Peserta tidak valid.",
          400
        );
      }

      const {
        data: placement,
        error:
          placementError,
      } = await admin
        .from("penempatan")
        .select(`
          id,
          peserta_id,
          pembimbing_id
        `)
        .eq(
          "peserta_id",
          body.peserta_id
        )
        .eq(
          "pembimbing_id",
          pembimbing.id
        )
        .limit(1)
        .maybeSingle();

      if (placementError) {
        console.error(
          "CHECK PARTICIPANT ERROR:",
          placementError
        );

        return jsonError(
          "Gagal memeriksa peserta.",
          500,
          placementError.message
        );
      }

      if (!placement) {
        return jsonError(
          "Peserta bukan peserta bimbingan Anda.",
          403
        );
      }

      updateData.peserta_id =
        body.peserta_id;
    }

    // =================================================
    // TIPE LAPORAN
    // =================================================

    if (
      body.tipe !==
      undefined
    ) {
      if (
        !isReportType(
          body.tipe
        )
      ) {
        return jsonError(
          "Jenis laporan tidak valid.",
          400
        );
      }

      updateData.tipe =
        body.tipe;
    }

    // =================================================
    // JUDUL
    // =================================================

    if (
      body.judul !==
      undefined
    ) {
      const judul =
        cleanText(
          body.judul,
          200
        );

      if (!judul) {
        return jsonError(
          "Judul laporan wajib diisi.",
          400
        );
      }

      updateData.judul =
        judul;
    }

    // =================================================
    // PERIODE
    // =================================================

    if (
      body.periode !==
      undefined
    ) {
      updateData.periode =
        cleanText(
          body.periode,
          200
        );
    }

    // =================================================
    // DESKRIPSI
    // =================================================

    if (
      body.deskripsi !==
      undefined
    ) {
      const deskripsi =
        cleanText(
          body.deskripsi
        );

      if (!deskripsi) {
        return jsonError(
          "Isi laporan wajib diisi.",
          400
        );
      }

      updateData.deskripsi =
        deskripsi;

      // Kalau isi laporan berubah,
      // kembali ke status menunggu.
      updateData.status =
        "menunggu";
    }

    // =================================================
    // FILE URL
    // =================================================

    if (
      body.file_url !==
      undefined
    ) {
      updateData.file_url =
        cleanText(
          body.file_url,
          2000
        );
    }

    // =================================================
    // VISIBILITY
    // =================================================

    if (
      body.tampil_ke_peserta !==
      undefined
    ) {
      updateData.tampil_ke_peserta =
        Boolean(
          body.tampil_ke_peserta
        );
    }

    if (
      body.tampil_di_laporan !==
      undefined
    ) {
      updateData.tampil_di_laporan =
        Boolean(
          body.tampil_di_laporan
        );
    }

    if (
      body.tampil_di_dashboard !==
      undefined
    ) {
      updateData.tampil_di_dashboard =
        Boolean(
          body.tampil_di_dashboard
        );
    }

    // =================================================
    // UPDATED AT
    // =================================================

    updateData.updated_at =
      new Date().toISOString();

    // =================================================
    // UPDATE
    // =================================================

    const {
      data,
      error,
    } = await admin
      .from("laporan")
      .update(
        updateData
      )
      .eq(
        "id",
        body.id
      )
      .eq(
        "pembimbing_id",
        pembimbing.id
      )
      .select(`
        id,
        peserta_id,
        pembimbing_id,
        tipe,
        judul,
        periode,
        deskripsi,
        file_url,
        status,
        tampil_ke_peserta,
        tampil_di_laporan,
        tampil_di_dashboard,
        created_at,
        updated_at
      `)
      .maybeSingle();

    if (error) {
      console.error(
        "UPDATE LAPORAN ERROR:",
        error
      );

      return jsonError(
        "Gagal memperbarui laporan.",
        500,
        error.message
      );
    }

    if (!data) {
      return jsonError(
        "Laporan tidak ditemukan.",
        404
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "Laporan berhasil diperbarui.",

      data,
    });
  } catch (error) {
    console.error(
      "PATCH PEMBIMBING LAPORAN:",
      error
    );

    return jsonError(
      "Terjadi kesalahan pada server.",
      500,
      error instanceof Error
        ? error.message
        : error
    );
  }
}

// =====================================================
// DELETE
// =====================================================

export async function DELETE(
  req: NextRequest
) {
  try {
    const context =
      await getPembimbingContext(req);

    if (!context.ok) {
      return context.res;
    }

    const {
      admin,
      pembimbing,
    } = context;

    // =================================================
    // BODY
    // =================================================

    let body: {
      id?: string;
    };

    try {
      body =
        (await req.json()) as {
          id?: string;
        };
    } catch {
      return jsonError(
        "Body request tidak valid.",
        400
      );
    }

    // =================================================
    // VALIDASI ID
    // =================================================

    if (
      !isValidUuid(
        body.id
      )
    ) {
      return jsonError(
        "ID laporan tidak valid.",
        400
      );
    }

    // =================================================
    // CEK LAPORAN
    // =================================================

    const {
      data: existing,
      error:
        existingError,
    } = await admin
      .from("laporan")
      .select(`
        id,
        status
      `)
      .eq(
        "id",
        body.id
      )
      .eq(
        "pembimbing_id",
        pembimbing.id
      )
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error(
        "EXISTING REPORT ERROR:",
        existingError
      );

      return jsonError(
        "Gagal mengambil laporan.",
        500,
        existingError.message
      );
    }

    if (!existing) {
      return jsonError(
        "Laporan tidak ditemukan.",
        404
      );
    }

    // =================================================
    // LAPORAN YANG SUDAH DISETUJUI TIDAK BOLEH DIHAPUS
    // =================================================

    if (
      existing.status ===
      "disetujui"
    ) {
      return jsonError(
        "Laporan yang sudah disetujui tidak dapat dihapus.",
        400
      );
    }

    // =================================================
    // DELETE
    // =================================================

    const {
      error,
    } = await admin
      .from("laporan")
      .delete()
      .eq(
        "id",
        body.id
      )
      .eq(
        "pembimbing_id",
        pembimbing.id
      );

    if (error) {
      console.error(
        "DELETE LAPORAN ERROR:",
        error
      );

      return jsonError(
        "Gagal menghapus laporan.",
        500,
        error.message
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "Laporan berhasil dihapus.",
    });
  } catch (error) {
    console.error(
      "DELETE PEMBIMBING LAPORAN:",
      error
    );

    return jsonError(
      "Terjadi kesalahan pada server.",
      500,
      error instanceof Error
        ? error.message
        : error
    );
  }
}