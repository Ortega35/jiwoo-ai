const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();

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

// Mengubah data PCM 24kHz dari Gemini TTS menjadi file WAV yang bisa langsung diputar browser
function pcmBase64ToWavUrl(base64Pcm, sampleRate = 24000) {
  const binaryString = window.atob(base64Pcm);
  const pcmLen = binaryString.length;
  const wavBuffer = new ArrayBuffer(44 + pcmLen);
  const view = new DataView(wavBuffer);

  const writeString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + pcmLen, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, "data");
  view.setUint32(40, pcmLen, true);

  const uint8 = new Uint8Array(wavBuffer, 44);
  for (let i = 0; i < pcmLen; i++) {
    uint8[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([wavBuffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

// Meminta suara natural manusia langsung dari Gemini Native Audio TTS (Voice: Aoede)
async function fetchGeminiNaturalVoice(text) {
  if (!GEMINI_API_KEY) return null;

  const ttsModels = [
    "gemini-2.5-flash-preview-tts",
    "gemini-2.5-pro-preview-tts",
  ];

  for (const model of ttsModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text:
                      "Bacakan kalimat bahasa Indonesia ini dengan intonasi suara wanita muda Indonesia yang hangat, ramah, mengalir alami, dan penuh empati:\n\n" +
                      text,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Aoede", // Suara wanita natural khas Gemini Live
                  },
                },
              },
            },
          }),
        },
      );

      if (!response.ok) continue;

      const data = await response.json();
      const inlineData = data?.candidates?.[0]?.content?.parts?.[0]?.inlineData;

      if (inlineData?.data) {
        return pcmBase64ToWavUrl(inlineData.data, 24000);
      }
    } catch {
      // Lanjut ke fallback jika model TTS belum diaktifkan di region tersebut
    }
  }

  return null;
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
      current = sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function speakText(text, onStart, onEnd) {
  stopSpeaking();
  isStopped = false;

  const cleanText = (text || "")
    .replace(/[*#_~`]/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, "")
    .trim();

  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  // 1. Coba gunakan suara manusia natural Gemini Live (Aoede) terlebih dahulu
  const geminiWavUrl = await fetchGeminiNaturalVoice(cleanText);
  if (isStopped) return;

  if (geminiWavUrl) {
    const audio = new Audio(geminiWavUrl);
    activeAudio = audio;

    if (onStart) onStart();

    audio.onended = () => {
      URL.revokeObjectURL(geminiWavUrl);
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(geminiWavUrl);
      playGoogleTranslateFallback(cleanText, onStart, onEnd);
    };

    audio.play().catch(() => {
      playGoogleTranslateFallback(cleanText, onStart, onEnd);
    });
    return;
  }

  // 2. Fallback cepat ke suara Google Bahasa Indonesia jika Gemini TTS sedang sibuk
  playGoogleTranslateFallback(cleanText, onStart, onEnd);
}

function playGoogleTranslateFallback(text, onStart, onEnd) {
  const chunks = splitTextIntoChunks(text);
  if (chunks.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  const playChunk = (index, useBackup = false) => {
    if (isStopped || index >= chunks.length) {
      if (onEnd) onEnd();
      return;
    }

    const encoded = encodeURIComponent(chunks[index]);
    const url = useBackup
      ? "https://clients5.google.com/translate_tts?ie=UTF-8&client=dict-chrome-ex&tl=id&q=" +
        encoded
      : "https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=id&q=" +
        encoded;

    const audio = document.createElement("audio");
    audio.referrerPolicy = "no-referrer";
    audio.src = url;
    audio.playbackRate = 1.05;
    activeAudio = audio;

    if (index === 0 && !useBackup && onStart) {
      onStart();
    }

    audio.onended = () => {
      if (!isStopped) playChunk(index + 1, false);
    };

    audio.onerror = () => {
      if (!useBackup) {
        playChunk(index, true);
      } else if (onEnd) {
        onEnd();
      }
    };

    audio.play().catch(() => {
      if (!useBackup) {
        playChunk(index, true);
      } else if (onEnd) {
        onEnd();
      }
    });
  };

  playChunk(0, false);
}
 