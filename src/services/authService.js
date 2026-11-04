import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SESSION_KEY = "jiwoo_ephemeral_user";

const FALLBACK_USER = {
  name: "Teman Jiwoo",
  username: "@temanjiwoo",
  email: "",
  birthDate: "",
  location: "",
  avatar: null,
  authMethod: "Belum Login",
  isGuest: true,
};

// Mengubah data asli dari Google / Supabase ke format profil Jiwoo
export function syncSupabaseUser(supaUser) {
  if (!supaUser) {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }

  const meta = supaUser.user_metadata || {};
  const provider = supaUser.app_metadata?.provider || "email";
  const cleanName =
    meta.full_name ||
    meta.name ||
    supaUser.email?.split("@")[0] ||
    "Teman Jiwoo";

  // Jika login via Google dan user BELUM pernah klik "Simpan Profil" (meta.profileEdited !== true),
  // pastikan birthDate & location benar-benar kosong ("")
  const isGoogle = provider === "google";
  const hasEdited = Boolean(meta.profileEdited);

  const rawBirthDate =
    isGoogle && !hasEdited
      ? ""
      : meta.birthDate && meta.birthDate !== "Belum diatur"
        ? meta.birthDate
        : "";

  const rawLocation =
    isGoogle && !hasEdited
      ? ""
      : meta.location && meta.location !== "Belum diatur"
        ? meta.location
        : "";

  const userData = {
    id: supaUser.id,
    name: cleanName,
    username: "@" + (supaUser.email ? supaUser.email.split("@")[0] : "user"),
    email: supaUser.email,
    avatar: meta.avatar_url || meta.picture || null,
    birthDate: rawBirthDate,
    location: rawLocation,
    authMethod: isGoogle ? "Google OAuth 2.0 (Verified)" : "Jiwoo Email Auth",
    isGuest: false,
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
  return userData;
}

// 1. Login & Sign Up dengan Akun Google Asli
export async function loginWithGoogleOAuth() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        prompt: "select_account",
      },
    },
  });
  if (error) throw new Error(error.message);
}

// 2. Sign Up dengan Email & Password Asli ke Supabase (Manual)
export async function registerSocialUser({
  name,
  email,
  password,
  birthDate = "",
  location = "",
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        birthDate: birthDate.trim(),
        location: location.trim(),
        profileEdited: true,
      },
    },
  });
  if (error) throw new Error(error.message);
  return syncSupabaseUser(data.user);
}

// 3. Sign In dengan Email & Password Asli ke Supabase
export async function loginSocialUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return syncSupabaseUser(data.user);
}

// 4. Update Biodata User langsung ke Metadata Supabase
export async function updateUserProfile(updates = {}) {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      full_name: updates.name?.trim() || "",
      birthDate: updates.birthDate?.trim() || "",
      location: updates.location?.trim() || "",
      profileEdited: true, // Tandai bahwa user sudah mengedit profilnya secara manual
    },
  });

  if (error) throw new Error(error.message);
  return syncSupabaseUser(data.user);
}

// 5. Ambil User Aktif untuk ditampilkan di CounselingScreen & ProfileScreen
export function getCurrentUser() {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return FALLBACK_USER;
    const parsed = JSON.parse(saved);
    return {
      ...FALLBACK_USER,
      ...parsed,
      name: parsed?.name || FALLBACK_USER.name,
      birthDate: parsed?.birthDate ?? "",
      location: parsed?.location ?? "",
      isGuest: false,
    };
  } catch {
    return FALLBACK_USER;
  }
}

// 6. Logout Asli dari Supabase
export async function logoutUser() {
  sessionStorage.removeItem(SESSION_KEY);
  await supabase.auth.signOut();
}
