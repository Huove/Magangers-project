"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type ElementType,
  type ReactNode,
} from "react";

import {
  User,
  Mail,
  Phone,
  School,
  GraduationCap,
  BriefcaseBusiness,
  UserRoundCheck,
  CalendarDays,
  Lock,
  Eye,
  EyeOff,
  X,
  ShieldCheck,
  Camera,
  Trash2,
  Upload,
  ImageIcon,
  Link2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

// =========================================
// TYPE
// =========================================

type ProfileData = {
  namaLengkap: string;
  email: string;
  nomorHp: string;
  fotoUrl: string | null;

  nomorPeserta: string;
  status: string;

  sekolah: string;
  jurusan: string;

  divisi: string;
  posisi: string;
  pembimbing: string;

  tanggalMulai: string | null;
  tanggalSelesai: string | null;
};

// =========================================
// INITIAL PROFILE
// =========================================

const initialProfile: ProfileData = {
  namaLengkap: "-",
  email: "-",
  nomorHp: "-",
  fotoUrl: null,

  nomorPeserta: "-",
  status: "-",

  sekolah: "-",
  jurusan: "-",

  divisi: "-",
  posisi: "-",
  pembimbing: "-",

  tanggalMulai: null,
  tanggalSelesai: null,
};

// =========================================
// PAGE
// =========================================

export default function ProfilePage() {
  const [profile, setProfile] =
    useState<ProfileData>(initialProfile);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =========================================
  // FOTO PROFILE
  // =========================================

  const [photoModal, setPhotoModal] =
    useState(false);

  const [fotoFile, setFotoFile] =
    useState<File | null>(null);

  const [fotoPreview, setFotoPreview] =
    useState<string | null>(null);

  const [fotoUrlInput, setFotoUrlInput] =
    useState("");

  const [urlPreviewError, setUrlPreviewError] =
    useState(false);

  const [fotoLoading, setFotoLoading] =
    useState(false);

  const [avatarError, setAvatarError] =
    useState(false);

  // =========================================
  // PASSWORD
  // =========================================

  const [
    passwordModal,
    setPasswordModal,
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    passwordLama,
    setPasswordLama,
  ] = useState("");

  const [
    passwordBaru,
    setPasswordBaru,
  ] = useState("");

  const [
    konfirmasiPassword,
    setKonfirmasiPassword,
  ] = useState("");

  const [
    passwordLoading,
    setPasswordLoading,
  ] = useState(false);

  // =========================================
  // FETCH PROFILE
  // =========================================

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        setError("");

        // =====================================
        // USER
        // =====================================

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          throw authError;
        }

        if (!user) {
          setError(
            "User tidak ditemukan. Silakan login kembali."
          );
          return;
        }

        // =====================================
        // PROFILE
        // =====================================

        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            nama_lengkap,
            email,
            nomor_hp,
            foto_url,
            role
          `)
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (!profileData) {
          setError(
            "Data profile tidak ditemukan."
          );
          return;
        }

        // =====================================
        // PESERTA
        // =====================================

        const {
          data: pesertaData,
          error: pesertaError,
        } = await supabase
          .from("peserta")
          .select(`
            id,
            nomor_peserta,
            status,
            tanggal_mulai,
            tanggal_selesai
          `)
          .eq("user_id", user.id)
          .maybeSingle();

        if (pesertaError) {
          throw pesertaError;
        }

        let sekolah = "-";
        let jurusan = "-";

        let divisi = "-";
        let posisi = "-";
        let pembimbing = "-";

        let tanggalMulai =
          pesertaData?.tanggal_mulai || null;

        let tanggalSelesai =
          pesertaData?.tanggal_selesai || null;

        // =====================================
        // DATA PESERTA
        // =====================================

        if (pesertaData) {
          // ===================================
          // PENDIDIKAN
          // ===================================

          const {
            data: pendidikanData,
            error: pendidikanError,
          } = await supabase
            .from("pendidikan")
            .select(`
              sekolah,
              jurusan
            `)
            .eq(
              "peserta_id",
              pesertaData.id
            )
            .maybeSingle();

          if (pendidikanError) {
            console.error(
              "Error pendidikan:",
              pendidikanError
            );
          }

          if (pendidikanData) {
            sekolah =
              pendidikanData.sekolah || "-";

            jurusan =
              pendidikanData.jurusan || "-";
          }

          // ===================================
          // PENEMPATAN
          // ===================================

          const {
            data: penempatanData,
            error: penempatanError,
          } = await supabase
            .from("penempatan")
            .select(`
    id,
    pembimbing_id,
    divisi,
    posisi,
    tanggal_mulai,
    tanggal_selesai
  `)
            .eq(
              "peserta_id",
              pesertaData.id
            )
            .maybeSingle();

          if (penempatanError) {
            console.error(
              "Error penempatan:",
              penempatanError
            );
          }

          if (penempatanData) {
            divisi =
              penempatanData.divisi || "-";

            posisi =
              penempatanData.posisi || "-";

            tanggalMulai =
              penempatanData.tanggal_mulai ||
              tanggalMulai;

            tanggalSelesai =
              penempatanData.tanggal_selesai ||
              tanggalSelesai;

            // ===================================
            // PEMBIMBING
            // ===================================

            if (penempatanData.pembimbing_id) {
              const {
                data: pembimbingProfile,
                error: pembimbingProfileError,
              } = await supabase.rpc(
                "get_pembimbing_peserta",
                {
                  p_pembimbing_id:
                    penempatanData.pembimbing_id,
                }
              );

              if (pembimbingProfileError) {
                console.error(
                  "Error mengambil pembimbing:",
                  pembimbingProfileError
                );
              } else {
                pembimbing =
                  pembimbingProfile?.[0]?.nama_lengkap ||
                  "-";
              }
            }
          }

          // ===================================
          // TUTUP IF PESERTA DATA
          // ===================================

        }

        // =====================================
        // SET PROFILE
        // =====================================

        setProfile({
          namaLengkap:
            profileData.nama_lengkap || "-",

          email:
            profileData.email ||
            user.email ||
            "-",

          nomorHp:
            profileData.nomor_hp || "-",

          fotoUrl:
            profileData.foto_url || null,

          nomorPeserta:
            pesertaData?.nomor_peserta || "-",

          status:
            pesertaData?.status || "-",

          sekolah,
          jurusan,

          divisi,
          posisi,
          pembimbing,

          tanggalMulai,
          tanggalSelesai,
        });

        setAvatarError(false);

      } catch (err) {
        console.error(
          "Gagal mengambil profile:",
          err
        );

        setError(
          "Gagal mengambil data profile."
        );

      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  // =========================================
  // BUKA MODAL FOTO
  // =========================================

  const openPhotoModal = () => {
    if (fotoPreview) {
      URL.revokeObjectURL(
        fotoPreview
      );
    }

    setFotoFile(null);
    setFotoPreview(null);

    setFotoUrlInput("");
    setUrlPreviewError(false);

    setPhotoModal(true);
  };

  // =========================================
  // TUTUP MODAL FOTO
  // =========================================

  const closePhotoModal = () => {
    if (fotoPreview) {
      URL.revokeObjectURL(
        fotoPreview
      );
    }

    setFotoFile(null);
    setFotoPreview(null);

    setFotoUrlInput("");
    setUrlPreviewError(false);

    setPhotoModal(false);
  };

  // =========================================
  // PILIH FOTO DARI DEVICE
  // =========================================

  const handlePilihFoto = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    // =====================================
    // FORMAT
    // =====================================

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      alert(
        "Format foto harus JPG, JPEG, PNG, atau WEBP."
      );

      event.target.value = "";

      return;
    }

    // =====================================
    // FILE ASLI MAX 10 MB
    // =====================================

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(
        "Ukuran foto maksimal 10 MB."
      );

      event.target.value = "";

      return;
    }

    // =====================================
    // HAPUS PREVIEW LAMA
    // =====================================

    if (fotoPreview) {
      URL.revokeObjectURL(
        fotoPreview
      );
    }

    // Kalau pilih file,
    // URL dikosongkan.

    setFotoUrlInput("");
    setUrlPreviewError(false);

    const preview =
      URL.createObjectURL(
        file
      );

    setFotoFile(file);
    setFotoPreview(preview);
  };

  // =========================================
  // SIMPAN FOTO
  //
  // FILE:
  // compress -> Storage -> foto_url
  //
  // URL:
  // langsung -> foto_url
  // =========================================

  const handleSimpanFoto =
    async () => {
      if (
        !fotoFile &&
        !fotoUrlInput.trim()
      ) {
        alert(
          "Pilih foto atau masukkan URL foto."
        );

        return;
      }

      try {
        setFotoLoading(true);

        // =====================================
        // USER
        // =====================================

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          alert(
            "User tidak ditemukan."
          );

          return;
        }

        let finalFotoUrl = "";

        // =====================================
        // FILE UPLOAD
        // =====================================

        if (fotoFile) {
          // ===================================
          // COMPRESS FOTO
          // ===================================

          const compressedFile =
            await compressImage(
              fotoFile
            );

          console.log(
            "Ukuran foto asli:",
            formatFileSize(
              fotoFile.size
            )
          );

          console.log(
            "Ukuran setelah compress:",
            formatFileSize(
              compressedFile.size
            )
          );

          // ===================================
          // PATH
          // ===================================

          const filePath =
            `${user.id}/avatar.webp`;

          // ===================================
          // UPLOAD
          // ===================================

          const {
            error: uploadError,
          } = await supabase.storage
            .from("avatars")
            .upload(
              filePath,
              compressedFile,
              {
                cacheControl: "0",
                upsert: true,
                contentType:
                  "image/webp",
              }
            );

          if (uploadError) {
            throw uploadError;
          }

          // ===================================
          // PUBLIC URL
          // ===================================

          const {
            data: publicUrlData,
          } = supabase.storage
            .from("avatars")
            .getPublicUrl(
              filePath
            );

          if (
            !publicUrlData.publicUrl
          ) {
            throw new Error(
              "URL foto tidak berhasil dibuat."
            );
          }

          // Cache buster supaya browser
          // langsung menampilkan foto baru.

          finalFotoUrl =
            `${publicUrlData.publicUrl}?v=${Date.now()}`;
        }

        // =====================================
        // FOTO DARI URL
        // =====================================

        else {
          const url =
            fotoUrlInput.trim();

          try {
            const parsedUrl =
              new URL(url);

            if (
              parsedUrl.protocol !==
              "http:" &&
              parsedUrl.protocol !==
              "https:"
            ) {
              alert(
                "URL harus menggunakan http atau https."
              );

              return;
            }
          } catch {
            alert(
              "URL foto tidak valid."
            );

            return;
          }

          finalFotoUrl = url;
        }

        // =====================================
        // UPDATE PROFILES
        // =====================================

        const {
          data: updatedProfile,
          error: updateError,
        } = await supabase
          .from("profiles")
          .update({
            foto_url:
              finalFotoUrl,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            user.id
          )
          .select(
            "foto_url"
          )
          .maybeSingle();

        if (updateError) {
          throw updateError;
        }

        if (!updatedProfile) {
          throw new Error(
            "Profile tidak berhasil diperbarui. Pastikan RLS profiles mengizinkan UPDATE."
          );
        }

        // =====================================
        // UPDATE UI
        // =====================================

        setProfile(
          (prev) => ({
            ...prev,

            fotoUrl:
              updatedProfile.foto_url,
          })
        );

        setAvatarError(false);

        if (fotoPreview) {
          URL.revokeObjectURL(
            fotoPreview
          );
        }

        setFotoFile(null);
        setFotoPreview(null);

        setFotoUrlInput("");
        setUrlPreviewError(false);

        setPhotoModal(false);

        alert(
          "Foto profil berhasil diperbarui."
        );
      } catch (err) {
        console.error(
          "Gagal menyimpan foto:",
          err
        );

        alert(
          "Gagal menyimpan foto profil."
        );
      } finally {
        setFotoLoading(false);
      }
    };

  // =========================================
  // HAPUS FOTO
  // =========================================

  const handleHapusFoto =
    async () => {
      try {
        setFotoLoading(true);

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          alert(
            "User tidak ditemukan."
          );

          return;
        }

        // =====================================
        // HAPUS FILE STORAGE
        //
        // Kita hapus format baru dan
        // path lama jika sebelumnya pernah ada.
        // =====================================

        const {
          error: storageError,
        } = await supabase.storage
          .from("avatars")
          .remove([
            `${user.id}/avatar.webp`,
            `${user.id}/avatar`,
          ]);

        if (storageError) {
          console.warn(
            "Storage:",
            storageError
          );
        }

        // =====================================
        // HAPUS FOTO URL PROFILE
        // =====================================

        const {
          error: updateError,
        } = await supabase
          .from("profiles")
          .update({
            foto_url: null,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            user.id
          );

        if (updateError) {
          throw updateError;
        }

        setProfile(
          (prev) => ({
            ...prev,
            fotoUrl: null,
          })
        );

        setAvatarError(false);

        if (fotoPreview) {
          URL.revokeObjectURL(
            fotoPreview
          );
        }

        setFotoFile(null);
        setFotoPreview(null);

        setFotoUrlInput("");
        setUrlPreviewError(false);

        setPhotoModal(false);

        alert(
          "Foto profil berhasil dihapus."
        );
      } catch (err) {
        console.error(
          "Gagal menghapus foto:",
          err
        );

        alert(
          "Gagal menghapus foto profil."
        );
      } finally {
        setFotoLoading(false);
      }
    };

  // =========================================
  // UBAH PASSWORD
  // =========================================

  const handleUbahPassword =
    async () => {
      if (
        !passwordLama ||
        !passwordBaru ||
        !konfirmasiPassword
      ) {
        alert(
          "Semua field password wajib diisi."
        );

        return;
      }

      if (
        passwordBaru.length < 8
      ) {
        alert(
          "Password baru minimal 8 karakter."
        );

        return;
      }

      if (
        passwordBaru !==
        konfirmasiPassword
      ) {
        alert(
          "Konfirmasi password tidak sesuai."
        );

        return;
      }

      try {
        setPasswordLoading(true);

        // =====================================
        // USER
        // =====================================

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user?.email) {
          alert(
            "Email user tidak ditemukan."
          );

          return;
        }

        // =====================================
        // CEK PASSWORD LAMA
        // =====================================

        const {
          error: loginError,
        } =
          await supabase.auth.signInWithPassword(
            {
              email:
                user.email,

              password:
                passwordLama,
            }
          );

        if (loginError) {
          alert(
            "Password lama tidak sesuai."
          );

          return;
        }

        // =====================================
        // UPDATE PASSWORD
        // =====================================

        const {
          error: updateError,
        } =
          await supabase.auth.updateUser(
            {
              password:
                passwordBaru,
            }
          );

        if (updateError) {
          throw updateError;
        }

        alert(
          "Password berhasil diubah."
        );

        setPasswordLama("");
        setPasswordBaru("");
        setKonfirmasiPassword("");

        setPasswordModal(false);
      } catch (err) {
        console.error(
          "Gagal mengubah password:",
          err
        );

        alert(
          "Gagal mengubah password."
        );
      } finally {
        setPasswordLoading(false);
      }
    };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-sm text-neutral-500">
          Memuat data profile...
        </p>
      </div>
    );
  }

  // =========================================
  // ERROR
  // =========================================

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">

        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
          {error}
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 md:p-8">

      {/* =====================================
          PROFILE HEADER
      ===================================== */}

      <div className="mb-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">

          {/* ===================================
              AVATAR
          =================================== */}

          <div className="relative h-28 w-28 shrink-0">

            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100">

              {profile.fotoUrl &&
                !avatarError ? (

                <img
                  key={
                    profile.fotoUrl
                  }
                  src={
                    profile.fotoUrl
                  }
                  alt={`Foto profil ${profile.namaLengkap}`}
                  className="h-full w-full object-cover"
                  onError={() =>
                    setAvatarError(true)
                  }
                />

              ) : (

                <User
                  size={48}
                  strokeWidth={1.5}
                  className="text-neutral-400"
                />

              )}

            </div>

            {/* EDIT FOTO */}

            <button
              type="button"
              onClick={
                openPhotoModal
              }
              className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700"
              title="Ubah foto profil"
            >
              <Camera size={17} />
            </button>

          </div>

          {/* ===================================
              DATA
          =================================== */}

          <div className="flex-1">

            <p className="text-sm text-neutral-500">
              Peserta Magang
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-neutral-900">
              {profile.namaLengkap}
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              {profile.nomorPeserta}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                  profile.status
                )}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />

                {formatStatus(
                  profile.status
                )}
              </span>

              {profile.posisi !== "-" && (

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {profile.posisi}
                </span>

              )}

            </div>

          </div>

        </div>

      </div>

      {/* =====================================
          INFORMASI PRIBADI
      ===================================== */}

      <ProfileSection
        title="Informasi Pribadi"
        description="Informasi dasar mengenai peserta magang."
      >

        <div className="grid gap-4 md:grid-cols-2">

          <ProfileItem
            icon={User}
            label="Nama Lengkap"
            value={
              profile.namaLengkap
            }
          />

          <ProfileItem
            icon={Mail}
            label="Email"
            value={
              profile.email
            }
          />

          <ProfileItem
            icon={Phone}
            label="Nomor Handphone"
            value={
              profile.nomorHp
            }
          />

        </div>

      </ProfileSection>

      {/* =====================================
          PENDIDIKAN
      ===================================== */}

      <ProfileSection
        title="Data Pendidikan"
        description="Informasi pendidikan peserta magang."
      >

        <div className="grid gap-4 md:grid-cols-2">

          <ProfileItem
            icon={School}
            label="Sekolah"
            value={
              profile.sekolah
            }
          />

          <ProfileItem
            icon={
              GraduationCap
            }
            label="Jurusan"
            value={
              profile.jurusan
            }
          />

        </div>

      </ProfileSection>

      {/* =====================================
          PENEMPATAN
      ===================================== */}

      <ProfileSection
        title="Informasi Penempatan"
        description="Informasi mengenai penempatan dan pembimbing magang."
      >

        <div className="grid gap-4 md:grid-cols-2">

          <ProfileItem
            icon={
              BriefcaseBusiness
            }
            label="Divisi / Penempatan"
            value={
              profile.divisi
            }
          />

          <ProfileItem
            icon={
              BriefcaseBusiness
            }
            label="Posisi"
            value={
              profile.posisi
            }
          />

          <ProfileItem
            icon={
              UserRoundCheck
            }
            label="Nama Pembimbing"
            value={
              profile.pembimbing
            }
          />

          <ProfileItem
            icon={
              CalendarDays
            }
            label="Periode Magang"
            value={formatPeriode(
              profile.tanggalMulai,
              profile.tanggalSelesai
            )}
          />

        </div>

      </ProfileSection>

      {/* =====================================
          KEAMANAN
      ===================================== */}

      <ProfileSection
        title="Keamanan Akun"
        description="Kelola keamanan akun peserta magang."
      >

        <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Lock size={18} />
            </div>

            <div>

              <p className="text-xs text-neutral-400">
                Password
              </p>

              <p className="mt-1 text-sm font-medium tracking-widest text-neutral-800">
                ••••••••••••
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              setPasswordModal(true)
            }
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Ubah Password
          </button>

        </div>

      </ProfileSection>

      {/* =====================================
          MODAL FOTO
      ===================================== */}

      {photoModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={
            closePhotoModal
          }
        >

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >

            {/* CLOSE */}

            <button
              type="button"
              onClick={
                closePhotoModal
              }
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200"
            >
              <X size={18} />
            </button>

            {/* HEADER */}

            <div className="mb-6">

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Camera size={21} />
              </div>

              <h2 className="text-xl font-semibold text-neutral-900">
                Ubah Foto Profil
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                Upload foto dari perangkat
                atau gunakan URL gambar.
              </p>

            </div>

            {/* =================================
                PREVIEW
            ================================= */}

            <div className="mb-6 flex justify-center">

              <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-100">

                {fotoPreview ? (

                  <img
                    src={
                      fotoPreview
                    }
                    alt="Preview foto"
                    className="h-full w-full object-cover"
                  />

                ) : fotoUrlInput &&
                  !urlPreviewError ? (

                  <img
                    key={
                      fotoUrlInput
                    }
                    src={
                      fotoUrlInput
                    }
                    alt="Preview URL"
                    className="h-full w-full object-cover"
                    onError={() =>
                      setUrlPreviewError(
                        true
                      )
                    }
                  />

                ) : profile.fotoUrl &&
                  !avatarError ? (

                  <img
                    src={
                      profile.fotoUrl
                    }
                    alt="Foto profil sekarang"
                    className="h-full w-full object-cover"
                  />

                ) : (

                  <User
                    size={52}
                    strokeWidth={1.5}
                    className="text-neutral-400"
                  />

                )}

              </div>

            </div>

            {/* =================================
                FILE UPLOAD
            ================================= */}

            <label
              htmlFor="foto-profile"
              className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-6 py-7 text-center transition hover:border-blue-300 hover:bg-blue-50/50"
            >

              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm transition group-hover:scale-105">

                {fotoFile ? (

                  <ImageIcon
                    size={20}
                  />

                ) : (

                  <Upload
                    size={20}
                  />

                )}

              </div>

              {fotoFile ? (

                <>
                  <p className="max-w-full truncate text-sm font-semibold text-neutral-800">
                    {fotoFile.name}
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    {formatFileSize(
                      fotoFile.size
                    )}
                  </p>

                  <p className="mt-2 text-xs font-medium text-blue-600">
                    Klik untuk ganti foto
                  </p>
                </>

              ) : (

                <>
                  <p className="text-sm font-semibold text-neutral-800">
                    Upload Foto
                  </p>

                  <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                    JPG, JPEG, PNG atau WEBP.
                    Maksimal 10 MB.
                  </p>
                </>

              )}

            </label>

            <input
              id="foto-profile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                handlePilihFoto
              }
              className="hidden"
            />

            {/* =================================
                OR
            ================================= */}

            <div className="my-6 flex items-center gap-4">

              <div className="h-px flex-1 bg-neutral-200" />

              <span className="rounded-full bg-white px-3 py-1 text-[11px] uppercase tracking-wider text-neutral-400">
                OR
              </span>

              <div className="h-px flex-1 bg-neutral-200" />

            </div>

            {/* =================================
                URL
            ================================= */}

            <div>

              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Upload dengan URL
              </label>

              <div className="relative">

                <Link2
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                />

                <input
                  type="url"
                  value={
                    fotoUrlInput
                  }
                  onChange={(e) => {
                    const value =
                      e.target.value;

                    setFotoUrlInput(
                      value
                    );

                    setUrlPreviewError(
                      false
                    );

                    // URL dipilih:
                    // hapus file upload.

                    if (fotoFile) {
                      if (
                        fotoPreview
                      ) {
                        URL.revokeObjectURL(
                          fotoPreview
                        );
                      }

                      setFotoFile(null);
                      setFotoPreview(null);
                    }
                  }}
                  placeholder="https://example.com/foto.jpg"
                  className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              <p className="mt-2 text-xs leading-relaxed text-neutral-400">
                Masukkan URL gambar yang
                dapat diakses secara publik.
              </p>

            </div>

            {/* =================================
                BUTTON
            ================================= */}

            <div className="mt-6 flex gap-3">

              {/* DELETE */}

              {profile.fotoUrl && (

                <button
                  type="button"
                  onClick={
                    handleHapusFoto
                  }
                  disabled={
                    fotoLoading
                  }
                  title="Hapus foto profil"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-200 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2
                    size={17}
                  />
                </button>

              )}

              {/* CANCEL */}

              <button
                type="button"
                onClick={
                  closePhotoModal
                }
                disabled={
                  fotoLoading
                }
                className="flex-1 rounded-full border border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
              >
                Batal
              </button>

              {/* SAVE */}

              <button
                type="button"
                onClick={
                  handleSimpanFoto
                }
                disabled={
                  fotoLoading ||
                  (
                    !fotoFile &&
                    !fotoUrlInput.trim()
                  )
                }
                className="flex-1 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {fotoLoading
                  ? fotoFile
                    ? "Compress & Upload..."
                    : "Menyimpan..."
                  : profile.fotoUrl
                    ? "Ganti Foto"
                    : "Simpan Foto"}

              </button>

            </div>

          </div>

        </div>

      )}

      {/* =====================================
          MODAL PASSWORD
      ===================================== */}

      {passwordModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={() =>
            setPasswordModal(
              false
            )
          }
        >

          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >

            <button
              type="button"
              onClick={() =>
                setPasswordModal(
                  false
                )
              }
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition hover:bg-neutral-200"
            >
              <X size={18} />
            </button>

            <div className="mb-6">

              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <ShieldCheck
                  size={21}
                />

              </div>

              <h2 className="text-xl font-semibold text-neutral-900">
                Ubah Password
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-neutral-500">
                Gunakan password baru yang
                kuat untuk menjaga keamanan
                akun.
              </p>

            </div>

            <div className="space-y-4">

              <PasswordInput
                label="Password Lama"
                value={
                  passwordLama
                }
                onChange={
                  setPasswordLama
                }
                showPassword={
                  showPassword
                }
                setShowPassword={
                  setShowPassword
                }
              />

              <PasswordInput
                label="Password Baru"
                value={
                  passwordBaru
                }
                onChange={
                  setPasswordBaru
                }
                showPassword={
                  showPassword
                }
                setShowPassword={
                  setShowPassword
                }
              />

              <PasswordInput
                label="Konfirmasi Password Baru"
                value={
                  konfirmasiPassword
                }
                onChange={
                  setKonfirmasiPassword
                }
                showPassword={
                  showPassword
                }
                setShowPassword={
                  setShowPassword
                }
              />

            </div>

            <div className="mt-6 flex gap-3">

              <button
                type="button"
                onClick={() =>
                  setPasswordModal(
                    false
                  )
                }
                disabled={
                  passwordLoading
                }
                className="flex-1 rounded-full border border-neutral-200 bg-white py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={
                  handleUbahPassword
                }
                disabled={
                  passwordLoading
                }
                className="flex-1 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {passwordLoading
                  ? "Menyimpan..."
                  : "Simpan Password"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

// =========================================
// PROFILE SECTION
// =========================================

function ProfileSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-7">

      <div className="mb-5">

        <h2 className="text-lg font-semibold text-neutral-900">
          {title}
        </h2>

        <p className="mt-1 text-sm text-neutral-500">
          {description}
        </p>

      </div>

      {children}

    </section>
  );
}

// =========================================
// PROFILE ITEM
// =========================================

function ProfileItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon size={18} />
      </div>

      <div className="min-w-0">

        <p className="text-xs text-neutral-400">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-medium text-neutral-800">
          {value || "-"}
        </p>

      </div>

    </div>
  );
}

// =========================================
// PASSWORD INPUT
// =========================================

function PasswordInput({
  label,
  value,
  onChange,
  showPassword,
  setShowPassword,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  showPassword: boolean;
  setShowPassword: (
    value: boolean
  ) => void;
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-medium text-neutral-700">
        {label}
      </label>

      <div className="relative">

        <input
          type={
            showPassword
              ? "text"
              : "password"
          }
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          placeholder="Masukkan password"
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 pr-12 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={() =>
            setShowPassword(
              !showPassword
            )
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-700"
        >

          {showPassword ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}

        </button>

      </div>

    </div>
  );
}

// =========================================
// STATUS
// =========================================

function formatStatus(
  status: string
) {
  switch (status) {
    case "aktif":
      return "Aktif";

    case "selesai":
      return "Selesai";

    case "diterima":
      return "Diterima";

    case "mengajukan":
      return "Mengajukan";

    case "ditolak":
      return "Ditolak";

    case "tidak_aktif":
      return "Tidak Aktif";

    default:
      return status || "-";
  }
}

function getStatusStyle(
  status: string
) {
  switch (status) {
    case "aktif":
      return "bg-emerald-50 text-emerald-700";

    case "selesai":
      return "bg-blue-50 text-blue-700";

    case "diterima":
      return "bg-cyan-50 text-cyan-700";

    case "mengajukan":
      return "bg-amber-50 text-amber-700";

    case "ditolak":
      return "bg-red-50 text-red-700";

    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

// =========================================
// TANGGAL
// =========================================

function formatTanggal(
  tanggal: string | null
) {
  if (!tanggal) {
    return "-";
  }

  return new Date(
    `${tanggal}T00:00:00`
  ).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function formatPeriode(
  mulai: string | null,
  selesai: string | null
) {
  if (
    !mulai &&
    !selesai
  ) {
    return "-";
  }

  if (
    mulai &&
    !selesai
  ) {
    return `${formatTanggal(
      mulai
    )} - Sekarang`;
  }

  return `${formatTanggal(
    mulai
  )} - ${formatTanggal(
    selesai
  )}`;
}

// =========================================
// FILE SIZE
// =========================================

function formatFileSize(
  bytes: number
) {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const kb =
    bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(
      1
    )} KB`;
  }

  const mb =
    kb / 1024;

  return `${mb.toFixed(
    1
  )} MB`;
}

// =========================================
// COMPRESS IMAGE
// =========================================

async function compressImage(
  file: File
): Promise<File> {
  return new Promise(
    (resolve, reject) => {
      const image =
        new Image();

      const objectUrl =
        URL.createObjectURL(
          file
        );

      image.onload = () => {
        try {
          // Maksimal ukuran gambar setelah resize.
          const maxDimension =
            1024;

          let width =
            image.width;

          let height =
            image.height;

          // ===================================
          // RESIZE
          // ===================================

          if (
            width >
            maxDimension ||
            height >
            maxDimension
          ) {
            if (
              width >
              height
            ) {
              height =
                Math.round(
                  (height *
                    maxDimension) /
                  width
                );

              width =
                maxDimension;
            } else {
              width =
                Math.round(
                  (width *
                    maxDimension) /
                  height
                );

              height =
                maxDimension;
            }
          }

          // ===================================
          // CANVAS
          // ===================================

          const canvas =
            document.createElement(
              "canvas"
            );

          canvas.width =
            width;

          canvas.height =
            height;

          const context =
            canvas.getContext(
              "2d"
            );

          if (!context) {
            URL.revokeObjectURL(
              objectUrl
            );

            reject(
              new Error(
                "Canvas tidak tersedia."
              )
            );

            return;
          }

          // ===================================
          // DRAW
          // ===================================

          context.drawImage(
            image,
            0,
            0,
            width,
            height
          );

          // ===================================
          // WEBP 80%
          // ===================================

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(
                objectUrl
              );

              if (!blob) {
                reject(
                  new Error(
                    "Gagal mengompres gambar."
                  )
                );

                return;
              }

              const compressedFile =
                new File(
                  [blob],
                  `avatar-${Date.now()}.webp`,
                  {
                    type:
                      "image/webp",
                  }
                );

              resolve(
                compressedFile
              );
            },
            "image/webp",
            0.8
          );
        } catch (error) {
          URL.revokeObjectURL(
            objectUrl
          );

          reject(error);
        }
      };

      image.onerror = () => {
        URL.revokeObjectURL(
          objectUrl
        );

        reject(
          new Error(
            "Gagal membaca gambar."
          )
        );
      };

      image.src =
        objectUrl;
    }
  );
}