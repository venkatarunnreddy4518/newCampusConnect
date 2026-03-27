export type EventCategory = "Sports" | "Technical" | "Cultural" | "Workshops";

export interface CampusEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  description: string;
  category: EventCategory;
  isLive: boolean;
  streamUrl?: string;
}

export interface Match {
  id: string;
  sport: string;
  teamA: string;
  teamB: string;
  scoreA: string;
  scoreB: string;
  status: string;
  detail: string;
}

export interface Notification {
  id: string;
  message: string;
  time: string;
  type: "reminder" | "update" | "alert";
}

export interface Registration {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  phone: string;
  eventId: string;
}

export const initialEvents: CampusEvent[] = [
  { id: "1", name: "Cricket Tournament Finals", date: "2026-03-12", venue: "Main Ground", description: "The grand finale of inter-department cricket. CSE vs ECE battle it out for the championship title.", category: "Sports", isLive: true, streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: "2", name: "Hackathon 2026", date: "2026-03-15", venue: "CS Lab Block", description: "24-hour coding marathon. Build innovative solutions to real-world problems.", category: "Technical", isLive: false },
  { id: "3", name: "Annual Cultural Fest", date: "2026-03-20", venue: "Open Air Theatre", description: "Music, dance, drama and art — the biggest cultural celebration of the year.", category: "Cultural", isLive: false },
  { id: "4", name: "AI/ML Workshop", date: "2026-03-10", venue: "Seminar Hall A", description: "Hands-on workshop on building machine learning models with Python and TensorFlow.", category: "Workshops", isLive: true, streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: "5", name: "Basketball League", date: "2026-03-18", venue: "Indoor Stadium", description: "Inter-college basketball league quarter-finals.", category: "Sports", isLive: false },
  { id: "6", name: "Web Dev Bootcamp", date: "2026-03-22", venue: "IT Block Room 204", description: "Learn React, TypeScript and modern web development practices.", category: "Workshops", isLive: false },
];

export const initialMatches: Match[] = [
  { id: "1", sport: "Cricket", teamA: "CSE", teamB: "ECE", scoreA: "145/6", scoreB: "98/4", status: "Live", detail: "Overs: 18/20" },
  { id: "2", sport: "Football", teamA: "MECH", teamB: "CIVIL", scoreA: "2", scoreB: "1", status: "Live", detail: "65th min" },
  { id: "3", sport: "Basketball", teamA: "IT", teamB: "EEE", scoreA: "54", scoreB: "48", status: "Half Time", detail: "Q2 ended" },
];

export const initialNotifications: Notification[] = [
  { id: "1", message: "Reminder: Your registered event 'Cricket Tournament' starts at 4:00 PM today.", time: "2 min ago", type: "reminder" },
  { id: "2", message: "Score Update: CSE leads ECE by 47 runs in Cricket Finals!", time: "5 min ago", type: "update" },
  { id: "3", message: "New Event: AI/ML Workshop registrations are now open.", time: "1 hour ago", type: "alert" },
  { id: "4", message: "Cultural Fest schedule has been updated. Check the Events page.", time: "3 hours ago", type: "update" },
];
