import jiwooMascot from "../assets/jiwoo.svg";
import {
  UserPlus,
  LogIn,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function AuthScreen({ onGoSignUp, onGoSignIn, onBack }) {
  return (
    <div className="relative z-10 flex items-center justify-center h-full w-full px-6 md:px-10 py-6 animate-pop-1">
      {/* TAMPILAN HP / TABLET KECIL */}
      <div className="md:hidden flex flex-col items-center justify-center text-center w-full">
        <div className="relative bg-white border-2 border-[#4A3525] rounded-3xl px-5 py-3.5 mb-3 shadow-md max-w-xs">
          <p className="text-xs font-bold text-[#4A3525] leading-relaxed">
            Sudah Kenal Sama Jiwoo kan? <br />
            Daftar dulu Ya.. jika belum punya akun..💕
          </p>
          <div className="absolute -bottom-2.5 left-10 w-4 h-4 bg-white border-b-2 border-r-2 border-[#4A3525] rotate-45" />
        </div>

        <img
          src={jiwooMascot}
          alt="Jiwoo Mascot"
          draggable={false}
          className="w-36 h-36 object-contain animate-jiwoo"
        />

        <div className="flex flex-col gap-2.5 w-48 mt-5">
          <button
            type="button"
            onClick={onGoSignUp}
            className="w-full bg-[#F4A950] hover:bg-[#e5983e] active:scale-95 text-[#4A3525] font-bold text-xs py-2.5 rounded-full shadow border-2 border-[#4A3525] cursor-pointer transition-all"
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={onGoSignIn}
            className="w-full bg-white hover:bg-[#FDF3E7] active:scale-95 text-[#4A3525] font-bold text-xs py-2.5 rounded-full shadow border-2 border-[#4A3525] cursor-pointer transition-all"
          >
            Sign In
          </button>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="mt-4 text-[11px] font-semibold text-[#4A3525]/80 underline cursor-pointer hover:text-[#4A3525]"
        >
          ← Back to Features
        </button>
      </div>

      {/* TAMPILAN LAPTOP / DESKTOP */}
      <div className="hidden md:grid w-full max-w-4xl bg-white/95 border-2 border-[#4A3525] rounded-3xl shadow-2xl overflow-hidden grid-cols-12">
        {/* Panel Kiri: Panggung Maskot & Balon Sapaan */}
        <div className="col-span-6 bg-[#F6E4CE] border-r-2 border-[#4A3525]/15 p-10 flex flex-col items-center justify-between text-center">
          <button
            type="button"
            onClick={onBack}
            className="self-start inline-flex items-center gap-1.5 text-xs font-bold text-[#4A3525]/75 hover:text-[#4A3525] cursor-pointer transition-colors"
          >
            <ArrowLeft size={15} /> Kembali ke Fitur
          </button>

          <div className="my-4 flex flex-col items-center">
            <div className="relative bg-white border-2 border-[#4A3525] rounded-3xl px-6 py-4 mb-4 shadow-md max-w-xs">
              <p className="text-xs font-bold text-[#4A3525] leading-relaxed">
                Sudah Kenal Sama Jiwoo kan? <br />
                Daftar dulu Ya.. jika belum punya akun..💕
              </p>
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-[#4A3525] rotate-45" />
            </div>

            <img
              src={jiwooMascot}
              alt="Jiwoo Mascot"
              draggable={false}
              className="w-44 h-44 object-contain animate-jiwoo"
            />
            <div className="w-44 h-0.5 bg-[#4A3525] -mt-2" />
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold text-[#4A3525]/80 bg-[#FDF3E7] px-4 py-2.5 rounded-2xl border border-[#4A3525]/20">
            <ShieldCheck size={16} className="text-green-700 shrink-0" />
            <span>Terintegrasi dengan Google OAuth 2.0 & Supabase</span>
          </div>
        </div>

        {/* Panel Kanan: Pilihan Masuk atau Daftar */}
        <div className="col-span-6 p-10 flex flex-col justify-center text-left">
          <span className="inline-flex items-center gap-1.5 w-fit px-3 py-1 rounded-full bg-[#F4A950]/35 border border-[#4A3525]/20 text-[11px] font-bold text-[#4A3525] mb-3">
            <Sparkles size={12} /> Akses Ruang Konseling
          </span>

          <h2 className="text-2xl font-bold text-[#4A3525] leading-snug">
            Mulai Sesi Curhatmu Sekarang
          </h2>
          <p className="mt-2 text-xs text-[#4A3525]/75 leading-relaxed mb-6">
            Pilih metode akses di bawah ini. Kamu bisa menggunakan akun Google
            aslimu agar foto profil dan namamu langsung terhubung otomatis.
          </p>

          <div className="flex flex-col gap-3.5 w-full">
            <button
              type="button"
              onClick={onGoSignUp}
              className="w-full bg-[#F4A950] hover:bg-[#e5983e] active:scale-95 text-[#4A3525] font-bold text-sm py-3.5 px-6 rounded-2xl shadow-md border-2 border-[#4A3525] flex items-center justify-between cursor-pointer transition-all"
            >
              <span className="flex items-center gap-2.5">
                <UserPlus size={18} />
                Buat Akun Baru (Sign Up)
              </span>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={onGoSignIn}
              className="w-full bg-[#FDF3E7] hover:bg-[#F6E4CE] active:scale-95 text-[#4A3525] font-bold text-sm py-3.5 px-6 rounded-2xl shadow-sm border-2 border-[#4A3525] flex items-center justify-between cursor-pointer transition-all"
            >
              <span className="flex items-center gap-2.5">
                <LogIn size={18} />
                Sudah Punya Akun (Sign In)
              </span>
              <span>→</span>
            </button>
          </div>

          <p className="mt-6 text-[11px] text-[#4A3525]/65 leading-relaxed">
            💡 <strong>Tips Privasi:</strong> Hanya identitas login dasar yang
            diverifikasi. Seluruh percakapan konselingmu tetap tidak disimpan di
            database mana pun.
          </p>
        </div>
      </div>
    </div>
  );
}
