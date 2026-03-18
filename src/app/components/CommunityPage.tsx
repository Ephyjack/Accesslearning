import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  GraduationCap,
  Hash,
  Bell,
  Lock,
  Users,
  Plus,
  Search,
  Settings,
  LogOut,
  ChevronDown,
  BookOpen,
  Mic,
  MicOff,
  Headphones,
  Video,
  Circle,
  Send,
  Smile,
  Paperclip,
  MoreVertical,
  Star,
  Shield,
  Crown,
  Globe,
  UserPlus,
  Radio,
} from "lucide-react";

type Role = "teacher" | "student" | "admin";

const COMMUNITIES = [
  { id: "c1", name: "LSU Science Dept.", avatar: "LS", color: "#1e3a8a", unread: 3, type: "school" },
  { id: "c2", name: "Global Physics Hub", avatar: "GP", color: "#7c3aed", unread: 0, type: "public" },
  { id: "c3", name: "SS1 Study Group", avatar: "SS", color: "#059669", unread: 7, type: "private" },
  { id: "c4", name: "Math Olympiad", avatar: "MO", color: "#d97706", unread: 1, type: "public" },
];

const CHANNELS = {
  text: [
    { id: "ch1", name: "general", unread: 2, locked: false },
    { id: "ch2", name: "announcements", unread: 0, locked: false },
    { id: "ch3", name: "assignments", unread: 1, locked: false },
    { id: "ch4", name: "teacher-lounge", unread: 0, locked: true },
    { id: "ch5", name: "exam-prep", unread: 0, locked: false },
  ],
  rooms: [
    { id: "r1", name: "SS1 Physics Room", teacher: "Dr. Amara Osei", participants: 12, live: true },
    { id: "r2", name: "SS2 Chemistry Lab", teacher: "Ms. Sarah Kim", participants: 0, live: false },
    { id: "r3", name: "Math Extra Class", teacher: "Prof. James Liu", participants: 5, live: true },
    { id: "r4", name: "Biology Session", teacher: "Dr. Amara Osei", participants: 0, live: false },
  ],
};

const MEMBERS = [
  { name: "Dr. Amara Osei", role: "teacher" as Role, status: "online", avatar: "AO" },
  { name: "Prof. James Liu", role: "teacher" as Role, status: "online", avatar: "JL" },
  { name: "Ms. Sarah Kim", role: "admin" as Role, status: "online", avatar: "SK" },
  { name: "Yuki Tanaka", role: "student" as Role, status: "online", avatar: "YT" },
  { name: "Maria Santos", role: "student" as Role, status: "online", avatar: "MS" },
  { name: "Raj Patel", role: "student" as Role, status: "idle", avatar: "RP" },
  { name: "Liu Wei", role: "student" as Role, status: "offline", avatar: "LW" },
  { name: "Erik Müller", role: "student" as Role, status: "online", avatar: "EM" },
  { name: "Fatima Al-Zahra", role: "student" as Role, status: "offline", avatar: "FA" },
  { name: "Lucas Dupont", role: "student" as Role, status: "online", avatar: "LD" },
];

const MESSAGES = [
  { user: "Dr. Amara Osei", role: "teacher" as Role, avatar: "AO", time: "09:14", text: "Good morning class! Don't forget that your lab reports are due tomorrow.", color: "#1e3a8a" },
  { user: "Yuki Tanaka", role: "student" as Role, avatar: "YT", time: "09:17", text: "Good morning, Dr. Osei. Can we submit a PDF or do we need to print it?", color: "#7c3aed" },
  { user: "Dr. Amara Osei", role: "teacher" as Role, avatar: "AO", time: "09:18", text: "PDF submission is perfectly fine. Upload it through the Assignments tab on the classroom page.", color: "#1e3a8a" },
  { user: "Maria Santos", role: "student" as Role, avatar: "MS", time: "09:22", text: "Will there be an extra class this week to review the diagrams?", color: "#059669" },
  { user: "Dr. Amara Osei", role: "teacher" as Role, avatar: "AO", time: "09:24", text: "Yes! Check the SS1 Physics Room — I'll open a live session at 3PM today.", color: "#1e3a8a" },
  { user: "Erik Müller", role: "student" as Role, avatar: "EM", time: "09:31", text: "🙌 Thanks, see you then!", color: "#d97706" },
];

const JOIN_REQUESTS = [
  { name: "Amina Osei", avatar: "AO", room: "SS1 Physics Room", time: "Just now" },
  { name: "Carlos Vega", avatar: "CV", room: "SS1 Physics Room", time: "2 min ago" },
  { name: "Nadia Petrov", avatar: "NP", room: "Math Extra Class", time: "5 min ago" },
];

const roleBadge = (role: Role) => {
  if (role === "admin") return { label: "Admin", color: "#dc2626", icon: <Crown className="w-3 h-3" /> };
  if (role === "teacher") return { label: "Teacher", color: "#1e3a8a", icon: <Shield className="w-3 h-3" /> };
  return { label: "Student", color: "#7c3aed", icon: <Star className="w-3 h-3" /> };
};

const statusColor = (status: string) => {
  if (status === "online") return "#22c55e";
  if (status === "idle") return "#f59e0b";
  return "#6b7280";
};

export function CommunityPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Treat the viewer as a teacher for demo purposes
  const viewerRole: Role = "teacher";

  const [activeCommunity, setActiveCommunity] = useState(id || "c1");
  const [activeChannel, setActiveChannel] = useState("ch1");
  const [micOn, setMicOn] = useState(false);
  const [headphonesOn, setHeadphonesOn] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState(MESSAGES);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState<null | typeof CHANNELS.rooms[0]>(null);
  const [joinRequests, setJoinRequests] = useState(JOIN_REQUESTS);
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  const [pendingRooms, setPendingRooms] = useState<string[]>([]);

  const community = COMMUNITIES.find((c) => c.id === activeCommunity) || COMMUNITIES[0];
  const channel = CHANNELS.text.find((c) => c.id === activeChannel) || CHANNELS.text[0];

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      { user: "You (Sofia Mendez)", role: "teacher", avatar: "SM", time: "09:35", text: chatInput, color: "#059669" },
    ]);
    setChatInput("");
  };

  const approveRequest = (idx: number) => {
    setJoinRequests((prev) => prev.filter((_, i) => i !== idx));
  };

  const denyRequest = (idx: number) => {
    setJoinRequests((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleJoinRoom = (room: typeof CHANNELS.rooms[0]) => {
    if (viewerRole === "teacher") {
      navigate(`/classroom/${room.id}`);
    } else {
      if (pendingRooms.includes(room.id)) return;
      setShowJoinRoomModal(room);
    }
  };

  const submitJoinRequest = () => {
    if (showJoinRoomModal) {
      setPendingRooms((prev) => [...prev, showJoinRoomModal.id]);
    }
    setShowJoinRoomModal(null);
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: "#0f172a" }}>

      {/* ── FAR LEFT: Community icon rail (Discord-style) ── */}
      <div
        className="w-16 flex flex-col items-center py-4 gap-3 shrink-0"
        style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}
      >
        {/* Home */}
        <button
          onClick={() => navigate("/teacher")}
          className="w-10 h-10 rounded-2xl flex items-center justify-center hover:rounded-xl transition-all"
          style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
          title="Dashboard"
        >
          <GraduationCap className="w-5 h-5 text-white" />
        </button>

        <div className="w-8 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />

        {/* Communities */}
        {COMMUNITIES.map((c) => (
          <div key={c.id} className="relative">
            {c.unread > 0 && (
              <span
                className="absolute -right-1 -top-1 w-4 h-4 rounded-full flex items-center justify-center text-white z-10"
                style={{ background: "#ef4444", fontSize: "0.6rem", fontWeight: 700 }}
              >
                {c.unread}
              </span>
            )}
            <button
              onClick={() => setActiveCommunity(c.id)}
              title={c.name}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs text-white transition-all hover:rounded-xl"
              style={{
                background: activeCommunity === c.id ? c.color : "rgba(255,255,255,0.08)",
                fontWeight: 700,
                outline: activeCommunity === c.id ? `3px solid ${c.color}` : "none",
                outlineOffset: 2,
              }}
            >
              {c.avatar}
            </button>
          </div>
        ))}

        <div className="w-8 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />

        {/* Add community */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center hover:rounded-xl transition-all hover:bg-green-500/20"
          style={{ background: "rgba(255,255,255,0.06)", color: "#4ade80" }}
          title="Create Community"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Join with code */}
        <button
          onClick={() => setShowJoinModal(true)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center hover:rounded-xl transition-all hover:bg-blue-500/20"
          style={{ background: "rgba(255,255,255,0.06)", color: "#60a5fa" }}
          title="Join with Code"
        >
          <UserPlus className="w-4 h-4" />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User avatar */}
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xs text-white"
            style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)", fontWeight: 700 }}
          >
            SM
          </div>
          <span
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{ background: "#22c55e", borderColor: "#0f172a" }}
          />
        </div>
      </div>

      {/* ── CHANNEL SIDEBAR ── */}
      <div
        className="w-56 flex flex-col shrink-0"
        style={{
          background: "#131d35",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Community header */}
        <div
          className="px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white shrink-0"
              style={{ background: community.color, fontWeight: 700 }}
            >
              {community.avatar}
            </div>
            <span className="text-white text-sm truncate" style={{ fontWeight: 700 }}>
              {community.name}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        </div>

        {/* Community type badge */}
        <div className="px-4 pt-3 pb-1">
          <span
            className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"
            style={{
              background:
                community.type === "private"
                  ? "rgba(239,68,68,0.15)"
                  : community.type === "school"
                  ? "rgba(30,58,138,0.2)"
                  : "rgba(5,150,105,0.15)",
              color:
                community.type === "private"
                  ? "#f87171"
                  : community.type === "school"
                  ? "#93c5fd"
                  : "#4ade80",
            }}
          >
            {community.type === "private" ? <Lock className="w-3 h-3" /> :
             community.type === "school" ? <BookOpen className="w-3 h-3" /> :
             <Globe className="w-3 h-3" />}
            {community.type.charAt(0).toUpperCase() + community.type.slice(1)}
          </span>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto px-2 py-2" style={{ scrollbarWidth: "thin" }}>
          {/* Text Channels */}
          <div className="mb-2">
            <div
              className="flex items-center justify-between px-2 py-1 mb-1"
            >
              <span className="text-xs text-gray-500 uppercase tracking-wider" style={{ fontWeight: 600 }}>
                Channels
              </span>
              {viewerRole === "teacher" && (
                <Plus className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300 cursor-pointer" />
              )}
            </div>
            {CHANNELS.text.map((ch) => {
              const isLocked = ch.locked && viewerRole !== "teacher";
              return (
                <button
                  key={ch.id}
                  onClick={() => !isLocked && setActiveChannel(ch.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 transition-colors text-left"
                  style={{
                    background: activeChannel === ch.id ? "rgba(255,255,255,0.1)" : "transparent",
                    color: isLocked ? "rgba(255,255,255,0.25)" : activeChannel === ch.id ? "white" : "rgba(255,255,255,0.55)",
                    cursor: isLocked ? "not-allowed" : "pointer",
                  }}
                >
                  {isLocked ? (
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Hash className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="text-sm flex-1"># {ch.name}</span>
                  {ch.unread > 0 && !isLocked && (
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                      style={{ background: "#7c3aed", fontSize: "0.6rem" }}
                    >
                      {ch.unread}
                    </span>
                  )}
                  {isLocked && (
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
                      Teacher only
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Rooms */}
          <div>
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-xs text-gray-500 uppercase tracking-wider" style={{ fontWeight: 600 }}>
                Rooms
              </span>
              {viewerRole === "teacher" && (
                <Plus className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300 cursor-pointer" />
              )}
            </div>
            {CHANNELS.rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleJoinRoom(room)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 hover:bg-white/5 transition-colors text-left"
              >
                <Video className="w-3.5 h-3.5 shrink-0" style={{ color: room.live ? "#4ade80" : "rgba(255,255,255,0.3)" }} />
                <span
                  className="text-sm flex-1 truncate"
                  style={{ color: room.live ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)" }}
                >
                  {room.name}
                </span>
                {room.live && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}
                  >
                    {room.participants}
                  </span>
                )}
                {pendingRooms.includes(room.id) && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}
                  >
                    Pending
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* User controls */}
        <div
          className="px-2 py-2 flex items-center gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#0f1929" }}
        >
          <div className="relative">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white"
              style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)", fontWeight: 700 }}
            >
              SM
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-gray-900"
              style={{ background: "#22c55e" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white truncate" style={{ fontWeight: 600 }}>Sofia Mendez</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>#teacher</div>
          </div>
          <div className="flex gap-0.5">
            <button onClick={() => setMicOn(!micOn)} className="p-1.5 rounded hover:bg-white/10 transition-colors">
              {micOn ? <Mic className="w-3.5 h-3.5 text-gray-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
            </button>
            <button onClick={() => setHeadphonesOn(!headphonesOn)} className="p-1.5 rounded hover:bg-white/10 transition-colors">
              <Headphones className={`w-3.5 h-3.5 ${headphonesOn ? "text-gray-400" : "text-red-400"}`} />
            </button>
            <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
              <Settings className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT — Chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div
          className="h-12 flex items-center justify-between px-5 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0f172a" }}
        >
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="text-white text-sm" style={{ fontWeight: 700 }}>
              {channel.name}
            </span>
            <span className="text-gray-600 text-xs mx-1">·</span>
            <span className="text-gray-400 text-xs">General discussion for {community.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {viewerRole === "teacher" && joinRequests.length > 0 && (
              <button
                onClick={() => setShowRequestsPanel(!showRequestsPanel)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs animate-pulse"
                style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}
              >
                <Bell className="w-3.5 h-3.5" />
                {joinRequests.length} Join Request{joinRequests.length > 1 ? "s" : ""}
              </button>
            )}
            <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
              <Search className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
              <Bell className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
              <Users className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5" style={{ scrollbarWidth: "thin" }}>
              {messages.map((msg, i) => {
                const badge = roleBadge(msg.role);
                return (
                  <div key={i} className="flex gap-3 group">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-white shrink-0 mt-0.5"
                      style={{ background: msg.color, fontWeight: 700 }}
                    >
                      {msg.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm text-white" style={{ fontWeight: 700 }}>
                          {msg.user}
                        </span>
                        <span
                          className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: `${badge.color}20`, color: badge.color }}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                        <span className="text-xs text-gray-600">{msg.time}</span>
                      </div>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                        {msg.text}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button className="p-1 rounded hover:bg-white/10 text-gray-500">
                        <Smile className="w-3.5 h-3.5" />
                      </button>
                      <button className="p-1 rounded hover:bg-white/10 text-gray-500">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message input */}
            <div className="px-5 pb-5 shrink-0">
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <button className="text-gray-400 hover:text-gray-300 transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder={`Message #${channel.name}`}
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                />
                <button className="text-gray-400 hover:text-gray-300 transition-colors">
                  <Smile className="w-4 h-4" />
                </button>
                <button
                  onClick={sendMessage}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ background: chatInput.trim() ? "#7c3aed" : "transparent", color: chatInput.trim() ? "white" : "#4b5563" }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Rooms panel / Join requests panel */}
          {showRequestsPanel && viewerRole === "teacher" ? (
            <div
              className="w-72 shrink-0 flex flex-col"
              style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", background: "#0d1b30" }}
            >
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="text-sm text-white" style={{ fontWeight: 700 }}>
                  Join Requests
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24" }}
                >
                  {joinRequests.length} pending
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {joinRequests.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-500 text-sm">No pending requests</div>
                  </div>
                )}
                {joinRequests.map((req, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
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
                        <div className="text-xs text-gray-400">→ {req.room}</div>
                        <div className="text-xs text-gray-600">{req.time}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveRequest(i)}
                        className="flex-1 py-1.5 rounded-lg text-xs"
                        style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => denyRequest(i)}
                        className="flex-1 py-1.5 rounded-lg text-xs"
                        style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}
                      >
                        ✗ Deny
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Members sidebar */
            <div
              className="w-56 shrink-0 overflow-y-auto py-4"
              style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", background: "#0d1b30", scrollbarWidth: "thin" }}
            >
              {/* Teachers */}
              <div className="px-3 mb-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2" style={{ fontWeight: 600 }}>
                  Teachers — {MEMBERS.filter(m => m.role === "teacher").length}
                </div>
                {MEMBERS.filter(m => m.role === "teacher" || m.role === "admin").map((m, i) => {
                  const badge = roleBadge(m.role);
                  return (
                    <div key={i} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="relative shrink-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white"
                          style={{ background: badge.color, fontWeight: 700 }}
                        >
                          {m.avatar}
                        </div>
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-gray-900"
                          style={{ background: statusColor(m.status) }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-white truncate" style={{ fontWeight: 600 }}>
                          {m.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <span style={{ color: badge.color }}>{badge.icon}</span>
                          <span className="text-xs" style={{ color: badge.color }}>{badge.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mx-3 h-px mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />

              {/* Students */}
              <div className="px-3">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-2" style={{ fontWeight: 600 }}>
                  Students — {MEMBERS.filter(m => m.role === "student").length}
                </div>
                {MEMBERS.filter(m => m.role === "student").map((m, i) => {
                  const badge = roleBadge(m.role);
                  return (
                    <div key={i} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                      <div className="relative shrink-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white"
                          style={{ background: "rgba(255,255,255,0.12)", fontWeight: 700 }}
                        >
                          {m.avatar}
                        </div>
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-gray-900"
                          style={{ background: statusColor(m.status) }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-xs truncate"
                          style={{ color: m.status === "offline" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.75)" }}
                        >
                          {m.name}
                        </div>
                        <div className="text-xs text-gray-600 capitalize">{m.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Rooms panel (visible in main area as a quick overview) ── */}
      {/* Rooms quick card — shown as floating overlay when no requests panel */}

      {/* ── Modals ── */}

      {/* Create Community */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="rounded-2xl p-7 shadow-2xl w-96"
            style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white mb-1" style={{ fontWeight: 800 }}>Create a Community</h2>
            <p className="text-sm text-gray-400 mb-5">Build a space for your class, school, or study group.</p>
            <div className="mb-4">
              <label className="block text-xs text-gray-400 mb-1.5" style={{ fontWeight: 600 }}>Community Name</label>
              <input
                placeholder="e.g. SS2 Science Hub"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.07)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
            <div className="mb-6">
              <label className="block text-xs text-gray-400 mb-1.5" style={{ fontWeight: 600 }}>Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Public", icon: <Globe className="w-4 h-4" />, color: "#059669" },
                  { label: "Private", icon: <Lock className="w-4 h-4" />, color: "#ef4444" },
                  { label: "School", icon: <BookOpen className="w-4 h-4" />, color: "#1e3a8a" },
                ].map((t) => (
                  <button
                    key={t.label}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs border transition-all"
                    style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                  >
                    <span style={{ color: t.color }}>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm"
                style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join with code */}
      {showJoinModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowJoinModal(false)}
        >
          <div
            className="rounded-2xl p-7 shadow-2xl w-96"
            style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white mb-1" style={{ fontWeight: 800 }}>Join with Code</h2>
            <p className="text-sm text-gray-400 mb-5">Enter an invite code to join a community.</p>
            <input
              placeholder="e.g. COMM-XY91"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-4 text-center tracking-widest"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.1)",
                fontSize: "1.1rem",
                fontWeight: 700,
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-2.5 rounded-xl text-white text-sm"
                style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Request to Join Room */}
      {showJoinRoomModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowJoinRoomModal(null)}
        >
          <div
            className="rounded-2xl p-7 shadow-2xl w-96"
            style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
            >
              <Radio className="w-7 h-7" />
            </div>
            <h2 className="text-white mb-1" style={{ fontWeight: 800 }}>Request to Join</h2>
            <p className="text-sm text-gray-400 mb-2">
              <span className="text-white" style={{ fontWeight: 600 }}>{showJoinRoomModal.name}</span>
            </p>
            <p className="text-sm text-gray-400 mb-5">
              Your request will be sent to the teacher. You'll be admitted once approved.
            </p>
            <div
              className="rounded-xl p-3 mb-5 flex items-center gap-3"
              style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)" }}
            >
              <Circle className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-yellow-300">Status: Pending Approval</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinRoomModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
              >
                Cancel
              </button>
              <button
                onClick={submitJoinRequest}
                className="flex-1 py-2.5 rounded-xl text-white text-sm"
                style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
