const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY || "").trim();
const BASE_V1BETA_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/";

let conversationHistory = [];

export function resetJiwooMemory() {
  conversationHistory = [];
}

function getSmartCounselingFallback(userMessage) {
  const lower = userMessage.toLowerCase().trim();

  if (
    lower.includes("bunuh diri") ||
    lower.includes("mengakhiri hidup") ||
    lower.includes("ingin mati") ||
    lower.includes("melukai diri")
  ) {
    return {
      reply:
        "Tolong jangan lakukan itu ya. Hidupmu sangat berharga, dan kamu enggak harus memikul beban seberat ini sendirian. Saat pikiran lagi kalut, rasanya memang seperti buntu, tapi selalu ada jalan keluar. Tarik napas pelan-pelan sekarang, coba hubungi orang terdekat yang kamu percaya atau layanan konseling SEJIWA di 119 ekstensi 8. Aku di sini temani kamu, ceritakan pelan-pelan apa yang bikin kamu merasa seberat ini.",
      distortion: "Hopelessness (Merasa Tanpa Harapan)",
      reframing:
        "Rasa sakit saat ini bersifat sementara, namun hidupmu sangat berharga dan selalu ada bantuan yang siap mendukungmu.",
      mood: "empathetic",
    };
  }

  return {
    reply:
      "Aku paham maksudmu. Kadang hal seperti itu memang bikin kita banyak pikiran kalau dilihat dari satu sisi saja. Coba ceritakan sedikit lagi bagian mana yang paling bikin kamu ragu atau kepikiran saat ini?",
    distortion: null,
    reframing: null,
    mood: "friendly",
  };
}

export async function getJiwooResponse(userMessage) {
  if (!GEMINI_API_KEY) {
    return getSmartCounselingFallback(userMessage);
  }

  // Prompt bergaya Gemini Live: Lisan, natural, to-the-point, tanpa paksaan format JSON yang membuat bahasa kaku
  const systemPrompt = `Kamu adalah Jiwoo, teman diskusi dan konselor AI yang berbicara persis dengan gaya Gemini Live: sangat natural, hangat, cerdas, objektif, dan langsung ke inti pembicaraan.

CARA BERBICARA (WAJIB DIIKUTI):
1. Gunakan bahasa Indonesia lisan yang mengalir alami untuk diucapkan dengan suara (seperti mengobrol langsung di telepon). Jangan gunakan poin-poin bernomor, jangan gunakan tanda bintang markdown (*), dan jangan terdengar seperti robot atau buku teks.
2. Jawablah secara ringkas, padat, dan bernas (sekitar 2 sampai 4 kalimat saja per balasan) agar nyaman didengarkan, persis seperti gaya bicara Gemini Live.
3. Jika pengguna bertanya pendapat umum (contoh: "Menurutmu kuliah penting enggak?"), berikan sudut pandang yang berimbang, realistis, dan membuka wawasan seperti teman diskusi yang pintar.
4. Jika pengguna sedang curhat, sedih, atau overthinking, validasi perasaannya secara singkat lalu berikan nasihat praktis yang menenangkan.
5. OPSIONAL KHUSUS CURHAT BERAT: Hanya jika pengguna jelas-jelas menunjukkan pola pikir negatif yang ekstrem (overthinking berat/menyalahkan diri sendiri), tambahkan baris baru di paling akhir dengan format:
[CBT: Nama Pola Pikir | Satu kalimat sudut pandang baru yang positif]
Jika pengguna hanya bertanya biasa atau mengobrol santai, JANGAN tulis tag [CBT: ...] sama sekali.`;

  conversationHistory.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  const recentHistory = conversationHistory.slice(-10);

  const payloadContents = [
    {
      role: "user",
      parts: [{ text: "INSTRUKSI GAYA BICARA:\n" + systemPrompt }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Siap, aku akan menjawab setiap obrolan dan pertanyaan dengan gaya bicara lisan yang natural, mengalir, hangat, dan ringkas seperti Gemini Live.",
        },
      ],
    },
    ...recentHistory,
  ];

  const activeModels = [
    "gemini-3.0-flash",
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ];

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
            temperature: 0.8,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) continue;

      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!rawText) continue;

      // Pisahkan teks obrolan natural dengan catatan CBT (jika ada)
      let cleanReply = rawText.replace(/[*#`]/g, "").trim();
      let distortion = null;
      let reframing = null;

      const cbtMatch = cleanReply.match(/\[CBT:\s*([^|]+)\|\s*([^\]]+)\]/i);
      if (cbtMatch) {
        distortion = cbtMatch[1].trim();
        reframing = cbtMatch[2].trim();
        cleanReply = cleanReply.replace(cbtMatch[0], "").trim();
      }

      conversationHistory.push({
        role: "model",
        parts: [{ text: cleanReply }],
      });

      return {
        reply: cleanReply,
        distortion,
        reframing,
        mood: "friendly",
      };
    } catch {
      // Coba model berikutnya
    }
  }

  conversationHistory.pop();
  return getSmartCounselingFallback(userMessage);
}
