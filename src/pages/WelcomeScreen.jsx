import jiwooMascot from "../assets/jiwoo.svg";

export default function WelcomeScreen({ onNext }) {
  return (
    <div className="relative z-10 flex flex-col md:flex-row items-center justify-center h-full max-w-5xl mx-auto px-6 md:px-12 gap-8 md:gap-16 text-center md:text-left">
      {/* Kolom Kiri (Di Laptop): Judul & Penjelasan */}
      <div className="flex-1 flex flex-col items-center md:items-start order-2 md:order-1">
        <span className="hidden md:inline-block px-3.5 py-1 mb-3 rounded-full bg-[#F4A950]/30 border border-[#4A3525]/30 text-xs font-bold text-[#4A3525]">
          🐾 Teman Cerita Virtual Berbasis CBT
        </span>

        <div className="w-full md:w-auto bg-[#EAE0D5] md:bg-transparent border-y-2 md:border-none border-[#4A3525] py-2.5 px-4 md:p-0 shadow-sm md:shadow-none animate-pop-2">
          <h1 className="text-lg md:text-5xl font-bold text-[#4A3525] tracking-wide leading-tight">
            Hello.. Jiwoo Is Here
          </h1>
        </div>

        <p className="mt-4 text-xs md:text-base text-[#4A3525]/80 max-w-md leading-relaxed animate-pop-2">
          Go ahead and tell us all your problems—we're here to listen. Ruang
          curhat aman tanpa penghakiman yang siap menemanimu kapan saja.
        </p>

        <div className="mt-6 flex flex-col items-center md:items-start gap-2 animate-pop-3">
          <button
            type="button"
            onClick={onNext}
            className="bg-[#F4A950] hover:bg-[#e5983e] active:scale-95 text-[#4A3525] font-bold text-xs md:text-sm py-2.5 px-10 md:py-3.5 md:px-12 rounded-full shadow-md border-2 border-[#4A3525] transition-all cursor-pointer"
          >
            MULAI SEKARANG →
          </button>
          <span className="text-[10px] md:text-xs text-[#4A3525]/60 italic">
            Click Here For Next
          </span>
        </div>
      </div>

      {/* Kolom Kanan (Di Laptop): Maskot Interaktif */}
      <div className="flex-1 flex flex-col items-center justify-center order-1 md:order-2 animate-pop-1">
        <div className="relative flex flex-col items-center">
          <div className="hidden md:block absolute -inset-6 rounded-full bg-[#F4A950]/25 blur-2xl -z-10" />
          <img
            src={jiwooMascot}
            alt="Jiwoo Mascot"
            draggable={false}
            className="w-66 h-66 md:w-72 md:h-72 object-contain animate-jiwoo"
          />
        </div>
      </div>
    </div>
  );
}
