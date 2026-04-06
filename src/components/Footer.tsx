import { Link } from "react-router-dom";
import { Bell, Calendar, Mail, MapPin, Phone, Trophy } from "lucide-react";

const footerLinks = [
  { to: "/events", label: "Explore events", icon: Calendar },
  { to: "/clubs", label: "Join clubs", icon: Trophy },
  { to: "/notifications", label: "Check alerts", icon: Bell },
];

const Footer = () => (
  <footer className="border-t border-border/70 bg-primary text-primary-foreground">
    <div className="container py-14">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-primary-foreground/55">
            Campus Experience Platform
          </p>
          <h2 className="mt-3 font-display text-3xl font-black leading-tight sm:text-4xl">
            One place for events, clubs, alerts, and live campus energy.
          </h2>
          <p className="mt-4 text-sm leading-7 text-primary-foreground/70">
            CampusConnect helps students discover what is happening, apply faster, and stay updated without juggling multiple systems.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary-foreground/55">Navigation</p>
          <div className="mt-4 space-y-3">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 px-4 py-3 text-sm font-medium text-primary-foreground/85 transition-colors hover:bg-primary-foreground/10"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-primary-foreground/10 bg-primary-foreground/5 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary-foreground/55">Contact</p>
          <div className="mt-4 space-y-4 text-sm text-primary-foreground/80">
            <p className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" />
              admin@campusconnect.edu
            </p>
            <p className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" />
              +91 98765 43210
            </p>
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              University Campus, Main Block
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-2 border-t border-primary-foreground/10 pt-6 text-xs text-primary-foreground/55 sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright 2026 CampusConnect. All rights reserved.</p>
        <p>Built for student communities, college teams, and campus organizers.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
