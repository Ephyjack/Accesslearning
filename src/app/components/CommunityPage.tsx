import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { supabase } from "./supabaseClient";
import { translateTextWithOpenAI, askAIAssistant } from "../lib/openaiClient";
import {
  GraduationCap, Hash, Lock, Users, Plus, Search, Settings,
  ChevronDown, ChevronRight, Mic, MicOff, Headphones, Video, Send, Smile,
  Globe, Trash2, Menu, X, BookOpen, MessageSquare, Radio,
  Copy, Check, LogOut, Key, Pin, Bell, BellOff, Sparkles,
  FileText, Image, Paperclip, ThumbsUp, CornerDownRight, AlertCircle,
  CheckCircle2, Volume2, Megaphone, HelpCircle, MoreHorizontal, Crown,
  Shield, UserMinus, Download, ExternalLink, BarChart2, Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "teacher" | "student" | "admin";
type ChannelType = "text" | "announcement" | "qna" | "voice";

interface Community {
  id: string; name: string; avatar: string; color: string;
  type: "school" | "public" | "private"; unread: number;
  created_by?: string; description?: string; passcode?: string;
  banner_url?: string; tags?: string[]; rules?: string;
}
interface Category { id: string; name: string; position: number; }
interface Channel {
  id: string; name: string; locked: boolean; unread: number;
  channel_type: ChannelType; topic?: string; category_id?: string;
}
interface Room { id: string; name: string; teacher: string; participants: number; live: boolean; code?: string; is_private?: boolean; }
interface Member { id?: string; name: string; role: Role; status: string; avatar: string; avatarUrl?: string; is_muted?: boolean; nickname?: string; }
interface Reaction { emoji: string; count: number; reacted: boolean; }
interface Attachment { url: string; name: string; type: string; }
interface Message {
  id: string; userId?: string; user: string; role: Role; avatar: string;
  time: string; text: string; color: string;
  reactions: Record<string, Reaction>;
  parentId?: string; replyToUser?: string; replyToText?: string;
  attachment?: Attachment; is_question?: boolean; is_resolved?: boolean; upvotes?: number;
  isPinned?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = ["#7c3aed", "#2563eb", "#059669", "#dc2626", "#d97706", "#0891b2", "#6d28d9", "#0369a1"];
const LANGS = [
  { code: "en", label: "English", flag: "🇺🇸" }, { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" }, { code: "zh", label: "Mandarin", flag: "🇨🇳" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" }, { code: "pt", label: "Portuguese", flag: "🇧🇷" },
  { code: "de", label: "German", flag: "🇩🇪" }, { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "hi", label: "Hindi", flag: "🇮🇳" }, { code: "yo", label: "Yoruba", flag: "🇳🇬" },
];
const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏", "🤔", "✅"];
const pickColor = (s: string) => COLORS[(s?.charCodeAt(0) ?? 0) % COLORS.length];
const badge = (role: Role) => ({
  teacher: { label: "Teacher", bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  admin: { label: "Admin", bg: "rgba(248,81,73,0.15)", color: "#f85149" },
  student: { label: "Student", bg: "rgba(63,185,80,0.15)", color: "#3fb950" },
}[role]);
const S = { bg: "#0e1117", sidebar: "#161b22", rail: "#0d1117", border: "rgba(255,255,255,0.07)", text: "#e6edf3", sub: "#8b949e", accent: "#7c3aed" };

// ─── YouTube Utilities ──────────────────────────────────────────────────────
const YT_REGEX = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/;

const extractYtId = (text: string): string | null => {
  const m = text.match(YT_REGEX);
  return m ? m[1] : null;
};

function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="mt-2 rounded-xl overflow-hidden" style={{ maxWidth: 480, border: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
        />
      </div>
    </div>
  );
}

const chanIcon = (t: ChannelType) => {
  if (t === "announcement") return <Megaphone className="w-3.5 h-3.5 shrink-0" />;
  if (t === "qna") return <HelpCircle className="w-3.5 h-3.5 shrink-0" />;
  if (t === "voice") return <Volume2 className="w-3.5 h-3.5 shrink-0" />;
  return <Hash className="w-3.5 h-3.5 shrink-0" />;
};

const msgMap = (m: any, pinnedIds: Set<string>, myId?: string, reactions?: any[]): Message => {
  const reactionMap: Record<string, Reaction> = {};
  (reactions || []).filter(r => r.message_id === m.id).forEach(r => {
    if (!reactionMap[r.emoji]) reactionMap[r.emoji] = { emoji: r.emoji, count: 0, reacted: false };
    reactionMap[r.emoji].count++;
    if (r.user_id === myId) reactionMap[r.emoji].reacted = true;
  });
  return {
    id: m.id, userId: m.user_id, user: m.user_name || "Unknown",
    role: (m.user_role || "student") as Role,
    avatar: (m.user_name || "UN").slice(0, 2).toUpperCase(),
    time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    text: m.text, color: m.avatar_color || pickColor(m.user_name || "U"),
    reactions: reactionMap,
    parentId: m.parent_message_id,
    replyToUser: m.reply_to_user,
    replyToText: m.reply_to_text,
    attachment: m.attachment_url ? { url: m.attachment_url, name: m.attachment_name || "file", type: m.attachment_type || "file" } : undefined,
    is_question: m.is_question, is_resolved: m.is_resolved, upvotes: m.upvotes || 0,
    isPinned: pinnedIds.has(m.id),
  };
};

// ─── Main Component ──────────────────────────────────────────────────────────
export function CommunityPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const msgEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Session
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [viewerRole, setViewerRole] = useState<Role>("student");

  // Communities
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCid, setActiveCid] = useState(id || "");

  // Channels & Rooms
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeChId, setActiveChId] = useState("");

  // Members
  const [members, setMembers] = useState<Member[]>([]);
  const [membersOpen, setMembersOpen] = useState(false);

  // Messages + Pins
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [showPinned, setShowPinned] = useState(false);

  // Reactions
  const [allReactions, setAllReactions] = useState<any[]>([]);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [copiedId, setCopiedId] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [threadMsg, setThreadMsg] = useState<Message | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [threadInput, setThreadInput] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Translate
  const [translating, setTranslating] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  // AI Summary
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  // File Upload
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ url: string; name: string; type: string } | null>(null);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showExplore, setShowExplore] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState<Member | null>(null);

  // Forms
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
  const [newChanName, setNewChanName] = useState("");
  const [newChanType, setNewChanType] = useState<ChannelType>("text");

  // Derived
  const activeCommunity = communities.find(c => c.id === activeCid);
  const activeChannel = channels.find(c => c.id === activeChId);
  const isOwner = activeCommunity?.created_by === sessionUser?.id;
  const isTeacher = viewerRole === "teacher" || viewerRole === "admin";
  const isAnnouncement = activeChannel?.channel_type === "announcement";
  const isQnA = activeChannel?.channel_type === "qna";
  const canPost = !isAnnouncement || isTeacher;
  const langInfo = LANGS.find(l => l.code === selectedLang) || LANGS[0];
  const teachers = members.filter(m => m.role === "teacher" || m.role === "admin");
  const students = members.filter(m => m.role === "student");
  const topLevelMessages = messages.filter(m => !m.parentId);

  // ─── Scroll to bottom ────────────────────────────────────────────────────
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ─── Auth + Load communities ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { navigate("/login"); return; }
      setSessionUser(user);
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (prof) { setProfile(prof); setViewerRole(prof.role as Role); }
      const { data: myComms } = await supabase
        .from("community_members").select("community_id, communities(*)").eq("user_id", user.id);
      if (myComms?.length) {
        const loaded: Community[] = myComms.map((m: any) => ({
          id: m.communities.id, name: m.communities.name,
          avatar: m.communities.avatar || m.communities.name.slice(0, 2).toUpperCase(),
          color: m.communities.color || pickColor(m.communities.name),
          type: m.communities.type || "public", unread: 0,
          created_by: m.communities.created_by, description: m.communities.description || "",
          passcode: m.communities.passcode || "", banner_url: m.communities.banner_url,
          tags: m.communities.tags || [], rules: m.communities.rules || "",
        }));
        setCommunities(loaded);
        setActiveCid(id && loaded.find(c => c.id === id) ? id : loaded[0]?.id || "");
      }
    })();
  }, []);

  // ─── Load channels, categories, rooms, members when community changes ────
  useEffect(() => {
    if (!activeCid) { setChannels([]); setRooms([]); setActiveChId(""); setMembers([]); setCategories([]); return; }
    (async () => {
      const [{ data: mems }, { data: chs }, { data: rms }, { data: cats }] = await Promise.all([
        supabase.from("community_members").select("role, is_muted, nickname, profiles(id, full_name, avatar_url)").eq("community_id", activeCid),
        supabase.from("channels").select("*").eq("community_id", activeCid).order("position"),
        supabase.from("rooms").select("*").eq("community_id", activeCid).order("created_at"),
        supabase.from("channel_categories").select("*").eq("community_id", activeCid).order("position"),
      ]);
      setMembers((mems || []).map((m: any) => ({
        id: m.profiles?.id, name: m.profiles?.full_name || "Unknown",
        role: (m.role || "student") as Role, status: "online",
        avatar: (m.profiles?.full_name || "UN").slice(0, 2).toUpperCase(),
        avatarUrl: m.profiles?.avatar_url, is_muted: m.is_muted, nickname: m.nickname,
      })));
      setCategories((cats || []).map((c: any) => ({ id: c.id, name: c.name, position: c.position })));
      const ch = (chs || []).map((c: any) => ({
        id: c.id, name: c.name, locked: c.is_locked ?? false, unread: 0,
        channel_type: (c.channel_type || "text") as ChannelType, topic: c.topic, category_id: c.category_id,
      }));
      setChannels(ch); setActiveChId(ch[0]?.id || "");
      setRooms((rms || []).map((r: any) => ({ id: r.id, name: r.name, teacher: r.teacher_id, participants: r.participants || 0, live: r.status === "live", code: r.code, is_private: r.is_private })));
    })();
  }, [activeCid]);

  // ─── Load messages, pins, reactions ─────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!activeChId) { setMessages([]); return; }
    const [{ data: msgs }, { data: pins }, { data: reacts }] = await Promise.all([
      supabase.from("messages").select("*").eq("room_id", activeChId).order("created_at").limit(150),
      supabase.from("pinned_messages").select("message_id").eq("channel_id", activeChId),
      supabase.from("message_reactions").select("*").in("message_id", []),
    ]);
    const pinSet = new Set<string>((pins || []).map((p: any) => p.message_id));
    setPinnedIds(pinSet);
    const msgIds = (msgs || []).map((m: any) => m.id);
    let reactData: any[] = [];
    if (msgIds.length > 0) {
      const { data: r } = await supabase.from("message_reactions").select("*").in("message_id", msgIds);
      reactData = r || [];
    }
    setAllReactions(reactData);
    const mapped = (msgs || []).map(m => msgMap(m, pinSet, sessionUser?.id, reactData));
    setMessages(mapped);
    setPinnedMessages(mapped.filter(m => m.isPinned));
  }, [activeChId, sessionUser?.id]);

  useEffect(() => {
    loadMessages();
    if (!activeChId) return;
    const ch = supabase.channel(`msgs:${activeChId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${activeChId}` },
        async () => { await loadMessages(); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_reactions" },
        async () => { await loadMessages(); })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "message_reactions" },
        async () => { await loadMessages(); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeChId, loadMessages]);

  // Load thread messages
  useEffect(() => {
    if (!threadMsg) { setThreadMessages([]); return; }
    (async () => {
      const { data } = await supabase.from("messages").select("*")
        .eq("parent_message_id", threadMsg.id).order("created_at");
      const pinSet = new Set<string>();
      setThreadMessages((data || []).map(m => msgMap(m, pinSet, sessionUser?.id, allReactions)));
    })();
  }, [threadMsg, allReactions]);

  // ─── Send Message ────────────────────────────────────────────────────────
  const sendMsg = async (parentId?: string, inputOverride?: string) => {
    const text = inputOverride ?? chatInput;
    if (!text.trim() || !activeChId || sending) return;
    if (parentId ? false : !canPost) return;
    const isQuestion = isQnA && !parentId;
    setSending(true);
    if (!parentId) setChatInput("");
    else setThreadInput("");
    const payload: any = {
      room_id: activeChId,
      user_id: sessionUser?.id,
      user_name: profile?.full_name || sessionUser?.email || "Anonymous",
      user_role: viewerRole,
      text,
      avatar_color: pickColor(profile?.full_name || "U"),
      is_question: isQuestion,
    };
    if (parentId) {
      payload.parent_message_id = parentId;
      payload.reply_to_user = replyingTo?.user;
      payload.reply_to_text = replyingTo?.text?.slice(0, 80);
    }
    if (pendingFile) {
      payload.attachment_url = pendingFile.url;
      payload.attachment_name = pendingFile.name;
      payload.attachment_type = pendingFile.type;
      setPendingFile(null);
    }
    await supabase.from("messages").insert(payload);
    setReplyingTo(null);
    setSending(false);
  };

  // ─── Reactions ───────────────────────────────────────────────────────────
  const toggleReaction = async (msgId: string, emoji: string) => {
    if (!sessionUser) return;
    const existing = allReactions.find(r => r.message_id === msgId && r.user_id === sessionUser.id && r.emoji === emoji);
    if (existing) {
      await supabase.from("message_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("message_reactions").insert({ message_id: msgId, user_id: sessionUser.id, emoji });
    }
    setEmojiPickerFor(null);
    await loadMessages();
  };

  // ─── Pin Message ─────────────────────────────────────────────────────────
  const pinMessage = async (msgId: string) => {
    if (!isTeacher) return;
    const already = pinnedIds.has(msgId);
    if (already) {
      await supabase.from("pinned_messages").delete().eq("message_id", msgId).eq("channel_id", activeChId);
    } else {
      await supabase.from("pinned_messages").insert({ channel_id: activeChId, message_id: msgId, pinned_by: sessionUser?.id });
    }
    setActiveMenu(null);
    await loadMessages();
  };

  // ─── Mark QnA Resolved ───────────────────────────────────────────────────
  const markResolved = async (msgId: string) => {
    await supabase.from("messages").update({ is_resolved: true }).eq("id", msgId);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_resolved: true } : m));
  };

  // ─── File Upload ─────────────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionUser) return;
    setUploadingFile(true);
    const ext = file.name.split(".").pop();
    const path = `${sessionUser.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("community-files").upload(path, file, { upsert: true });
    if (error) { alert("Upload failed: " + error.message); setUploadingFile(false); return; }
    const { data: urlData } = supabase.storage.from("community-files").getPublicUrl(path);
    const fileType = file.type.startsWith("image") ? "image" : file.type === "application/pdf" ? "pdf" : "file";
    setPendingFile({ url: urlData.publicUrl, name: file.name, type: fileType });
    setUploadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── AI Translate ────────────────────────────────────────────────────────
  const translateMsg = async (msgId: string, text: string) => {
    if (translations[msgId]) { setTranslations(p => { const n = { ...p }; delete n[msgId]; return n; }); return; }
    setTranslating(msgId);
    const langLabel = LANGS.find(l => l.code === selectedLang)?.label || "English";
    const result = await translateTextWithOpenAI(text, langLabel);
    setTranslations(p => ({ ...p, [msgId]: result }));
    setTranslating(null);
  };

  // ─── AI Channel Summary ───────────────────────────────────────────────────
  const summarizeChannel = async () => {
    setSummarizing(true); setShowSummary(true);
    const texts = topLevelMessages.slice(-40).map(m => `${m.user}: ${m.text}`);
    const result = await askAIAssistant(
      `Summarize the following community channel conversation in 3-5 key bullet points for a student who missed the discussion:\n\n${texts.join("\n")}`,
      "Community channel summary task."
    );
    setSummary(result); setSummarizing(false);
  };

  // ─── Community CRUD ───────────────────────────────────────────────────────
  const createCommunity = async () => {
    if (!newName.trim() || !sessionUser || creating) return;
    setCreating(true);
    const color = pickColor(newName);
    const { data, error } = await supabase.from("communities").insert({
      name: newName, type: newType, color, avatar: newName.slice(0, 2).toUpperCase(),
      created_by: sessionUser.id, description: newDesc || null,
      passcode: newType === "private" ? (newPass || null) : null,
    }).select().single();
    if (error || !data) { alert("Failed: " + error?.message); setCreating(false); return; }
    await supabase.from("community_members").insert({ community_id: data.id, user_id: sessionUser.id, role: "admin" });
    const { data: ch } = await supabase.from("channels").insert({ community_id: data.id, name: "general", channel_type: "text" }).select().single();
    const { data: ach } = await supabase.from("channels").insert({ community_id: data.id, name: "announcements", channel_type: "announcement" }).select().single();
    const nc: Community = { id: data.id, name: data.name, avatar: data.avatar, color, type: data.type as any, unread: 0, created_by: sessionUser.id };
    setCommunities(prev => [...prev, nc]); setActiveCid(data.id);
    const chList: Channel[] = [];
    if (ch) chList.push({ id: ch.id, name: ch.name, locked: false, unread: 0, channel_type: "text" });
    if (ach) chList.push({ id: ach.id, name: ach.name, locked: false, unread: 0, channel_type: "announcement" });
    setChannels(chList); setActiveChId(chList[0]?.id || "");
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

  const createChannel = async () => {
    if (!newChanName.trim() || !activeCid) return;
    const { data, error } = await supabase.from("channels").insert({
      community_id: activeCid, name: newChanName.toLowerCase().replace(/\s+/g, "-"),
      channel_type: newChanType, created_by: sessionUser?.id,
    }).select().single();
    if (error || !data) { alert("Failed: " + error?.message); return; }
    const nc: Channel = { id: data.id, name: data.name, locked: false, unread: 0, channel_type: newChanType };
    setChannels(prev => [...prev, nc]); setActiveChId(data.id);
    setNewChanName(""); setNewChanType("text"); setShowCreateChannel(false);
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || !sessionUser || creating) return;
    setCreating(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase.from("rooms").insert({
      name: newRoomName, code, language: newRoomLang, teacher_id: sessionUser.id,
      community_id: activeCid, is_private: privateRoom, status: "offline",
    }).select().single();
    if (error) { alert("Failed: " + error.message); setCreating(false); return; }
    if (data) {
      setRooms(prev => [...prev, { id: data.id, name: data.name, teacher: data.teacher_id, participants: 0, live: false, code: data.code, is_private: data.is_private }]);
      setNewRoomName(""); setNewRoomLang("English"); setPrivateRoom(false); setShowCreateRoom(false);
      navigate(`/classroom/${data.id}`);
    }
    setCreating(false);
  };

  const copyId = () => { if (!activeCommunity) return; navigator.clipboard.writeText(activeCommunity.id); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); };

  const muteUnmuteMember = async (m: Member) => {
    if (!m.id || !activeCid) return;
    const now = m.is_muted;
    await supabase.from("community_members").update({ is_muted: !now }).eq("community_id", activeCid).eq("user_id", m.id);
    setMembers(prev => prev.map(x => x.id === m.id ? { ...x, is_muted: !now } : x));
    setShowMemberMenu(null);
  };

  const removeMember = async (m: Member) => {
    if (!m.id || !activeCid) return;
    if (!confirm(`Remove ${m.name} from this community?`)) return;
    await supabase.from("community_members").delete().eq("community_id", activeCid).eq("user_id", m.id);
    setMembers(prev => prev.filter(x => x.id !== m.id));
    setShowMemberMenu(null);
  };

  // Close menus on outside click
  useEffect(() => {
    const handler = () => { setEmojiPickerFor(null); setActiveMenu(null); setLangOpen(false); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex overflow-hidden" style={{ background: S.bg, fontFamily: "'Inter',system-ui,sans-serif" }} onClick={() => { setEmojiPickerFor(null); setActiveMenu(null); }}>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />}
      {showMemberMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMemberMenu(null)} />}

      {/* ── Community Rail ── */}
      <div className="hidden md:flex w-[68px] flex-col items-center py-3 gap-1 shrink-0 overflow-y-auto" style={{ background: S.rail, borderRight: `1px solid ${S.border}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 shrink-0 cursor-pointer" style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }} onClick={() => navigate("/")}>
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div className="w-8 h-px mb-1" style={{ background: S.border }} />
        {communities.map(c => (
          <button key={c.id} onClick={() => setActiveCid(c.id)} title={c.name}
            className="relative w-12 h-12 rounded-2xl flex items-center justify-center text-sm text-white font-bold transition-all hover:rounded-xl shrink-0 mb-0.5"
            style={{ background: c.id === activeCid ? c.color : `${c.color}33`, border: `2px solid ${c.id === activeCid ? c.color : "transparent"}` }}>
            {c.avatar}
            {c.unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center" style={{ background: "#f85149", fontSize: 9 }}>{c.unread}</span>}
          </button>
        ))}
        <div className="w-8 h-px my-1" style={{ background: S.border }} />
        <button onClick={() => setShowCreate(true)} title="Create Community" className="w-12 h-12 rounded-2xl flex items-center justify-center hover:rounded-xl transition-all" style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950" }}><Plus className="w-5 h-5" /></button>
        <button onClick={() => { setShowExplore(true); searchComms(); }} title="Explore" className="w-12 h-12 rounded-2xl flex items-center justify-center hover:rounded-xl transition-all mt-1" style={{ background: "rgba(88,166,255,0.1)", color: "#58a6ff" }}><Search className="w-4 h-4" /></button>
        <button onClick={() => setShowJoin(true)} title="Join with Code" className="w-12 h-12 rounded-2xl flex items-center justify-center hover:rounded-xl transition-all mt-1" style={{ background: "rgba(124,58,237,0.1)", color: "#c4b5fd" }}><Key className="w-4 h-4" /></button>
        <div className="flex-1" />
        {profile && (
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-xs text-white font-bold mb-1 shrink-0" style={{ background: pickColor(profile.full_name || "U") }} title={profile.full_name}>
            {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" /> : (profile.full_name || "U").slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* ── Channel Sidebar ── */}
      <div className={`flex-col shrink-0 overflow-hidden transition-all duration-300 ${sidebarOpen ? "flex fixed inset-y-0 left-0 z-50 w-64" : "hidden md:flex w-60"}`} style={{ background: S.sidebar, borderRight: `1px solid ${S.border}` }}>
        {activeCommunity ? (
          <>
            {/* Community Header */}
            <div className="px-4 py-3 flex items-center justify-between shrink-0 cursor-pointer hover:bg-white/5 transition-colors" style={{ borderBottom: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-white font-bold shrink-0" style={{ background: activeCommunity.color }}>{activeCommunity.avatar}</div>
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color: S.text }}>{activeCommunity.name}</div>
                  <div className="text-xs flex items-center gap-1" style={{ color: S.sub }}>
                    {activeCommunity.type === "private" ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}{activeCommunity.type}
                    <span className="ml-1">· {members.length} members</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={e => { e.stopPropagation(); copyId(); }} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: copiedId ? "#3fb950" : S.sub }} title="Copy Invite Code">{copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</button>
                {isTeacher && <button onClick={e => { e.stopPropagation(); setShowSettings(true); }} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: S.sub }}><Settings className="w-3.5 h-3.5" /></button>}
                {isOwner ? <button onClick={e => { e.stopPropagation(); setShowDel(true); }} className="p-1.5 rounded-lg hover:text-red-400 transition-colors" style={{ color: S.sub }}><Trash2 className="w-3.5 h-3.5" /></button>
                  : <button onClick={e => { e.stopPropagation(); leaveCommunity(); }} className="p-1.5 rounded-lg hover:text-red-400 transition-colors" style={{ color: S.sub }}><LogOut className="w-3.5 h-3.5" /></button>}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              {/* Channels */}
              <div className="px-3 mb-3">
                <div className="flex items-center justify-between px-1 py-1 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: S.sub }}>Channels</span>
                  {isTeacher && <button onClick={() => setShowCreateChannel(true)} className="p-0.5 rounded hover:text-white transition-colors" style={{ color: S.sub }}><Plus className="w-3.5 h-3.5" /></button>}
                </div>
                {channels.length === 0 && <p className="text-xs px-1 py-0.5 italic" style={{ color: S.sub }}>No channels yet</p>}
                {channels.map(ch => (
                  <button key={ch.id} onClick={() => { setActiveChId(ch.id); setSidebarOpen(false); setThreadMsg(null); }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left mb-0.5 group transition-colors"
                    style={{ background: activeChId === ch.id ? "rgba(124,58,237,0.18)" : "transparent", color: activeChId === ch.id ? "#c4b5fd" : S.sub }}>
                    <span style={{ color: activeChId === ch.id ? "#c4b5fd" : S.sub }}>{chanIcon(ch.channel_type)}</span>
                    <span className="text-sm truncate flex-1">{ch.name}</span>
                    {ch.locked && <Lock className="w-3 h-3 opacity-40" />}
                    {ch.channel_type === "announcement" && <span className="text-xs opacity-50" style={{ fontSize: 9 }}>ANN</span>}
                    {ch.unread > 0 && <span className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold" style={{ background: "#7c3aed", fontSize: 9 }}>{ch.unread}</span>}
                  </button>
                ))}
              </div>

              {/* Rooms */}
              <div className="px-3 mb-3">
                <div className="flex items-center justify-between px-1 py-1 mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: S.sub }}>Voice Rooms</span>
                  {isTeacher && <button onClick={() => setShowCreateRoom(true)} className="p-0.5 rounded hover:text-white transition-colors" style={{ color: S.sub }}><Plus className="w-3.5 h-3.5" /></button>}
                </div>
                {rooms.length === 0 && <p className="text-xs px-1 italic" style={{ color: S.sub }}>{isTeacher ? "Click + to create" : "No rooms yet"}</p>}
                {rooms.map(r => (
                  <button key={r.id} onClick={() => navigate(`/classroom/${r.id}`)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left mb-0.5 hover:bg-white/5 transition-colors" style={{ color: S.sub }}>
                    <Video className="w-3.5 h-3.5 shrink-0" style={{ color: r.live ? "#3fb950" : S.sub }} />
                    <span className="text-sm truncate flex-1">{r.name}</span>
                    {r.live && <span className="text-xs px-1.5 rounded font-bold" style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950", fontSize: 10 }}>LIVE</span>}
                    {r.is_private && <Lock className="w-3 h-3 opacity-40" />}
                  </button>
                ))}
              </div>
            </div>

            {/* User Panel */}
            <div className="px-3 py-2 shrink-0" style={{ borderTop: `1px solid ${S.border}`, background: "#0d1117" }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0 overflow-hidden" style={{ background: pickColor(profile?.full_name || "U") }}>
                  {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" /> : (profile?.full_name || "U").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate" style={{ color: S.text }}>{profile?.full_name || sessionUser?.email || "User"}</div>
                  <div className="text-xs capitalize" style={{ color: badge(viewerRole)?.color }}>{viewerRole}</div>
                </div>
                <div className="flex gap-0.5">
                  <button onClick={() => setMicOn(!micOn)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: micOn ? S.sub : "#f85149" }} title={micOn ? "Mute" : "Unmute"}>{micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}</button>
                  <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: S.sub }}><Headphones className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
            <BookOpen className="w-10 h-10" style={{ color: S.sub }} />
            <p className="text-sm" style={{ color: S.sub }}>Select or join a community</p>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* Chat / Channel Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {!activeCid ? (
            /* Welcome Screen */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-2xl" style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}>
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: S.text }}>Welcome to Communities</h2>
              <p className="text-sm mb-8 max-w-xs" style={{ color: S.sub }}>Join study groups, learning hubs, and school communities. Chat, share files, and learn together across languages.</p>
              <div className="flex gap-3 flex-wrap justify-center">
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg,#1e3a8a,#7c3aed)" }}><Plus className="w-4 h-4" />Create Community</button>
                <button onClick={() => { setShowExplore(true); searchComms(); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm" style={{ background: "rgba(88,166,255,0.1)", color: "#58a6ff", border: "1px solid rgba(88,166,255,0.2)" }}><Search className="w-4 h-4" />Explore</button>
                <button onClick={() => setShowJoin(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm" style={{ background: "rgba(124,58,237,0.1)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.2)" }}><Key className="w-4 h-4" />Join with Code</button>
              </div>
              <div className="mt-8">
                <button onClick={() => navigate("/")} className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-80 transition-opacity" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>Back to Dashboard</button>
              </div>
            </div>
          ) : !activeChId ? (
            /* No Channel Selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="w-14 h-14 mb-4" style={{ color: S.sub }} />
              <h3 className="text-lg font-bold mb-1" style={{ color: S.text }}>{activeCommunity?.name}</h3>
              <p className="text-sm" style={{ color: S.sub }}>Select a channel to start chatting</p>
              <button className="md:hidden mt-4 px-4 py-2 rounded-xl text-sm font-semibold mb-2" style={{ background: "rgba(124,58,237,0.15)", color: "#c4b5fd" }} onClick={() => setSidebarOpen(true)}>Open Channels</button>
              <button className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }} onClick={() => navigate("/")}>Dashboard</button>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="h-14 flex items-center justify-between px-4 shrink-0" style={{ borderBottom: `1px solid ${S.border}`, background: "rgba(14,17,23,0.97)", backdropFilter: "blur(8px)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <button className="md:hidden p-1.5 rounded-lg mr-1 cursor-pointer" style={{ color: S.sub }} onClick={() => navigate("/")} title="Dashboard"><GraduationCap className="w-5 h-5" /></button>
                  <button className="md:hidden p-1.5 rounded-lg mr-1" style={{ color: S.sub }} onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
                  <span style={{ color: S.sub }}>{chanIcon(activeChannel?.channel_type || "text")}</span>
                  <span className="font-bold text-sm truncate" style={{ color: S.text }}>{activeChannel?.name}</span>
                  {activeChannel?.topic && <span className="hidden sm:block text-xs truncate ml-2 pl-2" style={{ color: S.sub, borderLeft: `1px solid ${S.border}` }}>{activeChannel.topic}</span>}
                  {isAnnouncement && <span className="text-xs px-2 py-0.5 rounded-full ml-1 shrink-0" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>Announcements</span>}
                  {isQnA && <span className="text-xs px-2 py-0.5 rounded-full ml-1 shrink-0" style={{ background: "rgba(88,166,255,0.15)", color: "#58a6ff" }}>Q&amp;A</span>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Pinned */}
                  {pinnedMessages.length > 0 && (
                    <button onClick={() => setShowPinned(!showPinned)} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium" style={{ background: showPinned ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.08)", color: "#c4b5fd" }}>
                      <Pin className="w-3.5 h-3.5" /><span className="hidden sm:inline">{pinnedMessages.length} pinned</span>
                    </button>
                  )}
                  {/* AI Summary */}
                  <button onClick={summarizeChannel} className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium hidden sm:flex" style={{ background: "rgba(63,185,80,0.08)", color: "#3fb950" }}>
                    <Sparkles className="w-3.5 h-3.5" />Summary
                  </button>
                  {/* Lang Picker */}
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(124,58,237,0.12)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.2)" }}>
                      <span>{langInfo.flag}</span><span className="hidden sm:inline">{langInfo.code.toUpperCase()}</span><ChevronDown className="w-3 h-3" />
                    </button>
                    {langOpen && (
                      <div className="absolute right-0 top-full mt-1 w-44 rounded-xl py-1 z-30 overflow-y-auto shadow-2xl" style={{ background: "#1c2333", border: `1px solid ${S.border}`, maxHeight: 260 }}>
                        {LANGS.map(l => (
                          <button key={l.code} onClick={() => { setSelectedLang(l.code); setLangOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-white/5 transition-colors" style={{ color: selectedLang === l.code ? "#c4b5fd" : S.text }}>
                            {l.flag} {l.label} {selectedLang === l.code && <Check className="w-3 h-3 ml-auto" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setMembersOpen(!membersOpen)} className="p-2 rounded-lg hover:bg-white/5 transition-colors" style={{ color: membersOpen ? "#c4b5fd" : S.sub }}><Users className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Pinned Banner */}
              {showPinned && pinnedMessages.length > 0 && (
                <div className="px-4 py-2 shrink-0" style={{ background: "rgba(124,58,237,0.08)", borderBottom: `1px solid ${S.border}` }}>
                  <div className="flex items-center gap-2 mb-1"><Pin className="w-3.5 h-3.5" style={{ color: "#c4b5fd" }} /><span className="text-xs font-bold" style={{ color: "#c4b5fd" }}>Pinned Messages</span></div>
                  {pinnedMessages.map(pm => (
                    <div key={pm.id} className="flex items-center gap-2 text-xs py-0.5 cursor-pointer hover:opacity-80" style={{ color: S.sub }}>
                      <span className="font-semibold" style={{ color: pm.color }}>{pm.user}:</span>
                      <span className="truncate">{pm.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Summary Banner */}
              {showSummary && (
                <div className="px-4 py-3 shrink-0 relative" style={{ background: "rgba(63,185,80,0.06)", borderBottom: `1px solid ${S.border}` }}>
                  <div className="flex items-center gap-2 mb-1"><Sparkles className="w-3.5 h-3.5" style={{ color: "#3fb950" }} /><span className="text-xs font-bold" style={{ color: "#3fb950" }}>AI Channel Summary</span><button onClick={() => setShowSummary(false)} className="ml-auto p-0.5 rounded" style={{ color: S.sub }}><X className="w-3.5 h-3.5" /></button></div>
                  {summarizing ? <div className="flex items-center gap-2 text-xs" style={{ color: S.sub }}><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating summary...</div>
                    : <p className="text-xs leading-relaxed whitespace-pre-line" style={{ color: S.text }}>{summary}</p>}
                </div>
              )}

              <div className="flex flex-1 min-h-0">
                {/* Messages Column */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    {topLevelMessages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: "rgba(124,58,237,0.1)" }}>
                          <span style={{ color: "#7c3aed" }}>{chanIcon(activeChannel?.channel_type || "text")}</span>
                        </div>
                        <h3 className="font-bold mb-1" style={{ color: S.text }}>Welcome to #{activeChannel?.name}!</h3>
                        <p className="text-sm" style={{ color: S.sub }}>{isAnnouncement ? "Only teachers can post here." : "Be the first to say something 👋"}</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {topLevelMessages.map((msg, i) => {
                          const prev = topLevelMessages[i - 1];
                          const grouped = prev?.userId === msg.userId && !msg.isPinned;
                          const b = badge(msg.role);
                          return (
                            <div key={msg.id} className={`group flex gap-3 px-2 py-0.5 rounded-lg hover:bg-white/[0.025] relative ${grouped ? "pl-14" : "pt-3"} ${msg.isPinned ? "border-l-2 pl-3" : ""}`} style={{ borderColor: msg.isPinned ? "#7c3aed" : "transparent" }}>
                              {!grouped && (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0 mt-0.5" style={{ background: msg.color }}>{msg.avatar}</div>
                              )}
                              <div className="min-w-0 flex-1">
                                {!grouped && (
                                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <span className="text-sm font-semibold" style={{ color: msg.color }}>{msg.user}</span>
                                    <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: b?.bg, color: b?.color }}>{b?.label}</span>
                                    <span className="text-xs" style={{ color: S.sub }}>{msg.time}</span>
                                    {msg.isPinned && <span className="text-xs flex items-center gap-0.5" style={{ color: "#c4b5fd" }}><Pin className="w-3 h-3" />pinned</span>}
                                    {msg.is_resolved && <span className="text-xs flex items-center gap-0.5" style={{ color: "#3fb950" }}><CheckCircle2 className="w-3 h-3" />resolved</span>}
                                  </div>
                                )}
                                {/* Reply quote */}
                                {msg.replyToUser && (
                                  <div className="flex items-center gap-1.5 mb-1 text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", borderLeft: "2px solid #7c3aed" }}>
                                    <CornerDownRight className="w-3 h-3 shrink-0" style={{ color: "#7c3aed" }} />
                                    <span className="font-semibold" style={{ color: "#c4b5fd" }}>{msg.replyToUser}</span>
                                    <span className="truncate" style={{ color: S.sub }}>{msg.replyToText}</span>
                                  </div>
                                )}
                                {/* Message text — detect YouTube links */}
                                {(() => {
                                  const ytId = extractYtId(msg.text);
                                  // Highlight URLs in plain text
                                  const urlRegex = /(https?:\/\/[^\s]+)/g;
                                  const parts = msg.text.split(urlRegex);
                                  return (
                                    <>
                                      <p className="text-sm leading-relaxed break-words" style={{ color: "#cdd9e5" }}>
                                        {parts.map((part, idx) =>
                                          urlRegex.test(part)
                                            ? <a key={idx} href={part} target="_blank" rel="noreferrer" className="underline hover:opacity-80 transition-opacity" style={{ color: "#58a6ff" }}>{part}</a>
                                            : part
                                        )}
                                      </p>
                                      {ytId && <YouTubeEmbed videoId={ytId} />}
                                    </>
                                  );
                                })()}
                                {/* Attachment */}
                                {msg.attachment && (
                                  <div className="mt-2">
                                    {msg.attachment.type === "image" ? (
                                      <img src={msg.attachment.url} alt={msg.attachment.name} className="max-w-xs rounded-xl object-cover cursor-pointer hover:opacity-90" style={{ maxHeight: 200 }} onClick={() => window.open(msg.attachment!.url, "_blank")} />
                                    ) : (
                                      <a href={msg.attachment.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:opacity-80 transition-opacity" style={{ background: "rgba(255,255,255,0.06)", color: S.text, border: `1px solid ${S.border}` }}>
                                        {msg.attachment.type === "pdf" ? <FileText className="w-4 h-4 shrink-0" style={{ color: "#f85149" }} /> : <Paperclip className="w-4 h-4 shrink-0" style={{ color: "#58a6ff" }} />}
                                        <span className="truncate flex-1">{msg.attachment.name}</span>
                                        <Download className="w-3.5 h-3.5 shrink-0" style={{ color: S.sub }} />
                                      </a>
                                    )}
                                  </div>
                                )}
                                {/* Translation */}
                                {translations[msg.id] && (
                                  <div className="mt-1 text-xs px-2 py-1 rounded-lg italic" style={{ background: "rgba(88,166,255,0.08)", color: "#93c5fd", borderLeft: "2px solid #3b82f6" }}>
                                    <span className="font-semibold not-italic">{langInfo.flag} </span>{translations[msg.id]}
                                  </div>
                                )}
                                {/* Reactions */}
                                {Object.keys(msg.reactions).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {Object.values(msg.reactions).map(r => (
                                      <button key={r.emoji} onClick={() => toggleReaction(msg.id, r.emoji)}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs hover:opacity-80 transition-opacity"
                                        style={{ background: r.reacted ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${r.reacted ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.08)"}`, color: r.reacted ? "#c4b5fd" : S.text }}>
                                        {r.emoji} {r.count}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {/* Thread replies count */}
                                {messages.filter(m => m.parentId === msg.id).length > 0 && (
                                  <button onClick={() => setThreadMsg(msg)} className="mt-1 flex items-center gap-1.5 text-xs hover:opacity-80 transition-opacity" style={{ color: "#58a6ff" }}>
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    {messages.filter(m => m.parentId === msg.id).length} {messages.filter(m => m.parentId === msg.id).length === 1 ? "reply" : "replies"}
                                  </button>
                                )}
                              </div>
                              {/* Message Actions */}
                              <div className="absolute right-2 top-1 hidden group-hover:flex items-center gap-0.5 rounded-lg px-1 py-0.5 z-10" style={{ background: S.sidebar, border: `1px solid ${S.border}` }} onClick={e => e.stopPropagation()}>
                                {EMOJI_LIST.slice(0, 5).map(em => <button key={em} onClick={() => toggleReaction(msg.id, em)} className="p-1 hover:bg-white/10 rounded text-sm">{em}</button>)}
                                <button onClick={() => setReplyingTo(msg)} className="p-1 hover:bg-white/10 rounded" style={{ color: S.sub }} title="Reply"><CornerDownRight className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setThreadMsg(msg)} className="p-1 hover:bg-white/10 rounded" style={{ color: S.sub }} title="Thread"><MessageSquare className="w-3.5 h-3.5" /></button>
                                <button onClick={() => translateMsg(msg.id, msg.text)} className="p-1 hover:bg-white/10 rounded" style={{ color: translating === msg.id ? "#c4b5fd" : S.sub }} title="Translate">{translating === msg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}</button>
                                {isTeacher && <button onClick={() => pinMessage(msg.id)} className="p-1 hover:bg-white/10 rounded" style={{ color: msg.isPinned ? "#c4b5fd" : S.sub }} title={msg.isPinned ? "Unpin" : "Pin"}><Pin className="w-3.5 h-3.5" /></button>}
                                {isQnA && !msg.is_resolved && isTeacher && <button onClick={() => markResolved(msg.id)} className="p-1 hover:bg-white/10 rounded" style={{ color: S.sub }} title="Mark Resolved"><CheckCircle2 className="w-3.5 h-3.5" /></button>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div ref={msgEndRef} />
                  </div>

                  {/* Reply Banner */}
                  {replyingTo && (
                    <div className="mx-4 mb-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(124,58,237,0.1)", border: `1px solid rgba(124,58,237,0.2)` }}>
                      <CornerDownRight className="w-3.5 h-3.5 shrink-0" style={{ color: "#7c3aed" }} />
                      <span style={{ color: S.sub }}>Replying to <span className="font-semibold" style={{ color: "#c4b5fd" }}>{replyingTo.user}</span>: {replyingTo.text.slice(0, 60)}{replyingTo.text.length > 60 ? "…" : ""}</span>
                      <button onClick={() => setReplyingTo(null)} className="ml-auto shrink-0" style={{ color: S.sub }}><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}

                  {/* Pending File Preview */}
                  {pendingFile && (
                    <div className="mx-4 mb-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(88,166,255,0.08)", border: `1px solid rgba(88,166,255,0.2)` }}>
                      {pendingFile.type === "image" ? <Image className="w-4 h-4 shrink-0" style={{ color: "#58a6ff" }} /> : <Paperclip className="w-4 h-4 shrink-0" style={{ color: "#58a6ff" }} />}
                      <span className="truncate flex-1" style={{ color: S.text }}>{pendingFile.name}</span>
                      <button onClick={() => setPendingFile(null)} style={{ color: S.sub }}><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="px-4 pb-4 shrink-0">
                    {canPost ? (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "#1c2333", border: `1px solid ${S.border}` }}>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className="shrink-0 hover:opacity-80 transition-opacity" style={{ color: S.sub }} title="Attach file">
                          {uploadingFile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                        </button>
                        <input
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                          placeholder={`Message #${activeChannel?.name} (${langInfo.flag} ${langInfo.label})`}
                          className="flex-1 bg-transparent text-sm outline-none"
                          style={{ color: S.text }}
                        />
                        <div className="relative" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setEmojiPickerFor(emojiPickerFor ? null : "input")} style={{ color: S.sub }}><Smile className="w-5 h-5" /></button>
                          {emojiPickerFor === "input" && (
                            <div className="absolute bottom-full right-0 mb-2 flex gap-1 p-2 rounded-xl shadow-2xl" style={{ background: "#1c2333", border: `1px solid ${S.border}` }}>
                              {EMOJI_LIST.map(em => <button key={em} onClick={() => { setChatInput(p => p + em); setEmojiPickerFor(null); }} className="text-lg hover:scale-125 transition-transform">{em}</button>)}
                            </div>
                          )}
                        </div>
                        <button onClick={() => sendMsg()} disabled={!chatInput.trim() && !pendingFile} style={{ color: (chatInput.trim() || pendingFile) ? "#7c3aed" : S.sub }}>
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(245,158,11,0.06)", border: `1px solid rgba(245,158,11,0.2)`, color: "#f59e0b" }}>
                        <Megaphone className="w-4 h-4 shrink-0" />This is an announcement channel. Only teachers can post here.
                      </div>
                    )}
                  </div>
                </div>

                {/* Thread Panel */}
                {threadMsg && (
                  <div className="w-80 shrink-0 flex flex-col border-l overflow-hidden" style={{ borderColor: S.border, background: S.sidebar }}>
                    <div className="px-4 py-3 flex items-center gap-2 shrink-0" style={{ borderBottom: `1px solid ${S.border}` }}>
                      <MessageSquare className="w-4 h-4" style={{ color: "#58a6ff" }} />
                      <span className="font-bold text-sm flex-1" style={{ color: S.text }}>Thread</span>
                      <button onClick={() => setThreadMsg(null)} style={{ color: S.sub }}><X className="w-4 h-4" /></button>
                    </div>
                    {/* Original message */}
                    <div className="px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${S.border}`, background: "rgba(255,255,255,0.02)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-bold" style={{ background: threadMsg.color }}>{threadMsg.avatar}</div>
                        <span className="text-xs font-semibold" style={{ color: threadMsg.color }}>{threadMsg.user}</span>
                        <span className="text-xs" style={{ color: S.sub }}>{threadMsg.time}</span>
                      </div>
                      <p className="text-sm" style={{ color: "#cdd9e5" }}>{threadMsg.text}</p>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 py-2">
                      {threadMessages.length === 0 && <p className="text-xs text-center mt-4 italic" style={{ color: S.sub }}>No replies yet. Start the thread!</p>}
                      {threadMessages.map(m => (
                        <div key={m.id} className="flex gap-2 mb-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0 mt-0.5" style={{ background: m.color }}>{m.avatar}</div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-semibold" style={{ color: m.color }}>{m.user}</span>
                              <span className="text-xs" style={{ color: S.sub }}>{m.time}</span>
                            </div>
                            <p className="text-sm break-words" style={{ color: "#cdd9e5" }}>{m.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-3 pb-3 shrink-0">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#0d1117", border: `1px solid ${S.border}` }}>
                        <input value={threadInput} onChange={e => setThreadInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(threadMsg.id, threadInput); } }}
                          placeholder="Reply in thread..." className="flex-1 bg-transparent text-xs outline-none" style={{ color: S.text }} />
                        <button onClick={() => sendMsg(threadMsg.id, threadInput)} style={{ color: threadInput.trim() ? "#7c3aed" : S.sub }}>
                          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Members Panel */}
                {membersOpen && !threadMsg && (
                  <div className="w-56 shrink-0 overflow-y-auto py-3 border-l" style={{ borderColor: S.border, background: S.sidebar }}>
                    <div className="px-4 mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: S.sub }}>Members — {members.length}</span>
                      <button onClick={() => setMembersOpen(false)} style={{ color: S.sub }}><X className="w-3.5 h-3.5" /></button>
                    </div>
                    {teachers.length > 0 && (
                      <div className="mb-3">
                        <div className="px-4 mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: S.sub }}>Teachers — {teachers.length}</div>
                        {teachers.map(m => <MemberRow key={m.id || m.name} m={m} isOwner={isOwner} onMenu={() => setShowMemberMenu(m)} />)}
                      </div>
                    )}
                    {students.length > 0 && (
                      <div>
                        <div className="px-4 mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: S.sub }}>Students — {students.length}</div>
                        {students.map(m => <MemberRow key={m.id || m.name} m={m} isOwner={isOwner} onMenu={() => setShowMemberMenu(m)} />)}
                      </div>
                    )}
                    {members.length === 0 && <p className="px-4 text-xs" style={{ color: S.sub }}>No members</p>}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Create Community */}
      {showCreate && (
        <CModal title="Create Community" icon={<GraduationCap className="w-5 h-5" />} onClose={() => setShowCreate(false)}>
          <CField label="Community Name"><input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Biology Study Group" /></CField>
          <CField label="Description (optional)"><input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What is this community about?" /></CField>
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-2" style={{ color: S.sub }}>Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(["public", "private", "school"] as const).map(t => (
                <button key={t} onClick={() => setNewType(t)} className="py-2 rounded-xl text-xs font-semibold capitalize" style={{ background: newType === t ? "rgba(124,58,237,0.2)" : "#0d1117", color: newType === t ? "#c4b5fd" : S.sub, border: `1px solid ${newType === t ? "rgba(124,58,237,0.4)" : S.border}` }}>
                  {t === "public" ? "🌍 " : t === "private" ? "🔒 " : "🏫 "}{t}
                </button>
              ))}
            </div>
          </div>
          {newType === "private" && <CField label="Passcode *"><input value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Members must enter this to join" type="password" /></CField>}
          <div className="flex gap-2 mt-4"><CBtn ghost onClick={() => setShowCreate(false)}>Cancel</CBtn><CBtn onClick={createCommunity} disabled={creating || !newName.trim()}>{creating ? "Creating…" : "Create"}</CBtn></div>
        </CModal>
      )}

      {/* Join with Code */}
      {showJoin && (
        <CModal title="Join with Code" icon={<Key className="w-5 h-5" />} onClose={() => setShowJoin(false)}>
          <CField label="Community ID / Code"><input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Paste the community ID here" /></CField>
          <CField label="Passcode (if private)"><input value={joinPass} onChange={e => setJoinPass(e.target.value)} placeholder="Leave blank for public" type="password" /></CField>
          {joinErr && <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ color: "#f85149", background: "rgba(248,81,73,0.1)" }}>{joinErr}</p>}
          <div className="flex gap-2"><CBtn ghost onClick={() => setShowJoin(false)}>Cancel</CBtn><CBtn onClick={joinCommunity}>Join</CBtn></div>
        </CModal>
      )}

      {/* Explore */}
      {showExplore && (
        <CModal title="Explore Communities" icon={<Search className="w-5 h-5" />} onClose={() => setShowExplore(false)} wide>
          <div className="flex gap-2 mb-4">
            <input value={exploreQ} onChange={e => setExploreQ(e.target.value)} onKeyDown={e => e.key === "Enter" && searchComms()} placeholder="Search communities…" className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#0d1117", color: S.text, border: `1px solid ${S.border}` }} />
            <button onClick={searchComms} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "#7c3aed" }}>Search</button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {searching && <p className="text-center text-sm py-4" style={{ color: S.sub }}>Searching…</p>}
            {!searching && exploreRes.length === 0 && <p className="text-center text-sm py-4" style={{ color: S.sub }}>No communities found.</p>}
            {exploreRes.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#21262d" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm text-white font-bold shrink-0" style={{ background: c.color }}>{c.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate" style={{ color: S.text }}>{c.name}</div>
                  <div className="text-xs flex items-center gap-1" style={{ color: S.sub }}>{c.type === "private" ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}{c.type}{c.description ? ` · ${c.description}` : ""}</div>
                </div>
                {communities.find(x => x.id === c.id)
                  ? <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(63,185,80,0.15)", color: "#3fb950" }}>Joined</span>
                  : <button onClick={() => joinPublic(c)} className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold hover:opacity-90" style={{ background: "#7c3aed" }}>Join</button>}
              </div>
            ))}
          </div>
        </CModal>
      )}

      {/* Create Channel */}
      {showCreateChannel && (
        <CModal title="Create Channel" icon={<Hash className="w-5 h-5" />} onClose={() => setShowCreateChannel(false)}>
          <CField label="Channel Name"><input value={newChanName} onChange={e => setNewChanName(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="e.g. general-chat" /></CField>
          <div className="mb-4">
            <label className="block text-xs font-semibold mb-2" style={{ color: S.sub }}>Channel Type</label>
            <div className="grid grid-cols-2 gap-2">
              {([["text", "💬 Text", "Normal text chat"], ["announcement", "📢 Announce", "Teachers only"], ["qna", "❓ Q&A", "Questions & answers"], ["voice", "🔊 Voice", "Voice room link"]] as const).map(([t, label, desc]) => (
                <button key={t} onClick={() => setNewChanType(t as ChannelType)} className="p-2.5 rounded-xl text-xs text-left" style={{ background: newChanType === t ? "rgba(124,58,237,0.2)" : "#0d1117", border: `1px solid ${newChanType === t ? "rgba(124,58,237,0.4)" : S.border}`, color: newChanType === t ? "#c4b5fd" : S.text }}>
                  <div className="font-semibold mb-0.5">{label}</div>
                  <div style={{ color: S.sub, fontSize: 10 }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2"><CBtn ghost onClick={() => setShowCreateChannel(false)}>Cancel</CBtn><CBtn onClick={createChannel} disabled={!newChanName.trim()}>Create Channel</CBtn></div>
        </CModal>
      )}

      {/* Create Room */}
      {showCreateRoom && (
        <CModal title="Create Voice Room" icon={<Video className="w-5 h-5" />} onClose={() => setShowCreateRoom(false)}>
          <CField label="Room Name"><input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="e.g. Biology Live Session" /></CField>
          <CField label="Language">
            <select value={newRoomLang} onChange={e => setNewRoomLang(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none" style={{ background: "#0d1117", color: S.text, border: `1px solid ${S.border}` }}>
              {["English", "Spanish", "French", "Mandarin", "Japanese", "Portuguese", "German", "Arabic", "Hindi", "Yoruba"].map(l => <option key={l}>{l}</option>)}
            </select>
          </CField>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setPrivateRoom(!privateRoom)} className="w-10 h-6 rounded-full transition-colors relative shrink-0" style={{ background: privateRoom ? "#7c3aed" : "#21262d" }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: privateRoom ? "calc(100% - 1.35rem)" : "0.125rem" }} />
            </button>
            <span className="text-sm" style={{ color: S.text }}>Private <span style={{ color: S.sub }}>(requires approval)</span></span>
          </div>
          <div className="flex gap-2"><CBtn ghost onClick={() => setShowCreateRoom(false)}>Cancel</CBtn><CBtn onClick={createRoom} disabled={creating || !newRoomName.trim()}>{creating ? "Creating…" : "Create & Enter"}</CBtn></div>
        </CModal>
      )}

      {/* Delete Community */}
      {showDel && (
        <CModal title="Delete Community" icon={<Trash2 className="w-5 h-5" />} onClose={() => setShowDel(false)} danger>
          <p className="text-sm mb-1" style={{ color: S.text }}>Delete <strong>{activeCommunity?.name}</strong>?</p>
          <p className="text-sm mb-5" style={{ color: S.sub }}>All channels, messages, and members will be permanently removed. This cannot be undone.</p>
          <div className="flex gap-2"><CBtn ghost onClick={() => setShowDel(false)}>Cancel</CBtn><CBtn danger onClick={deleteCommunity}>Delete Forever</CBtn></div>
        </CModal>
      )}

      {/* Community Settings */}
      {showSettings && activeCommunity && (
        <CModal title="Community Settings" icon={<Settings className="w-5 h-5" />} onClose={() => setShowSettings(false)}>
          <div className="mb-4 p-3 rounded-xl flex items-center gap-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${S.border}` }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg text-white font-bold shrink-0" style={{ background: activeCommunity.color }}>{activeCommunity.avatar}</div>
            <div>
              <div className="font-bold text-sm" style={{ color: S.text }}>{activeCommunity.name}</div>
              <div className="text-xs capitalize" style={{ color: S.sub }}>{activeCommunity.type} community · {members.length} members</div>
            </div>
          </div>
          <div className="p-3 rounded-xl mb-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${S.border}` }}>
            <div className="text-xs font-semibold mb-1" style={{ color: S.sub }}>Invite Code</div>
            <div className="flex items-center gap-2">
              <code className="text-xs flex-1 truncate font-mono" style={{ color: "#c4b5fd" }}>{activeCommunity.id}</code>
              <button onClick={copyId} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: copiedId ? "#3fb950" : S.sub }}>{copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}</button>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <CBtn ghost onClick={() => setShowSettings(false)}>Close</CBtn>
            {!isOwner && <CBtn danger onClick={leaveCommunity}>Leave Community</CBtn>}
          </div>
        </CModal>
      )}

      {/* Member Context Menu */}
      {showMemberMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowMemberMenu(null)}>
          <div className="rounded-xl py-1 shadow-2xl w-48" style={{ background: "#1c2333", border: `1px solid ${S.border}` }} onClick={e => e.stopPropagation()}>
            <div className="px-3 py-2 border-b" style={{ borderColor: S.border }}>
              <div className="text-sm font-semibold" style={{ color: S.text }}>{showMemberMenu.name}</div>
              <div className="text-xs capitalize" style={{ color: badge(showMemberMenu.role)?.color }}>{showMemberMenu.role}</div>
            </div>
            {isOwner && showMemberMenu.id !== sessionUser?.id && (
              <>
                <button onClick={() => muteUnmuteMember(showMemberMenu)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors text-left" style={{ color: S.text }}>
                  {showMemberMenu.is_muted ? <><Bell className="w-4 h-4" />Unmute</> : <><BellOff className="w-4 h-4" />Mute</>}
                </button>
                <button onClick={() => removeMember(showMemberMenu)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-500/10 transition-colors text-left" style={{ color: "#f85149" }}>
                  <UserMinus className="w-4 h-4" />Remove Member
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// ─── Helper Sub-Components ────────────────────────────────────────────────────

function MemberRow({ m, isOwner, onMenu }: { m: Member; isOwner: boolean; onMenu: () => void }) {
  const b = { teacher: { color: "#f59e0b" }, admin: { color: "#f85149" }, student: { color: "#3fb950" } }[m.role];
  return (
    <div className="flex items-center gap-2.5 px-4 py-1.5 hover:bg-white/5 transition-colors group">
      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden" style={{ background: `${b?.color}22`, color: b?.color }}>
          {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" alt="" /> : m.avatar}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ background: m.is_muted ? "#6e7681" : m.status === "online" ? "#3fb950" : "#6e7681", borderColor: "#161b22" }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold truncate flex items-center gap-1" style={{ color: "#cdd9e5" }}>
          {m.nickname || m.name}
          {m.role === "admin" && <Crown className="w-3 h-3 shrink-0" style={{ color: "#f85149" }} />}
          {m.is_muted && <BellOff className="w-3 h-3 shrink-0" style={{ color: "#6e7681" }} />}
        </div>
        <div className="text-xs capitalize" style={{ color: b?.color, opacity: 0.75 }}>{m.role}</div>
      </div>
      {isOwner && <button onClick={onMenu} className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10" style={{ color: "#8b949e" }}><MoreHorizontal className="w-3.5 h-3.5" /></button>}
    </div>
  );
}

function CModal({ title, icon, onClose, children, wide, danger }: { title: string; icon: React.ReactNode; onClose: () => void; children: React.ReactNode; wide?: boolean; danger?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className={`rounded-2xl p-6 shadow-2xl w-full ${wide ? "max-w-lg" : "max-w-sm"}`} style={{ background: "#161b22", border: `1px solid ${danger ? "rgba(248,81,73,0.3)" : "rgba(255,255,255,0.08)"}` }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: danger ? "rgba(248,81,73,0.15)" : "rgba(124,58,237,0.15)", color: danger ? "#f85149" : "#c4b5fd" }}>{icon}</div>
          <h2 className="text-base font-bold flex-1" style={{ color: "#e6edf3" }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" style={{ color: "#8b949e" }}><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold mb-1" style={{ color: "#8b949e" }}>{label}</label>
      <div className="[&_input]:w-full [&_input]:px-3.5 [&_input]:py-2.5 [&_input]:rounded-xl [&_input]:text-sm [&_input]:outline-none [&_input]:bg-[#0d1117] [&_input]:text-[#e6edf3] [&_input]:border [&_input]:border-white/10">
        {children}
      </div>
    </div>
  );
}

function CBtn({ children, onClick, disabled, ghost, danger }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; ghost?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
      style={{ background: danger ? "#f85149" : ghost ? "#21262d" : "linear-gradient(135deg,#1e3a8a,#7c3aed)", color: ghost ? "#8b949e" : "white" }}>
      {children}
    </button>
  );
}
