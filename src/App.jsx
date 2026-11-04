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
  validateOAuthSessionIntent,
} from "./services/authService";
import {
  MessageCircleHeart,
  User,
  Sparkles,
  LogOut,
  Home,
  Menu,
  X,
} from "lucide-react";

export default function App() {
  const [screen, setScreen] = useState(1);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const startXRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isInitialAuthChecked = useRef(false);
  const scrollContainerRef = useRef(null);

  // Jangan lupa tambahkan validateOAuthSessionIntent di import "./services/authService" paling atas App.jsx!
  useEffect(() => {
    const handleAuthUser = async (supaUser) => {
      const check = await validateOAuthSessionIntent(supaUser);
      if (!check.valid) {
        isInitialAuthChecked.current = false;
        setCurrentUser(getCurrentUser());
        alert(check.error);
        setScreen(41); // Arahkan langsung ke halaman Sign Up (41)
        return;
      }

      const synced = syncSupabaseUser(supaUser);
      setCurrentUser(synced);
      if (!isInitialAuthChecked.current) {
        isInitialAuthChecked.current = true;
        setScreen(5);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleAuthUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        handleAuthUser(session.user);
      } else if (event === "SIGNED_OUT") {
        isInitialAuthChecked.current = false;
        setCurrentUser(getCurrentUser());
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  // Reset scroll ke paling atas setiap kali berpindah halaman (screen)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [screen]);

  const isDashboard = screen === 5 || screen === 6;
  const isLoggedIn = Boolean(
    currentUser && !currentUser.isGuest && currentUser.email,
  );

  const navigateTo = (targetScreen) => {
    setScreen(targetScreen);
    setIsMobileMenuOpen(false);
  };

  const handleStart = (clientX) => {
    startXRef.current = clientX;
    isDraggingRef.current = true;
  };

  const handleEnd = (clientX) => {
    if (!isDraggingRef.current || startXRef.current === null) return;
    const diffX = startXRef.current - clientX;
    const minSwipeDistance = 50;

    if (screen >= 2 && screen <= 4) {
      if (diffX > minSwipeDistance) {
        if (screen === 3 && isLoggedIn) {
          setScreen(5);
        } else if (screen < 4) {
          setScreen((prev) => prev + 1);
        }
      } else if (diffX < -minSwipeDistance && screen > 2) {
        setScreen((prev) => prev - 1);
      }
    }

    startXRef.current = null;
    isDraggingRef.current = false;
  };

  const handleDesktopLogout = async () => {
    await logoutUser();
    setCurrentUser(getCurrentUser());
    setScreen(4);
  };

  return (
    <div className="h-dvh w-full bg-[#FDF3E7] flex font-serif select-none overflow-hidden text-[#4A3525]">
      {/* SIDEBAR KHUSUS LAPTOP/DESKTOP */}
      {isDashboard && (
        <aside className="hidden md:flex w-72 bg-[#F6E4CE] border-r-2 border-[#4A3525]/15 flex-col justify-between p-6 z-30 shrink-0 shadow-lg">
          <div>
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
        className={`relative flex-1 h-full overflow-hidden flex flex-col ${
          screen >= 2 && screen <= 4 ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        {/* Top Navbar: Selalu terkunci di atas (sticky/shrink-0 z-50) agar tidak pernah hilang saat scroll */}
        {!isDashboard && (
          <header className="sticky top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-6 md:px-12 py-3 md:py-4 border-b border-[#4A3525]/15 bg-[#FDF3E7]/95 backdrop-blur-md z-50 shrink-0">
            {/* Logo & Nama Brand */}
            <div
              onClick={() => navigateTo(1)}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <img
                src={jiwooMascot}
                alt="Jiwoo"
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 object-contain"
              />
              <span className="text-sm sm:text-base md:text-lg font-bold text-[#4A3525]">
                Jiwoo Counseling
              </span>
            </div>

            {/* Menu Horizontal Khusus Laptop (md:flex) */}
            <div className="hidden md:flex items-center gap-6 text-sm font-bold">
              <button
                type="button"
                onClick={() => navigateTo(1)}
                className={`cursor-pointer hover:text-[#F4A950] transition-colors ${
                  screen === 1 ? "underline decoration-2" : ""
                }`}
              >
                Beranda
              </button>
              <button
                type="button"
                onClick={() => navigateTo(2)}
                className={`cursor-pointer hover:text-[#F4A950] transition-colors ${
                  screen === 2 ? "underline decoration-2" : ""
                }`}
              >
                Tentang Jiwoo
              </button>
              <button
                type="button"
                onClick={() => navigateTo(3)}
                className={`cursor-pointer hover:text-[#F4A950] transition-colors ${
                  screen === 3 ? "underline decoration-2" : ""
                }`}
              >
                Fitur Utama
              </button>
              <button
                type="button"
                onClick={() => navigateTo(isLoggedIn ? 5 : 4)}
                className="bg-[#F4A950] px-4 py-2 rounded-full border border-[#4A3525] shadow-sm cursor-pointer hover:bg-[#e5983e] transition-all"
              >
                {isLoggedIn ? "Ruang Konseling →" : "Masuk / Daftar"}
              </button>
            </div>

            {/* Tombol Hamburger Khusus HP */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Menu"
              className="md:hidden relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-[#F6E4CE] border-2 border-[#4A3525] text-[#4A3525] shadow-[0_2px_0_#4A3525] active:translate-y-0.5 transition-all cursor-pointer overflow-hidden"
            >
              <Menu
                size={18}
                className={`absolute transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen
                    ? "opacity-0 rotate-90 scale-50"
                    : "opacity-100 rotate-0 scale-100"
                }`}
              />
              <X
                size={18}
                className={`absolute transition-all duration-300 ease-in-out ${
                  isMobileMenuOpen
                    ? "opacity-100 rotate-0 scale-100"
                    : "opacity-0 -rotate-90 scale-50"
                }`}
              />
            </button>

            {/* Dropdown Menu Hamburger */}
            <div
              className={`md:hidden absolute top-full left-0 right-0 bg-[#FDF3E7] border-b-2 border-[#4A3525] shadow-xl px-5 py-4 flex flex-col gap-2.5 z-50 origin-top transition-all duration-300 ease-out ${
                isMobileMenuOpen
                  ? "opacity-100 translate-y-0 scale-y-100 pointer-events-auto"
                  : "opacity-0 -translate-y-3 scale-y-95 pointer-events-none"
              }`}
            >
              <button
                type="button"
                onClick={() => navigateTo(1)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  screen === 1
                    ? "bg-[#F6E4CE] border border-[#4A3525] translate-x-1"
                    : "hover:bg-[#F6E4CE]/60 hover:translate-x-1"
                }`}
              >
                🏠 Beranda & Pengenalan
              </button>
              <button
                type="button"
                onClick={() => navigateTo(2)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  screen === 2
                    ? "bg-[#F6E4CE] border border-[#4A3525] translate-x-1"
                    : "hover:bg-[#F6E4CE]/60 hover:translate-x-1"
                }`}
              >
                ✨ Tentang Jiwoo AI
              </button>
              <button
                type="button"
                onClick={() => navigateTo(3)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  screen === 3
                    ? "bg-[#F6E4CE] border border-[#4A3525] translate-x-1"
                    : "hover:bg-[#F6E4CE]/60 hover:translate-x-1"
                }`}
              >
                🛡️ Fitur Utama CBT
              </button>
              <button
                type="button"
                onClick={() => navigateTo(isLoggedIn ? 5 : 4)}
                className="w-full text-center mt-1 bg-[#F4A950] hover:bg-[#e5983e] text-[#4A3525] font-bold text-xs py-3 rounded-xl border-2 border-[#4A3525] shadow-[0_3px_0_#4A3525] active:translate-y-0.5 active:shadow-[0_1px_0_#4A3525] transition-all cursor-pointer"
              >
                {isLoggedIn
                  ? "Kembali ke Ruang Konseling →"
                  : "Masuk / Daftar Akun"}
              </button>
            </div>
          </header>
        )}

        {/* Ornamen Gelembung Latar Belakang */}
        <div className="pointer-events-none absolute -top-12 -left-12 w-40 h-40 md:w-64 md:h-64 rounded-full bg-[#F4A950]/45 animate-bubble-slow" />
        <div className="pointer-events-none absolute top-20 right-6 w-20 h-20 md:w-48 md:h-48 rounded-full bg-[#F4A950]/35 animate-bubble-reverse" />
        <div className="pointer-events-none absolute -bottom-12 right-8 w-32 h-32 md:w-56 md:h-56 rounded-full bg-[#F4A950]/40 animate-bubble-float" />

        {/* Container Scrollable: Menggunakan my-auto pada anak elemen, BUKAN justify-center, agar bagian atas tidak terpotong */}
        <div
          ref={scrollContainerRef}
          onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
          className="relative z-10 flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col"
        >
          {screen === 1 && (
            <WelcomeScreen
              isLoggedIn={isLoggedIn}
              onNext={() => setScreen(isLoggedIn ? 5 : 2)}
              onReadGuide={() => setScreen(2)}
            />
          )}
          {screen === 2 && <OnboardingAbout onNext={() => setScreen(3)} />}
          {screen === 3 && (
            <OnboardingFeatures onNext={() => setScreen(isLoggedIn ? 5 : 4)} />
          )}
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
