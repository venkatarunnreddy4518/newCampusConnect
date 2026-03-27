
-- Create clubs table
CREATE TABLE public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  poster_url TEXT,
  max_members INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clubs" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Admins can insert clubs" ON public.clubs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update clubs" ON public.clubs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete clubs" ON public.clubs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON public.clubs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create club memberships table
CREATE TABLE public.club_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'lead', 'coordinator')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id)
);

ALTER TABLE public.club_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view memberships" ON public.club_memberships FOR SELECT USING (true);
CREATE POLICY "Users can join clubs" ON public.club_memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave clubs" ON public.club_memberships FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage memberships" ON public.club_memberships FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed some clubs
INSERT INTO public.clubs (name, description, category) VALUES
  ('Coding Club', 'Learn programming, participate in hackathons, and build cool projects together.', 'Technical'),
  ('Robotics Club', 'Design, build and program robots. Compete in national robotics competitions.', 'Technical'),
  ('Photography Club', 'Capture campus life through the lens. Weekly photo walks and editing workshops.', 'Creative'),
  ('Music Club', 'Jam sessions, band practice, and live performances at campus events.', 'Creative'),
  ('Debate Society', 'Sharpen your public speaking and argumentation skills in weekly debates.', 'Literary'),
  ('Sports Committee', 'Organize inter-department tournaments and manage sports facilities.', 'Sports'),
  ('Entrepreneurship Cell', 'Ideate, innovate and launch startups. Mentorship from industry leaders.', 'Business'),
  ('Drama Club', 'Theatre productions, street plays, and acting workshops throughout the year.', 'Creative');

-- Storage bucket for club posters
INSERT INTO storage.buckets (id, name, public) VALUES ('club-posters', 'club-posters', true);

CREATE POLICY "Anyone can view club posters" ON storage.objects FOR SELECT USING (bucket_id = 'club-posters');
CREATE POLICY "Admins can upload club posters" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'club-posters' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update club posters" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'club-posters' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete club posters" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'club-posters' AND public.has_role(auth.uid(), 'admin'));
