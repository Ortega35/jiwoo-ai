import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, Sparkles, RotateCcw, Volume2 } from "lucide-react";
import JiwooInteractiveMascot from "../components/JiwooInteractiveMascot";
import BottomNavbar from "../components/BottomNavbar";
import { getJiwooResponse } from "../services/geminiService";
import { startListening, speakText } from "../services/speechService";
import { getCurrentUser } from "../services/authService";

export default function CounselingScreen({ setScreen }) {
  const currentUser = getCurrentUser();
  const firstName = (currentUser.name || "Teman").split(" ")[0].toUpperCase();

  // 1. Sapaan awal saat user baru masuk dan belum mulai percakapan
  const initialGreeting = `Hai ${firstName}, selamat datang di Jiwoo! Aplikasi konseling yang dirancang untuk siap mendengarkan semua curahan isi hatimu. Ada yang bisa saya bantu?`;

  const [userText, setUserText] = useState("");
  const [inputText, setInputText] = useState("");
  const [jiwooData, setJiwooData] = useState({
    reply: initialGreeting,
    distortion: null,
    reframing: null,
    mood: "friendly",
  });
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  const fallbackTimerRef = useRef(null);

  // Memutar suara sekaligus menggerakkan mulut & tangan menjelaskan
  const triggerJiwooSpeech = (text) => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);

    setIsSpeaking(true);

    // Timer pengaman jika browser mobile tidak memicu event onend
    const words = (text || "").trim().split(/\s+/).length;
    const estimatedMs = Math.min(Math.max(words * 380, 3200), 16000);
    fallbackTimerRef.current = setTimeout(() => {
      setIsSpeaking(false);
    }, estimatedMs);

    speakText(
      text,
      () => setIsSpeaking(true),
      () => {
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        setIsSpeaking(false);
      },
    );
  };

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const isUserTyping = inputText.trim().length > 0 && !isLoading;

  const getJiwooInteractiveState = () => {
    if (isListening || isUserTyping) {
      return {
        mode: "listening",
        statusText: "Menyimak Ceritamu dengan Seksama... 👂",
        badgeText: isListening
          ? "Aku sedang menyimak suaramu... 👂"
          : "Aku menyimak tulisanmu... 🐾",
        badgeColor: "bg-[#F4A950] text-[#4A3525]",
        ringColor: "border-[#F4A950] bg-[#F4A950]/20",
      };
    }

    if (isLoading) {
      return {
        mode: "thinking",
        statusText: "Mencerna Ceritamu & Merangkai Saran... 💭",
        badgeText: "Hmm, sebentar ya... 💭",
        badgeColor: "bg-white text-[#4A3525]",
        ringColor: "border-[#4A3525]/40 bg-[#F6E4CE]/40",
      };
    }

    if (isSpeaking) {
      return {
        mode: "explaining",
        statusText: "Jiwoo Sedang Menjelaskan & Memberi Saran 💬",
        badgeText: "Sedang menjelaskan... 💬",
        badgeColor: "bg-green-600 text-white",
        ringColor: "border-green-500 bg-green-300/25",
      };
    }

    return {
      mode: "greeting",
      statusText: hasStartedChat
        ? "Siap Mendengarkan Cerita Lanjutanmu"
        : "Menyapa & Siap Mendengarkan 👋",
      badgeText: hasStartedChat
        ? "Ceritakan lagi yuk! 🐾"
        : `Hai ${firstName}! 👋`,
      badgeColor: "bg-[#FDF3E7] text-[#4A3525]",
      ringColor: "",
    };
  };

  const uiState = getJiwooInteractiveState();

  const processMessage = async (text) => {
    if (!text.trim()) return;
    setHasStartedChat(true);
    setUserText(text);
    setIsLoading(true);
    setIsSpeaking(false);

    try {
      const response = await getJiwooResponse(text);
      setJiwooData(response);
      setIsLoading(false);
      triggerJiwooSpeech(response.reply);
    } catch {
      const fallbackMsg =
        "Maaf ya, koneksi Jiwoo sedang terganggu. Coba ceritakan lagi ya!";
      setJiwooData({
        reply: fallbackMsg,
        distortion: null,
        reframing: null,
        mood: "empathetic",
      });
      setIsLoading(false);
      triggerJiwooSpeech(fallbackMsg);
    }
  };

  const handleMicClick = () => {
    if (isListening || isLoading) return;
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

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
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setHasStartedChat(false);
    setUserText("");
    setJiwooData({
      reply: initialGreeting,
      distortion: null,
      reframing: null,
      mood: "friendly",
    });
    triggerJiwooSpeech(initialGreeting);
  };

  return (
    <div className="relative z-10 flex flex-col justify-between min-h-full w-full max-w-6xl mx-auto pt-4 pb-24 md:pb-8 px-4 sm:px-5 md:p-8 text-center">
      {/* Kontainer Utama: 1 Kolom di HP, 2 Kolom Berdampingan di Laptop */}
      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-center my-auto">
        {/* PANEL KIRI: Panggung Interaktif Jiwoo */}
        <div className="md:col-span-5 flex flex-col items-center justify-center bg-transparent md:bg-[#F6E4CE]/70 md:border-2 md:border-[#4A3525]/20 md:rounded-3xl md:p-8 md:h-full">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FDF3E7] border border-[#4A3525]/30 text-[11px] font-bold mb-3 shadow-xs">
            <Sparkles size={12} className="text-[#F4A950]" />
            Status Jiwoo: {uiState.statusText}
          </span>

          <div className="relative flex flex-col items-center justify-center my-2">
            {(uiState.mode === "listening" ||
              uiState.mode === "explaining") && (
              <div
                className={`absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full border-2 animate-ping opacity-35 pointer-events-none ${uiState.ringColor}`}
              />
            )}

            <div
              className={`mb-1 z-20 px-3 py-1 rounded-full border-2 border-[#4A3525] text-[10px] font-bold shadow-sm transition-all duration-300 flex items-center gap-1 ${uiState.badgeColor}`}
            >
              {uiState.mode === "explaining" && (
                <Volume2 size={12} className="animate-bounce" />
              )}
              <span>{uiState.badgeText}</span>
            </div>

            <JiwooInteractiveMascot
              mode={uiState.mode}
              onClick={() => triggerJiwooSpeech(jiwooData.reply)}
              className="relative z-10 w-52 h-52 sm:w-60 sm:h-60 md:w-64 md:h-64"
            />

            {uiState.mode === "explaining" && (
              <div className="mt-1 flex items-end gap-1 h-4">
                <span className="w-1.5 h-3 bg-[#F4A950] border border-[#4A3525] rounded-full animate-bounce" />
                <span className="w-1.5 h-4 bg-[#4A3525] rounded-full animate-pulse" />
                <span className="w-1.5 h-2.5 bg-[#F4A950] border border-[#4A3525] rounded-full animate-bounce" />
                <span className="w-1.5 h-4 bg-[#4A3525] rounded-full animate-pulse" />
                <span className="w-1.5 h-3 bg-[#F4A950] border border-[#4A3525] rounded-full animate-bounce" />
              </div>
            )}
          </div>

          <p className="hidden md:block mt-3 text-xs text-[#4A3525]/75 max-w-xs">
            Kamu bisa berbicara langsung menggunakan mikrofon, mengetikkan
            curhatanmu, atau mengklik Jiwoo untuk mendengarkan penjelasannya.
          </p>

          <button
            type="button"
            onClick={handleResetSession}
            className="hidden md:inline-flex items-center gap-1.5 mt-5 px-4 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#4A3525]/30 text-[11px] font-bold text-[#4A3525] cursor-pointer transition-all"
          >
            <RotateCcw size={12} /> Bersihkan Obrolan
          </button>
        </div>

        {/* PANEL KANAN: Ruang Balon Dialog Comic Vector, Kartu CBT, & Input Chat */}
        <div className="md:col-span-7 flex flex-col justify-between w-full max-w-md md:max-w-none mx-auto gap-4">
          <div className="flex flex-col items-center md:items-start w-full gap-3">
            {/* BALON UCAPAN JIWOO MODEL VEKTOR KOMIK BARU */}
            <div className="relative w-full mb-7 animate-pop-1">
              <div className="relative bg-white border-[3.5px] border-[#231F20] rounded-[2.4rem] px-6 py-5 md:px-8 md:py-7 shadow-[7px_7px_0px_#231F20] text-left">
                {/* Garis Lengkung Highlight Khas Komik di Pojok Kanan Atas */}
                <svg
                  className="absolute top-3.5 right-4 w-12 h-12 md:w-14 md:h-14 pointer-events-none"
                  viewBox="0 0 60 60"
                  fill="none"
                >
                  <path
                    d="M 8 10 C 34 10, 48 24, 48 50"
                    stroke="#231F20"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Header Label & Tombol Putar Suara */}
                <div className="flex items-center justify-between pr-8 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F4A950]">
                    {hasStartedChat
                      ? "Penjelasan & Saran Empati Jiwoo"
                      : "Sapaan Hangat Jiwoo"}
                  </span>

                  <button
                    type="button"
                    onClick={() => triggerJiwooSpeech(jiwooData.reply)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4A3525]/75 hover:text-[#231F20] cursor-pointer"
                  >
                    <Volume2 size={13} /> Putar Suara
                  </button>
                </div>

                {/* Isi Kata-Kata Jiwoo */}
                <p className="text-xs sm:text-sm md:text-base font-bold text-[#231F20] leading-relaxed pr-3">
                  {isLoading
                    ? "Jiwoo sedang mendengarkan dan merangkai saran untukmu... 🐾"
                    : jiwooData.reply}
                </p>
              </div>

              {/* Ekor Balon Bicara Melengkung dengan Bayangan 3D Hitam */}
              <svg
                className="absolute -bottom-7.75 left-10 md:left-14 w-16 h-9 pointer-events-none z-10"
                viewBox="0 0 70 42"
                fill="none"
              >
                {/* Bayangan Hitam Tebal di Belakang Ekor */}
                <path
                  d="M 22 4 C 24 20, 32 32, 45 40 C 38 26, 40 12, 46 4 Z"
                  fill="#231F20"
                />
                {/* Bagian Putih Ekor yang Menyatu dengan Kotak */}
                <path
                  d="M 10 0 C 13 18, 24 31, 38 38 C 30 24, 30 11, 35 0 Z"
                  fill="#FFFFFF"
                />
                {/* Garis Tepi Luar Ekor */}
                <path
                  d="M 10 2 C 13 18, 24 31, 38 38 C 30 24, 30 11, 35 2"
                  stroke="#231F20"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Pesan Terakhir User */}
            {userText && (
              <div className="self-end bg-[#EAE0D5] border-2 border-[#4A3525]/40 rounded-2xl px-4 py-2 text-[11px] md:text-xs text-[#4A3525] italic max-w-md text-right">
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
                ? "Jiwoo Sedang Menyimak Suaramu..."
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
      <BottomNavbar
        activeScreen={5}
        setScreen={setScreen}
        onCenterClick={handleMicClick}
      />
    </div>
  );
}
