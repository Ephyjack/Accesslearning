import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "./supabaseClient";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  BookOpen,
  Users,
  Eye,
  EyeOff,
  ChevronLeft,
  Globe,
  Sparkles,
} from "lucide-react";

type Mode = "login" | "signup";
type Role = "teacher" | "student";

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === "signup") {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("email", email)
          .maybeSingle();

        if (existingProfile) {
          throw new Error(`This email is already registered as a ${existingProfile.role}. Please log in instead.`);
        }

        // SIGN UP USER
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error("This email is already registered. Please log in instead.");
        }

        // Redirect to onboarding with role + name
        navigate(`/onboarding?role=${role}&name=${encodeURIComponent(name)}`);
      } else {
        // LOGIN USER
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // After login → check profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!profile) {
          navigate(`/onboarding?role=${role}`);
          return;
        }

        if (profile.role !== role) {
          await supabase.auth.signOut();
          throw new Error(`This email is registered as a ${profile.role}. Please select the ${profile.role} role to sign in.`);
        }

        if (profile.role === "teacher") navigate("/teacher");
        else navigate("/student");
      }
    } catch (err: any) {
      console.error(err.message);
      alert(err.message); // temporary error handling
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#f8faff" }}>
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex flex-col w-1/2 relative overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0f172a 0%, #1e3a8a 55%, #4c1d95 100%)",
        }}
      >
        {/* Radial glows */}
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)",
            transform: "translate(-30%, -30%)",
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(37,99,235,0.3) 0%, transparent 70%)",
            transform: "translate(30%, 30%)",
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-auto">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xl" style={{ fontWeight: 700 }}>
              Access<span style={{ color: "#a78bfa" }}>Learn</span>
            </span>
          </div>

          {/* Center content */}
          <div className="my-auto">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-6"
              style={{ background: "rgba(255,255,255,0.1)", color: "#c4b5fd" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Classrooms
            </div>
            <h2
              className="text-white mb-4"
              style={{ fontSize: "2.25rem", fontWeight: 800, lineHeight: 1.2 }}
            >
              Education Without Barriers
            </h2>
            <p className="text-blue-200 mb-10 text-sm leading-relaxed" style={{ maxWidth: 360 }}>
              Translate lectures in real time, generate live transcripts, and reach
              students in every language — all from one platform.
            </p>

            {/* Feature list */}
            {[
              { icon: <Globe className="w-4 h-4" />, text: "50+ languages supported" },
              { icon: <BookOpen className="w-4 h-4" />, text: "Live AI transcripts & translation" },
              { icon: <Users className="w-4 h-4" />, text: "Sign language AI interpreter" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.1)", color: "#a78bfa" }}
                >
                  {item.icon}
                </div>
                <span className="text-blue-200 text-sm">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Bottom stats */}
          <div className="flex gap-8">
            {[
              { val: "10K+", label: "Classrooms" },
              { val: "98%", label: "Accuracy" },
              { val: "120+", label: "Countries" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-white" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                  {s.val}
                </div>
                <div className="text-blue-300 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Back button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to home
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)" }}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg" style={{ fontWeight: 700, color: "#0f172a" }}>
              Access<span style={{ color: "#7c3aed" }}>Learn</span>
            </span>
          </div>

          {/* Mode tabs */}
          <div
            className="flex p-1 rounded-xl mb-8"
            style={{ background: "#f1f5f9" }}
          >
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2.5 rounded-lg text-sm transition-all"
                style={{
                  background: mode === m ? "white" : "transparent",
                  color: mode === m ? "#0f172a" : "#64748b",
                  fontWeight: mode === m ? 600 : 400,
                  boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <h1 className="mb-2" style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {mode === "login"
              ? "Sign in to your Access Learn account"
              : "Join thousands of educators and learners worldwide"}
          </p>

          {/* Role selector */}
          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-3" style={{ fontWeight: 600 }}>
              I am a…
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["teacher", "student"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                  style={{
                    borderColor: role === r ? "#7c3aed" : "#e2e8f0",
                    background: role === r ? "rgba(124,58,237,0.04)" : "white",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        role === r
                          ? "linear-gradient(135deg, #1e3a8a, #7c3aed)"
                          : "#f1f5f9",
                      color: role === r ? "white" : "#94a3b8",
                    }}
                  >
                    {r === "teacher" ? (
                      <BookOpen className="w-5 h-5" />
                    ) : (
                      <Users className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className="text-sm capitalize"
                    style={{
                      fontWeight: 600,
                      color: role === r ? "#7c3aed" : "#64748b",
                    }}
                  >
                    {r}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
                    style={{
                      borderColor: "#e2e8f0",
                      background: "white",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: "#e2e8f0", background: "white" }}
                  onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: "#e2e8f0", background: "white" }}
                  onFocus={(e) => (e.target.style.borderColor = "#7c3aed")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="text-right">
                <a href="#" className="text-sm" style={{ color: "#7c3aed" }}>
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl text-white transition-all hover:opacity-90 mt-2"
              style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)",
                fontWeight: 600,
                fontSize: "0.95rem",
                boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
              }}
            >
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* OAuth */}
          <div className="grid grid-cols-2 gap-3">
            {["Google", "Microsoft"].map((provider) => (
              <button
                key={provider}
                className="py-3 rounded-xl border text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                style={{ borderColor: "#e2e8f0" }}
              >
                {provider}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              style={{ color: "#7c3aed", fontWeight: 600 }}
            >
              {mode === "login" ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}