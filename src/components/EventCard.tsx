import { ArrowUpRight, Calendar, ImageIcon, MapPin, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { DbEvent } from "@/hooks/useEvents";

const categoryColors: Record<string, string> = {
  Sports: "bg-secondary text-secondary-foreground",
  Technical: "bg-primary text-primary-foreground",
  Cultural: "bg-campus-teal text-white",
  Workshops: "bg-accent text-accent-foreground",
};

const EventCard = ({ event }: { event: DbEvent }) => (
  <Link to={`/register?event=${event.id}`} className="block">
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className="group overflow-hidden rounded-[30px] border border-border/80 bg-card shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="relative h-56 overflow-hidden bg-primary">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        >
          <source src={event.trailer_url || "https://videos.pexels.com/video-files/856973/856973-hd_1920_1080_30fps.mp4"} type="video/mp4" />
        </video>

        {event.poster_url ? (
          <img
            src={event.poster_url}
            alt={`${event.name} poster`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-hero">
            <ImageIcon className="h-10 w-10 text-primary-foreground/35" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/55 to-transparent" />

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${categoryColors[event.category] || "bg-primary text-primary-foreground"}`}>
            <Tag className="h-3 w-3" />
            {event.category}
          </span>

          {event.is_live && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-[11px] font-bold text-destructive-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-foreground/60">
            Campus Experience
          </p>
          <h3 className="mt-2 font-display text-2xl font-black leading-tight text-primary-foreground">
            {event.name}
          </h3>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
          {event.description || "Explore the full event details, register in seconds, and stay updated from one place."}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-muted/70 px-4 py-3 text-sm">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Date</p>
            <p className="inline-flex items-center gap-2 font-medium text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              {event.date}
            </p>
          </div>

          <div className="rounded-2xl bg-muted/70 px-4 py-3 text-sm">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Venue</p>
            <p className="inline-flex items-center gap-2 font-medium text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              {event.venue}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border/80 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Next Step</p>
            <p className="text-sm font-semibold text-foreground">{event.is_live && event.stream_url ? "Watch or register now" : "Reserve your spot"}</p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
            Open
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </motion.article>
  </Link>
);

export default EventCard;
