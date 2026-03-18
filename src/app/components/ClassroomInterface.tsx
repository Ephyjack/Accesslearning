import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import {
  GraduationCap,
  Globe,
  LogOut,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MessageSquare,
  Users,
  FileText,
  ChevronDown,
  Send,
  Upload,
  Hand,
  Maximize2,
  Languages,
  Accessibility,
  Settings,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Paperclip,
  Volume2,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const teacherImage =
  "https://images.unsplash.com/photo-1712904124132-857e6577aab9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFjaGVyJTIwdmlkZW8lMjBjYWxsJTIwdGVhY2hpbmclMjBvbmxpbmV8ZW58MXx8fHwxNzczNDA3OTgxfDA&ixlib=rb-4.1.0&q=80&w=400&utm_source=figma&utm_medium=referral";

const LANGUAGES = [
  "English", "Japanese", "Spanish", "French", "Mandarin", "German",
  "Portuguese", "Arabic", "Korean", "Hindi",
];

const TRANSCRIPT_LINES = [
  { speaker: "Teacher", time: "14:02", text: "Good afternoon everyone. Today we'll be exploring cell division — specifically mitosis." },
  { speaker: "Teacher", time: "14:03", text: "The cell cycle consists of interphase, prophase, metaphase, anaphase, and telophase." },
  { speaker: "AI", time: "14:03", text: "[Translation active — 8 students using Japanese, 4 using Spanish]" },
  { speaker: "Student", time: "14:05", text: "Can you explain what happens during prophase?" },
  { speaker: "Teacher", time: "14:06", text: "Great question! During prophase, the chromatin condenses into visible chromosomes." },
  { speaker: "Teacher", time: "14:07", text: "The nuclear envelope begins to break down, and spindle fibers start forming." },
  { speaker: "AI", time: "14:07", text: "[Transcript saved — 143 words captured]" },
  { speaker: "Student", time: "14:09", text: "Is telophase the reverse of prophase?" },
  { speaker: "Teacher", time: "14:10", text: "Exactly! You can think of it that way. The nuclear envelope reforms around each set of chromosomes." },
];

const TRANSLATED_LINES = [
  { original: "Good afternoon everyone. Today we'll be exploring cell division.", translated: "みなさん、こんにちは。今日は細胞分裂について探っていきます。" },
  { original: "The cell cycle consists of interphase, prophase, metaphase...", translated: "細胞周期は間期、前期、中期、後期、終期で構成されています。" },
  { original: "During prophase, the chromatin condenses into visible chromosomes.", translated: "前期には、クロマチンが染色体として凝縮されます。" },
];

const CHAT_MESSAGES = [
  { user: "Yuki T.", text: "Can you slow down a little?", time: "14:04", self: false },
  { user: "You", text: "Sure! Let me know if anything is unclear.", time: "14:04", self: true },
  { user: "Maria S.", text: "The translation is perfect, gracias!", time: "14:06", self: false },
  { user: "Raj P.", text: "Can we get the transcript after class?", time: "14:08", self: false },
  { user: "You", text: "Absolutely — it will be posted automatically.", time: "14:08", self: true },
];

const STUDENTS_LIST = [
  { name: "Yuki Tanaka", lang: "🇯🇵 JA", status: "active", asl: true },
  { name: "Maria Santos", lang: "🇧🇷 PT", status: "active", asl: false },
  { name: "Raj Patel", lang: "🇮🇳 HI", status: "active", asl: false },
  { name: "Liu Wei", lang: "🇨🇳 ZH", status: "idle", asl: false },
  { name: "Fatima Al-Zahra", lang: "🇸🇦 AR", status: "active", asl: false },
  { name: "Erik Müller", lang: "🇩🇪 DE", status: "active", asl: false },
  { name: "Amina Osei", lang: "🇬🇭 EN", status: "active", asl: true },
  { name: "Lucas Dupont", lang: "🇫🇷 FR", status: "idle", asl: false },
];

const ASSIGNMENTS = [
  { title: "Cell Division Lab Report", due: "Mar 15", submitted: false },
  { title: "Mitosis Diagram", due: "Mar 20", submitted: true },
  { title: "Chapter 12 Quiz", due: "Mar 22", submitted: false },
];

const SLIDES = [
  {
    slide: 1,
    title: "Cell Division – Overview",
    content: "The process by which a parent cell divides into two or more daughter cells.",
    bullets: ["Mitosis (somatic cells)", "Meiosis (gametes)", "Binary fission (prokaryotes)"],
    bg: "#1e3a8a",
  },
  {
    slide: 2,
    title: "Phases of Mitosis",
    content: "Mitosis is divided into four key phases:",
    bullets: ["Prophase — chromatin condenses", "Metaphase — chromosomes align", "Anaphase — chromatids separate", "Telophase — nuclear envelope reforms"],
    bg: "#4c1d95",
  },
  {
    slide: 3,
    title: "Cytokinesis",
    content: "After mitosis, the cytoplasm divides through cytokinesis.",
    bullets: ["Cleavage furrow (animal cells)", "Cell plate (plant cells)", "Results in 2 genetically identical cells"],
    bg: "#065f46",
  },
];

const CLASSROOM_JOIN_REQUESTS = [
  { id: "cr1", name: "Amina Osei", avatar: "AO", time: "Just now" },
  { id: "cr2", name: "Carlos Vega", avatar: "CV", time: "2 min ago" },
  { id: "cr3", name: "Nadia Petrov", avatar: "NP", time: "5 min ago" },
];

export function ClassroomInterface() {
  const navigate = useNavigate();
  const { id } = useParams();

  // For demo: treat viewer as teacher if id starts with "r" (room), else student
  const isTeacher = true;

  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [selectedLang, setSelectedLang] = useState("Japanese");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"chat" | "students" | "assignments" | "requests">("chat");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(CHAT_MESSAGES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [joinRequests, setJoinRequests] = useState(CLASSROOM_JOIN_REQUESTS);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, []);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      { user: "You", text: chatInput, time: "14:12", self: true },
    ]);
    setChatInput("");
  };

  const handleJoinRequest = (id: string, action: "approve" | "deny") => {
    setJoinRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className="h-screen flex flex-col" style={{ background: "#0f172a" }}>
      {/* TOP NAV */}
      <header
        className="h-14 flex items-center justify-between px-5 shrink-0"
        style={{
          background: "#0f172a",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white text-sm" style={{ fontWeight: 700 }}>
              Access<span style={{ color: "#a78bfa" }}>Learn</span>
            </span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div>
            <span className="text-white text-sm" style={{ fontWeight: 600 }}>
              Advanced Biology
            </span>
            <span className="text-xs ml-2 text-gray-400">• Lecture 13</span>
          </div>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
            style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Live — 32 students
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.07)", color: "white" }}
            >
              <Globe className="w-4 h-4 text-violet-400" />
              {selectedLang}
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {showLangDropdown && (
              <div
                className="absolute top-full mt-1 right-0 rounded-xl shadow-xl z-50 overflow-hidden py-1"
                style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)", minWidth: 160 }}
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLang(lang);
                      setShowLangDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/5"
                    style={{ color: lang === selectedLang ? "#a78bfa" : "rgba(255,255,255,0.7)" }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <Settings className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => navigate("/student")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all"
            style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
          >
            <LogOut className="w-4 h-4" />
            Leave
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN — AI Panels */}
        <div
          className="w-64 flex flex-col shrink-0"
          style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* AI Transcript Panel */}
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-400" />
                <span className="text-xs text-white" style={{ fontWeight: 600 }}>
                  AI Transcript
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                <span className="text-xs text-green-400">Live</span>
              </div>
            </div>
            <div
              ref={transcriptRef}
              className="flex-1 overflow-y-auto p-3 space-y-3"
              style={{ scrollbarWidth: "thin" }}
            >
              {TRANSCRIPT_LINES.map((line, i) => (
                <div key={i} className="text-xs">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      style={{
                        fontWeight: 600,
                        color:
                          line.speaker === "Teacher"
                            ? "#60a5fa"
                            : line.speaker === "AI"
                            ? "#a78bfa"
                            : "#4ade80",
                      }}
                    >
                      {line.speaker}
                    </span>
                    <span className="text-gray-600">{line.time}</span>
                  </div>
                  <p
                    className="leading-relaxed"
                    style={{
                      color: line.speaker === "AI" ? "rgba(167,139,250,0.7)" : "rgba(255,255,255,0.65)",
                      fontStyle: line.speaker === "AI" ? "italic" : "normal",
                    }}
                  >
                    {line.text}
                  </p>
                </div>
              ))}
              {/* Live typing cursor */}
              <div className="text-xs">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-blue-400" style={{ fontWeight: 600 }}>Teacher</span>
                  <span className="text-gray-600">14:11</span>
                </div>
                <p className="text-white/65">
                  Now let's talk about cytokinesis
                  <span
                    className="inline-block w-0.5 h-3 ml-0.5 rounded-full animate-pulse"
                    style={{ background: "#60a5fa", verticalAlign: "middle" }}
                  />
                </p>
              </div>
            </div>
          </div>

          {/* Live Translation Panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-white" style={{ fontWeight: 600 }}>
                  Live Translation
                </span>
              </div>
              <span className="text-xs text-blue-300">→ {selectedLang}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 shrink-0">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="text-xs px-2.5 py-1 rounded-full transition-colors"
                style={{
                  background: showOriginal ? "rgba(96,165,250,0.2)" : "rgba(255,255,255,0.05)",
                  color: showOriginal ? "#93c5fd" : "rgba(255,255,255,0.5)",
                }}
              >
                Show Original
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4" style={{ scrollbarWidth: "thin" }}>
              {TRANSLATED_LINES.map((line, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  {showOriginal && (
                    <p
                      className="text-xs mb-2 pb-2"
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        lineHeight: 1.6,
                      }}
                    >
                      {line.original}
                    </p>
                  )}
                  <p
                    className="text-xs"
                    style={{ color: "#c4b5fd", lineHeight: 1.7 }}
                  >
                    {line.translated}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER — Main teaching area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Slides area */}
          <div className="flex-1 relative overflow-hidden">
            {/* Slide */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center p-10"
              style={{
                background: `linear-gradient(135deg, ${slide.bg} 0%, ${slide.bg}cc 100%)`,
              }}
            >
              <div className="text-center max-w-xl">
                <div
                  className="text-xs px-3 py-1 rounded-full mb-4 inline-block"
                  style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }}
                >
                  Slide {currentSlide + 1} of {SLIDES.length}
                </div>
                <h2
                  className="text-white mb-4"
                  style={{ fontSize: "1.75rem", fontWeight: 800 }}
                >
                  {slide.title}
                </h2>
                <p className="text-white/70 mb-6 text-sm">{slide.content}</p>
                <ul className="text-left space-y-2">
                  {slide.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs mt-0.5"
                        style={{ background: "rgba(255,255,255,0.2)", fontWeight: 700 }}
                      >
                        {i + 1}
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Slide nav */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                  disabled={currentSlide === 0}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1.5">
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className="w-2 h-2 rounded-full transition-all"
                      style={{
                        background: i === currentSlide ? "white" : "rgba(255,255,255,0.3)",
                        transform: i === currentSlide ? "scale(1.3)" : "scale(1)",
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setCurrentSlide(Math.min(SLIDES.length - 1, currentSlide + 1))}
                  disabled={currentSlide === SLIDES.length - 1}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.1)", color: "white" }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Top right: maximize */}
              <button className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition-colors">
                <Maximize2 className="w-4 h-4 text-white/60" />
              </button>

              {/* Teacher video bubble */}
              <div
                className="absolute bottom-12 right-4 rounded-xl overflow-hidden shadow-2xl"
                style={{
                  width: 140,
                  height: 100,
                  border: "2px solid rgba(124,58,237,0.5)",
                }}
              >
                {videoOn ? (
                  <ImageWithFallback
                    src={teacherImage}
                    alt="Teacher video"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: "#1e293b" }}
                  >
                    <VideoOff className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <div
                  className="absolute bottom-1.5 left-1.5 text-xs px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
                >
                  Dr. Osei
                </div>
              </div>

              {/* ASL Avatar */}
              <div
                className="absolute top-4 left-4 rounded-xl p-3 flex flex-col items-center gap-2"
                style={{
                  background: "rgba(15,23,42,0.85)",
                  border: "1px solid rgba(167,139,250,0.3)",
                  width: 110,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <Accessibility className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs text-violet-300">ASL Live</span>
                </div>
                {/* Animated ASL avatar placeholder */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #4c1d95, #7c3aed)" }}
                >
                  <span className="text-2xl">🤟</span>
                </div>
                <div
                  className="text-xs px-2 py-0.5 rounded-full text-center"
                  style={{ background: "rgba(167,139,250,0.2)", color: "#c4b5fd" }}
                >
                  AI Avatar
                </div>
              </div>
            </div>
          </div>

          {/* Bottom controls */}
          <div
            className="h-16 flex items-center justify-between px-6 shrink-0"
            style={{
              background: "#0f172a",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMicOn(!micOn)}
                className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl transition-all"
                style={{ background: micOn ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.2)" }}
              >
                {micOn ? (
                  <Mic className="w-5 h-5 text-white" />
                ) : (
                  <MicOff className="w-5 h-5 text-red-400" />
                )}
              </button>
              <button
                onClick={() => setVideoOn(!videoOn)}
                className="flex flex-col items-center gap-0.5 p-2.5 rounded-xl transition-all"
                style={{ background: videoOn ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.2)" }}
              >
                {videoOn ? (
                  <Video className="w-5 h-5 text-white" />
                ) : (
                  <VideoOff className="w-5 h-5 text-red-400" />
                )}
              </button>
              <button
                className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <Monitor className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setHandRaised(!handRaised)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm transition-all"
                style={{
                  background: handRaised ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.07)",
                  color: handRaised ? "#fbbf24" : "white",
                }}
              >
                <Hand className="w-4 h-4" />
                {handRaised ? "Lower Hand" : "Raise Hand"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2.5 rounded-xl hover:bg-white/10 transition-colors">
                <Volume2 className="w-5 h-5 text-gray-400" />
              </button>
              <button className="p-2.5 rounded-xl hover:bg-white/10 transition-colors">
                <SkipBack className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <button
              onClick={() => navigate("/student")}
              className="px-5 py-2 rounded-xl text-sm flex items-center gap-2"
              style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}
            >
              <LogOut className="w-4 h-4" />
              Leave Class
            </button>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div
          className="w-72 flex flex-col shrink-0"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.05)" }}
        >
          {/* Sidebar tabs */}
          <div
            className="flex shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            {([
              { tab: "chat", icon: <MessageSquare className="w-4 h-4" />, label: "Chat" },
              { tab: "students", icon: <Users className="w-4 h-4" />, label: "Students" },
              { tab: "assignments", icon: <FileText className="w-4 h-4" />, label: "Work" },
              ...(isTeacher ? [{ tab: "requests", icon: <ShieldCheck className="w-4 h-4" />, label: "Requests" }] : []),
            ] as const).map(({ tab, icon, label }) => (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab as typeof sidebarTab)}
                className="flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-all relative"
                style={{
                  color: sidebarTab === tab ? "#a78bfa" : "rgba(255,255,255,0.4)",
                  borderBottom: sidebarTab === tab ? "2px solid #7c3aed" : "2px solid transparent",
                  fontWeight: sidebarTab === tab ? 600 : 400,
                }}
              >
                {icon}
                {label}
                {tab === "requests" && joinRequests.length > 0 && (
                  <span
                    className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white animate-pulse"
                    style={{ background: "#ef4444", fontSize: "0.55rem", fontWeight: 700 }}
                  >
                    {joinRequests.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Chat */}
          {sidebarTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "thin" }}>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.self ? "items-end" : "items-start"}`}
                  >
                    {!msg.self && (
                      <span className="text-xs text-gray-500 mb-1">{msg.user}</span>
                    )}
                    <div
                      className="text-xs px-3 py-2 rounded-xl max-w-[85%]"
                      style={{
                        background: msg.self ? "#7c3aed" : "rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.85)",
                        lineHeight: 1.5,
                      }}
                    >
                      {msg.text}
                    </div>
                    <span className="text-xs text-gray-600 mt-0.5">{msg.time}</span>
                  </div>
                ))}
              </div>
              <div
                className="p-3 shrink-0"
                style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message…"
                    className="flex-1 px-3 py-2.5 rounded-xl text-xs outline-none"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    className="p-2.5 rounded-xl transition-colors"
                    style={{ background: "#7c3aed" }}
                  >
                    <Send className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Students */}
          {sidebarTab === "students" && (
            <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin" }}>
              <div className="text-xs text-gray-500 mb-3 px-1">
                {STUDENTS_LIST.length} students online
              </div>
              {STUDENTS_LIST.map((student, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 hover:bg-white/5 transition-colors"
                >
                  <div className="relative">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white"
                      style={{
                        background:
                          student.status === "active"
                            ? "linear-gradient(135deg, #1e3a8a, #7c3aed)"
                            : "#374151",
                        fontWeight: 700,
                      }}
                    >
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-gray-900"
                      style={{
                        background: student.status === "active" ? "#22c55e" : "#6b7280",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white" style={{ fontWeight: 600 }}>
                      {student.name}
                    </div>
                    <div className="text-xs text-gray-500">{student.lang}</div>
                  </div>
                  {student.asl && (
                    <Accessibility className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Assignments */}
          {sidebarTab === "assignments" && (
            <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin" }}>
              <div className="text-xs text-gray-500 mb-3 px-1">Assignments</div>
              {ASSIGNMENTS.map((a, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 mb-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="text-xs text-white mb-1" style={{ fontWeight: 600 }}>
                    {a.title}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">Due {a.due}</div>
                  {a.submitted ? (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "#4ade80" }}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Submitted
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedAssignment(a.title);
                        setShowSubmitModal(true);
                      }}
                      className="w-full py-2 rounded-lg text-xs flex items-center justify-center gap-1.5"
                      style={{ background: "rgba(124,58,237,0.3)", color: "#c4b5fd" }}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Submit Work
                    </button>
                  )}
                </div>
              ))}

              {/* Upload section */}
              <div
                className="rounded-xl p-4 mt-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}
              >
                <div className="text-xs text-gray-400 mb-3">Quick Upload</div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Document
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    Image
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Join Requests (Teacher only) */}
          {sidebarTab === "requests" && isTeacher && (
            <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin" }}>
              <div className="text-xs text-gray-500 mb-3 px-1">
                {joinRequests.length > 0 ? `${joinRequests.length} student${joinRequests.length > 1 ? "s" : ""} waiting` : "No pending requests"}
              </div>
              {joinRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl p-4 mb-3"
                  style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-white"
                      style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)", fontWeight: 700 }}
                    >
                      {req.avatar}
                    </div>
                    <div>
                      <div className="text-sm text-white" style={{ fontWeight: 600 }}>{req.name}</div>
                      <div className="text-xs text-gray-400">{req.time}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleJoinRequest(req.id, "approve")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs"
                      style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleJoinRequest(req.id, "deny")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs"
                      style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Deny
                    </button>
                  </div>
                </div>
              ))}
              {joinRequests.length === 0 && (
                <div className="text-center py-10">
                  <ShieldCheck className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">All caught up!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Submit Assignment Modal */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            className="rounded-2xl p-7 shadow-2xl"
            style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)", width: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white mb-1" style={{ fontWeight: 700 }}>
              Submit Assignment
            </h2>
            <p className="text-sm text-gray-400 mb-6">{selectedAssignment}</p>

            <div
              className="rounded-xl p-6 flex flex-col items-center gap-3 mb-5 cursor-pointer hover:bg-white/5 transition-colors"
              style={{ border: "1px dashed rgba(255,255,255,0.15)" }}
            >
              <Upload className="w-8 h-8 text-gray-500" />
              <span className="text-sm text-gray-400">
                Drop your file here or{" "}
                <span style={{ color: "#a78bfa" }}>browse</span>
              </span>
              <span className="text-xs text-gray-600">PDF, DOC, JPG up to 20 MB</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl text-white text-sm"
                style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}