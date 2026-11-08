const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
const BASE_V1BETA_URL = "https://generativelanguage.googleapis.com/v1beta/";

let conversationHistory = [];
let detectedWorkingModel = null;

export function resetJiwooMemory() {
  conversationHistory = [];
}

// Fungsi otomatis mencari model Gemini yang aktif di akun API Key kamu
async function findAvailableGeminiModel() {
  if (detectedWorkingModel) return detectedWorkingModel;

  try {
    const res = await fetch(BASE_V1BETA_URL + "models?key=" + GEMINI_API_KEY);
    const data = await res.json();

    if (data?.models && Array.isArray(data.models)) {
      // Cari model yang mendukung generateContent
      const supported = data.models
        .filter(
          (m) =>
            Array.isArray(m.supportedGenerationMethods) &&
            m.supportedGenerationMethods.includes("generateContent") &&
            m.name.includes("gemini"),
        )
        .map((m) => m.name.replace("models/", ""));

      // Prioritaskan model flash yang paling responsif untuk chat
      const preferredOrder = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-latest",
        "gemini-pro",
      ];

      for (const pref of preferredOrder) {
        const match = supported.find((s) => s === pref || s.startsWith(pref));
        if (match) {
          detectedWorkingModel = match;
          return match;
        }
      }

      if (supported.length > 0) {
        detectedWorkingModel = supported[0];
        return supported[0];
      }
    }
  } catch {
    // Abaikan jika gagal fetch list
  }

  return "gemini-2.0-flash";
}

export async function getJiwooResponse(userMessage) {
  if (!GEMINI_API_KEY) {
    return {
      reply:
        "API Key Gemini belum terbaca. Pastikan VITE_GEMINI_API_KEY sudah diisi di .env dan Vercel.",
      distortion: null,
      reframing: null,
      mood: "empathetic",
    };
  }

  const systemPrompt = `Kamu adalah Jiwoo, asisten AI konseling dan teman diskusi yang hangat, cerdas, empatik, dan solutif (seperti Gemini yang menjadi sahabat curhat sekaligus penasihat bijaksana).
Cara kamu merespons pengguna:
- Jika pengguna menyapa (misal: "halo", "hai", "p") atau bertanya hal umum, sambut dengan ramah, santai, dan tanyakan apa yang sedang mereka pikirkan atau rasakan hari ini.
- Jika pengguna menceritakan masalah, keluhan, atau meminta pendapat, dengarkan dengan penuh empati, lalu berikan NASIHAT, SARAN KONKRET, dan solusi langkah demi langkah yang menenangkan serta mudah dipraktikkan.
- Gunakan bahasa Indonesia yang luwes, akrab, dan natural agar enak didengar saat dibacakan dengan suara.

Balas dalam format JSON murni dengan struktur berikut (tanpa markdown backticks):
{
  "reply": "Tulis balasan percakapan, penjelasan, nasihat, dan saranmu di sini.",
  "distortion": "Nama distorsi kognitif CBT jika pengguna sedang mengalami pikiran negatif berlebih (misal: Overthinking / Catastrophizing, Self-Blame, All-or-Nothing Thinking), atau isi null jika ini obrolan/pertanyaan biasa.",
  "reframing": "Satu kalimat kesimpulan nasihat positif (CBT reframing) jika ada distorsi, atau isi null jika obrolan biasa.",
  "mood": "friendly"
}`;

  conversationHistory.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  const recentHistory = conversationHistory.slice(-10);

  const payloadContents = [
    {
      role: "user",
      parts: [
        {
          text:
            "INSTRUKSI PERAN (Patuhi selalu dalam setiap balasan):\n" +
            systemPrompt,
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: '{"reply": "Siap, aku akan merespons secara interaktif, hangat, dan memberikan saran terbaik dalam format JSON.", "distortion": null, "reframing": null, "mood": "friendly"}',
        },
      ],
    },
    ...recentHistory,
  ];

  // 1. Cari model aktif dari ListModels terlebih dahulu
  const primaryModel = await findAvailableGeminiModel();
  const candidateModels = [
    ...new Set([
      primaryModel,
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash-latest",
    ]),
  ];

  let lastErrorDetail = "";

  for (const modelName of candidateModels) {
    try {
      const endpoint =
        BASE_V1BETA_URL +
        "models/" +
        modelName +
        ":generateContent?key=" +
        GEMINI_API_KEY;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: payloadContents,
          generationConfig: {
            temperature: 0.75,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        lastErrorDetail = data?.error?.message || "HTTP " + response.status;
        continue;
      }

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!rawText) continue;

      detectedWorkingModel = modelName;

      const cleanedJson = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanedJson);
      } catch {
        const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {
            parsed = {
              reply: cleanedJson.replace(/[*#`]/g, ""),
              distortion: null,
              reframing: null,
              mood: "friendly",
            };
          }
        } else {
          parsed = {
            reply: cleanedJson.replace(/[*#`]/g, ""),
            distortion: null,
            reframing: null,
            mood: "friendly",
          };
        }
      }

      const finalReply =
        parsed.reply ||
        "Aku di sini mendengarkanmu. Ceritakan saja apa yang sedang kamu rasakan ya!";

      conversationHistory.push({
        role: "model",
        parts: [{ text: finalReply }],
      });

      return {
        reply: finalReply,
        distortion:
          parsed.distortion &&
          parsed.distortion !== "null" &&
          parsed.distortion !== "Tidak ada"
            ? parsed.distortion
            : null,
        reframing:
          parsed.reframing &&
          parsed.reframing !== "null" &&
          parsed.reframing !== "Tidak ada"
            ? parsed.reframing
            : null,
        mood: parsed.mood || "friendly",
      };
    } catch (err) {
      lastErrorDetail = err?.message || "Network error";
    }
  }

  conversationHistory.pop();

  return {
    reply:
      "Koneksi ke Gemini AI gagal (" +
      (lastErrorDetail || "API Key tidak valid") +
      "). Pastikan API Key di Vercel aktif.",
    distortion: null,
    reframing: null,
    mood: "empathetic",
  };
}
