import jiwooMascot from "../assets/jiwoo.svg";
import { Brain, Mic, ShieldAlert } from "lucide-react";

export default function OnboardingFeatures({ onNext }) {
  const features = [
    {
      icon: <Brain size={22} />,
      title: "Pendekatan Psikologi Ilmiah",
      desc: "Menggunakan kerangka CBT untuk mendeteksi distorsi pikiran negatif & memberikan kartu reframing yang rasional.",
    },
    {
      icon: <Mic size={22} />,
      title: "Maskot Interaktif & Suara Dinamis",
      desc: "Karakter kucing virtual hidup dengan respons empati serta Speech-to-Text layaknya teman bicara sungguhan.",
    },
    {
      icon: <ShieldAlert size={22} />,
      title: "Privasi Total & Efisiensi Biaya",
      desc: "Menerapkan sistem Zero-Database (Ephemeral) di mana obrolan langsung terhapus setelah sesi selesai demi kerahasiaanmu.",
    },
  ];

  return (
    <div className="relative z-10 flex flex-col items-center justify-between md:justify-center h-full max-w-5xl mx-auto pt-10 pb-7 px-6 gap-6 text-center">
      <div className="flex flex-col items-center animate-pop-1">
        <div className="relative flex flex-col items-center">
          <img
            src={jiwooMascot}
            alt="Jiwoo Mascot"
            draggable={false}
            className="w-33 h-33 md:w-36 md:h-36 object-contain animate-jiwoo"
          />
        </div>
        <h2 className="mt-3 text-base md:text-3xl font-bold text-[#4A3525]">
          Jiwoo Bisa Apa Sih?
        </h2>
      </div>

      {/* Di HP bertumpuk vertikal, di Laptop berjejer 3 kartu modern */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 animate-pop-2">
        {features.map((item, idx) => (
          <div
            key={idx}
            className="bg-[#F4A950]/85 border-2 border-[#4A3525] rounded-2xl md:rounded-3xl py-3 px-4 md:p-6 shadow-md flex flex-col items-center justify-center gap-2"
          >
            <div className="hidden md:flex w-11 h-11 rounded-2xl bg-[#FDF3E7] border border-[#4A3525] items-center justify-center text-[#4A3525] mb-1">
              {item.icon}
            </div>
            <h3 className="text-[11px] md:text-base font-bold text-[#4A3525] underline">
              {item.title}
            </h3>
            <p className="text-[9.5px] md:text-xs text-[#4A3525]/90 leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3 animate-pop-3">
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="hidden md:inline-flex bg-[#F4A950] hover:bg-[#e5983e] text-[#4A3525] font-bold text-xs px-8 py-2.5 rounded-full border-2 border-[#4A3525] shadow cursor-pointer"
          >
            Lanjut ke Akun →
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4A3525]/30" />
          <span className="w-2 h-2 rounded-full bg-[#4A3525]" />
        </div>
        <span className="text-[10px] font-bold text-[#4A3525]/80">
          Swipe atau Klik Untuk Lanjut
        </span>
      </div>
    </div>
  );
}
