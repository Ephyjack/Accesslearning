const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";

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
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();

    // Google Translate returns an array of chunks: data[0] contains them.
    const translatedText = data[0].map((item: any) => item[0]).join('');
    return translatedText;
  } catch (error: any) {
    console.error("Free Translation Exception", error);
    return `[Translation Failed: ${text}]`;
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

export async function askAIAssistant(userMessage: string, context: string = ""): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "The AI Assistant is currently offline. Please configure your OpenAI API Key.";
  }

  const systemMessage = context
    ? `You are an AI teaching and learning assistant for the AccessLearn platform. You help teachers and students. Use the following context to answer the user's question, but be conversational and helpful. Context:\n${context}`
    : `You are an AI teaching and learning assistant for the AccessLearn platform. You help teachers navigate the dashboard, suggest class ideas, and help students understand concepts or find the right study materials. Keep your answers concise, encouraging, and highly relevant.`;

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
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const data = await res.json();
    if (data.error) {
      console.error("OpenAI Assistant Error:", data.error);
      return `Oops, I ran into an error: ${data.error.message}`;
    }

    return data.choices?.[0]?.message?.content?.trim() || "I'm sorry, I couldn't process that request right now.";
  } catch (error: any) {
    console.error("OpenAI Assistant Exception", error);
    return `Exception while contacting AI: ${error.message}`;
  }
}