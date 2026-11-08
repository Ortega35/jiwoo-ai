let activeAudio = null;
let isStopped = false;

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

export function stopSpeaking() {
  isStopped = true;
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.removeAttribute("src");
      activeAudio = null;
    } catch {
      // Abaikan
    }
  }
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

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
    if ((current + " " + sentence).trim().length <= 170) {
      current = (current + " " + sentence).trim();
    } else {
      if (current) chunks.push(current);
      if (sentence.length <= 170) {
        current = sentence;
      } else {
        const words = sentence.split(/\s+/);
        let temp = "";
        for (const w of words) {
          if ((temp + " " + w).trim().length <= 170) {
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

export function speakText(text, onStart, onEnd) {
  stopSpeaking();
  isStopped = false;

  const chunks = splitTextIntoChunks(text);
  if (chunks.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  const playChunk = (index, useBackupServer = false) => {
    if (isStopped || index >= chunks.length) {
      if (onEnd) onEnd();
      return;
    }

    const encoded = encodeURIComponent(chunks[index]);

    // Server 1: Google Translate TTS (No-Referer), Server 2: Clients5 Google Dictionary TTS
    const url = useBackupServer
      ? "https://clients5.google.com/translate_tts?ie=UTF-8&client=dict-chrome-ex&tl=id&q=" +
        encoded
      : "https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=id&q=" +
        encoded;

    const audio = document.createElement("audio");
    // Penting: Mencegah blokir 403 Forbidden dari Google di browser Laptop
    audio.referrerPolicy = "no-referrer";
    audio.src = url;
    audio.playbackRate = 1.05;
    activeAudio = audio;

    if (index === 0 && !useBackupServer && onStart) {
      onStart();
    }

    audio.onended = () => {
      if (!isStopped) {
        playChunk(index + 1, false);
      }
    };

    audio.onerror = () => {
      if (!useBackupServer) {
        // Coba server kedua Google jika server pertama diblokir ekstensi browser
        playChunk(index, true);
      } else {
        fallbackWebSpeech(text, onStart, onEnd);
      }
    };

    audio.play().catch(() => {
      if (!useBackupServer) {
        playChunk(index, true);
      } else {
        fallbackWebSpeech(text, onStart, onEnd);
      }
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

    const voices = window.speechSynthesis.getVoices() || [];
    const indoVoice =
      voices.find(
        (v) =>
          v.lang.toLowerCase().includes("id") &&
          v.name.toLowerCase().includes("google"),
      ) || voices.find((v) => v.lang.toLowerCase().includes("id"));

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

  playChunk(0, false);
}
