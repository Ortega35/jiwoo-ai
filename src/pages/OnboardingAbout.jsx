import jiwooMascot from "../assets/jiwoo.svg";

export default function OnboardingAbout({ onNext }) {
  return (
    <div className="relative z-10 flex flex-col items-center justify-between md:justify-center h-full max-w-3xl mx-auto pt-12 pb-7 px-6 gap-6 text-center">
      <div className="flex flex-col items-center animate-pop-1">
        <div className="relative flex flex-col items-center">
          <img
            src={jiwooMascot}
            alt="Jiwoo Mascot"
            draggable={false}
            className="w-66 h-66 md:w-44 md:h-44 object-contain animate-jiwoo"
          />
        </div>
        <h2 className="mt-4 text-base md:text-3xl font-bold text-[#4A3525]">
          Siapa Itu Jiwoo?
        </h2>
      </div>

      <div className="relative w-full max-w-xl bg-[#F4A950]/85 border-2 border-[#4A3525] rounded-3xl p-6 md:p-8 shadow-lg animate-pop-2">
        <span className="absolute -top-4 left-5 text-3xl md:text-4xl font-bold text-[#4A3525] leading-none">
          “
        </span>
        <h3 className="text-xs md:text-lg font-bold text-[#4A3525] mb-2">
          Halo, Saya Jiwoo.
        </h3>
        <p className="text-[11px] md:text-sm text-[#4A3525]/90 leading-relaxed">
          Asisten empati virtual berbasis <strong>CBT</strong> (
          <em>Cognitive Behavioral Therapy</em>) yang siap membantumu meredakan
          stres, membedah pikiran negatif, dan menemukan ketenangan lewat ruang
          curhat yang aman dan tanpa jejak.
        </p>
        <span className="absolute -bottom-6 right-5 text-3xl md:text-4xl font-bold text-[#4A3525] leading-none">
          ”
        </span>
      </div>

      <div className="flex flex-col items-center gap-3 animate-pop-3">
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="hidden md:inline-flex bg-[#F4A950] hover:bg-[#e5983e] text-[#4A3525] font-bold text-xs px-6 py-2.5 rounded-full border-2 border-[#4A3525] shadow cursor-pointer"
          >
            Lihat Fitur Jiwoo →
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4A3525]" />
          <span className="w-2 h-2 rounded-full bg-[#4A3525]/30" />
        </div>
        <span className="text-[10px] font-bold text-[#4A3525]/80">
          Swipe atau Klik Untuk Lanjut
        </span>
      </div>
    </div>
  );
}
