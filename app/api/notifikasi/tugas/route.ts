
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY!;
const emailFrom = process.env.EMAIL_FROM!;

const adminSupabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const resend = new Resend(resendApiKey);

export async function POST(request: Request) {
  try {
    // 1. Pastikan pengguna sudah login.
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.match(/^Bearer (.+)$/i)?.[1];

    if (!accessToken) {
      return NextResponse.json(
        { error: "Sesi login tidak ditemukan." },
        { status: 401 }
      );
    }

    const authClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sesi login tidak valid." },
        { status: 401 }
      );
    }

    // 2. Validasi input.
    const body = await request.json();
    const tugasId = body?.tugasId;

    if (
      typeof tugasId !== "string" ||
      !tugasId.trim()
    ) {
      return NextResponse.json(
        { error: "ID tugas tidak valid." },
        { status: 400 }
      );
    }

    // 3. Pastikan pengguna adalah pembimbing pemilik tugas.
    const { data: pembimbing, error: pembimbingError } =
      await adminSupabase
        .from("pembimbing")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (pembimbingError) throw pembimbingError;

    if (!pembimbing) {
      return NextResponse.json(
        { error: "Akses hanya untuk pembimbing." },
        { status: 403 }
      );
    }

    const { data: tugas, error: tugasError } =
      await adminSupabase
        .from("tugas")
        .select("id, judul, deskripsi, deadline, pembimbing_id")
        .eq("id", tugasId)
        .eq("pembimbing_id", pembimbing.id)
        .maybeSingle();

    if (tugasError) throw tugasError;

    if (!tugas) {
      return NextResponse.json(
        { error: "Tugas tidak ditemukan atau bukan milikmu." },
        { status: 404 }
      );
    }

    // 4. Ambil peserta yang benar-benar ditugaskan.
    const { data: assignments, error: assignmentError } =
      await adminSupabase
        .from("tugas_peserta")
        .select("peserta_id")
        .eq("tugas_id", tugas.id);

    if (assignmentError) throw assignmentError;

    const pesertaIds = [
      ...new Set(
        (assignments ?? [])
          .map((item) => item.peserta_id)
          .filter(Boolean)
      ),
    ];

    if (pesertaIds.length === 0) {
      return NextResponse.json({
        message: "Tugas tersimpan, tetapi belum ada peserta yang ditugaskan.",
        sent: 0,
      });
    }

    const { data: pesertaRows, error: pesertaError } =
      await adminSupabase
        .from("peserta")
        .select("id, user_id")
        .in("id", pesertaIds);

    if (pesertaError) throw pesertaError;

    const userIds = [
      ...new Set(
        (pesertaRows ?? [])
          .map((item) => item.user_id)
          .filter(Boolean)
      ),
    ];

    const { data: profiles, error: profilesError } =
      await adminSupabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

    if (profilesError) throw profilesError;

    const emails = [
      ...new Set(
        (profiles ?? [])
          .map((profile) => profile.email?.trim())
          .filter(
            (email): email is string =>
              typeof email === "string" &&
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          )
      ),
    ];

    if (emails.length === 0) {
      return NextResponse.json({
        message: "Tidak ada alamat email peserta yang valid.",
        sent: 0,
      });
    }

    // 5. Kirim satu email per penerima.
    const deadline = tugas.deadline
      ? new Date(tugas.deadline).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "Belum ditentukan";

    const results = await Promise.allSettled(
      emails.map((email) =>
        resend.emails.send({
          from: emailFrom,
          to: email,
          subject: `Tugas baru: ${tugas.judul}`,
          text: [
            "Halo, Peserta Magang!",
            "",
            "Kamu mendapatkan tugas baru.",
            `Judul: ${tugas.judul}`,
            `Deskripsi: ${tugas.deskripsi || "Tidak ada deskripsi."}`,
            `Deadline: ${deadline}`,
            "",
            "Silakan login ke dashboard Magang-ers untuk melihat detail tugas.",
          ].join("\n"),
        })
      )
    );

    const sent = results.filter(
      (result) =>
        result.status === "fulfilled" && !result.value.error
    ).length;

    const failed = results.length - sent;

    // Jangan menganggap semua email terkirim jika Resend menolak sebagian.
    return NextResponse.json(
      {
        message:
          failed === 0
            ? "Email notifikasi berhasil diproses."
            : "Sebagian email gagal dikirim.",
        sent,
        failed,
      },
      { status: failed === 0 ? 200 : 502 }
    );
  } catch (error) {
    console.error("Gagal mengirim notifikasi tugas:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengirim notifikasi tugas." },
      { status: 500 }
    );
  }
}
