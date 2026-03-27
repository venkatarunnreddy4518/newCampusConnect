import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Bell, AlertCircle, CheckCircle, Info, LogIn, Check } from "lucide-react";
import { Link } from "react-router-dom";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const typeIcons: Record<string, React.ElementType> = {
  success: CheckCircle,
  alert: AlertCircle,
  info: Info,
};

const typeColors: Record<string, string> = {
  success: "bg-accent/15 text-accent-foreground",
  alert: "bg-destructive/15 text-destructive",
  info: "bg-primary/15 text-primary",
};

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setNotifications(data as Notification[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    if (!user) return;
    // Subscribe to realtime notifications
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  if (!user) {
    return (
      <Layout>
        <div className="container flex flex-col items-center justify-center py-20 text-center">
          <LogIn className="h-16 w-16 text-primary" />
          <h2 className="mt-4 font-display text-2xl font-bold">Login Required</h2>
          <p className="mt-2 text-muted-foreground">Sign in to view your notifications.</p>
          <Link to="/login" className="mt-6 inline-block">
            <InteractiveHoverButton text="Go to Login" className="text-sm font-semibold" />
          </Link>
        </div>
      </Layout>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Layout>
      <div className="container max-w-2xl py-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            <h1 className="font-display text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-destructive px-2.5 py-0.5 text-xs font-bold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80">
              Mark all read
            </button>
          )}
        </div>
        <p className="mt-1 text-muted-foreground">Club updates and important alerts.</p>

        <div className="mt-8 space-y-3">
          {loading ? (
            <p className="text-center text-muted-foreground py-10">Loading...</p>
          ) : notifications.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground shadow-sm">
              <Bell className="mx-auto h-12 w-12 mb-3 text-muted-foreground/30" />
              <p className="font-medium">No notifications yet</p>
              <p className="text-sm mt-1">You'll see updates here when you get accepted into clubs.</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const Icon = typeIcons[notif.type] || Info;
              return (
                <div
                  key={notif.id}
                  className={`flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm transition-opacity ${notif.is_read ? "opacity-60" : ""}`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${typeColors[notif.type] || typeColors.info}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{notif.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(notif.created_at).toLocaleDateString()} · {new Date(notif.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-muted"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
