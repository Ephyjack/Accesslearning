// openaiClient.ts — Multi-AI Fallback Chat System
// Uses standard Vite import.meta.env for env var substitution
// (env types are declared in src/vite-env.d.ts)

const OPENAI_API_KEY: string = import.meta.env.VITE_OPENAI_API_KEY ?? "";
const GEMINI_API_KEY: string = import.meta.env.VITE_GEMINI_API_KEY ?? "";
const GROQ_API_KEY: string = import.meta.env.VITE_GROQ_API_KEY ?? "";

// ─── Language map for translation ─────────────────────────────────────────────
const langMap: Record<string, string> = {
  "English": "en", "Spanish": "es", "French": "fr", "Mandarin": "zh-CN",
  "Japanese": "ja", "German": "de", "Portuguese": "pt", "Hindi": "hi",
  "Arabic": "ar", "Korean": "ko", "Russian": "ru"
};

// ─── Translation (Google Translate free API) ───────────────────────────────────
export async function translateTextWithOpenAI(text: string, targetLanguage: string): Promise<string> {
  if (!text) return "";
  const targetCode = langMap[targetLanguage] || "en";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data[0].map((item: any) => item[0]).filter(Boolean).join('');
  } catch (e) {
    console.warn("Translation failed:", e);
    return text; // Return original rather than error string
  }
}

// ─── Chat message type ─────────────────────────────────────────────────────────
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ─── Tier 1: Google Gemini (free key is configured) ───────────────────────────
async function tryGemini(messages: ChatMessage[], maxTokens: number): Promise<string | null> {
  if (!GEMINI_API_KEY) { console.warn("Gemini: no key"); return null; }
  try {
    const systemMsg = messages.find(m => m.role === "system")?.content ?? "";
    const chatMsgs = messages.filter(m => m.role !== "system");

    // Gemini requires alternating user/model turns — merge system into first user turn
    const geminiContents = chatMsgs.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));
    if (systemMsg && geminiContents.length > 0) {
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
    if (!res.ok || data.error) {
      console.error("[Gemini FAILED] Status:", res.status, "Body:", JSON.stringify(data));
      return null;
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) { console.warn("[Gemini] Empty response:", JSON.stringify(data)); return null; }
    return text.trim();
  } catch (e) {
    console.error("[Gemini] Network error:", e);
    return null;
  }
}

// ─── Tier 2: OpenAI GPT-4o-mini ───────────────────────────────────────────────
async function tryOpenAI(messages: ChatMessage[], maxTokens: number): Promise<string | null> {
  if (!OPENAI_API_KEY) { console.warn("OpenAI: no key"); return null; }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: maxTokens, temperature: 0.7 })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      console.error("[OpenAI FAILED] Status:", res.status, "Body:", JSON.stringify(data));
      return null;
    }
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (e) {
    console.error("[OpenAI] Network error:", e);
    return null;
  }
}

// ─── Tier 3: Groq Cloud (fast & free if key provided) ─────────────────────────
async function tryGroq(messages: ChatMessage[], maxTokens: number): Promise<string | null> {
  if (!GROQ_API_KEY) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({ model: "llama3-8b-8192", messages, max_tokens: maxTokens, temperature: 0.7 })
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      console.error("[Groq FAILED] Status:", res.status, "Body:", JSON.stringify(data));
      return null;
    }
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (e) {
    console.error("[Groq] Network error:", e);
    return null;
  }
}

// ─── Tier 4: HuggingFace Inference API (keyless, free) ───────────────────────
async function tryHuggingFace(messages: ChatMessage[]): Promise<string | null> {
  try {
    const systemMsg = messages.find(m => m.role === "system")?.content ?? "";
    const userMsg = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
    const prompt = systemMsg ? `${systemMsg}\n\nUser: ${userMsg}\nAssistant:` : `User: ${userMsg}\nAssistant:`;

    const res = await fetch(
      "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 300, temperature: 0.7, return_full_text: false }
        })
      }
    );
    if (!res.ok) { console.warn("[HuggingFace] Status:", res.status); return null; }
    const data = await res.json();
    // HF returns [{generated_text: "..."}]
    const text = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;
    if (!text?.trim()) return null;
    // Strip the prompt if HF echoes it back
    const cleaned = text.replace(prompt, "").trim();
    return cleaned.length > 0 ? cleaned : null;
  } catch (e) {
    console.warn("[HuggingFace] Network error:", e);
    return null;
  }
}

// ─── Tier 5: Pollinations AI (keyless GET) ─────────────────────────────────────
async function tryPollinations(messages: ChatMessage[]): Promise<string | null> {
  try {
    const systemMsg = messages.find(m => m.role === "system")?.content ?? "";
    const userMsg = [...messages].reverse().find(m => m.role === "user")?.content ?? "";
    const combined = systemMsg ? `${systemMsg}\n\nUser: ${userMsg}` : userMsg;
    const res = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(combined)}?model=openai&seed=42`,
      { method: "GET" }
    );
    if (!res.ok) { console.warn("[Pollinations] Status:", res.status); return null; }
    const txt = (await res.text()).trim();
    // Reject deprecation/warning messages
    if (!txt || txt.toLowerCase().includes("deprecated") || txt.includes("IMPORTANT NOTICE") || txt.includes("pollinations.ai")) {
      console.warn("[Pollinations] Rejected response (deprecation/junk detected)");
      return null;
    }
    return txt;
  } catch (e) {
    console.warn("[Pollinations] Network error:", e);
    return null;
  }
}

// ─── Master fallback orchestrator ─────────────────────────────────────────────
async function executeWithFallback(messages: ChatMessage[], maxTokens = 500): Promise<string> {
  // Try all tiers in sequence
  const result =
    (await tryGemini(messages, maxTokens)) ??
    (await tryOpenAI(messages, maxTokens)) ??
    (await tryGroq(messages, maxTokens)) ??
    (await tryHuggingFace(messages)) ??
    (await tryPollinations(messages));

  if (result) return result;

  // All network tiers failed — use intelligent local fallback
  console.error("[AI] All tiers failed — using local fallback");
  return localFallback(messages);
}

// ─── Local rule-based fallback (always works, zero network) ─────────────────
function localFallback(messages: ChatMessage[]): string {
  const userMsg = [...messages].reverse().find(m => m.role === "user")?.content?.toLowerCase() ?? "";

  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening))/.test(userMsg))
    return "Hello! 👋 I'm your AccessLearn AI assistant. I can help with lesson planning, explaining concepts, studying tips, and navigating the platform. What would you like help with?";

  if (/help/.test(userMsg))
    return "I'm here to help! You can ask me about:\n• Class management tips\n• Explaining a subject or concept\n• Study strategies\n• How to use AccessLearn features\n\nWhat do you need?";

  if (/class|classroom|lesson|teach/.test(userMsg))
    return "Great question about teaching! I'd suggest starting with a clear learning objective, breaking content into short segments, and using the AccessLearn classroom tools like live translation and AI summaries to keep students engaged.";

  if (/student|learn|study/.test(userMsg))
    return "For effective studying: 📚 Break sessions into 25-minute focused blocks (Pomodoro), review material within 24 hours, and use the chat & transcript features in class to revisit key points.";

  if (/translat/.test(userMsg))
    return "AccessLearn supports live translation in 10+ languages during classroom sessions. Select your preferred language from the globe icon in the top menu to see all speech translated in real-time!";

  if (/thank/.test(userMsg))
    return "You're very welcome! 😊 Let me know if there's anything else I can help with.";

  if (/bye|goodbye/.test(userMsg))
    return "Goodbye! Feel free to come back anytime. Happy learning! 🎓";

  return "That's a great question! Unfortunately I'm having difficulty reaching my AI backend at the moment. Please check that your internet connection is active and try again in a few seconds. In the meantime, I'm happy to help with basic platform questions — just ask!";
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function generateLiveSummary(transcripts: string[]): Promise<string> {
  if (transcripts.length === 0) return "Waiting for audio to summarize...";
  return await executeWithFallback([
    { role: "system", content: "You are a classroom assistant. Summarize the lecture in 2-3 concise bullet points for students. Be clear and direct." },
    { role: "user", content: transcripts.join("\n") }
  ], 200);
}

export async function askAIAssistant(
  userMessage: string,
  context = "",
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const systemContent = context
    ? `You are an AI assistant for the AccessLearn education platform. Be helpful, concise, and encouraging. Use classroom context when relevant:\n\n${context}`
    : `You are an AI assistant for AccessLearn. Help teachers manage classes and students understand concepts. Be friendly, concise, and educational.`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemContent },
    ...history.slice(-10), // last 10 turns for context
    { role: "user", content: userMessage }
  ];

  return await executeWithFallback(messages, 500);
}