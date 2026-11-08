const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
const BASE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

let conversationHistory = [];

export function resetJiwooMemory() {
  conversationHistory = [];
}

export async function getJiwooResponse(userMessage) {
  if (!GEMINI_API_KEY) {
    return {
      reply:
        "API Key Gemini belum terbaca. Pastikan VITE_GEMINI_API_KEY sudah diisi di file .env dan Environment Variables Vercel.",
      distortion: null,
      reframing: null,
      mood: "empathetic",
    };
  }

  const systemPrompt = `Kamu adalah Jiwoo, konselor virtual dan teman curhat berbasis Cognitive Behavioral Therapy (CBT) yang hangat, cerdas, empatik, dan suportif.
Tugas utamamu ketika pengguna bercerita, mengeluh, atau bertanya:
1. Dengarkan dan validasi perasaan mereka dengan tulus seperti sahabat dekat yang bijaksana.
2. Berikan NASIHAT, SARAN KONKRET, dan langkah praktis yang bisa langsung mereka terapkan untuk mengatasi masalah atau overthinking mereka.
3. Gunakan bahasa Indonesia yang santai, mengalir, hangat, dan mudah dipahami.

Balas HANYA dalam format JSON murni dengan struktur persis seperti ini (tanpa markdown backticks):
{
  "reply": "Tulis tanggapan empatik, penjelasan konseling, nasihat mendalam, dan saran praktis untuk pengguna di sini.",
  "distortion": "Nama distorsi kognitif jika terdeteksi (misal: Overgeneralization, Catastrophizing, All-or-Nothing Thinking) atau null jika tidak ada.",
  "reframing": "Satu kalimat kesimpulan nasihat positif / sudut pandang baru (CBT reframing), atau null jika tidak ada.",
  "mood": "friendly"
}`;

  conversationHistory.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  const recentHistory = conversationHistory.slice(-8);

  // Gabungkan instruksi sistem secara aman agar diterima oleh semua versi model Gemini
  const payloadContents = [
    {
      role: "user",
      parts: [
        {
          text:
            "INSTRUKSI SISTEM (Jangan dibahas, cukup patuhi):\n" + systemPrompt,
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: '{"reply": "Siap, aku mengerti dan akan membalas dalam format JSON.", "distortion": null, "reframing": null, "mood": "friendly"}',
        },
      ],
    },
    ...recentHistory,
  ];

  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
  ];

  let lastErrorDetail = "";

  for (const modelName of models) {
    try {
      const endpoint =
        BASE_API_URL + modelName + ":generateContent?key=" + GEMINI_API_KEY;

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
        lastErrorDetail = data?.error?.message || `HTTP ${response.status}`;
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
        // Ekstrak isi JSON jika ada teks tambahan di luar kurung kurawal
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
        "Aku mendengarkanmu. Boleh ceritakan lebih lanjut apa yang kamu rasakan saat ini?";

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

  // Hapus pesan gagal dari history agar tidak menyumbat chat berikutnya
  conversationHistory.pop();

  return {
    reply: `Koneksi ke Gemini AI ditolak (${lastErrorDetail || "API Key tidak valid/terblokir"}). Silakan buat API Key baru di aistudio.google.com lalu perbarui VITE_GEMINI_API_KEY di .env dan Vercel.`,
    distortion: null,
    reframing: null,
    mood: "empathetic",
  };
}
