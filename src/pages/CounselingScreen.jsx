import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, RotateCcw, Volume2, VolumeX } from "lucide-react";
import JiwooInteractiveMascot from "../components/JiwooInteractiveMascot";
import BottomNavbar from "../components/BottomNavbar";
import { getJiwooResponse } from "../services/geminiService";
import { speakText } from "../services/speechService";
import { getCurrentUser } from "../services/authService";

export default function CounselingScreen({ setScreen }) {
  const currentUser = getCurrentUser();
  const firstName = (currentUser.name || "Teman").split(" ")[0].toUpperCase();

  const initialGreeting = `Hai ${firstName}, selamat datang di Jiwoo! Aplikasi konseling yang dirancang untuk siap mendengarkan semua curahan isi hatimu. Ceritakan apa yang sedang membebani pikiranmu, aku siap memberikan saran dan nasihat terbaik untukmu.`;

  // Riwayat percakapan (seperti chat interaktif)
  const [messages, setMessages] = useState([
    {
      id: "welcome-msg",
      sender: "jiwoo",
      text: initialGreeting,
      distortion: null,
      reframing: null,
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const fallbackTimerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Otomatis scroll ke pesan paling bawah setiap ada chat baru
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Fungsi memutar suara Jiwoo + mengaktifkan animasi menjelaskan
  const triggerJiwooSpeech = (text) => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);

    if (isMuted) {
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);

    const words = (text || "").trim().split(/\s+/).length;
    const estimatedMs = Math.min(Math.max(words * 380, 3200), 18000);
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

  // Menentukan 4 State Animasi Maskot Jiwoo
  const getJiwooInteractiveState = () => {
    if (isUserTyping) {
      return {
        mode: "listening",
        statusText: "Menyimak Curhatanmu... 👂",
        badgeText: "Aku menyimak tulisanmu... 🐾",
        badgeColor: "bg-[#F4A950] text-[#4A3525]",
        ringColor: "border-[#F4A950] bg-[#F4A950]/20",
      };
    }

    if (isLoading) {
      return {
        mode: "thinking",
        statusText: "Merangkai Nasihat & Saran Terbaik... 💭",
        badgeText: "Hmm, merangkai saran... 💭",
        badgeColor: "bg-white text-[#4A3525]",
        ringColor: "border-[#4A3525]/40 bg-[#F6E4CE]/40",
      };
    }

    if (isSpeaking) {
      return {
        mode: "explaining",
        statusText: "Jiwoo Sedang Menjelaskan Nasihat 💬",
        badgeText: "Sedang berbicara & menasihati... 💬",
        badgeColor: "bg-green-600 text-white",
        ringColor: "border-green-500 bg-green-300/25",
      };
    }

    return {
      mode: "greeting",
      statusText:
        messages.length > 1
          ? "Siap Mendengarkan Cerita Lanjutan"
          : "Menyapa & Siap Mendengarkan 👋",
      badgeText:
        messages.length > 1 ? "Ceritakan lagi yuk! 🐾" : `Hai ${firstName}! 👋`,
      badgeColor: "bg-[#FDF3E7] text-[#4A3525]",
      ringColor: "",
    };
  };

  const uiState = getJiwooInteractiveState();

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    // Hentikan suara sebelumnya jika masih berjalan
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    // 1. Tambahkan pesan user ke ruang chat
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      // 2. Minta saran & nasihat konseling dari Gemini
      const response = await getJiwooResponse(trimmed);
      const jiwooMsg = {
        id: `jiwoo-${Date.now()}`,
        sender: "jiwoo",
        text: response.reply,
        distortion: response.distortion,
        reframing: response.reframing,
      };
      setMessages((prev) => [...prev, jiwooMsg]);
      setIsLoading(false);

      // 3. Langsung bacakan jawaban dengan suara (Teks + Suara)
      triggerJiwooSpeech(response.reply);
    } catch {
      const fallbackReply =
        "Maaf ya, koneksi sedang kurang stabil. Tarik napas pelan-pelan, dan coba kirimkan lagi ceritamu ya!";
      setMessages((prev) => [
        ...prev,
        {
          id: `jiwoo-err-${Date.now()}`,
          sender: "jiwoo",
          text: fallbackReply,
          distortion: null,
          reframing: null,
        },
      ]);
      setIsLoading(false);
      triggerJiwooSpeech(fallbackReply);
    }
  };

  const handleResetSession = () => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "jiwoo",
        text: initialGreeting,
        distortion: null,
        reframing: null,
      },
    ]);
    triggerJiwooSpeech(initialGreeting);
  };

  const toggleMute = () => {
    if (!isMuted && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  const lastJiwooMessage =
    [...messages].reverse().find((m) => m.sender === "jiwoo") || messages[0];

  return (
    <div className="relative z-10 flex flex-col w-full max-w-6xl mx-auto min-h-dvh pt-3 pb-28 md:py-6 px-3 sm:px-5 md:px-8">
      <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-7 items-stretch">
        {/* PANEL KIRI / ATAS (HP): Panggung Maskot Interaktif Jiwoo */}
        <div className="md:col-span-5 flex flex-col items-center justify-center bg-[#F6E4CE]/55 md:bg-[#F6E4CE]/75 border-2 border-[#4A3525]/20 rounded-3xl p-3 sm:p-4 md:p-7 text-center shrink-0">
          <div className="flex items-center justify-between w-full md:justify-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF3E7] border border-[#4A3525]/30 text-[10px] sm:text-[11px] font-bold shadow-xs">
              <Sparkles size={12} className="text-[#F4A950] shrink-0" />
              <span className="truncate">{uiState.statusText}</span>
            </span>

            {/* Tombol Reset Cepat di HP */}
            <button
              type="button"
              onClick={handleResetSession}
              className="md:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#4A3525]/30 text-[10px] font-bold text-[#4A3525]"
            >
              <RotateCcw size={11} /> Reset
            </button>
          </div>

          <div className="relative flex flex-col items-center justify-center my-1">
            {(uiState.mode === "listening" ||
              uiState.mode === "explaining") && (
              <div
                className={`absolute w-32 h-32 sm:w-44 sm:h-44 rounded-full border-2 animate-ping opacity-35 pointer-events-none ${uiState.ringColor}`}
              />
            )}

            <div
              className={`mb-1 z-20 px-3 py-0.5 rounded-full border-2 border-[#4A3525] text-[10px] font-bold shadow-sm flex items-center gap-1 ${uiState.badgeColor}`}
            >
              {uiState.mode === "explaining" && (
                <Volume2 size={11} className="animate-bounce" />
              )}
              <span>{uiState.badgeText}</span>
            </div>

            {/* Ukuran maskot lebih ringkas di HP agar ruang chat tidak tenggelam */}
            <JiwooInteractiveMascot
              mode={uiState.mode}
              onClick={() => triggerJiwooSpeech(lastJiwooMessage.text)}
              className="relative z-10 w-36 h-32 sm:w-44 sm:h-40 md:w-60 md:h-56"
            />

            {uiState.mode === "explaining" && (
              <div className="mt-1 flex items-end gap-1 h-3.5">
                <span className="w-1.5 h-2.5 bg-[#F4A950] border border-[#4A3525] rounded-full animate-bounce" />
                <span className="w-1.5 h-3.5 bg-[#4A3525] rounded-full animate-pulse" />
                <span className="w-1.5 h-2 bg-[#F4A950] border border-[#4A3525] rounded-full animate-bounce" />
                <span className="w-1.5 h-3.5 bg-[#4A3525] rounded-full animate-pulse" />
                <span className="w-1.5 h-2.5 bg-[#F4A950] border border-[#4A3525] rounded-full animate-bounce" />
              </div>
            )}
          </div>

          <p className="hidden md:block mt-2 text-xs text-[#4A3525]/75 max-w-xs">
            Ketikkan curhatan atau pertanyaanmu di ruang chat sebelah kanan.
            Jiwoo akan membalas dengan tulisan sekaligus berbicara langsung.
          </p>

          <div className="hidden md:flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={handleResetSession}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/85 hover:bg-white border border-[#4A3525]/30 text-[11px] font-bold text-[#4A3525] cursor-pointer transition-all"
            >
              <RotateCcw size={12} /> Bersihkan Obrolan
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/85 hover:bg-white border border-[#4A3525]/30 text-[11px] font-bold text-[#4A3525] cursor-pointer transition-all"
            >
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              {isMuted ? "Suara Mati" : "Suara Aktif"}
            </button>
          </div>
        </div>

        {/* PANEL KANAN / BAWAH (HP): Ruang Chat Konseling Interaktif */}
        <div className="md:col-span-7 flex flex-col justify-between bg-white/65 backdrop-blur-xs border-2 border-[#4A3525] rounded-3xl p-3 sm:p-4 md:p-5 shadow-lg h-[54dvh] sm:h-[58dvh] md:h-[76vh]">
          {/* Daftar Riwayat Obrolan (Scrollable) */}
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-5 py-2">
            {messages.map((msg) =>
              msg.sender === "jiwoo" ? (
                <div key={msg.id} className="w-full space-y-3 animate-pop-1">
                  {/* Kotak Bicara Komik Jiwoo */}
                  <div className="relative w-[96%] mb-5">
                    <div className="relative bg-white border-[3px] border-[#231F20] rounded-[4xl] px-4 py-3.5 sm:px-6 sm:py-4 shadow-[5px_5px_0px_#231F20] text-left">
                      {/* Garis Lengkung Highlight Komik */}
                      <svg
                        className="absolute top-2.5 right-3.5 w-9 h-9 sm:w-11 sm:h-11 pointer-events-none"
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

                      <div className="flex items-center justify-between pr-7 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F4A950]">
                          Nasihat & Konseling Jiwoo
                        </span>

                        <button
                          type="button"
                          onClick={() => triggerJiwooSpeech(msg.text)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4A3525]/80 hover:text-[#231F20] cursor-pointer"
                        >
                          <Volume2 size={12} /> Putar Suara
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm font-bold text-[#231F20] leading-relaxed pr-2 whitespace-pre-line">
                        {msg.text}
                      </p>
                    </div>

                    {/* Ekor Balon Komik */}
                    <svg
                      className="absolute -bottom-6 left-8 w-12 h-7 pointer-events-none z-10"
                      viewBox="0 0 70 42"
                      fill="none"
                    >
                      <path
                        d="M 22 4 C 24 20, 32 32, 45 40 C 38 26, 40 12, 46 4 Z"
                        fill="#231F20"
                      />
                      <path
                        d="M 10 0 C 13 18, 24 31, 38 38 C 30 24, 30 11, 35 0 Z"
                        fill="#FFFFFF"
                      />
                      <path
                        d="M 10 2 C 13 18, 24 31, 38 38 C 30 24, 30 11, 35 2"
                        stroke="#231F20"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Kartu Nasihat / Reframing CBT (Hanya tampil jika bukan mode error/offline) */}
                  {msg.reframing &&
                    msg.distortion &&
                    msg.distortion !== "Mode Offline" && (
                      <div className="w-[96%] bg-[#F4A950]/90 border-2 border-[#4A3525] rounded-2xl p-3 text-left shadow-sm">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4A3525] underline mb-0.5">
                          <Sparkles size={13} />
                          Pola Pikir Terdeteksi: {msg.distortion}
                        </div>
                        <p className="text-[11px] text-[#4A3525] leading-relaxed">
                          <strong>💡 Saran & Nasihat CBT:</strong>{" "}
                          {msg.reframing}
                        </p>
                      </div>
                    )}
                </div>
              ) : (
                /* Balon Chat dari User */
                <div key={msg.id} className="flex justify-end w-full">
                  <div className="bg-[#4A3525] text-[#FDF3E7] border-2 border-[#231F20] rounded-2xl rounded-tr-xs px-4 py-2.5 text-xs sm:text-sm max-w-[85%] text-left shadow-sm leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              ),
            )}

            {/* Indikator Saat Jiwoo Sedang Mengetik / Merangkai Saran */}
            {isLoading && (
              <div className="w-fit bg-white border-2 border-[#231F20] rounded-2xl px-4 py-2.5 text-xs font-bold text-[#4A3525] shadow-xs animate-pulse">
                Jiwoo sedang merangkai saran & nasihat untukmu... 🐾
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Form Input Chat (Selalu Terlihat & Tidak Tertutup BottomNavbar) */}
          <form
            onSubmit={handleTextSubmit}
            className="w-full pt-2.5 border-t border-[#4A3525]/20 flex items-center gap-2 shrink-0"
          >
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? "Aktifkan Suara Jiwoo" : "Matikan Suara Jiwoo"}
              className="md:hidden p-2.5 rounded-full bg-[#FDF3E7] border-2 border-[#4A3525] text-[#4A3525] shrink-0"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tuliskan curhatan atau minta saran ke Jiwoo..."
              className="flex-1 bg-white border-2 border-[#4A3525] rounded-full px-4 py-2.5 text-xs sm:text-sm text-[#4A3525] placeholder-[#4A3525]/55 focus:outline-none focus:ring-2 focus:ring-[#F4A950]"
            />

            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              aria-label="Kirim Pesan"
              className="bg-[#F4A950] hover:bg-[#e5983e] disabled:opacity-50 border-2 border-[#4A3525] text-[#4A3525] p-2.5 sm:px-5 sm:py-2.5 rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0 shadow-[2px_2px_0px_#4A3525]"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Navbar Khusus Mobile: Klik ikon tengah akan memutar ulang suara Jiwoo */}
      <BottomNavbar
        activeScreen={5}
        setScreen={setScreen}
        onCenterClick={() => triggerJiwooSpeech(lastJiwooMessage.text)}
      />
    </div>
  );
}
