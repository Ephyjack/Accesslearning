const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

export async function translateTextWithOpenAI(text: string, targetLanguage: string): Promise<string> {
  if (!OPENAI_API_KEY) return text;

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
          {
            role: "system",
            content: `You are a live real-time translator for an educational platform. Translate the following text into ${targetLanguage}. ONLY output the translation, absolutely no surrounding text or quotes.`
          },
          { role: "user", content: text }
        ],
        max_tokens: 150,
        temperature: 0.3
      })
    });

    const data = await res.json();

    if (data.error) {
      console.error("OpenAI API Error:", data.error);
      return `[API Error: ${data.error.message}]`;
    }

    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch (error: any) {
    console.error("OpenAI Translation Exception", error);
    return `[Exception: ${error.message || "Translation Failed"}]`;
  }
}

export async function generateLiveSummary(transcripts: string[]): Promise<string> {
  if (!OPENAI_API_KEY || transcripts.length === 0) {
    return "Waiting for audio to summarize...";
  }

  const conversationBuffer = transcripts.join(" ");

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
          {
            role: "system",
            content: `Summarize the following class lecture transcription in 2-3 concise bullet points. Make it highly readable for students.`
          },
          { role: "user", content: conversationBuffer }
        ],
        max_tokens: 200,
        temperature: 0.5
      })
    });

    const data = await res.json();

    if (data.error) {
      console.error("OpenAI API Error:", data.error);
      return `API Error: ${data.error.message}`;
    }

    return data.choices?.[0]?.message?.content?.trim() || "Waiting for audio to summarize...";
  } catch (error: any) {
    console.error("OpenAI Summary Exception", error);
    return `Exception: ${error.message || "Failed to parse summary"}.`;
  }
}