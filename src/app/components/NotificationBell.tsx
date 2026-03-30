import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "./supabaseClient";
import { Bell, Check, Trash2, X } from "lucide-react";

export function NotificationBell({ userId }: { userId: string | undefined }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Load initial notifications
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, message, link, is_read, created_at, type, actor_id, profiles!notifications_actor_id_fkey(full_name, avatar_url)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    };
    fetchNotifications();

    // Subscribe to real-time inserts
    const channel = supabase
      .channel(`notifications_${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
        // Fetch the actor profile for the new notification
        const fetchActor = async () => {
          const { data: actor } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", payload.new.actor_id).single();
          const newNotif = { ...payload.new, profiles: actor };
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        };
        fetchActor();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markAllAsRead = async () => {
    if (!userId) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => notifications.find(n => n.id === id)?.is_read ? prev : Math.max(0, prev - 1));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
        style={{ color: "rgba(255,255,255,0.8)" }}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-2 w-2.5 h-2.5 rounded-full bg-red-500 border-2" style={{ borderColor: "#1e3a8a" }} />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col" style={{ background: "white", border: "1px solid #f1f5f9", maxHeight: "80vh" }}>
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <div className="font-bold text-gray-900">Notifications</div>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-1" style={{ maxHeight: 400 }}>
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">No new notifications</div>
              ) : (
                notifications.map((n) => {
                  const actor = n.profiles;
                  const initials = actor?.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "AC";
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="group flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors relative"
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden text-xs" style={{ background: actor?.avatar_url ? "transparent" : "#7c3aed" }}>
                        {actor?.avatar_url ? <img src={actor.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : initials}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="text-sm text-gray-900 leading-snug" style={{ fontWeight: n.is_read ? 400 : 700 }}>
                          {n.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full bg-violet-600 shrink-0 self-center" />
                      )}
                      
                      <button onClick={(e) => deleteNotification(e, n.id)} className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-3 text-center" style={{ borderTop: "1px solid #f1f5f9", background: "#f8faff" }}>
              <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">Realtime enabled ✨</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
