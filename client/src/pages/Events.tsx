import { useState, useEffect, useMemo } from "react";
import { Calendar, MapPin, Search, ArrowRight, Sparkles } from "lucide-react";
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
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 border border-cyan-400/30 px-4 py-1.5 text-xs font-mono text-cyan-300 mb-4 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          CALENDAR // 2026 EXPEDITIONS
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-white glow-text">
          Events & Hackathons
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
          From 48-hour build hackathons to hands-on AI workshops, explore our gatherings where students code, learn, and innovate with machine learning.
        </p>
      </div>

      {/* Controls: Scope Chips & Search Bar */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {["all", "upcoming", "past"].map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`rounded-xl px-5 py-2 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                scope === s
                  ? "bg-cyan-400 text-black font-bold shadow-md shadow-cyan-500/25"
                  : "glass text-slate-300 hover:text-white hover:border-white/20"
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
            className="w-full rounded-xl border border-white/10 bg-[#0c1222]/80 backdrop-blur-md py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 shadow-sm transition"
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
        <div className="relative z-10 text-center py-24 rounded-2xl glass border border-white/10 p-8 shadow-sm">
          <Calendar className="mx-auto h-12 w-12 text-slate-600 mb-4" />
          <h3 className="font-display text-xl font-bold text-white">
            {events.length === 0 ? "No Events Scheduled Yet" : "No gatherings found"}
          </h3>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
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
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400/20 border border-cyan-400/40 px-5 py-2 text-xs font-mono text-cyan-300 hover:bg-cyan-400 hover:text-black transition cursor-pointer"
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

  return (
    <div className="group relative rounded-2xl glass p-6 border border-white/10 hover:border-cyan-400/40 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 shadow-sm hover:shadow-xl hover:shadow-cyan-950/20 overflow-hidden">
      {/* Top ambient highlight */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Chips */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-0.5 text-xs font-mono text-cyan-300">
            {event.category || "Hackathon"}
          </span>

          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-mono capitalize ${
              isPast
                ? "bg-slate-800 text-slate-400"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {isPast ? "Concluded" : "Upcoming"}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-xl font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
          {event.title}
        </h3>

        {/* Description */}
        <p className="mt-3 text-sm text-slate-300 line-clamp-3 leading-relaxed">
          {event.summary || event.description}
        </p>
      </div>

      <div className="mt-6 pt-5 border-t border-white/5 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-cyan-400" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1.5 truncate max-w-[150px]">
            <MapPin className="h-3.5 w-3.5 text-slate-500" />
            {event.venue || "Virtual / Campus"}
          </span>
        </div>

        <button
          onClick={onRegister}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer ${
            isPast
              ? "bg-white/5 text-slate-400 hover:text-white"
              : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-md shadow-cyan-500/25 hover:scale-[1.02]"
          }`}
        >
          {isPast ? "View Details" : "Register Now"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}


