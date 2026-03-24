import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "./supabaseClient";
import {
  GraduationCap, BookOpen, Clock, Video, FileText, CheckCircle2,
  Bell, Search, Plus, Play, Users, Calendar, Layers, LogOut,
  Settings, Languages, Headphones, Upload, Radio, Circle, Hash,
} from "lucide-react";

export function StudentDashboard() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"classes" | "rooms" | "assignments" | "recordings" | "communities">("classes");
  const [preferredLang, setPreferredLang] = useState("English");

  // User details
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Array Initializers
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [ROOMS, setRooms] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<Record<string, string>>({});
  const [showRequestModal, setShowRequestModal] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(userProfile);
      setLoading(false);

      const { data: approvedReqs, error: reqErr } = await supabase
        .from('room_requests')
        .select('status, classes(*)')
        .eq('student_id', userProfile.id);

      if (!reqErr && approvedReqs) {
        const activeEnrolled = approvedReqs
          .filter(r => r.status === 'approved' && r.classes)
          .map(r => r.classes);
        setEnrolledClasses(activeEnrolled);

        // Set room statuses for the request modal UI
        const statuses: Record<string, string> = {};
        approvedReqs.forEach(r => {
          if (r.classes) statuses[(r.classes as any).id] = r.status;
        });
        setRoomStatuses(statuses);
      }

      // Fetch communities
      const { data: myComms } = await supabase
        .from("community_members")
        .select("community_id, communities(*)")
        .eq("user_id", userProfile.id);
      if (myComms) {
        setCommunities(myComms.map((m: any) => m.communities).filter(Boolean));
      }
    };
    fetchUser();
  }, [navigate]);

  const handleRoomAction = (room: any) => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleJoinClassRequest = async () => {
    if (!joinCode.trim() || !profile) return;

    // Find class by code
    const { data: clsData, error: clsError } = await supabase
      .from('classes')
      .select('id')
      .eq('code', joinCode)
      .single();

    if (clsError || !clsData) {
      alert("Class not found! Please check the code.");
      return;
    }

    // Insert request
    const { error: reqError } = await supabase
      .from('room_requests')
      .insert({ class_id: clsData.id, student_id: profile.id, status: 'pending' });

    if (reqError && reqError.code !== '23505') { // Ignore unique constraint if user already requested
      alert("Failed to send request.");
      return;
    }

    setShowJoinModal(false);
    navigate(`/classroom/${joinCode}?lang=${preferredLang}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: "#f8faff" }}>
        <div className="w-12 h-12 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-[#a78bfa] font-bold text-lg animate-pulse">Loading Your Dashboard...</div>
      </div>
    );
  }

  const firstName = profile?.full_name ? profile.full_name.split(" ")[0] : "Student";
  const initials = profile?.full_name ? profile.full_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "ST";

  return (
    <div className="min-h-screen flex" style={{ background: "#f8faff" }}>
      {/* Sidebar */}
      <aside className="w-64 flex flex-col fixed h-full z-20" style={{ background: "linear-gradient(180deg, #0f172a 0%, #1a2d6e 100%)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="p-6 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
              Access<span style={{ color: "#a78bfa" }}>Learn</span>
            </span>
          </div>
          <div className="mt-3 text-xs px-2 py-1 rounded-full inline-block" style={{ background: "rgba(37,99,235,0.3)", color: "#93c5fd" }}>
            Student Account
          </div>
        </div>

        <nav className="flex-1 px-3">
          {[
            { icon: <Layers className="w-4 h-4" />, label: "Dashboard", active: true, action: undefined },
            { icon: <BookOpen className="w-4 h-4" />, label: "My Classes", active: false, action: undefined },
            { icon: <Radio className="w-4 h-4" />, label: "Communities", active: false, action: () => navigate("/community") },
            { icon: <FileText className="w-4 h-4" />, label: "Assignments", active: false, action: undefined },
            { icon: <Video className="w-4 h-4" />, label: "Recordings", active: false, action: undefined },
            { icon: <Languages className="w-4 h-4" />, label: "Transcripts", active: false, action: undefined },
            { icon: <Headphones className="w-4 h-4" />, label: "Accessibility", active: false, action: undefined },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm transition-all hover:bg-white/5"
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
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm text-white shrink-0" style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)", fontWeight: 700 }}>
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" /> : initials}
            </div>
            <div className="overflow-hidden">
              <div className="text-white text-sm truncate" style={{ fontWeight: 600 }}>{profile?.full_name || "Student"}</div>
              <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>{profile?.email || "student@example.com"}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs hover:bg-white/10 transition-all" style={{ color: "rgba(255,255,255,0.5)" }}>
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
            <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs hover:bg-white/10 transition-all" style={{ color: "rgba(255,255,255,0.5)" }}>
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
              Hello, {firstName} 👋
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              You have {enrolledClasses.length} class{enrolledClasses.length !== 1 ? 'es' : ''} today and {assignments.length} pending assignment{assignments.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input placeholder="Search…" className="pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#e2e8f0", background: "white", minWidth: 200 }} />
            </div>
            <button className="relative p-2.5 rounded-xl bg-white border" style={{ borderColor: "#e2e8f0" }}>
              <Bell className="w-5 h-5 text-gray-500" />
              {assignments.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />}
            </button>
            <button onClick={() => setShowJoinModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}>
              <Plus className="w-4 h-4" />
              Join Class
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {[
            { icon: <BookOpen className="w-5 h-5" />, label: "Enrolled Classes", value: enrolledClasses.length.toString(), color: "#1e3a8a" },
            { icon: <FileText className="w-5 h-5" />, label: "Pending Assignments", value: enrolledClasses.length === 0 ? "0" : assignments.length.toString(), color: "#dc2626" },
            { icon: <CheckCircle2 className="w-5 h-5" />, label: "Submitted", value: "0", color: "#059669" },
            { icon: <Video className="w-5 h-5" />, label: "Recordings", value: enrolledClasses.length === 0 ? "0" : recordings.length.toString(), color: "#7c3aed" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm" style={{ border: "1px solid #f1f5f9" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a" }}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "#f1f5f9" }}>
          {(["classes", "rooms", "assignments", "recordings", "communities"] as const).map((tab) => (
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

        {/* Tab Content */}
        {activeTab === "classes" && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {enrolledClasses.length === 0 ? (
              <div className="col-span-full rounded-2xl p-12 border-2 border-dashed flex flex-col items-center justify-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer" style={{ borderColor: "#cbd5e1" }} onClick={() => setShowJoinModal(true)}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No enrolled classes yet</h3>
                  <p className="text-sm text-gray-500">Join a class using the code provided by your teacher.</p>
                </div>
                <button className="mt-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90 transition-opacity" style={{ background: "#7c3aed" }}>
                  Join New Class
                </button>
              </div>
            ) : (
              enrolledClasses.map((cls) => (
                <div key={cls.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow" style={{ border: "1px solid #f1f5f9" }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${cls.color || '#1e3a8a'}18`, color: cls.color || '#1e3a8a' }}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="mb-0.5" style={{ fontWeight: 700, color: "#0f172a" }}>{cls.name}</h3>
                  <p className="text-xs text-gray-400 mb-3">Room Code: {cls.code}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                    <Clock className="w-3.5 h-3.5" />
                    {cls.language} Class
                  </div>
                  <button onClick={() => navigate(`/classroom/${cls.code}`)} className="w-full py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 hover:opacity-90" style={{ background: cls.color || '#1e3a8a' }}>
                    <Video className="w-4 h-4" />
                    Enter Class
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Other Tabs Empty State Setup */}
        {activeTab === "rooms" && ROOMS.length === 0 && (
          <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed" style={{ borderColor: "#cbd5e1", background: "transparent" }}>
            <Radio className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 font-bold mb-1">No Active Rooms</h3>
            <p className="text-sm text-gray-500">Your teachers haven't opened any live rooms yet.</p>
          </div>
        )}

        {activeTab === "assignments" && assignments.length === 0 && (
          <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed" style={{ borderColor: "#cbd5e1", background: "transparent" }}>
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 font-bold mb-1">All Caught Up!</h3>
            <p className="text-sm text-gray-500">You don't have any pending assignments right now.</p>
          </div>
        )}

        {activeTab === "recordings" && recordings.length === 0 && (
          <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed" style={{ borderColor: "#cbd5e1", background: "transparent" }}>
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 font-bold mb-1">No Recordings Available</h3>
            <p className="text-sm text-gray-500">Past class sessions and their transcripts will appear here.</p>
          </div>
        )}

        {/* Communities Tab */}
        {activeTab === "communities" && communities.length === 0 && (
          <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed" style={{ borderColor: "#cbd5e1", background: "transparent" }}>
            <Radio className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 font-bold mb-1">No Communities</h3>
            <p className="text-sm text-gray-500 mb-4">You haven't joined any communities. Explore public communities or get a join code.</p>
            <button onClick={() => navigate("/community")} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: "#7c3aed" }}>
              Explore Communities
            </button>
          </div>
        )}

        {activeTab === "communities" && communities.length > 0 && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {communities.map((comm) => (
              <div key={comm.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow" style={{ border: "1px solid #f1f5f9" }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: comm.color || '#1e3a8a' }}>
                    {comm.avatar || comm.name.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <h3 className="mb-0.5" style={{ fontWeight: 700, color: "#0f172a" }}>{comm.name}</h3>
                <p className="text-xs text-gray-400 capitalize mb-3">{comm.type} Community</p>
                <button onClick={() => navigate(`/community/${comm.id}`)} className="w-full py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 hover:opacity-90" style={{ background: comm.color || '#1e3a8a' }}>
                  <Radio className="w-4 h-4" />
                  Enter Community
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowJoinModal(false)}>
          <div className="bg-white rounded-2xl p-8 shadow-2xl" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
              <Users className="w-7 h-7" />
            </div>
            <h2 className="mb-1" style={{ fontWeight: 800, color: "#0f172a" }}>Join a Classroom</h2>
            <p className="text-sm text-gray-400 mb-6">Enter the class code your teacher shared with you.</p>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="e.g. BIO-4821" className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-3 text-center tracking-widest" style={{ borderColor: "#e2e8f0", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.15em" }} />
            <div className="mb-4">
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>Preferred Language</label>
              <select value={preferredLang} onChange={(e) => setPreferredLang(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={{ borderColor: "#e2e8f0" }}>
                <option value="English">🇺🇸 English</option>
                <option value="Japanese">🇯🇵 Japanese</option>
                <option value="Spanish">🇪🇸 Spanish</option>
                <option value="French">🇫🇷 French</option>
                <option value="Portuguese">🇧🇷 Portuguese</option>
                <option value="German">🇩🇪 German</option>
                <option value="Mandarin">🇨🇳 Mandarin</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowJoinModal(false)} className="flex-1 py-3 rounded-xl border text-sm hover:bg-gray-50 transition-colors" style={{ borderColor: "#e2e8f0", color: "#64748b" }}>Cancel</button>
              <button onClick={handleJoinClassRequest} className="flex-1 py-3 rounded-xl text-white text-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}>Join Classroom</button>
            </div>
          </div>
        </div>
      )}

      {/* Request to Join Room Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowRequestModal(null)}>
          <div className="bg-white rounded-2xl p-8 shadow-2xl" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(30,58,138,0.08)", color: "#1e3a8a" }}>
              <Radio className="w-7 h-7" />
            </div>
            <h2 className="mb-1" style={{ fontWeight: 800, color: "#0f172a" }}>Request to Join</h2>
            <p className="text-sm" style={{ color: "#7c3aed", fontWeight: 600 }}>{showRequestModal.name}</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">Your request will be sent to the host. You'll be admitted once approved.</p>
            <div className="flex items-center gap-3 rounded-xl p-3 mb-5" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
              <Circle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-700">Status will show as: Pending Approval</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRequestModal(null)} className="flex-1 py-3 rounded-xl border text-sm hover:bg-gray-50 transition-colors" style={{ borderColor: "#e2e8f0", color: "#64748b" }}>Cancel</button>
              <button onClick={sendRequest} className="flex-1 py-3 rounded-xl text-white text-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}>Send Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
