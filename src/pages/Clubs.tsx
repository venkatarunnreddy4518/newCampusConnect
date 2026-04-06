import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/database/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Users, LogIn, Crown, Code, Camera, Music, Mic2, Trophy, Lightbulb, Theater, ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

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

const categoryIcons: Record<string, React.ElementType> = {
  Technical: Code,
  Creative: Camera,
  Literary: Mic2,
  Sports: Trophy,
  Business: Lightbulb,
  General: Users,
};

const categoryColors: Record<string, string> = {
  Technical: "bg-primary/10 text-primary",
  Creative: "bg-accent/10 text-accent",
  Literary: "bg-secondary/10 text-secondary",
  Sports: "bg-destructive/10 text-destructive",
  Business: "bg-primary/10 text-primary",
  General: "bg-muted text-muted-foreground",
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
    if (!clubsData) { setLoading(false); return; }

    const { data: memberships } = await supabase
      .from("club_memberships")
      .select("club_id, user_id, status");

    const enriched: Club[] = (clubsData as any[]).map((club) => {
      const clubMembers = (memberships || []).filter((m: any) => m.club_id === club.id);
      const approvedMembers = clubMembers.filter((m: any) => m.status === 'approved');
      return {
        ...club,
        member_count: approvedMembers.length,
        is_member: user ? clubMembers.some((m: any) => m.user_id === user.id && m.status === 'approved') : false,
        is_pending: user ? clubMembers.some((m: any) => m.user_id === user.id && m.status === 'pending') : false,
      };
    });

    setClubs(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchClubs(); }, [user]);

  const handleJoin = async (clubId: string) => {
    if (!user) { toast.error("Please login to join clubs"); return; }
    setJoining(clubId);
    const { error } = await supabase.from("club_memberships").insert({ club_id: clubId, user_id: user.id, status: 'pending' });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "You've already applied!" : error.message);
    } else {
      toast.success("Application submitted! Waiting for approval. ⏳");
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

  const categories = ["All", ...Array.from(new Set(clubs.map((c) => c.category)))];
  const filtered = filter === "All" ? clubs : clubs.filter((c) => c.category === filter);

  if (!user) {
    return (
      <Layout>
        <div className="container flex flex-col items-center justify-center py-20 text-center">
          <LogIn className="h-16 w-16 text-primary" />
          <h2 className="mt-4 font-display text-2xl font-bold">Login Required</h2>
          <p className="mt-2 text-muted-foreground">Sign in to explore and join campus clubs.</p>
          <Link to="/login" className="mt-6 inline-block">
            <InteractiveHoverButton text="Go to Login" className="text-sm font-semibold" />
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="h-7 w-7 text-accent" />
          <h1 className="font-display text-3xl font-bold">Campus Clubs</h1>
        </div>
        <p className="text-muted-foreground mb-6">Join clubs, connect with like-minded peers, and grow your skills.</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-10">Loading clubs...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {filtered.map((club) => {
              const Icon = categoryIcons[club.category] || Users;
              return (
                <Link key={club.id} to={`/clubs/${club.id}`} className="block">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="group flex flex-col items-center text-center cursor-pointer"
                  >
                    {/* Circle Logo */}
                    <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border-2 border-border bg-card shadow-card transition-shadow group-hover:shadow-card-hover group-hover:border-primary/50">
                      <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-30">
                        <source src={club.trailer_url || "https://videos.pexels.com/video-files/856973/856973-hd_1920_1080_30fps.mp4"} type="video/mp4" />
                      </video>
                      {club.poster_url ? (
                        <img src={club.poster_url} alt={club.name} className="relative h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="relative flex h-full w-full items-center justify-center">
                          <Icon className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                      )}
                      {club.is_member && (
                        <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                          <span className="text-[10px] text-primary-foreground font-bold">✓</span>
                        </div>
                      )}
                      {club.is_pending && (
                        <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-amber-500 border-2 border-background flex items-center justify-center">
                          <span className="text-[10px] text-white font-bold">⏳</span>
                        </div>
                      )}
                    </div>

                    <h3 className="mt-3 font-display text-sm font-bold line-clamp-2 leading-tight">{club.name}</h3>
                    <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColors[club.category] || categoryColors.General}`}>
                      <Icon className="h-2.5 w-2.5" />
                      {club.category}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Users className="h-2.5 w-2.5" /> {club.member_count} members
                    </span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Clubs;

