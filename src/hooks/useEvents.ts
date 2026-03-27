import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DbEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  description: string | null;
  category: string;
  is_live: boolean;
  stream_url: string | null;
  poster_url: string | null;
  trailer_url: string | null;
  created_at: string;
}

export function useEvents() {
  const [events, setEvents] = useState<DbEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });
    if (data) setEvents(data as DbEvent[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return { events, loading, refetch: fetchEvents };
}
