import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, ArrowLeft, Clock3, Trophy } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/database/client";

interface LiveMatch {
  id: string;
  sport: string;
  match_format: string;
  team_a: string;
  team_b: string;
  score_a: number;
  score_b: number;
  wickets_a: number;
  wickets_b: number;
  overs_a: string;
  overs_b: string;
  extras_a: number;
  extras_b: number;
  status: string;
  detail: string | null;
  batting_team: string;
}

interface ScorecardEntry {
  id: string;
  match_id: string;
  team: string;
  player_name: string;
  role: string;
  runs: number | null;
  balls: number | null;
  fours: number | null;
  sixes: number | null;
  strike_rate: number | null;
  overs_bowled: string | null;
  maidens: number | null;
  runs_conceded: number | null;
  wickets_taken: number | null;
  economy: number | null;
  dismissal: string | null;
  batting_order: number | null;
}

const getRunRate = (score: number, overs: string) => {
  const parts = overs.split(".");
  const totalOvers = parseInt(parts[0]) + (parseInt(parts[1]) || 0) / 6;
  return totalOvers > 0 ? (score / totalOvers).toFixed(2) : "0.00";
};

const getRequiredRunRate = (target: number, currentScore: number, totalOvers: number, currentOvers: string) => {
  const parts = currentOvers.split(".");
  const oversUsed = parseInt(parts[0]) + (parseInt(parts[1]) || 0) / 6;
  const remainingOvers = totalOvers - oversUsed;
  const runsNeeded = target - currentScore;
  return remainingOvers > 0 ? (runsNeeded / remainingOvers).toFixed(2) : "0.00";
};

const getTotalOversFromFormat = (format: string) => {
  if (format === "T20") return 20;
  if (format === "ODI") return 50;
  if (format === "T10") return 10;
  return 20;
};

const getWinProbability = (match: LiveMatch) => {
  if (match.status !== "live") return { a: 50, b: 50 };
  const totalOvers = getTotalOversFromFormat(match.match_format);

  if (match.batting_team === "A") {
    const parts = match.overs_a.split(".");
    const oversUsed = parseInt(parts[0]) + (parseInt(parts[1]) || 0) / 6;
    if (oversUsed === 0) return { a: 50, b: 50 };
    const projected = (match.score_a / oversUsed) * totalOvers;
    const probability = Math.min(95, Math.max(5, 50 + (projected - 150) / 5));
    return { a: Math.round(probability), b: Math.round(100 - probability) };
  }

  const runsNeeded = match.score_a - match.score_b + 1;
  const parts = match.overs_b.split(".");
  const oversUsed = parseInt(parts[0]) + (parseInt(parts[1]) || 0) / 6;
  const remainingOvers = totalOvers - oversUsed;

  if (remainingOvers <= 0 || runsNeeded <= 0) {
    return runsNeeded <= 0 ? { a: 5, b: 95 } : { a: 95, b: 5 };
  }

  const requiredRunRate = runsNeeded / remainingOvers;
  const currentRunRate = oversUsed > 0 ? match.score_b / oversUsed : 0;
  const ratio = currentRunRate > 0 ? requiredRunRate / currentRunRate : 2;
  const chasingProbability = Math.min(95, Math.max(5, 100 - ratio * 50));
  return { a: Math.round(100 - chasingProbability), b: Math.round(chasingProbability) };
};

const MatchDetail = ({
  match,
  scorecard,
  onBack,
}: {
  match: LiveMatch;
  scorecard: ScorecardEntry[];
  onBack: () => void;
}) => {
  const [activeTeam, setActiveTeam] = useState(match.team_a);
  const isLive = match.status === "live";
  const winProbability = getWinProbability(match);
  const totalOvers = getTotalOversFromFormat(match.match_format);

  const entries = scorecard.filter((entry) => entry.team === activeTeam);
  const batsmen = entries.filter((entry) => entry.role === "batsman" || entry.role === "all-rounder");
  const bowlers = entries.filter((entry) => entry.role === "bowler" || entry.role === "all-rounder");

  const isTeamA = activeTeam === match.team_a;
  const teamScore = isTeamA ? match.score_a : match.score_b;
  const teamWickets = isTeamA ? match.wickets_a : match.wickets_b;
  const teamOvers = isTeamA ? match.overs_a : match.overs_b;
  const teamExtras = isTeamA ? match.extras_a : match.extras_b;

  const battingScore = match.batting_team === "A" ? match.score_a : match.score_b;
  const battingOvers = match.batting_team === "A" ? match.overs_a : match.overs_b;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All Matches
      </button>

      <div className="overflow-hidden rounded-[32px] border border-border/80 bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {match.sport} - {match.match_format}
          </span>
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background">
              <span className="h-2 w-2 rounded-full bg-background animate-pulse" />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-muted-foreground">
              Completed
            </span>
          )}
        </div>

        <div className="px-5 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted">
                <span className="font-display text-lg font-black text-foreground">
                  {match.team_a.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-black">{match.score_a}</span>
                  <span className="text-lg font-medium text-muted-foreground">/{match.wickets_a}</span>
                </div>
                <span className="text-xs text-muted-foreground">({match.overs_a})</span>
              </div>
            </div>

            <div className="flex flex-row-reverse items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted">
                <span className="font-display text-lg font-black text-foreground">
                  {match.team_b.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-2">
                  <span className="font-display text-3xl font-black">{match.score_b}</span>
                  <span className="text-lg font-medium text-muted-foreground">/{match.wickets_b}</span>
                </div>
                <span className="text-xs text-muted-foreground">({match.overs_b})</span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="font-display text-sm font-bold">{match.team_a}</span>
            <span className="font-display text-sm font-bold">{match.team_b}</span>
          </div>

          <div className="mt-4 text-center">
            {isLive && match.batting_team === "B" && match.score_a > 0 ? (
              <p className="text-sm font-medium text-foreground">
                {match.team_b} need {Math.max(0, match.score_a - match.score_b + 1)} runs
                {" - "}CRR: {getRunRate(battingScore, battingOvers)}
                {" - "}RRR: {getRequiredRunRate(match.score_a + 1, match.score_b, totalOvers, match.overs_b)}
              </p>
            ) : isLive ? (
              <p className="text-sm text-muted-foreground">CRR: {getRunRate(battingScore, battingOvers)}</p>
            ) : (
              <p className="text-sm font-medium">{match.detail || "Match completed"}</p>
            )}

            {match.detail && isLive && <p className="mt-1 text-xs text-muted-foreground">{match.detail}</p>}
          </div>
        </div>

        {isLive && (
          <div className="border-t border-border bg-muted/20 px-5 py-4">
            <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Live Win Probability
            </p>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                {match.team_a}
                <br />
                <span className="text-lg">{winProbability.a}%</span>
              </span>
              <span className="text-right text-sm font-bold text-foreground">
                {match.team_b}
                <br />
                <span className="text-lg">{winProbability.b}%</span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full rounded-full bg-foreground"
                initial={{ width: "50%" }}
                animate={{ width: `${winProbability.a}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-[32px] border border-border/80 bg-card shadow-card">
        <h2 className="border-b border-border px-5 py-4 font-display text-lg font-bold">Scorecard</h2>

        <div className="flex border-b border-border">
          {[match.team_a, match.team_b].map((team) => (
            <button
              key={team}
              onClick={() => setActiveTeam(team)}
              className={`relative flex-1 py-3 text-center text-sm font-semibold transition-colors ${
                activeTeam === team ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {team}
              {activeTeam === team && <motion.div layoutId="scorecard-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />}
            </button>
          ))}
        </div>

        <div className="p-5">
          {batsmen.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">Batting</h4>
              <div className="-mx-5 overflow-x-auto px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2.5 text-left text-xs font-medium text-muted-foreground">Batter</th>
                      <th className="w-10 py-2.5 text-right text-xs font-medium text-muted-foreground">R</th>
                      <th className="w-10 py-2.5 text-right text-xs font-medium text-muted-foreground">B</th>
                      <th className="w-10 py-2.5 text-right text-xs font-medium text-muted-foreground">4s</th>
                      <th className="w-10 py-2.5 text-right text-xs font-medium text-muted-foreground">6s</th>
                      <th className="w-14 py-2.5 text-right text-xs font-medium text-muted-foreground">S/R</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batsmen.map((entry) => (
                      <tr key={entry.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                              <span className="text-xs font-bold text-muted-foreground">{entry.player_name.charAt(0)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{entry.player_name}</p>
                              <p className="text-[11px] text-muted-foreground">{entry.dismissal ? entry.dismissal : "not out"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right font-bold tabular-nums">{entry.runs ?? 0}</td>
                        <td className="py-3 text-right tabular-nums text-muted-foreground">{entry.balls ?? 0}</td>
                        <td className="py-3 text-right tabular-nums text-muted-foreground">{entry.fours ?? 0}</td>
                        <td className="py-3 text-right tabular-nums text-muted-foreground">{entry.sixes ?? 0}</td>
                        <td className="py-3 text-right font-medium tabular-nums">{entry.strike_rate?.toFixed(2) ?? "0.00"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Extras</span>
                  <span className="font-bold tabular-nums">{teamExtras}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
                  <span className="font-bold">Total</span>
                  <span className="font-bold tabular-nums">
                    {teamScore} ({teamWickets} wkts, {teamOvers} ov)
                  </span>
                </div>
              </div>
            </div>
          )}

          {bowlers.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-foreground">Bowling</h4>
              <div className="-mx-5 overflow-x-auto px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2.5 text-left text-xs font-medium text-muted-foreground">Bowler</th>
                      <th className="w-10 py-2.5 text-right text-xs font-medium text-muted-foreground">O</th>
                      <th className="w-10 py-2.5 text-right text-xs font-medium text-muted-foreground">M</th>
                      <th className="w-10 py-2.5 text-right text-xs font-medium text-muted-foreground">R</th>
                      <th className="w-10 py-2.5 text-right text-xs font-medium text-muted-foreground">W</th>
                      <th className="w-14 py-2.5 text-right text-xs font-medium text-muted-foreground">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bowlers.map((entry) => (
                      <tr key={entry.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                              <span className="text-xs font-bold text-muted-foreground">{entry.player_name.charAt(0)}</span>
                            </div>
                            <span className="text-sm font-semibold">{entry.player_name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-medium tabular-nums">{entry.overs_bowled || "0"}</td>
                        <td className="py-3 text-right tabular-nums text-muted-foreground">{entry.maidens ?? 0}</td>
                        <td className="py-3 text-right font-bold tabular-nums">{entry.runs_conceded ?? 0}</td>
                        <td className="py-3 text-right font-bold tabular-nums text-foreground">{entry.wickets_taken ?? 0}</td>
                        <td className="py-3 text-right font-medium tabular-nums">{entry.economy?.toFixed(2) ?? "0.00"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {batsmen.length === 0 && bowlers.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Trophy className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">No scorecard data available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MatchCard = ({
  match,
  onClick,
}: {
  match: LiveMatch;
  onClick: () => void;
}) => {
  const isLive = match.status === "live";
  const battingScore = match.batting_team === "A" ? match.score_a : match.score_b;
  const battingOvers = match.batting_team === "A" ? match.overs_a : match.overs_b;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className={`h-1 w-full ${isLive ? "bg-foreground" : "bg-border"}`} />

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {match.sport} - {match.match_format}
          </span>
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-bold text-background">
              <span className="h-1.5 w-1.5 rounded-full bg-background animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Completed
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className={`flex items-center justify-between ${match.batting_team === "A" && isLive ? "" : "opacity-75"}`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                <span className="font-display text-xs font-bold text-foreground">{match.team_a.slice(0, 2).toUpperCase()}</span>
              </div>
              <span className="truncate font-display text-sm font-bold">{match.team_a}</span>
              {match.batting_team === "A" && isLive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />}
            </div>
            <div className="flex shrink-0 items-baseline gap-0.5">
              <span className="font-display text-xl font-black">{match.score_a}</span>
              <span className="text-sm font-medium text-muted-foreground">/{match.wickets_a}</span>
              <span className="ml-1.5 text-xs text-muted-foreground">({match.overs_a})</span>
            </div>
          </div>

          <div className={`flex items-center justify-between ${match.batting_team === "B" && isLive ? "" : "opacity-75"}`}>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                <span className="font-display text-xs font-bold text-foreground">{match.team_b.slice(0, 2).toUpperCase()}</span>
              </div>
              <span className="truncate font-display text-sm font-bold">{match.team_b}</span>
              {match.batting_team === "B" && isLive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />}
            </div>
            <div className="flex shrink-0 items-baseline gap-0.5">
              <span className="font-display text-xl font-black">{match.score_b}</span>
              <span className="text-sm font-medium text-muted-foreground">/{match.wickets_b}</span>
              <span className="ml-1.5 text-xs text-muted-foreground">({match.overs_b})</span>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-3 text-center">
          {isLive ? (
            <p className="text-xs text-muted-foreground">
              CRR: {getRunRate(battingScore, battingOvers)}
              {match.batting_team === "B" && match.score_a > 0 && (
                <span className="ml-2 font-medium text-foreground">
                  - Need {Math.max(0, match.score_a - match.score_b + 1)} runs
                </span>
              )}
            </p>
          ) : (
            <p className="text-xs font-medium text-muted-foreground">{match.detail || "Match completed"}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const LiveScores = () => {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardEntry[]>([]);

  const fetchMatches = async () => {
    const { data } = await supabase
      .from("live_matches")
      .select("*")
      .in("status", ["live", "completed"])
      .order("created_at", { ascending: false });

    if (data) setMatches(data as LiveMatch[]);
  };

  useEffect(() => {
    fetchMatches();

    const channel = supabase
      .channel("live-scores")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_matches" }, () => fetchMatches())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchScorecard = async (matchId: string) => {
    const { data } = await supabase.from("match_scorecard").select("*").eq("match_id", matchId).order("batting_order");
    if (data) setScorecard(data as ScorecardEntry[]);
  };

  useEffect(() => {
    if (!selectedMatchId) return;

    fetchScorecard(selectedMatchId);

    const channel = supabase
      .channel(`scorecard-${selectedMatchId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "match_scorecard", filter: `match_id=eq.${selectedMatchId}` }, () =>
        fetchScorecard(selectedMatchId),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMatchId]);

  const selectedMatch = matches.find((match) => match.id === selectedMatchId);
  const liveMatches = matches.filter((match) => match.status === "live");
  const completedMatches = matches.filter((match) => match.status === "completed");
  const sportCount = new Set(matches.map((match) => match.sport)).size;

  return (
    <Layout>
      {selectedMatch ? (
        <section className="container max-w-5xl py-10 md:py-14">
          <MatchDetail match={selectedMatch} scorecard={scorecard} onBack={() => setSelectedMatchId(null)} />
        </section>
      ) : (
        <>
          <section className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-hero" />
            <div className="absolute inset-0 bg-grid-premium opacity-[0.3]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--foreground)_/_0.06),transparent_34%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,hsl(var(--foreground)_/_0.04),transparent_40%)]" />

            <div className="relative container max-w-6xl py-14 md:py-16">
              <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-4 py-2 text-muted-foreground shadow-card">
                    <Trophy className="h-4 w-4 text-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-[0.22em]">Live match center with clear score visibility</span>
                  </div>

                  <h1 className="mt-6 max-w-4xl font-display text-5xl font-black leading-[0.98] text-foreground md:text-6xl">
                    Follow campus matches through a cleaner, easier-to-read live scoreboard.
                  </h1>

                  <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                    Open a live match, scan the current score fast, and jump into full scorecards without hunting through clutter or tiny cards.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Live now", value: String(liveMatches.length).padStart(2, "0"), icon: Activity },
                    { label: "Completed", value: String(completedMatches.length).padStart(2, "0"), icon: Clock3 },
                    { label: "Sports", value: String(sportCount).padStart(2, "0"), icon: Trophy },
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

          <section className="container relative z-10 -mt-6 max-w-6xl pb-16">
            <div className="rounded-[34px] border border-border/80 bg-card p-6 shadow-card">
              {matches.length === 0 ? (
                <div className="flex flex-col items-center rounded-[28px] border border-dashed border-border bg-muted/25 px-6 py-16 text-center text-muted-foreground">
                  <Trophy className="mb-4 h-14 w-14 opacity-30" />
                  <p className="font-display text-2xl font-black text-foreground">No matches right now</p>
                  <p className="mt-3 max-w-md text-sm leading-7">Check back later for live scores, completed results, and full scorecards.</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {liveMatches.length > 0 && (
                    <div>
                      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Matchday now</p>
                          <h2 className="mt-2 font-display text-3xl font-black leading-tight">Live matches</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">Tap a card to open the full scorecard and current run-rate view.</p>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {liveMatches.map((match) => (
                          <MatchCard key={match.id} match={match} onClick={() => setSelectedMatchId(match.id)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {completedMatches.length > 0 && (
                    <div>
                      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Results archive</p>
                          <h2 className="mt-2 font-display text-3xl font-black leading-tight">Completed matches</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">Review finished scorelines and open the detailed scorecard when needed.</p>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {completedMatches.map((match) => (
                          <MatchCard key={match.id} match={match} onClick={() => setSelectedMatchId(match.id)} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </Layout>
  );
};

export default LiveScores;
