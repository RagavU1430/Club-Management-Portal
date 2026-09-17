import { useState, useEffect, useMemo } from "react";
import { Calendar, MapPin, Search, ArrowRight, Sparkles, X, Loader2, CheckCircle2, User, Mail, Phone, School, Hash } from "lucide-react";

interface EventItem {
  id: string | number;
  title: string;
  summary?: string;
  description?: string;
  date: string;
  venue?: string;
  image?: string;
  slug?: string;
  registrationLink?: string;
  status?: string;
  computedStatus?: string;
  category?: string;
}

export default function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState("all");
  const [q, setQ] = useState("");
  const [registerEvent, setRegisterEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ scope, ...(q && { q }) });
    fetch(`/api/events?${params}`)
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
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 dark:bg-cyan-400/10 border border-cyan-500/30 dark:border-cyan-400/30 px-4 py-1.5 text-xs font-mono text-cyan-700 dark:text-cyan-300 mb-4 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
          CALENDAR // 2026 EXPEDITIONS
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-slate-900 dark:text-white glow-text transition-colors">
          Events & Hackathons
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed transition-colors">
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
                  ? "bg-cyan-500 dark:bg-cyan-400 text-white dark:text-black font-bold shadow-md shadow-cyan-500/25"
                  : "glass text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20"
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
            className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0c1222]/80 backdrop-blur-md py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 shadow-sm transition"
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
        <div className="relative z-10 text-center py-24 rounded-2xl glass border border-slate-200/80 dark:border-white/10 p-8 shadow-sm">
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
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500/10 dark:bg-cyan-400/20 border border-cyan-500/30 dark:border-cyan-400/40 px-5 py-2 text-xs font-mono text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500 dark:hover:bg-cyan-400 hover:text-white dark:hover:text-black transition cursor-pointer"
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
    <div className="group relative rounded-2xl glass p-6 border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-400/40 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 shadow-sm hover:shadow-xl dark:hover:shadow-cyan-950/20 overflow-hidden">
      {/* Top ambient highlight */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/40 dark:via-cyan-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Chips */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="rounded-full bg-cyan-500/10 dark:bg-cyan-400/10 border border-cyan-500/20 dark:border-cyan-400/20 px-3 py-0.5 text-xs font-mono text-cyan-700 dark:text-cyan-300">
            {event.category || "Hackathon"}
          </span>

          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-mono capitalize ${
              isPast
                ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            }`}
          >
            {isPast ? "Concluded" : "Upcoming"}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors leading-snug">
          {event.title}
        </h3>

        {/* Description */}
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed transition-colors">
          {event.summary || event.description}
        </p>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            {formattedDate}
          </span>
          <span className="flex items-center gap-1.5 truncate max-w-[150px]">
            <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            {event.venue || "Virtual / Campus"}
          </span>
        </div>

        <button
          onClick={onRegister}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition cursor-pointer ${
            isPast
              ? "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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

/* ── Interactive Registration Modal Connected to Database & Excel Sheet ── */
function RegistrationModal({
  event,
  onClose,
}: {
  event: EventItem;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    rollNumber: "",
    year: "3rd Year",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || "Registration failed.");
      setSuccessData(d.data);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#070b16] border border-slate-200 dark:border-white/15 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {!successData ? (
          <div>
            <div className="mb-6">
              <span className="rounded-full bg-cyan-500/10 dark:bg-cyan-400/10 border border-cyan-500/20 dark:border-cyan-400/20 px-3 py-0.5 text-xs font-mono text-cyan-700 dark:text-cyan-300">
                OFFICIAL REGISTRATION
              </span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-display mt-2">
                {event.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Fill in your details to secure your spot. Responses are recorded in the event roster and synced with the organizer Excel sheet.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 p-3 text-xs text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                  FULL NAME *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    placeholder="e.g. Alex Rivera"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                    EMAIL ADDRESS *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="alex@university.edu"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                    PHONE / WHATSAPP *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                    COLLEGE / INSTITUTION *
                  </label>
                  <div className="relative">
                    <School className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      placeholder="e.g. Stanford / MIT / IIT"
                      value={form.college}
                      onChange={(e) => setForm({ ...form, college: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                    ROLL NO. / REG. ID
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      placeholder="e.g. 21CS084"
                      value={form.rollNumber}
                      onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                  YEAR OF STUDY / ROLE
                </label>
                <select
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#0d1321] py-2.5 px-4 text-sm text-slate-900 dark:text-white focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none"
                >
                  <option value="1st Year">1st Year Undergraduate</option>
                  <option value="2nd Year">2nd Year Undergraduate</option>
                  <option value="3rd Year">3rd Year Undergraduate</option>
                  <option value="Final Year">Final Year Undergraduate</option>
                  <option value="Postgraduate / PhD">Postgraduate / PhD</option>
                  <option value="Faculty / Professional">Faculty / Industry Professional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-600 dark:text-slate-400 mb-1">
                  ADDITIONAL NOTES / TEAM MEMBERS (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  placeholder="Team name, GitHub profile, or specific requirements..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5 py-2 px-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 dark:focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-bold text-white transition hover:opacity-95 shadow-md shadow-cyan-500/25 mt-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Recording Response...
                  </span>
                ) : (
                  "Confirm & Submit Registration"
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Confirmation Ticket Card */
          <div className="py-6 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display">
              Registration Confirmed!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              Your registration has been successfully recorded in the database and added to the official attendee roster.
            </p>

            <div className="rounded-2xl glass p-5 border border-cyan-500/30 dark:border-cyan-400/30 text-left space-y-2.5 max-w-md mx-auto my-4 shadow-xl">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-mono">REGISTRATION ID</span>
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-300">{successData.registrationId}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-mono">PARTICIPANT</span>
                <span className="text-slate-900 dark:text-white font-medium">{successData.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-mono">EVENT</span>
                <span className="text-slate-900 dark:text-white font-medium truncate max-w-[200px]">{event.title}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-mono">STATUS</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Seat Confirmed ✓</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl bg-cyan-500 dark:bg-cyan-400 px-8 py-2.5 text-xs font-mono font-bold text-white dark:text-black hover:opacity-95 transition shadow-md cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
