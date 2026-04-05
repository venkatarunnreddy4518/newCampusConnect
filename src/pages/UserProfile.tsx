import { useState, useEffect, useRef, ElementType, ChangeEvent, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  User, Mail, Calendar, GraduationCap, Crown, Trophy, Users,
  Code, Camera, Mic2, Lightbulb, Pencil, Save, X, Plus, Trash2,
  Github, Linkedin, ExternalLink, Loader2
} from "lucide-react";

// --- Types ---
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
  role: string;
  club: {
    id: string;
    name: string;
    category: string;
    poster_url: string | null;
  };
}

interface EventRegistration {
  id: string;
  event_name: string;
  event_category: string;
  event_date: string | null;
  status: string;
}

const categoryIcons: Record<string, ElementType> = {
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

  // Profile State
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [clubs, setClubs] = useState<ClubMembership[]>([]);
  const [events, setEvents] = useState<EventRegistration[]>([]);
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Edit Form State
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    year: "",
    github_url: "",
    linkedin_url: "",
    gmail_url: "",
    achievements: [] as string[],
  });
  const [newAchievement, setNewAchievement] = useState("");
  
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    try {
      // 1. Fetch Profile and Memberships (Parallel)
      const [profileRes, membershipsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("club_memberships")
          .select(`id, role, club:clubs(id, name, category, poster_url)`)
          .eq("user_id", id)
          .eq("status", "approved")
      ]);

      // 2. Handle Profile / Self-Healing
      if (profileRes.data) {
        setProfile(profileRes.data as ProfileData);
      } else if (user && user.id === id) {
        const newProfile = {
          id: user.id,
          email: user.email || null,
          full_name: user.user_metadata?.full_name || "New User",
          created_at: new Date().toISOString(),
        };
        await supabase.from("profiles").upsert([newProfile]);
        setProfile(newProfile as ProfileData);
      }

      // 3. Set Memberships
      if (membershipsRes.data) {
        setClubs(membershipsRes.data as unknown as ClubMembership[]);
      }

      // 4. Fetch Registrations (Only for own profile)
      if (user?.id === id) {
        const { data: regs } = await supabase
          .from("registrations")
          .select("id, event_name, event_category, event_date, status")
          .eq("user_id", id)
          .order("registered_at", { ascending: false })
          .limit(5);
        if (regs) setEvents(regs as EventRegistration[]);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast({ title: "Error", description: "Failed to load profile data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers ---
  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast({ title: "File too large", description: "Max 2MB allowed.", variant: "destructive" });
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast({ title: "Success", description: "Avatar updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const startEditing = () => {
    if (!profile) return;
    setFormData({
      full_name: profile.full_name || "",
      year: profile.year || "",
      github_url: profile.github_url || "",
      linkedin_url: profile.linkedin_url || "",
      gmail_url: profile.gmail_url || "",
      achievements: profile.achievements || [],
    });
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name.trim(),
          year: formData.year.trim() || null,
          github_url: formData.github_url.trim() || null,
          linkedin_url: formData.linkedin_url.trim() || null,
          gmail_url: formData.gmail_url.trim() || null,
          achievements: formData.achievements.length > 0 ? formData.achievements : null,
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...formData } : null);
      setEditing(false);
      toast({ title: "Profile updated successfully" });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <User className="mx-auto h-16 w-16 text-muted-foreground/20" />
          <h2 className="mt-4 text-2xl font-bold">User Not Found</h2>
          <Button variant="link" asChild><Link to="/">Return Home</Link></Button>
        </div>
      </Layout>
    );
  }

  const isOwnProfile = user?.id === id;
  const initials = (profile.full_name || profile.email || "U").charAt(0).toUpperCase();

  return (
    <Layout>
      <div className="container max-w-3xl py-10 px-4">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border bg-card shadow-sm transition-all hover:shadow-md"
        >
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar Section */}
              <div className="relative group shrink-0">
                <div className="h-24 w-24 sm:h-32 sm:w-32 overflow-hidden rounded-2xl border-4 border-background shadow-xl bg-muted">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-primary/40 bg-primary/5">
                      {initials}
                    </div>
                  )}
                </div>
                {isOwnProfile && (
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-2 -right-2 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                  >
                    {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </button>
                )}
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              {/* Info Section */}
              <div className="flex-1 text-center sm:text-left min-w-0 w-full">
                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Full Name</label>
                        <Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="Full Name" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Year</label>
                        <Input value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="Batch / Year" />
                      </div>
                    </div>
                    
                    <div className="space-y-2 border-t pt-4">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Social Links</p>
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <Input value={formData.gmail_url} onChange={e => setFormData({...formData, gmail_url: e.target.value})} placeholder="Email address" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Github className="h-4 w-4 text-muted-foreground" />
                          <Input value={formData.github_url} onChange={e => setFormData({...formData, github_url: e.target.value})} placeholder="GitHub URL" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                      <Button size="sm" onClick={saveProfile} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
                        {profile.full_name || "Anonymous User"}
                      </h1>
                      {isOwnProfile && (
                        <Button variant="outline" size="sm" onClick={startEditing} className="rounded-full">
                          <Pencil className="h-3 w-3 mr-2" /> Edit Profile
                        </Button>
                      )}
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" /> <span className="truncate">{profile.email}</span>
                      </div>
                      {profile.year && (
                        <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
                          <GraduationCap className="h-4 w-4" /> {profile.year}
                        </div>
                      )}
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" /> Joined {new Date(profile.created_at).getFullYear()}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-3">
                      {[
                        { url: profile.gmail_url, icon: Mail, color: "hover:bg-red-50 hover:text-red-600" },
                        { url: profile.github_url, icon: Github, color: "hover:bg-gray-100 hover:text-black" },
                        { url: profile.linkedin_url, icon: Linkedin, color: "hover:bg-blue-50 hover:text-blue-600" }
                      ].filter(s => s.url).map((social, i) => (
                        <a key={i} href={social.url!} target="_blank" rel="noreferrer" className={`p-2 rounded-xl border transition-all ${social.color}`}>
                          <social.icon className="h-5 w-5" />
                        </a>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="mt-8 grid gap-8">
          {/* Achievements */}
          {(isOwnProfile || (profile.achievements?.length ?? 0) > 0) && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" /> Achievements
                </h2>
              </div>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <AnimatePresence>
                  {profile.achievements?.map((ach, i) => (
                    <motion.div
                      key={i}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group flex items-center justify-between p-4 rounded-2xl border bg-card shadow-sm"
                    >
                      <span className="text-sm font-medium">{ach}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {profile.achievements?.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No achievements listed yet.</p>
                )}
              </div>
            </section>
          )}

          {/* Clubs Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" /> Club Memberships
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {clubs.map((m) => {
                const Icon = categoryIcons[m.club.category] || Users;
                return (
                  <Link key={m.id} to={`/clubs/${m.club.id}`}>
                    <div className="flex items-center gap-4 p-4 rounded-2xl border bg-card hover:border-primary/50 transition-all group">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted">
                        {m.club.poster_url ? (
                          <img src={m.club.poster_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center"><Icon className="h-6 w-6 text-muted-foreground" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm group-hover:text-primary transition-colors">{m.club.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase text-primary">{m.role}</span>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="text-[10px] text-muted-foreground">{m.club.category}</span>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                );
              })}
              {clubs.length === 0 && (
                <div className="col-span-full p-8 text-center rounded-2xl border border-dashed text-muted-foreground">
                  Not a member of any clubs yet.
                </div>
              )}
            </div>
          </section>

          {/* Activity Section (Own profile only) */}
          {isOwnProfile && events.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="rounded-2xl border divide-y overflow-hidden">
                {events.map((ev) => (
                  <div key={ev.id} className="p-4 flex items-center justify-between bg-card">
                    <div>
                      <p className="text-sm font-bold">{ev.event_name}</p>
                      <p className="text-[10px] text-muted-foreground">{ev.event_category} • {ev.event_date || 'Upcoming'}</p>
                    </div>
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                      ev.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
                    }`}>
                      {ev.status}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
