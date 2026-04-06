import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/database/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Users, Crown, ArrowLeft, Shield, UserCheck, Star, ImageIcon, Video,
  Code, Camera, Mic2, Trophy, Lightbulb,
} from "lucide-react";

interface ClubData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  poster_url: string | null;
  trailer_url: string | null;
  max_members: number | null;
  created_at: string;
}

interface MemberInfo {
  membership_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  year: string | null;
}

const categoryIcons: Record<string, React.ElementType> = {
  Technical: Code,
  Creative: Camera,
  Literary: Mic2,
  Sports: Trophy,
  Business: Lightbulb,
  General: Users,
};

const roleColors: Record<string, string> = {
  president: "bg-destructive/10 text-destructive",
  "vice-president": "bg-accent/10 text-accent-foreground",
  secretary: "bg-primary/10 text-primary",
  treasurer: "bg-secondary/10 text-secondary-foreground",
  lead: "bg-primary/10 text-primary",
  member: "bg-muted text-muted-foreground",
};

const roleIcons: Record<string, React.ElementType> = {
  president: Crown,
  "vice-president": Star,
  secretary: Shield,
  lead: Star,
  member: UserCheck,
};

const ClubDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [club, setClub] = useState<ClubData | null>(null);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [joining, setJoining] = useState(false);

  const fetchClubData = async () => {
    if (!id) return;
    setLoading(true);

    const [{ data: clubData }, { data: membershipsData }] = await Promise.all([
      supabase.from("clubs").select("*").eq("id", id).single(),
      supabase.from("club_memberships").select("*").eq("club_id", id).order("joined_at"),
    ]);

    if (clubData) setClub(clubData as ClubData);

    if (membershipsData && membershipsData.length > 0) {
      // Only show approved members in the list
      const approvedMemberships = membershipsData.filter((m: any) => m.status === 'approved');
      const userIds = approvedMemberships.map((m: any) => m.user_id);
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("id, full_name, email, avatar_url, year").in("id", userIds)
        : { data: [] };

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      const enriched: MemberInfo[] = approvedMemberships.map((m: any) => {
        const profile = profileMap.get(m.user_id) || {};
        return {
          membership_id: m.id,
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          full_name: (profile as any).full_name || null,
          email: (profile as any).email || null,
          avatar_url: (profile as any).avatar_url || null,
          year: (profile as any).year || null,
        };
      });

      setMembers(enriched);
      if (user) {
        const userMembership = membershipsData.find((m: any) => m.user_id === user.id);
        setIsMember(userMembership?.status === 'approved');
        setIsPending(userMembership?.status === 'pending');
      }
    } else {
      setMembers([]);
      setIsMember(false);
      setIsPending(false);
    }

    setLoading(false);
  };

  useEffect(() => { fetchClubData(); }, [id, user]);

  const handleJoin = async () => {
    if (!user || !id) { toast.error("Please login to join"); return; }
    setJoining(true);
    const { error } = await supabase.from("club_memberships").insert({ club_id: id, user_id: user.id, status: 'pending' });
    if (error) toast.error(error.message.includes("duplicate") ? "Already applied!" : error.message);
    else { toast.success("Application submitted! Waiting for approval. ⏳"); fetchClubData(); }
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!user || !id) return;
    setJoining(true);
    const { error } = await supabase.from("club_memberships").delete().eq("club_id", id).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("You've left the club"); fetchClubData(); }
    setJoining(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 text-center text-muted-foreground">Loading club...</div>
      </Layout>
    );
  }

  if (!club) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h2 className="font-display text-2xl font-bold">Club Not Found</h2>
          <Link to="/clubs" className="mt-4 inline-block text-primary hover:underline">← Back to Clubs</Link>
        </div>
      </Layout>
    );
  }

  const Icon = categoryIcons[club.category] || Users;
  const leaders = members.filter((m) => m.role !== "member");
  const regularMembers = members.filter((m) => m.role === "member");

  return (
    <Layout>
      {/* Hero Banner */}
      <div className="relative">
        {club.poster_url ? (
          <div className="h-56 md:h-72 w-full overflow-hidden">
            <img src={club.poster_url} alt={club.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-gradient-hero">
            <Icon className="h-20 w-20 text-primary-foreground/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0">
          <div className="container pb-6">
            <Link to="/clubs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Clubs
            </Link>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold">{club.name}</h1>
                <div className="mt-2 flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    <Icon className="h-3.5 w-3.5" /> {club.category}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" /> {members.length} member{members.length !== 1 ? "s" : ""}
                  </span>
                  {club.max_members && (
                    <span className="text-sm text-muted-foreground">· Max {club.max_members}</span>
                  )}
                </div>
              </div>
              <div>
                {!user ? (
                  <Link to="/login" className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground">
                    Login to Join
                  </Link>
                ) : isMember ? (
                  <div className="flex gap-2">
                    <span className="rounded-lg bg-secondary/10 px-4 py-2.5 text-sm font-semibold text-secondary">✓ Member</span>
                    <button onClick={handleLeave} disabled={joining} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-60">
                      Leave
                    </button>
                  </div>
                ) : isPending ? (
                  <div className="flex gap-2">
                    <span className="rounded-lg bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-600">⏳ Pending Approval</span>
                    <button onClick={handleLeave} disabled={joining} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-60">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={handleJoin} disabled={joining} className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                    {joining ? "Applying..." : "Apply to Join"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 space-y-10">
        {/* About */}
        {club.description && (
          <section>
            <h2 className="font-display text-xl font-bold mb-3">About</h2>
            <p className="text-muted-foreground leading-relaxed max-w-2xl">{club.description}</p>
          </section>
        )}

        {/* Club Trailer */}
        {club.trailer_url && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Video className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Club Trailer</h2>
            </div>
            <div className="rounded-xl overflow-hidden border bg-black max-w-2xl shadow-card">
              <video
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-80 object-contain"
                poster={club.poster_url || undefined}
              >
                <source src={club.trailer_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </section>
        )}

        {/* Leadership / Key Roles */}
        {leaders.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold mb-4">Leadership</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {leaders.map((m) => {
                const RoleIcon = roleIcons[m.role] || Star;
                return (
                  <Link key={m.membership_id} to={`/profile/${m.user_id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    >
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt={m.full_name || "Member"} className="h-14 w-14 rounded-full object-cover border-2 border-primary/20" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                          {(m.full_name || m.email || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold truncate">{m.full_name || m.email || "Anonymous"}</p>
                        {m.year && <p className="text-xs text-muted-foreground">{m.year}</p>}
                        <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleColors[m.role] || roleColors.member}`}>
                          <RoleIcon className="h-3 w-3" />
                          {m.role.replace("-", " ")}
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* All Members */}
        <section>
          <h2 className="font-display text-xl font-bold mb-4">
            Members ({members.length})
          </h2>
          {members.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground shadow-sm">
              <Users className="mx-auto h-12 w-12 mb-3 text-muted-foreground/30" />
              <p className="font-medium">No members yet</p>
              <p className="text-sm mt-1">Be the first to join this club!</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {members.map((m, i) => {
                const RoleIcon = roleIcons[m.role] || UserCheck;
                return (
                  <Link key={m.membership_id} to={`/profile/${m.user_id}`}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt={m.full_name || "Member"} className="h-11 w-11 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
                          {(m.full_name || m.email || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{m.full_name || m.email || "Anonymous"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${roleColors[m.role] || roleColors.member}`}>
                            <RoleIcon className="h-2.5 w-2.5" />
                            {m.role.replace("-", " ")}
                          </span>
                          {m.year && <span className="text-[10px] text-muted-foreground">{m.year}</span>}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default ClubDetail;

