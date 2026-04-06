import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/database/client";
import { Trophy, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

// Simple win probability based on run rate comparison
const getWinProbability = (match: LiveMatch) => {
  if (match.status !== "live") return { a: 50, b: 50 };
  const totalOvers = getTotalOversFromFormat(match.match_format);

  if (match.batting_team === "A") {
    // First innings — use projected score
    const parts = match.overs_a.split(".");
    const oversUsed = parseInt(parts[0]) + (parseInt(parts[1]) || 0) / 6;
    if (oversUsed === 0) return { a: 50, b: 50 };
    const projected = (match.score_a / oversUsed) * totalOvers;
    const prob = Math.min(95, Math.max(5, 50 + (projected - 150) / 5));
    return { a: Math.round(prob), b: Math.round(100 - prob) };
  } else {
    // Second innings — use required vs current run rate
    const runsNeeded = match.score_a - match.score_b + 1;
    const parts = match.overs_b.split(".");
    const oversUsed = parseInt(parts[0]) + (parseInt(parts[1]) || 0) / 6;
    const remainingOvers = totalOvers - oversUsed;
    if (remainingOvers <= 0 || runsNeeded <= 0) {
      return runsNeeded <= 0 ? { a: 5, b: 95 } : { a: 95, b: 5 };
    }
    const rrr = runsNeeded / remainingOvers;
    const crr = oversUsed > 0 ? match.score_b / oversUsed : 0;
    const ratio = crr > 0 ? rrr / crr : 2;
    const bProb = Math.min(95, Math.max(5, 100 - ratio * 50));
    return { a: Math.round(100 - bProb), b: Math.round(bProb) };
  }
};

// ─── Match Detail View ───────────────────────────────────
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
  const winProb = getWinProbability(match);
  const totalOvers = getTotalOversFromFormat(match.match_format);

  const entries = scorecard.filter((e) => e.team === activeTeam);
  const batsmen = entries.filter((e) => e.role === "batsman" || e.role === "all-rounder");
  const bowlers = entries.filter((e) => e.role === "bowler" || e.role === "all-rounder");

  const isTeamA = activeTeam === match.team_a;
  const teamScore = isTeamA ? match.score_a : match.score_b;
  const teamWickets = isTeamA ? match.wickets_a : match.wickets_b;
  const teamOvers = isTeamA ? match.overs_a : match.overs_b;
  const teamExtras = isTeamA ? match.extras_a : match.extras_b;

  const battingScore = match.batting_team === "A" ? match.score_a : match.score_b;
  const battingOvers = match.batting_team === "A" ? match.overs_a : match.overs_b;

  return (
    <div className="space-y-0">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> All Matches
      </button>

      {/* ─── Match Header (ICC-style) ─── */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-card">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {match.sport} · {match.match_format}
          </span>
          {isLive ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-destructive">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              Live
            </span>
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">Completed</span>
          )}
        </div>

        {/* Score section */}
        <div className="px-5 py-6">
          <div className="flex items-center justify-between">
            {/* Team A */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
                <span className="font-display text-lg font-black text-primary">
                  {match.team_a.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-black">{match.score_a}</span>
                  <span className="text-lg text-muted-foreground font-medium">/{match.wickets_a}</span>
                </div>
                <span className="text-xs text-muted-foreground">({match.overs_a})</span>
              </div>
            </div>

            {/* Team names below scores */}
            <div className="hidden" />

            {/* Team B */}
            <div className="flex items-center gap-4 flex-row-reverse">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 border-2 border-accent/20">
                <span className="font-display text-lg font-black text-accent">
                  {match.team_b.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="font-display text-3xl font-black">{match.score_b}</span>
                  <span className="text-lg text-muted-foreground font-medium">/{match.wickets_b}</span>
                </div>
                <span className="text-xs text-muted-foreground">({match.overs_b})</span>
              </div>
            </div>
          </div>

          {/* Team names */}
          <div className="flex items-center justify-between mt-2">
            <span className="font-display font-bold text-sm">{match.team_a}</span>
            <span className="font-display font-bold text-sm">{match.team_b}</span>
          </div>

          {/* Match status line */}
          <div className="mt-4 text-center">
            {isLive && match.batting_team === "B" && match.score_a > 0 ? (
              <p className="text-sm font-medium text-primary">
                {match.team_b} need {Math.max(0, match.score_a - match.score_b + 1)} runs
                {" · "}CRR: {getRunRate(battingScore, battingOvers)}
                {" · "}RRR: {getRequiredRunRate(match.score_a + 1, match.score_b, totalOvers, match.overs_b)}
              </p>
            ) : isLive ? (
              <p className="text-sm text-muted-foreground">
                CRR: {getRunRate(battingScore, battingOvers)}
              </p>
            ) : (
              <p className="text-sm font-medium">{match.detail || "Match completed"}</p>
            )}
            {match.detail && isLive && (
              <p className="text-xs text-muted-foreground mt-1">{match.detail}</p>
            )}
          </div>
        </div>

        {/* Win Probability */}
        {isLive && (
          <div className="px-5 py-4 border-t border-border bg-muted/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center mb-3">
              Live Win Probability
            </p>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-primary">{match.team_a}<br /><span className="text-lg">{winProb.a}%</span></span>
              <span className="text-sm font-bold text-accent text-right">{match.team_b}<br /><span className="text-lg">{winProb.b}%</span></span>
            </div>
            <div className="h-2.5 w-full rounded-full overflow-hidden bg-accent/30">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: "50%" }}
                animate={{ width: `${winProb.a}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── Scorecard ─── */}
      <div className="mt-6 rounded-2xl border bg-card overflow-hidden shadow-card">
        <h2 className="px-5 py-4 font-display text-lg font-bold border-b border-border">
          Scorecard
        </h2>

        {/* Team tabs */}
        <div className="flex border-b border-border">
          {[match.team_a, match.team_b].map((team) => (
            <button
              key={team}
              onClick={() => setActiveTeam(team)}
              className={`flex-1 py-3 text-sm font-semibold text-center transition-colors relative ${
                activeTeam === team
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {team}
              {activeTeam === team && (
                <motion.div
                  layoutId="scorecard-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Batting */}
          {batsmen.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Batting</h4>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2.5 text-left font-medium text-muted-foreground text-xs">Batter</th>
                      <th className="py-2.5 text-right font-medium text-muted-foreground text-xs w-10">R</th>
                      <th className="py-2.5 text-right font-medium text-muted-foreground text-xs w-10">B</th>
                      <th className="py-2.5 text-right font-medium text-muted-foreground text-xs w-10">4s</th>
                      <th className="py-2.5 text-right font-medium text-muted-foreground text-xs w-10">6s</th>
                      <th className="py-2.5 text-right font-medium text-muted-foreground text-xs w-14">S/R</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batsmen.map((e) => (
                      <tr key={e.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted shrink-0">
                              <span className="text-xs font-bold text-muted-foreground">
                                {e.player_name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{e.player_name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {e.dismissal ? `${e.dismissal}` : "not out"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right font-bold tabular-nums">{e.runs ?? 0}</td>
                        <td className="py-3 text-right tabular-nums text-muted-foreground">{e.balls ?? 0}</td>
                        <td className="py-3 text-right tabular-nums text-muted-foreground">{e.fours ?? 0}</td>
                        <td className="py-3 text-right tabular-nums text-muted-foreground">{e.sixes ?? 0}</td>
                        <td className="py-3 text-right tabular-nums font-medium">{e.strike_rate?.toFixed(2) ?? "0.00"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Extras & Total */}
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Extras</span>
                  <span className="font-bold tabular-nums">{teamExtras}</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t border-border pt-2">
                  <span className="font-bold">Total</span>
                  <span className="font-bold tabular-nums">
                    {teamScore} ({teamWickets} wkts, {teamOvers} ov)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bowling */}
          {bowlers.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Bowling</h4>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-2.5 text-left font-medium text-muted-foreground text-xs">Bowler</th>
                      <th className="py-2.5 text-right font-medium text-muted-foreground text-xs w-10">O</th>
                      <th className="py-2.5 text-right font-medium text-muted-foreground text-xs w-10">M</th>
                      <th className="py-2.5 text-right font-medium text-muted-foreground text-xs w-10">R</th>
                      <th className="py-2.5 text-right font-medium text-muted-foreground text-xs w-10">W</th>
                      <th className="py-2.5 text-right font-medium text-muted-foreground text-xs w-14">Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bowlers.map((e) => (
                      <tr key={e.id} className="border-b border-border/50 last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted shrink-0">
                              <span className="text-xs font-bold text-muted-foreground">
                                {e.player_name.charAt(0)}
                              </span>
                            </div>
                            <span className="font-semibold text-sm">{e.player_name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right tabular-nums font-medium">{e.overs_bowled || "0"}</td>
                        <td className="py-3 text-right tabular-nums text-muted-foreground">{e.maidens ?? 0}</td>
                        <td className="py-3 text-right tabular-nums font-bold">{e.runs_conceded ?? 0}</td>
                        <td className="py-3 text-right tabular-nums font-bold text-primary">{e.wickets_taken ?? 0}</td>
                        <td className="py-3 text-right tabular-nums font-medium">{e.economy?.toFixed(2) ?? "0.00"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {batsmen.length === 0 && bowlers.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Trophy className="mx-auto h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No scorecard data available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Match Card (list view) ─────────────────────────────
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
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="cursor-pointer relative overflow-hidden rounded-2xl border bg-card shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className={`h-1 w-full ${isLive ? "bg-destructive" : "bg-muted"}`} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {match.sport} · {match.match_format}
          </span>
          {isLive ? (
            <span className="flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Completed
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="space-y-3">
          <div className={`flex items-center justify-between ${match.batting_team === "A" && isLive ? "" : "opacity-75"}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <span className="font-display text-xs font-bold text-primary">{match.team_a.slice(0, 2).toUpperCase()}</span>
              </div>
              <span className="font-display font-bold text-sm truncate">{match.team_a}</span>
              {match.batting_team === "A" && isLive && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              )}
            </div>
            <div className="flex items-baseline gap-0.5 shrink-0">
              <span className="font-display text-xl font-black">{match.score_a}</span>
              <span className="text-sm text-muted-foreground font-medium">/{match.wickets_a}</span>
              <span className="ml-1.5 text-xs text-muted-foreground">({match.overs_a})</span>
            </div>
          </div>
          <div className={`flex items-center justify-between ${match.batting_team === "B" && isLive ? "" : "opacity-75"}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 shrink-0">
                <span className="font-display text-xs font-bold text-accent">{match.team_b.slice(0, 2).toUpperCase()}</span>
              </div>
              <span className="font-display font-bold text-sm truncate">{match.team_b}</span>
              {match.batting_team === "B" && isLive && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              )}
            </div>
            <div className="flex items-baseline gap-0.5 shrink-0">
              <span className="font-display text-xl font-black">{match.score_b}</span>
              <span className="text-sm text-muted-foreground font-medium">/{match.wickets_b}</span>
              <span className="ml-1.5 text-xs text-muted-foreground">({match.overs_b})</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border text-center">
          {isLive ? (
            <p className="text-xs text-muted-foreground">
              CRR: {getRunRate(battingScore, battingOvers)}
              {match.batting_team === "B" && match.score_a > 0 && (
                <span className="ml-2 font-medium text-primary">
                  · Need {Math.max(0, match.score_a - match.score_b + 1)} runs
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

// ─── Main Page ───────────────────────────────────────────
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
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchScorecard = async (matchId: string) => {
    const { data } = await supabase
      .from("match_scorecard")
      .select("*")
      .eq("match_id", matchId)
      .order("batting_order");
    if (data) setScorecard(data as ScorecardEntry[]);
  };

  useEffect(() => {
    if (selectedMatchId) {
      fetchScorecard(selectedMatchId);
      // Realtime scorecard updates
      const channel = supabase
        .channel("scorecard-" + selectedMatchId)
        .on("postgres_changes", { event: "*", schema: "public", table: "match_scorecard", filter: `match_id=eq.${selectedMatchId}` }, () => fetchScorecard(selectedMatchId))
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedMatchId]);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);
  const liveMatches = matches.filter((m) => m.status === "live");
  const completedMatches = matches.filter((m) => m.status === "completed");

  return (
    <Layout>
      <div className="container max-w-3xl py-10">
        {selectedMatch ? (
          <MatchDetail
            match={selectedMatch}
            scorecard={scorecard}
            onBack={() => setSelectedMatchId(null)}
          />
        ) : (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-7 w-7 text-accent" />
              <h1 className="font-display text-3xl font-bold">Live Scores</h1>
            </div>
            <p className="text-muted-foreground mb-8">Follow ongoing matches in real-time. Tap a match for full scorecard.</p>

            {matches.length === 0 ? (
              <div className="mt-12 flex flex-col items-center text-center text-muted-foreground">
                <Trophy className="h-16 w-16 mb-4 opacity-30" />
                <p className="text-lg font-medium">No matches right now</p>
                <p className="text-sm">Check back later for live scores!</p>
              </div>
            ) : (
              <>
                {liveMatches.length > 0 && (
                  <div className="mb-8">
                    <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
                      Live Now
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {liveMatches.map((match) => (
                        <MatchCard key={match.id} match={match} onClick={() => setSelectedMatchId(match.id)} />
                      ))}
                    </div>
                  </div>
                )}

                {completedMatches.length > 0 && (
                  <div>
                    <h2 className="font-display text-lg font-semibold mb-4">Completed</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {completedMatches.map((match) => (
                        <MatchCard key={match.id} match={match} onClick={() => setSelectedMatchId(match.id)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default LiveScores;

