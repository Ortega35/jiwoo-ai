let activeAudio = null;
let isStopped = false;

// 1. Fungsi Speech-to-Text (Jika sewaktu-waktu dibutuhkan)
export function startListening(onStart, onResult, onError) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (onError) {
      onError(
        "Browser kamu belum mendukung fitur pengenalan suara. Silakan ketik ceritamu di kolom chat ya!",
      );
    }
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "id-ID";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || "";
    if (onResult) onResult(transcript);
  };

  recognition.onerror = () => {
    if (onError)
      onError("Maaf, suara kurang terdengar jelas. Coba ketik di chat ya!");
  };

  recognition.start();
}

// Fungsi menghentikan suara yang sedang berjalan
export function stopSpeaking() {
  isStopped = true;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// Memecah kalimat panjang menjadi potongan <= 180 karakter agar audio Google lancar
function splitTextIntoChunks(text) {
  const clean = (text || "")
    .replace(/[*#_~`]/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .trim();

  if (!clean) return [];

  const sentences = clean.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length <= 180) {
      current = (current + " " + sentence).trim();
    } else {
      if (current) chunks.push(current);
      if (sentence.length <= 180) {
        current = sentence;
      } else {
        // Jika ada 1 kalimat super panjang tanpa titik, potong per kata
        const words = sentence.split(/\s+/);
        let temp = "";
        for (const w of words) {
          if ((temp + " " + w).trim().length <= 180) {
            temp = (temp + " " + w).trim();
          } else {
            if (temp) chunks.push(temp);
            temp = w;
          }
        }
        current = temp;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// 2. Fungsi Text-to-Speech Suara Wanita Google Bahasa Indonesia (Sama di Laptop & HP)
export function speakText(text, onStart, onEnd) {
  stopSpeaking();
  isStopped = false;

  const chunks = splitTextIntoChunks(text);
  if (chunks.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  // Cek apakah browser punya voice asli "Google Bahasa Indonesia"
  const getGoogleIndonesianVoice = () => {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    return (
      voices.find(
        (v) =>
          v.lang.toLowerCase().includes("id") &&
          v.name.toLowerCase().includes("google"),
      ) ||
      voices.find((v) => v.lang.toLowerCase().includes("id")) ||
      null
    );
  };

  // Gunakan Audio Stream Google TTS (Suara Cewek Google Maps/Translate)
  const playGoogleTTSAudio = (index) => {
    if (isStopped || index >= chunks.length) {
      if (onEnd) onEnd();
      return;
    }

    const chunkText = encodeURIComponent(chunks[index]);
    const audioUrl =
      "https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=id&q=" +
      chunkText;

    const audio = new Audio(audioUrl);
    audio.playbackRate = 1.05; // Kecepatan natural ramah seperti Google Maps
    activeAudio = audio;

    if (index === 0 && onStart) {
      onStart();
    }

    audio.onended = () => {
      if (!isStopped) {
        playGoogleTTSAudio(index + 1);
      }
    };

    audio.onerror = () => {
      // Jika jaringan memblokir stream audio, gunakan Web Speech API dengan suara Google Bahasa Indonesia
      fallbackWebSpeech(text, onStart, onEnd);
    };

    audio.play().catch(() => {
      fallbackWebSpeech(text, onStart, onEnd);
    });
  };

  const fallbackWebSpeech = (fullText, startCb, endCb) => {
    if (!("speechSynthesis" in window)) {
      if (endCb) endCb();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      fullText.replace(/[\u{1F300}-\u{1FAFF}]/gu, ""),
    );
    utterance.lang = "id-ID";
    utterance.rate = 1.04;
    utterance.pitch = 1.05;

    const indoVoice = getGoogleIndonesianVoice();
    if (indoVoice) {
      utterance.voice = indoVoice;
    }

    utterance.onstart = () => {
      if (startCb) startCb();
    };
    utterance.onend = () => {
      if (endCb) endCb();
    };
    utterance.onerror = () => {
      if (endCb) endCb();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Jalankan pemutar suara Google Bahasa Indonesia
  playGoogleTTSAudio(0);
}
