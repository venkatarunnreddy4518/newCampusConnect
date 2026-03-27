import { Calendar, MapPin, Tag, ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { DbEvent } from "@/hooks/useEvents";

const categoryColors: Record<string, string> = {
  Sports: "bg-campus-coral",
  Technical: "bg-primary",
  Cultural: "bg-campus-teal",
  Workshops: "bg-campus-gold",
};

const EventCard = ({ event }: { event: DbEvent }) => (
  <Link to={`/register?event=${event.id}`} className="block">
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-card transition-shadow hover:shadow-card-hover cursor-pointer"
    >
      {event.is_live && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground animate-pulse-live" />
          LIVE
        </div>
      )}

      <div className="relative h-44 w-full overflow-hidden bg-muted/30">
        <video
          autoPlay muted loop playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        >
          <source src={event.trailer_url || "https://videos.pexels.com/video-files/856973/856973-hd_1920_1080_30fps.mp4"} type="video/mp4" />
        </video>
        {event.poster_url && (
          <img
            src={event.poster_url}
            alt={`${event.name} poster`}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        )}
        {!event.poster_url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-primary-foreground ${categoryColors[event.category] || "bg-primary"}`}>
            <Tag className="h-3 w-3" />
            {event.category}
          </span>
        </div>
        <h3 className="font-display text-lg font-bold leading-tight">{event.name}</h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{event.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{event.date}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.venue}</span>
        </div>
        <div className="mt-auto flex gap-2 pt-4">
          <span className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Register
          </span>
          {event.is_live && event.stream_url && (
            <span
              onClick={(e) => { e.preventDefault(); window.location.href = `/streaming?event=${event.id}`; }}
              className="inline-flex items-center rounded-lg bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
            >
              Watch Live
            </span>
          )}
        </div>
      </div>
    </motion.div>
  </Link>
);

export default EventCard;
