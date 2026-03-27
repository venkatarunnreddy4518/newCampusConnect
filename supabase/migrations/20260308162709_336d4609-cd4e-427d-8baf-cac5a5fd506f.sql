
-- Live matches table for real-time scoring
CREATE TABLE public.live_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport text NOT NULL DEFAULT 'Cricket',
  match_format text NOT NULL DEFAULT 'T20',
  team_a text NOT NULL,
  team_b text NOT NULL,
  score_a integer NOT NULL DEFAULT 0,
  score_b integer NOT NULL DEFAULT 0,
  wickets_a integer NOT NULL DEFAULT 0,
  wickets_b integer NOT NULL DEFAULT 0,
  overs_a text NOT NULL DEFAULT '0.0',
  overs_b text NOT NULL DEFAULT '0.0',
  extras_a integer NOT NULL DEFAULT 0,
  extras_b integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'upcoming',
  detail text,
  batting_team text NOT NULL DEFAULT 'A',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Scorecard entries for completed matches
CREATE TABLE public.match_scorecard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid REFERENCES public.live_matches(id) ON DELETE CASCADE NOT NULL,
  team text NOT NULL,
  player_name text NOT NULL,
  role text NOT NULL DEFAULT 'batsman',
  runs integer DEFAULT 0,
  balls integer DEFAULT 0,
  fours integer DEFAULT 0,
  sixes integer DEFAULT 0,
  strike_rate numeric DEFAULT 0,
  overs_bowled text,
  maidens integer DEFAULT 0,
  runs_conceded integer DEFAULT 0,
  wickets_taken integer DEFAULT 0,
  economy numeric DEFAULT 0,
  dismissal text,
  batting_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_scorecard ENABLE ROW LEVEL SECURITY;

-- Anyone can view matches
CREATE POLICY "Anyone can view live matches" ON public.live_matches FOR SELECT USING (true);
CREATE POLICY "Anyone can view scorecards" ON public.match_scorecard FOR SELECT USING (true);

-- Only admins and score managers can manage matches
CREATE POLICY "Authorized users can manage matches" ON public.live_matches FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

CREATE POLICY "Authorized users can manage scorecards" ON public.match_scorecard FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_matches;

-- Updated_at trigger
CREATE TRIGGER update_live_matches_updated_at
  BEFORE UPDATE ON public.live_matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
