import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { supabase } from "./supabaseClient";
import {
  GraduationCap, Camera, ChevronRight, ChevronLeft,
  BookOpen, Users, MapPin, Building, CheckCircle2,
  Sparkles, Loader2, MessageSquare, Search,
} from "lucide-react";

const COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Ethiopia", "Cameroon", "Tanzania", "Uganda", "Zimbabwe", "Morocco", "Algeria",
  "Japan", "South Korea", "China", "India", "Pakistan", "Bangladesh", "Sri Lanka", "Malaysia", "Singapore", "Thailand", "Vietnam", "Philippines",
  "Brazil", "Mexico", "Colombia", "Argentina", "Chile", "Peru",
  "United States", "Canada", "United Kingdom", "Germany", "France", "Spain", "Italy", "Portugal", "Netherlands", "Sweden", "Norway", "Poland",
  "Saudi Arabia", "Egypt", "UAE", "Qatar", "Turkey", "Israel",
  "Australia", "New Zealand", "Other",
];

const PATHS = [
  { id: "educator", icon: "🎓", label: "I Teach & Share Knowledge", desc: "Teacher, professor, tutor, trainer, or mentor", color: "#1e3a8a" },
  { id: "learner", icon: "📚", label: "I'm Here to Learn", desc: "Student, professional upskilling, or self-learner", color: "#7c3aed" },
  { id: "both", icon: "🔄", label: "I Both Teach & Learn", desc: "Share knowledge in some areas, still learning in others", color: "#059669" },
  { id: "community", icon: "👥", label: "I Run a Group / Community", desc: "Moving your Telegram, WhatsApp, or Discord group here", color: "#d97706" },
];

const EDUCATOR_TYPES = [
  { id: "academic", icon: "🏫", label: "Academic Educator", desc: "School teacher, professor, or lecturer", color: "#1e3a8a" },
  { id: "skills_tutor", icon: "💻", label: "Skills Tutor", desc: "Coding, UI/UX, data science & tech", color: "#7c3aed" },
  { id: "professional_trainer", icon: "📈", label: "Professional Trainer", desc: "Trading, marketing, finance & business", color: "#059669" },
  { id: "peer_educator", icon: "🤝", label: "Peer Educator", desc: "Student helping & teaching other students", color: "#d97706" },
  { id: "mentor_coach", icon: "🎯", label: "Mentor / Coach", desc: "Career, life or business guidance", color: "#dc2626" },
  { id: "content_creator", icon: "🎬", label: "Content Creator", desc: "Online courses & community learning", color: "#0891b2" },
];

const LEARNER_LEVELS = [
  { id: "high_school", icon: "🏫", label: "High School", desc: "Secondary / O-Level / A-Level" },
  { id: "undergraduate", icon: "🎓", label: "Undergraduate", desc: "Bachelor's / HND / Diploma" },
  { id: "postgraduate", icon: "📖", label: "Postgraduate", desc: "Master's / PGD / MBA" },
  { id: "doctorate", icon: "🔬", label: "Doctorate / PhD", desc: "Advanced research studies" },
  { id: "professional", icon: "💼", label: "Working Professional", desc: "Employed, upskilling or transitioning" },
  { id: "self_learner", icon: "🌱", label: "Self-Learner", desc: "Learning for passion or personal growth" },
];

const FIELD_CATEGORIES = [
  { id: "tech_development", label: "Tech & Dev", icon: "💻", color: "#7c3aed" },
  { id: "finance_trading", label: "Finance & Trading", icon: "📈", color: "#059669" },
  { id: "design_creative", label: "Design & Creative", icon: "🎨", color: "#dc2626" },
  { id: "business_marketing", label: "Business & Marketing", icon: "📊", color: "#d97706" },
  { id: "sciences_health", label: "Sciences & Health", icon: "🔬", color: "#0891b2" },
  { id: "languages_arts", label: "Languages & Arts", icon: "🌍", color: "#9333ea" },
  { id: "academic_research", label: "Academic", icon: "🎓", color: "#1e3a8a" },
  { id: "personal_development", label: "Personal Growth", icon: "🎯", color: "#d97706" },
];

const SUBJECT_GROUPS = [
  { label: "Tech & Digital", emoji: "💻", subjects: ["Web Development", "Mobile Development", "Data Science & AI", "Cybersecurity", "UI/UX Design", "Product Management", "Cloud Computing", "Blockchain & Web3", "Machine Learning", "DevOps"] },
  { label: "Business & Professional", emoji: "📈", subjects: ["Trading & Forex", "Cryptocurrency & DeFi", "Digital Marketing", "Content Creation", "Copywriting", "Social Media Marketing", "SEO & Analytics", "E-commerce", "Entrepreneurship", "Business Strategy", "Project Management"] },
  { label: "Creative", emoji: "🎨", subjects: ["Graphic Design", "Video Editing", "Photography", "Animation", "Music Production", "Creative Writing", "Podcast Production", "Film & Cinematography"] },
  { label: "Academic", emoji: "🎓", subjects: ["Mathematics", "Physics", "Chemistry", "Biology", "English Language", "Literature", "History", "Geography", "Computer Science", "Economics", "Accounting", "Government & Politics", "Psychology", "Engineering", "Medicine / Health", "Law", "French", "Spanish", "Arabic", "Yoruba", "Igbo"] },
  { label: "Personal Growth", emoji: "🌱", subjects: ["Public Speaking", "Personal Finance", "Fitness & Nutrition", "Mental Health & Wellness", "Leadership & Management", "Career Development"] },
];

const TEACHING_STYLES = [
  { id: "interactive", label: "Interactive", icon: "💬", desc: "Q&A & open discussions" },
  { id: "lecture", label: "Lecture-based", icon: "📢", desc: "Structured delivery" },
  { id: "project", label: "Project-based", icon: "🔨", desc: "Hands-on learning" },
  { id: "socratic", label: "Socratic", icon: "🤔", desc: "Question-driven" },
  { id: "workshop", label: "Workshop", icon: "🛠️", desc: "Live exercises" },
  { id: "mentorship", label: "Mentorship", icon: "🤝", desc: "Personalised support" },
];

const LEARNING_GOALS = [
  { id: "exam", label: "Exam Prep", icon: "📝", desc: "WAEC, JAMB, GRE…" },
  { id: "skill", label: "Skill Building", icon: "🎯", desc: "Career-ready skills" },
  { id: "hobby", label: "Personal Interest", icon: "🌟", desc: "Learning for fun" },
  { id: "career", label: "Career Growth", icon: "📈", desc: "Promotions & transitions" },
  { id: "certification", label: "Certification", icon: "🏆", desc: "Professional credentials" },
  { id: "research", label: "Research / Academia", icon: "🔬", desc: "Thesis & academic work" },
];

const grad = "linear-gradient(135deg,#1e3a8a,#7c3aed)";

export function OnboardingFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetRole = searchParams.get("role") as "teacher" | "student" | null;
  const name = searchParams.get("name") || "";

  const totalSteps = 5;
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [pathChoice, setPathChoice] = useState<string>(
    presetRole === "teacher" ? "educator" : presetRole === "student" ? "learner" : ""
  );
  const [educatorType, setEducatorType] = useState("");
  const [learnerLevel, setLearnerLevel] = useState("");

  // Step 2
  const [headline, setHeadline] = useState("");
  const [fieldCategory, setFieldCategory] = useState("");
  const [country, setCountry] = useState("");
  const [institution, setInstitution] = useState("");
  const [bio, setBio] = useState("");

  // Step 3
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectSearch, setSubjectSearch] = useState("");

  // Step 4
  const [teachingStyle, setTeachingStyle] = useState("");
  const [learningGoal, setLearningGoal] = useState("");

  // Step 5
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isEducatorPath = ["educator", "both", "community"].includes(pathChoice);
  const derivedRole: "teacher" | "student" = isEducatorPath ? "teacher" : "student";
  const maxSubjects = isEducatorPath ? 8 : 5;
  const stepLabels = ["Path", "Identity", "Topics", isEducatorPath ? "Style" : "Goals", "Photo"];

  const canNext = () => {
    if (step === 1) {
      if (!pathChoice) return false;
      if (pathChoice === "community") return true;
      if ((pathChoice === "educator") && !educatorType) return false;
      if ((pathChoice === "learner") && !learnerLevel) return false;
      if ((pathChoice === "both") && (!educatorType || !learnerLevel)) return false;
      return true;
    }
    if (step === 2) return !!country;
    if (step === 3) return subjects.length > 0;
    return true;
  };

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;
    setUploading(true);
    const ext = avatarFile.name.split(".").pop();
    const path = `avatars/${userId}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
    setUploading(false);
    if (error) return null;
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  const toggleSubject = (s: string) =>
    setSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : prev.length < maxSubjects ? [...prev, s] : prev
    );

  const finish = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("Not authenticated. Please log in again.");
      const avatarUrl = await uploadAvatar(user.id);
      const finalEducatorType = pathChoice === "community" ? "content_creator"
        : (isEducatorPath ? educatorType : null);
      const profileData: Record<string, any> = {
        id: user.id, email: user.email, full_name: name,
        role: derivedRole, country, school: institution || null,
        bio: bio.trim() || null, headline: headline.trim() || null,
        subjects, field_category: fieldCategory || null,
        educator_type: finalEducatorType,
        learner_level: (!isEducatorPath || pathChoice === "both") ? (learnerLevel || null) : null,
        is_also_learner: pathChoice === "both",
        is_also_educator: false,
        is_public: isEducatorPath,
        teaching_style: isEducatorPath ? (teachingStyle || null) : null,
        learning_goal: !isEducatorPath ? (learningGoal || null) : null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("profiles").upsert(profileData);
      if (error) throw error;
      navigate(derivedRole === "teacher" ? "/teacher" : "/student");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const institutionLabel = () => {
    if (pathChoice === "community") return "Community / Group Name";
    if (educatorType === "academic") return "School / University *";
    if (educatorType === "professional_trainer" || educatorType === "skills_tutor") return "Platform / Company (optional)";
    if (!isEducatorPath) return "School / University";
    return "Institution or Platform (optional)";
  };

  const headlinePlaceholder = () => {
    if (pathChoice === "community") return "e.g. Forex Trader & Community Builder";
    if (educatorType === "professional_trainer") return "e.g. Digital Marketer & Growth Strategist";
    if (educatorType === "skills_tutor") return "e.g. Full Stack Dev & Coding Tutor";
    if (educatorType === "academic") return "e.g. Mathematics Teacher · 8 Years Experience";
    if (pathChoice === "learner") return "e.g. MSc Student | Aspiring Data Scientist";
    if (pathChoice === "both") return "e.g. Software Dev & Computer Science Student";
    return "e.g. Your role and passion in one line";
  };

  const filteredGroups = SUBJECT_GROUPS.map(g => ({
    ...g,
    subjects: g.subjects.filter(s => s.toLowerCase().includes(subjectSearch.toLowerCase())),
  })).filter(g => g.subjects.length > 0);

  const selectedPath = PATHS.find(p => p.id === pathChoice);

  // ─── Shared card styles ────────────────────────────────────────────────────
  const card = (active: boolean, color = "#7c3aed") => ({
    borderColor: active ? color : "#e2e8f0",
    background: active ? `${color}08` : "white",
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#4c1d95 100%)" }}>
      <div className="fixed top-0 left-0 w-96 h-96 rounded-full pointer-events-none opacity-20"
        style={{ background: "radial-gradient(circle,#7c3aed,transparent 70%)", transform: "translate(-30%,-30%)" }} />
      <div className="fixed bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none opacity-15"
        style={{ background: "radial-gradient(circle,#2563eb,transparent 70%)", transform: "translate(30%,30%)" }} />

      <div className="relative z-10 w-full max-w-xl rounded-2xl p-6 sm:p-8"
        style={{ background: "rgba(255,255,255,0.97)", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: grad }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span style={{ fontWeight: 700, color: "#0f172a" }}>Access<span style={{ color: "#7c3aed" }}>Learn</span></span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-1.5 mb-7">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-1.5 flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0"
                  style={{ background: i + 1 <= step ? grad : "#f1f5f9", color: i + 1 <= step ? "white" : "#94a3b8", fontWeight: 700 }}>
                  {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-[10px] font-medium" style={{ color: i + 1 <= step ? "#7c3aed" : "#94a3b8" }}>{label}</span>
              </div>
              {i < totalSteps - 1 && (
                <div className="flex-1 h-1 rounded-full mb-4" style={{ background: i + 1 < step ? grad : "#f1f5f9" }} />
              )}
            </div>
          ))}
        </div>

        {/* Greeting */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {selectedPath && <span className="text-2xl">{selectedPath.icon}</span>}
            <div>
              <div className="text-sm font-bold text-gray-900">{name ? `Welcome, ${name.split(" ")[0]}! 👋` : "Welcome! 👋"}</div>
              {selectedPath && <div className="text-xs text-gray-400">{selectedPath.label}</div>}
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#f1f5f9", color: "#64748b" }}>
            Step {step} of {totalSteps}
          </span>
        </div>

        {/* ════════════════ STEP 1 ════════════════ */}
        {step === 1 && (
          <div>
            <h2 className="mb-1" style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
              How will you use AccessLearn?
            </h2>
            <p className="text-sm text-gray-400 mb-4">Choose your path — you can always do both.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
              {PATHS.map(p => (
                <button key={p.id} onClick={() => { setPathChoice(p.id); setEducatorType(""); setLearnerLevel(""); }}
                  className="p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm"
                  style={card(pathChoice === p.id, p.color)}>
                  <div className="text-2xl mb-1.5">{p.icon}</div>
                  <div className="text-sm font-bold mb-0.5" style={{ color: pathChoice === p.id ? p.color : "#0f172a" }}>{p.label}</div>
                  <div className="text-xs text-gray-400">{p.desc}</div>
                  {pathChoice === p.id && <CheckCircle2 className="w-4 h-4 mt-2" style={{ color: p.color }} />}
                </button>
              ))}
            </div>

            {/* Educator type */}
            {(pathChoice === "educator" || pathChoice === "both") && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                  {pathChoice === "both" ? "As an educator — what type are you?" : "What kind of educator are you?"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {EDUCATOR_TYPES.map(et => (
                    <button key={et.id} onClick={() => setEducatorType(et.id)}
                      className="p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all"
                      style={card(educatorType === et.id, et.color)}>
                      <span className="text-lg shrink-0">{et.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight" style={{ color: educatorType === et.id ? et.color : "#0f172a" }}>{et.label}</div>
                        <div className="text-xs text-gray-400 leading-tight mt-0.5">{et.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Learner level */}
            {(pathChoice === "learner" || pathChoice === "both") && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                  {pathChoice === "both" ? "As a learner — what stage are you at?" : "What stage are you at?"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {LEARNER_LEVELS.map(ll => (
                    <button key={ll.id} onClick={() => setLearnerLevel(ll.id)}
                      className="p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all"
                      style={card(learnerLevel === ll.id)}>
                      <span className="text-lg shrink-0">{ll.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold leading-tight" style={{ color: learnerLevel === ll.id ? "#7c3aed" : "#0f172a" }}>{ll.label}</div>
                        <div className="text-xs text-gray-400 leading-tight mt-0.5">{ll.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════ STEP 2 ════════════════ */}
        {step === 2 && (
          <div>
            <h2 className="mb-1" style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>Tell us about yourself</h2>
            <p className="text-sm text-gray-400 mb-4">This appears on your public profile.</p>

            <div className="mb-4">
              <label className="block text-sm mb-1.5 font-semibold text-gray-700">
                <Sparkles className="w-4 h-4 inline mr-1 text-violet-400" />
                Your Headline <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input value={headline} onChange={e => setHeadline(e.target.value)}
                placeholder={headlinePlaceholder()}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: headline ? "#7c3aed" : "#e2e8f0" }} />
              <p className="text-xs text-gray-400 mt-1">Your one-liner. Make it personal and memorable.</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-2 font-semibold text-gray-700">
                Your field <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FIELD_CATEGORIES.map(f => (
                  <button key={f.id} onClick={() => setFieldCategory(fieldCategory === f.id ? "" : f.id)}
                    className="p-2.5 rounded-xl border text-left transition-all"
                    style={card(fieldCategory === f.id, f.color)}>
                    <div className="text-base mb-0.5">{f.icon}</div>
                    <div className="text-xs font-semibold leading-tight" style={{ color: fieldCategory === f.id ? f.color : "#374151" }}>{f.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1.5 font-semibold text-gray-700">
                <MapPin className="w-4 h-4 inline mr-1 text-gray-400" />Country *
              </label>
              <select value={country} onChange={e => setCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: country ? "#7c3aed" : "#e2e8f0" }}>
                <option value="">Select your country…</option>
                {COUNTRIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm mb-1.5 font-semibold text-gray-700">
                <Building className="w-4 h-4 inline mr-1 text-gray-400" />{institutionLabel()}
              </label>
              <input value={institution} onChange={e => setInstitution(e.target.value)}
                placeholder={
                  pathChoice === "community" ? "e.g. Crypto Kings Academy" :
                    educatorType === "professional_trainer" ? "e.g. Self-employed, TradersHub" :
                      educatorType === "skills_tutor" ? "e.g. Bootcamp / Freelance" :
                        educatorType === "academic" ? "e.g. University of Lagos" :
                          "e.g. Your school or platform"
                }
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: institution ? "#7c3aed" : "#e2e8f0" }} />
            </div>

            <div>
              <label className="block text-sm mb-1.5 font-semibold text-gray-700">
                <MessageSquare className="w-4 h-4 inline mr-1 text-gray-400" />
                Short Bio <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea value={bio} onChange={e => setBio(e.target.value)}
                placeholder={
                  isEducatorPath
                    ? "e.g. 5 years teaching Python & data science. I enjoy breaking complex topics into simple steps."
                    : "e.g. Final-year engineering student passionate about AI and open-source."
                }
                rows={3}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: bio ? "#7c3aed" : "#e2e8f0" }} />
            </div>
          </div>
        )}

        {/* ════════════════ STEP 3 ════════════════ */}
        {step === 3 && (
          <div>
            <h2 className="mb-1" style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
              {isEducatorPath ? "What do you teach?" : "What do you want to learn?"}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Pick up to {maxSubjects} topics — this powers your matches.
            </p>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={subjectSearch} onChange={e => setSubjectSearch(e.target.value)}
                placeholder="Search topics…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#e2e8f0" }} />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {filteredGroups.map(group => (
                <div key={group.label}>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{group.emoji} {group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.subjects.map(s => {
                      const active = subjects.includes(s);
                      const maxed = subjects.length >= maxSubjects && !active;
                      return (
                        <button key={s} onClick={() => !maxed && toggleSubject(s)}
                          className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                          style={{
                            background: active ? "rgba(124,58,237,0.1)" : maxed ? "#f8fafc" : "white",
                            borderColor: active ? "#7c3aed" : "#e2e8f0",
                            color: active ? "#7c3aed" : maxed ? "#d1d5db" : "#374151",
                            cursor: maxed ? "not-allowed" : "pointer",
                          }}>
                          {active && <CheckCircle2 className="w-3 h-3 inline mr-1" />}{s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-right">{subjects.length} / {maxSubjects} selected</p>
          </div>
        )}

        {/* ════════════════ STEP 4 ════════════════ */}
        {step === 4 && (
          <div>
            <h2 className="mb-1" style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>
              {isEducatorPath ? "How do you like to teach?" : "What are you learning for?"}
            </h2>
            <p className="text-sm text-gray-400 mb-5">
              {isEducatorPath ? "Pick your preferred teaching approach." : "Select your primary learning goal."}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {(isEducatorPath ? TEACHING_STYLES : LEARNING_GOALS).map((item: any) => (
                <button key={item.id}
                  onClick={() => isEducatorPath ? setTeachingStyle(item.id) : setLearningGoal(item.id)}
                  className="p-4 rounded-xl border-2 text-left transition-all"
                  style={card(isEducatorPath ? teachingStyle === item.id : learningGoal === item.id)}>
                  <div className="text-2xl mb-1.5">{item.icon}</div>
                  <div className="text-sm font-bold" style={{ color: "#0f172a" }}>{item.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                  {(isEducatorPath ? teachingStyle === item.id : learningGoal === item.id) && (
                    <CheckCircle2 className="w-4 h-4 mt-2" style={{ color: "#7c3aed" }} />
                  )}
                </button>
              ))}
            </div>

            {/* Preview card */}
            <div className="p-4 rounded-xl flex items-center gap-4"
              style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.15)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: grad }}>
                {isEducatorPath ? <BookOpen className="w-6 h-6 text-white" /> : <Users className="w-6 h-6 text-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-gray-900 truncate">{name || "Your Name"}</div>
                {headline && <div className="text-xs text-gray-500 truncate">{headline}</div>}
                <div className="text-xs text-violet-600 mt-0.5 truncate">{subjects.slice(0, 3).join(" · ") || "No topics yet"}</div>
              </div>
              <Sparkles className="w-5 h-5 shrink-0" style={{ color: "#7c3aed" }} />
            </div>
          </div>
        )}

        {/* ════════════════ STEP 5 ════════════════ */}
        {step === 5 && (
          <div>
            <h2 className="mb-1" style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a" }}>Add a profile photo</h2>
            <p className="text-sm text-gray-400 mb-5">A photo builds trust. You can always skip this.</p>

            <div className="flex flex-col items-center gap-4 py-2 mb-5">
              <div className="relative">
                <div className="w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ background: avatarPreview ? "transparent" : grad, border: "3px solid", borderColor: avatarPreview ? "#7c3aed" : "transparent" }}>
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-white text-3xl font-bold">{(name || "U").slice(0, 2).toUpperCase()}</span>}
                </div>
                <button onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: "#7c3aed" }}>
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
              </div>
              <button onClick={() => fileRef.current?.click()}
                className="px-5 py-2 rounded-xl border text-sm transition-all hover:bg-gray-50"
                style={{ borderColor: "#e2e8f0", color: "#64748b" }}>
                {avatarPreview ? "Change Photo" : "Upload Photo"}
              </button>
            </div>

            {/* Summary */}
            <div className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Your Profile Summary</div>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Name", value: name || "—" },
                  { label: "Path", value: PATHS.find(p => p.id === pathChoice)?.label || "—" },
                  {
                    label: "Type", value: pathChoice === "community" ? "Content Creator" :
                      (isEducatorPath ? (EDUCATOR_TYPES.find(e => e.id === educatorType)?.label || "—") :
                        (LEARNER_LEVELS.find(l => l.id === learnerLevel)?.label || "—"))
                  },
                  { label: "Location", value: [institution, country].filter(Boolean).join(", ") || "—" },
                  { label: "Topics", value: subjects.slice(0, 4).join(", ") || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-gray-400 shrink-0">{label}</span>
                    <span className="font-semibold text-gray-700 text-right truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-7">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-5 py-3 rounded-xl border text-sm transition-all hover:bg-gray-50"
              style={{ borderColor: "#e2e8f0", color: "#64748b" }}>
              <ChevronLeft className="w-4 h-4" />Back
            </button>
          )}
          {step < totalSteps ? (
            <button onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all"
              style={{ background: canNext() ? grad : "#e2e8f0", color: canNext() ? "white" : "#94a3b8", cursor: canNext() ? "pointer" : "not-allowed" }}>
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={finish} disabled={saving || uploading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm"
              style={{ background: grad }}>
              {saving || uploading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Setting up your profile…</>
                : <>{avatarPreview ? "Get Started 🎉" : "Skip & Get Started →"}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}