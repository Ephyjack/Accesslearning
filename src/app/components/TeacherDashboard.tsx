import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "./supabaseClient";
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
  Trash2,
  Menu, X, Circle
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// -----------------------
// Teacher Dashboard Component
// -----------------------
export function TeacherDashboard() {
  const navigate = useNavigate();

  // -----------------------
  // Tabs & Modals
  // -----------------------
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"classes" | "rooms" | "communities">("classes");
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);

  // -----------------------
  // Profile & Data
  // -----------------------
  const [profile, setProfile] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const [newClassName, setNewClassName] = useState("");
  const [newClassLang, setNewClassLang] = useState("English");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLang, setNewRoomLang] = useState("English");
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);

  // -----------------------
  // Join Class
  // -----------------------
  const [joinCode, setJoinCode] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [preferredLang, setPreferredLang] = useState("English");
  const [roomStatuses, setRoomStatuses] = useState<Record<string, string>>({});
  const [showJoinRoomModal, setShowJoinRoomModal] = useState<any>(null);


  const handleCreateClass = async () => {
    if (!newClassName.trim() || !profile) return;

    // Generate a random 6-character code for the class
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from("classes")
      .insert({
        name: newClassName,
        code: code,
        language: newClassLang,
        teacher_id: profile.id,
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

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this class?")) return;
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (!error) {
      setClasses(prev => prev.filter(c => c.id !== id));
    } else {
      alert("Failed to delete class.");
    }
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

  const handleDeleteRoom = async (id: string) => {
    if (!window.confirm("Delete this room?")) return;
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (!error) {
      setRooms(prev => prev.filter(r => r.id !== id));
    } else {
      alert("Failed to delete room.");
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

  const handleRoomAction = (room: any) => {
    if (!room.is_private || room.teacher_id === profile.id) {
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


  // -----------------------
  // Engagement, assignments, communities
  // -----------------------
  const [engagementData, setEngagementData] = useState<any[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState<string>("");

  // -----------------------
  // Copy Class Code
  // -----------------------
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 1500);
  };

  // Fetch communities
  useEffect(() => {
    const fetchCommunities = async () => {
      if (!profile) return;
      const { data, error } = await supabase
        .from("community_members")
        .select("community_id, communities(*)")
        .eq("user_id", profile.id);

      if (error) console.error(error);
      else setCommunities(data?.map((m: any) => m.communities).filter(Boolean) || []);
    };
    fetchCommunities();
  }, [profile]);

  // Fetch recent assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!profile) return;
      const { data, error } = await supabase
        .from("assignments")
        .select("*")
        .eq("teacher_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) console.error(error);
      else setRecentAssignments(data || []);
    };
    fetchAssignments();
  }, [profile]);

  // Fetch weekly attendance / engagement data
  useEffect(() => {
    const fetchEngagement = async () => {
      if (!profile) return;
      const { data, error } = await supabase
        .from("attendance")
        .select("day, students")
        .eq("teacher_id", profile.id)
        .order("day", { ascending: true });

      if (error) console.error(error);
      else setEngagementData(data || []);
    };
    fetchEngagement();
  }, [profile]);

  // -----------------------
  // Fetch profile
  // -----------------------

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          navigate("/login");
          return;
        }

        // Fetch profile from 'profiles' table
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setProfile(data);

        // Redirect if user is not a teacher
        if (data.role !== "teacher") {
          navigate("/student");
          return;
        }

      } catch (err: any) {
        console.error(err.message);
        alert("Error loading profile. Please log in again.");
        navigate("/login");
      }
    };

    fetchProfile();
  }, [navigate]);

  // -----------------------
  // Fetch persistent rooms
  // -----------------------
  const [rooms, setRooms] = useState<any[]>([]);

  // Fetch persistent rooms created by this teacher
  useEffect(() => {
    if (!profile) return;

    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setRooms(data);
    };

    fetchRooms();

    // Optional: subscribe to realtime changes
    const subscription = supabase
      .channel("public:rooms")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
        },
        (payload) => {
          fetchRooms(); // refresh rooms when any change occurs
        },
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [profile]);

  // -----------------------
  // Fetch classes and pending requests
  // -----------------------
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) return;

      // Fetch all classes for this teacher
      const { data: clsData, error: clsError } = await supabase
        .from("classes")
        .select("*")
        .eq("teacher_id", profile.id)
        .order("created_at", { ascending: false });

      if (clsError) {
        console.error(clsError);
      } else if (clsData) {
        setClasses(clsData);

        // Fetch pending requests for these classes (ones they created)
        const classIds = clsData.map(c => c.id);
        if (classIds.length > 0) {
          const { data: reqs } = await supabase
            .from("room_requests")
            .select("id")
            .in("class_id", classIds)
            .eq("status", "pending");

          setPendingCount(reqs ? reqs.length : 0);
        }
      } else {
        setClasses([]);
      }

      // Fetch joined classes as a student
      const { data: approvedReqs } = await supabase
        .from('room_requests')
        .select('status, classes(*), class_id')
        .eq('student_id', profile.id);

      let allClasses = clsData || [];
      if (approvedReqs) {
        const activeEnrolled = approvedReqs
          .filter(r => r.status === 'approved' && r.classes)
          .map(r => r.classes);
        allClasses = [...allClasses, ...activeEnrolled];

        const rs: Record<string, string> = { ...roomStatuses };
        approvedReqs.forEach(r => { if (r.class_id) rs[r.class_id] = r.status; });
        setRoomStatuses(prev => ({ ...prev, ...rs }));
      }
      setClasses(allClasses);
    };
    fetchDashboardData();
  }, [profile]);

  // -----------------------
  // Render JSX: Top bar
  // -----------------------
  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar here if any */}
      <aside
        className={`w-64 flex flex-col fixed h-full z-30 transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: "linear-gradient(180deg, #0f172a 0%, #1a2d6e 100%)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Logo */}
        <div className="p-6 mb-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span
                className="text-white"
                style={{ fontWeight: 700, fontSize: "1.05rem" }}
              >
                Access<span style={{ color: "#a78bfa" }}>Learn</span>
              </span>
            </div>
            <button className="lg:hidden text-white hover:bg-white/10 p-1 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div
            className="text-xs px-2 py-1 rounded-full inline-block w-fit"
            style={{ background: "rgba(124,58,237,0.25)", color: "#c4b5fd" }}
          >
            {profile?.role === "teacher"
              ? "Teacher Account"
              : "Student Account"}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3">
          {[
            {
              icon: <Layers className="w-4 h-4" />,
              label: "Dashboard",
              active: true,
              action: undefined as (() => void) | undefined,
            },
            {
              icon: <BookOpen className="w-4 h-4" />,
              label: "My Classes",
              active: false,
              action: undefined as (() => void) | undefined,
            },
            {
              icon: <Radio className="w-4 h-4" />,
              label: "Communities",
              active: false,
              action: (() => navigate("/community")) as () => void,
            },
            {
              icon: <FileText className="w-4 h-4" />,
              label: "Assignments",
              active: false,
              action: undefined as (() => void) | undefined,
            },
            {
              icon: <BarChart2 className="w-4 h-4" />,
              label: "Analytics",
              active: false,
              action: undefined as (() => void) | undefined,
            },
            {
              icon: <ShieldCheck className="w-4 h-4" />,
              label: "Access Control",
              active: false,
              action: (() => setShowAccessModal(true)) as () => void,
            },
            {
              icon: <Mic className="w-4 h-4" />,
              label: "Recordings",
              active: false,
              action: undefined as (() => void) | undefined,
            },
            {
              icon: <Globe className="w-4 h-4" />,
              label: "Languages",
              active: false,
              action: undefined as (() => void) | undefined,
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm transition-all"
              style={{
                background: item.active
                  ? "rgba(124,58,237,0.25)"
                  : "transparent",
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
                  style={{
                    background: "#ef4444",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom: Dynamic Profile */}
        <div
          className="p-4 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-sm text-white"
              style={{
                fontWeight: 700,
                background: "linear-gradient(135deg, #1e3a8a, #7c3aed)",
              }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                profile?.full_name
                  .split(" ")
                  .filter((w: string) => w.length > 0) // remove empty strings
                  .map((w: string) => w[0].toUpperCase()) // take first letter and uppercase
                  .join("")
                  .slice(0, 2)
              )}
            </div>
            <div>
              <div className="text-white text-sm font-semibold">
                {profile?.full_name || "Teacher Name"}
              </div>
              <div
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {profile?.email || "email@example.com"}
              </div>
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

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 w-full overflow-hidden">
        {/* Top bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 mt-2 lg:mt-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 -ml-2 rounded-xl bg-white border shadow-sm shrink-0" style={{ borderColor: "#e2e8f0" }} onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1
                style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}
              >
                Good afternoon, {profile?.full_name?.split(" ")[0] || "Teacher"}{" "}
                👋
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                You have {classes.length}{" "}
                {classes.length === 1 ? "class" : "classes"} scheduled today
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            {/* Search Input */}
            <div className="relative shrink-0 flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                placeholder="Search classes…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{
                  borderColor: "#e2e8f0",
                  background: "white",
                  minWidth: 140,
                  maxWidth: 220,
                }}
              />
            </div>

            {/* Notifications */}
            <button
              onClick={() => setShowAccessModal(true)}
              className="relative p-2.5 rounded-xl bg-white border shrink-0"
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

            {/* Join Classroom */}
            <button
              onClick={() => setShowJoinModal(true)}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
              }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Join Class</span>
              <span className="sm:hidden">Join</span>
            </button>

            {/* Create Classroom */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, #1e3a8a, #7c3aed)",
              }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Classroom</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6 lg:mb-8">
          {[
            {
              icon: <Users className="w-5 h-5" />,
              label: "Total Students",
              value: classes.reduce((acc, cls) => acc + (cls.students_count || 0), 0),
              change: classes.length === 0 ? "0 this week" : "+8 this week",
              color: "#1e3a8a",
            },
            {
              icon: <BookOpen className="w-5 h-5" />,
              label: "Active Classes",
              value: classes.filter((cls) => cls.status === "active").length,
              change: classes.length === 0 ? "0 live today" : "2 live today",
              color: "#7c3aed",
            },
            {
              icon: <TrendingUp className="w-5 h-5" />,
              label: "Avg. Engagement",
              value: classes.length === 0 ? "0%" : "86%", // Placeholder, can be dynamic
              change: classes.length === 0 ? "0% vs last week" : "+4% vs last week",
              color: "#059669",
            },
            {
              icon: <CheckCircle2 className="w-5 h-5" />,
              label: "Assignments Due",
              value: classes.reduce(
                (acc, cls) => acc + (cls.assignments || 0),
                0,
              ),
              change: classes.length === 0 ? "0 need grading" : "3 need grading",
              color: "#d97706",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-5 shadow-sm"
              style={{ border: "1px solid #f1f5f9" }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}15`, color: stat.color }}
                >
                  {stat.icon}
                </div>
              </div>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "#0f172a",
                }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
              <div className="text-xs mt-1" style={{ color: stat.color }}>
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* Tab toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div
            className="flex p-1 rounded-xl w-full sm:w-auto overflow-x-auto"
            style={{ background: "#f1f5f9", scrollbarWidth: "none" }}
          >
            {(["classes", "rooms", "communities"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="px-5 py-2 rounded-lg text-sm capitalize transition-all shrink-0 flex-1 sm:flex-none"
                style={{
                  background: activeTab === t ? "white" : "transparent",
                  color: activeTab === t ? "#0f172a" : "#64748b",
                  fontWeight: activeTab === t ? 600 : 400,
                  boxShadow:
                    activeTab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {t === "classes" ? "Classrooms" : t === "rooms" ? "Persistent Rooms" : "Communities"}
              </button>
            ))}
          </div>

          {activeTab === "rooms" && (
            <button
              onClick={() => setShowCreateRoomModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-all"
              style={{
                background: "linear-gradient(135deg, #1e3a8a, #7c3aed)",
              }}
            >
              <Plus className="w-4 h-4" />
              New Room
            </button>
          )}
        </div>

        {/* Main grid left column */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === "classes" && (
            <>
              <div className="flex items-center justify-between mb-1">
                <h2
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  My Classrooms
                </h2>
                <button className="text-xs text-violet-600 flex items-center gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {classes.length === 0 && (
                <div className="mt-4 p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center" style={{ borderColor: "#cbd5e1" }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No classes yet</h3>
                  <p className="text-sm text-gray-500 max-w-sm mb-4">You haven't created any classrooms. Click "Create Classroom" to get started.</p>
                  <button onClick={() => setShowCreateModal(true)} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: "#7c3aed" }}>
                    Create Classroom
                  </button>
                </div>
              )}

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
                        style={{
                          background: `${cls.color}18`,
                          color: cls.color,
                        }}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>
                            {cls.name}
                          </span>
                          {cls.status === "active" && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: "#dcfce7",
                                color: "#16a34a",
                              }}
                            >
                              Scheduled Today
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> {cls.students}{" "}
                            students
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {cls.nextSession}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5" /> {cls.language}
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
                      <code
                        className="text-xs px-2.5 py-1 rounded-lg"
                        style={{
                          background: "#f1f5f9",
                          color: "#0f172a",
                          fontWeight: 600,
                        }}
                      >
                        {cls.code}
                      </code>
                      <button
                        onClick={() => copyCode(cls.code)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {copiedCode === cls.code ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      {cls.teacher_id === profile?.id && (
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-red-50"
                          style={{ border: "1px solid #fecaca", color: "#ef4444" }}
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/classroom/${cls.code}`)}
                        className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5 transition-all hover:opacity-90"
                        style={{ background: cls.color || '#1e3a8a' }}
                      >
                        <Video className="w-3.5 h-3.5" />
                        {cls.teacher_id === profile?.id ? "Start Class" : "Enter Class"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === "rooms" && (
            <>
              {/* Dynamic Rooms */}
              {rooms.length === 0 && (
                <div className="mt-4 p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center" style={{ borderColor: "#cbd5e1" }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(30,58,138,0.08)", color: "#1e3a8a" }}>
                    <Radio className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No persistent rooms</h3>
                  <p className="text-sm text-gray-500 max-w-sm mb-4">You haven't opened any persistent rooms. Persistent rooms are always available for students to request access.</p>
                  <button onClick={() => setShowCreateRoomModal(true)} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: "#1e3a8a" }}>
                    Create Room
                  </button>
                </div>
              )}
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  style={{ border: "1px solid #f1f5f9" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: room.live
                            ? "rgba(34,197,94,0.1)"
                            : "#f1f5f9",
                          color: room.live ? "#16a34a" : "#94a3b8",
                        }}
                      >
                        <Radio className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>
                            {room.name}
                          </span>
                          <span
                            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: room.live
                                ? "rgba(34,197,94,0.1)"
                                : "#f1f5f9",
                              color: room.live ? "#16a34a" : "#94a3b8",
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                background: room.live ? "#22c55e" : "#94a3b8",
                              }}
                            />
                            {room.live ? "Live" : "Offline"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {room.participants || 0} participants
                          </span>
                          <span className="text-xs text-gray-400">
                            {room.sessions || 0} sessions total
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {room.teacher_id === profile?.id && room.pendingCount > 0 && (
                        <button
                          onClick={() => setShowAccessModal(true)}
                          className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                          style={{
                            background: "rgba(251,191,36,0.1)",
                            color: "#d97706",
                          }}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Requests
                        </button>
                      )}
                      {room.teacher_id === profile?.id ? (
                        <>
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
                            onClick={() => handleDeleteRoom(room.id)}
                            style={{ border: "1px solid #fecaca", color: "#ef4444" }}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <>
                          {roomStatuses[room.id] === "pending" ? (
                            <button disabled className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: "rgba(251,191,36,0.15)", color: "#d97706" }}>
                              <Radio className="w-3.5 h-3.5" /> Pending
                            </button>
                          ) : roomStatuses[room.id] === "approved" ? (
                            <button onClick={() => navigate(`/classroom/${room.id}`)} className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5 hover:opacity-90" style={{ background: "#16a34a" }}>
                              <Video className="w-3.5 h-3.5" /> Enter Room
                            </button>
                          ) : (
                            <button onClick={() => handleRoomAction(room)} className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5 hover:opacity-90" style={{ background: room.is_private ? "#7c3aed" : "#1e3a8a" }}>
                              {room.is_private ? <Lock className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                              {room.is_private ? "Request to Join" : "Join Room"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === "communities" && (
            <>
              {communities.length === 0 && (
                <div className="mt-4 p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center" style={{ borderColor: "#cbd5e1" }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(139,92,246,0.08)", color: "#8b5cf6" }}>
                    <Radio className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No communities yet</h3>
                  <p className="text-sm text-gray-500 max-w-sm mb-4">You haven't joined any communities. Explore public communities or create your own.</p>
                  <button onClick={() => navigate("/community")} className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90" style={{ background: "#8b5cf6" }}>
                    Explore Communities
                  </button>
                </div>
              )}
              {communities.map((comm) => (
                <div
                  key={comm.id}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  style={{ border: "1px solid #f1f5f9" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-white font-bold"
                        style={{ background: comm.color || "#1e3a8a" }}
                      >
                        {comm.avatar || comm.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontWeight: 700, color: "#0f172a" }}>
                            {comm.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: "#f1f5f9", color: "#64748b" }}>
                            {comm.type}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Community Group
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/community/${comm.id}`)}
                      className="text-xs px-4 py-2 rounded-lg text-white font-semibold transition-all hover:opacity-90 flex items-center gap-1.5"
                      style={{ background: comm.color || "#1e3a8a" }}
                    >
                      <Radio className="w-3.5 h-3.5" /> Enter Community
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>


        {/* Right column */}
        <div className="space-y-5">
          {/* Weekly Attendance Chart */}
          <div
            className="bg-white rounded-2xl p-5 shadow-sm"
            style={{ border: "1px solid #f1f5f9" }}
          >
            <h3 className="mb-4" style={{ fontWeight: 700, color: "#0f172a" }}>
              Weekly Attendance
            </h3>

            {engagementData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart
                  data={engagementData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="students"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    fill="url(#gradBlue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-gray-400">
                No attendance data available.
              </p>
            )}
          </div>

          {/* Recent Assignments */}
          <div
            className="bg-white rounded-2xl p-5 shadow-sm"
            style={{ border: "1px solid #f1f5f9" }}
          >
            <h3 className="mb-4" style={{ fontWeight: 700, color: "#0f172a" }}>
              Recent Assignments
            </h3>

            {recentAssignments.length > 0 ? (
              <div className="space-y-4">
                {recentAssignments.map((a) => (
                  <div key={a.id}>
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <div
                          className="text-sm"
                          style={{ fontWeight: 600, color: "#0f172a" }}
                        >
                          {a.title}
                        </div>
                        <div className="text-xs text-gray-400">
                          {a.class_name} · Due {a.due_date}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {a.submissions_count}/{a.total_students}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "#f1f5f9" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${a.total_students > 0
                            ? (a.submissions_count / a.total_students) * 100
                            : 0
                            }%`,
                          background:
                            "linear-gradient(90deg, #1e3a8a, #7c3aed)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No recent assignments.</p>
            )}
          </div>

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
                <p className="text-sm text-gray-400 mb-6">A persistent room where students can request to join.</p>
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
                  <span className="text-sm text-gray-600">Private room (students need approval to join)</span>
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

          {/* Join Class Modal */}
          {showJoinModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowJoinModal(false)}>
              <div className="bg-white rounded-2xl p-8 shadow-2xl" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(124,58,237,0.08)", color: "#7c3aed" }}>
                  <Users className="w-7 h-7" />
                </div>
                <h2 className="mb-1" style={{ fontWeight: 800, color: "#0f172a" }}>Join a Classroom</h2>
                <p className="text-sm text-gray-400 mb-6">Enter the class code your student or teacher shared with you.</p>
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


          {/* Communities */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "linear-gradient(135deg, #0f172a, #1e3a8a)" }}
          >
            <h3 className="text-white mb-1" style={{ fontWeight: 700 }}>
              Communities
            </h3>
            <p className="text-xs text-blue-300 mb-4">
              Your active learning communities
            </p>

            {communities.length > 0 ? (
              communities.map((c) => (
                <button
                  key={c.code}
                  onClick={() => navigate(`/community/${c.code}`)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1.5 transition-all hover:bg-white/10 text-left"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-white shrink-0"
                    style={{ background: c.color, fontWeight: 700 }}
                  >
                    {c.name
                      .split(" ")
                      .filter((w: string) => w.length > 0) // remove empty strings
                      .map((w: string) => w[0].toUpperCase()) // take first letter and uppercase
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-white text-xs truncate"
                      style={{ fontWeight: 600 }}
                    >
                      {c.name}
                    </div>
                    <div className="text-blue-400 text-xs capitalize">
                      {c.type}
                    </div>
                  </div>
                  {c.unread_count > 0 && (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                      style={{
                        background: "#7c3aed",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                      }}
                    >
                      {c.unread_count}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <p className="text-xs text-blue-200">No communities yet.</p>
            )}

            {/* View All Communities */}
            <button
              onClick={() => navigate("/community")}
              className="w-full mt-2 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              View all communities <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
