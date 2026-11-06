import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SESSION_KEY = "jiwoo_ephemeral_user";
const OAUTH_INTENT_KEY = "jiwoo_oauth_intent";

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

// Cek apakah user Google baru saja ter-registrasi otomatis padahal menekan tombol di halaman Sign In
export async function validateOAuthSessionIntent(supaUser) {
  if (!supaUser) return { valid: false, error: null };

  const intent = sessionStorage.getItem(OAUTH_INTENT_KEY);
  sessionStorage.removeItem(OAUTH_INTENT_KEY);

  const meta = supaUser.user_metadata || {};
  const provider = supaUser.app_metadata?.provider || "email";

  if (provider === "google") {
    const createdAt = new Date(supaUser.created_at).getTime();
    const now = Date.now();
    const isJustCreated = now - createdAt < 15000 && !meta.isRegistered;

    if (intent === "signin" && isJustCreated) {
      sessionStorage.removeItem(SESSION_KEY);
      await supabase.auth.signOut();
      return {
        valid: false,
        error:
          "Akun Google ini belum terdaftar di Jiwoo AI. Silakan daftar melalui menu Sign Up terlebih dahulu!",
      };
    }

    if (!meta.isRegistered) {
      await supabase.auth.updateUser({
        data: { isRegistered: true },
      });
    }
  }

  return { valid: true, error: null };
}

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

// 1. Login / Sign Up dengan Google (Menerima mode: "signin" atau "signup")
export async function loginWithGoogleOAuth(mode = "signup") {
  sessionStorage.setItem(OAUTH_INTENT_KEY, mode);
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

// 2. Sign Up dengan Email & Password Manual
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
        profileEdited: Boolean(birthDate.trim() || location.trim()),
        isRegistered: true,
      },
    },
  });
  if (error) throw new Error(error.message);
  return syncSupabaseUser(data.user);
}

// 3. Sign In dengan Email & Password Manual
export async function loginSocialUser({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    throw new Error(
      "Akun belum terdaftar atau password salah. Silakan Sign Up terlebih dahulu!",
    );
  }
  return syncSupabaseUser(data.user);
}

// 4. Update Biodata User
export async function updateUserProfile(updates = {}) {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      full_name: updates.name?.trim() || "",
      birthDate: updates.birthDate?.trim() || "",
      location: updates.location?.trim() || "",
      profileEdited: true,
      isRegistered: true,
    },
  });

  if (error) throw new Error(error.message);
  return syncSupabaseUser(data.user);
}

// 5. Ambil User Aktif
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

// 6. Logout
export async function logoutUser() {
  sessionStorage.removeItem(SESSION_KEY);
  await supabase.auth.signOut();
}
