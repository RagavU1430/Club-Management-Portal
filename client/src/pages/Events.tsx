import { useState, useEffect, useMemo } from "react";
import { Calendar, MapPin, Search, ArrowRight, Sparkles, Link2, Check } from "lucide-react";
import { apiFetch } from "../utils/api";
import RegistrationModal, { EventItem } from "../components/RegistrationModal";

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState("all");
  const [q, setQ] = useState("");
  const [registerEvent, setRegisterEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ scope, ...(q && { q }) });
    apiFetch(`/api/events?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setEvents(d.data);
        } else {
          setEvents([]);
        }
      })
      .catch(() => {
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, [scope, q]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchScope =
        scope === "all" ||
        (e.computedStatus ? e.computedStatus === scope : true);

      const matchQuery =
        !q ||
        e.title.toLowerCase().includes(q.toLowerCase()) ||
        (e.summary && e.summary.toLowerCase().includes(q.toLowerCase())) ||
        (e.venue && e.venue.toLowerCase().includes(q.toLowerCase()));

      return matchScope && matchQuery;
    });
  }, [events, scope, q]);

  return (
    <main className="relative min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background Glows */}
      <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 h-96 w-full max-w-4xl bg-gradient-to-b from-cyan-500/10 via-purple-600/10 to-transparent blur-3xl" />

      {/* Header */}
      <div className="relative z-10 text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#833ab4]/12 via-[#e1306c]/12 to-[#fcb045]/12 dark:bg-cyan-400/10 border border-[#e1306c]/35 dark:border-cyan-400/30 px-4 py-1.5 text-xs font-mono text-[#c13584] dark:text-cyan-300 mb-4 shadow-sm font-bold">
          <Sparkles className="h-3.5 w-3.5 text-[#e1306c] dark:text-cyan-400" />
          CALENDAR // 2026 EXPEDITIONS
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-slate-900 dark:text-white dark:glow-text">
          Events & Hackathons
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          From 48-hour build hackathons to hands-on AI workshops, explore our gatherings where students code, learn, and innovate with machine learning.
        </p>
      </div>

      {/* Controls: Scope Chips & Search Bar */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {["all", "upcoming", "past"].map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`rounded-xl px-5 py-2 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                scope === s
                  ? "bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] dark:bg-cyan-400 text-white dark:text-black font-bold shadow-md shadow-pink-500/25 scale-[1.02]"
                  : "glass text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20"
              }`}
            >
              {s === "all" ? "All Gatherings" : s}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search topics, venues..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white/90 dark:bg-[#0c1222]/80 backdrop-blur-md py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#e1306c] dark:focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-[#e1306c] shadow-sm transition"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-80 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredEvents.length === 0 && (
        <div className="relative z-10 text-center py-24 rounded-2xl glass border border-slate-200 dark:border-white/10 p-8 shadow-sm">
          <Calendar className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600 mb-4" />
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            {events.length === 0 ? "No Events Scheduled Yet" : "No gatherings found"}
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {events.length === 0
              ? "All previous events have been cleared. Stay tuned! New hackathons, workshops, and gatherings will be announced soon."
              : "No events match your current filter or query. Try resetting filters."}
          </p>
          {(scope !== "all" || q) && (
            <button
              onClick={() => {
                setScope("all");
                setQ("");
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-pink-500/15 dark:bg-cyan-400/20 border border-pink-500/30 dark:border-cyan-400/40 px-5 py-2 text-xs font-mono text-[#c13584] dark:text-cyan-300 hover:bg-gradient-to-r hover:from-[#833ab4] hover:to-[#e1306c] hover:text-white transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Events Grid */}
      {!loading && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => (
            <EventCard
              key={evt.id}
              event={evt}
              onRegister={() => setRegisterEvent(evt)}
            />
          ))}
        </div>
      )}

      {/* Registration Form Modal */}
      {registerEvent && (
        <RegistrationModal
          event={registerEvent}
          onClose={() => setRegisterEvent(null)}
        />
      )}
    </main>
  );
}

function EventCard({
  event,
  onRegister,
}: {
  event: EventItem;
  onRegister: () => void;
}) {
  const dateObj = new Date(event.date);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const isPast = event.computedStatus === "past";
  const [copied, setCopied] = useState(false);

  async function copyRegisterLink(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `${window.location.origin}/events/${encodeURIComponent(event.slug || String(event.id))}/register`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      onClick={onRegister}
      className="group relative rounded-2xl glass p-6 border border-slate-200/80 dark:border-white/10 hover:border-pink-500/50 dark:hover:border-cyan-400/40 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 shadow-sm hover:shadow-xl hover:shadow-pink-500/10 dark:hover:shadow-cyan-950/10 overflow-hidden cursor-pointer"
    >
      {/* Top Instagram rainbow bar on hover */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div>
        {/* Chips */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="rounded-full bg-pink-500/10 dark:bg-cyan-400/10 border border-pink-500/20 dark:border-cyan-400/20 px-3 py-0.5 text-xs font-mono text-[#c13584] dark:text-cyan-300 font-semibold">
            {event.category || "Hackathon"}
          </span>

          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-mono capitalize ${
              isPast
                ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {isPast ? "Concluded" : "Upcoming"}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#c13584] dark:group-hover:text-cyan-300 transition-colors leading-snug">
          {event.title}
        </h3>

        {/* Description */}
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
          {event.summary || event.description}
        </p>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#e1306c] dark:text-cyan-400" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1.5 truncate max-w-[150px]">
            <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            {event.venue || "Virtual / Campus"}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRegister();
          }}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer ${
            isPast
              ? "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white"
              : "bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] dark:from-cyan-500 dark:to-blue-600 text-white font-bold shadow-md shadow-pink-500/25 dark:shadow-cyan-500/25 hover:scale-[1.02]"
          }`}
        >
          {isPast ? "View Agenda & Details" : "View Agenda & Register"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>

        {!isPast && (
          <button
            type="button"
            onClick={copyRegisterLink}
            title="Copy direct registration link to share"
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:text-[#c13584] dark:hover:text-cyan-300 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Link copied!</span>
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                Copy registration link
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}


