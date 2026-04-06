import { useState } from "react";
import { ArrowRight, Calendar, Radio, Sparkles, Ticket } from "lucide-react";
import Layout from "@/components/Layout";
import EventCard from "@/components/EventCard";
import SectionAmbientArt from "@/components/SectionAmbientArt";
import { useEvents } from "@/hooks/useEvents";
import { EventCategory } from "@/data/campus-data";

const categories: ("All" | EventCategory)[] = ["All", "Sports", "Technical", "Cultural", "Workshops"];

const Events = () => {
  const [active, setActive] = useState<"All" | EventCategory>("All");
  const { events, loading } = useEvents();
  const filteredEvents = active === "All" ? events : events.filter((event) => event.category === active);
  const liveEvents = events.filter((event) => event.is_live).length;

  return (
    <Layout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-grid-premium opacity-[0.3]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--foreground)_/_0.06),transparent_34%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,hsl(var(--foreground)_/_0.04),transparent_40%)]" />
        <SectionAmbientArt variant="events" />

        <div className="relative container py-16">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-4 py-2 text-muted-foreground shadow-card">
                <Sparkles className="h-4 w-4 text-foreground" />
                <span className="text-xs font-semibold uppercase tracking-[0.22em]">Campus events, presented like launches</span>
              </div>

              <h1 className="mt-6 max-w-4xl font-display text-5xl font-black leading-[0.98] text-foreground md:text-6xl">
                Browse every event through a cleaner, more premium event hub.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                Discover upcoming registrations, spot live experiences, and move straight into the events that matter without digging through clutter.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total events", value: String(events.length).padStart(2, "0"), icon: Calendar },
                { label: "Live now", value: String(liveEvents).padStart(2, "0"), icon: Radio },
                { label: "Categories", value: "04", icon: Ticket },
              ].map((item) => (
                <div key={item.label} className="rounded-[28px] border border-border/80 bg-background/90 px-5 py-5 text-foreground shadow-card backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">{item.label}</p>
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-4 font-display text-3xl font-black">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container -mt-6 relative z-10 pb-16">
        <div className="rounded-[34px] border border-border/80 bg-card p-6 shadow-card">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Filter the lineup</p>
              <h2 className="mt-2 font-display text-3xl font-black leading-tight">Switch categories without losing the premium browse experience.</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActive(category)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active === category ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <div className="rounded-[28px] border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
                <p className="text-sm font-medium text-muted-foreground">Loading the event lineup...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
                <p className="font-display text-2xl font-black">No events found in this category</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Try another category or add a new event from the admin panel to bring this section to life.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((evt) => (
                  <EventCard key={evt.id} event={evt} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-border/80 bg-primary p-7 text-primary-foreground shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary-foreground/55">Event flow</p>
            <h3 className="mt-3 font-display text-3xl font-black leading-tight">From announcement to registration, the page now feels more guided.</h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-primary-foreground/78">
              Stronger hierarchy, bigger cards, and cleaner sections make it easier for students to browse the schedule and actually act on what they find.
            </p>
          </div>

          <div className="rounded-[32px] border border-border/80 bg-card p-7 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Quick jump</p>
            <h3 className="mt-3 font-display text-3xl font-black leading-tight">Ready to register or go live?</h3>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Head into the event cards above to register, or open live scores if a matchday event is already underway.
            </p>
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Browse the cards above to register
              <ArrowRight className="h-4 w-4" />
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Events;
