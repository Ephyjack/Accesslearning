import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { supabase } from "./supabaseClient";
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
  Trash2,
} from "lucide-react";

type Role = "teacher" | "student" | "admin";

export interface Community {
  id: string;
  name: string;
  avatar: string;
  color: string;
  type: "school" | "public" | "private";
  unread: number;
  created_by?: string;
}

export interface Channel {
  id: string;
  name: string;
  unread: number;
  locked: boolean;
}

export interface Room {
  id: string;
  name: string;
  teacher: string;
  participants: number;
  live: boolean;
}

export interface Member {
  id?: string;
  name: string;
  role: Role;
  status: string;
  avatar: string;
}

export interface Message {
  id: string;
  user: string;
  role: Role;
  avatar: string;
  time: string;
  text: string;
  color: string;
}

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

  const [viewerRole, setViewerRole] = useState<Role>("teacher");
  const [sessionUser, setSessionUser] = useState<any>(null);

  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommunity, setActiveCommunity] = useState(id || "");
  const [channels, setChannels] = useState<{ text: Channel[], rooms: Room[] }>({ text: [], rooms: [] });
  const [activeChannel, setActiveChannel] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);

  const [micOn, setMicOn] = useState(false);
  const [headphonesOn, setHeadphonesOn] = useState(true);
  const [chatInput, setChatInput] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [exploreSearch, setExploreSearch] = useState("");
  const [exploreResults, setExploreResults] = useState<Community[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [showJoinRoomModal, setShowJoinRoomModal] = useState<Room | null>(null);
  const [showRequestsPanel, setShowRequestsPanel] = useState(false);
  const [pendingRooms, setPendingRooms] = useState<string[]>([]);

  // Form states
  const [newCommName, setNewCommName] = useState("");
  const [newCommType, setNewCommType] = useState<"public" | "private" | "school">("public");
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        setSessionUser(user);
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profile) setViewerRole(profile.role as Role);

        const { data: myComms } = await supabase.from("community_members")
          .select("community_id, communities(*)")
          .eq("user_id", user.id);

        if (myComms && myComms.length > 0) {
          const loadedComms = myComms.map((m: any) => ({
            id: m.communities.id,
            name: m.communities.name,
            avatar: m.communities.avatar || m.communities.name.substring(0, 2).toUpperCase(),
            color: m.communities.color || "#1e3a8a",
            type: m.communities.type || "public",
            unread: 0,
            created_by: m.communities.created_by
          }));
          setCommunities(loadedComms);
          if (!(id || activeCommunity)) setActiveCommunity(loadedComms[0].id);
        } else {
          setCommunities([]);
        }
      } else {
        const { data: genericComms } = await supabase.from("communities").select("*");
        if (genericComms) {
          const loadedComms = genericComms.map(c => ({
            id: c.id, name: c.name, avatar: c.avatar || c.name.substring(0, 2).toUpperCase(),
            color: c.color || "#1e3a8a", type: c.type || "public", unread: 0, created_by: c.created_by
          }));
          setCommunities(loadedComms);
          if (loadedComms.length > 0 && !(id || activeCommunity)) setActiveCommunity(loadedComms[0].id);
        }
      }
    };
    fetchInitialData();

    // Realtime deletion subscription
    const sub = supabase.channel("communities_delete")
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "communities" }, (payload) => {
        setCommunities(prev => {
          const newList = prev.filter(c => c.id !== payload.old.id);
          setActiveCommunity(current => current === payload.old.id ? (newList[0]?.id || "") : current);
          return newList;
        });
      }).subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [id]);

  useEffect(() => {
    if (!activeCommunity) return;
    const fetchChannelsAndMembers = async () => {
      const { data: mems } = await supabase.from("community_members")
        .select(`role, profiles(id, full_name, avatar_url)`)
        .eq("community_id", activeCommunity);

      if (mems) {
        setMembers(mems.map((m: any) => ({
          id: m.profiles.id,
          name: m.profiles.full_name || "Unknown",
          role: m.role || "student",
          status: "online",
          avatar: m.profiles.avatar_url || m.profiles.full_name?.substring(0, 2).toUpperCase() || "UN"
        })));
      } else { setMembers([]); }

      const { data: txts } = await supabase.from("channels").select("*").eq("community_id", activeCommunity);
      const { data: rms } = await supabase.from("classes").select("id, name, teacher_id, status, students_count").eq("community_id", activeCommunity);

      const loadedChannels = txts?.map(t => ({
        id: t.id, name: t.name, locked: t.is_locked, unread: 0
      })) || [];
      const loadedRooms = rms?.map(r => ({
        id: r.id, name: r.name, teacher: r.teacher_id, live: r.status === "live", participants: r.students_count || 0
      })) || [];

      setChannels({ text: loadedChannels, rooms: loadedRooms });
      if (loadedChannels.length > 0) setActiveChannel(loadedChannels[0].id);
    };
    fetchChannelsAndMembers();
  }, [activeCommunity]);

  useEffect(() => {
    if (!activeChannel) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from("messages").select("*").eq("room_id", activeChannel).order("created_at", { ascending: true });
      if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          user: m.user_name || "User",
          role: "student",
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: m.text,
          avatar: m.user_name?.substring(0, 2).toUpperCase() || "US",
          color: "#7c3aed"
        })));
      } else { setMessages([]); }
    };
    fetchMessages();

    const channel = supabase.channel(`messages:${activeChannel}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${activeChannel}` }, (payload) => {
        const m = payload.new;
        setMessages(prev => [...prev, {
          id: m.id, user: m.user_name || "User", role: "student",
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: m.text, avatar: m.user_name?.substring(0, 2).toUpperCase() || "US", color: "#7c3aed"
        }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChannel]);

  const community = communities.find((c) => c.id === activeCommunity) || communities[0] || { id: "0", name: "", type: "public", color: "transparent", avatar: "" };
  const channel = channels.text.find((c) => c.id === activeChannel) || channels.text[0] || { name: "" };

  const sendMessage = async () => {
    if (!chatInput.trim() || !activeChannel) return;
    const text = chatInput;
    setChatInput("");

    await supabase.from("messages").insert({
      room_id: activeChannel,
      user_id: sessionUser?.id || null,
      user_name: sessionUser?.user_metadata?.full_name || "Sofia Mendez",
      text: text
    });
  };

  const createCommunity = async () => {
    if (!newCommName) return;
    const { data } = await supabase.from("communities").insert({
      name: newCommName,
      type: newCommType,
      avatar: newCommName.substring(0, 2).toUpperCase(),
      color: "#1e3a8a",
      created_by: sessionUser?.id || null
    }).select().single();

    if (data) {
      if (sessionUser) {
        await supabase.from("community_members").insert({
          community_id: data.id,
          user_id: sessionUser.id,
          role: "admin"
        });
      }
      const { data: chData } = await supabase.from("channels").insert({
        community_id: data.id, name: "general", type: "text"
      }).select().single();

      setCommunities(prev => [...prev, { id: data.id, name: data.name, type: data.type as any, color: data.color, avatar: data.avatar, unread: 0 }]);
      setActiveCommunity(data.id);
      if (chData) setActiveChannel(chData.id);
    }
    setShowCreateModal(false);
  };

  const joinCommunity = async () => {
    if (!joinCode || !sessionUser) return;

    // Check if community exists (using joinCode as community id for demo purposes)
    const { data: comm } = await supabase.from("communities").select("id").eq("id", joinCode).single();
    if (comm) {
      await supabase.from("community_members").insert({
        community_id: joinCode,
        user_id: sessionUser.id,
        role: viewerRole
      });
      setActiveCommunity(joinCode);
    }
    setShowJoinModal(false);
    setJoinCode("");
  };

  const searchCommunities = async () => {
    setIsSearching(true);
    let query = supabase.from("communities").select("*").in("type", ["public", "school"]);
    if (exploreSearch.trim()) query = query.ilike("name", `%${exploreSearch.trim()}%`);

    const { data, error } = await query;
    if (data && !error) {
      setExploreResults(data.map(c => ({
        id: c.id, name: c.name, avatar: c.avatar || c.name.substring(0, 2).toUpperCase(),
        color: c.color || "#1e3a8a", type: c.type as any, unread: 0, created_by: c.created_by
      })));
    } else {
      setExploreResults([]);
    }
    setIsSearching(false);
  };

  const joinPublicCommunity = async (comm: Community) => {
    if (!sessionUser) return;
    await supabase.from("community_members").insert({
      community_id: comm.id,
      user_id: sessionUser.id,
      role: viewerRole
    });
    setCommunities(prev => {
      const exists = prev.find(c => c.id === comm.id);
      if (exists) return prev;
      return [...prev, comm];
    });
    setActiveCommunity(comm.id);
    setShowExploreModal(false);
    setExploreSearch("");
  };

  const deleteCommunity = async () => {
    if (window.confirm("Are you sure you want to permanently delete this community?")) {
      await supabase.from("communities").delete().eq("id", activeCommunity);
      // State is handled by realtime subscription
    }
  };

  const approveRequest = (idx: number) => {
    setJoinRequests((prev) => prev.filter((_, i) => i !== idx));
  };

  const denyRequest = (idx: number) => {
    setJoinRequests((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleJoinRoom = (room: Room) => {
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
        {communities.map((c) => (
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

        {/* Explore Communities Search */}
        <button
          onClick={() => { setShowExploreModal(true); searchCommunities(); }}
          className="w-10 h-10 rounded-2xl flex items-center justify-center hover:rounded-xl transition-all hover:bg-purple-500/20"
          style={{ background: "rgba(255,255,255,0.06)", color: "#c084fc" }}
          title="Explore Communities"
        >
          <Search className="w-4 h-4" />
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
          className="px-4 py-4 flex items-center justify-between group transition-colors relative"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {community.name ? (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs text-white shrink-0"
                style={{ background: community.color, fontWeight: 700 }}
              >
                {community.avatar}
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gray-700 animate-pulse shrink-0"></div>
            )}
            {community.name ? (
              <span className="text-white text-sm truncate" style={{ fontWeight: 700 }}>
                {community.name}
              </span>
            ) : (
              <div className="h-4 w-24 bg-gray-700 animate-pulse rounded"></div>
            )}
          </div>
          <div className="flex items-center gap-1">
            {community.created_by === sessionUser?.id && community.id !== "0" && (
              <button onClick={deleteCommunity} className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
          </div>
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
            {channels.text.map((ch) => {
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
            {channels.rooms.map((room) => (
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
            {channel.name ? (
              <span className="text-white text-sm" style={{ fontWeight: 700 }}>
                {channel.name}
              </span>
            ) : (
              <div className="h-4 w-20 bg-gray-700 animate-pulse rounded"></div>
            )}
            <span className="text-gray-600 text-xs mx-1">·</span>
            {community.name ? (
              <span className="text-gray-400 text-xs">General discussion for {community.name}</span>
            ) : (
              <div className="h-3 w-40 bg-gray-700 animate-pulse rounded mt-1"></div>
            )}
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
                  Teachers — {members.filter(m => m.role === "teacher").length}
                </div>
                {members.filter(m => m.role === "teacher" || m.role === "admin").map((m, i) => {
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
                  Students — {members.filter(m => m.role === "student").length}
                </div>
                {members.filter(m => m.role === "student").map((m, i) => {
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

      {/* Explore Communities */}
      {showExploreModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowExploreModal(false)}
        >
          <div
            className="rounded-2xl p-7 shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
            style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white mb-1" style={{ fontWeight: 800 }}>Explore Communities</h2>
            <p className="text-sm text-gray-400 mb-5">Find public and school groups to join.</p>
            <div className="flex gap-2 mb-4 shrink-0">
              <input
                value={exploreSearch}
                onChange={(e) => setExploreSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchCommunities()}
                placeholder="Search communities..."
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.07)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <button
                onClick={searchCommunities}
                className="px-4 py-3 rounded-xl text-white transition-all hover:bg-blue-600"
                style={{ background: "#2563eb" }}
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0" style={{ scrollbarWidth: "thin" }}>
              {isSearching ? (
                <div className="py-8 text-center text-sm text-gray-400">Searching...</div>
              ) : exploreResults.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">No communities found.</div>
              ) : (
                exploreResults.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: c.color, fontWeight: 700 }}>
                        {c.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white text-sm truncate" style={{ fontWeight: 600 }}>{c.name}</div>
                        <div className="text-xs capitalize text-gray-400">{c.type} Community</div>
                      </div>
                    </div>
                    {communities.find(cc => cc.id === c.id) ? (
                      <button disabled className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.1)", color: "#9ca3af" }}>Joined</button>
                    ) : (
                      <button onClick={() => joinPublicCommunity(c)} className="px-3 py-1.5 rounded-lg text-xs text-white transition-all hover:opacity-90 shrink-0" style={{ background: "#10b981" }}>Join</button>
                    )}
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowExploreModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
            >
              Close
            </button>
          </div>
        </div>
      )}

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
                value={newCommName}
                onChange={(e) => setNewCommName(e.target.value)}
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
                    onClick={() => setNewCommType(t.label.toLowerCase() as any)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs border transition-all"
                    style={{ borderColor: newCommType === t.label.toLowerCase() ? t.color : "rgba(255,255,255,0.1)", color: newCommType === t.label.toLowerCase() ? "white" : "rgba(255,255,255,0.6)", background: newCommType === t.label.toLowerCase() ? `${t.color}20` : "transparent" }}
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
                onClick={createCommunity}
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
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
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
                onClick={joinCommunity}
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
