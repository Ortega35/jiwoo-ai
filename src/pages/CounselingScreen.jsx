import { useState } from "react";
import { Mic, MicOff, Send, Sparkles, RotateCcw } from "lucide-react";
import jiwooMascot from "../assets/jiwoo.svg";
import BottomNavbar from "../components/BottomNavbar";
import { getJiwooResponse } from "../services/geminiService";
import { startListening, speakText } from "../services/speechService";
import { getCurrentUser } from "../services/authService";

export default function CounselingScreen({ setScreen }) {
  const currentUser = getCurrentUser();
  const firstName = (currentUser.name || "Teman").split(" ")[0].toUpperCase();

  const [userText, setUserText] = useState("");
  const [inputText, setInputText] = useState("");
  const [jiwooData, setJiwooData] = useState({
    reply: `Haloo ${firstName}... Bagaimana Kabar mu hari ini? Ceritakan apa pun yang sedang membebani pikiranmu ya.`,
    distortion: null,
    reframing: null,
    mood: "friendly",
  });
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processMessage = async (text) => {
    if (!text.trim()) return;
    setUserText(text);
    setIsLoading(true);
    try {
      const response = await getJiwooResponse(text);
      setJiwooData(response);
      speakText(response.reply);
    } catch {
      setJiwooData({
        reply:
          "Maaf ya, koneksi Jiwoo sedang terganggu. Coba ceritakan lagi ya!",
        distortion: null,
        reframing: null,
        mood: "empathetic",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicClick = () => {
    if (isListening || isLoading) return;
    startListening(
      () => setIsListening(true),
      async (transcript) => {
        setIsListening(false);
        await processMessage(transcript);
      },
      (errMessage) => {
        setIsListening(false);
        if (errMessage) {
          setJiwooData((prev) => ({ ...prev, reply: errMessage }));
        }
      },
    );
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const message = inputText;
    setInputText("");
    await processMessage(message);
  };

  const handleResetSession = () => {
    setUserText("");
    setJiwooData({
      reply: `Sesi telah disegarkan. Aku siap mendengarkan cerita barumu, ${firstName}! 🐾`,
      distortion: null,
      reframing: null,
      mood: "friendly",
    });
  };

  return (
    <div className="relative z-10 flex flex-col justify-between min-h-full w-full max-w-6xl mx-auto pt-4 pb-24 md:pb-8 px-4 sm:px-5 md:p-8 text-center">
      {/* Kontainer Utama: 1 Kolom di HP, 2 Kolom Berdampingan di Laptop */}
      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-center my-auto">
        {/* PANEL KIRI: Transparan di HP, Kartu Krem di Laptop */}
        <div className="md:col-span-5 flex flex-col items-center justify-center bg-transparent md:bg-[#F6E4CE]/70 md:border-2 md:border-[#4A3525]/20 md:rounded-3xl md:p-8 md:h-full">
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF3E7] border border-[#4A3525]/30 text-[11px] font-bold mb-4">
            <Sparkles size={12} className="text-[#F4A950]" />
            Status Jiwoo:{" "}
            {isLoading ? "Sedang Merespons..." : "Siap Mendengarkan"}
          </span>

          <div className="relative flex flex-col items-center my-1">
            <img
              src={jiwooMascot}
              alt="Jiwoo Mascot"
              draggable={false}
              className={`w-52 h-52 sm:w-60 sm:h-60 md:w-60 md:h-60 object-contain transition-transform duration-300 ${
                isListening
                  ? "scale-110 animate-bounce"
                  : isLoading
                    ? "animate-pulse scale-95"
                    : ""
              }`}
            />
          </div>

          <p className="hidden md:block mt-4 text-xs text-[#4A3525]/75 max-w-xs">
            Kamu bisa berbicara langsung menggunakan mikrofon atau mengetikkan
            curhatanmu di panel sebelah kanan.
          </p>

          <button
            type="button"
            onClick={handleResetSession}
            className="hidden md:inline-flex items-center gap-1.5 mt-5 px-4 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#4A3525]/30 text-[11px] font-bold text-[#4A3525] cursor-pointer transition-all"
          >
            <RotateCcw size={12} /> Bersihkan Obrolan
          </button>
        </div>

        {/* PANEL KANAN: Ruang Balon Dialog, Kartu CBT, & Input Chat */}
        <div className="md:col-span-7 flex flex-col justify-between w-full max-w-md md:max-w-none mx-auto gap-3.5">
          <div className="flex flex-col items-center md:items-start w-full gap-2.5">
            {/* Balon Ucapan Jiwoo */}
            <div className="relative w-full bg-white border-2 border-[#4A3525] rounded-2xl md:rounded-3xl py-3.5 px-4 md:p-6 shadow-md animate-pop-1 text-left">
              <span className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-[#F4A950] mb-1">
                Respons Empati Jiwoo
              </span>
              <p className="text-xs sm:text-sm md:text-base font-bold text-[#4A3525] leading-relaxed">
                {isLoading
                  ? "Jiwoo sedang mendengarkan dan berpikir... 🐾"
                  : jiwooData.reply}
              </p>
              <div className="md:hidden absolute -bottom-2.5 left-10 w-4 h-4 bg-white border-b-2 border-r-2 border-[#4A3525] rotate-45" />
            </div>

            {/* Pesan Terakhir User */}
            {userText && (
              <div className="self-end bg-[#EAE0D5] border border-[#4A3525]/30 rounded-2xl px-4 py-2 text-[11px] md:text-xs text-[#4A3525] italic max-w-md text-right">
                “{userText}”
              </div>
            )}

            {/* Kartu Analisis CBT (Jika Terdeteksi Distorsi Kognitif) */}
            {jiwooData.distortion && (
              <div className="w-full bg-[#F4A950]/90 border-2 border-[#4A3525] rounded-2xl p-3.5 text-left shadow-md animate-pop-2">
                <div className="flex items-center gap-1.5 text-[11px] md:text-xs font-bold text-[#4A3525] underline mb-1">
                  <Sparkles size={14} />
                  Distorsi Kognitif: {jiwooData.distortion}
                </div>
                <p className="text-[10.5px] md:text-xs text-[#4A3525] leading-relaxed">
                  <strong>Saran Reframing CBT:</strong> {jiwooData.reframing}
                </p>
              </div>
            )}
          </div>

          {/* Kontrol Input Suara & Teks */}
          <div className="w-full flex flex-col items-center gap-2 bg-transparent md:bg-white/70 md:p-4 md:rounded-3xl md:border md:border-[#4A3525]/20">
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isLoading}
              className={`w-full py-2.5 px-6 rounded-full border-2 border-[#4A3525] font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-white hover:bg-[#FDF3E7] text-[#4A3525] active:scale-95"
              }`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              {isListening
                ? "Mendengarkan Suaramu..."
                : "Click Here To Start Speaking"}
            </button>

            <form onSubmit={handleTextSubmit} className="w-full flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Atau ketik curhatanmu ke Jiwoo di sini..."
                className="flex-1 bg-white border-2 border-[#4A3525]/50 rounded-full px-4 py-2 text-xs md:text-sm text-[#4A3525] placeholder-[#4A3525]/50 focus:outline-none focus:border-[#4A3525]"
              />
              <button
                type="submit"
                disabled={isLoading}
                aria-label="Kirim Pesan"
                className="bg-[#F4A950] hover:bg-[#e5983e] border-2 border-[#4A3525] text-[#4A3525] px-4 py-2 rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Navbar Khusus Mobile: Pasti Lurus di Tengah */}
      <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center items-center px-4 md:hidden pointer-events-none">
        <div className="w-full max-w-xs sm:max-w-sm flex justify-center pointer-events-auto">
          <BottomNavbar
            activeScreen={5}
            setScreen={setScreen}
            onCenterClick={handleMicClick}
          />
        </div>
      </div>
    </div>
  );
}
