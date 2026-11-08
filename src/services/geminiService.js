const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
const BASE_V1BETA_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/";

let conversationHistory = [];

export function resetJiwooMemory() {
  conversationHistory = [];
}

// Fallback cerdas apabila jaringan terputus sementara
function getSmartCounselingFallback(userMessage, apiErrorReason) {
  const lower = userMessage.toLowerCase().trim();

  // Protokol darurat keselamatan jiwa (Crisis Response)
  if (
    lower.includes("bunuh diri") ||
    lower.includes("mengakhiri hidup") ||
    lower.includes("ingin mati") ||
    lower.includes("nyerah hidup") ||
    lower.includes("melukai diri")
  ) {
    return {
      reply:
        "Tolong jangan lakukan itu ya, itu sama sekali bukan pilihan yang tepat. Hidupmu sangat berharga dan kamu tidak harus memikul rasa sakit atau beban berat ini sendirian. Saat pikiran terasa sangat gelap, rasa sakit itu membuat kita seolah tidak melihat jalan keluar, padahal selalu ada harapan dan bantuan untukmu. Aku sangat peduli padamu—tolong tarik napas pelan-pelan sekarang, hubungi orang terdekat yang kamu percaya, atau telepon layanan konseling darurat gratis SEJIWA di nomor 119 (ekstensi 8). Ceritakan padaku apa yang membuatmu merasa seberat ini, aku di sini mendengarkanmu.",
      distortion: "Hopelessness & Emotional Reasoning",
      reframing:
        "Rasa sakit yang kamu alami saat ini bersifat sementara, tetapi hidupmu sangat berharga dan selalu ada jalan keluar bersama bantuan yang tepat.",
      mood: "empathetic",
    };
  }

  if (/^(halo+|hai+|hi+|p+|assalamu|selamat|tes|test)\b/.test(lower)) {
    return {
      reply:
        "Halo juga! Senang sekali kamu mampir ke ruang cerita Jiwoo hari ini. Bagaimana perasaanmu saat ini? Apakah ada sesuatu yang sedang mengganjal di pikiranmu yang ingin kamu diskusikan denganku?",
      distortion: null,
      reframing: null,
      mood: "friendly",
    };
  }

  const devHint = apiErrorReason ? ` (Info Dev: ${apiErrorReason})` : "";
  return {
    reply:
      "Aku mendengarkan ceritamu dengan seksama. Terkadang saat pikiran sedang penuh, menuliskannya satu per satu seperti ini adalah langkah awal yang sangat baik untuk mengurai beban di kepala. Menurutmu, hal apa yang paling ingin kamu ubah atau harapkan dari situasi ini?" +
      devHint,
    distortion: null,
    reframing: null,
    mood: "empathetic",
  };
}

export async function getJiwooResponse(userMessage) {
  if (!GEMINI_API_KEY) {
    return getSmartCounselingFallback(
      userMessage,
      "VITE_GEMINI_API_KEY kosong",
    );
  }

  const systemPrompt = `Kamu adalah Jiwoo, asisten AI konseling dan teman diskusi yang hangat, cerdas, empatik, dan solutif (layaknya Gemini yang menjadi sahabat curhat sekaligus konselor CBT bijaksana).
Aturan merespons:
1. Jawablah setiap ucapan, pertanyaan, atau keluhan pengguna secara SINKRON, LANGSUNG, dan NYAMBUNG dengan konteks kalimat yang mereka ketikkan.
2. Jika pengguna menyinggung keinginan menyakiti diri sendiri atau bunuh diri, TEGASKAN dengan penuh kasih sayang bahwa itu BUKAN pilihan yang tepat, berikan penguatan emosional bahwa hidup mereka berharga, dan sarankan bantuan profesional (seperti hotline SEJIWA 119 ext 8).
3. Jika pengguna bercerita masalah atau meminta saran, berikan validasi empati yang tulus, dilanjutkan dengan NASIHAT dan SARAN KONKRET yang solutif.
4. Gunakan bahasa Indonesia yang natural, mengalir, dan nyaman didengar saat dibacakan dengan suara.

Balas HANYA dalam format JSON murni seperti ini (tanpa markdown backticks):
{
  "reply": "Tulis balasan obrolan, penjelasan konseling, nasihat, dan saranmu yang menjawab langsung pertanyaan pengguna di sini.",
  "distortion": "Nama distorsi kognitif CBT jika terdeteksi pikiran negatif berlebih, atau isi null jika sapaan/obrolan biasa.",
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
          text: '{"reply": "Siap, aku akan menjawab setiap pesan pengguna secara langsung, relevan, dan empatik dalam format JSON.", "distortion": null, "reframing": null, "mood": "friendly"}',
        },
      ],
    },
    ...recentHistory,
  ];

  // Menggunakan gemini-3.0-flash sesuai instruksi resmi dari server Google AI Studio untuk API Key baru
  const activeModels = [
    "gemini-3.0-flash",
    "gemini-3-flash-preview",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
  ];

  let firstErrorReason = "";

  for (const modelName of activeModels) {
    try {
      const endpoint =
        BASE_V1BETA_URL + modelName + ":generateContent?key=" + GEMINI_API_KEY;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: payloadContents,
          generationConfig: {
            temperature: 0.7,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (!firstErrorReason) {
          firstErrorReason = data?.error?.message || "HTTP " + response.status;
        }
        continue;
      }

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!rawText) continue;

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
        "Aku mendengarkanmu. Ceritakan lebih lanjut apa yang kamu rasakan ya!";

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
      if (!firstErrorReason) {
        firstErrorReason = err?.message || "Network error";
      }
    }
  }

  conversationHistory.pop();

  return getSmartCounselingFallback(userMessage, firstErrorReason);
}
