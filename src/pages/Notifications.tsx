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
import SectionAmbientArt from "@/components/SectionAmbientArt";
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
  const readCount = Math.max(0, notifications.length - unreadCount);

  return (
    <Layout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-grid-premium opacity-[0.3]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--foreground)_/_0.06),transparent_34%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,hsl(var(--foreground)_/_0.04),transparent_40%)]" />
        <SectionAmbientArt variant="alerts" />

        <div className="relative container max-w-6xl py-14 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-4 py-2 text-muted-foreground shadow-card">
                <Bell className="h-4 w-4 text-foreground" />
                <span className="text-xs font-semibold uppercase tracking-[0.22em]">Alert center for approvals, rejections, and updates</span>
              </div>

              <h1 className="mt-6 max-w-4xl font-display text-5xl font-black leading-[0.98] text-foreground md:text-6xl">
                Keep every campus update in one clear alert stream.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                Application status, join requests, and important account updates appear here in a cleaner feed that is easy to scan quickly.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total alerts", value: String(notifications.length).padStart(2, "0"), icon: Bell },
                { label: "Unread", value: String(unreadCount).padStart(2, "0"), icon: BellRing },
                { label: "Read", value: String(readCount).padStart(2, "0"), icon: CheckCircle },
              ].map((item) => (
                <div key={item.label} className="rounded-[28px] border border-border/80 bg-background/90 px-5 py-5 text-foreground shadow-card backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{item.label}</p>
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-4 font-display text-3xl font-black">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container relative z-10 -mt-6 max-w-4xl pb-16">
        <div className="rounded-[34px] border border-border/80 bg-card p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Alert inbox</p>
              <h2 className="mt-2 font-display text-3xl font-black leading-tight">Everything important stays visible here.</h2>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-8 space-y-4">
            {loading ? (
              <p className="py-10 text-center text-muted-foreground">Loading alerts...</p>
            ) : notifications.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-border bg-muted/25 p-8 text-center text-muted-foreground shadow-sm">
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
      </section>
    </Layout>
  );
};

export default Notifications;
