import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  User, Mail, Calendar, GraduationCap, Crown, Trophy, Users,
  Code, Camera, Mic2, Lightbulb, Pencil, Save, X, Plus, Trash2,
  Github, Linkedin, ExternalLink,
} from "lucide-react";

interface ProfileData {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  year: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  gmail_url: string | null;
  achievements: string[] | null;
  created_at: string;
}

interface ClubMembership {
  id: string;
  club_id: string;
  role: string;
  joined_at: string;
  status: string;
  club_name: string;
  club_category: string;
  club_poster_url: string | null;
}

interface EventRegistration {
  id: string;
  event_name: string;
  event_category: string;
  event_date: string | null;
  status: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  Technical: Code,
  Creative: Camera,
  Literary: Mic2,
  Sports: Trophy,
  Business: Lightbulb,
  General: Users,
};

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [clubs, setClubs] = useState<ClubMembership[]>([]);
  const [events, setEvents] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editGithub, setEditGithub] = useState("");
  const [editLinkedin, setEditLinkedin] = useState("");
  const [editGmail, setEditGmail] = useState("");
  const [editAchievements, setEditAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProfile = async () => {
      setLoading(true);

      const [{ data: profileData }, { data: membershipsData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).single(),
        supabase.from("club_memberships").select("*").eq("user_id", id).eq("status", "approved"),
      ]);

      if (profileData) setProfile(profileData as unknown as ProfileData);

      if (membershipsData && membershipsData.length > 0) {
        const clubIds = membershipsData.map((m: any) => m.club_id);
        const { data: clubsData } = await supabase
          .from("clubs")
          .select("id, name, category, poster_url")
          .in("id", clubIds);

        const clubMap = new Map((clubsData || []).map((c: any) => [c.id, c]));

        setClubs(
          membershipsData.map((m: any) => {
            const club = clubMap.get(m.club_id) || {};
            return {
              id: m.id,
              club_id: m.club_id,
              role: m.role,
              joined_at: m.joined_at,
              status: m.status,
              club_name: (club as any).name || "Unknown",
              club_category: (club as any).category || "General",
              club_poster_url: (club as any).poster_url || null,
            };
          })
        );
      }

      if (user && user.id === id) {
        const { data: regsData } = await supabase
          .from("registrations")
          .select("id, event_name, event_category, event_date, status")
          .eq("user_id", id)
          .order("registered_at", { ascending: false })
          .limit(10);
        if (regsData) setEvents(regsData as EventRegistration[]);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [id, user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image.", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = urlData.publicUrl;

    const { error: updateErr } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
    if (updateErr) {
      toast({ title: "Error", description: "Failed to update avatar.", variant: "destructive" });
    } else {
      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : prev);
      toast({ title: "Avatar updated!" });
    }
    setUploadingAvatar(false);
    e.target.value = "";
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 text-center text-muted-foreground">Loading profile...</div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <User className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <h2 className="mt-4 font-display text-2xl font-bold">User Not Found</h2>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">← Back to Home</Link>
        </div>
      </Layout>
    );
  }

  const isOwnProfile = user?.id === id;
  const initials = (profile.full_name || profile.email || "?").charAt(0).toUpperCase();

  const startEditing = () => {
    setEditName(profile.full_name || "");
    setEditYear(profile.year || "");
    setEditGithub(profile.github_url || "");
    setEditLinkedin(profile.linkedin_url || "");
    setEditGmail(profile.gmail_url || "");
    setEditAchievements(profile.achievements || []);
    setNewAchievement("");
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const addAchievement = () => {
    const trimmed = newAchievement.trim();
    if (!trimmed || editAchievements.length >= 20) return;
    setEditAchievements([...editAchievements, trimmed]);
    setNewAchievement("");
  };

  const removeAchievement = (index: number) => {
    setEditAchievements(editAchievements.filter((_, i) => i !== index));
  };

  const saveProfile = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editName.trim(),
        year: editYear.trim() || null,
        github_url: editGithub.trim() || null,
        linkedin_url: editLinkedin.trim() || null,
        gmail_url: editGmail.trim() || null,
        achievements: editAchievements.length > 0 ? editAchievements : null,
      } as any)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } else {
      setProfile({
        ...profile,
        full_name: editName.trim(),
        year: editYear.trim() || null,
        github_url: editGithub.trim() || null,
        linkedin_url: editLinkedin.trim() || null,
        gmail_url: editGmail.trim() || null,
        achievements: editAchievements.length > 0 ? editAchievements : null,
      });
      setEditing(false);
      toast({ title: "Profile updated!" });
    }
  };

  const socialLinks = [
    { url: profile.gmail_url, icon: Mail, label: "Email", color: "hover:text-destructive" },
    { url: profile.github_url, icon: Github, label: "GitHub", color: "hover:text-foreground" },
    { url: profile.linkedin_url, icon: Linkedin, label: "LinkedIn", color: "hover:text-primary" },
  ].filter(l => l.url);

  return (
    <Layout>
      <div className="container max-w-3xl py-10">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm"
        >
          <div className="flex items-start gap-5 sm:gap-6">
            {/* Avatar with upload */}
            <div className="relative group shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || "User"}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-primary/20 shadow-md"
                />
              ) : (
                <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-3xl sm:text-4xl border-4 border-primary/20 shadow-md">
                  {initials}
                </div>
              )}
              {isOwnProfile && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 text-background opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Change photo"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                </>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/60">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-background border-t-transparent" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your full name" className="max-w-xs" maxLength={100} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Year / Batch</label>
                    <Input value={editYear} onChange={(e) => setEditYear(e.target.value)} placeholder="e.g. 2025" className="max-w-xs" maxLength={20} />
                  </div>

                  {/* Social Links */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Social Links</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input value={editGmail} onChange={(e) => setEditGmail(e.target.value)} placeholder="mailto:you@gmail.com" className="flex-1" maxLength={255} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Github className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input value={editGithub} onChange={(e) => setEditGithub(e.target.value)} placeholder="https://github.com/username" className="flex-1" maxLength={255} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input value={editLinkedin} onChange={(e) => setEditLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" className="flex-1" maxLength={255} />
                      </div>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Achievements</p>
                    <div className="space-y-2">
                      {editAchievements.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm">
                          <Trophy className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span className="flex-1 truncate">{a}</span>
                          <button onClick={() => removeAchievement(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          value={newAchievement}
                          onChange={(e) => setNewAchievement(e.target.value)}
                          placeholder="Add an achievement..."
                          className="flex-1"
                          maxLength={200}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAchievement())}
                        />
                        <Button size="sm" variant="outline" onClick={addAchievement} disabled={!newAchievement.trim()}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={saveProfile} disabled={saving}>
                      <Save className="h-4 w-4 mr-1" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl sm:text-3xl font-bold truncate">
                      {profile.full_name || "Anonymous User"}
                    </h1>
                    {isOwnProfile && (
                      <button
                        onClick={startEditing}
                        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Edit profile"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {profile.email && (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{profile.email}</span>
                      </p>
                    )}
                    {profile.year && (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GraduationCap className="h-4 w-4 shrink-0" />
                        {profile.year}
                      </p>
                    )}
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 shrink-0" />
                      Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                  </div>

                  {/* Social Icons */}
                  {socialLinks.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      {socialLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`rounded-full border p-2 text-muted-foreground transition-colors ${link.color}`}
                          title={link.label}
                        >
                          <link.icon className="h-4 w-4" />
                        </a>
                      ))}
                    </div>
                  )}

                  {isOwnProfile && (
                    <span className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      Your Profile
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Achievements */}
        {profile.achievements && profile.achievements.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Achievements ({profile.achievements.length})
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {profile.achievements.map((achievement, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 shrink-0">
                    <Trophy className="h-4 w-4 text-accent" />
                  </div>
                  <p className="text-sm font-medium">{achievement}</p>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Clubs */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-accent" />
            Clubs ({clubs.length})
          </h2>
          {clubs.length === 0 ? (
            <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground shadow-sm">
              <Users className="mx-auto h-10 w-10 mb-2 text-muted-foreground/30" />
              <p className="text-sm">Not a member of any clubs yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {clubs.map((membership) => {
                const Icon = categoryIcons[membership.club_category] || Users;
                return (
                  <Link key={membership.id} to={`/clubs/${membership.club_id}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {membership.club_poster_url ? (
                        <img
                          src={membership.club_poster_url}
                          alt={membership.club_name}
                          className="h-12 w-12 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold truncate">{membership.club_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                            {membership.role}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{membership.club_category}</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Event History */}
        {isOwnProfile && events.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Recent Events
            </h2>
            <div className="space-y-2">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm">
                  <div>
                    <p className="font-display font-semibold text-sm">{event.event_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.event_category} {event.event_date ? `· ${event.event_date}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                    event.status === "approved" ? "bg-accent/10 text-accent-foreground" :
                    event.status === "rejected" ? "bg-destructive/10 text-destructive" :
                    "bg-muted text-muted-foreground"
                  }`}>{event.status}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
};

export default UserProfile;
