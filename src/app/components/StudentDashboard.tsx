import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "./supabaseClient";
import {
  GraduationCap, BookOpen, Clock, Video, FileText, CheckCircle2,
  Bell, Search, Plus, Play, Users, Calendar, Layers, LogOut,
  Settings, Languages, Headphones, Upload, Radio, Circle, Hash,
  Lock, Menu, X
} from "lucide-react";
import { AIAssistant } from "./AIAssistant";

export function StudentDashboard() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"classes" | "rooms" | "communities" | "materials">("classes");
  const [preferredLang, setPreferredLang] = useState("English");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassLang, setNewClassLang] = useState("English");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLang, setNewRoomLang] = useState("English");
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);

  // User details
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Array Initializers
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [ROOMS, setRooms] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [roomStatuses, setRoomStatuses] = useState<Record<string, string>>({});
  const [showRequestModal, setShowRequestModal] = useState<any>(null);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState<any>(null);

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

      const { data: myClasses } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", userProfile.id)
        .order("created_at", { ascending: false });

      const { data: approvedReqs, error: reqErr } = await supabase
        .from('room_requests')
        .select('status, classes(*)')
        .eq('student_id', userProfile.id);

      let allClasses: any[] = myClasses || [];
      if (!reqErr && approvedReqs) {
        const activeEnrolled = approvedReqs
          .filter(r => r.status === 'approved' && r.classes)
          .map(r => r.classes);
        allClasses = [...allClasses, ...activeEnrolled];


        // Set room statuses for the request modal UI
        const statuses: Record<string, string> = {};
        approvedReqs.forEach(r => {
          if (r.classes) statuses[(r.classes as any).id] = r.status;
        });
        setRoomStatuses(statuses);
      }
      setEnrolledClasses(allClasses);

      // Fetch materials for enrolled classes
      if (allClasses.length > 0) {
        const classIds = allClasses.map((c: any) => c.id);
        const { data: mats } = await supabase
          .from("class_resources")
          .select("*, classes(name)")
          .in("class_id", classIds)
          .order("created_at", { ascending: false });
        if (mats) setMaterials(mats);
      }

      // Fetch communities
      const { data: myComms } = await supabase
        .from("community_members")
        .select("community_id, communities(*)")
        .eq("user_id", userProfile.id);
      if (myComms) {
        setCommunities(myComms.map((m: any) => m.communities).filter(Boolean));
      }

      // Fetch persistent rooms available to student
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });
      if (roomsData) setRooms(roomsData);

      // Fetch join requests for private rooms
      const { data: roomReqs } = await supabase
        .from("room_requests")
        .select("class_id, status")
        .eq("student_id", userProfile.id);
      if (roomReqs) {
        const rs: Record<string, string> = { ...roomStatuses };
        roomReqs.forEach(r => { if (r.class_id) rs[r.class_id] = r.status; });
        setRoomStatuses(prev => ({ ...prev, ...rs }));
      }
    };
    fetchUser();
  }, [navigate]);

  const handleRoomAction = (room: any) => {
    if (!room.is_private) {
      navigate(`/classroom/${room.id}`);
      return;
    }
    const status = roomStatuses[room.id];
    if (status === "approved") {
      navigate(`/classroom/${room.id}`);
    } else if (status === "pending") {
      // already pending - do nothing
    } else {
      setShowJoinRoomModal(room);
    }
  };

  const sendRoomRequest = async () => {
    if (showJoinRoomModal && profile) {
      await supabase.from("room_requests").insert({
        class_id: showJoinRoomModal.id,
        student_id: profile.id,
        status: "pending",
      });
      setRoomStatuses(prev => ({ ...prev, [showJoinRoomModal.id]: "pending" }));
    }
    setShowJoinRoomModal(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleCreateClass = async () => {
    if (!newClassName.trim() || !profile) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase
      .from("classes")
      .insert({
        name: newClassName,
        code: code,
        language: newClassLang,
        teacher_id: profile.id, // we still use profile.id as the creator
        status: "active",
        students_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Failed to create class: " + error.message);
      return;
    }

    setShowCreateModal(false);
    navigate(`/classroom/${code}`);
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !profile) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase.from("rooms").insert({
      name: newRoomName,
      code,
      language: newRoomLang,
      teacher_id: profile.id,
      is_private: newRoomPrivate,
      status: "offline",
    }).select().single();
    if (error) {
      alert("Failed to create room: " + error.message);
      return;
    }
    if (data) {
      setRooms(prev => [data, ...prev]);
      setNewRoomName("");
      setNewRoomLang("English");
      setNewRoomPrivate(false);
      setShowCreateRoomModal(false);
      navigate(`/classroom/${data.id}`);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (confirm("Are you sure you want to delete this class?")) {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) {
        alert("Failed to delete class.");
      } else {
        setEnrolledClasses(prev => prev.filter((c: any) => c.id !== id));
      }
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (confirm("Are you sure you want to delete this room?")) {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) {
        alert("Failed to delete room.");
      } else {
        setRooms(prev => prev.filter((r: any) => r.id !== id));
      }
    }
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
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 flex flex-col fixed h-full z-30 transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: "linear-gradient(180deg, #0f172a 0%, #1a2d6e 100%)", borderRight: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="p-6 mb-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-white" style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                Access<span style={{ color: "#a78bfa" }}>Learn</span>
              </span>
            </div>
            <button className="lg:hidden text-white hover:bg-white/10 p-1 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-xs px-2 py-1 rounded-full inline-block w-fit" style={{ background: "rgba(37,99,235,0.3)", color: "#93c5fd" }}>
            Student Account
          </div>
        </div>

        <nav className="flex-1 px-3">
          {[
            { icon: <Layers className="w-4 h-4" />, label: "Dashboard", active: true, action: undefined },
            { icon: <FileText className="w-4 h-4" />, label: "Materials", active: false, action: () => setActiveTab("materials") },
            { icon: <Radio className="w-4 h-4" />, label: "Communities", active: false, action: () => navigate("/community") },
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
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 w-full overflow-hidden">
        {/* Top bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 mt-2 lg:mt-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 -ml-2 rounded-xl bg-white border shadow-sm shrink-0" style={{ borderColor: "#e2e8f0" }} onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>
                Hello, {firstName} 👋
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                You have {enrolledClasses.length} class{enrolledClasses.length !== 1 ? 'es' : ''} and {materials.length} material{materials.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            <div className="relative shrink-0 flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input placeholder="Search…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#e2e8f0", background: "white", minWidth: 140, maxWidth: 200 }} />
            </div>
            <button className="relative p-2.5 rounded-xl bg-white border shrink-0" style={{ borderColor: "#e2e8f0" }}>
              <Bell className="w-5 h-5 text-gray-500" />
            </button>
            <button onClick={() => setShowCreateModal(true)} className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90 mr-2" style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Class</span>
              <span className="sm:hidden">Create</span>
            </button>
            <button onClick={() => setShowJoinModal(true)} className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Join Class</span>
              <span className="sm:hidden">Join</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6 lg:mb-8">
          {[
            { icon: <BookOpen className="w-5 h-5" />, label: "Enrolled Classes", value: enrolledClasses.length.toString(), color: "#1e3a8a" },
            { icon: <FileText className="w-5 h-5" />, label: "Course Materials", value: materials.length.toString(), color: "#dc2626" },
            { icon: <CheckCircle2 className="w-5 h-5" />, label: "Total Points", value: (profile?.points || 0).toString(), color: "#059669" },
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 w-full max-w-full">
          <div className="flex gap-1 p-1 rounded-xl w-full sm:w-auto overflow-x-auto" style={{ background: "#f1f5f9", scrollbarWidth: "none" }}>
            {(["classes", "rooms", "communities", "materials"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg text-sm capitalize transition-all shrink-0"
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
          {activeTab === "rooms" && (
            <button
              onClick={() => setShowCreateRoomModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-all shrink-0"
              style={{
                background: "linear-gradient(135deg, #1e3a8a, #7c3aed)",
              }}
            >
              <Plus className="w-4 h-4" />
              New Room
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === "classes" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
            {enrolledClasses.length === 0 ? (
              <div className="col-span-full rounded-2xl p-12 border-2 border-dashed flex flex-col items-center justify-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer" style={{ borderColor: "#cbd5e1" }} onClick={() => setShowJoinModal(true)}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No enrolled classes yet</h3>
                  <p className="text-sm text-gray-500">Join a class using the code provided by your teacher, or create your own.</p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={() => setShowJoinModal(true)} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90 transition-opacity" style={{ background: "#7c3aed" }}>
                    Join Class
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); }} className="px-6 py-2.5 rounded-xl border text-sm font-semibold hover:bg-gray-50 transition-colors" style={{ borderColor: "#e2e8f0", color: "#64748b" }}>
                    Create Class
                  </button>
                </div>
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
                  <div className="flex gap-2">
                    {cls.teacher_id === profile?.id && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }} className="flex-1 py-2.5 rounded-xl border text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors" style={{ borderColor: "#fecaca", color: "#ef4444" }}>
                        Delete Class
                      </button>
                    )}
                    <button onClick={() => navigate(`/classroom/${cls.code}`)} className="flex-1 py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 hover:opacity-90" style={{ background: cls.color || '#1e3a8a' }}>
                      <Video className="w-4 h-4" />
                      {cls.teacher_id === profile?.id ? "Start Class" : "Enter Class"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Other Tabs Empty State Setup */}
        {activeTab === "rooms" && ROOMS.length === 0 && (
          <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed flex flex-col items-center cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: "#cbd5e1" }} onClick={() => setShowCreateRoomModal(true)}>
            <Radio className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 font-bold mb-1">No Active Rooms</h3>
            <p className="text-sm text-gray-500 mb-4">Your teachers haven't opened any live rooms yet, but you can create one.</p>
            <button className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold shadow-md hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}>
              Create Room
            </button>
          </div>
        )}

        {activeTab === "rooms" && ROOMS.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
            {ROOMS.map((room) => (
              <div key={room.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow" style={{ border: "1px solid #f1f5f9" }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(30,58,138,0.08)", color: "#1e3a8a" }}>
                    <Radio className="w-5 h-5" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${room.status === 'live' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {room.status === 'live' ? '● Live' : 'Offline'}
                  </span>
                </div>
                <h3 className="mb-0.5" style={{ fontWeight: 700, color: "#0f172a" }}>{room.name}</h3>
                <p className="text-xs text-gray-400 mb-1">{room.language} Room</p>
                {room.is_private && (
                  <p className="text-xs mb-3" style={{ color: "#7c3aed" }}>🔒 Private — Requires Approval</p>
                )}
                {room.teacher_id === profile?.id ? (
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }} className="flex-1 py-2.5 rounded-xl border text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors" style={{ borderColor: "#fecaca", color: "#ef4444" }}>
                      Delete
                    </button>
                    <button onClick={() => navigate(`/classroom/${room.id}`)} className="flex-[2] py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 hover:opacity-90" style={{ background: room.status === 'live' ? "#16a34a" : "#1e3a8a" }}>
                      <Play className="w-4 h-4" /> {room.status === 'live' ? "Enter Room" : "Start Room"}
                    </button>
                  </div>
                ) : (
                  <>
                    {roomStatuses[room.id] === "pending" ? (
                      <button disabled className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2" style={{ background: "rgba(251,191,36,0.15)", color: "#d97706" }}>
                        <Circle className="w-4 h-4" /> Pending Approval
                      </button>
                    ) : roomStatuses[room.id] === "approved" ? (
                      <button onClick={() => navigate(`/classroom/${room.id}`)} className="w-full py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 hover:opacity-90" style={{ background: "#16a34a" }}>
                        <Play className="w-4 h-4" /> Enter Room
                      </button>
                    ) : (
                      <button onClick={() => handleRoomAction(room)} className="w-full py-2.5 rounded-xl text-white text-sm flex items-center justify-center gap-2 hover:opacity-90" style={{ background: room.is_private ? "#7c3aed" : "#1e3a8a" }}>
                        {room.is_private ? <Lock className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {room.is_private ? "Request to Join" : "Join Room"}
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}



        {/* Materials Tab */}
        {activeTab === "materials" && materials.length === 0 && (
          <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed" style={{ borderColor: "#cbd5e1", background: "transparent" }}>
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 font-bold mb-1">No Materials Yet</h3>
            <p className="text-sm text-gray-500">Your teachers haven't uploaded any study materials or links.</p>
          </div>
        )}

        {activeTab === "materials" && materials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
            {materials.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow" style={{ border: "1px solid #f1f5f9" }}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-white font-bold" style={{ background: "#1e3a8a" }}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{m.title}</h3>
                    <p className="text-xs text-gray-500 mb-1">{m.classes?.name || "Resource"}</p>
                    <a href={m.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                      Open Resource
                    </a>
                  </div>
                </div>
              </div>
            ))}
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
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

      {/* AI Assistant */}
      <AIAssistant context={`Student dashboard view. Profile: ${profile?.full_name}. Enrolled Classes: ${enrolledClasses.length}. Available Materials: ${materials.length}`} />

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

      {/* Private Room Join Request Modal */}
      {showJoinRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowJoinRoomModal(null)}>
          <div className="bg-white rounded-2xl p-8 shadow-2xl" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(30,58,138,0.08)", color: "#1e3a8a" }}>
              <Radio className="w-7 h-7" />
            </div>
            <h2 className="mb-1" style={{ fontWeight: 800, color: "#0f172a" }}>Request to Join</h2>
            <p className="text-sm" style={{ color: "#7c3aed", fontWeight: 600 }}>{showJoinRoomModal.name}</p>
            <p className="text-sm text-gray-400 mt-1 mb-5">Your request will be sent to the host. You'll be admitted once approved.</p>
            <div className="flex items-center gap-3 rounded-xl p-3 mb-5" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
              <Circle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-yellow-700">Status will show as: Pending Approval</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowJoinRoomModal(null)} className="flex-1 py-3 rounded-xl border text-sm hover:bg-gray-50 transition-colors" style={{ borderColor: "#e2e8f0", color: "#64748b" }}>Cancel</button>
              <button onClick={sendRoomRequest} className="flex-1 py-3 rounded-xl text-white text-sm hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}>Send Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowCreateModal(false)}
        >
          <div className="bg-white rounded-2xl p-8 shadow-2xl" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2" style={{ fontWeight: 800, color: "#0f172a" }}>Create New Classroom</h2>
            <p className="text-sm text-gray-400 mb-6">Others will join using the auto-generated class code.</p>
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
              <select value={newClassLang} onChange={(e) => setNewClassLang(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={{ borderColor: "#e2e8f0" }}>
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
                onClick={handleCreateClass}
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
          <div className="bg-white rounded-2xl p-8 shadow-2xl" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(30,58,138,0.08)", color: "#1e3a8a" }}>
              <Video className="w-6 h-6" />
            </div>
            <h2 className="mb-2" style={{ fontWeight: 800, color: "#0f172a" }}>Create Online Room</h2>
            <p className="text-sm text-gray-400 mb-6">A persistent room where others can request to join.</p>
            <div className="mb-4">
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>Room Name</label>
              <input
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g. Biology Study Room"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#e2e8f0" }}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1.5" style={{ fontWeight: 600, color: "#374151" }}>Language</label>
              <select value={newRoomLang} onChange={(e) => setNewRoomLang(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={{ borderColor: "#e2e8f0" }}>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Mandarin">Mandarin</option>
                <option value="Japanese">Japanese</option>
              </select>
            </div>
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => setNewRoomPrivate(!newRoomPrivate)}
                className="w-10 h-6 rounded-full transition-colors relative shrink-0"
                style={{ background: newRoomPrivate ? "#7c3aed" : "#e2e8f0" }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                  style={{ left: newRoomPrivate ? "calc(100% - 1.35rem)" : "0.125rem" }}
                />
              </button>
              <span className="text-sm text-gray-600">Private room (others need approval to join)</span>
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
                onClick={handleCreateRoom}
                className="flex-1 py-3 rounded-xl text-white text-sm"
                style={{ background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
