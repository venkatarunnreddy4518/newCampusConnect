import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { initialEvents } from "@/data/campus-data";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { CheckCircle, History, Calendar, MapPin, Clock, LogIn, Play, Video, Users, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  rollNumber: z.string().trim().min(1, "Roll number is required").max(20),
  department: z.string().trim().min(1, "Department is required").max(50),
  phone: z.string().trim().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  eventId: z.string().min(1, "Please select an event"),
});

interface Registration {
  id: string;
  event_name: string;
  event_category: string;
  event_date: string | null;
  event_venue: string | null;
  registered_at: string;
  status: string;
}

interface DbEventDetail {
  id: string;
  name: string;
  date: string;
  venue: string;
  description: string | null;
  category: string;
  poster_url: string | null;
  trailer_url: string | null;
  is_live: boolean;
  max_capacity: number | null;
}

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("event") || "";
  const [form, setForm] = useState({ name: "", rollNumber: "", department: "", phone: "", eventId: preselected });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<DbEventDetail | null>(null);
  const [dbEvents, setDbEvents] = useState<DbEventDetail[]>([]);
  const [registrationCount, setRegistrationCount] = useState<number>(0);

  const fetchDbEvents = async () => {
    const { data } = await supabase.from("events").select("id, name, date, venue, description, category, poster_url, trailer_url, is_live, max_capacity").order("date");
    if (data) setDbEvents(data as DbEventDetail[]);
  };

  useEffect(() => { fetchDbEvents(); }, []);

  useEffect(() => {
    if (form.eventId && dbEvents.length > 0) {
      const ev = dbEvents.find((e) => e.id === form.eventId);
      setSelectedEvent(ev || null);
      // Fetch registration count for this event
      if (ev) {
        supabase.from("registrations").select("id", { count: "exact", head: true }).eq("event_name", ev.name)
          .then(({ count }) => setRegistrationCount(count || 0));
      }
    } else {
      setSelectedEvent(null);
      setRegistrationCount(0);
    }
  }, [form.eventId, dbEvents]);

  const fetchRegistrations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("registrations")
      .select("*")
      .order("registered_at", { ascending: false });
    if (data) setRegistrations(data as Registration[]);
  };

  useEffect(() => {
    fetchRegistrations();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => { fieldErrors[issue.path[0] as string] = issue.message; });
      setErrors(fieldErrors);
      return;
    }

    if (!user) {
      toast.error("Please login to register for events");
      return;
    }

    const matchedEvent = dbEvents.find(ev => ev.id === form.eventId) || initialEvents.find(ev => ev.id === form.eventId);
    if (!matchedEvent) return;

    setSubmitting(true);
    const { error } = await supabase.from("registrations").insert({
      user_id: user.id,
      event_name: matchedEvent.name,
      event_category: matchedEvent.category,
      event_date: matchedEvent.date,
      event_venue: matchedEvent.venue,
    });

    if (error) {
      toast.error("Registration failed: " + error.message);
      setSubmitting(false);
      return;
    }

    setErrors({});
    setSuccess(true);
    setSubmitting(false);
    fetchRegistrations();
    toast.success("Registration successful!");
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "attended": return "bg-secondary/15 text-secondary";
      case "cancelled": return "bg-destructive/15 text-destructive";
      default: return "bg-primary/15 text-primary";
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container flex flex-col items-center justify-center py-20 text-center">
          <LogIn className="h-16 w-16 text-primary" />
          <h2 className="mt-4 font-display text-2xl font-bold">Login Required</h2>
          <p className="mt-2 text-muted-foreground">Please sign in to register for events and view your participation history.</p>
          <Link to="/login" className="mt-6 inline-block">
            <InteractiveHoverButton text="Go to Login" className="text-sm font-semibold" />
          </Link>
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout>
        <div className="container flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle className="h-16 w-16 text-secondary" />
          <h2 className="mt-4 font-display text-2xl font-bold">Registration Successful!</h2>
          <p className="mt-2 text-muted-foreground">You have been registered for the event. Check notifications for updates.</p>
          <div className="mt-6 flex gap-3">
            <InteractiveHoverButton text="Register for Another" className="text-sm font-semibold" onClick={() => { setSuccess(false); setForm({ name: "", rollNumber: "", department: "", phone: "", eventId: "" }); }} />
            <InteractiveHoverButton text="View History" className="text-sm font-semibold" onClick={() => { setSuccess(false); setShowHistory(true); }} />
          </div>
        </div>
      </Layout>
    );
  }

  const inputClass = (field: string) =>
    `w-full rounded-lg border px-4 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors[field] ? "border-destructive" : "border-border"}`;

  return (
    <Layout>
      <div className="container max-w-2xl py-10">
        {/* Toggle between form and history */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">
              {showHistory ? "Participation History" : "Event Registration"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {showHistory ? "Your past and upcoming event registrations" : "Fill in your details to register for a campus event."}
            </p>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <History className="h-4 w-4" />
            {showHistory ? "Register" : "History"}
          </button>
        </div>

        {showHistory ? (
          <div className="space-y-3">
            {registrations.length === 0 ? (
              <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
                <History className="mx-auto h-10 w-10 mb-2" />
                <p className="text-sm">No registrations yet. Register for an event to see your history here.</p>
              </div>
            ) : (
              registrations.map((reg) => (
                <div key={reg.id} className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-semibold">{reg.event_name}</h3>
                      <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {reg.event_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {reg.event_date}
                          </span>
                        )}
                        {reg.event_venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {reg.event_venue}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(reg.registered_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{reg.event_category}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(reg.status)}`}>
                        {reg.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Event Detail & Trailer */}
            {selectedEvent?.trailer_url && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Video className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-sm font-semibold">Event Trailer</h3>
                </div>
                <div className="rounded-xl overflow-hidden aspect-video max-h-64 sm:max-h-72 bg-background">
                  <video
                    autoPlay
                    muted
                    loop
                    controls
                    playsInline
                    preload="auto"
                    className="h-full w-full object-cover rounded-xl"
                    poster={selectedEvent.poster_url || undefined}
                  >
                    <source src={selectedEvent.trailer_url} type="video/mp4" />
                  </video>
                </div>
              </div>
            )}

            {/* Vacancy Info */}
            {selectedEvent && selectedEvent.max_capacity !== null && (
              <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
                selectedEvent.max_capacity - registrationCount > 0
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
              }`}>
                <Users className="h-4 w-4" />
                {selectedEvent.max_capacity - registrationCount > 0
                  ? `${selectedEvent.max_capacity - registrationCount} of ${selectedEvent.max_capacity} spots remaining`
                  : "This event is full — no spots available"}
              </div>
            )}

            {/* Already registered check */}
            {selectedEvent && registrations.some((r) => r.event_name === selectedEvent.name) ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-primary" />
                <h3 className="mt-3 font-display text-lg font-bold">Already Registered!</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  You've already registered for <span className="font-semibold">{selectedEvent.name}</span>. 
                  Check your history for status updates.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <button onClick={() => setShowHistory(true)} className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground">
                    View History
                  </button>
                  <button onClick={() => setForm({ ...form, eventId: "" })} className="rounded-lg border border-border px-6 py-2 text-sm font-semibold">
                    Pick Another Event
                  </button>
                </div>
              </div>
            ) : (!selectedEvent || selectedEvent.max_capacity === null || selectedEvent.max_capacity - registrationCount > 0) ? (
              <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
              {([
                { key: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
                { key: "rollNumber", label: "Roll Number", type: "text", placeholder: "21CS101" },
                { key: "department", label: "Department", type: "text", placeholder: "Computer Science" },
                { key: "phone", label: "Phone Number", type: "tel", placeholder: "9876543210" },
              ] as const).map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-sm font-medium">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className={inputClass(field.key)}
                  />
                  {errors[field.key] && <p className="mt-1 text-xs text-destructive">{errors[field.key]}</p>}
                </div>
              ))}

              <div>
                <label className="mb-1.5 block text-sm font-medium">Select Event</label>
                <select
                  value={form.eventId}
                  onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                  className={inputClass("eventId")}
                >
                  <option value="">— Choose an event —</option>
                  {dbEvents.length > 0
                    ? dbEvents.map((event) => (
                        <option key={event.id} value={event.id}>{event.name} ({event.date})</option>
                      ))
                    : initialEvents.map((event) => (
                        <option key={event.id} value={event.id}>{event.name} ({event.date})</option>
                      ))
                  }
                </select>
                {errors.eventId && <p className="mt-1 text-xs text-destructive">{errors.eventId}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-primary py-3 font-display font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? "Registering..." : "Register Now"}
              </button>
            </form>
            ) : (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                <h3 className="mt-3 font-display text-lg font-bold text-destructive">Registrations Closed</h3>
                <p className="mt-1 text-sm text-muted-foreground">This event has reached its maximum capacity. Check back later or explore other events.</p>
                <Link to="/events" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground">
                  Browse Events
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Register;
