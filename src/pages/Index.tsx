import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Trophy, Calendar, Bell, Radio, Crown, Sparkles, Users, ArrowLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import EventCard from "@/components/EventCard";
import { useEvents } from "@/hooks/useEvents";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
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
  batting_team: string;
  detail: string | null;
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
    const prob = Math.min(95, Math.max(5, 50 + (projected - 150) / 5));
    return { a: Math.round(prob), b: Math.round(100 - prob) };
  } else {
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

const LiveMatchCard = ({ match, onClick }: { match: LiveMatch; onClick: () => void }) => {
  const isLive = match.status === "live";
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400 }}
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl border bg-card shadow-card hover:shadow-card-hover cursor-pointer"
    >
      <div className={`h-0.5 w-full ${isLive ? "bg-gradient-to-r from-destructive via-destructive to-destructive/50" : "bg-border"}`} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {match.sport} · {match.match_format}
          </span>
          {isLive ? (
            <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Completed
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {[
            { team: match.team_a, score: match.score_a, wickets: match.wickets_a, overs: match.overs_a, batting: match.batting_team === "A", accent: "primary" },
            { team: match.team_b, score: match.score_b, wickets: match.wickets_b, overs: match.overs_b, batting: match.batting_team === "B", accent: "accent" },
          ].map((t) => (
            <div key={t.team} className={`flex items-center justify-between ${t.batting && isLive ? "" : "opacity-70"}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`flex h-7 w-7 items-center justify-center rounded-md bg-${t.accent}/10 shrink-0`}>
                  <span className={`font-display text-[10px] font-black text-${t.accent}`}>{t.team.slice(0, 2).toUpperCase()}</span>
                </div>
                <span className="font-display font-bold text-sm truncate">{t.team}</span>
                {t.batting && isLive && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
              </div>
              <div className="flex items-baseline gap-0.5 shrink-0 tabular-nums">
                <span className="font-display text-lg font-black">{t.score}</span>
                <span className="text-xs text-muted-foreground">/{t.wickets}</span>
                <span className="ml-1 text-[10px] text-muted-foreground">({t.overs})</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-2.5 border-t border-border/50 text-center">
          <p className="text-[11px] text-muted-foreground">
            {isLive ? (
              <>
                CRR: {getRunRate(
                  match.batting_team === "A" ? match.score_a : match.score_b,
                  match.batting_team === "A" ? match.overs_a : match.overs_b
                )}
                {match.batting_team === "B" && match.score_a > 0 && (
                  <span className="ml-1.5 font-semibold text-primary">
                    · Need {Math.max(0, match.score_a - match.score_b + 1)}
                  </span>
                )}
              </>
            ) : (
              <span className="font-medium">{match.detail || "Match completed"}</span>
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Inline Scorecard Detail ───
const ScorecardDetail = ({ match, scorecard, onClose }: { match: LiveMatch; scorecard: ScorecardEntry[]; onClose: () => void }) => {
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/60 backdrop-blur-sm overflow-y-auto py-8 px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} className="mb-3 flex items-center gap-1.5 text-sm font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Match Header */}
        <div className="rounded-2xl border bg-card overflow-hidden shadow-card">
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

          <div className="px-5 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
                  <span className="font-display text-lg font-black text-primary">{match.team_a.slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-black">{match.score_a}</span>
                    <span className="text-lg text-muted-foreground font-medium">/{match.wickets_a}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">({match.overs_a})</span>
                </div>
              </div>
              <div className="flex items-center gap-4 flex-row-reverse">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 border-2 border-accent/20">
                  <span className="font-display text-lg font-black text-accent">{match.team_b.slice(0, 2).toUpperCase()}</span>
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
            <div className="flex items-center justify-between mt-2">
              <span className="font-display font-bold text-sm">{match.team_a}</span>
              <span className="font-display font-bold text-sm">{match.team_b}</span>
            </div>
            <div className="mt-4 text-center">
              {isLive && match.batting_team === "B" && match.score_a > 0 ? (
                <p className="text-sm font-medium text-primary">
                  {match.team_b} need {Math.max(0, match.score_a - match.score_b + 1)} runs
                  {" · "}CRR: {getRunRate(battingScore, battingOvers)}
                  {" · "}RRR: {getRequiredRunRate(match.score_a + 1, match.score_b, totalOvers, match.overs_b)}
                </p>
              ) : isLive ? (
                <p className="text-sm text-muted-foreground">CRR: {getRunRate(battingScore, battingOvers)}</p>
              ) : (
                <p className="text-sm font-medium">{match.detail || "Match completed"}</p>
              )}
            </div>
          </div>

          {isLive && (
            <div className="px-5 py-4 border-t border-border bg-muted/20">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center mb-3">Live Win Probability</p>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-primary">{match.team_a}<br /><span className="text-lg">{winProb.a}%</span></span>
                <span className="text-sm font-bold text-accent text-right">{match.team_b}<br /><span className="text-lg">{winProb.b}%</span></span>
              </div>
              <div className="h-2.5 w-full rounded-full overflow-hidden bg-accent/30">
                <motion.div className="h-full rounded-full bg-primary" initial={{ width: "50%" }} animate={{ width: `${winProb.a}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
              </div>
            </div>
          )}
        </div>

        {/* Scorecard */}
        <div className="mt-4 rounded-2xl border bg-card overflow-hidden shadow-card">
          <h2 className="px-5 py-4 font-display text-lg font-bold border-b border-border">Scorecard</h2>
          <div className="flex border-b border-border">
            {[match.team_a, match.team_b].map((team) => (
              <button key={team} onClick={() => setActiveTeam(team)} className={`flex-1 py-3 text-sm font-semibold text-center transition-colors relative ${activeTeam === team ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {team}
                {activeTeam === team && <motion.div layoutId="home-scorecard-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>
          <div className="p-5">
            {batsmen.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Batting</h4>
                <div className="overflow-x-auto">
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
                            <p className="font-semibold text-sm">{e.player_name}</p>
                            <p className="text-[11px] text-muted-foreground">{e.dismissal || "not out"}</p>
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
                <div className="mt-3 space-y-2 border-t border-border pt-3">
                  <div className="flex items-center justify-between text-sm"><span className="font-semibold">Extras</span><span className="font-bold tabular-nums">{teamExtras}</span></div>
                  <div className="flex items-center justify-between text-sm border-t border-border pt-2"><span className="font-bold">Total</span><span className="font-bold tabular-nums">{teamScore} ({teamWickets} wkts, {teamOvers} ov)</span></div>
                </div>
              </div>
            )}
            {bowlers.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Bowling</h4>
                <div className="overflow-x-auto">
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
                          <td className="py-3 font-semibold text-sm">{e.player_name}</td>
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
      </motion.div>
    </motion.div>
  );
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Index = () => {
  const { events } = useEvents();
  const upcomingEvents = events.filter((e) => !e.is_live).slice(0, 3);
  const liveEvents = events.filter((e) => e.is_live);
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>("");
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
  const [scorecard, setScorecard] = useState<ScorecardEntry[]>([]);

  const openScorecard = async (match: LiveMatch) => {
    setSelectedMatch(match);
    const { data } = await supabase.from("match_scorecard").select("*").eq("match_id", match.id);
    if (data) setScorecard(data as ScorecardEntry[]);
  };

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "hero_video_url").single()
      .then(({ data }) => { if (data?.value) setHeroVideoUrl(data.value); });

    const fetchMatches = async () => {
      const { data } = await supabase
        .from("live_matches")
        .select("*")
        .in("status", ["live", "completed"])
        .order("created_at", { ascending: false })
        .limit(6);
      if (data) setLiveMatches(data as LiveMatch[]);
    };
    fetchMatches();

    const channel = supabase
      .channel("home-live-scores")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_matches" }, () => fetchMatches())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <Layout>
      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground to-foreground">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.4), transparent),
                              radial-gradient(ellipse 60% 40% at 80% 100%, hsl(var(--accent) / 0.2), transparent),
                              radial-gradient(ellipse 50% 30% at 10% 60%, hsl(var(--secondary) / 0.15), transparent)`
          }} />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative container py-16 md:py-24">
          <div className="flex flex-col md:flex-row md:items-center md:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex-1 max-w-2xl"
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3.5 py-1.5 mb-6"
              >
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-medium text-primary-foreground/70">Your all-in-one campus platform</span>
              </motion.div>

              <h1 className="font-display text-4xl font-black leading-[1.1] text-primary-foreground md:text-5xl lg:text-6xl">
                Your Campus.
                <br />
                <span className="bg-gradient-to-r from-primary-foreground via-primary-foreground to-primary-foreground/60 bg-clip-text text-transparent">
                  All Connected.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-primary-foreground/60">
                Discover events, follow live sports scores, join clubs, register instantly, and never miss what's happening on campus.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/events">
                  <InteractiveHoverButton text="Explore Events" className="font-display text-sm font-bold shadow-lg shadow-primary/25" />
                </Link>
                <Link to="/live-scores">
                  <InteractiveHoverButton text="Live Scores" className="font-display text-sm font-bold border-primary-foreground/20" />
                </Link>
              </div>
            </motion.div>

            {/* Hero Media */}
            {heroVideoUrl && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateY: -5 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                className="mt-10 md:mt-0 flex-1 max-w-md"
              >
                <div className="relative">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 blur-lg" />
                  <div className="relative rounded-2xl overflow-hidden border border-primary-foreground/10 shadow-2xl aspect-video bg-foreground">
                    {/\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?|$)/i.test(heroVideoUrl) ? (
                      <img src={heroVideoUrl} alt="Campus hero" className="h-full w-full object-cover" />
                    ) : (
                      <video autoPlay muted loop playsInline preload="auto" className="h-full w-full object-cover">
                        <source src={heroVideoUrl} type="video/mp4" />
                      </video>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Stats */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4"
          >
            {[
              { icon: Calendar, label: "Events", value: String(events.length), color: "from-primary/20 to-primary/5" },
              { icon: Trophy, label: "Live Matches", value: String(liveMatches.filter(m => m.status === "live").length), color: "from-accent/20 to-accent/5" },
              { icon: Radio, label: "Streaming", value: String(liveEvents.length), color: "from-secondary/20 to-secondary/5" },
              { icon: Users, label: "Active Clubs", value: "10+", color: "from-primary/20 to-primary/5" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="flex items-center gap-3 rounded-xl border border-primary-foreground/8 bg-primary-foreground/5 p-3.5 backdrop-blur-sm"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="h-4.5 w-4.5 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-display text-xl font-black text-primary-foreground">{stat.value}</div>
                  <div className="text-[11px] text-primary-foreground/50 font-medium">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════ QUICK NAV ═══════ */}
      <section className="container -mt-5 relative z-10">
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
          {[
            { to: "/events", icon: Calendar, label: "Events", desc: "Browse all", gradient: "from-primary to-primary/80" },
            { to: "/clubs", icon: Crown, label: "Clubs", desc: "Join a club", gradient: "from-accent to-accent/80" },
            { to: "/live-scores", icon: Trophy, label: "Live Scores", desc: "Real-time", gradient: "from-secondary to-secondary/80" },
            { to: "/register", icon: ArrowRight, label: "Register", desc: "Sign up", gradient: "from-primary to-primary/80" },
            { to: "/notifications", icon: Bell, label: "Alerts", desc: "Stay updated", gradient: "from-destructive to-destructive/80" },
          ].map((item, i) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
            >
              <Link
                to={item.to}
                className="group flex items-center gap-3 rounded-xl border bg-card p-3.5 transition-all hover:shadow-card-hover hover:-translate-y-0.5"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${item.gradient} shadow-sm`}>
                  <item.icon className="h-4.5 w-4.5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <span className="font-display text-sm font-bold block">{item.label}</span>
                  <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════ LIVE SCORES ═══════ */}
      {liveMatches.length > 0 && (
        <section className="container py-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                <Trophy className="h-4 w-4 text-accent" />
              </div>
              <h2 className="font-display text-xl font-bold">Live Scores</h2>
              {liveMatches.some(m => m.status === "live") && (
                <span className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-bold text-destructive">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                  {liveMatches.filter(m => m.status === "live").length} Live
                </span>
              )}
            </div>
            <Link to="/live-scores" className="text-xs font-semibold text-primary hover:underline">
              View all →
            </Link>
          </div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            {liveMatches.slice(0, 6).map((match) => (
              <motion.div key={match.id} variants={fadeUp}>
                <LiveMatchCard match={match} onClick={() => openScorecard(match)} />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* ═══════ LIVE EVENTS ═══════ */}
      {liveEvents.length > 0 && (
        <section className="container py-12">
          <div className="mb-6 flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
            <h2 className="font-display text-xl font-bold">Live Events</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* ═══════ UPCOMING ═══════ */}
      <section className="container py-12">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-display text-xl font-bold">Upcoming Events</h2>
          </div>
          <Link to="/events" className="text-xs font-semibold text-primary hover:underline">View all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </section>

      {/* Scorecard Modal */}
      <AnimatePresence>
        {selectedMatch && (
          <ScorecardDetail
            match={selectedMatch}
            scorecard={scorecard}
            onClose={() => { setSelectedMatch(null); setScorecard([]); }}
          />
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Index;

