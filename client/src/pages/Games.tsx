import { useState, useEffect, useCallback } from "react";
import {
  Gamepad2,
  Users,
  Mail,
  ShieldCheck,
  Play,
  ArrowLeft,
  Loader2,
  Hourglass,
  Trophy,
  Maximize2,
} from "lucide-react";
import { apiFetch } from "../utils/api";
import type { GameRecord } from "../services/supabaseService";

interface VerifiedAccess {
  teamName: string;
  email: string;
  eventId: number | null;
  eventTitle: string;
}

const ACCESS_KEY = "aif_games_access";

function loadAccess(): VerifiedAccess | null {
  try {
    const raw = sessionStorage.getItem(ACCESS_KEY);
    return raw ? (JSON.parse(raw) as VerifiedAccess) : null;
  } catch {
    return null;
  }
}

export default function Games() {
  const [access, setAccess] = useState<VerifiedAccess | null>(() => loadAccess());
  const [teamName, setTeamName] = useState("");
  const [email, setEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyErr, setVerifyErr] = useState("");
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);
  const [gamesErr, setGamesErr] = useState("");
  const [activeGame, setActiveGame] = useState<GameRecord | null>(null);

  const fetchGames = useCallback(async (silent = false) => {
    if (!silent) setLoadingGames(true);
    if (!silent) setGamesErr("");
    try {
      const res = await apiFetch("/api/games");
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.error || d.message || "Could not load games.");
      setGames(Array.isArray(d.data) ? d.data : []);
    } catch (err: any) {
      if (silent) return;
      const msg = String(err?.message || "");
      if (msg.includes("games") && (msg.includes("does not exist") || msg.includes("Could not find") || msg.includes("relation"))) {
        setGamesErr("Games are not set up yet. Please ask the admin to run the latest database migration.");
      } else {
        setGamesErr(msg || "Could not load games.");
      }
      setGames([]);
    } finally {
      if (!silent) setLoadingGames(false);
    }
  }, []);

  useEffect(() => {
    if (!access) return;
    fetchGames();
    // Poll so players see the moment the host starts a game
    const poll = setInterval(() => fetchGames(true), 10000);
    return () => clearInterval(poll);
  }, [access, fetchGames]);

  // If the host stops a game mid-play, return the player to the arena
  useEffect(() => {
    if (!activeGame || games.length === 0) return;
    const current = games.find((g) => g.id === activeGame.id);
    if (current && Number(current.is_live ?? 0) !== 1) {
      setActiveGame(null);
    }
  }, [games, activeGame]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifyErr("");
    const cleanTeam = teamName.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanTeam || !cleanEmail) {
      setVerifyErr("Please enter both your team name and registered mail ID.");
      return;
    }
    setVerifying(true);
    try {
      const res = await apiFetch("/api/events/lookup-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const d = await res.json();
      const tickets: any[] = Array.isArray(d?.data) ? d.data : [];
      const match = tickets.find(
        (t) => String(t.teamName || t.team_name || "").trim().toLowerCase() === cleanTeam.toLowerCase()
      );
      if (!match) {
        throw new Error(
          "Please enter the correct details to enter the game arena. The team name and mail ID must match your event registration."
        );
      }
      const verified: VerifiedAccess = {
        teamName: String(match.teamName || match.team_name || cleanTeam),
        email: cleanEmail,
        eventId: match.event_id !== undefined && match.event_id !== null ? Number(match.event_id) : null,
        eventTitle: String(match.eventTitle || match.event_title || "Club Event"),
      };
      try {
        sessionStorage.setItem(ACCESS_KEY, JSON.stringify(verified));
      } catch {}
      setAccess(verified);
    } catch (err: any) {
      setVerifyErr(err?.message || "Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  const visibleGames = games.filter((g) => {
    const active = Number(g.is_active ?? 1) === 1;
    if (!active) return false;
    if (g.event_id === null || g.event_id === undefined) return true;
    if (access?.eventId === null || access?.eventId === undefined) return true;
    return Number(g.event_id) === Number(access?.eventId);
  });

  return (
    <main className="relative min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background Glows */}
      <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 h-96 w-full max-w-4xl bg-gradient-to-b from-cyan-500/10 via-purple-600/10 to-transparent blur-3xl" />

      {/* Header */}
      <div className="relative z-10 text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#833ab4]/12 via-[#e1306c]/12 to-[#fcb045]/12 dark:bg-cyan-400/10 border border-[#e1306c]/35 dark:border-cyan-400/30 px-4 py-1.5 text-xs font-mono text-[#c13584] dark:text-cyan-300 mb-4 shadow-sm font-bold">
          <Gamepad2 className="h-3.5 w-3.5 text-[#e1306c] dark:text-cyan-400" />
          GAME ARENA // REGISTERED PLAYERS ONLY
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-slate-900 dark:text-white dark:glow-text">
          Event Games
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          Enter your team name and registered mail ID to unlock the games arena for your event.
        </p>
      </div>

      {/* ── Step 1: Verification ── */}
      {!access && (
        <div className="relative z-10 max-w-md mx-auto">
          <div className="glass rounded-3xl p-8 border border-slate-200/80 dark:border-white/10 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-mono text-cyan-700 dark:text-cyan-300 tracking-wider font-semibold">
                PLAYER VERIFICATION
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              Unlock the Arena
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Use the same team name and mail ID from your event registration.
            </p>

            <form onSubmit={handleVerify} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
                  TEAM NAME
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
                  REGISTERED MAIL ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter registered mail ID"
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {verifyErr && (
                <div className="rounded-xl bg-red-500/10 dark:bg-red-950/40 border border-red-500/30 p-3 text-xs leading-relaxed text-red-600 dark:text-red-300">
                  {verifyErr}
                </div>
              )}

              <button
                type="submit"
                disabled={verifying}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] dark:from-cyan-500 dark:to-blue-600 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
              >
                {verifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Gamepad2 className="h-4 w-4" />
                )}
                {verifying ? "Verifying..." : "Enter Game Arena"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Step 2: Games Arena ── */}
      {access && !activeGame && (
        <div className="relative z-10">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl glass border border-emerald-500/25 dark:border-emerald-400/25 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  Welcome, {access.teamName}!
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verified for {access.eventTitle} • {access.email}
                </p>
              </div>
            </div>
          </div>

          {loadingGames && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-64 rounded-2xl" />
              ))}
            </div>
          )}

          {!loadingGames && gamesErr && (
            <div className="text-center py-16 rounded-2xl glass border border-amber-500/30 p-8">
              <Gamepad2 className="mx-auto h-10 w-10 text-amber-500 mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">{gamesErr}</p>
            </div>
          )}

          {!loadingGames && !gamesErr && visibleGames.length === 0 && (
            <div className="text-center py-16 rounded-2xl glass border border-slate-200 dark:border-white/10 p-8">
              <Gamepad2 className="mx-auto h-10 w-10 text-slate-400 mb-3" />
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                No Games Added Yet
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                The games for your event will appear here soon. Please check back later!
              </p>
            </div>
          )}

          {!loadingGames && !gamesErr && visibleGames.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleGames.map((g, idx) => {
                const live = Number(g.is_live ?? 0) === 1;
                const playable = live && g.game_url;
                return (
                <div
                  key={g.id}
                  className="group relative rounded-3xl overflow-hidden glass border border-slate-200 dark:border-white/10 hover:border-[#e1306c]/50 dark:hover:border-cyan-400/50 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] opacity-0 group-hover:opacity-100 transition" />
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] dark:from-cyan-500 dark:to-blue-600 text-white font-display font-black text-lg shadow-md">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="flex items-center gap-2">
                      {live ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-red-600 dark:text-red-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                          LIVE
                        </span>
                      ) : (
                        <Gamepad2 className="h-5 w-5 text-slate-300 dark:text-slate-600 group-hover:text-[#e1306c] dark:group-hover:text-cyan-400 transition" />
                      )}
                    </div>
                  </div>
                  <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {g.title}
                  </h3>
                  {g.description && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                      {g.description}
                    </p>
                  )}
                  {playable ? (
                    <button
                      onClick={() => setActiveGame(g)}
                      className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] dark:from-cyan-500 dark:to-blue-600 py-2.5 text-sm font-bold text-white shadow-md transition hover:scale-[1.02] cursor-pointer"
                    >
                      <Play className="h-4 w-4" />
                      Play Now
                    </button>
                  ) : (
                    <div className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/15 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      <Hourglass className="h-4 w-4 animate-pulse" />
                      {!g.game_url ? "Coming Soon" : "Wait for host to start the game"}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Play view ── */}
      {access && activeGame && (
        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setActiveGame(null)}
              className="inline-flex items-center gap-2 rounded-xl glass px-4 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-white/10 transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              All Games
            </button>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate">
              Playing as <strong className="text-slate-800 dark:text-white">{access.teamName}</strong>
            </span>
          </div>

          <div className="overflow-hidden rounded-3xl glass border border-slate-200 dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-white/10">
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {activeGame.title}
              </h2>
              <a
                href={activeGame.game_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-white/5 px-3 py-1.5 text-xs font-mono text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Fullscreen
              </a>
            </div>
            <div className="relative bg-black" style={{ height: "min(72vh, 720px)" }}>
              <iframe
                key={activeGame.id}
                src={activeGame.game_url}
                title={activeGame.title}
                allow="fullscreen; autoplay; gamepad"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
