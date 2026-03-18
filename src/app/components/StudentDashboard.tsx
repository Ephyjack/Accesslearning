import { useState } from "react";
import { useNavigate } from "react-router";
import {
  GraduationCap,
  BookOpen,
  Clock,
  Video,
  FileText,
  CheckCircle2,
  Globe,
  Bell,
  Search,
  Plus,
  Play,
  ChevronRight,
  Users,
  Calendar,
  Layers,
  LogOut,
  Settings,
  Languages,
  Headphones,
  Upload,
  Radio,
  Circle,
  Hash,
} from "lucide-react";

const enrolledClasses = [
  { id: "cls-001", name: "Advanced Biology", teacher: "Dr. Amara Osei", code: "BIO-4821", nextSession: "Today, 3:00 PM", progress: 72, color: "#1e3a8a", pending: 1 },
  { id: "cls-002", name: "World History", teacher: "Prof. James Liu", code: "HIS-2233", nextSession: "Tomorrow, 10:00 AM", progress: 58, color: "#7c3aed", pending: 0 },
  { id: "cls-003", name: "Intro to Python", teacher: "Ms. Sarah Kim", code: "PY-9910", nextSession: "Wed, 2:00 PM", progress: 45, color: "#059669", pending: 2 },
];

const ROOMS = [
  { id: "r1", name: "SS1 Physics Room", teacher: "Dr. Amara Osei", participants: 12, live: true, accessStatus: "approved" },
  { id: "r2", name: "SS2 Chemistry Lab", teacher: "Ms. Sarah Kim", participants: 0, live: false, accessStatus: "none" },
  { id: "r3", name: "Math Extra Class", teacher: "Prof. James Liu", participants: 5, live: true, accessStatus: "pending" },
  { id: "r4", name: "Biology Session", teacher: "Dr. Amara Osei", participants: 0, live: false, accessStatus: "none" },
];

const assignments = [
  { title: "Cell Division Lab Report", class: "Advanced Biology", due: "Mar 15", status: "pending", color: "#1e3a8a" },
  { title: "WW2 Timeline Project", class: "World History", due: "Mar 16", status: "submitted", color: "#7c3aed" },
  { title: "Python Functions Quiz", class: "Intro to Python", due: "Mar 18", status: "pending", color: "#059669" },
  { title: "Mitosis Diagram", class: "Advanced Biology", due: "Mar 20", status: "pending", color: "#1e3a8a" },
];

const recordings = [
  { title: "Lecture 12 – Mitosis & Meiosis", class: "Advanced Biology", date: "Mar 10", duration: "52 min", color: "#1e3a8a" },
  { title: "WWII — Causes & Timeline", class: "World History", date: "Mar 9", duration: "48 min", color: "#7c3aed" },
  { title: "Functions & Scope in Python", class: "Intro to Python", date: "Mar 8", duration: "60 min", color: "#059669" },
];

export function StudentDashboard() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"classes" | "rooms" | "assignments" | "recordings">("classes");
  const [roomStatuses, setRoomStatuses] = useState<Record<string, string>>(
    Object.fromEntries(ROOMS.map((r) => [r.id, r.accessStatus]))
  );
  const [showRequestModal, setShowRequestModal] = useState<null | typeof ROOMS[0]>(null);

  const handleRoomAction = (room: typeof ROOMS[0]) => {
    const status = roomStatuses[room.id];
    if (status === "approved") {
      navigate(`/classroom/${room.id}`);
    } else if (status === "pending") {
      // already pending
    } else {
      setShowRequestModal(room);
    }
  };

  const sendRequest = () => {
    if (showRequestModal) {
      setRoomStatuses((prev) => ({ ...prev, [showRequestModal.id]: "pending" }));
    }
    setShowRequestModal(null);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#f8faff" }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col fixed h-full z-20"
        style={{ background: "linear-gradient(180deg, #0f172a 0%, #1a2d6e 100%)", borderRight: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="p-6 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
              Access<span style={{ color: "#a78bfa" }}>Learn</span>
            </span>
          </div>
          <div
            className="mt-3 text-xs px-2 py-1 rounded-full inline-block"
            style={{ background: "rgba(37,99,235,0.3)", color: "#93c5fd" }}
          >
            Student Account
          </div>
        </div>

        <nav className="flex-1 px-3">
          {[
            { icon: <Layers className="w-4 h-4" />, label: "Dashboard", active: true, action: undefined as (() => void) | undefined },
            { icon: <BookOpen className="w-4 h-4" />, label: "My Classes", active: false, action: undefined as (() => void) | undefined },
            { icon: <Radio className="w-4 h-4" />, label: "Communities", active: false, action: (() => navigate("/community")) as (() => void) },
            { icon: <FileText className="w-4 h-4" />, label: "Assignments", active: false, action: undefined as (() => void) | undefined },
            { icon: <Video className="w-4 h-4" />, label: "Recordings", active: false, action: undefined as (() => void) | undefined },
            { icon: <Languages className="w-4 h-4" />, label: "Transcripts", active: false, action: undefined as (() => void) | undefined },
            { icon: <Headphones className="w-4 h-4" />, label: "Accessibility", active: false, action: undefined as (() => void) | undefined },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm transition-all"
              style={{
                background: item.active ? "rgba(37,99,235,0.25)" : "transparent",
                color: item.active ? "#93c5fd" : "rgba(255,255,255,0.5)",
                fontWeight: item.active ? 600 : 400,
                textAlign: "left",
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm text-white"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)", fontWeight: 700 }}
            >
              YT
            </div>
            <div>
              <div className="text-white text-sm" style={{ fontWeight: 600 }}>Yuki Tanaka</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>yuki@student.edu</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs hover:bg-white/10 transition-all"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs hover:bg-white/10 transition-all"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
              Hello, Yuki 👋
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              You have 1 class today and 3 pending assignments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                placeholder="Search…"
                className="pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#e2e8f0", background: "white", minWidth: 200 }}
              />
            </div>
            <button className="relative p-2.5 rounded-xl bg-white border" style={{ borderColor: "#e2e8f0" }}>
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
            >
              <Plus className="w-4 h-4" />
              Join Class
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {[
            { icon: <BookOpen className="w-5 h-5" />, label: "Enrolled Classes", value: "3", color: "#1e3a8a" },
            { icon: <FileText className="w-5 h-5" />, label: "Pending Assignments", value: "3", color: "#dc2626" },
            { icon: <CheckCircle2 className="w-5 h-5" />, label: "Submitted", value: "12", color: "#059669" },
            { icon: <Video className="w-5 h-5" />, label: "Recordings", value: "18", color: "#7c3aed" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: "1px solid #f1f5f9" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, color: s.color }}>
                {s.icon}
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "#f1f5f9" }}>
          {(["classes", "rooms", "assignments", "recordings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded-lg text-sm capitalize transition-all"
              style={{
                background: activeTab === tab ? "white" : "transparent",
                color: activeTab === tab ? "#0f172a" : "#64748b",
                fontWeight: activeTab === tab ? 600 : 400,
                boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Classes */}
        {activeTab === "classes" && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {enrolledClasses.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                style={{ border: "1px solid #f1f5f9" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: `${cls.color}18`, color: cls.color }}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  {cls.pending > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: "#ef4444" }}>
                      {cls.pending} due
                    </span>
                  )}
                </div>
                <h3 className="mb-0.5" style={{ fontWeight: 700, color: "#0f172a" }}>{cls.name}</h3>
                <p className="text-xs text-gray-400 mb-3">{cls.teacher}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                  <Clock className="w-3.5 h-3.5" />
                  {cls.nextSession}
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">Course Progress</span>
                    <span style={{ color: cls.color, fontWeight: 600 }}>{cls.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "#f1f5f9" }}>
                    <div className="h-full rounded-full" style={{ width: `${cls.progress}%`, background: cls.color }} />
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/classroom/${cls.id}`)}
                  className="w-full py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 hover:opacity-90"
                  style={{ background: cls.color }}
                >
                  <Video className="w-4 h-4" />
                  Join Class
                </button>
              </div>
            ))}
            <div
              className="rounded-2xl p-6 border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: "#cbd5e1", minHeight: 220 }}
              onClick={() => setShowJoinModal(true)}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-sm" style={{ color: "#7c3aed", fontWeight: 600 }}>Join New Class</span>
              <span className="text-xs text-gray-400 text-center">Enter a class code to join a classroom</span>
            </div>
          </div>
        )}

        {/* Tab: Rooms */}
        {activeTab === "rooms" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">
              Persistent rooms are always visible. Request access to join a live session.
            </p>
            {ROOMS.map((room) => {
              const status = roomStatuses[room.id];
              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl p-5 flex items-center gap-5 shadow-sm"
                  style={{ border: "1px solid #f1f5f9" }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: room.live ? "rgba(34,197,94,0.1)" : "#f1f5f9", color: room.live ? "#16a34a" : "#94a3b8" }}
                  >
                    <Radio className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span style={{ fontWeight: 700, color: "#0f172a" }}>{room.name}</span>
                      <span
                        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ background: room.live ? "rgba(34,197,94,0.1)" : "#f1f5f9", color: room.live ? "#16a34a" : "#94a3b8" }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: room.live ? "#22c55e" : "#94a3b8" }} />
                        {room.live ? "Live" : "Offline"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{room.teacher}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{room.participants}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {status === "pending" && (
                      <span
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full animate-pulse"
                        style={{ background: "rgba(251,191,36,0.15)", color: "#d97706" }}
                      >
                        <Circle className="w-3 h-3" />
                        Pending Approval
                      </span>
                    )}
                    {status === "approved" && room.live && (
                      <button
                        onClick={() => handleRoomAction(room)}
                        className="text-xs px-4 py-2 rounded-xl text-white flex items-center gap-1.5"
                        style={{ background: "#16a34a" }}
                      >
                        <Video className="w-3.5 h-3.5" />
                        Enter Room
                      </button>
                    )}
                    {status === "none" && (
                      <button
                        onClick={() => handleRoomAction(room)}
                        className="text-xs px-4 py-2 rounded-xl text-white flex items-center gap-1.5"
                        style={{ background: "#1e3a8a" }}
                      >
                        <Hash className="w-3.5 h-3.5" />
                        Request Access
                      </button>
                    )}
                    {status === "approved" && !room.live && (
                      <span className="text-xs text-gray-400">Offline — check back later</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Assignments */}
        {activeTab === "assignments" && (
          <div className="space-y-3">
            {assignments.map((a, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 flex items-center gap-5 shadow-sm" style={{ border: "1px solid #f1f5f9" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${a.color}15`, color: a.color }}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{a.title}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{a.class}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Due {a.due}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs px-3 py-1 rounded-full"
                    style={{
                      background: a.status === "submitted" ? "#dcfce7" : "#fef3c7",
                      color: a.status === "submitted" ? "#16a34a" : "#d97706",
                    }}
                  >
                    {a.status === "submitted" ? "✓ Submitted" : "Pending"}
                  </span>
                  {a.status === "pending" && (
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white"
                      style={{ background: a.color }}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Submit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Recordings */}
        {activeTab === "recordings" && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {recordings.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow" style={{ border: "1px solid #f1f5f9" }}>
                <div className="h-28 relative flex items-center justify-center" style={{ background: `${r.color}15` }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: r.color }}>
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </div>
                  <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full text-white" style={{ background: "rgba(0,0,0,0.4)" }}>
                    {r.duration}
                  </span>
                </div>
                <div className="p-4">
                  <div className="text-sm mb-1" style={{ fontWeight: 700, color: "#0f172a" }}>{r.title}</div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{r.class}</span>
                    <span>{r.date}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 py-2 rounded-lg text-xs text-white" style={{ background: r.color }}>Watch</button>
                    <button className="flex-1 py-2 rounded-lg text-xs border" style={{ borderColor: "#e2e8f0", color: "#64748b" }}>Transcript</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowJoinModal(false)}
        >
          <div className="bg-white rounded-2xl p-8 shadow-2xl" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
              <Users className="w-7 h-7" />
            </div>
            <h2 className="mb-1" style={{ fontWeight: 800, color: "#0f172a" }}>Join a Classroom</h2>
            <p className="text-sm text-gray-400 mb-6">Enter the class code your teacher shared with you.</p>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. BIO-4821"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-3 text-center tracking-widest"
              style={{ borderColor: "#e2e8f0", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.15em" }}
            />
            <div className="mb-4">
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>Preferred Language</label>
              <select className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={{ borderColor: "#e2e8f0" }}>
                <option>🇯🇵 Japanese</option>
                <option>🇺🇸 English</option>
                <option>🇪🇸 Spanish</option>
                <option>🇫🇷 French</option>
                <option>🇧🇷 Portuguese</option>
                <option>🇩🇪 German</option>
                <option>🇨🇳 Mandarin</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowJoinModal(false)} className="flex-1 py-3 rounded-xl border text-sm" style={{ borderColor: "#e2e8f0", color: "#64748b" }}>
                Cancel
              </button>
              <button
                onClick={() => { setShowJoinModal(false); navigate("/classroom/cls-001"); }}
                className="flex-1 py-3 rounded-xl text-white text-sm"
                style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
              >
                Join Classroom
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request to Join Room Modal */}
      {showRequestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowRequestModal(null)}
        >
          <div className="bg-white rounded-2xl p-8 shadow-2xl" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(30,58,138,0.08)", color: "#1e3a8a" }}>
              <Radio className="w-7 h-7" />
            </div>
            <h2 className="mb-1" style={{ fontWeight: 800, color: "#0f172a" }}>Request to Join</h2>
            <p className="text-sm" style={{ color: "#7c3aed", fontWeight: 600 }}>{showRequestModal.name}</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">
              Your request will be sent to {showRequestModal.teacher}. You'll be admitted once approved.
            </p>
            <div
              className="flex items-center gap-3 rounded-xl p-3 mb-5"
              style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
            >
              <Circle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-700">Status will show as: Pending Approval</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRequestModal(null)} className="flex-1 py-3 rounded-xl border text-sm" style={{ borderColor: "#e2e8f0", color: "#64748b" }}>
                Cancel
              </button>
              <button onClick={sendRequest} className="flex-1 py-3 rounded-xl text-white text-sm" style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}>
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
