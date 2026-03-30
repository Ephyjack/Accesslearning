import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { supabase } from "./supabaseClient";
import {
  GraduationCap, Camera, ChevronRight, ChevronLeft,
  BookOpen, Users, MapPin, Building, CheckCircle2,
  Sparkles, Star, MessageSquare, Loader2,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Ethiopia",
  "Japan", "South Korea", "China", "India", "Pakistan",
  "Brazil", "Mexico", "Colombia", "United States", "Canada",
  "United Kingdom", "Germany", "France", "Spain", "Italy",
  "Saudi Arabia", "Egypt", "Indonesia", "Philippines", "Australia",
];

const ALL_SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "English Language", "Literature", "History", "Geography",
  "Computer Science", "Economics", "Business Studies",
  "Visual Arts", "Music", "Physical Education",
  "French", "Spanish", "Arabic", "Yoruba", "Igbo",
  "Accounting", "Government & Politics", "Psychology",
  "Engineering", "Medicine / Health", "Law",
];

const TEACHING_STYLES = [
  { id: "interactive", label: "Interactive", icon: "💬", desc: "Q&A, discussions" },
  { id: "lecture", label: "Lecture-based", icon: "📢", desc: "Structured delivery" },
  { id: "project", label: "Project-based", icon: "🔨", desc: "Hands-on learning" },
  { id: "socratic", label: "Socratic", icon: "🤔", desc: "Question-driven" },
];

const LEARNING_GOALS = [
  { id: "exam", label: "Exam Prep", icon: "📝" },
  { id: "skill", label: "Skill Building", icon: "🎯" },
  { id: "hobby", label: "Personal Interest", icon: "🌟" },
  { id: "career", label: "Career Growth", icon: "📈" },
];

// ─── Gradient style shorthand ─────────────────────────────────────────────────
const grad = "linear-gradient(135deg,#1e3a8a,#7c3aed)";

// ─── Component ────────────────────────────────────────────────────────────────
export function OnboardingFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = (searchParams.get("role") as "teacher" | "student") || "student";
  const name = searchParams.get("name") || "";

  const totalSteps = 4;
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Location
  const [country, setCountry] = useState("");
  const [school, setSchool] = useState("");
  const [bio, setBio] = useState("");

  // Step 2: Subjects
  const [subjects, setSubjects] = useState<string[]>([]);
  const [teachingStyle, setTeachingStyle] = useState("");
  const [learningGoal, setLearningGoal] = useState("");

  // Step 3: Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Validation ───────────────────────────────────────────────────────────────
  const canNext = () => {
    if (step === 1) return country !== "" && school !== "";
    if (step === 2) return subjects.length > 0;
    return true;
  };

  // ── Avatar Handler ────────────────────────────────────────────────────────────
  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;
    setUploading(true);
    const ext = avatarFile.name.split(".").pop();
    const path = `avatars/${userId}.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true });
    setUploading(false);
    if (error) { console.error(error); return null; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  // ── Subjects Toggle ───────────────────────────────────────────────────────────
  const toggleSubject = (s: string) =>
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  // ── Finish ────────────────────────────────────────────────────────────────────
  const finish = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated. Please log in again.");

      const avatarUrl = await uploadAvatar(user.id);

      const profileData: Record<string, any> = {
        id: user.id,
        email: user.email,
        full_name: name,
        role,
        country,
        school,
        bio: bio.trim() || null,
        subjects,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      if (role === "teacher") {
        profileData.teaching_style = teachingStyle || null;
        profileData.is_public = true;       // makes them discoverable
      } else {
        profileData.learning_goal = learningGoal || null;
      }

      const { error } = await supabase.from("profiles").upsert(profileData);
      if (error) throw error;

      navigate(role === "teacher" ? "/teacher" : "/student");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── UI ───────────────────────────────────────────────────────────────────────
  const stepLabels =
    role === "teacher"
      ? ["Location", "Subjects", "Style", "Photo"]
      : ["Location", "Subjects", "Goal", "Photo"];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#4c1d95 100%)" }}
    >
      {/* Glow blobs */}
      <div className="fixed top-0 left-0 w-96 h-96 rounded-full pointer-events-none opacity-20"
        style={{ background: "radial-gradient(circle,#7c3aed,transparent 70%)", transform: "translate(-30%,-30%)" }} />
      <div className="fixed bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none opacity-15"
        style={{ background: "radial-gradient(circle,#2563eb,transparent 70%)", transform: "translate(30%,30%)" }} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl p-8"
        style={{ background: "rgba(255,255,255,0.97)", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-7">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: grad }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span style={{ fontWeight: 700, color: "#0f172a" }}>
            Access<span style={{ color: "#7c3aed" }}>Learn</span>
          </span>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-1.5 mb-8">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{
                    background: i + 1 < step ? grad : i + 1 === step ? grad : "#f1f5f9",
                    color: i + 1 <= step ? "white" : "#94a3b8",
                    fontWeight: 700,
                  }}>
                  {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-[10px] font-medium" style={{ color: i + 1 <= step ? "#7c3aed" : "#94a3b8" }}>
                  {label}
                </span>
              </div>
              {i < totalSteps - 1 && (
                <div className="flex-1 h-1 rounded-full mb-4"
                  style={{ background: i + 1 < step ? grad : "#f1f5f9" }} />
              )}
            </div>
          ))}
        </div>

        {/* Role badge */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: role === "teacher" ? "rgba(30,58,138,0.08)" : "rgba(124,58,237,0.08)",
              color: role === "teacher" ? "#1e3a8a" : "#7c3aed",
            }}>
            {role === "teacher" ? <BookOpen className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
            {role === "teacher" ? "Teacher Account" : "Student Account"} · {name || "You"}
          </div>
          <span className="text-xs text-gray-400">Step {step} of {totalSteps}</span>
        </div>

        {/* ── STEP 1: Location & Bio ───────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 className="mb-1" style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
              Where are you from?
            </h2>
            <p className="text-sm text-gray-400 mb-6">Tell us about your location and school.</p>

            <div className="mb-4">
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>
                <MapPin className="w-4 h-4 inline mr-1.5 text-gray-400" />Country
              </label>
              <select value={country} onChange={e => setCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: country ? "#7c3aed" : "#e2e8f0" }}>
                <option value="">Select your country…</option>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>
                <Building className="w-4 h-4 inline mr-1.5 text-gray-400" />
                {role === "teacher" ? "School / Institution" : "School / University"}
              </label>
              <input value={school} onChange={e => setSchool(e.target.value)}
                placeholder="e.g. Lagos State University"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: school ? "#7c3aed" : "#e2e8f0" }} />
            </div>

            <div className="mb-2">
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>
                <MessageSquare className="w-4 h-4 inline mr-1.5 text-gray-400" />
                Short Bio <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea value={bio} onChange={e => setBio(e.target.value)}
                placeholder={role === "teacher"
                  ? "e.g. Passionate science teacher with 8 years experience…"
                  : "e.g. Final year student preparing for WAEC and JAMB…"}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: bio ? "#7c3aed" : "#e2e8f0" }} />
            </div>
          </div>
        )}

        {/* ── STEP 2: Subjects ─────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="mb-1" style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
              {role === "teacher" ? "What do you teach?" : "What do you want to learn?"}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Pick up to 5 subjects. This helps us match you with the right {role === "teacher" ? "students" : "teachers"}.
            </p>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">
              {ALL_SUBJECTS.map(s => {
                const active = subjects.includes(s);
                const maxed = subjects.length >= 5 && !active;
                return (
                  <button key={s} onClick={() => !maxed && toggleSubject(s)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all border"
                    style={{
                      background: active ? "rgba(124,58,237,0.12)" : maxed ? "#f8fafc" : "white",
                      borderColor: active ? "#7c3aed" : "#e2e8f0",
                      color: active ? "#7c3aed" : maxed ? "#d1d5db" : "#374151",
                      cursor: maxed ? "not-allowed" : "pointer",
                    }}>
                    {active && <CheckCircle2 className="w-3 h-3 inline mr-1" />}{s}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              {subjects.length} / 5 selected
            </p>
          </div>
        )}

        {/* ── STEP 3: Style / Goal ─────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="mb-1" style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
              {role === "teacher" ? "Your teaching style" : "Your learning goal"}
            </h2>
            <p className="text-sm text-gray-400 mb-5">
              {role === "teacher"
                ? "How do you prefer to deliver lessons?"
                : "What are you primarily learning for?"}
            </p>

            {role === "teacher" ? (
              <div className="grid grid-cols-2 gap-3">
                {TEACHING_STYLES.map(ts => (
                  <button key={ts.id} onClick={() => setTeachingStyle(ts.id)}
                    className="p-4 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: teachingStyle === ts.id ? "#7c3aed" : "#e2e8f0",
                      background: teachingStyle === ts.id ? "rgba(124,58,237,0.05)" : "white",
                    }}>
                    <div className="text-2xl mb-2">{ts.icon}</div>
                    <div className="text-sm font-bold" style={{ color: "#0f172a" }}>{ts.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{ts.desc}</div>
                    {teachingStyle === ts.id && (
                      <CheckCircle2 className="w-4 h-4 mt-2" style={{ color: "#7c3aed" }} />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {LEARNING_GOALS.map(lg => (
                  <button key={lg.id} onClick={() => setLearningGoal(lg.id)}
                    className="p-4 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: learningGoal === lg.id ? "#7c3aed" : "#e2e8f0",
                      background: learningGoal === lg.id ? "rgba(124,58,237,0.05)" : "white",
                    }}>
                    <div className="text-2xl mb-2">{lg.icon}</div>
                    <div className="text-sm font-bold" style={{ color: "#0f172a" }}>{lg.label}</div>
                    {learningGoal === lg.id && (
                      <CheckCircle2 className="w-4 h-4 mt-2" style={{ color: "#7c3aed" }} />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Profile preview card */}
            <div className="mt-5 p-4 rounded-xl flex items-center gap-4"
              style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.15)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: grad }}>
                {role === "teacher" ? <BookOpen className="w-6 h-6 text-white" /> : <Star className="w-6 h-6 text-white" />}
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: "#0f172a" }}>{name || "Your Name"}</div>
                <div className="text-xs text-gray-500">{school} · {country}</div>
                <div className="text-xs text-violet-600 mt-0.5">{subjects.slice(0, 3).join(", ") || "No subjects yet"}</div>
              </div>
              <Sparkles className="w-5 h-5 ml-auto" style={{ color: "#7c3aed" }} />
            </div>
          </div>
        )}

        {/* ── STEP 4: Avatar ───────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h2 className="mb-1" style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
              Add a profile photo
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              A photo helps teachers and students recognise you. You can skip this.
            </p>

            <div className="flex flex-col items-center gap-5 py-2">
              <div className="relative">
                <div className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    background: avatarPreview ? "transparent" : grad,
                    border: "3px solid",
                    borderColor: avatarPreview ? "#7c3aed" : "transparent",
                  }}>
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-white text-3xl font-bold">
                      {(name || "U").slice(0, 2).toUpperCase()}
                    </span>}
                </div>
                <button onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: "#7c3aed" }}>
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*"
                  className="hidden" onChange={handleAvatarPick} />
              </div>

              <button onClick={() => fileRef.current?.click()}
                className="px-6 py-2.5 rounded-xl border text-sm transition-all hover:bg-gray-50"
                style={{ borderColor: "#e2e8f0", color: "#64748b" }}>
                {avatarPreview ? "Change Photo" : "Upload Photo"}
              </button>
              <p className="text-xs text-gray-400">JPG, PNG up to 5MB · Stored securely</p>
            </div>

            {/* Final summary card */}
            <div className="mt-4 p-4 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Your Profile Summary</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Name</span>
                  <span className="font-semibold text-gray-700">{name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Role</span>
                  <span className="font-semibold capitalize" style={{ color: "#7c3aed" }}>{role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Location</span>
                  <span className="font-semibold text-gray-700">{school}, {country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Subjects</span>
                  <span className="font-semibold text-gray-700 text-right max-w-[200px]">
                    {subjects.join(", ") || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-7">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl border text-sm"
              style={{ borderColor: "#e2e8f0", color: "#64748b" }}>
              <ChevronLeft className="w-4 h-4" />Back
            </button>
          )}

          {step < totalSteps ? (
            <button onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm transition-all"
              style={{
                background: canNext() ? grad : "#e2e8f0",
                color: canNext() ? "white" : "#94a3b8",
                cursor: canNext() ? "pointer" : "not-allowed",
              }}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={finish} disabled={saving || uploading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm"
              style={{ background: grad }}>
              {saving || uploading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Setting up profile…</>
                : <>{avatarPreview ? "Get Started 🎉" : "Skip & Get Started"}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}