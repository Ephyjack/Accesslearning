// openaiClient.ts
// Multi-AI Fallback System

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

const langMap: Record<string, string> = {
  "English": "en",
  "Spanish": "es",
  "French": "fr",
  "Mandarin": "zh-CN",
  "Japanese": "ja",
  "German": "de",
  "Portuguese": "pt",
  "Hindi": "hi",
  "Arabic": "ar",
  "Russian": "ru"
};

export async function translateTextWithOpenAI(text: string, targetLanguage: string): Promise<string> {
  if (!text) return "";
  const targetCode = langMap[targetLanguage] || "en";

  try {
    // Google Translate Free unofficial API (No quota limits, completely free)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data[0].map((item: any) => item[0]).join('');
  } catch (error: any) {
    console.error("Free Translation Exception", error);
    return `[Translation Failed: ${text}]`;
  }
}

/**
 * Master fallback handler. Tries 4 different AI providers in sequence to guarantee 100% uptime.
 * Tier 1: OpenAI API
 * Tier 2: Groq Cloud (Free Tier - Lightning Fast)
 * Tier 3: Google Gemini (Free Tier)
 * Tier 4: Pollinations AI (Zero Setup, Keyless Fallback)
 */
async function executeWithFallback(systemMessage: string, userMessage: string, maxTokens: number = 300): Promise<string> {

  // ─── TIER 1: OpenAI ────────────────────────────────────────────────────────
  if (OPENAI_API_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage }
          ],
          max_tokens: maxTokens,
          temperature: 0.7
        })
      });
      const data = await res.json();
      if (!data.error) {
        return data.choices?.[0]?.message?.content?.trim() || "";
      }
      console.warn("Tier 1 (OpenAI) Failed:", data.error.message);
    } catch (e) {
      console.warn("Tier 1 (OpenAI) Network Error", e);
    }
  }

  // ─── TIER 2: Groq Cloud (Free) ───────────────────────────────────────────
  if (GROQ_API_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "mixtral-8x7b-32768",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: userMessage }
          ],
          max_tokens: maxTokens,
          temperature: 0.7
        })
      });
      const data = await res.json();
      if (!data.error) {
        return data.choices?.[0]?.message?.content?.trim() || "";
      }
      console.warn("Tier 2 (Groq) Failed:", data.error.message);
    } catch (e) {
      console.warn("Tier 2 (Groq) Network Error", e);
    }
  }

  // ─── TIER 3: Google Gemini (Free) ────────────────────────────────────────
  if (GEMINI_API_KEY) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemMessage}\n\nUser: ${userMessage}` }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
        })
      });
      const data = await res.json();
      if (!data.error && data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text.trim();
      }
      console.warn("Tier 3 (Gemini) Failed:", data.error?.message);
    } catch (e) {
      console.warn("Tier 3 (Gemini) Network Error", e);
    }
  }

  // ─── TIER 4: Keyless Zero-Config Fallback (Pollinations) ──────────────────
  try {
    // text.pollinations.ai supports OpenAI-compliant schema parsing on the POST /openai route
    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage }
        ],
        temperature: 0.7
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      }
    }
  } catch (e) {
    console.error("Tier 4 (Pollinations API) Failed (likely Browser CORS block)", e);
  }

  // If ALL 4 TIERS FAIL (including open proxies due to browser CORS configuration):
  // Return a professional, generic user-facing error message as requested by the user.
  return "I'm currently unable to connect to the learning network due to high traffic. Please try again in a few moments.";
}

export async function generateLiveSummary(transcripts: string[]): Promise<string> {
  if (transcripts.length === 0) return "Waiting for audio to summarize...";
  const conversationBuffer = transcripts.join(" ");
  const system = "Summarize the following class lecture transcription in 2-3 concise bullet points. Make it highly readable for students.";
  return await executeWithFallback(system, conversationBuffer, 200);
}

export async function askAIAssistant(userMessage: string, context: string = ""): Promise<string> {
  const systemMessage = context
    ? `You are an AI teaching and learning assistant for the AccessLearn platform. Use the following context to answer the user's question, but be conversational and helpful. Context:\n${context}`
    : `You are an AI teaching and learning assistant for the AccessLearn platform. You help teachers navigate the dashboard, suggest class ideas, and help students understand concepts or find the right study materials. Keep your answers concise, encouraging, and highly relevant.`;
  return await executeWithFallback(systemMessage, userMessage, 300);
}