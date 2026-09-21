import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Loader2, CalendarX } from "lucide-react";
import { apiFetch } from "../utils/api";
import RegistrationModal, { EventItem } from "../components/RegistrationModal";

/**
 * Shareable per-event registration link: /events/:slug/register
 * Opens the registration popup directly for the given event.
 */
export default function EventRegister() {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!idOrSlug) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    apiFetch(`/api/events/${encodeURIComponent(idOrSlug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setEvent(d.data);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [idOrSlug]);

  if (loading) {
    return (
      <main className="relative flex min-h-[85vh] items-center justify-center px-4">
        <div className="flex items-center gap-3 text-sm font-mono text-slate-500 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-[#e1306c] dark:text-cyan-400" />
          Loading registration...
        </div>
      </main>
    );
  }

  if (notFound || !event) {
    return (
      <main className="relative flex min-h-[85vh] items-center justify-center px-4 py-20">
        <div className="w-full max-w-md rounded-3xl glass border border-slate-200/80 dark:border-white/10 shadow-2xl p-8 text-center">
          <CalendarX className="mx-auto h-10 w-10 text-slate-400 mb-3" />
          <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            Registration link is invalid
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            This event could not be found. It may have been removed.
          </p>
          <Link
            to="/events"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] dark:from-cyan-500 dark:to-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Events
          </Link>
        </div>
      </main>
    );
  }

  const dateStr = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="relative min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 h-96 w-full max-w-4xl bg-gradient-to-b from-cyan-500/10 via-purple-600/10 to-transparent blur-3xl" />

      <Link
        to="/events"
        className="relative z-10 inline-flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All Events
      </Link>

      <div className="relative z-10 rounded-3xl glass border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 text-center shadow-xl">
        <span className="inline-block rounded-full bg-pink-500/10 dark:bg-cyan-400/10 border border-pink-500/20 dark:border-cyan-400/20 px-3 py-0.5 text-xs font-mono text-[#c13584] dark:text-cyan-300 font-semibold mb-3">
          {event.category || "Event"} Registration
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          {event.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#e1306c] dark:text-cyan-400" />
            {dateStr}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {event.venue || "Virtual / Campus"}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Complete your registration in the popup. Share this page link to invite others directly.
        </p>
      </div>

      {/* Registration popup opens directly */}
      <RegistrationModal event={event} onClose={() => navigate("/events")} />
    </main>
  );
}
