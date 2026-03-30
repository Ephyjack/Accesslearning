import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { supabase } from "./supabaseClient";
import {
  GraduationCap, ArrowLeft, MapPin, BookOpen, Star,
  Send, CheckCircle2, Loader2, Globe, Users, Video,
  MessageSquare, Radio, X, Copy, Check, ExternalLink,
  Award, ShieldCheck, Activity
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = ["#7c3aed", "#2563eb", "#059669", "#dc2626", "#d97706", "#0891b2"];
const pickColor = (s: string) => COLORS[(s?.charCodeAt(0) ?? 0) % COLORS.length];

const STYLE_LABELS: Record<string, { label: string; icon: string; desc: string }> = {
  interactive: { label: "Interactive", icon: "💬", desc: "Q&A and discussions" },
  lecture: { label: "Lecture-based", icon: "📢", desc: "Structured delivery" },
  project: { label: "Project-based", icon: "🔨", desc: "Hands-on learning" },
  socratic: { label: "Socratic", icon: "🤔", desc: "Question-driven" },
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className="w-4 h-4"
          fill={n <= Math.round(rating) ? "#f59e0b" : "none"}
          stroke={n <= Math.round(rating) ? "#f59e0b" : "#d1d5db"}
        />
      ))}
    </div>
  );
}

// ─── Request Modal ──────────────────────────────────────────────────────────
function RequestModal({
  teacher,
  onClose,
  onSend,
}: {
  teacher: any;
  onClose: () => void;
  onSend: (msg: string, subjects: string[]) => void;
}) {
  const [msg, setMsg] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const subjects: string[] = teacher.subjects || [];

  const toggleSubject = (s: string) =>
    setSelectedSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );

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
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 text-lg">Request to Learn</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {subjects.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Subjects you're interested in</label>
              <div className="flex flex-wrap gap-2">
                {subjects.map(s => (
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

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your message <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder={`Hi ${teacher.full_name?.split(" ")[0]}, I'd love to connect and learn from you…`}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: msg ? "#7c3aed" : "#e2e8f0" }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#e2e8f0" }}
            >
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

// ─── Main Component ───────────────────────────────────────────────────────────
export function PublicTeacherProfile() {
  const navigate = useNavigate();
  const { id: teacherId } = useParams<{ id: string }>();

  const [myProfile, setMyProfile] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [reqStatus, setReqStatus] = useState<"idle" | "pending" | "accepted" | "declined" | "sending">("idle");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // ── Load my profile ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { navigate("/"); return; }
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (prof) setMyProfile(prof);

      // Existing request status
      if (teacherId) {
        const { data: req } = await supabase
          .from("teacher_requests")
          .select("status")
          .eq("student_id", user.id)
          .eq("teacher_id", teacherId)
          .single();
        if (req) setReqStatus(req.status as any);
      }
    })();
  }, [navigate, teacherId]);

  // ── Load teacher data ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!teacherId) return;
    (async () => {
      setLoading(true);
      const { data: t, error } = await supabase
        .from("profiles")
        .select("id, full_name, bio, avatar_url, country, school, subjects, teaching_style, rating, review_count, is_public")
        .eq("id", teacherId)
        .eq("role", "teacher")
        .single();

      if (error || !t) { setNotFound(true); setLoading(false); return; }
      setTeacher(t);

      // Communities this teacher manages
      const { data: comms } = await supabase
        .from("community_members")
        .select("communities(id, name, avatar, color, type, description, created_by)")
        .eq("user_id", teacherId)
        .eq("role", "admin");
      if (comms) setCommunities(comms.map((m: any) => m.communities).filter(Boolean));

      // Public rooms by this teacher
      const { data: rms } = await supabase
        .from("rooms")
        .select("id, name, language, status, is_private, code")
        .eq("teacher_id", teacherId)
        .eq("is_private", false)
        .order("created_at", { ascending: false })
        .limit(6);
      if (rms) setRooms(rms);

      setLoading(false);
    })();
  }, [teacherId]);

  // ── Send request ────────────────────────────────────────────────────────────
  const sendRequest = async (message: string, subjects: string[]) => {
    if (!myProfile || !teacherId) return;
    setReqStatus("sending");
    setShowRequestModal(false);

    const { error } = await supabase.from("teacher_requests").upsert({
      student_id: myProfile.id,
      teacher_id: teacherId,
      message: message.trim() || null,
      subjects: subjects.length > 0 ? subjects : null,
      status: "pending",
      updated_at: new Date().toISOString(),
    }, { onConflict: "student_id,teacher_id" });

    if (!error) {
      await supabase.from("notifications").insert({
        user_id: teacherId,
        actor_id: myProfile.id,
        type: "request_received",
        message: `${myProfile.full_name} sent you a request to learn.`,
        link: "/teacher?tab=requests"
      });
    }

    setReqStatus(error ? "idle" : "pending");
    if (error) alert("Failed to send request: " + error.message);
  };

  const cancelRequest = async () => {
    if (!myProfile || !teacherId) return;
    if (!confirm("Are you sure you want to cancel this request?")) return;
    setReqStatus("sending");

    const { error } = await supabase
      .from("teacher_requests")
      .delete()
      .eq("student_id", myProfile.id)
      .eq("teacher_id", teacherId);

    if (error) {
      alert("Failed to cancel request: " + error.message);
      setReqStatus("pending");
    } else {
      setReqStatus("idle");
    }
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8faff" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#7c3aed" }} />
          <p className="text-gray-400 text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  // ── Not found ───────────────────────────────────────────────────────────────
  if (notFound || !teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8faff" }}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-4" style={{ background: "rgba(124,58,237,0.08)" }}>
            <Users className="w-10 h-10" style={{ color: "#7c3aed" }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Teacher not found</h2>
          <p className="text-gray-500 text-sm mb-6">This profile may be private or doesn't exist.</p>
          <button onClick={() => navigate("/explore/teachers")} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}>
            Browse Teachers
          </button>
        </div>
      </div>
    );
  }

  const color = pickColor(teacher.full_name);
  const initials = teacher.full_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const style = teacher.teaching_style ? STYLE_LABELS[teacher.teaching_style] : null;
  const isSelf = myProfile?.id === teacher.id;

  const requestButton = () => {
    if (isSelf) return null;
    if (reqStatus === "sending") return (
      <button disabled className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>
        <Loader2 className="w-4 h-4 animate-spin" /> Sending…
      </button>
    );
    if (reqStatus === "pending") return (
      <button
        onClick={cancelRequest}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
      >
        <X className="w-3.5 h-3.5" /> Cancel Request
      </button>
    );
    if (reqStatus === "accepted") return (
      <button disabled className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>
        <CheckCircle2 className="w-4 h-4" /> Connected!
      </button>
    );
    return (
      <button
        onClick={() => setShowRequestModal(true)}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}
      >
        <Send className="w-4 h-4" /> Request to Learn
      </button>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8faff", fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* ── Hero ── */}
      <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a8a 60%,#4c1d95 100%)", paddingBottom: "80px" }}>
        <div className="max-w-4xl mx-auto px-4 pt-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </button>
              <button
                onClick={() => navigate("/explore/teachers")}
                className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                <Users className="w-4 h-4" /> All Teachers
              </button>
            </div>
            <button
              onClick={copyProfileLink}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedId ? "Copied!" : "Share Profile"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Profile Card (overlaps hero) ── */}
      <div className="max-w-4xl mx-auto px-4" style={{ marginTop: "-64px" }}>
        <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 mb-6" style={{ border: "1px solid #f1f5f9" }}>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0 overflow-hidden"
              style={{ background: teacher.avatar_url ? "transparent" : color, border: "4px solid white", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
            >
              {teacher.avatar_url
                ? <img src={teacher.avatar_url} alt={teacher.full_name} className="w-full h-full object-cover" />
                : initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 mb-1">{teacher.full_name}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-3">
                    {teacher.school && (
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-gray-400" />{teacher.school}
                      </span>
                    )}
                    {teacher.country && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />{teacher.country}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Stars rating={teacher.rating || 0} />
                    <span className="text-sm text-gray-500">{(teacher.rating || 0).toFixed(1)} · {teacher.review_count || 0} reviews</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {requestButton()}
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {teacher.bio && (
            <div className="mt-6 pt-6" style={{ borderTop: "1px solid #f1f5f9" }}>
              <h3 className="text-sm font-bold text-gray-900 mb-2">About</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{teacher.bio}</p>
            </div>
          )}

          {/* Teaching style */}
          {style && (
            <div className="mt-5 flex items-center gap-3 p-4 rounded-xl" style={{ background: "rgba(124,58,237,0.04)", border: "1px solid rgba(124,58,237,0.1)" }}>
              <div className="text-2xl">{style.icon}</div>
              <div>
                <div className="text-sm font-bold text-gray-900">{style.label} Teaching</div>
                <div className="text-xs text-gray-500">{style.desc}</div>
              </div>
            </div>
          )}

          {/* Subjects */}
          {teacher.subjects && teacher.subjects.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Subjects Taught</h3>
              <div className="flex flex-wrap gap-2">
                {teacher.subjects.map((s: string) => (
                  <span
                    key={s}
                    className="text-sm px-3 py-1.5 rounded-full font-medium"
                    style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Communities ── */}
        {communities.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6" style={{ border: "1px solid #f1f5f9" }}>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Radio className="w-5 h-5" style={{ color: "#7c3aed" }} /> Communities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {communities.map((c: any) => (
                <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors" style={{ border: "1px solid #f1f5f9" }}>
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shrink-0 text-sm"
                    style={{ background: c.color || color }}
                  >
                    {c.avatar || c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 truncate text-sm">{c.name}</div>
                    {c.description && <div className="text-xs text-gray-500 truncate">{c.description}</div>}
                    <div className="text-xs capitalize mt-0.5" style={{ color: "#7c3aed" }}>{c.type} community</div>
                  </div>
                  <button
                    onClick={() => navigate(`/community/${c.id}`)}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ background: c.color || color }}
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Verifications & Badges ── */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6" style={{ border: "1px solid #f1f5f9" }}>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" style={{ color: "#d97706" }} /> Verifications & Badges
          </h2>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(5,150,105,0.06)", border: "1px solid rgba(5,150,105,0.15)" }}>
              <ShieldCheck className="w-4 h-4" style={{ color: "#059669" }} />
              <div className="text-sm font-semibold" style={{ color: "#064e3b" }}>Verified Educator</div>
            </div>
            {teacher.rating >= 4.5 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.15)" }}>
                <Star className="w-4 h-4" style={{ color: "#d97706" }} />
                <div className="text-sm font-semibold" style={{ color: "#78350f" }}>Top Rated Tutor</div>
              </div>
            )}
            {communities.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
                <Activity className="w-4 h-4" style={{ color: "#7c3aed" }} />
                <div className="text-sm font-semibold" style={{ color: "#4c1d95" }}>Active Community Leader</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Open Rooms ── */}
        {rooms.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6" style={{ border: "1px solid #f1f5f9" }}>
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Video className="w-5 h-5" style={{ color: "#2563eb" }} /> Open Rooms
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center gap-4 p-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ border: "1px solid #f1f5f9" }}
                  onClick={() => navigate(`/classroom/${r.id}`)}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: r.status === "live" ? "rgba(5,150,105,0.1)" : "rgba(30,58,138,0.08)" }}>
                    <Video className="w-5 h-5" style={{ color: r.status === "live" ? "#059669" : "#1e3a8a" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 truncate text-sm">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.language}</div>
                  </div>
                  {r.status === "live" && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold shrink-0" style={{ background: "rgba(5,150,105,0.1)", color: "#059669" }}>● LIVE</span>
                  )}
                  <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state if no communities/rooms ── */}
        {communities.length === 0 && rooms.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center mb-6" style={{ border: "1px solid #f1f5f9" }}>
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">This teacher doesn't have any public communities or rooms yet.</p>
            {!isSelf && (
              <p className="text-xs text-gray-400 mt-2">Send a request to learn from them directly!</p>
            )}
          </div>
        )}

        <div className="pb-8 text-center">
          <button
            onClick={() => navigate("/explore/teachers")}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Browse more teachers
          </button>
        </div>
      </div>

      {/* ── Request Modal ── */}
      {showRequestModal && (
        <RequestModal
          teacher={teacher}
          onClose={() => setShowRequestModal(false)}
          onSend={sendRequest}
        />
      )}
    </div>
  );
}
