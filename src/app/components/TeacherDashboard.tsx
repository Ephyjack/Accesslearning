import { useState } from "react";
import { useNavigate } from "react-router";
import {
  GraduationCap,
  Plus,
  Copy,
  Users,
  BarChart2,
  BookOpen,
  Clock,
  Video,
  MoreVertical,
  Bell,
  Search,
  TrendingUp,
  CheckCircle2,
  FileText,
  Layers,
  LogOut,
  Settings,
  ChevronRight,
  Globe,
  Mic,
  Radio,
  ShieldCheck,
  UserCheck,
  UserX,
  Hash,
  Lock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const engagementData = [
  { day: "Mon", students: 18 },
  { day: "Tue", students: 24 },
  { day: "Wed", students: 21 },
  { day: "Thu", students: 30 },
  { day: "Fri", students: 27 },
  { day: "Sat", students: 14 },
  { day: "Sun", students: 10 },
];

const classes = [
  {
    id: "cls-001",
    name: "Advanced Biology",
    code: "BIO-4821",
    students: 32,
    nextSession: "Today, 3:00 PM",
    language: "EN → 5 langs",
    color: "#1e3a8a",
    status: "active",
    assignments: 4,
  },
  {
    id: "cls-002",
    name: "World History",
    code: "HIS-2233",
    students: 28,
    nextSession: "Tomorrow, 10:00 AM",
    language: "EN → 8 langs",
    color: "#7c3aed",
    status: "active",
    assignments: 2,
  },
  {
    id: "cls-003",
    name: "Intro to Python",
    code: "PY-9910",
    students: 45,
    nextSession: "Wed, 2:00 PM",
    language: "EN → 12 langs",
    color: "#059669",
    status: "idle",
    assignments: 6,
  },
  {
    id: "cls-004",
    name: "Art & Culture",
    code: "ART-7741",
    students: 19,
    nextSession: "Thu, 11:00 AM",
    language: "EN → 3 langs",
    color: "#d97706",
    status: "idle",
    assignments: 1,
  },
];

const recentAssignments = [
  { title: "Cell Division Lab Report", class: "Advanced Biology", due: "Mar 15", submissions: 18, total: 32 },
  { title: "WW2 Essay", class: "World History", due: "Mar 16", submissions: 24, total: 28 },
  { title: "Python Functions Quiz", class: "Intro to Python", due: "Mar 18", submissions: 10, total: 45 },
];

const ROOMS = [
  { id: "r1", name: "SS1 Physics Room", participants: 12, live: true, sessions: 24, pendingCount: 3 },
  { id: "r2", name: "SS2 Chemistry Lab", participants: 0, live: false, sessions: 18, pendingCount: 0 },
  { id: "r3", name: "Math Extra Class", participants: 5, live: true, sessions: 31, pendingCount: 1 },
  { id: "r4", name: "Biology Session", participants: 0, live: false, sessions: 12, pendingCount: 0 },
];

const INIT_REQUESTS = [
  { id: "jq1", name: "Amina Osei", avatar: "AO", room: "SS1 Physics Room", time: "Just now", status: "pending" },
  { id: "jq2", name: "Carlos Vega", avatar: "CV", room: "SS1 Physics Room", time: "2 min ago", status: "pending" },
  { id: "jq3", name: "Nadia Petrov", avatar: "NP", room: "Math Extra Class", time: "5 min ago", status: "pending" },
  { id: "jq4", name: "Liu Wei", avatar: "LW", room: "SS1 Physics Room", time: "10 min ago", status: "approved" },
  { id: "jq5", name: "Erik Müller", avatar: "EM", room: "Biology Session", time: "12 min ago", status: "blocked" },
];

export function TeacherDashboard() {
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [requests, setRequests] = useState(INIT_REQUESTS);
  const [activeTab, setActiveTab] = useState<"classes" | "rooms">("classes");

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRequest = (id: string, action: "approved" | "blocked") => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)));
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="min-h-screen flex" style={{ background: "#f8faff" }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col fixed h-full z-20"
        style={{
          background: "linear-gradient(180deg, #0f172a 0%, #1a2d6e 100%)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Logo */}
        <div className="p-6 mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
              Access<span style={{ color: "#a78bfa" }}>Learn</span>
            </span>
          </div>
          <div
            className="mt-3 text-xs px-2 py-1 rounded-full inline-block"
            style={{ background: "rgba(124,58,237,0.25)", color: "#c4b5fd" }}
          >
            Teacher Account
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3">
          {[
            { icon: <Layers className="w-4 h-4" />, label: "Dashboard", active: true, action: undefined as (() => void) | undefined },
            { icon: <BookOpen className="w-4 h-4" />, label: "My Classes", active: false, action: undefined as (() => void) | undefined },
            { icon: <Radio className="w-4 h-4" />, label: "Communities", active: false, action: (() => navigate("/community")) as (() => void) },
            { icon: <FileText className="w-4 h-4" />, label: "Assignments", active: false, action: undefined as (() => void) | undefined },
            { icon: <BarChart2 className="w-4 h-4" />, label: "Analytics", active: false, action: undefined as (() => void) | undefined },
            { icon: <ShieldCheck className="w-4 h-4" />, label: "Access Control", active: false, action: (() => setShowAccessModal(true)) as (() => void) },
            { icon: <Mic className="w-4 h-4" />, label: "Recordings", active: false, action: undefined as (() => void) | undefined },
            { icon: <Globe className="w-4 h-4" />, label: "Languages", active: false, action: undefined as (() => void) | undefined },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm transition-all"
              style={{
                background: item.active ? "rgba(124,58,237,0.25)" : "transparent",
                color: item.active ? "#c4b5fd" : "rgba(255,255,255,0.5)",
                fontWeight: item.active ? 600 : 400,
                textAlign: "left",
              }}
            >
              {item.icon}
              {item.label}
              {item.label === "Access Control" && pendingCount > 0 && (
                <span
                  className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-white animate-pulse"
                  style={{ background: "#ef4444", fontSize: "0.65rem", fontWeight: 700 }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm text-white"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)", fontWeight: 700 }}
            >
              SM
            </div>
            <div>
              <div className="text-white text-sm" style={{ fontWeight: 600 }}>Sofia Mendez</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>sofia@school.edu</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-all hover:bg-white/10"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs transition-all hover:bg-white/10"
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
              Good afternoon, Sofia 👋
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">You have 2 classes scheduled today</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                placeholder="Search classes…"
                className="pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#e2e8f0", background: "white", minWidth: 220 }}
              />
            </div>
            <button
              onClick={() => setShowAccessModal(true)}
              className="relative p-2.5 rounded-xl bg-white border"
              style={{ borderColor: "#e2e8f0" }}
            >
              <Bell className="w-5 h-5 text-gray-500" />
              {pendingCount > 0 && (
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse"
                  style={{ background: "#ef4444" }}
                />
              )}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
            >
              <Plus className="w-4 h-4" />
              Create Classroom
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {[
            { icon: <Users className="w-5 h-5" />, label: "Total Students", value: "124", change: "+8 this week", color: "#1e3a8a" },
            { icon: <BookOpen className="w-5 h-5" />, label: "Active Classes", value: "4", change: "2 live today", color: "#7c3aed" },
            { icon: <TrendingUp className="w-5 h-5" />, label: "Avg. Engagement", value: "86%", change: "+4% vs last week", color: "#059669" },
            { icon: <CheckCircle2 className="w-5 h-5" />, label: "Assignments Due", value: "13", change: "3 need grading", color: "#d97706" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: "1px solid #f1f5f9" }}>
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}15`, color: stat.color }}
                >
                  {stat.icon}
                </div>
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>{stat.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
              <div className="text-xs mt-1" style={{ color: stat.color }}>{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Tab toggle */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex p-1 rounded-xl" style={{ background: "#f1f5f9" }}>
            {(["classes", "rooms"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="px-5 py-2 rounded-lg text-sm capitalize transition-all"
                style={{
                  background: activeTab === t ? "white" : "transparent",
                  color: activeTab === t ? "#0f172a" : "#64748b",
                  fontWeight: activeTab === t ? 600 : 400,
                  boxShadow: activeTab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {t === "classes" ? "Classrooms" : "Persistent Rooms"}
              </button>
            ))}
          </div>
          {activeTab === "rooms" && (
            <button
              onClick={() => setShowCreateRoomModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
            >
              <Plus className="w-4 h-4" />
              New Room
            </button>
          )}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: classes or rooms */}
          <div className="lg:col-span-2 space-y-4">
            {activeTab === "classes" ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>My Classrooms</h2>
                  <button className="text-xs text-violet-600 flex items-center gap-1">
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                    style={{ border: "1px solid #f1f5f9" }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${cls.color}18`, color: cls.color }}
                        >
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{cls.name}</span>
                            {cls.status === "active" && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#16a34a" }}>
                                Scheduled Today
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />{cls.students} students
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />{cls.nextSession}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Globe className="w-3.5 h-3.5" />{cls.language}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Class Code:</span>
                        <code className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "#f1f5f9", color: "#0f172a", fontWeight: 600 }}>
                          {cls.code}
                        </code>
                        <button onClick={() => copyCode(cls.code)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                          {copiedCode === cls.code ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                          style={{ borderColor: "#e2e8f0", color: "#64748b" }}
                        >
                          Assignments ({cls.assignments})
                        </button>
                        <button
                          onClick={() => navigate(`/classroom/${cls.id}`)}
                          className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5 transition-all hover:opacity-90"
                          style={{ background: cls.color }}
                        >
                          <Video className="w-3.5 h-3.5" />
                          Start Class
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>Persistent Rooms</h2>
                  <span className="text-xs text-gray-400">Always visible, even when offline</span>
                </div>
                {ROOMS.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                    style={{ border: "1px solid #f1f5f9" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: room.live ? "rgba(34,197,94,0.1)" : "#f1f5f9", color: room.live ? "#16a34a" : "#94a3b8" }}
                        >
                          <Radio className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{room.name}</span>
                            <span
                              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                              style={{ background: room.live ? "rgba(34,197,94,0.1)" : "#f1f5f9", color: room.live ? "#16a34a" : "#94a3b8" }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: room.live ? "#22c55e" : "#94a3b8" }} />
                              {room.live ? "Live" : "Offline"}
                            </span>
                            {room.pendingCount > 0 && (
                              <span
                                className="text-xs px-2 py-0.5 rounded-full animate-pulse"
                                style={{ background: "rgba(251,191,36,0.15)", color: "#d97706" }}
                              >
                                {room.pendingCount} waiting
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />{room.participants} participants
                            </span>
                            <span className="text-xs text-gray-400">{room.sessions} sessions total</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {room.pendingCount > 0 && (
                          <button
                            onClick={() => setShowAccessModal(true)}
                            className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                            style={{ background: "rgba(251,191,36,0.1)", color: "#d97706" }}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Requests
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/classroom/${room.id}`)}
                          className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5 hover:opacity-90"
                          style={{ background: room.live ? "#16a34a" : "#1e3a8a" }}
                        >
                          <Video className="w-3.5 h-3.5" />
                          {room.live ? "Enter Room" : "Start Class"}
                        </button>
                        <button
                          className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-red-50 transition-colors"
                          style={{ border: "1px solid #fecaca", color: "#ef4444" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Right col */}
          <div className="space-y-5">
            {/* Engagement chart */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: "1px solid #f1f5f9" }}>
              <h3 className="mb-4" style={{ fontWeight: 700, color: "#0f172a" }}>Weekly Attendance</h3>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={engagementData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="students" stroke="#7c3aed" strokeWidth={2} fill="url(#gradBlue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Assignments panel */}
            <div className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: "1px solid #f1f5f9" }}>
              <h3 className="mb-4" style={{ fontWeight: 700, color: "#0f172a" }}>Recent Assignments</h3>
              <div className="space-y-4">
                {recentAssignments.map((a) => (
                  <div key={a.title}>
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <div className="text-sm" style={{ fontWeight: 600, color: "#0f172a" }}>{a.title}</div>
                        <div className="text-xs text-gray-400">{a.class} · Due {a.due}</div>
                      </div>
                      <span className="text-xs text-gray-500">{a.submissions}/{a.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#f1f5f9" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(a.submissions / a.total) * 100}%`, background: "linear-gradient(90deg, #1e3a8a, #7c3aed)" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Communities shortcut */}
            <div
              className="rounded-2xl p-5"
              style={{ background: "linear-gradient(135deg, #0f172a, #1e3a8a)" }}
            >
              <h3 className="text-white mb-1" style={{ fontWeight: 700 }}>Communities</h3>
              <p className="text-xs text-blue-300 mb-4">Your active learning communities</p>
              {[
                { name: "LSU Science Dept.", code: "c1", color: "#1e3a8a", type: "school", unread: 3 },
                { name: "Global Physics Hub", code: "c2", color: "#7c3aed", type: "public", unread: 0 },
              ].map((c) => (
                <button
                  key={c.code}
                  onClick={() => navigate(`/community/${c.code}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1.5 transition-all hover:bg-white/10 text-left"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white shrink-0"
                    style={{ background: c.color, fontWeight: 700 }}
                  >
                    {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs truncate" style={{ fontWeight: 600 }}>{c.name}</div>
                    <div className="text-blue-400 text-xs capitalize">{c.type}</div>
                  </div>
                  {c.unread > 0 && (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                      style={{ background: "#7c3aed", fontSize: "0.6rem", fontWeight: 700 }}
                    >
                      {c.unread}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={() => navigate("/community")}
                className="w-full mt-2 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
              >
                View all communities <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Modals ── */}

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowCreateModal(false)}
        >
          <div className="bg-white rounded-2xl p-8 shadow-2xl" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2" style={{ fontWeight: 800, color: "#0f172a" }}>Create New Classroom</h2>
            <p className="text-sm text-gray-400 mb-6">Students will join using the auto-generated class code.</p>
            <div className="mb-4">
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>Class Name</label>
              <input
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="e.g. Introduction to Chemistry"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#e2e8f0" }}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>Primary Language</label>
              <select className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={{ borderColor: "#e2e8f0" }}>
                <option>English</option>
                <option>Spanish</option>
                <option>French</option>
                <option>Mandarin</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 rounded-xl border text-sm"
                style={{ borderColor: "#e2e8f0", color: "#64748b" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowCreateModal(false); navigate("/classroom/cls-new"); }}
                className="flex-1 py-3 rounded-xl text-white text-sm"
                style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
              >
                Create & Open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateRoomModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowCreateRoomModal(false)}
        >
          <div className="bg-white rounded-2xl p-8 shadow-2xl" style={{ width: 460 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2" style={{ fontWeight: 800, color: "#0f172a" }}>Create Persistent Room</h2>
            <p className="text-sm text-gray-400 mb-6">Rooms stay visible to students even when offline. Only you can start a session.</p>
            <div className="mb-4">
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>Room Name</label>
              <input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. SS1 Physics Room"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#e2e8f0" }}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>Access Control</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Open — anyone in community", icon: <Hash className="w-4 h-4" /> },
                  { label: "Approval required", icon: <Lock className="w-4 h-4" /> },
                ].map((opt, i) => (
                  <button
                    key={i}
                    className="flex items-center gap-2 p-3 rounded-xl border text-xs text-left"
                    style={{ borderColor: i === 1 ? "#7c3aed" : "#e2e8f0", color: i === 1 ? "#7c3aed" : "#64748b" }}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateRoomModal(false)}
                className="flex-1 py-3 rounded-xl border text-sm"
                style={{ borderColor: "#e2e8f0", color: "#64748b" }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateRoomModal(false)}
                className="flex-1 py-3 rounded-xl text-white text-sm"
                style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Management Modal */}
      {showAccessModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowAccessModal(false)}
        >
          <div className="bg-white rounded-2xl p-7 shadow-2xl" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontWeight: 800, color: "#0f172a" }}>Access Management</h2>
              {pendingCount > 0 && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full animate-pulse"
                  style={{ background: "rgba(251,191,36,0.15)", color: "#d97706" }}
                >
                  {pendingCount} pending
                </span>
              )}
            </div>

            <div className="flex gap-2 mb-5">
              {[
                { label: "All", count: requests.length },
                { label: "Pending", count: requests.filter((r) => r.status === "pending").length },
                { label: "Approved", count: requests.filter((r) => r.status === "approved").length },
                { label: "Blocked", count: requests.filter((r) => r.status === "blocked").length },
              ].map((f) => (
                <span
                  key={f.label}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{ background: "#f1f5f9", color: "#64748b" }}
                >
                  {f.label} ({f.count})
                </span>
              ))}
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{
                    background: req.status === "pending" ? "#fffbeb" : req.status === "approved" ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${req.status === "pending" ? "#fde68a" : req.status === "approved" ? "#bbf7d0" : "#fecaca"}`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-white shrink-0"
                    style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)", fontWeight: 700 }}
                  >
                    {req.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm" style={{ fontWeight: 700, color: "#0f172a" }}>{req.name}</div>
                    <div className="text-xs text-gray-400">→ {req.room} · {req.time}</div>
                  </div>
                  <div
                    className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{
                      background: req.status === "pending" ? "rgba(251,191,36,0.2)" : req.status === "approved" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                      color: req.status === "pending" ? "#d97706" : req.status === "approved" ? "#16a34a" : "#ef4444",
                    }}
                  >
                    {req.status}
                  </div>
                  {req.status === "pending" && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleRequest(req.id, "approved")}
                        className="p-1.5 rounded-lg transition-colors hover:bg-green-100"
                        style={{ color: "#16a34a" }}
                        title="Approve"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRequest(req.id, "blocked")}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-100"
                        style={{ color: "#ef4444" }}
                        title="Deny"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAccessModal(false)}
              className="w-full mt-5 py-3 rounded-xl text-white text-sm"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
