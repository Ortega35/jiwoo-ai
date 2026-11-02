import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function getJiwooResponse(userMessage) {
  if (!genAI) {
    await new Promise((r) => setTimeout(r, 900));
    return {
      reply: `Meow~ Jiwoo dengar kamu bilang: "${userMessage}". Wajar banget kok merasa seperti itu. Tarik napas pelan-pelan ya, kamu nggak sendirian menghadapi ini 🐾`,
      distortion: "Overthinking / Beban Pikiran",
      reframing: "Satu langkah kecil hari ini sudah cukup. Kamu tidak harus menyelesaikan semuanya sekaligus.",
    };
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
      Kamu adalah "Jiwoo", kucing konselor empati berbasis CBT (Cognitive Behavioral Therapy).
      Analisis curhatan pengguna berikut dan balas dalam format JSON murni dengan struktur:
      {
        "reply": "Balasan empati hangat maksimal 2 kalimat dengan gaya akrab dan emoji kucing 🐾",
        "distortion": "Nama distorsi kognitif singkat jika ada (misal: Overgeneralization, Catastrophizing, atau 'Emosi Wajar' jika normal)",
        "reframing": "1 kalimat saran reframing pikiran yang positif dan rasional"
      }
      Curhatan pengguna: "${userMessage}"
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      reply: "Meow... Koneksi Jiwoo agak terputus, tapi Jiwoo tetap di sini menemanimu kok! Cerita lagi yuk 🐾",
      distortion: "Mode Offline",
      reframing: "Tetap tenang dan beri waktu istirahat untuk pikiranmu.",
    };
  }
}
