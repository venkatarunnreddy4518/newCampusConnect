import { useEffect, useState, type ElementType } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Check,
  Clock3,
  Code,
  Crown,
  Lightbulb,
  LogIn,
  Mic2,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/database/client";

interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string;
  poster_url: string | null;
  trailer_url: string | null;
  max_members: number | null;
  member_count: number;
  is_member: boolean;
  is_pending: boolean;
}

const categoryIcons: Record<string, ElementType> = {
  Technical: Code,
  Creative: Camera,
  Literary: Mic2,
  Sports: Trophy,
  Business: Lightbulb,
  General: Users,
};

const categoryColors: Record<string, string> = {
  Technical: "bg-primary text-primary-foreground",
  Creative: "bg-accent text-accent-foreground",
  Literary: "bg-secondary text-secondary-foreground",
  Sports: "bg-destructive text-destructive-foreground",
  Business: "bg-campus-teal text-white",
  General: "bg-muted text-foreground",
};

const Clubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  const fetchClubs = async () => {
    setLoading(true);
    const { data: clubsData } = await supabase.from("clubs").select("*").order("name");

    if (!clubsData) {
      setLoading(false);
      return;
    }

    const { data: memberships } = await supabase.from("club_memberships").select("club_id, user_id, status");

    const enrichedClubs: Club[] = (clubsData as any[]).map((club) => {
      const clubMembers = (memberships || []).filter((membership: any) => membership.club_id === club.id);
      const approvedMembers = clubMembers.filter((membership: any) => membership.status === "approved");

      return {
        ...club,
        member_count: approvedMembers.length,
        is_member: user ? clubMembers.some((membership: any) => membership.user_id === user.id && membership.status === "approved") : false,
        is_pending: user ? clubMembers.some((membership: any) => membership.user_id === user.id && membership.status === "pending") : false,
      };
    });

    setClubs(enrichedClubs);
    setLoading(false);
  };

  useEffect(() => {
    fetchClubs();
  }, [user]);

  const handleJoin = async (clubId: string) => {
    if (!user) {
      toast.error("Please login to join clubs");
      return;
    }

    setJoining(clubId);
    const { error } = await supabase.from("club_memberships").insert({ club_id: clubId, user_id: user.id, status: "pending" });

    if (error) {
      toast.error(error.message.includes("duplicate") ? "You've already applied!" : error.message);
    } else {
      const clubName = clubs.find((club) => club.id === clubId)?.name || "the club";
      const { error: notificationError } = await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Application Submitted",
        message: `Your request to join ${clubName} is pending review.`,
        type: "warning",
      });

      if (notificationError) {
        console.error("Failed to create join notification", notificationError);
      }

      toast.success("Application submitted! Waiting for approval.");
      fetchClubs();
    }

    setJoining(null);
  };

  const handleLeave = async (clubId: string) => {
    if (!user) return;

    setJoining(clubId);
    const { error } = await supabase.from("club_memberships").delete().eq("club_id", clubId).eq("user_id", user.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("You've left the club");
      fetchClubs();
    }

    setJoining(null);
  };

  const categories = ["All", ...Array.from(new Set(clubs.map((club) => club.category)))];
  const filteredClubs = filter === "All" ? clubs : clubs.filter((club) => club.category === filter);
  const pendingCount = clubs.filter((club) => club.is_pending).length;
  const memberCount = clubs.filter((club) => club.is_member).length;

  if (!user) {
    return (
      <Layout>
        <div className="container flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
          <LogIn className="h-16 w-16 text-primary" />
          <h2 className="mt-4 font-display text-2xl font-bold">Login Required</h2>
          <p className="mt-2 max-w-md text-muted-foreground">Sign in to explore clubs, apply to join, and track your approval status with the new alert flow.</p>
          <Link to="/login" className="mt-6 inline-block">
            <InteractiveHoverButton text="Go to Login" className="text-sm font-semibold" />
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-grid-premium opacity-[0.3]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--foreground)_/_0.06),transparent_34%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,hsl(var(--foreground)_/_0.04),transparent_40%)]" />

        <div className="relative container py-16">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-4 py-2 text-muted-foreground shadow-card">
                <Sparkles className="h-4 w-4 text-foreground" />
                <span className="text-xs font-semibold uppercase tracking-[0.22em]">Campus clubs with a stronger browse experience</span>
              </div>

              <h1 className="mt-6 max-w-4xl font-display text-5xl font-black leading-[0.98] text-foreground md:text-6xl">
                Discover club culture through a more premium, application-friendly hub.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                Explore categories, apply faster, and see membership states more clearly with a layout that feels intentional from first click to approval.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total clubs", value: String(clubs.length).padStart(2, "0"), icon: Crown },
                { label: "You joined", value: String(memberCount).padStart(2, "0"), icon: Check },
                { label: "Pending", value: String(pendingCount).padStart(2, "0"), icon: Clock3 },
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

      <section className="container -mt-6 relative z-10 pb-16">
        <div className="rounded-[34px] border border-border/80 bg-card p-6 shadow-card">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Club discovery</p>
              <h2 className="mt-2 font-display text-3xl font-black leading-tight">Filter categories and jump into the communities that fit your campus life.</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    filter === category ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="rounded-[28px] border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
                <p className="text-sm font-medium text-muted-foreground">Loading clubs...</p>
              </div>
            ) : filteredClubs.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
                <p className="font-display text-2xl font-black">No clubs found in this category</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">Try another category and the club grid will update instantly.</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredClubs.map((club) => {
                  const Icon = categoryIcons[club.category] || Users;
                  const actionLabel = club.is_member ? "Member" : club.is_pending ? "Pending approval" : "Open club";

                  return (
                    <motion.div
                      key={club.id}
                      whileHover={{ y: -6 }}
                      transition={{ type: "spring", stiffness: 320, damping: 24 }}
                      className="group overflow-hidden rounded-[30px] border border-border/80 bg-card shadow-card transition-shadow hover:shadow-card-hover"
                    >
                      <Link to={`/clubs/${club.id}`} className="block">
                        <div className="relative h-56 overflow-hidden bg-primary">
                          <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-25">
                            <source src={club.trailer_url || "https://videos.pexels.com/video-files/856973/856973-hd_1920_1080_30fps.mp4"} type="video/mp4" />
                          </video>

                          {club.poster_url ? (
                            <img src={club.poster_url} alt={club.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-hero">
                              <Icon className="h-12 w-12 text-primary-foreground/30" />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/35 to-transparent" />

                          <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${categoryColors[club.category] || categoryColors.General}`}>
                              <Icon className="h-3 w-3" />
                              {club.category}
                            </span>

                            {club.is_member ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                                <Check className="h-3.5 w-3.5" />
                                Member
                              </span>
                            ) : club.is_pending ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-[11px] font-semibold text-background">
                                <Clock3 className="h-3.5 w-3.5" />
                                Pending
                              </span>
                            ) : null}
                          </div>

                          <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-foreground/55">Club spotlight</p>
                            <h3 className="mt-2 font-display text-3xl font-black leading-tight">{club.name}</h3>
                          </div>
                        </div>
                      </Link>

                      <div className="space-y-5 p-5">
                        <p className="line-clamp-2 text-sm leading-7 text-muted-foreground">
                          {club.description || "Explore what the club is about, then apply to join and track your status in alerts."}
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-muted/70 px-4 py-3 text-sm">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Members</p>
                            <p className="mt-1 inline-flex items-center gap-2 font-semibold">
                              <Users className="h-4 w-4 text-primary" />
                              {club.member_count}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-muted/70 px-4 py-3 text-sm">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Capacity</p>
                            <p className="mt-1 font-semibold text-foreground">{club.max_members ? `${club.max_members} max` : "Open"}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Link
                            to={`/clubs/${club.id}`}
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                          >
                            {actionLabel}
                            <ArrowRight className="h-4 w-4" />
                          </Link>

                          {club.is_member || club.is_pending ? (
                            <button
                              onClick={() => handleLeave(club.id)}
                              disabled={joining === club.id}
                              className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                            >
                              {joining === club.id ? "Updating..." : club.is_member ? "Leave club" : "Cancel request"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleJoin(club.id)}
                              disabled={joining === club.id}
                              className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
                            >
                              {joining === club.id ? "Applying..." : "Apply now"}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Clubs;
