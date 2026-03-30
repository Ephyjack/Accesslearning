import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { supabase } from "./supabaseClient";
import {
  GraduationCap, Search, Star, Globe, MapPin, BookOpen,
  Sparkles, ArrowLeft, Send, CheckCircle2, Loader2,
  MessageSquare, Users, Filter, X, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Teacher {
  id: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  country: string | null;
  school: string | null;
  subjects: string[] | null;
  teaching_style: string | null;
  rating: number;
  review_count: number;
  is_public: boolean;
}

interface RequestStatus {
  [teacherId: string]: "idle" | "pending" | "accepted" | "declined" | "sending";
}

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "English Language", "Literature", "History", "Geography",
  "Computer Science", "Economics", "Business Studies",
  "Visual Arts", "Music", "French", "Spanish", "Arabic",
  "Yoruba", "Igbo", "Accounting", "Psychology",
  "Engineering", "Medicine / Health", "Law",
];

const STYLE_LABELS: Record<string, string> = {
  interactive: "💬 Interactive",
  lecture: "📢 Lecture-based",
  project: "🔨 Project-based",
  socratic: "🤔 Socratic",
};

const COLORS = ["#7c3aed", "#2563eb", "#059669", "#dc2626", "#d97706", "#0891b2"];
const pickColor = (s: string) => COLORS[(s?.charCodeAt(0) ?? 0) % COLORS.length];

// ─── Star Rating component ─────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className="w-3.5 h-3.5"
          fill={n <= Math.round(rating) ? "#f59e0b" : "none"}
          stroke={n <= Math.round(rating) ? "#f59e0b" : "#d1d5db"}
        />
      ))}
    </div>
  );
}

// ─── Teacher Card ──────────────────────────────────────────────────────────
function TeacherCard({
  teacher,
  reqStatus,
  myProfile,
  onRequest,
  onViewProfile,
}: {
  teacher: Teacher;
  reqStatus: string;
  myProfile: any;
  onRequest: (t: Teacher) => void;
  onViewProfile: (id: string) => void;
}) {
  const color = pickColor(teacher.full_name);
  const initials = teacher.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const statusButton = () => {
    if (reqStatus === "sending") return (
      <button disabled className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2" style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
        <Loader2 className="w-4 h-4 animate-spin" /> Sending…
      </button>
    );
    if (reqStatus === "pending") return (
      <button disabled className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2" style={{ background: "rgba(251,191,36,0.12)", color: "#d97706" }}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Pending…
      </button>
    );
    if (reqStatus === "accepted") return (
      <button disabled className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>
        <CheckCircle2 className="w-4 h-4" /> Connected!
      </button>
    );
    return (
      <button
        onClick={() => onRequest(teacher)}
        className="w-full py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}
      >
        <Send className="w-3.5 h-3.5" /> Request to Learn
      </button>
    );
  };

  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
      style={{ border: "1px solid #f1f5f9" }}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden"
          style={{ background: teacher.avatar_url ? "transparent" : color }}
        >
          {teacher.avatar_url
            ? <img src={teacher.avatar_url} alt={teacher.full_name} className="w-full h-full object-cover" />
            : initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 truncate">{teacher.full_name}</h3>
          {teacher.school && <p className="text-xs text-gray-500 truncate">{teacher.school}</p>}
          {teacher.country && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <MapPin className="w-3 h-3" />{teacher.country}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Stars rating={teacher.rating} />
            <span className="text-xs text-gray-400">({teacher.review_count})</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {teacher.bio && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{teacher.bio}</p>
      )}

      {/* Teaching style */}
      {teacher.teaching_style && (
        <div className="text-xs mb-3 px-2 py-1 rounded-lg w-fit" style={{ background: "rgba(124,58,237,0.06)", color: "#7c3aed" }}>
          {STYLE_LABELS[teacher.teaching_style] || teacher.teaching_style}
        </div>
      )}

      {/* Subjects */}
      {teacher.subjects && teacher.subjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {teacher.subjects.slice(0, 4).map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f1f5f9", color: "#475569" }}>{s}</span>
          ))}
          {teacher.subjects.length > 4 && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#f1f5f9", color: "#94a3b8" }}>+{teacher.subjects.length - 4} more</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-auto">
        {statusButton()}
        <button
          onClick={() => onViewProfile(teacher.id)}
          className="w-full py-2 rounded-xl border text-sm text-gray-500 hover:bg-gray-50 transition-colors"
          style={{ borderColor: "#e2e8f0" }}
        >
          View Profile
        </button>
      </div>
    </div>
  );
}

// ─── Request Modal ──────────────────────────────────────────────────────────
function RequestModal({
  teacher,
  onClose,
  onSend,
}: {
  teacher: Teacher;
  onClose: () => void;
  onSend: (msg: string, subjects: string[]) => void;
}) {
  const [msg, setMsg] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const color = pickColor(teacher.full_name);
  const initials = teacher.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const toggleSubject = (s: string) =>
    setSelectedSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const relevantSubjects = teacher.subjects || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0 overflow-hidden"
              style={{ background: teacher.avatar_url ? "transparent" : color }}
            >
              {teacher.avatar_url
                ? <img src={teacher.avatar_url} alt={teacher.full_name} className="w-full h-full object-cover" />
                : initials}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{teacher.full_name}</h3>
              <p className="text-xs text-gray-500">{teacher.country}</p>
            </div>
            <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="font-bold text-gray-900 text-lg mb-1">Request to Learn</h2>
          <p className="text-sm text-gray-500 mb-5">Let {teacher.full_name.split(" ")[0]} know what you want to learn and why you'd like to connect.</p>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Subject picker (filtered to teacher's subjects) */}
          {relevantSubjects.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Which subject(s) are you interested in?</label>
              <div className="flex flex-wrap gap-2">
                {relevantSubjects.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSubject(s)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                    style={{
                      background: selectedSubjects.includes(s) ? "rgba(124,58,237,0.1)" : "white",
                      borderColor: selectedSubjects.includes(s) ? "#7c3aed" : "#e2e8f0",
                      color: selectedSubjects.includes(s) ? "#7c3aed" : "#64748b",
                    }}
                  >
                    {selectedSubjects.includes(s) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}{s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Your message <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder={`Hi, I'd love to learn ${selectedSubjects[0] || "from you"}! I'm currently...`}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: msg ? "#7c3aed" : "#e2e8f0" }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border text-sm text-gray-500 hover:bg-gray-50 transition-colors" style={{ borderColor: "#e2e8f0" }}>
              Cancel
            </button>
            <button
              onClick={() => onSend(msg, selectedSubjects)}
              className="flex-1 py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}
            >
              <Send className="w-3.5 h-3.5" /> Send Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export function TeacherDiscovery() {
  const navigate = useNavigate();
  const [myProfile, setMyProfile] = useState<any>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQ, setSearchQ] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterStyle, setFilterStyle] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Request state
  const [requestStatuses, setRequestStatuses] = useState<RequestStatus>({});
  const [requestModal, setRequestModal] = useState<Teacher | null>(null);

  // ── Load profile + existing requests ─────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { navigate("/"); return; }

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (prof) setMyProfile(prof);

      // Load my existing teacher requests so buttons reflect current state
      const { data: existing } = await supabase
        .from("teacher_requests")
        .select("teacher_id, status")
        .eq("student_id", user.id);

      if (existing) {
        const statuses: RequestStatus = {};
        existing.forEach((r: any) => { statuses[r.teacher_id] = r.status; });
        setRequestStatuses(statuses);
      }
    })();
  }, [navigate]);

  // ── Fetch public teachers ─────────────────────────────────────────────────
  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("id, full_name, bio, avatar_url, country, school, subjects, teaching_style, rating, review_count, is_public")
      .eq("role", "teacher")
      .eq("is_public", true)
      .order("rating", { ascending: false })
      .limit(48);

    if (searchQ.trim()) {
      query = query.or(`full_name.ilike.%${searchQ}%,bio.ilike.%${searchQ}%`);
    }
    if (filterCountry) query = query.eq("country", filterCountry);
    if (filterStyle) query = query.eq("teaching_style", filterStyle);

    const { data, error } = await query;
    if (!error && data) {
      let result = data as Teacher[];
      // Client-side subject filter (Postgres doesn't support array Contains easily via REST)
      if (filterSubject) {
        result = result.filter(t => t.subjects?.includes(filterSubject));
      }
      setTeachers(result);
    }
    setLoading(false);
  }, [searchQ, filterSubject, filterCountry, filterStyle]);

  useEffect(() => {
    const timer = setTimeout(fetchTeachers, 300); // debounce
    return () => clearTimeout(timer);
  }, [fetchTeachers]);

  // ── Send request ─────────────────────────────────────────────────────────
  const sendRequest = async (teacher: Teacher, message: string, subjects: string[]) => {
    if (!myProfile) return;
    setRequestStatuses(prev => ({ ...prev, [teacher.id]: "sending" }));
    setRequestModal(null);

    const { error } = await supabase.from("teacher_requests").upsert({
      student_id: myProfile.id,
      teacher_id: teacher.id,
      message: message.trim() || null,
      subjects: subjects.length > 0 ? subjects : null,
      status: "pending",
      updated_at: new Date().toISOString(),
    }, { onConflict: "student_id,teacher_id" });

    if (!error) {
      await supabase.from("notifications").insert({
        user_id: teacher.id,
        actor_id: myProfile.id,
        type: "request_received",
        message: `${myProfile.full_name} sent you a request to learn.`,
        link: "/teacher?tab=requests"
      });
    }

    setRequestStatuses(prev => ({
      ...prev,
      [teacher.id]: error ? "idle" : "pending",
    }));
    if (error) alert("Failed to send request: " + error.message);
  };

  const clearFilters = () => {
    setFilterSubject(""); setFilterCountry(""); setFilterStyle(""); setSearchQ("");
  };
  const hasFilters = !!(filterSubject || filterCountry || filterStyle || searchQ);

  // ── Unique countries from results ────────────────────────────────────────
  const countries = Array.from(new Set(teachers.map(t => t.country).filter(Boolean))).sort() as string[];

  return (
    <div className="min-h-screen" style={{ background: "#f8faff", fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* ── Hero Header ── */}
      <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#4c1d95 100%)" }}>
        <div className="max-w-6xl mx-auto px-4 py-10 lg:py-14">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm mb-6 hover:opacity-80 transition-opacity"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">AccessLearn</span>
          </div>

          <h1 className="text-3xl lg:text-4xl font-black text-white mb-2">
            Find Your Perfect Teacher
          </h1>
          <p className="text-base mb-6" style={{ color: "rgba(255,255,255,0.65)" }}>
            Connect with expert educators from around the world — in any subject, any language.
          </p>

          {/* Search bar */}
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search by name, subject, or keyword…"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white placeholder-white/40 outline-none text-sm"
                style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: showFilters ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
              }}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasFilters && <span className="w-2 h-2 rounded-full bg-violet-400 ml-0.5" />}
            </button>
          </div>

          {/* Filter row */}
          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-3">
              {/* Subject */}
              <div className="relative">
                <select
                  value={filterSubject}
                  onChange={e => setFilterSubject(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm outline-none cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", color: "white" }}
                >
                  <option value="">All Subjects</option>
                  {ALL_SUBJECTS.map(s => <option key={s} value={s} style={{ color: "#0f172a" }}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "rgba(255,255,255,0.5)" }} />
              </div>

              {/* Country */}
              <div className="relative">
                <select
                  value={filterCountry}
                  onChange={e => setFilterCountry(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm outline-none cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", color: "white" }}
                >
                  <option value="">All Countries</option>
                  {countries.map(c => <option key={c} value={c} style={{ color: "#0f172a" }}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "rgba(255,255,255,0.5)" }} />
              </div>

              {/* Teaching style */}
              <div className="relative">
                <select
                  value={filterStyle}
                  onChange={e => setFilterStyle(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm outline-none cursor-pointer"
                  style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", color: "white" }}
                >
                  <option value="">All Styles</option>
                  {Object.entries(STYLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k} style={{ color: "#0f172a" }}>{v}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "rgba(255,255,255,0.5)" }} />
              </div>

              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}
                >
                  <X className="w-3.5 h-3.5" /> Clear all
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Stats bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {loading ? "Searching…" : (
              <>
                <span className="font-bold text-gray-900">{teachers.length}</span> teacher{teachers.length !== 1 ? "s" : ""} found
                {hasFilters && " with current filters"}
              </>
            )}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />
            Sorted by rating
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#7c3aed" }} />
            <p className="text-gray-400 text-sm">Finding great teachers for you…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && teachers.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)" }}>
              <Users className="w-10 h-10" style={{ color: "#7c3aed" }} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No teachers found</h3>
            <p className="text-gray-500 text-sm max-w-sm">
              Try adjusting your filters, or check back soon — new teachers join every day.
            </p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Teacher grid */}
        {!loading && teachers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teachers.map(t => (
              <TeacherCard
                key={t.id}
                teacher={t}
                reqStatus={requestStatuses[t.id] || "idle"}
                myProfile={myProfile}
                onRequest={t2 => setRequestModal(t2)}
                onViewProfile={id => navigate(`/profile/${id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Request Modal ── */}
      {requestModal && (
        <RequestModal
          teacher={requestModal}
          onClose={() => setRequestModal(null)}
          onSend={(msg, subj) => sendRequest(requestModal, msg, subj)}
        />
      )}
    </div>
  );
}
