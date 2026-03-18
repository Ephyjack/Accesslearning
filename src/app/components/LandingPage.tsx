import { useNavigate } from "react-router";
import {
  Globe,
  Mic,
  FileText,
  Users,
  Accessibility,
  Sparkles,
  Play,
  ChevronRight,
  BookOpen,
  Languages,
  BrainCircuit,
  GraduationCap,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const heroImage =
  "https://images.unsplash.com/photo-1771408427146-09be9a1d4535?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBjbGFzc3Jvb20lMjBkaXZlcnNlJTIwc3R1ZGVudHMlMjBsZWFybmluZ3xlbnwxfHx8fDE3NzM0MDc5ODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";
const aiImage =
  "https://images.unsplash.com/photo-1767954561407-7014cb8fb16c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBSSUyMHRlY2hub2xvZ3klMjBlZHVjYXRpb24lMjBmdXR1cmlzdGljfGVufDF8fHx8MTc3MzQwNzk4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

const features = [
  {
    icon: <Languages className="w-6 h-6" />,
    title: "Real-Time AI Translation",
    description:
      "Lectures are instantly translated into 50+ languages so every student understands in their native tongue.",
    color: "#7c3aed",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Live Transcripts",
    description:
      "AI generates accurate, timestamped transcripts with speaker labels — searchable after every session.",
    color: "#2563eb",
  },
  {
    icon: <Accessibility className="w-6 h-6" />,
    title: "Sign Language Interpreter",
    description:
      "An AI avatar provides sign language interpretation in real time for students who are deaf or hard of hearing.",
    color: "#059669",
  },
  {
    icon: <BrainCircuit className="w-6 h-6" />,
    title: "AI Assignment Assistant",
    description:
      "Students get intelligent hints and feedback on assignments without giving away the answers.",
    color: "#dc2626",
  },
  {
    icon: <Mic className="w-6 h-6" />,
    title: "Voice Recognition",
    description:
      "Advanced speech-to-text captures every word spoken in class, even in noisy environments.",
    color: "#d97706",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Global Classrooms",
    description:
      "Connect teachers and students from any country on a single, unified platform with zero language barriers.",
    color: "#0891b2",
  },
];

const stats = [
  { value: "50+", label: "Languages Supported" },
  { value: "10K+", label: "Active Classrooms" },
  { value: "98%", label: "Translation Accuracy" },
  { value: "120+", label: "Countries Reached" },
];

const testimonials = [
  {
    name: "Dr. Amara Osei",
    role: "Professor, University of Ghana",
    avatar: "AO",
    text: "Access Learn let me teach students in Japan and Brazil simultaneously. The AI translation is seamless — my students say it feels like I'm speaking their language.",
    color: "#7c3aed",
  },
  {
    name: "Yuki Tanaka",
    role: "Graduate Student",
    avatar: "YT",
    text: "As a deaf student, I've always struggled with online classes. The sign language interpreter changes everything. I finally feel included.",
    color: "#2563eb",
  },
  {
    name: "Sofia Mendez",
    role: "High School Teacher",
    avatar: "SM",
    text: "I can assign homework, track submissions, and see live engagement metrics — all in one place. It's the classroom of the future.",
    color: "#059669",
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav
        className="sticky top-0 z-50 border-b border-gray-100"
        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)" }}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-xl"
              style={{ fontWeight: 700, color: "#0f172a" }}
            >
              Access<span style={{ color: "#7c3aed" }}>Learn</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Pricing", "About"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 text-sm rounded-lg text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)" }}
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Left content */}
            <div className="flex-1 text-center lg:text-left">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6"
                style={{
                  background: "rgba(124,58,237,0.08)",
                  color: "#7c3aed",
                  border: "1px solid rgba(124,58,237,0.2)",
                }}
              >
                <Sparkles className="w-4 h-4" />
                AI-Powered Global Classroom
              </div>
              <h1
                className="mb-6"
                style={{
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: "#0f172a",
                }}
              >
                Education{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Without Barriers
                </span>
              </h1>
              <p
                className="mb-10 max-w-xl mx-auto lg:mx-0"
                style={{ fontSize: "1.125rem", color: "#475569", lineHeight: 1.7 }}
              >
                Access Learn uses AI to translate lectures in real time, generate
                searchable transcripts, and assist students globally — regardless of
                language or hearing ability.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => navigate("/auth?role=teacher")}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white transition-all hover:opacity-90 hover:shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)",
                    boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
                  }}
                >
                  <BookOpen className="w-5 h-5" />
                  Start Teaching
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate("/auth?role=student")}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 transition-all hover:bg-gray-50"
                  style={{ borderColor: "#1e3a8a", color: "#1e3a8a" }}
                >
                  <Users className="w-5 h-5" />
                  Join a Class
                </button>
              </div>

              {/* Stats row */}
              <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-lg mx-auto lg:mx-0">
                {stats.map((s) => (
                  <div key={s.label} className="text-center lg:text-left">
                    <div
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {s.value}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Hero image with floating cards */}
            <div className="flex-1 relative">
              <div
                className="relative rounded-2xl overflow-hidden shadow-2xl"
                style={{ maxWidth: 560 }}
              >
                <ImageWithFallback
                  src={heroImage}
                  alt="Students learning online"
                  className="w-full h-80 object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 50%, rgba(15,23,42,0.6) 100%)",
                  }}
                />
              </div>

              {/* Floating AI Translation card */}
              <div
                className="absolute -left-6 top-8 rounded-xl p-4 shadow-xl"
                style={{
                  background: "white",
                  border: "1px solid rgba(124,58,237,0.15)",
                  minWidth: 200,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "#7c3aed" }}
                  >
                    <Languages className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-500">AI Translation</span>
                </div>
                <p className="text-xs text-gray-800 mb-1">
                  "The cell divides in two..."
                </p>
                <p className="text-xs" style={{ color: "#7c3aed" }}>
                  "细胞分裂成两个..."
                </p>
                <div
                  className="mt-2 h-1 rounded-full overflow-hidden"
                  style={{ background: "#f1f5f9" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: "85%",
                      background: "linear-gradient(90deg, #1e3a8a, #7c3aed)",
                    }}
                  />
                </div>
              </div>

              {/* Floating Live transcript card */}
              <div
                className="absolute -right-6 bottom-10 rounded-xl p-4 shadow-xl"
                style={{
                  background: "white",
                  border: "1px solid rgba(30,58,138,0.15)",
                  minWidth: 190,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: "#22c55e" }}
                  />
                  <span className="text-xs font-medium text-gray-500">Live Transcript</span>
                </div>
                {["[Teacher] Good morning class...", "[AI] Translating...", "[Student] Can you repeat?"].map(
                  (line, i) => (
                    <p key={i} className="text-xs text-gray-600 py-0.5">
                      {line}
                    </p>
                  )
                )}
              </div>

              {/* Floating accessibility pill */}
              <div
                className="absolute right-4 top-6 rounded-full px-3 py-2 flex items-center gap-2 shadow-lg"
                style={{ background: "#1e3a8a" }}
              >
                <Accessibility className="w-4 h-4 text-white" />
                <span className="text-xs text-white">ASL Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Banner */}
      <section className="py-4" style={{ background: "#0f172a" }}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-4">
          <Play className="w-5 h-5 text-violet-400" />
          <span className="text-sm text-gray-300">
            Watch how Access Learn removes language barriers in real classrooms
          </span>
          <button
            className="px-4 py-1.5 rounded-full text-xs text-white"
            style={{ background: "#7c3aed" }}
          >
            Watch Demo
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span
              className="text-sm px-3 py-1 rounded-full"
              style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}
            >
              Platform Features
            </span>
            <h2
              className="mt-4"
              style={{ fontSize: "2.25rem", fontWeight: 800, color: "#0f172a" }}
            >
              Everything you need to teach globally
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              Powered by cutting-edge AI, Access Learn handles translation, transcription,
              and accessibility — so you can focus on teaching.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                style={{ border: "1px solid #f1f5f9" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${f.color}18`, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="mb-2" style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <span
                className="text-sm px-3 py-1 rounded-full"
                style={{ background: "rgba(30,58,138,0.08)", color: "#1e3a8a" }}
              >
                How It Works
              </span>
              <h2
                className="mt-4 mb-8"
                style={{ fontSize: "2.25rem", fontWeight: 800, color: "#0f172a" }}
              >
                The AI classroom experience
              </h2>
              {[
                {
                  step: "01",
                  title: "Teacher creates a class",
                  desc: "Set up a classroom in seconds — get a shareable class code and invite students from anywhere.",
                },
                {
                  step: "02",
                  title: "Students join in their language",
                  desc: "Students select their preferred language. AI instantly starts translating everything in real time.",
                },
                {
                  step: "03",
                  title: "AI works silently in the background",
                  desc: "Transcripts, translations, and accessibility features activate automatically — no setup required.",
                },
                {
                  step: "04",
                  title: "Review, submit, and collaborate",
                  desc: "Students submit assignments, teachers review analytics, and everyone accesses session recordings.",
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-5 mb-7">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm"
                    style={{
                      background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)",
                      color: "white",
                      fontWeight: 700,
                    }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.title}</div>
                    <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex-1 relative">
              <div className="rounded-2xl overflow-hidden shadow-xl">
                <ImageWithFallback
                  src={aiImage}
                  alt="AI education technology"
                  className="w-full h-96 object-cover"
                />
              </div>
              <div
                className="absolute -bottom-6 -left-6 rounded-xl p-5 shadow-xl"
                style={{ background: "white", border: "1px solid #f1f5f9", maxWidth: 220 }}
              >
                <div className="text-xs text-gray-400 mb-1">Students online now</div>
                <div
                  style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1e3a8a" }}
                >
                  2,841
                </div>
                <div className="flex gap-1 mt-2">
                  {["🇧🇷", "🇯🇵", "🇩🇪", "🇳🇬", "🇮🇳"].map((flag, i) => (
                    <span key={i} className="text-base">
                      {flag}
                    </span>
                  ))}
                  <span className="text-xs text-gray-400 self-center ml-1">+80</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24" style={{ background: "#f8faff" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>
              Loved by educators & students worldwide
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-6 bg-white shadow-sm"
                style={{ border: "1px solid #f1f5f9" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-white"
                    style={{ background: t.color, fontWeight: 700 }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm" style={{ fontWeight: 600, color: "#0f172a" }}>
                      {t.name}
                    </div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">"{t.text}"</p>
                <div className="flex gap-0.5 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-24 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #4c1d95 100%)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 80% 20%, #2563eb 0%, transparent 40%)",
          }}
        />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2
            className="text-white mb-4"
            style={{ fontSize: "2.5rem", fontWeight: 800 }}
          >
            Ready to break language barriers?
          </h2>
          <p className="text-blue-200 mb-10" style={{ fontSize: "1.1rem" }}>
            Join thousands of teachers and students already using Access Learn to
            create truly global classrooms.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/auth?role=teacher")}
              className="px-8 py-4 rounded-xl text-white transition-all hover:opacity-90"
              style={{ background: "#7c3aed", fontWeight: 600 }}
            >
              Start Teaching Free
            </button>
            <button
              onClick={() => navigate("/auth?role=student")}
              className="px-8 py-4 rounded-xl border-2 border-white/30 text-white hover:bg-white/10 transition-all"
              style={{ fontWeight: 600 }}
            >
              Join as Student
            </button>
          </div>
          <p className="mt-6 text-blue-300 text-sm">
            No credit card required · Free for educators · 14-day trial
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12" style={{ background: "#0f172a" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)" }}
              >
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-white" style={{ fontWeight: 700 }}>
                Access<span style={{ color: "#a78bfa" }}>Learn</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2026 AccessLearn. Education Without Barriers.
            </p>
            <div className="flex gap-6">
              {["Privacy", "Terms", "Contact"].map((item) => (
                <a key={item} href="#" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
