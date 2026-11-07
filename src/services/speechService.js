// 1. Fungsi Speech-to-Text (Mendengarkan suara user melalui mikrofon)
export function startListening(onStart, onResult, onError) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (onError) {
      onError(
        "Browser kamu belum mendukung fitur pengenalan suara. Silakan gunakan Google Chrome atau ketik ceritamu di kolom chat ya!",
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

  recognition.onerror = (event) => {
    let message = "Maaf, suara kurang terdengar jelas. Coba bicara lagi ya!";
    if (event.error === "not-allowed") {
      message =
        "Izin mikrofon ditolak. Aktifkan izin mikrofon di browser kamu terlebih dahulu ya.";
    }
    if (onError) onError(message);
  };

  recognition.start();
}

// 2. Fungsi Text-to-Speech (Membacakan respons & penjelasan Jiwoo)
export function speakText(text, onStart, onEnd) {
  if (!("speechSynthesis" in window)) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";
  utterance.rate = 1.02;
  utterance.pitch = 1.15;

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}
