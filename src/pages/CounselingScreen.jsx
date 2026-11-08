import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, RotateCcw, Volume2, VolumeX } from "lucide-react";
import JiwooInteractiveMascot from "../components/JiwooInteractiveMascot";
import BottomNavbar from "../components/BottomNavbar";
import { getJiwooResponse, resetJiwooMemory } from "../services/geminiService";
import { speakText } from "../services/speechService";
import { getCurrentUser } from "../services/authService";

export default function CounselingScreen({ setScreen }) {
  const currentUser = getCurrentUser();
  const firstName = (currentUser.name || "Teman").split(" ")[0].toUpperCase();

  const initialGreeting = `Hai ${firstName}, selamat datang di Jiwoo! Aplikasi konseling yang dirancang untuk siap mendengarkan semua curahan isi hatimu. Ceritakan apa yang sedang membebani pikiranmu, aku siap memberikan saran dan nasihat terbaik untukmu.`;

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
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
    resetJiwooMemory();
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

  const handleReplayLastMessage = () => {
    triggerJiwooSpeech(lastJiwooMessage.text);
  };

  return (
    <div className="relative z-10 flex flex-col justify-center w-full max-w-6xl mx-auto min-h-dvh pt-3 pb-28 md:py-6 px-3 sm:px-5 md:px-8">
      {/* Grid Utama: Tinggi Kartu Kiri dan Kanan Sejajar di Laptop */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-7 items-stretch md:h-[82vh]">
        {/* PANEL KIRI: Panggung Maskot Interaktif Jiwoo */}
        <div className="md:col-span-5 flex flex-col items-center justify-center bg-[#F6E4CE]/65 md:bg-[#F6E4CE]/80 border-2 border-[#4A3525]/25 rounded-3xl p-3 sm:p-4 md:p-7 text-center h-full">
          <div className="flex items-center justify-between w-full md:justify-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF3E7] border border-[#4A3525]/30 text-[10px] sm:text-[11px] font-bold shadow-xs">
              <Sparkles className="text-[#F4A950] shrink-0" size={12} />
              <span className="truncate">{uiState.statusText}</span>
            </span>

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
                <Volume2 className="animate-bounce" size={11} />
              )}
              <span>{uiState.badgeText}</span>
            </div>

            <JiwooInteractiveMascot
              mode={uiState.mode}
              onClick={handleReplayLastMessage}
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

          <p className="hidden md:block mt-3 text-xs text-[#4A3525]/75 max-w-xs leading-relaxed">
            Ketikkan curhatan atau pertanyaanmu di ruang chat sebelah kanan.
            Jiwoo akan membalas dengan tulisan sekaligus berbicara langsung.
          </p>

          <div className="hidden md:flex items-center gap-2.5 mt-5">
            <button
              type="button"
              onClick={handleResetSession}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-[#FDF3E7] border border-[#4A3525]/40 text-[11px] font-bold text-[#4A3525] cursor-pointer transition-all shadow-2xs"
            >
              <RotateCcw size={12} /> Bersihkan Obrolan
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-[#FDF3E7] border border-[#4A3525]/40 text-[11px] font-bold text-[#4A3525] cursor-pointer transition-all shadow-2xs"
            >
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              {isMuted ? "Suara Mati" : "Suara Aktif"}
            </button>
          </div>
        </div>

        {/* PANEL KANAN: Ruang Chat Konseling Interaktif */}
        <div className="md:col-span-7 flex flex-col justify-between bg-[#FDF3E7]/85 backdrop-blur-xs border-2 border-[#4A3525] rounded-3xl p-3.5 sm:p-5 md:p-6 shadow-xl h-[54dvh] sm:h-[58dvh] md:h-full overflow-hidden">
          {/* Daftar Riwayat Obrolan (Scrollable) */}
          <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-6 py-2">
            {messages.map((msg) =>
              msg.sender === "jiwoo" ? (
                <div key={msg.id} className="w-full space-y-3 animate-pop-1">
                  {/* BALON BICARA VEKTOR KOMIK (SUDUT MEMBULAT SEMPURNA) */}
                  <div className="relative w-[95%] mb-6">
                    {/* Layer Bayangan Hitam 3D di Belakang */}
                    <div
                      className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-[#1E1B18]"
                      style={{ borderRadius: "34px" }}
                    />

                    {/* Layer Utama Kotak Putih Membulat */}
                    <div
                      className="relative bg-white border-[3.5px] border-[#1E1B18] px-5 py-4 sm:px-7 sm:py-5 text-left"
                      style={{ borderRadius: "34px" }}
                    >
                      {/* Garis Lengkung Kilau Komik di Pojok Kanan Atas */}
                      <svg
                        className="absolute top-3 right-4 w-10 h-10 sm:w-12 sm:h-12 pointer-events-none"
                        viewBox="0 0 60 60"
                        fill="none"
                      >
                        <path
                          d="M 10 8 C 34 8, 48 22, 48 46"
                          stroke="#1E1B18"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                      </svg>

                      <div className="flex items-center justify-between pr-8 mb-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F4A950]">
                          Nasihat & Konseling Jiwoo
                        </span>

                        <button
                          type="button"
                          onClick={() => triggerJiwooSpeech(msg.text)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#4A3525]/80 hover:text-[#1E1B18] cursor-pointer"
                        >
                          <Volume2 size={12} /> Putar Suara
                        </button>
                      </div>

                      <p className="text-xs sm:text-sm font-bold text-[#1E1B18] leading-relaxed pr-3 whitespace-pre-line">
                        {msg.text}
                      </p>
                    </div>

                    {/* Ekor Balon Bicara Melengkung Khas Komik */}
                    <svg
                      className="absolute -bottom-6.75 left-10 w-14 h-8 pointer-events-none z-10"
                      viewBox="0 0 70 42"
                      fill="none"
                    >
                      <path
                        d="M 22 4 C 24 20, 32 32, 45 40 C 38 26, 40 12, 46 4 Z"
                        fill="#1E1B18"
                      />
                      <path
                        d="M 10 0 C 13 18, 24 31, 38 38 C 30 24, 30 11, 35 0 Z"
                        fill="#FFFFFF"
                      />
                      <path
                        d="M 10 2 C 13 18, 24 31, 38 38 C 30 24, 30 11, 35 2"
                        stroke="#1E1B18"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Kartu Nasihat / Reframing CBT */}
                  {msg.reframing &&
                    msg.distortion &&
                    msg.distortion !== "Mode Offline" && (
                      <div className="w-[95%] bg-[#F4A950]/90 border-2 border-[#4A3525] rounded-2xl p-3.5 text-left shadow-sm">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4A3525] underline mb-1">
                          <Sparkles size={13} />
                          Pola Pikir Terdeteksi: {msg.distortion}
                        </div>
                        <p className="text-xs text-[#4A3525] leading-relaxed">
                          <strong>💡 Saran & Nasihat CBT:</strong>{" "}
                          {msg.reframing}
                        </p>
                      </div>
                    )}
                </div>
              ) : (
                /* Balon Chat dari User */
                <div key={msg.id} className="flex justify-end w-full pr-1">
                  <div className="bg-[#4A3525] text-[#FDF3E7] border-2 border-[#1E1B18] rounded-3xl rounded-tr-xs px-4 py-2.5 text-xs sm:text-sm max-w-[82%] text-left shadow-[3px_3px_0px_#1E1B18] leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              ),
            )}

            {isLoading && (
              <div className="w-fit bg-white border-2 border-[#1E1B18] rounded-full px-5 py-2.5 text-xs font-bold text-[#4A3525] shadow-[3px_3px_0px_#1E1B18] animate-pulse">
                Jiwoo sedang merangkai saran & nasihat untukmu... 🐾
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Form Input Chat di Bagian Bawah */}
          <form
            onSubmit={handleTextSubmit}
            className="w-full pt-3 mt-1 border-t-2 border-[#4A3525]/15 flex items-center gap-2 shrink-0"
          >
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? "Aktifkan Suara Jiwoo" : "Matikan Suara Jiwoo"}
              className="md:hidden p-2.5 rounded-full bg-white border-2 border-[#4A3525] text-[#4A3525] shrink-0"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tuliskan curhatan atau minta saran ke Jiwoo..."
              className="flex-1 bg-white border-2 border-[#1E1B18] rounded-full px-5 py-3 text-xs sm:text-sm text-[#1E1B18] placeholder-[#4A3525]/55 focus:outline-none focus:ring-2 focus:ring-[#F4A950] shadow-inner"
            />

            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              aria-label="Kirim Pesan"
              className="bg-[#F4A950] hover:bg-[#e5983e] disabled:opacity-50 border-2 border-[#1E1B18] text-[#1E1B18] p-3 sm:px-5 sm:py-3 rounded-full flex items-center justify-center active:scale-95 transition-all cursor-pointer shrink-0 shadow-[3px_3px_0px_#1E1B18]"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Navbar Khusus Mobile */}
      <BottomNavbar
        activeScreen={5}
        setScreen={setScreen}
        onCenterClick={handleReplayLastMessage}
      />
    </div>
  );
}
