import { useState } from "react";
import jiwooMascot from "../assets/jiwoo.svg";
import {
  loginWithGoogleOAuth,
  registerSocialUser,
} from "../services/authService";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function SignUpScreen({
  onSuccess,
  onBackToAuth,
  onSwitchToSignIn,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    try {
      const user = await registerSocialUser({ name, email, password });
      onSuccess(user);
    } catch (err) {
      setErrorMsg(err.message || "Gagal mendaftar akun.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      await loginWithGoogleOAuth("signup");
    } catch (err) {
      setErrorMsg(err.message || "Gagal menghubungkan ke Google.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 flex items-center justify-center h-full w-full px-5 md:px-10 py-6 animate-pop-1">
      {/* Kontainer Utama: 1 Kartu di HP (max-w-md), 2 Kolom Split-Card di Laptop (md:max-w-4xl) */}
      <div className="w-full max-w-md md:max-w-4xl bg-white/95 border-2 border-[#4A3525] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* PANEL KIRI (Khusus Laptop): Branding & Maskot Jiwoo */}
        <div className="hidden md:flex md:col-span-5 bg-[#F6E4CE] border-r-2 border-[#4A3525]/15 p-8 flex-col justify-between text-left">
          <div>
            <button
              type="button"
              onClick={onBackToAuth}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A3525]/75 hover:text-[#4A3525] cursor-pointer transition-colors"
            >
              <ArrowLeft size={15} /> Kembali
            </button>

            <div className="mt-6">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F4A950]/40 border border-[#4A3525]/20 text-[11px] font-bold text-[#4A3525]">
                <Sparkles size={12} /> Ruang Curhat CBT
              </span>
              <h2 className="mt-3 text-2xl font-bold text-[#4A3525] leading-snug">
                Mulai Perjalanan Tenangmu Bersama Jiwoo
              </h2>
              <p className="mt-2 text-xs text-[#4A3525]/75 leading-relaxed">
                Daftarkan akunmu dalam hitungan detik untuk mulai mengobrol,
                mengenali distorsi pikiran, dan menjaga kesehatan mentalmu.
              </p>
            </div>
          </div>

          <div className="my-4 flex flex-col items-center">
            <img
              src={jiwooMascot}
              alt="Jiwoo Mascot"
              draggable={false}
              className="w-36 h-36 object-contain animate-jiwoo"
            />
            <div className="w-36 h-0.5 bg-[#4A3525] -mt-2" />
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold text-[#4A3525]/80 bg-[#FDF3E7] p-3 rounded-2xl border border-[#4A3525]/20">
            <ShieldCheck size={16} className="text-green-700 shrink-0" />
            <span>
              Privasi Terjamin dengan Sistem Ephemeral (Zero-Database)
            </span>
          </div>
        </div>

        {/* PANEL KANAN: Form Sign Up (Tampil di HP & Laptop) */}
        <div className="md:col-span-7 p-5 md:p-8 flex flex-col items-center justify-center text-center">
          {/* Tombol Kembali & Maskot (Hanya tampil di HP karena di Laptop sudah ada di Panel Kiri) */}
          <button
            type="button"
            onClick={onBackToAuth}
            className="md:hidden self-start flex items-center gap-1 text-[11px] font-bold text-[#4A3525]/70 hover:text-[#4A3525] mb-1 cursor-pointer"
          >
            <ArrowLeft size={13} /> Kembali
          </button>

          <img
            src={jiwooMascot}
            alt="Jiwoo Mascot"
            draggable={false}
            className="md:hidden w-16 h-16 object-contain animate-jiwoo -mt-2"
          />

          <h3 className="text-sm md:text-xl font-bold text-[#4A3525]">
            Buat Akun Jiwoo
          </h3>
          <p className="text-[10px] md:text-xs text-[#4A3525]/70 mb-4 mt-0.5">
            Daftar dengan akun Google asli atau email kamu 🐾
          </p>

          {errorMsg && (
            <div className="w-full mb-3 px-3.5 py-2 rounded-xl bg-red-100 border border-red-400 text-red-700 text-[10px] md:text-xs font-bold">
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-white hover:bg-gray-50 active:scale-95 text-[#4A3525] font-bold text-xs md:text-sm py-2.5 px-4 rounded-full shadow-sm border-2 border-[#4A3525] flex items-center justify-center gap-2.5 cursor-pointer transition-all"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5L1.6 17c1.9 3.9 5.8 7 10.4 7z"
              />
            </svg>
            {isLoading ? "Menghubungkan..." : "Lanjutkan dengan Google"}
          </button>

          <div className="my-3.5 flex items-center w-full gap-2">
            <div className="flex-1 h-px bg-[#4A3525]/20" />
            <span className="text-[9px] md:text-[10px] text-[#4A3525]/60 font-bold">
              ATAU DAFTAR EMAIL
            </span>
            <div className="flex-1 h-px bg-[#4A3525]/20" />
          </div>

          <form
            onSubmit={handleSignUp}
            className="w-full flex flex-col gap-2.5 md:gap-3 text-left"
          >
            <div>
              <label className="text-[10px] md:text-xs font-bold text-[#4A3525] ml-2 mb-1 flex items-center gap-1">
                <User size={12} /> Nama Lengkap / Panggilan
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Shahan Syah"
                className="w-full bg-[#FDF3E7] border border-[#4A3525]/40 rounded-full px-4 py-2 text-xs md:text-sm text-[#4A3525] focus:outline-none focus:border-[#4A3525]"
              />
            </div>

            <div>
              <label className="text-[10px] md:text-xs font-bold text-[#4A3525] ml-2 mb-1 flex items-center gap-1">
                <Mail size={12} /> Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-[#FDF3E7] border border-[#4A3525]/40 rounded-full px-4 py-2 text-xs md:text-sm text-[#4A3525] focus:outline-none focus:border-[#4A3525]"
              />
            </div>

            <div>
              <label className="text-[10px] md:text-xs font-bold text-[#4A3525] ml-2 mb-1 flex items-center gap-1">
                <Lock size={12} /> Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter..."
                className="w-full bg-[#FDF3E7] border border-[#4A3525]/40 rounded-full px-4 py-2 text-xs md:text-sm text-[#4A3525] focus:outline-none focus:border-[#4A3525]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-[#F4A950] hover:bg-[#e5983e] active:scale-95 text-[#4A3525] font-bold text-xs md:text-sm py-2.5 rounded-full shadow border-2 border-[#4A3525] cursor-pointer transition-all"
            >
              {isLoading ? "Memproses..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-4 text-[10px] md:text-xs text-[#4A3525]/80">
            Sudah punya akun?{" "}
            <button
              type="button"
              onClick={onSwitchToSignIn}
              className="font-bold underline cursor-pointer text-[#4A3525] hover:text-[#F4A950]"
            >
              Log In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
