import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { supabase } from "./supabaseClient";
import {
  GraduationCap, Search, Star, MapPin, BookOpen,
  Sparkles, ArrowLeft, Send, CheckCircle2, Loader2,
  Users, Filter, X, ChevronDown, Globe, Zap,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Educator {
  id: string; full_name: string; bio: string | null; avatar_url: string | null;
  country: string | null; school: string | null; subjects: string[] | null;
  teaching_style: string | null; rating: number; review_count: number;
  is_public: boolean; educator_type: string | null; field_category: string | null;
  headline: string | null; is_also_learner: boolean | null; learner_level: string | null;
}
interface RequestStatus { [id: string]: "idle" | "pending" | "accepted" | "declined" | "sending"; }

// ─── Constants ───────────────────────────────────────────────────────────────
const EDUCATOR_TYPE_META: Record<string, { label: string; icon: string; color: string; badge: string }> = {
  academic: { label: "Academic Educator", icon: "🏫", color: "#1e3a8a", badge: "Academic" },
  skills_tutor: { label: "Skills Tutor", icon: "💻", color: "#7c3aed", badge: "Skills" },
  professional_trainer: { label: "Professional Trainer", icon: "📈", color: "#059669", badge: "Pro Trainer" },
  peer_educator: { label: "Peer Educator", icon: "🤝", color: "#d97706", badge: "Peer Tutor" },
  mentor_coach: { label: "Mentor / Coach", icon: "🎯", color: "#dc2626", badge: "Mentor" },
  content_creator: { label: "Content Creator", icon: "🎬", color: "#0891b2", badge: "Creator" },
};

const FIELD_META: Record<string, { label: string; icon: string }> = {
  tech_development: { label: "Tech & Dev", icon: "💻" },
  finance_trading: { label: "Finance & Trading", icon: "📈" },
  design_creative: { label: "Design & Creative", icon: "🎨" },
  business_marketing: { label: "Business & Marketing", icon: "📊" },
  sciences_health: { label: "Sciences & Health", icon: "🔬" },
  languages_arts: { label: "Languages & Arts", icon: "🌍" },
  academic_research: { label: "Academic", icon: "🎓" },
  personal_development: { label: "Personal Growth", icon: "🎯" },
};

const ALL_SUBJECTS = [
  "Web Development", "Mobile Development", "Data Science & AI", "Cybersecurity", "UI/UX Design",
  "Product Management", "Cloud Computing", "Blockchain & Web3", "Trading & Forex", "Cryptocurrency & DeFi",
  "Digital Marketing", "Content Creation", "Copywriting", "Social Media Marketing", "SEO & Analytics",
  "E-commerce", "Entrepreneurship", "Business Strategy", "Graphic Design", "Video Editing",
  "Photography", "Animation", "Music Production", "Creative Writing", "Mathematics", "Physics",
  "Chemistry", "Biology", "English Language", "Literature", "History", "Geography", "Computer Science",
  "Economics", "Accounting", "Psychology", "Engineering", "Medicine / Health", "Law",
  "French", "Spanish", "Arabic", "Yoruba", "Igbo", "Public Speaking", "Personal Finance",
  "Fitness & Nutrition", "Leadership & Management", "Career Development",
];

const EDUCATOR_TYPE_FILTERS = [
  { id: "", label: "All Educators" },
  { id: "academic", label: "🏫 Academic" },
  { id: "skills_tutor", label: "💻 Skills Tutor" },
  { id: "professional_trainer", label: "📈 Pro Trainer" },
  { id: "peer_educator", label: "🤝 Peer Tutor" },
  { id: "mentor_coach", label: "🎯 Mentor" },
  { id: "content_creator", label: "🎬 Creator" },
];

const COLORS = ["#7c3aed", "#2563eb", "#059669", "#dc2626", "#d97706", "#0891b2"];
const pickColor = (s: string) => COLORS[(s?.charCodeAt(0) ?? 0) % COLORS.length];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className="w-3.5 h-3.5"
          fill={n <= Math.round(rating) ? "#f59e0b" : "none"}
          stroke={n <= Math.round(rating) ? "#f59e0b" : "#d1d5db"} />
      ))}
    </div>
  );
}

// ─── Educator Card ──────────────────────────────────────────────────────────
function EducatorCard({ educator, reqStatus, onRequest, onCancel, onViewProfile }: {
  educator: Educator; reqStatus: string;
  onRequest: (e: Educator) => void; onCancel: (id: string) => void; onViewProfile: (id: string) => void;
}) {
  const color = pickColor(educator.full_name);
  const initials = educator.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const typeMeta = educator.educator_type ? EDUCATOR_TYPE_META[educator.educator_type] : null;
  const fieldMeta = educator.field_category ? FIELD_META[educator.field_category] : null;

  const actionBtn = () => {
    if (reqStatus === "sending") return (
      <button disabled className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
        style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
        <Loader2 className="w-4 h-4 animate-spin" /> Sending…
      </button>
    );
    if (reqStatus === "pending") return (
      <button onClick={() => onCancel(educator.id)}
        className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-80"
        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
        <X className="w-3.5 h-3.5" /> Cancel Request
      </button>
    );
    if (reqStatus === "accepted") return (
      <button disabled className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
        style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>
        <CheckCircle2 className="w-4 h-4" /> Connected!
      </button>
    );
    return (
      <button onClick={() => onRequest(educator)}
        className="w-full py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 hover:opacity-90"
        style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}>
        <Send className="w-3.5 h-3.5" /> Connect
      </button>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
      style={{ border: "1px solid #f1f5f9" }}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0 overflow-hidden"
          style={{ background: educator.avatar_url ? "transparent" : color }}>
          {educator.avatar_url
            ? <img src={educator.avatar_url} alt={educator.full_name} className="w-full h-full object-cover" />
            : initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 truncate text-sm">{educator.full_name}</h3>
          {/* Headline */}
          {educator.headline && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{educator.headline}</p>
          )}
          {/* Type + field badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {typeMeta && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${typeMeta.color}12`, color: typeMeta.color }}>
                {typeMeta.icon} {typeMeta.badge}
              </span>
            )}
            {fieldMeta && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "#f1f5f9", color: "#64748b" }}>
                {fieldMeta.icon} {fieldMeta.label}
              </span>
            )}
            {educator.is_also_learner && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(5,150,105,0.08)", color: "#059669" }}>
                📚 Also learning
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Rating + location */}
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
        <div className="flex items-center gap-1">
          <Stars rating={educator.rating} />
          <span>({educator.review_count})</span>
        </div>
        {educator.country && (
          <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{educator.country}</span>
        )}
      </div>

      {/* Bio */}
      {educator.bio && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">{educator.bio}</p>
      )}

      {/* Subjects */}
      {educator.subjects && educator.subjects.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {educator.subjects.slice(0, 4).map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f1f5f9", color: "#475569" }}>{s}</span>
          ))}
          {educator.subjects.length > 4 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f1f5f9", color: "#94a3b8" }}>+{educator.subjects.length - 4}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        {actionBtn()}
        <button onClick={() => onViewProfile(educator.id)}
          className="w-full py-2 rounded-xl border text-xs text-gray-500 hover:bg-gray-50 transition-colors"
          style={{ borderColor: "#e2e8f0" }}>
          View Profile
        </button>
      </div>
    </div>
  );
}

// ─── Request Modal ───────────────────────────────────────────────────────────
function RequestModal({ educator, onClose, onSend }: {
  educator: Educator; onClose: () => void; onSend: (msg: string, subjects: string[]) => void;
}) {
  const [msg, setMsg] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const subs = educator.subjects || [];
  const typeMeta = educator.educator_type ? EDUCATOR_TYPE_META[educator.educator_type] : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
              style={{ background: educator.avatar_url ? "transparent" : pickColor(educator.full_name) }}>
              {educator.avatar_url
                ? <img src={educator.avatar_url} alt={educator.full_name} className="w-full h-full object-cover" />
                : educator.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{educator.full_name}</h3>
              {typeMeta && <p className="text-xs" style={{ color: typeMeta.color }}>{typeMeta.icon} {typeMeta.label}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="font-bold text-gray-900 text-lg mb-1">Send a Connection Request</h2>
          <p className="text-sm text-gray-500 mb-5">
            Let {educator.full_name.split(" ")[0]} know what you'd like to learn and why you want to connect.
          </p>
          {subs.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Topics you're interested in</label>
              <div className="flex flex-wrap gap-2">
                {subs.map(s => (
                  <button key={s} onClick={() => setSel(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                    style={{ background: sel.includes(s) ? "rgba(124,58,237,0.1)" : "white", borderColor: sel.includes(s) ? "#7c3aed" : "#e2e8f0", color: sel.includes(s) ? "#7c3aed" : "#64748b" }}>
                    {sel.includes(s) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}{s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your message <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea value={msg} onChange={e => setMsg(e.target.value)}
              placeholder={`Hi, I'd love to learn ${sel[0] || "from you"}! I'm currently…`}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: msg ? "#7c3aed" : "#e2e8f0" }} />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm text-gray-500 hover:bg-gray-50"
              style={{ borderColor: "#e2e8f0" }}>Cancel</button>
            <button onClick={() => onSend(msg, sel)}
              className="flex-1 py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}>
              <Send className="w-3.5 h-3.5" /> Send Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export function TeacherDiscovery() {
  const navigate = useNavigate();
  const [myProfile, setMyProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("student");
  const [educators, setEducators] = useState<Educator[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQ, setSearchQ] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterField, setFilterField] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [requestStatuses, setRequestStatuses] = useState<RequestStatus>({});
  const [requestModal, setRequestModal] = useState<Educator | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { navigate("/"); return; }
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (prof) { setMyProfile(prof); setUserRole(prof.role || "student"); }
      const { data: existing } = await supabase.from("teacher_requests").select("teacher_id,status").eq("student_id", user.id);
      if (existing) {
        const statuses: RequestStatus = {};
        existing.forEach((r: any) => { statuses[r.teacher_id] = r.status; });
        setRequestStatuses(statuses);
      }
    })();
  }, [navigate]);

  const fetchEducators = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("profiles")
      .select("id,full_name,bio,avatar_url,country,school,subjects,teaching_style,rating,review_count,is_public,educator_type,field_category,headline,is_also_learner,learner_level")
      .eq("role", "teacher").eq("is_public", true)
      .order("rating", { ascending: false }).limit(48);
    if (searchQ.trim()) q = q.or(`full_name.ilike.%${searchQ}%,bio.ilike.%${searchQ}%,headline.ilike.%${searchQ}%`);
    if (filterCountry) q = q.eq("country", filterCountry);
    if (filterType) q = q.eq("educator_type", filterType);
    if (filterField) q = q.eq("field_category", filterField);
    const { data, error } = await q;
    if (!error && data) {
      let result = data as Educator[];
      if (filterSubject) result = result.filter(e => e.subjects?.includes(filterSubject));
      setEducators(result);
    }
    setLoading(false);
  }, [searchQ, filterSubject, filterCountry, filterType, filterField]);

  useEffect(() => {
    const t = setTimeout(fetchEducators, 300);
    return () => clearTimeout(t);
  }, [fetchEducators]);

  const sendRequest = async (educator: Educator, message: string, subjects: string[]) => {
    if (!myProfile) return;
    setRequestStatuses(prev => ({ ...prev, [educator.id]: "sending" }));
    setRequestModal(null);
    const { error } = await supabase.from("teacher_requests").upsert({
      student_id: myProfile.id, teacher_id: educator.id,
      message: message.trim() || null, subjects: subjects.length > 0 ? subjects : null,
      status: "pending", updated_at: new Date().toISOString(),
    }, { onConflict: "student_id,teacher_id" });
    if (!error) {
      await supabase.from("notifications").insert({
        user_id: educator.id, actor_id: myProfile.id,
        type: "request_received",
        message: `${myProfile.full_name} sent you a connection request.`,
        link: "/teacher?tab=requests",
      });
    }
    setRequestStatuses(prev => ({ ...prev, [educator.id]: error ? "idle" : "pending" }));
    if (error) alert("Failed to send request: " + error.message);
  };

  const cancelRequest = async (educatorId: string) => {
    if (!myProfile || !confirm("Cancel this request?")) return;
    setRequestStatuses(prev => ({ ...prev, [educatorId]: "sending" }));
    const { error } = await supabase.from("teacher_requests").delete()
      .eq("student_id", myProfile.id).eq("teacher_id", educatorId);
    if (error) {
      alert("Failed to cancel: " + error.message);
      setRequestStatuses(prev => ({ ...prev, [educatorId]: "pending" }));
    } else {
      setRequestStatuses(prev => { const n = { ...prev }; delete n[educatorId]; return n; });
    }
  };

  const hasFilters = !!(filterSubject || filterCountry || filterType || filterField || searchQ);
  const clearFilters = () => { setFilterSubject(""); setFilterCountry(""); setFilterType(""); setFilterField(""); setSearchQ(""); };
  const countries = Array.from(new Set(educators.map(e => e.country).filter(Boolean))).sort() as string[];

  return (
    <div className="min-h-screen" style={{ background: "#f8faff", fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* ── Hero ── */}
      <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#4c1d95 100%)" }}>
        <div className="max-w-6xl mx-auto px-4 py-10 lg:py-14">
          <button onClick={() => navigate(userRole === "teacher" ? "/teacher" : "/student")}
            className="flex items-center gap-2 text-sm mb-6 hover:opacity-80 transition-opacity"
            style={{ color: "rgba(255,255,255,0.6)" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">AccessLearn</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-black text-white mb-2">Find Your Educator</h1>
          <p className="text-base mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>
            Teachers, tutors, trainers, mentors & peer educators — all in one place.
          </p>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
            From academic subjects to trading, coding, marketing, design & more.
          </p>

          {/* Search */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search by name, subject, headline, or keyword…"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-white/40 outline-none text-sm"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }} />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold"
              style={{ background: showFilters ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}>
              <Filter className="w-4 h-4" /> Filters {hasFilters && <span className="w-2 h-2 rounded-full bg-violet-400" />}
            </button>
          </div>

          {/* Educator type quick filters */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {EDUCATOR_TYPE_FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilterType(filterType === f.id ? "" : f.id)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0"
                style={{
                  background: filterType === f.id ? "white" : "rgba(255,255,255,0.1)",
                  color: filterType === f.id ? "#1e3a8a" : "rgba(255,255,255,0.8)",
                  border: filterType === f.id ? "none" : "1px solid rgba(255,255,255,0.15)",
                }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Advanced filters */}
          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-3">
              {/* Subject */}
              <div className="relative">
                <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm outline-none cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", color: "white" }}>
                  <option value="">All Subjects</option>
                  {ALL_SUBJECTS.map(s => <option key={s} value={s} style={{ color: "#0f172a" }}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "rgba(255,255,255,0.5)" }} />
              </div>
              {/* Country */}
              <div className="relative">
                <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm outline-none cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", color: "white" }}>
                  <option value="">All Countries</option>
                  {countries.map(c => <option key={c} value={c} style={{ color: "#0f172a" }}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "rgba(255,255,255,0.5)" }} />
              </div>
              {/* Field */}
              <div className="relative">
                <select value={filterField} onChange={e => setFilterField(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm outline-none cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", color: "white" }}>
                  <option value="">All Fields</option>
                  {Object.entries(FIELD_META).map(([k, v]) => <option key={k} value={k} style={{ color: "#0f172a" }}>{v.icon} {v.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "rgba(255,255,255,0.5)" }} />
              </div>
              {hasFilters && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
                  style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}>
                  <X className="w-3.5 h-3.5" /> Clear all
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {loading ? "Searching…" : (
              <><span className="font-bold text-gray-900">{educators.length}</span> educator{educators.length !== 1 ? "s" : ""} found{hasFilters ? " with current filters" : ""}</>
            )}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" /> Sorted by rating
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#7c3aed" }} />
            <p className="text-gray-400 text-sm">Finding great educators for you…</p>
          </div>
        )}

        {!loading && educators.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)" }}>
              <Users className="w-10 h-10" style={{ color: "#7c3aed" }} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No educators found</h3>
            <p className="text-gray-500 text-sm max-w-sm">Try adjusting your filters or search differently.</p>
            {hasFilters && (
              <button onClick={clearFilters}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}>Clear Filters</button>
            )}
          </div>
        )}

        {!loading && educators.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {educators.map(e => (
              <EducatorCard key={e.id} educator={e}
                reqStatus={requestStatuses[e.id] || "idle"}
                onRequest={edu => setRequestModal(edu)}
                onCancel={cancelRequest}
                onViewProfile={id => navigate(`/profile/${id}`)} />
            ))}
          </div>
        )}
      </div>

      {requestModal && (
        <RequestModal educator={requestModal}
          onClose={() => setRequestModal(null)}
          onSend={(msg, subj) => sendRequest(requestModal, msg, subj)} />
      )}
    </div>
  );
}
