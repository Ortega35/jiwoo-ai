import { useState, useRef, useEffect } from "react";
import WelcomeScreen from "./pages/WelcomeScreen";
import OnboardingAbout from "./pages/OnboardingAbout";
import OnboardingFeatures from "./pages/OnboardingFeatures";
import AuthScreen from "./pages/AuthScreen";
import CounselingScreen from "./pages/CounselingScreen";
import ProfileScreen from "./pages/ProfileScreen";
import SignUpScreen from "./pages/SignUpScreen";
import SignInScreen from "./pages/SignInScreen";
import jiwooMascot from "./assets/jiwoo.svg";
import {
  supabase,
  syncSupabaseUser,
  getCurrentUser,
  logoutUser,
} from "./services/authService";
import { MessageCircleHeart, User, Sparkles, LogOut, Home } from "lucide-react";

export default function App() {
  const [screen, setScreen] = useState(1);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const startXRef = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const synced = syncSupabaseUser(session.user);
        setCurrentUser(synced);
        setScreen(5);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const synced = syncSupabaseUser(session.user);
        setCurrentUser(synced);
        setScreen((prev) => (prev < 5 || prev > 6 ? 5 : prev));
      } else {
        setCurrentUser(getCurrentUser());
      }
    });

    return () => subscription.unsubscribe();
  }, [screen]);

  const handleStart = (clientX) => {
    startXRef.current = clientX;
    isDraggingRef.current = true;
  };

  const handleEnd = (clientX) => {
    if (!isDraggingRef.current || startXRef.current === null) return;
    const diffX = startXRef.current - clientX;
    const minSwipeDistance = 50;

    if (screen >= 2 && screen <= 4) {
      if (diffX > minSwipeDistance && screen < 4) {
        setScreen((prev) => prev + 1);
      } else if (diffX < -minSwipeDistance && screen > 2) {
        setScreen((prev) => prev - 1);
      }
    }

    startXRef.current = null;
    isDraggingRef.current = false;
  };

  const handleDesktopLogout = async () => {
    await logoutUser();
    setScreen(4);
  };

  const isDashboard = screen === 5 || screen === 6;

  return (
    <div className="h-screen w-full bg-[#FDF3E7] flex font-serif select-none overflow-hidden text-[#4A3525]">
      {/* SIDEBAR KHUSUS LAPTOP/DESKTOP (Hanya muncul di layar md/laptop saat sudah login) */}
      {isDashboard && (
        <aside className="hidden md:flex w-72 bg-[#F6E4CE] border-r-2 border-[#4A3525]/15 flex-col justify-between p-6 z-20 shrink-0 shadow-lg">
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3 pb-5 border-b-2 border-[#4A3525]/10">
              <div className="w-12 h-12 rounded-2xl bg-[#F4A950] border-2 border-[#4A3525] flex items-center justify-center shadow-sm">
                <img
                  src={jiwooMascot}
                  alt="Jiwoo"
                  className="w-9 h-9 object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-[#4A3525]">
                  Jiwoo AI
                </h1>
                <p className="text-[11px] text-[#4A3525]/70 font-sans">
                  CBT Virtual Counselor
                </p>
              </div>
            </div>

            {/* Menu Navigasi Laptop */}
            <nav className="mt-6 flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#4A3525]/50 px-3 mb-1">
                Menu Utama
              </p>
              <button
                type="button"
                onClick={() => setScreen(5)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  screen === 5
                    ? "bg-[#F4A950] text-[#4A3525] border-2 border-[#4A3525] shadow-md"
                    : "text-[#4A3525]/80 hover:bg-[#4A3525]/5"
                }`}
              >
                <MessageCircleHeart size={18} />
                Ruang Konseling CBT
              </button>

              <button
                type="button"
                onClick={() => setScreen(6)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  screen === 6
                    ? "bg-[#F4A950] text-[#4A3525] border-2 border-[#4A3525] shadow-md"
                    : "text-[#4A3525]/80 hover:bg-[#4A3525]/5"
                }`}
              >
                <User size={18} />
                Profil & Akun Saya
              </button>

              <button
                type="button"
                onClick={() => setScreen(1)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-[#4A3525]/80 hover:bg-[#4A3525]/5 transition-all cursor-pointer"
              >
                <Home size={18} />
                Halaman Pengenalan
              </button>
            </nav>

            {/* Info Privasi Zero-Database di Sidebar */}
            <div className="mt-8 p-4 rounded-2xl bg-[#FDF3E7] border border-[#4A3525]/20 text-left">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#4A3525] mb-1">
                <Sparkles size={14} className="text-[#F4A950]" />
                Mode Ephemeral Aktif
              </div>
              <p className="text-[11px] text-[#4A3525]/75 leading-relaxed">
                Seluruh percakapan konselingmu bersifat rahasia dan langsung
                terhapus saat sesi ditutup.
              </p>
            </div>
          </div>

          {/* Kartu User Aktif di Bawah Sidebar */}
          <div className="pt-4 border-t-2 border-[#4A3525]/10 flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-[#FDF3E7] p-3 rounded-2xl border border-[#4A3525]/20">
              <div className="w-10 h-10 rounded-full bg-[#EAE6DF] border border-[#4A3525] overflow-hidden shrink-0 flex items-center justify-center">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={jiwooMascot}
                    alt="Avatar"
                    className="w-8 h-8 object-contain"
                  />
                )}
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-xs font-bold truncate">
                  {currentUser?.name}
                </p>
                <p className="text-[10px] text-[#4A3525]/60 truncate">
                  {currentUser?.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDesktopLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 border border-red-800/20 text-xs font-bold cursor-pointer transition-all"
            >
              <LogOut size={14} /> Keluar Sesi
            </button>
          </div>
        </aside>
      )}

      {/* AREA KONTEN UTAMA */}
      <main
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchEnd={(e) => handleEnd(e.changedTouches[0].clientX)}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseUp={(e) => handleEnd(e.clientX)}
        className={`relative flex-1 h-full overflow-hidden flex flex-col justify-between ${
          screen >= 2 && screen <= 4 ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        {/* Top Navbar Khusus Laptop saat di halaman Welcome / Onboarding / Auth */}
        {!isDashboard && (
          <header className="hidden md:flex items-center justify-between px-12 py-5 border-b border-[#4A3525]/10 bg-[#FDF3E7]/80 backdrop-sepia-50 z-20 ">
            <div
              onClick={() => setScreen(1)}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <img
                src={jiwooMascot}
                alt="Jiwoo"
                className="w-15 h-15 object-contain"
              />
              <span className="text-lg font-bold text-[#4A3525]">
                Jiwoo Counseling
              </span>
            </div>
            <div className="flex items-center gap-6 text-l font-bold">
              <button
                type="button"
                onClick={() => setScreen(1)}
                className={`cursor-pointer hover:text-[#F4A950] ${
                  screen === 1 ? "underline decoration-2" : ""
                }`}
              >
                Beranda
              </button>
              <button
                type="button"
                onClick={() => setScreen(2)}
                className={`cursor-pointer hover:text-[#F4A950] ${
                  screen === 2 ? "underline decoration-2" : ""
                }`}
              >
                Tentang Jiwoo
              </button>
              <button
                type="button"
                onClick={() => setScreen(3)}
                className={`cursor-pointer hover:text-[#F4A950] ${
                  screen === 3 ? "underline decoration-2" : ""
                }`}
              >
                Fitur Utama
              </button>
              <button
                type="button"
                onClick={() => setScreen(4)}
                className="bg-[#F4A950] px-4 py-2 rounded-full border border-[#4A3525] shadow-sm cursor-pointer hover:bg-[#e5983e]"
              >
                Masuk / Daftar
              </button>
            </div>
          </header>
        )}

        {/* Ornamen Gelembung Latar Belakang */}
        <div className="pointer-events-none absolute -top-12 -left-12 w-44 h-44 md:w-64 md:h-64 rounded-full bg-[#F4A950]/45 animate-bubble-slow" />
        <div className="pointer-events-none absolute top-20 right-8 w-24 h-24 md:w-48 md:h-48 rounded-full bg-[#F4A950]/35 animate-bubble-reverse" />
        <div className="pointer-events-none absolute -bottom-12 right-12 w-36 h-36 md:w-56 md:h-56 rounded-full bg-[#F4A950]/40 animate-bubble-float" />

        <div className="relative z-10 flex-1 w-full h-full overflow-y-auto flex flex-col justify-center">
          {screen === 1 && <WelcomeScreen onNext={() => setScreen(2)} />}
          {screen === 2 && <OnboardingAbout onNext={() => setScreen(3)} />}
          {screen === 3 && <OnboardingFeatures onNext={() => setScreen(4)} />}
          {screen === 4 && (
            <AuthScreen
              onGoSignUp={() => setScreen(41)}
              onGoSignIn={() => setScreen(42)}
              onBack={() => setScreen(3)}
            />
          )}
          {screen === 41 && (
            <SignUpScreen
              onSuccess={() => setScreen(5)}
              onBackToAuth={() => setScreen(4)}
              onSwitchToSignIn={() => setScreen(42)}
            />
          )}
          {screen === 42 && (
            <SignInScreen
              onSuccess={() => setScreen(5)}
              onBackToAuth={() => setScreen(4)}
              onSwitchToSignUp={() => setScreen(41)}
            />
          )}
          {screen === 5 && <CounselingScreen setScreen={setScreen} />}
          {screen === 6 && <ProfileScreen setScreen={setScreen} />}
        </div>
      </main>
    </div>
  );
}
