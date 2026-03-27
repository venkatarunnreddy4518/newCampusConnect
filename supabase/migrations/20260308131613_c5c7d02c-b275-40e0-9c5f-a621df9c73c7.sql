
-- Create events table in DB
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  venue TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Sports',
  is_live BOOLEAN NOT NULL DEFAULT false,
  stream_url TEXT,
  poster_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Everyone can view events
CREATE POLICY "Anyone can view events" ON public.events
  FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update events" ON public.events
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete events" ON public.events
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with initial events
INSERT INTO public.events (name, date, venue, description, category, is_live, stream_url) VALUES
  ('Cricket Tournament Finals', '2026-03-12', 'Main Ground', 'The grand finale of inter-department cricket. CSE vs ECE battle it out for the championship title.', 'Sports', true, 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
  ('Hackathon 2026', '2026-03-15', 'CS Lab Block', '24-hour coding marathon. Build innovative solutions to real-world problems.', 'Technical', false, NULL),
  ('Annual Cultural Fest', '2026-03-20', 'Open Air Theatre', 'Music, dance, drama and art — the biggest cultural celebration of the year.', 'Cultural', false, NULL),
  ('AI/ML Workshop', '2026-03-10', 'Seminar Hall A', 'Hands-on workshop on building machine learning models with Python and TensorFlow.', 'Workshops', true, 'https://www.youtube.com/embed/dQw4w9WgXcQ'),
  ('Basketball League', '2026-03-18', 'Indoor Stadium', 'Inter-college basketball league quarter-finals.', 'Sports', false, NULL),
  ('Web Dev Bootcamp', '2026-03-22', 'IT Block Room 204', 'Learn React, TypeScript and modern web development practices.', 'Workshops', false, NULL);

-- Create storage bucket for event posters
INSERT INTO storage.buckets (id, name, public) VALUES ('event-posters', 'event-posters', true);

-- Storage policies
CREATE POLICY "Anyone can view event posters" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-posters');

CREATE POLICY "Admins can upload event posters" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-posters' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update event posters" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'event-posters' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete event posters" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'event-posters' AND public.has_role(auth.uid(), 'admin'));
