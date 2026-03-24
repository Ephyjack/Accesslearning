import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  GraduationCap, Globe, LogOut, Mic, MicOff, Video as VideoIcon, VideoOff,
  Monitor, MessageSquare, Users, FileText, ChevronDown, Send, Upload,
  Hand, Maximize2, Languages, Accessibility, Settings, SkipBack,
  ChevronLeft, ChevronRight, CheckCircle2, Paperclip, Volume2, ShieldCheck,
  UserCheck, UserX, UserMinus, Plus, Copy
} from "lucide-react";
import { supabase } from "./supabaseClient";
import '@livekit/components-styles';
import {
  LiveKitRoom,
  useTracks,
  useRoomContext,
  useLocalParticipant,
  RoomAudioRenderer,
  VideoTrack,
  ParticipantTile,
  useParticipants,
  TrackReference
} from "@livekit/components-react";
import { RoomEvent, Track, Participant } from "livekit-client";
import { createLiveKitToken } from "../lib/livekitToken";
import { translateTextWithOpenAI, generateLiveSummary } from "../lib/openaiClient";

// Define TypeScript interfaces for our real-time data
interface Message {
  id: string;
  room_id: string;
  user_name: string;
  text: string;
  created_at: string;
  user_id?: string;
}

interface Transcript {
  id: string;
  room_id: string;
  speaker: string;
  text: string;
  translated_text?: string;
  created_at: string;
}

const LANGUAGES = [
  "English", "Japanese", "Spanish", "French", "Mandarin", "German",
  "Portuguese", "Arabic", "Korean", "Hindi",
];

export function ClassroomInterface() {
  const navigate = useNavigate();
  const { id: classCode } = useParams() as { id: string };
  const [searchParams] = useSearchParams();

  // Core Data State
  const [profile, setProfile] = useState<any>(null);
  const [classData, setClassData] = useState<any>(null);
  const [isTeacher, setIsTeacher] = useState(false);

  // App Flow State
  const [roomStatus, setRoomStatus] = useState<'loading' | 'pending' | 'approved' | 'denied'>('loading');
  const [liveKitToken, setLiveKitToken] = useState("");

  const env = (import.meta as any).env || {};
  const serverUrl = env.VITE_LIVEKIT_URL || env.NEXT_PUBLIC_LIVEKIT_URL || "wss://accesslearning-jvnyi4ag.livekit.cloud";

  useEffect(() => {
    const initializeClassroom = async () => {
      // 1. Fetch Profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/"); return; }

      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!prof) { navigate("/"); return; }
      setProfile(prof);

      // 2. Fetch Class Details
      const { data: cls } = await supabase.from("classes").select("*").eq("code", classCode).single();
      if (!cls) {
        alert("Class not found!");
        navigate("/");
        return;
      }
      setClassData(cls);

      // 3. Teacher vs Student Logic
      if (cls.teacher_id === prof.id) {
        setIsTeacher(true);
        setRoomStatus('approved');
        const token = await createLiveKitToken(cls.id, prof.id, prof.full_name, true);
        setLiveKitToken(token);
      } else {
        setIsTeacher(false);
        // Student: Check room requests
        const { data: req } = await supabase.from("room_requests").select("*").eq("class_id", cls.id).eq("student_id", prof.id).single();
        if (req && req.status === 'approved') {
          setRoomStatus('approved');
          const token = await createLiveKitToken(cls.id, prof.id, prof.full_name, false);
          setLiveKitToken(token);
        } else if (req && req.status === 'pending') {
          setRoomStatus('pending');
        } else {
          // If no request is found, insert one automatically.
          await supabase.from("room_requests").insert({ class_id: cls.id, student_id: prof.id, status: 'pending' });
          setRoomStatus('pending');
        }
      }
    };

    initializeClassroom();
  }, [classCode, navigate]);

  // Realtime subscription for Student Waiting Room
  useEffect(() => {
    if (!profile || !classData || roomStatus !== 'pending') return;

    const reqSub = supabase
      .channel("student-req")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "room_requests", filter: `student_id=eq.${profile.id}` }, async (payload) => {
        if (payload.new.status === 'approved') {
          setRoomStatus('approved');
          const token = await createLiveKitToken(classData.id, profile.id, profile.full_name, false);
          setLiveKitToken(token);
        } else if (payload.new.status === 'denied') {
          setRoomStatus('denied');
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(reqSub); };
  }, [profile, classData, roomStatus]);

  if (roomStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a]">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-violet-400 font-bold tracking-widest text-sm animate-pulse">CONNECTING...</div>
      </div>
    );
  }

  if (roomStatus === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-center p-6">
        <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
          <ShieldCheck className="w-10 h-10 text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Waiting to join...</h1>
        <p className="text-gray-400 max-w-sm mb-8">Your teacher is currently reviewing your request to join {classData?.name}. Please hold on.</p>
        <div className="w-8 h-8 flex gap-1 items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  if (roomStatus === 'denied') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a]">
        <h1 className="text-xl font-bold text-red-400 mb-4">Request Denied</h1>
        <button onClick={() => navigate("/student")} className="px-6 py-2 bg-white/10 text-white rounded-xl">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0f172a]">
      <LiveKitRoom
        video={true}
        audio={true}
        token={liveKitToken}
        serverUrl={serverUrl}
        connect={true}
        className="contents" // 🔥 CRITICAL FIX
      >
        <ClassroomInnerLayout
          isTeacher={isTeacher}
          profile={profile}
          classData={classData}
          preferredLang={searchParams.get("lang") || classData?.language || "English"}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );

  function ClassroomInnerLayout({
    isTeacher,
    profile,
    classData,
    preferredLang
  }: any) {
    const navigate = useNavigate();
    const room = useRoomContext();
    const { localParticipant, isMicrophoneEnabled: isLocalMicOn } = useLocalParticipant();

    // Natively remove localParticipant from useParticipants array to avoid ghost duplicate in the UI rendering
    const allLiveKitParticipants = useParticipants();
    const remoteParticipants = allLiveKitParticipants.filter(p => p.identity !== localParticipant?.identity);
    const allParticipants = [localParticipant, ...remoteParticipants].filter(Boolean);

    // Real-time UI States
    const [sidebarTab, setSidebarTab] = useState<"chat" | "participants" | "assignments">("chat");
    const [selectedLang, setSelectedLang] = useState(preferredLang);
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [aiEnabled, setAiEnabled] = useState(true);
    const [aiSummary, setAiSummary] = useState("Waiting for sufficient dialogue to generate summary...");

    // Active Speaker Logic
    const activeSpeakers = allParticipants.filter(p => p.isSpeaking);
    const activeSpeaker = activeSpeakers.length > 0 ? activeSpeakers[0] : (allParticipants.length > 0 ? allParticipants[0] : localParticipant);

    // LiveKit Streams
    const videoTracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
    const screenTrack = videoTracks.find((t) => t.source === Track.Source.ScreenShare && t.participant.identity !== localParticipant.identity);
    const myScreenTrack = videoTracks.find((t) => t.source === Track.Source.ScreenShare && t.participant.identity === localParticipant.identity);

    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);
    const [screenShareOn, setScreenShareOn] = useState(false);
    const transcriptRef = useRef<HTMLDivElement>(null);
    const langRef = useRef(selectedLang);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
      if (isTeacher && localParticipant) {
        localParticipant.setCameraEnabled(true);
        localParticipant.setMicrophoneEnabled(true);
      }
    }, [isTeacher, localParticipant]);

    useEffect(() => {
      langRef.current = selectedLang;
      const retranslate = async () => {
        if (!selectedLang || selectedLang === "English") return;

        // Take the last 15 un-translated messages to save API hits but feel instant
        const recent = transcripts.slice(-15).filter(t => !t.translated_text || t.translated_text.includes("Failed"));

        for (const t of recent) {
          const translated = await translateTextWithOpenAI(t.text, selectedLang);
          if (translated) {
            setTranscripts(prev => prev.map(p => p.id === t.id ? { ...p, translated_text: translated } : p));
          }
        }
      };

      if (transcripts.length > 0) {
        retranslate();
      }
    }, [selectedLang]);

    useEffect(() => {
      if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }, [transcripts]);

    // Supabase Subscriptions for Chat & NLP
    useEffect(() => {
      const fetchInitialData = async () => {
        const { data: initMessages } = await supabase.from("messages").select("*").eq("room_id", classData.id).order("created_at", { ascending: true });
        if (initMessages) setMessages(initMessages as Message[]);

        const { data: initTrans } = await supabase.from("transcripts").select("*").eq("room_id", classData.id).order("created_at", { ascending: true });
        if (initTrans) setTranscripts(initTrans as Transcript[]);

        if (isTeacher) {
          const { data: reqs } = await supabase.from("room_requests").select("*, profiles(full_name, email, avatar_url)").eq("class_id", classData.id).eq("status", "pending");
          if (reqs) setPendingRequests(reqs);
        }
      };
      fetchInitialData();

      const messagesSub = supabase.channel("messages_channel").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload: any) => {
        if (payload.new.room_id === classData.id) setMessages(prev => [...prev, payload.new as Message]);
      }).subscribe();

      const transcriptSub = supabase.channel("transcripts_channel").on("postgres_changes", { event: "INSERT", schema: "public", table: "transcripts" }, async (payload: any) => {
        if (payload.new.room_id === classData.id) {
          setTranscripts(prev => [...prev, payload.new as Transcript]);

          // Local translation for ALL incoming speech if a foreign language is selected
          if (langRef.current && langRef.current !== "English") {
            const translated = await translateTextWithOpenAI(payload.new.text, langRef.current);
            if (translated) {
              setTranscripts(prev => prev.map(t => t.id === payload.new.id ? { ...t, translated_text: translated } : t));
            }
          }
        }
      }).subscribe();

      const requestSub = supabase.channel("requests_channel").on("postgres_changes", { event: "*", schema: "public", table: "room_requests" }, async (payload: any) => {
        if (isTeacher && payload.new.class_id === classData.id) {
          const { data: reqs } = await supabase.from("room_requests").select("*, profiles(full_name, email, avatar_url)").eq("class_id", classData.id).eq("status", "pending");
          setPendingRequests(reqs || []);
        }
      }).subscribe();

      return () => { supabase.removeChannel(messagesSub); supabase.removeChannel(transcriptSub); supabase.removeChannel(requestSub); };
    }, [classData, isTeacher]);

    // Speech Recognition Hook
    useEffect(() => {
      let isMounted = true;
      if (!micOn || !aiEnabled) {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) { }
        }
        return;
      }

      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRec) return;

      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = async (event: any) => {
        const last = event.results[event.results.length - 1];
        if (last.isFinal) {
          const text = last[0].transcript;
          await supabase.from('transcripts').insert({
            room_id: classData?.id, speaker: profile?.full_name, text: text
          });
        }
      };

      // Auto-restart if it stops due to silence
      recognition.onend = () => {
        if (isMounted && micOn && aiEnabled) {
          try { recognition.start(); } catch (e) { }
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) { }

      return () => {
        isMounted = false;
        try { recognition.stop(); } catch (e) { }
      };
    }, [micOn, aiEnabled, classData?.id, profile?.full_name]);

    // Periodic Auto-Summary
    useEffect(() => {
      if (!aiEnabled || transcripts.length === 0) return;
      const interval = setInterval(async () => {
        const recentTexts = transcripts.slice(-15).map(t => `${t.speaker}: ${t.text}`);
        const newSummary = await generateLiveSummary(recentTexts);
        setAiSummary(newSummary);
      }, 45000); // 45s
      return () => clearInterval(interval);
    }, [aiEnabled, transcripts]);

    const sendMessage = async () => {
      if (!chatInput.trim()) return;
      const msg = { room_id: classData.id, user_id: profile.id, user_name: profile.full_name, text: chatInput, created_at: new Date().toISOString() };
      setChatInput("");
      await supabase.from("messages").insert([msg]);
    };

    const approveRequest = async (reqId: string) => {
      await supabase.from("room_requests").update({ status: 'approved' }).eq('id', reqId);
    };
    const denyRequest = async (reqId: string) => {
      await supabase.from("room_requests").update({ status: 'denied' }).eq('id', reqId);
    };

    const handleLeave = async () => {
      if (room) await room.disconnect();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { }
      }
      navigate(isTeacher ? "/teacher" : "/student");
    };

    const [copiedCode, setCopiedCode] = useState(false);
    const copyCode = () => {
      navigator.clipboard.writeText(classData?.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    };

    const muteAll = () => {
      // Currently requires backend token override, but we can iterate over participants locally if possible.
      // In an ideal LiveKit setup, room admins can mute users via remote APIs. 
      remoteParticipants.forEach((p: any) => {
        if (p !== localParticipant) {
          // Example if API is available: p.setMicrophoneEnabled(false) (usually done via server-sdk)
        }
      });
      alert("Backend Server SDK required to forcefully mute remote participants. Sending mute event...");
    }

    return (
      <>
        {/* TOP NAV */}
        <header className="h-14 flex items-center justify-between px-5 shrink-0 w-full" style={{ background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-sm" style={{ fontWeight: 700 }}>Access<span style={{ color: "#a78bfa" }}>Learn</span></span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center">
              <span className="text-white text-sm" style={{ fontWeight: 600 }}>{classData?.name}</span>
              <button onClick={copyCode} title="Copy room code" className="ml-3 px-2 py-0.5 inline-flex items-center gap-1.5 rounded text-xs bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20 transition-all">
                <span className="select-all">Code: {classData?.code}</span>
                {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <span className="text-xs ml-2 text-gray-400">• Lecture Live</span>
            </div>
            {isTeacher && pendingRequests.length > 0 && (
              <button onClick={() => setSidebarTab('participants')} className="ml-4 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-2 animate-pulse" style={{ background: "#eab308" }}>
                <Users className="w-3.5 h-3.5" />
                {pendingRequests.length} Pending
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowLangDropdown(!showLangDropdown)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all" style={{ background: "rgba(255,255,255,0.07)", color: "white" }}>
                <Globe className="w-4 h-4 text-violet-400" />
                {selectedLang}
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {showLangDropdown && (
                <div className="absolute top-full mt-1 right-0 rounded-xl shadow-xl z-50 overflow-hidden py-1" style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.08)", minWidth: 160 }}>
                  {LANGUAGES.map((lang) => (
                    <button key={lang} onClick={() => { setSelectedLang(lang); setShowLangDropdown(false); }} className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/5" style={{ color: lang === selectedLang ? "#a78bfa" : "rgba(255,255,255,0.7)" }}>
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={handleLeave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all hover:bg-red-500/30" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>
              <LogOut className="w-4 h-4" />Leave
            </button>
          </div>
        </header>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden w-full">
          {/* LEFT COLUMN — AI Panels */}
          <div className="w-80 flex flex-col shrink-0 transition-all duration-300 relative" style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
            {isTeacher && (
              <div className="absolute top-2 right-2 z-10">
                <button onClick={() => setAiEnabled(!aiEnabled)} className={`text-xs px-2 py-1 rounded-md ${aiEnabled ? 'bg-violet-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                  AI: {aiEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
            )}

            <div className="flex-none p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", opacity: aiEnabled ? 1 : 0.4 }}>
              <div className="text-xs text-white mb-2" style={{ fontWeight: 600 }}>Live AI Summary</div>
              <div className="text-xs text-gray-400" style={{ lineHeight: 1.6 }}>
                {aiEnabled ? aiSummary : "AI Features deactivated by host."}
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden" style={{ opacity: aiEnabled ? 1 : 0.4 }}>
              <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-white font-semibold">Live Translation</span>
                </div>
              </div>

              {/* The Live Transcript and Translation logic */}
              <div ref={transcriptRef} className="flex-1 overflow-y-auto p-3 space-y-4" style={{ scrollbarWidth: "thin" }}>
                {transcripts.map((line: any, i: number) => {
                  const textToShow = (selectedLang !== "English" && line.translated_text) ? line.translated_text : line.text;
                  return (
                    <div key={line.id || i} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="text-[10px] text-gray-500 mb-1">{line.speaker}</div>
                      <p className="text-xs" style={{ color: "#c4b5fd", lineHeight: 1.7 }}>{textToShow}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CENTER — Main teaching area */}
          <div className="flex-1 flex flex-col overflow-hidden w-full relative">
            <div className="flex-1 flex flex-col items-center justify-center bg-black p-4 relative overflow-hidden">

              {/* Main Viewer */}
              {myScreenTrack || screenTrack ? (
                <>
                  <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center relative bg-[#111]">
                    {myScreenTrack ? (
                      <VideoTrack trackRef={myScreenTrack} className="w-full h-full object-contain" />
                    ) : screenTrack ? (
                      <VideoTrack trackRef={screenTrack} className="w-full h-full object-contain" />
                    ) : null}
                  </div>

                  {/* PiP Active Speaker */}
                  <div className="absolute bottom-6 right-6 rounded-xl overflow-hidden shadow-2xl z-10 cursor-move" style={{ width: 280, height: 160, border: "2px solid rgba(124,58,237,0.5)", background: "#1e293b" }}>
                    {activeSpeaker && (
                      <ParticipantTile
                        trackRef={{ participant: activeSpeaker as Participant, source: Track.Source.Camera, publication: (activeSpeaker as Participant).getTrackPublication(Track.Source.Camera) } as any}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full rounded-xl overflow-hidden p-2 grid gap-3 bg-[#111]" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", alignContent: "center" }}>
                  {allParticipants.length > 0 ? (
                    allParticipants.map((p: any) => (
                      <div key={p.identity} className="relative rounded-xl overflow-hidden shadow-lg border border-white/5 bg-black" style={{ minHeight: "300px" }}>
                        <ParticipantTile trackRef={{ participant: p as Participant, source: Track.Source.Camera, publication: p.getTrackPublication(Track.Source.Camera) } as any} className="w-full h-full object-cover" />
                      </div>
                    ))
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold col-span-full">
                      Waiting for participants...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom controls */}
            <div className="h-16 flex items-center justify-center px-6 shrink-0 w-full border-t border-white/5">
              <div className="flex items-center gap-4">
                <button onClick={async () => { const next = !micOn; setMicOn(next); await localParticipant.setMicrophoneEnabled(next); }} className="p-3 rounded-full transition-all hover:opacity-80" style={{ background: micOn ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.2)" }}>
                  {micOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-red-400" />}
                </button>
                <button onClick={async () => { const next = !videoOn; setVideoOn(next); await localParticipant.setCameraEnabled(next); }} className="p-3 rounded-full transition-all hover:opacity-80" style={{ background: videoOn ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.2)" }}>
                  {videoOn ? <VideoIcon className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-red-400" />}
                </button>
                <button onClick={async () => { const next = !screenShareOn; setScreenShareOn(next); await localParticipant.setScreenShareEnabled(next); }} className="p-3 rounded-full transition-all hover:opacity-80" style={{ background: screenShareOn || myScreenTrack ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.07)" }}>
                  <Monitor className={`w-5 h-5 ${screenShareOn || myScreenTrack ? "text-blue-400" : "text-white"}`} />
                </button>
              </div>

              {isTeacher && (
                <div className="ml-8 border-l border-white/10 pl-8 flex items-center gap-3">
                  <button onClick={muteAll} className="px-4 py-2 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-all">
                    Mute All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-80 flex flex-col shrink-0" style={{ borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex shrink-0 w-full" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {["chat", "participants"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSidebarTab(tab as any)}
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs transition-all relative"
                  style={{
                    color: sidebarTab === tab ? "#a78bfa" : "rgba(255,255,255,0.4)",
                    borderBottom: sidebarTab === tab ? "2px solid #7c3aed" : "2px solid transparent",
                    fontWeight: sidebarTab === tab ? 600 : 400,
                    textTransform: 'capitalize'
                  }}
                >
                  {tab === 'chat' ? <MessageSquare className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  {tab}
                </button>
              ))}
            </div>

            {sidebarTab === "chat" && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: "thin" }}>
                  {messages.map((msg: any, i: number) => {
                    const isSelf = msg.user_id === profile.id;
                    return (
                      <div key={msg.id || i} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                        {!isSelf && <span className="text-xs text-gray-500 mb-1">{msg.user_name}</span>}
                        <div className="text-xs px-3 py-2 rounded-xl max-w-[85%]" style={{ background: isSelf ? "#7c3aed" : "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)" }}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-3 shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex gap-2">
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type a message…" className="flex-1 px-3 py-2.5 rounded-xl text-xs outline-none bg-white/5 border border-white/10 text-white" />
                    <button onClick={sendMessage} className="p-2.5 rounded-xl transition-colors bg-violet-600"><Send className="w-3.5 h-3.5 text-white" /></button>
                  </div>
                </div>
              </>
            )}

            {sidebarTab === "participants" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {isTeacher && pendingRequests.length > 0 && (
                  <div className="mb-4">
                    <span className="text-xs text-gray-500 font-bold mb-2 block uppercase px-1">Pending Requests</span>
                    {pendingRequests.map(req => (
                      <div key={req.id} className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-between">
                        <div className="text-xs text-yellow-100 font-medium truncate flex-1">{req.profiles?.full_name}</div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button onClick={() => approveRequest(req.id)} className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/40"><UserCheck className="w-3.5 h-3.5" /></button>
                          <button onClick={() => denyRequest(req.id)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40"><UserX className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <span className="text-xs text-gray-500 font-bold mb-2 block uppercase px-1">In Call ({allParticipants.length})</span>
                {allParticipants.map((p: any) => {
                  const isLocal = p === localParticipant;
                  const micEnabled = isLocal ? isLocalMicOn : p.isMicrophoneEnabled;
                  return (
                    <div key={p.identity} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5">
                      <div className="w-12 h-12 rounded bg-blue-500/20 overflow-hidden relative">
                        <ParticipantTile trackRef={{ participant: p as Participant, source: Track.Source.Camera, publication: p.getTrackPublication(Track.Source.Camera) } as any} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="text-sm text-gray-200 truncate">{p.identity} {isLocal && "(You)"}</div>
                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                          {micEnabled ? (p.isSpeaking ? <Volume2 className="w-3 h-3 text-green-400" /> : <Mic className="w-3 h-3 text-gray-400" />) : <MicOff className="w-3 h-3 text-red-400/50" />}
                          {micEnabled ? (p.isSpeaking ? "Speaking" : "Active") : "Muted"}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Note: The assignment submission section was requested to be removed or left. We removed it for simplicity to focus on participants list as requested. */}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
}