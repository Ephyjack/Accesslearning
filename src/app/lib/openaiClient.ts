// openaiClient.ts
// Multi-AI Fallback System with conversation history support

const OPENAI_API_KEY = (import.meta as any).env?.VITE_OPENAI_API_KEY || "";
const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
const GROQ_API_KEY = (import.meta as any).env?.VITE_GROQ_API_KEY || "";

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
  "Korean": "ko",
  "Russian": "ru"
};

export async function translateTextWithOpenAI(text: string, targetLanguage: string): Promise<string> {
  if (!text) return "";
  const targetCode = langMap[targetLanguage] || "en";

  try {
    // Google Translate Free unofficial API (No quota limits, completely free)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data[0].map((item: any) => item[0]).filter(Boolean).join('');
  } catch (error: any) {
    console.error("Translation failed:", error);
    return text; // Return original text instead of error string so UI still shows something
  }
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Master fallback handler. Tries AI providers in sequence to guarantee uptime.
 * Tier 1: OpenAI GPT-4o-mini
 * Tier 2: Google Gemini 1.5 Flash (Free Tier)
 * Tier 3: Groq Cloud (Free Tier - Fast)
 * Tier 4: Pollinations AI (Zero Setup, Keyless, GET endpoint avoids CORS)
 */
async function executeWithFallback(
  messages: ChatMessage[],
  maxTokens: number = 500
): Promise<string> {

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
          messages,
          max_tokens: maxTokens,
          temperature: 0.7
        })
      });
      const data = await res.json();
      if (res.ok && !data.error && data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      }
      console.warn("Tier 1 (OpenAI) failed:", res.status, data.error?.message);
    } catch (e) {
      console.warn("Tier 1 (OpenAI) network error:", e);
    }
  }

  // ─── TIER 2: Google Gemini (Free) ────────────────────────────────────────
  if (GEMINI_API_KEY) {
    try {
      // Build Gemini-compatible conversation (system → user turn 1)
      const systemMsg = messages.find(m => m.role === "system")?.content || "";
      const chatMsgs = messages.filter(m => m.role !== "system");
      const geminiContents = chatMsgs.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));
      // Prepend system as first user turn if Gemini doesn't support system role
      if (systemMsg && geminiContents[0]?.role !== "user") {
        geminiContents.unshift({ role: "user", parts: [{ text: systemMsg }] });
      } else if (systemMsg) {
        geminiContents[0].parts[0].text = `${systemMsg}\n\n${geminiContents[0].parts[0].text}`;
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
        })
      });
      const data = await res.json();
      if (res.ok && !data.error && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim();
      }
      console.warn("Tier 2 (Gemini) failed:", res.status, data.error?.message);
    } catch (e) {
      console.warn("Tier 2 (Gemini) network error:", e);
    }
  }

  // ─── TIER 3: Groq Cloud (Free, Fast) ─────────────────────────────────────
  if (GROQ_API_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama3-8b-8192", // Updated from deprecated mixtral
          messages,
          max_tokens: maxTokens,
          temperature: 0.7
        })
      });
      const data = await res.json();
      if (res.ok && !data.error && data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content.trim();
      }
      console.warn("Tier 3 (Groq) failed:", res.status, data.error?.message);
    } catch (e) {
      console.warn("Tier 3 (Groq) network error:", e);
    }
  }

  // ─── TIER 4: Pollinations AI (Keyless GET endpoint — no CORS issues) ──────
  try {
    const systemMsg = messages.find(m => m.role === "system")?.content || "";
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content || "";
    const prompt = systemMsg ? `${systemMsg}\n\nUser: ${lastUserMsg}\nAssistant:` : lastUserMsg;
    const encodedPrompt = encodeURIComponent(prompt);
    const res = await fetch(`https://text.pollinations.ai/${encodedPrompt}`, {
      method: "GET",
      headers: { "Accept": "text/plain" }
    });
    if (res.ok) {
      const text = await res.text();
      if (text?.trim()) return text.trim();
    }
  } catch (e) {
    console.warn("Tier 4 (Pollinations GET) failed:", e);
  }

  // All tiers failed — return a helpful but honest message
  return "I'm having trouble reaching my AI backend right now. Please check your internet connection and try again in a moment.";
}

export async function generateLiveSummary(transcripts: string[]): Promise<string> {
  if (transcripts.length === 0) return "Waiting for audio to summarize...";
  const conversationBuffer = transcripts.join("\n");
  const messages: ChatMessage[] = [
    { role: "system", content: "You are a classroom assistant. Summarize the following class lecture transcription in 2-3 concise bullet points. Make it highly readable for students." },
    { role: "user", content: conversationBuffer }
  ];
  return await executeWithFallback(messages, 200);
}

/**
 * askAIAssistant — Supports full conversation history for multi-turn chat.
 * Pass `history` as the previous messages array for context-aware replies.
 */
export async function askAIAssistant(
  userMessage: string,
  context: string = "",
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const systemContent = context
    ? `You are an AI teaching and learning assistant for the AccessLearn platform. Be conversational, encouraging, and helpful. Use the following classroom context if relevant to the question:\n\n${context}`
    : `You are an AI teaching and learning assistant for the AccessLearn platform. You help teachers manage their classes, suggest lesson ideas, and help students understand concepts or find study materials. Be concise, encouraging, and highly relevant. Never say you can't help with educational topics.`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemContent },
    // Include up to the last 10 turns of history for context
    ...history.slice(-10),
    { role: "user", content: userMessage }
  ];

  return await executeWithFallback(messages, 500);
}