import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BellRing,
  Check,
  CheckCircle,
  Info,
  LogIn,
} from "lucide-react";
import Layout from "@/components/Layout";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/database/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const alertIcons = {
  primary: BellRing,
  secondary: Bell,
  success: CheckCircle,
  danger: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  light: Bell,
  dark: BellRing,
} as const;

const alertClasses = {
  primary: "border-border bg-card text-foreground",
  secondary: "border-border bg-muted text-foreground",
  success: "border-border bg-card text-foreground",
  danger: "border-border bg-muted text-foreground",
  warning: "border-border bg-card text-foreground",
  info: "border-border bg-muted text-foreground",
  light: "border-border bg-card text-foreground",
  dark: "border-foreground bg-foreground text-background",
} as const;

type AlertVariant = keyof typeof alertClasses;

function getAlertVariant(type: string): AlertVariant {
  switch (type) {
    case "primary":
    case "secondary":
    case "success":
    case "danger":
    case "warning":
    case "info":
    case "light":
    case "dark":
      return type;
    case "alert":
      return "danger";
    default:
      return "info";
  }
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setNotifications(data as Notification[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();

    if (!user) {
      return;
    }

    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((current) => current.map((item) => (
      item.id === id ? { ...item, is_read: true } : item
    )));
  };

  const markAllRead = async () => {
    if (!user) {
      return;
    }

    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
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

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <Layout>
      <div className="container max-w-3xl py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            <h1 className="font-display text-3xl font-bold">Alerts</h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-destructive px-2.5 py-0.5 text-xs font-bold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              Mark all read
            </button>
          )}
        </div>

        <p className="mt-1 text-muted-foreground">
          Application status, join requests, and other important updates will appear here.
        </p>

        <div className="mt-8 space-y-4">
          {loading ? (
            <p className="py-10 text-center text-muted-foreground">Loading alerts...</p>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-8 text-center text-muted-foreground shadow-sm">
              <Bell className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="font-medium">No alerts yet</p>
              <p className="mt-1 text-sm">When you apply, get approved, or get rejected, the update will show here.</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const variant = getAlertVariant(notification.type);
              const Icon = alertIcons[variant];

              return (
                <div
                  key={notification.id}
                  role="alert"
                  className={`rounded-xl border px-4 py-4 shadow-sm transition-opacity ${alertClasses[variant]} ${
                    notification.is_read ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{notification.title}</p>
                        {!notification.is_read && (
                          <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                            New
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm/6 opacity-90">{notification.message}</p>
                      <p className="mt-2 text-xs opacity-75">
                        {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
                      </p>
                    </div>

                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="shrink-0 rounded-md border border-current/20 px-2.5 py-1 text-xs font-semibold hover:bg-black/5"
                        title="Mark as read"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" />
                          Read
                        </span>
                      </button>
                    )}
                  </div>
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
