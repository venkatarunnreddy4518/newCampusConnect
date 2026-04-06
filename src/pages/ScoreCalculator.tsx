import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/database/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trophy, Plus, Trash2, Save, RotateCcw, ArrowRightLeft, CircleDot,
  Users, ChevronDown,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  id?: string;
  match_id: string;
  team: string;
  player_name: string;
  role: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strike_rate: number;
  overs_bowled: string | null;
  maidens: number;
  runs_conceded: number;
  wickets_taken: number;
  economy: number;
  dismissal: string | null;
  batting_order: number;
}

const FORMATS = [
  { value: "T20", label: "T20 (20 Overs)", maxOvers: 20 },
  { value: "ODI", label: "ODI (50 Overs)", maxOvers: 50 },
  { value: "T10", label: "T10 (10 Overs)", maxOvers: 10 },
  { value: "Test", label: "Test Match", maxOvers: 999 },
];

const ScoreCalculator = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<LiveMatch | null>(null);
  const [creating, setCreating] = useState(false);
  const [newMatch, setNewMatch] = useState({ team_a: "", team_b: "", sport: "Cricket", match_format: "T20" });
  const [scorecardTab, setScorecardTab] = useState<string>("batting");
  const [scorecardEntries, setScorecardEntries] = useState<ScorecardEntry[]>([]);
  const [newPlayer, setNewPlayer] = useState({ name: "", role: "batsman", team: "A" });

  const fetchMatches = async () => {
    const { data } = await supabase
      .from("live_matches")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setMatches(data as LiveMatch[]);
  };

  useEffect(() => { fetchMatches(); }, []);

  const createMatch = async () => {
    if (!newMatch.team_a || !newMatch.team_b) { toast.error("Enter both team names"); return; }
    const { data, error } = await supabase.from("live_matches").insert({
      team_a: newMatch.team_a,
      team_b: newMatch.team_b,
      sport: newMatch.sport,
      match_format: newMatch.match_format,
      status: "live",
      created_by: user?.id,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    toast.success("Match created!");
    setCreating(false);
    setNewMatch({ team_a: "", team_b: "", sport: "Cricket", match_format: "T20" });
    fetchMatches();
    if (data) setSelectedMatch(data as LiveMatch);
  };

  const updateMatch = async (updates: Partial<LiveMatch>) => {
    if (!selectedMatch) return;
    const { error } = await supabase
      .from("live_matches")
      .update(updates)
      .eq("id", selectedMatch.id);
    if (error) { toast.error(error.message); return; }
    setSelectedMatch({ ...selectedMatch, ...updates } as LiveMatch);
  };

  const addRuns = (runs: number) => {
    if (!selectedMatch) return;
    const isTeamA = selectedMatch.batting_team === "A";
    const scoreKey = isTeamA ? "score_a" : "score_b";
    const oversKey = isTeamA ? "overs_a" : "overs_b";
    const currentScore = isTeamA ? selectedMatch.score_a : selectedMatch.score_b;
    const currentOvers = isTeamA ? selectedMatch.overs_a : selectedMatch.overs_b;
    const newOvers = incrementOvers(currentOvers);
    updateMatch({ [scoreKey]: currentScore + runs, [oversKey]: newOvers } as any);
  };

  const addExtra = (type: string) => {
    if (!selectedMatch) return;
    const isTeamA = selectedMatch.batting_team === "A";
    const scoreKey = isTeamA ? "score_a" : "score_b";
    const extrasKey = isTeamA ? "extras_a" : "extras_b";
    const currentScore = isTeamA ? selectedMatch.score_a : selectedMatch.score_b;
    const currentExtras = isTeamA ? selectedMatch.extras_a : selectedMatch.extras_b;
    const updates: any = { [scoreKey]: currentScore + 1, [extrasKey]: currentExtras + 1 };
    if (type === "wide" || type === "noball") {
      // Wide and no-ball don't count as legal deliveries
    } else {
      const oversKey = isTeamA ? "overs_a" : "overs_b";
      const currentOvers = isTeamA ? selectedMatch.overs_a : selectedMatch.overs_b;
      updates[oversKey] = incrementOvers(currentOvers);
    }
    updateMatch(updates);
  };

  const addWicket = () => {
    if (!selectedMatch) return;
    const isTeamA = selectedMatch.batting_team === "A";
    const wicketsKey = isTeamA ? "wickets_a" : "wickets_b";
    const oversKey = isTeamA ? "overs_a" : "overs_b";
    const currentWickets = isTeamA ? selectedMatch.wickets_a : selectedMatch.wickets_b;
    const currentOvers = isTeamA ? selectedMatch.overs_a : selectedMatch.overs_b;
    updateMatch({ [wicketsKey]: currentWickets + 1, [oversKey]: incrementOvers(currentOvers) } as any);
  };

  const switchInnings = () => {
    if (!selectedMatch) return;
    const newBatting = selectedMatch.batting_team === "A" ? "B" : "A";
    updateMatch({ batting_team: newBatting });
    toast.success(`Now batting: ${newBatting === "A" ? selectedMatch.team_a : selectedMatch.team_b}`);
  };

  const endMatch = () => {
    if (!selectedMatch) return;
    updateMatch({ status: "completed" });
    toast.success("Match ended!");
  };

  const deleteMatch = async (id: string) => {
    if (!confirm("Delete this match?")) return;
    const { error } = await supabase.from("live_matches").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Match deleted");
    if (selectedMatch?.id === id) setSelectedMatch(null);
    fetchMatches();
  };

  const incrementOvers = (current: string): string => {
    const parts = current.split(".");
    let whole = parseInt(parts[0]) || 0;
    let balls = parseInt(parts[1]) || 0;
    balls += 1;
    if (balls >= 6) { whole += 1; balls = 0; }
    return `${whole}.${balls}`;
  };

  const resetMatch = () => {
    if (!selectedMatch || !confirm("Reset all scores?")) return;
    updateMatch({
      score_a: 0, score_b: 0, wickets_a: 0, wickets_b: 0,
      overs_a: "0.0", overs_b: "0.0", extras_a: 0, extras_b: 0,
      batting_team: "A", status: "live",
    });
    toast.success("Match reset!");
  };

  // Scorecard management
  const fetchScorecard = async (matchId: string) => {
    const { data } = await supabase
      .from("match_scorecard")
      .select("*")
      .eq("match_id", matchId)
      .order("batting_order");
    if (data) setScorecardEntries(data as ScorecardEntry[]);
  };

  useEffect(() => {
    if (selectedMatch) fetchScorecard(selectedMatch.id);
  }, [selectedMatch?.id]);

  const addScorecardEntry = async () => {
    if (!selectedMatch || !newPlayer.name) { toast.error("Enter player name"); return; }
    const team = newPlayer.team === "A" ? selectedMatch.team_a : selectedMatch.team_b;
    const { error } = await supabase.from("match_scorecard").insert({
      match_id: selectedMatch.id,
      team,
      player_name: newPlayer.name,
      role: newPlayer.role,
      batting_order: scorecardEntries.filter(e => e.team === team).length + 1,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Player added!");
    setNewPlayer({ name: "", role: "batsman", team: newPlayer.team });
    fetchScorecard(selectedMatch.id);
  };

  const updateScorecardEntry = async (id: string, updates: Partial<ScorecardEntry>) => {
    const { error } = await supabase.from("match_scorecard").update(updates).eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (selectedMatch) fetchScorecard(selectedMatch.id);
  };

  const deleteScorecardEntry = async (id: string) => {
    const { error } = await supabase.from("match_scorecard").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    if (selectedMatch) fetchScorecard(selectedMatch.id);
  };

  const getRunRate = (score: number, overs: string) => {
    const parts = overs.split(".");
    const totalOvers = parseInt(parts[0]) + (parseInt(parts[1]) || 0) / 6;
    return totalOvers > 0 ? (score / totalOvers).toFixed(2) : "0.00";
  };

  const battingTeamName = selectedMatch
    ? selectedMatch.batting_team === "A" ? selectedMatch.team_a : selectedMatch.team_b
    : "";

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-7 w-7 text-accent" />
            <h1 className="font-display text-3xl font-bold">Score Calculator</h1>
          </div>
          <Button onClick={() => setCreating(!creating)} variant={creating ? "outline" : "default"}>
            <Plus className="h-4 w-4 mr-1" /> New Match
          </Button>
        </div>

        {/* Create match form */}
        {creating && (
          <div className="mb-6 rounded-xl border bg-card p-6 shadow-card">
            <h3 className="font-display text-lg font-semibold mb-4">Create New Match</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Team 1 Name</label>
                <Input value={newMatch.team_a} onChange={e => setNewMatch({ ...newMatch, team_a: e.target.value })} placeholder="e.g. India" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Team 2 Name</label>
                <Input value={newMatch.team_b} onChange={e => setNewMatch({ ...newMatch, team_b: e.target.value })} placeholder="e.g. Australia" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Sport</label>
                <Input value={newMatch.sport} onChange={e => setNewMatch({ ...newMatch, sport: e.target.value })} placeholder="Cricket" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Match Format</label>
                <Select value={newMatch.match_format} onValueChange={v => setNewMatch({ ...newMatch, match_format: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="mt-4" onClick={createMatch}><Plus className="h-4 w-4 mr-1" /> Create Match</Button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Match list sidebar */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Matches</h3>
            {matches.length === 0 && <p className="text-sm text-muted-foreground">No matches yet.</p>}
            {matches.map(m => (
              <div
                key={m.id}
                onClick={() => setSelectedMatch(m)}
                className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                  selectedMatch?.id === m.id ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    m.status === "live" ? "bg-destructive text-destructive-foreground" :
                    m.status === "completed" ? "bg-secondary text-secondary-foreground" :
                    "bg-muted text-muted-foreground"
                  }`}>{m.status}</span>
                  <button onClick={e => { e.stopPropagation(); deleteMatch(m.id); }} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-2 font-display font-bold text-sm">{m.team_a} vs {m.team_b}</p>
                <p className="text-xs text-muted-foreground">{m.sport} · {m.match_format}</p>
              </div>
            ))}
          </div>

          {/* Score calculator */}
          {selectedMatch ? (
            <div className="space-y-6">
              {/* Scoreboard */}
              <div className="rounded-xl border bg-primary/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {selectedMatch.sport} · {selectedMatch.match_format}
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedMatch.status === "live" && (
                      <span className="flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Team A */}
                  <div className={`rounded-xl border p-5 transition-colors ${selectedMatch.batting_team === "A" ? "border-primary bg-primary/10" : "bg-card"}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-bold">{selectedMatch.team_a}</h3>
                      {selectedMatch.batting_team === "A" && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Batting</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="font-display text-4xl font-bold">{selectedMatch.score_a}</span>
                      <span className="text-xl text-muted-foreground">/ {selectedMatch.wickets_a}</span>
                      <span className="ml-auto text-sm text-muted-foreground">{selectedMatch.overs_a} overs</span>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>Run Rate: <strong>{getRunRate(selectedMatch.score_a, selectedMatch.overs_a)}</strong></span>
                      <span>Extras: <strong>{selectedMatch.extras_a}</strong></span>
                    </div>
                  </div>

                  {/* Team B */}
                  <div className={`rounded-xl border p-5 transition-colors ${selectedMatch.batting_team === "B" ? "border-primary bg-primary/10" : "bg-card"}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-bold">{selectedMatch.team_b}</h3>
                      {selectedMatch.batting_team === "B" && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Batting</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="font-display text-4xl font-bold">{selectedMatch.score_b}</span>
                      <span className="text-xl text-muted-foreground">/ {selectedMatch.wickets_b}</span>
                      <span className="ml-auto text-sm text-muted-foreground">{selectedMatch.overs_b} overs</span>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>Run Rate: <strong>{getRunRate(selectedMatch.score_b, selectedMatch.overs_b)}</strong></span>
                      <span>Extras: <strong>{selectedMatch.extras_b}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Match status bar */}
                {selectedMatch.status === "live" && (
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2 text-sm">
                    <span><strong>Batting:</strong> {battingTeamName}</span>
                    {selectedMatch.batting_team === "B" && selectedMatch.score_a > 0 && (
                      <span>
                        Required: <strong>
                          {Math.max(0, selectedMatch.score_a - selectedMatch.score_b + 1)} runs
                        </strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Batting Controls - only for live matches */}
              {selectedMatch.status === "live" && (
                <div className="rounded-xl border bg-card p-6 shadow-card">
                  <h3 className="font-display text-lg font-semibold mb-4">Batting Controls</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                    {[0, 1, 2, 3, 4, 6].map(r => (
                      <Button key={r} variant="outline" className="h-12 text-base font-bold" onClick={() => addRuns(r)}>
                        {r} {r === 1 ? "Run" : "Runs"}
                      </Button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <Button variant="destructive" className="h-12 font-bold" onClick={addWicket}>
                      <CircleDot className="h-4 w-4 mr-1" /> Wicket
                    </Button>
                    <Button variant="outline" className="h-12 font-bold" onClick={() => addExtra("wide")}>
                      Wide
                    </Button>
                    <Button variant="outline" className="h-12 font-bold" onClick={() => addExtra("noball")}>
                      No Ball
                    </Button>
                    <Button variant="outline" className="h-12 font-bold" onClick={() => addExtra("bye")}>
                      Bye/Leg Bye
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={switchInnings}>
                      <ArrowRightLeft className="h-4 w-4 mr-1" /> Switch Innings
                    </Button>
                    <Button variant="outline" onClick={resetMatch}>
                      <RotateCcw className="h-4 w-4 mr-1" /> Reset
                    </Button>
                    <Button variant="destructive" onClick={endMatch}>
                      End Match
                    </Button>
                  </div>
                </div>
              )}

              {/* Scorecard Section */}
              <div className="rounded-xl border bg-card p-6 shadow-card">
                <h3 className="font-display text-lg font-semibold mb-4">Scorecard</h3>
                
                {/* Add player */}
                <div className="flex flex-wrap gap-3 mb-4 items-end">
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-xs font-medium text-muted-foreground">Player Name</label>
                    <Input value={newPlayer.name} onChange={e => setNewPlayer({ ...newPlayer, name: e.target.value })} placeholder="Player name" />
                  </div>
                  <div className="w-32">
                    <label className="text-xs font-medium text-muted-foreground">Team</label>
                    <Select value={newPlayer.team} onValueChange={v => setNewPlayer({ ...newPlayer, team: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">{selectedMatch.team_a}</SelectItem>
                        <SelectItem value="B">{selectedMatch.team_b}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32">
                    <label className="text-xs font-medium text-muted-foreground">Role</label>
                    <Select value={newPlayer.role} onValueChange={v => setNewPlayer({ ...newPlayer, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="batsman">Batsman</SelectItem>
                        <SelectItem value="bowler">Bowler</SelectItem>
                        <SelectItem value="all-rounder">All-rounder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addScorecardEntry}><Plus className="h-4 w-4 mr-1" /> Add</Button>
                </div>

                {/* Scorecard tabs by team */}
                <Tabs defaultValue={selectedMatch.team_a}>
                  <TabsList className="w-full">
                    <TabsTrigger value={selectedMatch.team_a} className="flex-1">{selectedMatch.team_a}</TabsTrigger>
                    <TabsTrigger value={selectedMatch.team_b} className="flex-1">{selectedMatch.team_b}</TabsTrigger>
                  </TabsList>
                  {[selectedMatch.team_a, selectedMatch.team_b].map(team => {
                    const teamEntries = scorecardEntries.filter(e => e.team === team);
                    const batsmen = teamEntries.filter(e => e.role === "batsman" || e.role === "all-rounder");
                    const bowlers = teamEntries.filter(e => e.role === "bowler" || e.role === "all-rounder");
                    return (
                      <TabsContent key={team} value={team}>
                        {/* Batting table */}
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold mb-2">Batting</h4>
                          {batsmen.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No batting entries</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b text-muted-foreground">
                                    <th className="py-2 text-left font-medium">Player</th>
                                    <th className="py-2 text-right font-medium w-14">R</th>
                                    <th className="py-2 text-right font-medium w-14">B</th>
                                    <th className="py-2 text-right font-medium w-14">4s</th>
                                    <th className="py-2 text-right font-medium w-14">6s</th>
                                    <th className="py-2 text-right font-medium w-16">S/R</th>
                                    <th className="py-2 text-left font-medium w-24">Dismissal</th>
                                    <th className="py-2 w-8"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {batsmen.map(entry => (
                                    <tr key={entry.id} className="border-b last:border-0">
                                      <td className="py-2 font-medium">{entry.player_name}</td>
                                      <td className="py-2 text-right">
                                        <Input type="number" className="h-7 w-14 text-right text-xs" value={entry.runs}
                                          onChange={e => updateScorecardEntry(entry.id!, { runs: parseInt(e.target.value) || 0, strike_rate: entry.balls > 0 ? parseFloat(((parseInt(e.target.value) || 0) / entry.balls * 100).toFixed(2)) : 0 })} />
                                      </td>
                                      <td className="py-2 text-right">
                                        <Input type="number" className="h-7 w-14 text-right text-xs" value={entry.balls}
                                          onChange={e => updateScorecardEntry(entry.id!, { balls: parseInt(e.target.value) || 0, strike_rate: (parseInt(e.target.value) || 0) > 0 ? parseFloat((entry.runs / (parseInt(e.target.value) || 1) * 100).toFixed(2)) : 0 })} />
                                      </td>
                                      <td className="py-2 text-right">
                                        <Input type="number" className="h-7 w-14 text-right text-xs" value={entry.fours}
                                          onChange={e => updateScorecardEntry(entry.id!, { fours: parseInt(e.target.value) || 0 })} />
                                      </td>
                                      <td className="py-2 text-right">
                                        <Input type="number" className="h-7 w-14 text-right text-xs" value={entry.sixes}
                                          onChange={e => updateScorecardEntry(entry.id!, { sixes: parseInt(e.target.value) || 0 })} />
                                      </td>
                                      <td className="py-2 text-right text-xs">{entry.strike_rate}</td>
                                      <td className="py-2">
                                        <Input className="h-7 w-24 text-xs" value={entry.dismissal || ""} placeholder="not out"
                                          onChange={e => updateScorecardEntry(entry.id!, { dismissal: e.target.value || null })} />
                                      </td>
                                      <td className="py-2">
                                        <button onClick={() => deleteScorecardEntry(entry.id!)} className="text-muted-foreground hover:text-destructive">
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Bowling table */}
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Bowling</h4>
                          {bowlers.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No bowling entries. Add players with "bowler" or "all-rounder" role.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b text-muted-foreground">
                                    <th className="py-2 text-left font-medium">Bowler</th>
                                    <th className="py-2 text-right font-medium w-14">O</th>
                                    <th className="py-2 text-right font-medium w-14">M</th>
                                    <th className="py-2 text-right font-medium w-14">R</th>
                                    <th className="py-2 text-right font-medium w-14">W</th>
                                    <th className="py-2 text-right font-medium w-16">Econ</th>
                                    <th className="py-2 w-8"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bowlers.map(entry => (
                                    <tr key={entry.id} className="border-b last:border-0">
                                      <td className="py-2 font-medium">{entry.player_name}</td>
                                      <td className="py-2 text-right">
                                        <Input className="h-7 w-14 text-right text-xs" value={entry.overs_bowled || "0"}
                                          onChange={e => {
                                            const overs = parseFloat(e.target.value) || 0;
                                            updateScorecardEntry(entry.id!, { overs_bowled: e.target.value, economy: overs > 0 ? parseFloat((entry.runs_conceded / overs).toFixed(2)) : 0 });
                                          }} />
                                      </td>
                                      <td className="py-2 text-right">
                                        <Input type="number" className="h-7 w-14 text-right text-xs" value={entry.maidens}
                                          onChange={e => updateScorecardEntry(entry.id!, { maidens: parseInt(e.target.value) || 0 })} />
                                      </td>
                                      <td className="py-2 text-right">
                                        <Input type="number" className="h-7 w-14 text-right text-xs" value={entry.runs_conceded}
                                          onChange={e => {
                                            const runs = parseInt(e.target.value) || 0;
                                            const overs = parseFloat(entry.overs_bowled || "0") || 0;
                                            updateScorecardEntry(entry.id!, { runs_conceded: runs, economy: overs > 0 ? parseFloat((runs / overs).toFixed(2)) : 0 });
                                          }} />
                                      </td>
                                      <td className="py-2 text-right">
                                        <Input type="number" className="h-7 w-14 text-right text-xs" value={entry.wickets_taken}
                                          onChange={e => updateScorecardEntry(entry.id!, { wickets_taken: parseInt(e.target.value) || 0 })} />
                                      </td>
                                      <td className="py-2 text-right text-xs">{entry.economy}</td>
                                      <td className="py-2">
                                        <button onClick={() => deleteScorecardEntry(entry.id!)} className="text-muted-foreground hover:text-destructive">
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-12 text-center shadow-card">
              <Trophy className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="font-display text-lg font-semibold">Select a Match</h3>
              <p className="text-sm text-muted-foreground mt-1">Choose a match from the list or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ScoreCalculator;

