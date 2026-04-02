import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Loader2, ChevronDown } from "lucide-react";
import { askAIAssistant } from "../lib/openaiClient";

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

interface AIAssistantProps {
  context?: string;
  defaultOpen?: boolean;
}

export function AIAssistant({ context = "", defaultOpen = false }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm your AccessLearn AI. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");

    // Add user message to state
    const updatedMessages: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Build history from all messages EXCEPT the initial greeting and the new user message
      // The last entry (new user message) is passed separately as `userMessage`
      const history = updatedMessages
        .slice(1, -1) // skip initial greeting & the message we just added
        .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

      const reply = await askAIAssistant(userMsg, context, history);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong on my end. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); setIsMinimized(false); }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 z-50"
        style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)", boxShadow: "0 10px 25px rgba(124, 58, 237, 0.4)" }}
        title="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 shadow-2xl flex flex-col transition-all overflow-hidden rounded-2xl"
      style={{ width: 340, height: isMinimized ? 60 : 460, background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer shrink-0"
        style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <span className="text-white font-bold text-sm tracking-wide">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="p-1 rounded text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            className="p-1 rounded text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: "#0f172a", scrollbarWidth: "thin" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className="px-4 py-2.5 rounded-2xl text-sm max-w-[88%] whitespace-pre-wrap leading-relaxed"
                  style={{
                    background: msg.role === "user" ? "#7c3aed" : "rgba(255,255,255,0.07)",
                    color: msg.role === "user" ? "white" : "rgba(255,255,255,0.92)",
                    borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                    borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div
                  className="px-4 py-3 rounded-2xl flex items-center gap-2"
                  style={{ background: "rgba(255,255,255,0.07)", borderBottomLeftRadius: 4 }}
                >
                  <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                  <span className="text-xs text-gray-400">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 shrink-0" style={{ backgroundColor: "#0f172a", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me anything..."
                className="w-full pl-4 pr-12 py-3 rounded-xl text-sm outline-none resize-none overflow-hidden"
                style={{
                  background: "#1e293b",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.1)",
                  minHeight: 44,
                  maxHeight: 120
                }}
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 p-1.5 rounded-lg transition-colors bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-1.5 text-center">Powered by AccessLearn AI · Multi-model fallback</p>
          </div>
        </>
      )}
    </div>
  );
}
