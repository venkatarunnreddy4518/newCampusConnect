import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => (
  <footer className="border-t bg-card">
    <div className="container py-10">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="font-display text-lg font-bold">CampusConnect</h3>
          <p className="mt-2 text-sm text-muted-foreground">Your centralized platform for campus events, live scores, and real-time updates.</p>
        </div>
        <div>
          <h4 className="font-display font-semibold">Quick Links</h4>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li><a href="/events" className="hover:text-foreground transition-colors">Events</a></li>
            <li><a href="/live-scores" className="hover:text-foreground transition-colors">Live Scores</a></li>
            <li><a href="/register" className="hover:text-foreground transition-colors">Register</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-semibold">Contact</h4>
          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> admin@campusconnect.edu</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +91 98765 43210</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> University Campus, Main Block</li>
          </ul>
        </div>
      </div>
      <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
        © 2026 CampusConnect. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
