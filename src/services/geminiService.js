const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const BASE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

// Menyimpan riwayat obrolan di memori agar percakapan nyambung terus seperti chat biasa
let conversationHistory = [];

export function resetJiwooMemory() {
  conversationHistory = [];
}

export async function getJiwooResponse(userMessage) {
  if (!GEMINI_API_KEY) {
    return {
      reply:
        "API Key Gemini belum terbaca. Pastikan VITE_GEMINI_API_KEY sudah benar di .env dan Vercel.",
      distortion: null,
      reframing: null,
      mood: "empathetic",
    };
  }

  const systemPrompt = `Kamu adalah Jiwoo, konselor virtual dan teman curhat berbasis Cognitive Behavioral Therapy (CBT) yang hangat, cerdas, empatik, dan suportif.
Tugas utamamu ketika pengguna bercerita, mengeluh, atau bertanya:
1. Dengarkan dan validasi perasaan mereka dengan tulus seperti sahabat dekat yang bijaksana.
2. Berikan NASIHAT, SARAN KONKRET, dan langkah praktis yang bisa langsung mereka terapkan untuk mengatasi masalah atau overthinking mereka.
3. Gunakan bahasa Indonesia yang santai, mengalir, hangat, dan mudah dipahami (jangan kaku seperti robot, dan jangan terlalu pendek—berikan penjelasan yang menenangkan dan solutif).

Kamu WAJIB mengembalikan respons HANYA dalam format JSON murni dengan struktur persis seperti ini:
{
  "reply": "Tulis tanggapan empatik, penjelasan konseling, nasihat mendalam, dan saran praktis untuk pengguna di sini.",
  "distortion": "Nama distorsi kognitif jika terdeteksi (misal: Overgeneralization, Catastrophizing, All-or-Nothing Thinking, Mental Filter) atau isi null jika pengguna hanya bertanya biasa/tidak ada distorsi.",
  "reframing": "Satu kalimat kesimpulan nasihat positif / sudut pandang baru (CBT reframing), atau isi null jika tidak ada distorsi.",
  "mood": "friendly"
}`;

  // Tambahkan pesan terbaru user ke riwayat percakapan
  conversationHistory.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  // Batasi riwayat maksimal 10 pesan terakhir agar tetap cepat & hemat kuota
  const recentHistory = conversationHistory.slice(-10);

  // Daftar model Gemini (otomatis mencoba cadangan jika model pertama sibuk)
  const models = ["gemini-2.5-flash", "gemini-2.0-flash"];

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
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: recentHistory,
          generationConfig: {
            temperature: 0.75,
            responseMimeType: "application/json",
          },
        }),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!rawText) continue;

      // Bersihkan jika Gemini masih membungkus dengan ```json ... ```
      const cleanedJson = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      let parsed;
      try {
        parsed = JSON.parse(cleanedJson);
      } catch {
        parsed = {
          reply: rawText.replace(/[*#`]/g, ""),
          distortion: null,
          reframing: null,
          mood: "empathetic",
        };
      }

      const finalReply =
        parsed.reply ||
        "Aku mendengarkanmu. Boleh ceritakan lebih lanjut apa yang kamu rasakan saat ini?";

      // Simpan balasan Jiwoo ke riwayat agar obrolan berikutnya tetap nyambung
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
    } catch {
      // Lanjut mencoba model cadangan
    }
  }

  return {
    reply:
      "Maaf ya, saat ini koneksi ke server AI sedang sibuk atau API Key perlu diperbarui. Coba kirimkan pesanmu sekali lagi ya!",
    distortion: null,
    reframing: null,
    mood: "empathetic",
  };
}
