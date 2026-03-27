import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { initialEvents } from "@/data/campus-data";
import { Radio } from "lucide-react";

const Streaming = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("event");
  const event = initialEvents.find((e) => e.id === eventId && e.isLive && e.streamUrl);
  const liveEvents = initialEvents.filter((e) => e.isLive && e.streamUrl);

  const current = event || liveEvents[0];

  if (!current) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Radio className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl font-bold">No Live Streams</h2>
          <p className="mt-2 text-muted-foreground">There are no events streaming right now. Check back later!</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse-live" />
          <span className="text-xs font-semibold text-destructive uppercase">Live Now</span>
        </div>
        <h1 className="font-display text-3xl font-bold">{current.name}</h1>
        <p className="mt-1 text-muted-foreground">{current.description}</p>

        <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl border shadow-card">
          <iframe
            src={current.streamUrl}
            title={current.name}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {liveEvents.length > 1 && (
          <div className="mt-8">
            <h3 className="font-display text-lg font-semibold mb-4">Other Live Streams</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {liveEvents.filter((e) => e.id !== current.id).map((e) => (
                <a key={e.id} href={`/streaming?event=${e.id}`} className="rounded-xl border bg-card p-4 shadow-card hover:shadow-card-hover transition-shadow">
                  <div className="font-display font-semibold">{e.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{e.venue}</div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Streaming;
