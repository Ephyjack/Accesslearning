import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { supabase } from "./supabaseClient";
import {
  GraduationCap, Hash, Lock, Users, Plus, Search, Settings,
  ChevronDown, Mic, MicOff, Headphones, Video, Send, Smile,
  Globe, Trash2, Menu, X, BookOpen, MessageSquare,
  Copy, Check, LogOut, Key,
} from "lucide-react";

type Role = "teacher" | "student" | "admin";
interface Community { id: string; name: string; avatar: string; color: string; type: "school" | "public" | "private"; unread: number; created_by?: string; description?: string; passcode?: string; }
interface Channel { id: string; name: string; locked: boolean; unread: number; }
interface Room { id: string; name: string; teacher: string; participants: number; live: boolean; code?: string; is_private?: boolean; }
interface Member { id?: string; name: string; role: Role; status: string; avatar: string; avatarUrl?: string; }
interface Message { id: string; userId?: string; user: string; role: Role; avatar: string; time: string; text: string; color: string; }

const COLORS = ["#7c3aed", "#2563eb", "#059669", "#dc2626", "#d97706", "#0891b2", "#6d28d9", "#0369a1"];
const LANGS = [
  { code: "en", label: "English", flag: "🇺🇸" }, { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" }, { code: "zh", label: "Mandarin", flag: "🇨🇳" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" }, { code: "pt", label: "Portuguese", flag: "🇧🇷" },
  { code: "de", label: "German", flag: "🇩🇪" }, { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" }, { code: "yo", label: "Yoruba", flag: "🇳🇬" },
];
const pickColor = (s: string) => COLORS[s.charCodeAt(0) % COLORS.length];
const badge = (role: Role) => ({
  teacher: { label: "Teacher", bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  admin: { label: "Admin", bg: "rgba(248,81,73,0.15)", color: "#f85149" },
  student: { label: "Student", bg: "rgba(63,185,80,0.15)", color: "#3fb950" },
}[role]);
const S = { bg: "#0e1117", sidebar: "#161b22", rail: "#0d1117", border: "rgba(255,255,255,0.07)", text: "#e6edf3", sub: "#8b949e", accent: "#7c3aed" };
const msgMap = (m: any): Message => ({
  id: m.id, userId: m.user_id, user: m.user_name || "Unknown",
  role: (m.user_role || "student") as Role,
  avatar: (m.user_name || "UN").slice(0, 2).toUpperCase(),
  time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  text: m.text, color: m.avatar_color || pickColor(m.user_name || "U"),
});

export function CommunityPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const msgEndRef = useRef<HTMLDivElement>(null);

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [viewerRole, setViewerRole] = useState<Role>("student");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCid, setActiveCid] = useState(id || "");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeChId, setActiveChId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [copiedId, setCopiedId] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"public" | "private" | "school">("public");
  const [newDesc, setNewDesc] = useState("");
  const [newPass, setNewPass] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinPass, setJoinPass] = useState("");
  const [joinErr, setJoinErr] = useState("");
  const [exploreQ, setExploreQ] = useState("");
  const [exploreRes, setExploreRes] = useState<Community[]>([]);
  const [searching, setSearching] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLang, setNewRoomLang] = useState("English");
  const [privateRoom, setPrivateRoom] = useState(false);
  const [creating, setCreating] = useState(false);

  const activeCommunity = communities.find(c => c.id === activeCid);
  const activeChannel = channels.find(c => c.id === activeChId);
  const isOwner = activeCommunity?.created_by === sessionUser?.id;
  const isTeacher = viewerRole === "teacher" || viewerRole === "admin";
  const langInfo = LANGS.find(l => l.code === selectedLang) || LANGS[0];
  const teachers = members.filter(m => m.role === "teacher" || m.role === "admin");
  const students = members.filter(m => m.role === "student");

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      setSessionUser(user);
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (prof) { setProfile(prof); setViewerRole(prof.role as Role); }
      const { data: myComms } = await supabase.from("community_members").select("community_id, communities(*)").eq("user_id", user.id);
      if (myComms?.length) {
        const loaded: Community[] = myComms.map((m: any) => ({
          id: m.communities.id, name: m.communities.name,
          avatar: m.communities.avatar || m.communities.name.slice(0, 2).toUpperCase(),
          color: m.communities.color || pickColor(m.communities.name),
          type: m.communities.type || "public", unread: 0,
          created_by: m.communities.created_by, description: m.communities.description || "",
          passcode: m.communities.passcode || "",
        }));
        setCommunities(loaded);
        setActiveCid(id && loaded.find(c => c.id === id) ? id : loaded[0]?.id || "");
      }
    })();
  }, []);

  useEffect(() => {
    if (!activeCid) { setChannels([]); setRooms([]); setActiveChId(""); setMembers([]); return; }
    (async () => {
      const [{ data: mems }, { data: chs }, { data: rms }] = await Promise.all([
        supabase.from("community_members").select("role, profiles(id, full_name, avatar_url)").eq("community_id", activeCid),
        supabase.from("channels").select("*").eq("community_id", activeCid).order("created_at"),
        supabase.from("rooms").select("*").eq("community_id", activeCid).order("created_at"),
      ]);
      setMembers((mems || []).map((m: any) => ({
        id: m.profiles?.id, name: m.profiles?.full_name || "Unknown",
        role: (m.role || "student") as Role, status: "online",
        avatar: (m.profiles?.full_name || "UN").slice(0, 2).toUpperCase(), avatarUrl: m.profiles?.avatar_url,
      })));
      const ch = (chs || []).map((c: any) => ({ id: c.id, name: c.name, locked: c.is_locked ?? false, unread: 0 }));
      setChannels(ch); setActiveChId(ch[0]?.id || "");
      setRooms((rms || []).map((r: any) => ({ id: r.id, name: r.name, teacher: r.teacher_id, participants: r.participants || 0, live: r.status === "live", code: r.code, is_private: r.is_private })));
    })();
  }, [activeCid]);

  useEffect(() => {
    if (!activeChId) { setMessages([]); return; }
    (async () => {
      const { data } = await supabase.from("messages").select("*").eq("room_id", activeChId).order("created_at").limit(100);
      setMessages((data || []).map(msgMap));
    })();
    const ch = supabase.channel(`msgs:${activeChId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${activeChId}` }, p => setMessages(prev => [...prev, msgMap(p.new)]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeChId]);

  const sendMsg = async () => {
    if (!chatInput.trim() || !activeChId || sending) return;
    const text = chatInput; setChatInput(""); setSending(true);
    await supabase.from("messages").insert({ room_id: activeChId, user_id: sessionUser?.id, user_name: profile?.full_name || sessionUser?.email || "Anonymous", user_role: viewerRole, text, avatar_color: pickColor(profile?.full_name || "U") });
    setSending(false);
  };

  const createCommunity = async () => {
    if (!newName.trim() || !sessionUser || creating) return;
    setCreating(true);
    const color = pickColor(newName);
    const { data, error } = await supabase.from("communities").insert({ name: newName, type: newType, color, avatar: newName.slice(0, 2).toUpperCase(), created_by: sessionUser.id, description: newDesc || null, passcode: newType === "private" ? (newPass || null) : null }).select().single();
    if (error || !data) { alert("Failed: " + error?.message); setCreating(false); return; }
    await supabase.from("community_members").insert({ community_id: data.id, user_id: sessionUser.id, role: "admin" });
    const { data: ch } = await supabase.from("channels").insert({ community_id: data.id, name: "general", type: "text" }).select().single();
    const nc: Community = { id: data.id, name: data.name, avatar: data.avatar, color, type: data.type as any, unread: 0, created_by: sessionUser.id };
    setCommunities(prev => [...prev, nc]); setActiveCid(data.id);
    if (ch) { setChannels([{ id: ch.id, name: ch.name, locked: false, unread: 0 }]); setActiveChId(ch.id); }
    setNewName(""); setNewDesc(""); setNewPass(""); setNewType("public"); setShowCreate(false); setCreating(false);
  };

  const joinCommunity = async () => {
    if (!joinCode.trim() || !sessionUser) return;
    setJoinErr("");
    const { data: comm } = await supabase.from("communities").select("*").eq("id", joinCode.trim()).single();
    if (!comm) { setJoinErr("Community not found. Check the code."); return; }
    if (comm.type === "private" && comm.passcode && joinPass !== comm.passcode) { setJoinErr("Incorrect passcode."); return; }
    const { data: ex } = await supabase.from("community_members").select("id").eq("community_id", comm.id).eq("user_id", sessionUser.id).single();
    if (!ex) await supabase.from("community_members").insert({ community_id: comm.id, user_id: sessionUser.id, role: viewerRole });
    const c: Community = { id: comm.id, name: comm.name, avatar: comm.avatar || comm.name.slice(0, 2).toUpperCase(), color: comm.color || pickColor(comm.name), type: comm.type as any, unread: 0, created_by: comm.created_by };
    setCommunities(prev => prev.find(x => x.id === c.id) ? prev : [...prev, c]);
    setActiveCid(comm.id); setShowJoin(false); setJoinCode(""); setJoinPass(""); setJoinErr("");
  };

  const searchComms = async () => {
    setSearching(true);
    const { data } = await supabase.from("communities").select("*").in("type", ["public", "school"]).ilike("name", `%${exploreQ}%`).limit(20);
    setExploreRes((data || []).map((c: any) => ({ id: c.id, name: c.name, avatar: c.avatar || c.name.slice(0, 2).toUpperCase(), color: c.color || pickColor(c.name), type: c.type as any, unread: 0, created_by: c.created_by, description: c.description || "" })));
    setSearching(false);
  };

  const joinPublic = async (comm: Community) => {
    if (!sessionUser) return;
    const { data: ex } = await supabase.from("community_members").select("id").eq("community_id", comm.id).eq("user_id", sessionUser.id).single();
    if (!ex) await supabase.from("community_members").insert({ community_id: comm.id, user_id: sessionUser.id, role: viewerRole });
    setCommunities(prev => prev.find(c => c.id === comm.id) ? prev : [...prev, comm]);
    setActiveCid(comm.id); setShowExplore(false);
  };

  const deleteCommunity = async () => {
    if (!activeCid) return;
    const del = activeCid;
    const { error } = await supabase.from("communities").delete().eq("id", del);
    if (error) { alert("Failed: " + error.message); return; }
    setCommunities(prev => { const next = prev.filter(c => c.id !== del); setActiveCid(next[0]?.id || ""); return next; });
    setChannels([]); setRooms([]); setMessages([]); setMembers([]); setShowDel(false);
  };

  const leaveCommunity = async () => {
    if (!activeCid || !sessionUser) return;
    await supabase.from("community_members").delete().eq("community_id", activeCid).eq("user_id", sessionUser.id);
    setCommunities(prev => { const next = prev.filter(c => c.id !== activeCid); setActiveCid(next[0]?.id || ""); return next; });
    setChannels([]); setRooms([]); setMessages([]); setMembers([]);
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || !sessionUser || creating) return;
    setCreating(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase.from("rooms").insert({ name: newRoomName, code, language: newRoomLang, teacher_id: sessionUser.id, community_id: activeCid, is_private: privateRoom, status: "offline" }).select().single();
    if (error) { alert("Failed: " + error.message); setCreating(false); return; }
    if (data) {
      setRooms(prev => [...prev, { id: data.id, name: data.name, teacher: data.teacher_id, participants: 0, live: false, code: data.code, is_private: data.is_private }]);
      setNewRoomName(""); setNewRoomLang("English"); setPrivateRoom(false); setShowCreateRoom(false);
      navigate(`/classroom/${data.id}`);
    }
    setCreating(false);
  };

  const copyId = () => { if (!activeCommunity) return; navigator.clipboard.writeText(activeCommunity.id); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); };

  // ── RENDER ──
  return (
    <div className="h-screen flex overflow-hidden" style={{ background: S.bg, fontFamily: "system-ui,sans-serif" }}>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Community Rail */}
      <div className="hidden md:flex w-16 flex-col items-center py-3 gap-1 shrink-0 overflow-y-auto" style={{ background: S.rail, borderRight: `1px solid ${S.border}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 shrink-0" style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}>
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="w-8 h-px mb-1" style={{ background: S.border }} />
        {communities.map(c => (
          <button key={c.id} onClick={() => setActiveCid(c.id)} title={c.name}
            className="relative w-12 h-12 rounded-2xl flex items-center justify-center text-xs text-white font-bold transition-all hover:rounded-xl shrink-0 mb-0.5"
            style={{ background: c.id === activeCid ? c.color : `${c.color}33`, border: `2px solid ${c.id === activeCid ? c.color : "transparent"}` }}>
            {c.avatar}
          </button>
        ))}
        <div className="w-8 h-px my-1" style={{ background: S.border }} />
        <button onClick={() => setShowCreate(true)} title="Create" className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950" }}><Plus className="w-5 h-5" /></button>
        <button onClick={() => { setShowExplore(true); searchComms(); }} title="Explore" className="w-12 h-12 rounded-2xl flex items-center justify-center mt-1" style={{ background: "rgba(88,166,255,0.1)", color: "#58a6ff" }}><Search className="w-4 h-4" /></button>
        <button onClick={() => setShowJoin(true)} title="Join with Code" className="w-12 h-12 rounded-2xl flex items-center justify-center mt-1" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}><Key className="w-4 h-4" /></button>
        <div className="flex-1" />
        {profile && (
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-xs text-white font-bold mt-2 shrink-0" style={{ background: pickColor(profile.full_name || "U") }} title={profile.full_name}>
            {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : (profile.full_name || "U").slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Channel Sidebar */}
      <div className={`flex-col shrink-0 overflow-hidden transition-all duration-300 ${sidebarOpen ? "flex fixed inset-y-0 left-0 z-50 w-64" : "hidden md:flex w-60"}`} style={{ background: S.sidebar, borderRight: `1px solid ${S.border}` }}>
        {activeCommunity ? (
          <>
            <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white font-bold shrink-0" style={{ background: activeCommunity.color }}>{activeCommunity.avatar}</div>
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color: S.text }}>{activeCommunity.name}</div>
                  <div className="text-xs flex items-center gap-1" style={{ color: S.sub }}>
                    {activeCommunity.type === "private" ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                    {activeCommunity.type}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button onClick={copyId} className="p-1.5 rounded-lg" style={{ color: copiedId ? "#3fb950" : S.sub }} title="Copy Invite Code">{copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</button>
                {isOwner ? <button onClick={() => setShowDel(true)} className="p-1.5 rounded-lg hover:text-red-400 transition-colors" style={{ color: S.sub }}><Trash2 className="w-3.5 h-3.5" /></button>
                  : <button onClick={leaveCommunity} className="p-1.5 rounded-lg hover:text-red-400 transition-colors" style={{ color: S.sub }}><LogOut className="w-3.5 h-3.5" /></button>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              <div className="px-3 mb-2">
                <div className="flex items-center justify-between px-1 py-1">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: S.sub }}>Channels</span>
                </div>
                {channels.length === 0 && <p className="text-xs px-1 py-0.5" style={{ color: S.sub }}>No channels yet</p>}
                {channels.map(ch => (
                  <button key={ch.id} onClick={() => { setActiveChId(ch.id); setSidebarOpen(false); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left mb-0.5 transition-colors"
                    style={{ background: activeChId === ch.id ? "rgba(124,58,237,0.2)" : "transparent", color: activeChId === ch.id ? "#c4b5fd" : S.sub }}>
                    {ch.locked ? <Lock className="w-3.5 h-3.5 shrink-0" /> : <Hash className="w-3.5 h-3.5 shrink-0" />}
                    <span className="text-sm truncate">{ch.name}</span>
                  </button>
                ))}
              </div>

              <div className="px-3 mt-1">
                <div className="flex items-center justify-between px-1 py-1">
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: S.sub }}>Rooms</span>
                  {isTeacher && <button onClick={() => setShowCreateRoom(true)} className="p-0.5 rounded hover:text-white" style={{ color: S.sub }}><Plus className="w-3.5 h-3.5" /></button>}
                </div>
                {rooms.length === 0 && <p className="text-xs px-1 py-0.5" style={{ color: S.sub }}>{isTeacher ? "Click + to create a room" : "No rooms yet"}</p>}
                {rooms.map(r => (
                  <button key={r.id} onClick={() => navigate(`/classroom/${r.id}`)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left mb-0.5 transition-colors hover:bg-white/5"
                    style={{ color: S.sub }}>
                    <Video className="w-3.5 h-3.5 shrink-0" style={{ color: r.live ? "#3fb950" : S.sub }} />
                    <span className="text-sm truncate flex-1">{r.name}</span>
                    {r.live && <span className="text-xs px-1.5 rounded" style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950", fontSize: 10 }}>LIVE</span>}
                    {r.is_private && <Lock className="w-3 h-3 opacity-50" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-3 py-2 shrink-0" style={{ borderTop: `1px solid ${S.border}`, background: "#0d1117" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0 overflow-hidden" style={{ background: pickColor(profile?.full_name || "U") }}>
                  {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : (profile?.full_name || "U").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate" style={{ color: S.text }}>{profile?.full_name || sessionUser?.email || "User"}</div>
                  <div className="text-xs capitalize" style={{ color: badge(viewerRole)?.color }}>{viewerRole}</div>
                </div>
                <div className="flex gap-0.5">
                  <button onClick={() => setMicOn(!micOn)} className="p-1.5 rounded-lg" style={{ color: micOn ? S.sub : "#f85149" }}>{micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}</button>
                  <button className="p-1.5 rounded-lg" style={{ color: S.sub }}><Headphones className="w-3.5 h-3.5" /></button>
                  <button className="p-1.5 rounded-lg" style={{ color: S.sub }}><Settings className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <BookOpen className="w-10 h-10 mb-3" style={{ color: S.sub }} />
            <p className="text-sm" style={{ color: S.sub }}>Select a community</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!activeCid ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-2xl" style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}>
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: S.text }}>Welcome to Communities</h2>
            <p className="text-sm mb-8 max-w-sm" style={{ color: S.sub }}>Join study groups, learning hubs, and school communities. Chat, share rooms, and learn together across languages.</p>
            <div className="flex gap-3 flex-wrap justify-center">
              <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90" style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}><Plus className="w-4 h-4" />Create Community</button>
              <button onClick={() => { setShowExplore(true); searchComms(); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm" style={{ background: "rgba(88,166,255,0.1)", color: "#58a6ff", border: "1px solid rgba(88,166,255,0.2)" }}><Search className="w-4 h-4" />Explore</button>
              <button onClick={() => setShowJoin(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm" style={{ background: "rgba(124,58,237,0.1)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.2)" }}><Key className="w-4 h-4" />Join with Code</button>
            </div>
          </div>
        ) : !activeChId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="w-14 h-14 mb-4" style={{ color: S.sub }} />
            <h3 className="text-lg font-bold mb-1" style={{ color: S.text }}>{activeCommunity?.name}</h3>
            <p className="text-sm" style={{ color: S.sub }}>Select a channel to start chatting</p>
            <button className="md:hidden mt-4 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "rgba(124,58,237,0.15)", color: "#c4b5fd" }} onClick={() => setSidebarOpen(true)}>Open Channels</button>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-14 flex items-center justify-between px-4 shrink-0" style={{ borderBottom: `1px solid ${S.border}`, background: "rgba(14,17,23,0.95)" }}>
              <div className="flex items-center gap-2">
                <button className="md:hidden p-1.5 rounded-lg mr-1" style={{ color: S.sub }} onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
                <Hash className="w-4 h-4 shrink-0" style={{ color: S.sub }} />
                <span className="font-bold text-sm" style={{ color: S.text }}>{activeChannel?.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full ml-1 hidden sm:inline" style={{ background: "rgba(255,255,255,0.06)", color: S.sub }}>{members.length} members</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="relative">
                  <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(124,58,237,0.12)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.2)" }}>
                    <span>{langInfo.flag}</span><span>{langInfo.code.toUpperCase()}</span><ChevronDown className="w-3 h-3" />
                  </button>
                  {langOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 rounded-xl py-1 z-30 overflow-y-auto" style={{ background: "#1c2333", border: `1px solid ${S.border}`, maxHeight: 260 }}>
                      {LANGS.map(l => (
                        <button key={l.code} onClick={() => { setSelectedLang(l.code); setLangOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left"
                          style={{ color: selectedLang === l.code ? "#c4b5fd" : S.text, background: selectedLang === l.code ? "rgba(124,58,237,0.12)" : "transparent" }}>
                          {l.flag} {l.label} {selectedLang === l.code && <Check className="w-3 h-3 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setMembersOpen(!membersOpen)} className="p-2 rounded-lg" style={{ color: membersOpen ? "#c4b5fd" : S.sub }}><Users className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Messages */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: "rgba(124,58,237,0.1)" }}>
                        <Hash className="w-8 h-8" style={{ color: "#7c3aed" }} />
                      </div>
                      <h3 className="font-bold mb-1" style={{ color: S.text }}>Welcome to #{activeChannel?.name}!</h3>
                      <p className="text-sm" style={{ color: S.sub }}>This is the beginning of the channel. Say hello 👋</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {messages.map((msg, i) => {
                        const prev = messages[i - 1];
                        const grouped = prev?.userId === msg.userId;
                        const b = badge(msg.role);
                        return (
                          <div key={msg.id} className={`flex gap-3 px-2 py-0.5 rounded-lg hover:bg-white/[0.02] ${grouped ? "pl-14" : "pt-3"}`}>
                            {!grouped && (
                              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0 mt-0.5" style={{ background: msg.color }}>{msg.avatar}</div>
                            )}
                            <div className="min-w-0 flex-1">
                              {!grouped && (
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-semibold" style={{ color: msg.color }}>{msg.user}</span>
                                  <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: b?.bg, color: b?.color }}>{b?.label}</span>
                                  <span className="text-xs" style={{ color: S.sub }}>{msg.time}</span>
                                </div>
                              )}
                              <p className="text-sm leading-relaxed break-words" style={{ color: "#cdd9e5" }}>{msg.text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div ref={msgEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 pb-4 shrink-0">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "#1c2333", border: `1px solid ${S.border}` }}>
                    <button style={{ color: S.sub }}><Smile className="w-5 h-5" /></button>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMsg()}
                      placeholder={`Message #${activeChannel?.name}  (${langInfo.flag} ${langInfo.label})`}
                      className="flex-1 bg-transparent text-sm outline-none" style={{ color: S.text }} />
                    <span className="text-xs px-2 py-1 rounded-md shrink-0" style={{ background: "rgba(124,58,237,0.12)", color: "#c4b5fd" }}>{langInfo.flag}</span>
                    <button onClick={sendMsg} disabled={!chatInput.trim()} style={{ color: chatInput.trim() ? S.accent : S.sub }}>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Members Panel */}
              {membersOpen && (
                <div className="w-52 shrink-0 overflow-y-auto py-3" style={{ background: S.sidebar, borderLeft: `1px solid ${S.border}` }}>
                  {teachers.length > 0 && (
                    <div className="mb-3">
                      <div className="px-4 mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: S.sub }}>Teachers — {teachers.length}</div>
                      {teachers.map(m => <MemberRow key={m.id || m.name} m={m} />)}
                    </div>
                  )}
                  {students.length > 0 && (
                    <div>
                      <div className="px-4 mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: S.sub }}>Students — {students.length}</div>
                      {students.map(m => <MemberRow key={m.id || m.name} m={m} />)}
                    </div>
                  )}
                  {members.length === 0 && <p className="px-4 text-xs" style={{ color: S.sub }}>No members</p>}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── MODALS ── */}
      {showCreate && (
        <Modal title="Create Community" icon={<GraduationCap className="w-5 h-5" />} onClose={() => setShowCreate(false)}>
          <Field label="Community Name"><input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Biology Study Group" /></Field>
          <Field label="Description (optional)"><input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What is this community about?" /></Field>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-2" style={{ color: S.sub }}>Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(["public", "private", "school"] as const).map(t => (
                <button key={t} onClick={() => setNewType(t)} className="py-2 rounded-xl text-xs font-semibold capitalize"
                  style={{ background: newType === t ? "rgba(124,58,237,0.2)" : "#0d1117", color: newType === t ? "#c4b5fd" : S.sub, border: `1px solid ${newType === t ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.07)"}` }}>
                  {t === "public" ? "🌍 " : t === "private" ? "🔒 " : "🏫 "}{t}
                </button>
              ))}
            </div>
          </div>
          {newType === "private" && (
            <Field label="Passcode *"><input value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Members must enter this to join" type="password" style={{ border: "1px solid rgba(248,81,73,0.3)" }} /></Field>
          )}
          <div className="flex gap-2 mt-4">
            <Btn ghost onClick={() => setShowCreate(false)}>Cancel</Btn>
            <Btn onClick={createCommunity} disabled={creating || !newName.trim()}>{creating ? "Creating..." : "Create"}</Btn>
          </div>
        </Modal>
      )}

      {showJoin && (
        <Modal title="Join with Code" icon={<Key className="w-5 h-5" />} onClose={() => setShowJoin(false)}>
          <Field label="Community Code"><input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Paste the community ID" /></Field>
          <Field label="Passcode (if private)"><input value={joinPass} onChange={e => setJoinPass(e.target.value)} placeholder="Leave blank for public communities" type="password" /></Field>
          {joinErr && <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ color: "#f85149", background: "rgba(248,81,73,0.1)" }}>{joinErr}</p>}
          <div className="flex gap-2">
            <Btn ghost onClick={() => setShowJoin(false)}>Cancel</Btn>
            <Btn onClick={joinCommunity}>Join</Btn>
          </div>
        </Modal>
      )}

      {showExplore && (
        <Modal title="Explore Communities" icon={<Search className="w-5 h-5" />} onClose={() => setShowExplore(false)} wide>
          <div className="flex gap-2 mb-4">
            <input value={exploreQ} onChange={e => setExploreQ(e.target.value)} onKeyDown={e => e.key === "Enter" && searchComms()} placeholder="Search communities..."
              className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#0d1117", color: S.text, border: `1px solid ${S.border}` }} />
            <button onClick={searchComms} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#7c3aed" }}>Search</button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {searching && <p className="text-center text-sm py-4" style={{ color: S.sub }}>Searching...</p>}
            {!searching && exploreRes.length === 0 && <p className="text-center text-sm py-4" style={{ color: S.sub }}>No communities found. Try a different search.</p>}
            {exploreRes.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#21262d" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm text-white font-bold shrink-0" style={{ background: c.color }}>{c.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: S.text }}>{c.name}</div>
                  <div className="text-xs flex items-center gap-1" style={{ color: S.sub }}>
                    {c.type === "private" ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />} {c.type}{c.description ? ` · ${c.description}` : ""}
                  </div>
                </div>
                {communities.find(x => x.id === c.id)
                  ? <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950" }}>Joined</span>
                  : <button onClick={() => joinPublic(c)} className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold" style={{ background: "#7c3aed" }}>Join</button>}
              </div>
            ))}
          </div>
        </Modal>
      )}

      {showCreateRoom && (
        <Modal title="Create Online Room" icon={<Video className="w-5 h-5" />} onClose={() => setShowCreateRoom(false)}>
          <Field label="Room Name"><input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="e.g. Biology Live Session" /></Field>
          <Field label="Language">
            <select value={newRoomLang} onChange={e => setNewRoomLang(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#0d1117", color: S.text, border: `1px solid ${S.border}` }}>
              {["English", "Spanish", "French", "Mandarin", "Japanese", "Portuguese", "German", "Arabic", "Hindi", "Yoruba"].map(l => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setPrivateRoom(!privateRoom)} className="w-10 h-6 rounded-full transition-colors relative shrink-0" style={{ background: privateRoom ? "#7c3aed" : "#21262d" }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: privateRoom ? "calc(100% - 1.35rem)" : "0.125rem" }} />
            </button>
            <span className="text-sm" style={{ color: S.text }}>Private <span style={{ color: S.sub }}>(requires approval)</span></span>
          </div>
          <div className="flex gap-2">
            <Btn ghost onClick={() => setShowCreateRoom(false)}>Cancel</Btn>
            <Btn onClick={createRoom} disabled={creating || !newRoomName.trim()}>{creating ? "Creating..." : "Create & Enter"}</Btn>
          </div>
        </Modal>
      )}

      {showDel && (
        <Modal title="Delete Community" icon={<Trash2 className="w-5 h-5" />} onClose={() => setShowDel(false)} danger>
          <p className="text-sm mb-1" style={{ color: S.text }}>Delete <strong>{activeCommunity?.name}</strong>?</p>
          <p className="text-sm mb-5" style={{ color: S.sub }}>All channels, messages, and members will be permanently removed.</p>
          <div className="flex gap-2">
            <Btn ghost onClick={() => setShowDel(false)}>Cancel</Btn>
            <Btn danger onClick={deleteCommunity}>Delete Forever</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MemberRow({ m }: { m: Member }) {
  const b = { teacher: { color: "#f59e0b" }, admin: { color: "#f85149" }, student: { color: "#3fb950" } }[m.role];
  return (
    <div className="flex items-center gap-2.5 px-4 py-1.5 hover:bg-white/5 transition-colors">
      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden" style={{ background: `${b?.color}22`, color: b?.color }}>
          {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : m.avatar}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: m.status === "online" ? "#3fb950" : "#6e7681", borderColor: "#161b22" }} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold truncate" style={{ color: "#cdd9e5" }}>{m.name}</div>
        <div className="text-xs capitalize" style={{ color: b?.color, opacity: 0.75 }}>{m.role}</div>
      </div>
    </div>
  );
}

function Modal({ title, icon, onClose, children, wide, danger }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode; wide?: boolean; danger?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className={`rounded-2xl p-6 shadow-2xl w-full ${wide ? "max-w-lg" : "max-w-sm"}`} style={{ background: "#161b22", border: `1px solid ${danger ? "rgba(248,81,73,0.3)" : "rgba(255,255,255,0.08)"}` }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: danger ? "rgba(248,81,73,0.15)" : "rgba(124,58,237,0.15)", color: danger ? "#f85149" : "#c4b5fd" }}>{icon}</div>
          <h2 className="text-base font-bold flex-1" style={{ color: "#e6edf3" }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "#8b949e" }}><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold mb-1" style={{ color: "#8b949e" }}>{label}</label>
      <div className="[&_input]:w-full [&_input]:px-3.5 [&_input]:py-2.5 [&_input]:rounded-xl [&_input]:text-sm [&_input]:outline-none [&_input]:bg-[#0d1117] [&_input]:text-[#e6edf3] [&_input]:border [&_input]:border-white/10">
        {children}
      </div>
    </div>
  );
}

function Btn({ children, onClick, disabled, ghost, danger }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; ghost?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
      style={{ background: danger ? "#f85149" : ghost ? "#21262d" : "linear-gradient(135deg,#1e3a8a,#7c3aed)", color: ghost ? "#8b949e" : "white" }}>
      {children}
    </button>
  );
}
