import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Calendar,
  Crown,
  LogIn,
  Radio,
  Settings,
  Trophy,
  User,
} from "lucide-react";
import Layout from "@/components/Layout";
import { useEvents } from "@/hooks/useEvents";
import { supabase } from "@/integrations/database/client";
import { useAuth } from "@/contexts/AuthContext";

interface LiveMatch {
  id: string;
  status: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const fallingStars = [
  { left: "8%", top: "6%", delay: "0.2s", duration: "9.8s" },
  { left: "22%", top: "2%", delay: "2.1s", duration: "11.6s" },
  { left: "38%", top: "8%", delay: "4.4s", duration: "10.2s" },
  { left: "54%", top: "4%", delay: "1.3s", duration: "12.1s" },
  { left: "69%", top: "1%", delay: "5.4s", duration: "10.8s" },
  { left: "82%", top: "10%", delay: "3.5s", duration: "11.2s" },
];

const Index = () => {
  const { events } = useEvents();
  const { user, isAdmin, isModerator } = useAuth();
  const [clubCount, setClubCount] = useState(0);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      const [{ data: clubs }, { data: matches }] = await Promise.all([
        supabase.from("clubs").select("id"),
        supabase.from("live_matches").select("id, status").in("status", ["live", "completed"]),
      ]);

      setClubCount(clubs?.length || 0);
      setLiveMatches((matches as LiveMatch[]) || []);
    };

    fetchHomeData();

    const channel = supabase
      .channel("home-live-scores")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_matches" }, fetchHomeData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const upcomingCount = events.filter((item) => !item.is_live).length;
  const liveCount = liveMatches.filter((item) => item.status === "live").length;

  const quickLinks = [
    {
      to: "/events",
      title: "Events",
      description: "Open the full event list and register fast.",
      meta: `${upcomingCount} upcoming`,
      icon: Calendar,
    },
    {
      to: "/clubs",
      title: "Clubs",
      description: "Browse clubs and apply without extra steps.",
      meta: `${clubCount} active`,
      icon: Crown,
    },
    {
      to: "/live-scores",
      title: "Live Scores",
      description: "Check match updates and scoreboards quickly.",
      meta: `${liveCount} live now`,
      icon: Trophy,
    },
    {
      to: "/notifications",
      title: "Alerts",
      description: "View approvals, rejections, and updates clearly.",
      meta: "Status center",
      icon: Bell,
    },
    isAdmin
      ? {
          to: "/admin",
          title: "Admin",
          description: "Manage clubs, events, permissions, and media.",
          meta: "Control room",
          icon: Settings,
        }
      : isModerator
        ? {
            to: "/score-calculator",
            title: "Scorer",
            description: "Update scoreboards and match flow smoothly.",
            meta: "Moderator tools",
            icon: Radio,
          }
        : user
          ? {
              to: `/profile/${user.id}`,
              title: "Profile",
              description: "Open your account and campus activity.",
              meta: "Your space",
              icon: User,
            }
          : {
              to: "/login",
              title: "Login",
              description: "Sign in to access clubs, alerts, and tools.",
              meta: "Account access",
              icon: LogIn,
            },
  ];

  return (
    <Layout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-premium opacity-[0.6]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.75),transparent_26%),radial-gradient(circle_at_bottom,rgba(0,0,0,0.06),transparent_32%)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_26%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.03),transparent_32%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
          <div className="absolute inset-0 opacity-100 transition-opacity duration-500 dark:opacity-0">
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 4, 0] }}
              transition={{ duration: 8.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[4%] top-[16%] hidden xl:block"
            >
              <div className="relative h-44 w-44 opacity-70">
                <div className="absolute inset-4 rounded-full border border-dashed border-foreground/10" />
                <div className="absolute left-4 top-10 h-24 w-32 rotate-[16deg] rounded-[999px] border border-foreground/10 border-b-transparent border-r-transparent" />
                <div className="absolute left-12 top-24 h-px w-28 rotate-[12deg] bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
                <div className="absolute left-20 top-20 h-16 w-16 rounded-full border border-foreground/8" />
                <motion.div
                  animate={{ x: [0, 16, 0], y: [0, -12, 0] }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-24 top-5 h-4 w-4 rounded-full border border-foreground/15 bg-background shadow-[0_0_0_8px_hsl(var(--background)_/_0.92)]"
                />
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0], rotate: [0, -2, 0] }}
              transition={{ duration: 9.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-[5%] top-[19%] hidden xl:block"
            >
              <div className="relative h-40 w-56 rounded-[34px] border border-foreground/10 bg-background/35 backdrop-blur-[2px]">
                <div className="absolute inset-4 rounded-[26px] border border-foreground/9" />
                <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-foreground/10" />
                <div className="absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-foreground/10" />
                <div className="absolute left-7 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-foreground/8" />
                <div className="absolute right-7 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full border border-foreground/8" />
                <motion.div
                  animate={{ x: [0, 18, 0], y: [0, -8, 0] }}
                  transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-16 top-16 h-4 w-4 rounded-full border border-foreground/15 bg-background shadow-[0_0_0_8px_hsl(var(--background)_/_0.92)]"
                />
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 7.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[19%] left-[7%] hidden xl:block"
            >
              <div className="relative h-36 w-36 opacity-65">
                <div className="absolute inset-0 rounded-full border border-foreground/10" />
                <div className="absolute inset-5 rounded-full border border-dashed border-foreground/10" />
                <div className="absolute inset-11 rounded-full border border-foreground/8" />
                <div className="absolute left-1/2 top-1/2 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 9.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <div className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 rounded-full border border-foreground/15 bg-background shadow-[0_0_0_8px_hsl(var(--background)_/_0.92)]" />
                </motion.div>
              </div>
            </motion.div>
          </div>

          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 dark:opacity-100">
            {fallingStars.map((star, index) => (
              <span
                key={`${star.left}-${index}`}
                className="homepage-falling-star"
                style={
                  {
                    left: star.left,
                    top: star.top,
                    animationDelay: star.delay,
                    animationDuration: star.duration,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </div>

        <div className="container relative flex min-h-[calc(100vh-5rem)] flex-col justify-center py-10">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mx-auto max-w-5xl text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground shadow-sm">
              CampusConnect
            </div>

            <h1 className="mt-6 font-display text-5xl font-black leading-[0.95] text-foreground md:text-7xl xl:text-8xl">
              Everything campus,
              <br />
              one clear dashboard.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
              We removed the extra homepage sections and kept the important actions on one clean screen, so users can reach events, clubs, live scores, alerts, and tools without scrolling through noise.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/events"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Open Events
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to={user ? "/notifications" : "/login"}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                {user ? "Open Alerts" : "Sign In"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          >
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group rounded-[28px] border border-border bg-card p-5 shadow-card transition-transform hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    {item.meta}
                  </span>
                </div>

                <h2 className="mt-5 font-display text-2xl font-black text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  Open
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="mt-6 grid gap-4 md:grid-cols-3"
          >
            {[
              { label: "Upcoming events", value: String(upcomingCount).padStart(2, "0") },
              { label: "Active clubs", value: String(clubCount).padStart(2, "0") },
              { label: "Live scoreboards", value: String(liveCount).padStart(2, "0") },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-border bg-card px-5 py-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 font-display text-3xl font-black text-foreground">{item.value}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
