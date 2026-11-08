const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
const BASE_V1BETA_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/";

let conversationHistory = [];

export function resetJiwooMemory() {
  conversationHistory = [];
}

// Penyelamat cerdas jika API Key Google terblokir/expired agar Jiwoo tetap interaktif
function getSmartCounselingFallback(userMessage, apiErrorReason) {
  const lower = userMessage.toLowerCase().trim();

  // Jika user menyapa (halo, hai, p, pagi, malam, dll)
  if (/^(halo+|hai+|hi+|p+|assalamu|selamat|tes|test)\b/.test(lower)) {
    return {
      reply:
        "Halo juga! Senang sekali kamu mampir ke ruang cerita Jiwoo hari ini. Bagaimana perasaanmu saat ini? Apakah ada sesuatu yang sedang mengganjal di pikiranmu, soal kuliah, masa depan, atau hal lain yang ingin kamu diskusikan denganku?",
      distortion: null,
      reframing: null,
      mood: "friendly",
    };
  }

  // Jika user bertanya kabar atau siapa kamu
  if (lower.includes("apa kabar") || lower.includes("siapa kamu")) {
    return {
      reply:
        "Kabarku sangat baik dan siap sepenuhnya mendengarkanmu! Aku Jiwoo, teman diskusi dan konselor virtualmu. Sekarang giliranmu, ceritakan yuk apa yang sedang kamu rasakan atau pikirkan hari ini?",
      distortion: null,
      reframing: null,
      mood: "friendly",
    };
  }

  // Jika user curhat tentang capek, lelah, stres, tugas, kuliah, overthinking
  if (
    lower.includes("capek") ||
    lower.includes("lelah") ||
    lower.includes("stres") ||
    lower.includes("pusing") ||
    lower.includes("tugas") ||
    lower.includes("kuliah") ||
    lower.includes("overthinking") ||
    lower.includes("bingung") ||
    lower.includes("takut") ||
    lower.includes("sedih")
  ) {
    return {
      reply:
        "Aku sangat mengerti perasaanmu, wajar sekali kalau kamu merasa lelah atau terbebani dengan situasi itu. Coba tarik napas dalam-dalam sejenak. Nasihatku untukmu saat ini: jangan mencoba menyelesaikan semua beban sekaligus dalam satu waktu. Pecah masalahmu menjadi bagian kecil yang paling bisa kamu kendalikan hari ini, dan beri waktu tubuh serta pikiranmu untuk beristirahat tanpa rasa bersalah. Bagian mana yang menurutmu paling membuatmu kepikiran sekarang?",
      distortion: "Overwhelming & Catastrophizing",
      reframing:
        "Kamu tidak harus menyelesaikan semuanya hari ini; melangkah satu per satu sudah merupakan kemajuan besar.",
      mood: "empathetic",
    };
  }

  // Respons interaktif umum + info kecil untuk developer jika API key mati
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
1. Jika pengguna menyapa (seperti "halo", "hai", "p") atau mengobrol santai, balas sapaannya dengan sangat ramah, hidup, dan tanyakan kabar atau apa yang ingin mereka ceritakan hari ini.
2. Jika pengguna bercerita masalah atau meminta saran, berikan validasi empati yang tulus, dilanjutkan dengan NASIHAT dan SARAN KONKRET yang solutif.
3. Gunakan bahasa Indonesia yang natural, mengalir, dan nyaman didengar saat dibacakan dengan suara.

Balas HANYA dalam format JSON murni seperti ini:
{
  "reply": "Tulis balasan obrolan, penjelasan konseling, nasihat, dan saranmu di sini.",
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
          text: '{"reply": "Siap, aku akan merespons secara interaktif dan hangat dalam format JSON.", "distortion": null, "reframing": null, "mood": "friendly"}',
        },
      ],
    },
    ...recentHistory,
  ];

  // Hanya gunakan model Gemini generasi terbaru yang aktif
  const activeModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
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

  // Jika API Key di-revoke Google, tetap balas dengan interaktif + tampilkan alasan error pertama
  return getSmartCounselingFallback(userMessage, firstErrorReason);
}
