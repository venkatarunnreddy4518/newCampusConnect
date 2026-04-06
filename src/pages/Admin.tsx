import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { useEvents } from "@/hooks/useEvents";
import {
  Plus, Bell, Users, Settings, Upload, Image, Trash2, Edit2, Save,
  X, Radio, Crown, Eye, Shield, UserCheck, KeyRound, Video,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/database/client";
import { useAuth } from "@/contexts/AuthContext";


const tabs = [
  { id: "events", label: "Events", icon: Plus },
  { id: "clubs", label: "Clubs", icon: Crown },
  { id: "posters", label: "Posters", icon: Image },
  { id: "participants", label: "Participants", icon: Users },
  { id: "users", label: "Users & Roles", icon: Shield },
  { id: "permissions", label: "Permissions", icon: KeyRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "site", label: "Site Settings", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

interface Club {
  id: string;
  name: string;
  description: string | null;
  category: string;
  max_members: number | null;
  poster_url: string | null;
  trailer_url: string | null;
  created_at: string;
}

interface Registration {
  id: string;
  user_id: string;
  event_name: string;
  event_category: string;
  event_date: string | null;
  event_venue: string | null;
  registered_at: string;
  status: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
}

const isImageFile = (url: string) => /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?|$)/i.test(url);

const SiteSettingsTab = () => {
  const [heroMediaUrl, setHeroMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const heroMediaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "hero_video_url").single()
      .then(({ data }) => { if (data?.value) setHeroMediaUrl(data.value); });
  }, []);

  const handleHeroMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("Max file size is 50MB"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || (file.type.startsWith("image/") ? "jpg" : "mp4");
    const path = `hero/hero-media-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("trailer-videos").upload(path, file);
    if (uploadErr) { toast.error("Upload failed: " + uploadErr.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("trailer-videos").getPublicUrl(path);
    const url = urlData.publicUrl;
    const { error: updateErr } = await supabase.from("site_settings").update({ value: url }).eq("key", "hero_video_url");
    if (updateErr) { toast.error("Failed to save: " + updateErr.message); }
    else { setHeroMediaUrl(url); toast.success("Hero media updated!"); }
    setUploading(false);
  };

  const handleRemoveMedia = async () => {
    const { error } = await supabase.from("site_settings").update({ value: "" }).eq("key", "hero_video_url");
    if (error) toast.error(error.message);
    else { setHeroMediaUrl(""); toast.success("Hero media removed"); }
  };

  const isImage = isImageFile(heroMediaUrl);

  return (
    <div className="max-w-lg space-y-6">
      <h2 className="font-display text-xl font-semibold">Hero Media</h2>
      <p className="text-sm text-muted-foreground">Upload a video or image to display on the right side of the landing page hero section.</p>
      <input ref={heroMediaRef} type="file" accept="video/*,image/*" className="hidden" onChange={handleHeroMediaUpload} />
      {heroMediaUrl ? (
        <div className="space-y-3">
          <div className="rounded-xl overflow-hidden border bg-black aspect-video max-h-56">
            {isImage ? (
              <img src={heroMediaUrl} alt="Hero media" className="h-full w-full object-cover" />
            ) : (
              <video autoPlay muted loop playsInline className="h-full w-full object-cover">
                <source src={heroMediaUrl} type="video/mp4" />
              </video>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => heroMediaRef.current?.click()} disabled={uploading} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
              {uploading ? "Uploading..." : "Replace"}
            </button>
            <button onClick={handleRemoveMedia} className="rounded-lg border border-destructive/30 px-4 py-2 text-xs font-semibold text-destructive">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => heroMediaRef.current?.click()} disabled={uploading} className="w-full rounded-xl border-2 border-dashed border-border py-12 text-center text-sm text-muted-foreground hover:border-primary/50 transition-colors">
          {uploading ? "Uploading..." : "Click to upload hero video or image (max 50MB)"}
        </button>
      )}
    </div>
  );
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState<TabId>("events");
  const { events, refetch } = useEvents();
  const { user } = useAuth();
  

  // ─── Events ─────────────────────────────────────────────
  const [newEvent, setNewEvent] = useState({ name: "", date: "", venue: "", description: "", category: "Sports", max_capacity: "" });
  const [addingEvent, setAddingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState({ name: "", date: "", venue: "", description: "", category: "Sports", is_live: false, stream_url: "", max_capacity: "" });

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date || !newEvent.venue) { toast.error("Fill required fields"); return; }
    setAddingEvent(true);
    const { error } = await supabase.from("events").insert({
      name: newEvent.name, date: newEvent.date, venue: newEvent.venue,
      description: newEvent.description, category: newEvent.category, is_live: false, created_by: user?.id,
      max_capacity: newEvent.max_capacity ? parseInt(newEvent.max_capacity) : null,
    });
    if (error) toast.error("Failed: " + error.message);
    else { setNewEvent({ name: "", date: "", venue: "", description: "", category: "Sports", max_capacity: "" }); refetch(); toast.success("Event added!"); }
    setAddingEvent(false);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error(error.message); else { refetch(); toast.success("Event deleted"); }
  };

  const startEditEvent = (ev: typeof events[0]) => {
    setEditingEventId(ev.id);
    setEditEvent({ name: ev.name, date: ev.date, venue: ev.venue, description: ev.description || "", category: ev.category, is_live: ev.is_live, stream_url: ev.stream_url || "", max_capacity: (ev as any).max_capacity?.toString() || "" });
  };

  const handleSaveEvent = async () => {
    if (!editingEventId) return;
    const { error } = await supabase.from("events").update({
      name: editEvent.name, date: editEvent.date, venue: editEvent.venue,
      description: editEvent.description, category: editEvent.category,
      is_live: editEvent.is_live, stream_url: editEvent.stream_url || null,
      max_capacity: editEvent.max_capacity ? parseInt(editEvent.max_capacity) : null,
    }).eq("id", editingEventId);
    if (error) toast.error(error.message); else { setEditingEventId(null); refetch(); toast.success("Event updated!"); }
  };

  const handleToggleLive = async (id: string, currentLive: boolean) => {
    const { error } = await supabase.from("events").update({ is_live: !currentLive }).eq("id", id);
    if (error) toast.error(error.message); else { refetch(); toast.success(currentLive ? "Event set offline" : "Event is now LIVE!"); }
  };

  // ─── Clubs ──────────────────────────────────────────────
  const [clubs, setClubs] = useState<Club[]>([]);
  const [newClub, setNewClub] = useState({ name: "", description: "", category: "Technical", max_members: "" });
  const [addingClub, setAddingClub] = useState(false);
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [editClub, setEditClub] = useState({ name: "", description: "", category: "Technical", max_members: "" });

  const fetchClubs = async () => {
    const { data } = await supabase.from("clubs").select("*").order("created_at", { ascending: false });
    if (data) setClubs(data);
  };

  useEffect(() => { fetchClubs(); }, []);

  const handleAddClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClub.name) { toast.error("Club name required"); return; }
    setAddingClub(true);
    const { error } = await supabase.from("clubs").insert({
      name: newClub.name, description: newClub.description, category: newClub.category,
      max_members: newClub.max_members ? Number(newClub.max_members) : null, created_by: user?.id,
    });
    if (error) toast.error(error.message);
    else { setNewClub({ name: "", description: "", category: "Technical", max_members: "" }); fetchClubs(); toast.success("Club added!"); }
    setAddingClub(false);
  };

  const handleDeleteClub = async (id: string) => {
    if (!confirm("Delete this club?")) return;
    const { error } = await supabase.from("clubs").delete().eq("id", id);
    if (error) toast.error(error.message); else { fetchClubs(); toast.success("Club deleted"); }
  };

  const startEditClub = (c: Club) => {
    setEditingClubId(c.id);
    setEditClub({ name: c.name, description: c.description || "", category: c.category, max_members: c.max_members ? String(c.max_members) : "" });
  };

  const handleSaveClub = async () => {
    if (!editingClubId) return;
    const { error } = await supabase.from("clubs").update({
      name: editClub.name, description: editClub.description, category: editClub.category,
      max_members: editClub.max_members ? Number(editClub.max_members) : null,
    }).eq("id", editingClubId);
    if (error) toast.error(error.message); else { setEditingClubId(null); fetchClubs(); toast.success("Club updated!"); }
  };

  // Club poster upload
  const clubFileRef = useRef<HTMLInputElement>(null);
  const [uploadingClubId, setUploadingClubId] = useState<string | null>(null);

  const handleClubPoster = async (clubId: string, file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Select an image"); return; }
    setUploadingClubId(clubId);
    const ext = file.name.split(".").pop();
    const path = `${clubId}/poster.${ext}`;
    const { error: upErr } = await supabase.storage.from("club-posters").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploadingClubId(null); return; }
    const { data: urlData } = supabase.storage.from("club-posters").getPublicUrl(path);
    const { error: updErr } = await supabase.from("clubs").update({ poster_url: urlData.publicUrl }).eq("id", clubId);
    if (updErr) toast.error(updErr.message); else { fetchClubs(); toast.success("Club poster uploaded!"); }
    setUploadingClubId(null);
  };

  // ─── Posters (Events) ──────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const handlePosterUpload = async (eventId: string, file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Select an image"); return; }
    setUploadingFor(eventId);
    const ext = file.name.split(".").pop();
    const path = `${eventId}/poster.${ext}`;
    const { error: upErr } = await supabase.storage.from("event-posters").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploadingFor(null); return; }
    const { data: urlData } = supabase.storage.from("event-posters").getPublicUrl(path);
    const { error: updErr } = await supabase.from("events").update({ poster_url: urlData.publicUrl }).eq("id", eventId);
    if (updErr) toast.error(updErr.message); else { refetch(); toast.success("Poster uploaded!"); }
    setUploadingFor(null);
  };

  // ─── Trailer Uploads ───────────────────────────────────
  const eventTrailerRef = useRef<HTMLInputElement>(null);
  const clubTrailerRef = useRef<HTMLInputElement>(null);
  const [uploadingEventTrailer, setUploadingEventTrailer] = useState<string | null>(null);
  const [uploadingClubTrailer, setUploadingClubTrailer] = useState<string | null>(null);

  const handleEventTrailer = async (eventId: string, file: File) => {
    if (!file.type.startsWith("video/")) { toast.error("Select a video file"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("Video must be under 20MB"); return; }
    setUploadingEventTrailer(eventId);
    const ext = file.name.split(".").pop();
    const path = `events/${eventId}/trailer.${ext}`;
    const { error: upErr } = await supabase.storage.from("trailer-videos").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploadingEventTrailer(null); return; }
    const { data: urlData } = supabase.storage.from("trailer-videos").getPublicUrl(path);
    const { error: updErr } = await supabase.from("events").update({ trailer_url: urlData.publicUrl }).eq("id", eventId);
    if (updErr) toast.error(updErr.message); else { refetch(); toast.success("Event trailer uploaded! 🎬"); }
    setUploadingEventTrailer(null);
  };

  const handleClubTrailer = async (clubId: string, file: File) => {
    if (!file.type.startsWith("video/")) { toast.error("Select a video file"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("Video must be under 20MB"); return; }
    setUploadingClubTrailer(clubId);
    const ext = file.name.split(".").pop();
    const path = `clubs/${clubId}/trailer.${ext}`;
    const { error: upErr } = await supabase.storage.from("trailer-videos").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploadingClubTrailer(null); return; }
    const { data: urlData } = supabase.storage.from("trailer-videos").getPublicUrl(path);
    const { error: updErr } = await supabase.from("clubs").update({ trailer_url: urlData.publicUrl }).eq("id", clubId);
    if (updErr) toast.error(updErr.message); else { fetchClubs(); toast.success("Club trailer uploaded! 🎬"); }
    setUploadingClubTrailer(null);
  };


  // ─── Participants ───────────────────────────────────────
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [memberships, setMemberships] = useState<{ id: string; club_id: string; user_id: string; role: string; joined_at: string; status: string }[]>([]);

  const fetchParticipants = async () => {
    setLoadingRegs(true);
    const [{ data: regs }, { data: mems }] = await Promise.all([
      supabase.from("registrations").select("*").order("registered_at", { ascending: false }),
      supabase.from("club_memberships").select("*").order("joined_at", { ascending: false }),
    ]);
    if (regs) setRegistrations(regs);
    if (mems) setMemberships(mems);
    setLoadingRegs(false);
  };

  useEffect(() => { if (activeTab === "participants") { fetchParticipants(); fetchUsers(); fetchClubs(); } }, [activeTab]);

  const handleUpdateRegStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("registrations").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { fetchParticipants(); toast.success(`Status → ${status}`); }
  };

  const handleApproveMembership = async (membershipId: string, userId: string, clubName: string) => {
    const { error } = await supabase.from("club_memberships").update({ status: "approved" }).eq("id", membershipId);
    if (error) { toast.error(error.message); return; }
    // Send notification to user
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Club Membership Approved! 🎉",
      message: `You have been accepted into ${clubName}. Welcome to the club!`,
      type: "success",
    });
    fetchParticipants();
    toast.success("Member approved & notified!");
  };

  const handleRejectMembership = async (membershipId: string, userId: string, clubName: string) => {
    const { error } = await supabase.from("club_memberships").update({ status: "rejected" }).eq("id", membershipId);
    if (error) { toast.error(error.message); return; }
    // Send notification to user
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Club Application Update",
      message: `Your application to join ${clubName} was not approved at this time.`,
      type: "alert",
    });
    fetchParticipants();
    toast.success("Member rejected & notified");
  };

  // ─── Users & Roles ─────────────────────────────────────
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);
    if (p) setProfiles(p);
    if (r) setUserRoles(r as UserRole[]);
    setLoadingUsers(false);
  };

  useEffect(() => { if (activeTab === "users") fetchUsers(); }, [activeTab]);

  const getUserRole = (userId: string) => userRoles.find((r) => r.user_id === userId)?.role || "user";

  const handleChangeRole = async (userId: string, newRole: "admin" | "moderator" | "user") => {
    const existing = userRoles.find((r) => r.user_id === userId);
    if (newRole === "user") {
      if (existing) {
        const { error } = await supabase.from("user_roles").delete().eq("id", existing.id);
        if (error) { toast.error(error.message); return; }
      }
    } else if (existing) {
      const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("id", existing.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
      if (error) { toast.error(error.message); return; }
    }
    fetchUsers();
    toast.success(`Role updated to ${newRole}`);
  };

  // ─── Permissions ─────────────────────────────────────
  const PERMISSION_TYPES = ["event_manager", "club_manager", "registration_manager", "content_moderator"] as const;
  const PERMISSION_LABELS: Record<string, string> = {
    event_manager: "Event Manager",
    club_manager: "Club Manager",
    registration_manager: "Registration Manager",
    content_moderator: "Content Moderator",
  };

  interface Permission {
    id: string;
    user_id: string;
    permission: string;
    scope: string;
    resource_id: string | null;
    granted_at: string;
  }

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [newPerm, setNewPerm] = useState({ user_id: "", permission: "event_manager", scope: "global", resource_id: "" });

  const fetchPermissions = async () => {
    setLoadingPerms(true);
    const { data } = await supabase.from("permissions").select("*").order("granted_at", { ascending: false });
    if (data) setPermissions(data as Permission[]);
    setLoadingPerms(false);
  };

  useEffect(() => { if (activeTab === "permissions") { fetchPermissions(); fetchUsers(); fetchClubs(); } }, [activeTab]);

  const handleGrantPermission = async () => {
    if (!newPerm.user_id || !newPerm.permission) { toast.error("Select a user and permission"); return; }
    const insertData: any = {
      user_id: newPerm.user_id,
      permission: newPerm.permission,
      scope: newPerm.scope,
      granted_by: user?.id,
    };
    if (newPerm.scope === "specific" && newPerm.resource_id) {
      insertData.resource_id = newPerm.resource_id;
    }
    const { error } = await supabase.from("permissions").insert(insertData);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Permission already granted!" : error.message);
    } else {
      toast.success("Permission granted! ✅");
      setNewPerm({ user_id: "", permission: "event_manager", scope: "global", resource_id: "" });
      fetchPermissions();
    }
  };

  const handleRevokePermission = async (id: string) => {
    const { error } = await supabase.from("permissions").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { fetchPermissions(); toast.success("Permission revoked"); }
  };

  const getProfileName = (userId: string) => {
    const p = profiles.find((pr) => pr.id === userId);
    return p?.full_name || p?.email || userId.slice(0, 8) + "…";
  };

  const getResourceName = (perm: Permission) => {
    if (perm.scope === "global") return "All";
    if (perm.permission === "event_manager" || perm.permission === "content_moderator") {
      const ev = events.find((e) => e.id === perm.resource_id);
      return ev?.name || perm.resource_id?.slice(0, 8) + "…";
    }
    if (perm.permission === "club_manager") {
      const cl = clubs.find((c) => c.id === perm.resource_id);
      return cl?.name || perm.resource_id?.slice(0, 8) + "…";
    }
    return perm.resource_id?.slice(0, 8) + "…";
  };

  // ─── Notifications ─────────────────────────────────────
  const [newNotif, setNewNotif] = useState("");
  const [sentNotifs, setSentNotifs] = useState<{ message: string; time: string }[]>([]);

  const handleSendNotification = async () => {
    if (!newNotif.trim()) { toast.error("Enter a message"); return; }

    const { data: allProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id");

    if (profilesError) {
      toast.error(profilesError.message);
      return;
    }

    const recipients = (allProfiles || []).map((profile: any) => ({
      user_id: profile.id,
      title: "Campus Update",
      message: newNotif.trim(),
      type: "info",
    }));

    if (recipients.length === 0) {
      toast.error("No users found to notify.");
      return;
    }

    const { error } = await supabase.from("notifications").insert(recipients);
    if (error) {
      toast.error(error.message);
      return;
    }

    setSentNotifs([{ message: newNotif.trim(), time: "Just now" }, ...sentNotifs]);
    setNewNotif("");
    toast.success("Notification sent!");
  };

  const inputClass = "w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";
  const btnPrimary = "rounded-lg bg-primary px-5 py-2.5 font-display text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60";
  const btnDanger = "rounded-lg bg-destructive px-3 py-2 text-xs font-medium text-destructive-foreground hover:bg-destructive/90";
  const btnSecondary = "rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/80";

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b pb-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {/* ════════ EVENTS ════════ */}
          {activeTab === "events" && (
            <div className="space-y-8">
              {/* Hidden trailer input for events */}
              <input ref={eventTrailerRef} type="file" accept="video/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && uploadingEventTrailer) handleEventTrailer(uploadingEventTrailer, file);
                e.target.value = "";
              }} />
              {/* Add form */}
              <form onSubmit={handleAddEvent} className="max-w-lg space-y-4">
                <h2 className="font-display text-xl font-semibold">Add New Event</h2>
                <input placeholder="Event Name *" value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} className={inputClass} />
                <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className={inputClass} />
                <input placeholder="Venue *" value={newEvent.venue} onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })} className={inputClass} />
                <textarea placeholder="Description" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} className={inputClass} rows={3} />
                <select value={newEvent.category} onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })} className={inputClass}>
                  {["Sports", "Technical", "Cultural", "Workshops"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" min="0" placeholder="Max Capacity (leave empty = unlimited)" value={newEvent.max_capacity} onChange={(e) => setNewEvent({ ...newEvent, max_capacity: e.target.value })} className={inputClass} />
                <button type="submit" disabled={addingEvent} className={btnPrimary}>{addingEvent ? "Adding..." : "Add Event"}</button>
              </form>

              {/* Event list with edit/delete/live toggle */}
              <div>
                <h2 className="font-display text-xl font-semibold mb-4">All Events ({events.length})</h2>
                <div className="space-y-3">
                  {events.map((ev) => (
                    <div key={ev.id} className="rounded-xl border bg-card p-4 shadow-sm">
                      {editingEventId === ev.id ? (
                        <div className="space-y-3">
                          <input value={editEvent.name} onChange={(e) => setEditEvent({ ...editEvent, name: e.target.value })} className={inputClass} />
                          <div className="grid grid-cols-2 gap-3">
                            <input type="date" value={editEvent.date} onChange={(e) => setEditEvent({ ...editEvent, date: e.target.value })} className={inputClass} />
                            <input value={editEvent.venue} onChange={(e) => setEditEvent({ ...editEvent, venue: e.target.value })} className={inputClass} placeholder="Venue" />
                          </div>
                          <textarea value={editEvent.description} onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })} className={inputClass} rows={2} />
                          <div className="grid grid-cols-2 gap-3">
                            <select value={editEvent.category} onChange={(e) => setEditEvent({ ...editEvent, category: e.target.value })} className={inputClass}>
                              {["Sports", "Technical", "Cultural", "Workshops"].map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input value={editEvent.stream_url} onChange={(e) => setEditEvent({ ...editEvent, stream_url: e.target.value })} className={inputClass} placeholder="Stream URL (optional)" />
                          </div>
                          <input type="number" min="0" value={editEvent.max_capacity} onChange={(e) => setEditEvent({ ...editEvent, max_capacity: e.target.value })} className={inputClass} placeholder="Max Capacity (leave empty = unlimited)" />
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={editEvent.is_live} onChange={(e) => setEditEvent({ ...editEvent, is_live: e.target.checked })} className="rounded" />
                            Mark as LIVE
                          </label>
                          <div className="flex gap-2">
                            <button onClick={handleSaveEvent} className={btnPrimary}><Save className="inline h-3.5 w-3.5 mr-1" />Save</button>
                            <button onClick={() => setEditingEventId(null)} className={btnSecondary}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-display font-semibold truncate">{ev.name}</h3>
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{ev.category}</span>
                              {ev.is_live && (
                                <span className="flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                                  <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground animate-pulse-live" /> LIVE
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{ev.date} · {ev.venue}</p>
                            {ev.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{ev.description}</p>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => handleToggleLive(ev.id, ev.is_live)} className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${ev.is_live ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent-foreground"}`}>
                              <Radio className="inline h-3.5 w-3.5 mr-1" />{ev.is_live ? "Stop Live" : "Go Live"}
                            </button>
                            <button onClick={() => { setUploadingEventTrailer(ev.id); eventTrailerRef.current?.click(); }}
                              disabled={uploadingEventTrailer === ev.id}
                              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${(ev as any).trailer_url ? "bg-accent/10 text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                              title={`${(ev as any).trailer_url ? "Change" : "Upload"} Trailer`}
                            >
                              <Video className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => startEditEvent(ev)} className={btnSecondary}><Edit2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDeleteEvent(ev.id)} className={btnDanger}><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════ CLUBS ════════ */}
          {activeTab === "clubs" && (
            <div className="space-y-8">
              {/* Hidden trailer input for clubs */}
              <input ref={clubTrailerRef} type="file" accept="video/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && uploadingClubTrailer) handleClubTrailer(uploadingClubTrailer, file);
                e.target.value = "";
              }} />
              <form onSubmit={handleAddClub} className="max-w-lg space-y-4">
                <h2 className="font-display text-xl font-semibold">Add New Club</h2>
                <input placeholder="Club Name *" value={newClub.name} onChange={(e) => setNewClub({ ...newClub, name: e.target.value })} className={inputClass} />
                <textarea placeholder="Description" value={newClub.description} onChange={(e) => setNewClub({ ...newClub, description: e.target.value })} className={inputClass} rows={3} />
                <div className="grid grid-cols-2 gap-3">
                  <select value={newClub.category} onChange={(e) => setNewClub({ ...newClub, category: e.target.value })} className={inputClass}>
                    {["Technical", "Creative", "Sports", "Academic", "Social", "General"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" placeholder="Max Members" value={newClub.max_members} onChange={(e) => setNewClub({ ...newClub, max_members: e.target.value })} className={inputClass} />
                </div>
                <button type="submit" disabled={addingClub} className={btnPrimary}>{addingClub ? "Adding..." : "Add Club"}</button>
              </form>

              <input ref={clubFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && uploadingClubId) handleClubPoster(uploadingClubId, file);
                e.target.value = "";
              }} />

              <div>
                <h2 className="font-display text-xl font-semibold mb-4">All Clubs ({clubs.length})</h2>
                <div className="space-y-3">
                  {clubs.map((c) => (
                    <div key={c.id} className="rounded-xl border bg-card p-4 shadow-sm">
                      {editingClubId === c.id ? (
                        <div className="space-y-3">
                          <input value={editClub.name} onChange={(e) => setEditClub({ ...editClub, name: e.target.value })} className={inputClass} />
                          <textarea value={editClub.description} onChange={(e) => setEditClub({ ...editClub, description: e.target.value })} className={inputClass} rows={2} />
                          <div className="grid grid-cols-2 gap-3">
                            <select value={editClub.category} onChange={(e) => setEditClub({ ...editClub, category: e.target.value })} className={inputClass}>
                              {["Technical", "Creative", "Sports", "Academic", "Social", "General"].map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                            <input type="number" value={editClub.max_members} onChange={(e) => setEditClub({ ...editClub, max_members: e.target.value })} className={inputClass} placeholder="Max Members" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleSaveClub} className={btnPrimary}><Save className="inline h-3.5 w-3.5 mr-1" />Save</button>
                            <button onClick={() => setEditingClubId(null)} className={btnSecondary}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {c.poster_url ? (
                              <img src={c.poster_url} alt={c.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center shrink-0"><Crown className="h-5 w-5 text-muted-foreground/40" /></div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-display font-semibold truncate">{c.name}</h3>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{c.category}</span>
                              </div>
                              {c.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>}
                              {c.max_members && <p className="text-xs text-muted-foreground">Max: {c.max_members} members</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => { setUploadingClubId(c.id); clubFileRef.current?.click(); }} className={btnSecondary}>
                              <Upload className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => { setUploadingClubTrailer(c.id); clubTrailerRef.current?.click(); }}
                              disabled={uploadingClubTrailer === c.id}
                              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${c.trailer_url ? "bg-accent/10 text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                              title={`${c.trailer_url ? "Change" : "Upload"} Trailer`}
                            >
                              <Video className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => startEditClub(c)} className={btnSecondary}><Edit2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDeleteClub(c.id)} className={btnDanger}><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════ POSTERS ════════ */}
          {activeTab === "posters" && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold">Upload Event Posters</h2>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && uploadingFor) handlePosterUpload(uploadingFor, file);
                e.target.value = "";
              }} />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <div key={event.id} className="rounded-xl border bg-card overflow-hidden shadow-sm">
                    {event.poster_url ? (
                      <div className="relative h-36 w-full">
                        <img src={event.poster_url} alt={event.name} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-xs font-medium text-white">Click to change</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-36 items-center justify-center bg-muted/50"><Upload className="h-8 w-8 text-muted-foreground/40" /></div>
                    )}
                    <div className="p-3">
                      <p className="font-display text-sm font-semibold truncate">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.category} · {event.date}</p>
                      <button onClick={() => { setUploadingFor(event.id); fileInputRef.current?.click(); }} disabled={uploadingFor === event.id}
                        className="mt-2 w-full rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-60">
                        {uploadingFor === event.id ? "Uploading..." : event.poster_url ? "Change Poster" : "Upload Poster"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* ════════ PARTICIPANTS ════════ */}
          {activeTab === "participants" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-semibold mb-4">
                  Event Registrations
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({registrations.filter((r) => r.status === "registered").length} pending · {registrations.filter((r) => r.status === "approved").length} approved)
                  </span>
                </h2>
                {loadingRegs ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : registrations.length === 0 ? (
                  <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground shadow-sm">
                    <Users className="mx-auto h-10 w-10 mb-2" />
                    <p className="text-sm">No registrations yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Pending registrations */}
                    {registrations.filter((r) => r.status === "registered").length > 0 && (
                      <div className="rounded-xl border-2 border-dashed border-amber-400/40 bg-amber-500/5 p-4">
                        <h3 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          Pending Registrations
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {registrations.filter((r) => r.status === "registered").map((r) => (
                            <div key={r.id} className="flex items-center justify-between gap-4 rounded-xl border bg-card p-5 shadow-sm">
                              <div className="min-w-0">
                                <p className="text-base font-bold truncate">{r.event_name}</p>
                                <p className="text-sm text-muted-foreground truncate">{r.event_category} · {r.event_date || "No date"}</p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => handleUpdateRegStatus(r.id, "approved")}
                                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleUpdateRegStatus(r.id, "rejected")}
                                  className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                  Decline
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Approved / rejected table */}
                    {registrations.filter((r) => r.status !== "registered").length > 0 && (
                      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="px-4 py-3 text-left font-medium">Event</th>
                              <th className="px-4 py-3 text-left font-medium">Category</th>
                              <th className="px-4 py-3 text-left font-medium">Date</th>
                              <th className="px-4 py-3 text-left font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {registrations.filter((r) => r.status !== "registered").map((r) => (
                              <tr key={r.id} className="border-b last:border-0">
                                <td className="px-4 py-3 font-medium">{r.event_name}</td>
                                <td className="px-4 py-3 text-muted-foreground">{r.event_category}</td>
                                <td className="px-4 py-3 text-muted-foreground">{r.event_date || "—"}</td>
                                <td className="px-4 py-3">
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    r.status === "approved" ? "bg-accent/10 text-accent-foreground" :
                                    "bg-destructive/10 text-destructive"
                                  }`}>{r.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h2 className="font-display text-xl font-semibold mb-4">
                  Club Memberships
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({memberships.filter((m) => m.status === "pending").length} pending · {memberships.filter((m) => m.status === "approved").length} approved)
                  </span>
                </h2>
                {memberships.length === 0 ? (
                  <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground shadow-sm">
                    <Crown className="mx-auto h-10 w-10 mb-2" />
                    <p className="text-sm">No club memberships yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Pending requests first */}
                    {memberships.filter((m) => m.status === "pending").length > 0 && (
                      <div className="rounded-xl border-2 border-dashed border-amber-400/40 bg-amber-500/5 p-4">
                        <h3 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          Pending Requests
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {memberships.filter((m) => m.status === "pending").map((m) => {
                            const clubName = clubs.find((c) => c.id === m.club_id)?.name || m.club_id.slice(0, 8) + "…";
                            const userName = getProfileName(m.user_id);
                            return (
                              <div key={m.id} className="flex items-center justify-between gap-4 rounded-xl border bg-card p-5 shadow-sm">
                                <div className="min-w-0">
                                  <p className="text-base font-bold truncate">{userName}</p>
                                  <p className="text-sm text-muted-foreground truncate">→ {clubName}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{new Date(m.joined_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    onClick={() => handleApproveMembership(m.id, m.user_id, clubName)}
                                    className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRejectMembership(m.id, m.user_id, clubName)}
                                    className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                                  >
                                    <X className="h-4 w-4" />
                                    Decline
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Approved / other members table */}
                    {memberships.filter((m) => m.status !== "pending").length > 0 && (
                      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="px-4 py-3 text-left font-medium">User</th>
                              <th className="px-4 py-3 text-left font-medium">Club</th>
                              <th className="px-4 py-3 text-left font-medium">Role</th>
                              <th className="px-4 py-3 text-left font-medium">Status</th>
                              <th className="px-4 py-3 text-left font-medium">Joined</th>
                            </tr>
                          </thead>
                          <tbody>
                            {memberships.filter((m) => m.status !== "pending").map((m) => {
                              const clubName = clubs.find((c) => c.id === m.club_id)?.name || m.club_id.slice(0, 8) + "…";
                              const userName = getProfileName(m.user_id);
                              return (
                                <tr key={m.id} className="border-b last:border-0">
                                  <td className="px-4 py-3 font-medium">{userName}</td>
                                  <td className="px-4 py-3">{clubName}</td>
                                  <td className="px-4 py-3 capitalize">{m.role}</td>
                                  <td className="px-4 py-3">
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                      m.status === "approved" ? "bg-accent/10 text-accent-foreground" :
                                      "bg-destructive/10 text-destructive"
                                    }`}>{m.status}</span>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">{new Date(m.joined_at).toLocaleDateString()}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ USERS & ROLES ════════ */}
          {activeTab === "users" && (
            <div>
              <h2 className="font-display text-xl font-semibold mb-4">Manage Users ({profiles.length})</h2>
              {loadingUsers ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Name</th>
                        <th className="px-4 py-3 text-left font-medium">Email</th>
                        <th className="px-4 py-3 text-left font-medium">Joined</th>
                        <th className="px-4 py-3 text-left font-medium">Role</th>
                        <th className="px-4 py-3 text-left font-medium">Change Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((p) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">{p.full_name || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.email || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              getUserRole(p.id) === "admin" ? "bg-destructive/10 text-destructive" :
                              getUserRole(p.id) === "moderator" ? "bg-accent/10 text-accent-foreground" :
                              "bg-muted text-muted-foreground"
                            }`}>{getUserRole(p.id)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={getUserRole(p.id)}
                              onChange={(e) => handleChangeRole(p.id, e.target.value as "admin" | "moderator" | "user")}
                              disabled={p.id === user?.id}
                              className="rounded-lg border border-border bg-card px-2 py-1 text-xs disabled:opacity-40"
                            >
                              <option value="user">User</option>
                              <option value="moderator">Moderator</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ════════ PERMISSIONS ════════ */}
          {activeTab === "permissions" && (
            <div className="space-y-8">
              {/* Grant new permission */}
              <div className="max-w-lg space-y-4">
                <h2 className="font-display text-xl font-semibold">Grant Sub-Admin Permission</h2>
                <p className="text-sm text-muted-foreground">Assign granular permissions to users — globally or for specific events/clubs.</p>

                <select value={newPerm.user_id} onChange={(e) => setNewPerm({ ...newPerm, user_id: e.target.value })} className={inputClass}>
                  <option value="">Select User...</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name || p.email || p.id.slice(0, 8)}</option>
                  ))}
                </select>

                <select value={newPerm.permission} onChange={(e) => setNewPerm({ ...newPerm, permission: e.target.value, resource_id: "" })} className={inputClass}>
                  {PERMISSION_TYPES.map((pt) => (
                    <option key={pt} value={pt}>{PERMISSION_LABELS[pt]}</option>
                  ))}
                </select>

                <div className="flex gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="scope" checked={newPerm.scope === "global"} onChange={() => setNewPerm({ ...newPerm, scope: "global", resource_id: "" })} />
                    Global (all items)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="scope" checked={newPerm.scope === "specific"} onChange={() => setNewPerm({ ...newPerm, scope: "specific" })} />
                    Specific item
                  </label>
                </div>

                {newPerm.scope === "specific" && (
                  <select value={newPerm.resource_id} onChange={(e) => setNewPerm({ ...newPerm, resource_id: e.target.value })} className={inputClass}>
                    <option value="">Select {newPerm.permission.includes("club") ? "Club" : "Event"}...</option>
                    {newPerm.permission.includes("club")
                      ? clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                      : events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)
                    }
                  </select>
                )}

                <button onClick={handleGrantPermission} className={btnPrimary}>
                  <KeyRound className="inline h-3.5 w-3.5 mr-1" />Grant Permission
                </button>
              </div>

              {/* Active permissions list */}
              <div>
                <h2 className="font-display text-xl font-semibold mb-4">Active Permissions ({permissions.length})</h2>
                {loadingPerms ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : permissions.length === 0 ? (
                  <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground shadow-sm">
                    <KeyRound className="mx-auto h-10 w-10 mb-2" />
                    <p className="text-sm">No permissions assigned yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left font-medium">User</th>
                          <th className="px-4 py-3 text-left font-medium">Permission</th>
                          <th className="px-4 py-3 text-left font-medium">Scope</th>
                          <th className="px-4 py-3 text-left font-medium">Resource</th>
                          <th className="px-4 py-3 text-left font-medium">Granted</th>
                          <th className="px-4 py-3 text-left font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissions.map((perm) => (
                          <tr key={perm.id} className="border-b last:border-0">
                            <td className="px-4 py-3 font-medium">{getProfileName(perm.user_id)}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                {PERMISSION_LABELS[perm.permission] || perm.permission}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                perm.scope === "global" ? "bg-accent/10 text-accent-foreground" : "bg-muted text-muted-foreground"
                              }`}>{perm.scope}</span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{getResourceName(perm)}</td>
                            <td className="px-4 py-3 text-muted-foreground">{new Date(perm.granted_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <button onClick={() => handleRevokePermission(perm.id)} className={btnDanger}>
                                <X className="inline h-3 w-3 mr-0.5" />Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════ NOTIFICATIONS ════════ */}
          {activeTab === "notifications" && (
            <div className="max-w-lg space-y-4">
              <h2 className="font-display text-xl font-semibold">Send Notification</h2>
              <textarea placeholder="Type your notification message..." value={newNotif} onChange={(e) => setNewNotif(e.target.value)} className={inputClass} rows={3} />
              <button onClick={handleSendNotification} className={btnPrimary}>Send to All Students</button>
              {sentNotifs.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold mb-3">Recent Notifications</h3>
                  <div className="space-y-2">
                    {sentNotifs.slice(0, 5).map((n, i) => (
                      <div key={i} className="rounded-lg border bg-muted/50 p-3 text-sm">
                        <p>{n.message}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════ SITE SETTINGS ════════ */}
          {activeTab === "site" && (
            <SiteSettingsTab />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;

