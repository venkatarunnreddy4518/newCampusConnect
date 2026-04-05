import { useState } from "react";
import Layout from "@/components/Layout";
import EventCard from "@/components/EventCard";
import { useEvents } from "@/hooks/useEvents";
import { EventCategory } from "@/data/campus-data";

const categories: ("All" | EventCategory)[] = ["All", "Sports", "Technical", "Cultural", "Workshops"];

const Events = () => {
  const [active, setActive] = useState<"All" | EventCategory>("All");
  const { events, loading } = useEvents();
  const filtered = active === "All" ? events : events.filter((e) => e.category === active);

  return (
    <Layout>
      <div className="container py-10">
        <h1 className="font-display text-3xl font-bold">Campus Events</h1>
        <p className="mt-1 text-muted-foreground">Browse and register for all upcoming campus events.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="col-span-full text-center text-muted-foreground">Loading events...</p>
          ) : filtered.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground">No events found.</p>
          ) : (
            filtered.map((event) => (
              <div key={event.id}>
                <EventCard event={event} />
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Events;
