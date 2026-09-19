import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowRight,
  Flame,
  Radio,
} from "lucide-react";
import { apiFetch } from "../utils/api";
import RegistrationModal, { EventItem } from "./RegistrationModal";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isStarted: boolean;
  isEnded: boolean;
}

function calculateTimeLeft(dateStr: string, endDateStr?: string | null): TimeLeft {
  const now = Date.now();
  const startTime = new Date(dateStr).getTime();
  
  let endTime = startTime;
  if (endDateStr) {
    endTime = new Date(endDateStr).getTime();
  } else if (typeof dateStr === "string" && !dateStr.includes("T") && !dateStr.includes(":")) {
    const d = new Date(dateStr);
    d.setHours(23, 59, 59, 999);
    endTime = d.getTime();
  }

  const isEnded = now >= endTime;
  const isStarted = now >= startTime && !isEnded;

  const targetTime = isStarted ? endTime : startTime;
  const diff = Math.max(0, targetTime - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isStarted, isEnded };
}

export default function NextUpcomingEvent() {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  const fetchNextEvent = useCallback(async () => {
    try {
      const res = await apiFetch("/api/events?scope=upcoming&limit=1");
      const d = await res.json();
      if (d.success && Array.isArray(d.data) && d.data.length > 0) {
        setEvent(d.data[0]);
      } else {
        setEvent(null);
      }
    } catch {
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and poll every 30s for newly added events
  useEffect(() => {
    fetchNextEvent();
    const pollTimer = setInterval(fetchNextEvent, 30000);
    return () => clearInterval(pollTimer);
  }, [fetchNextEvent]);

  // Real-time countdown timer & auto-disappear when ended
  useEffect(() => {
    if (!event) {
      setTimeLeft(null);
      return;
    }

    const updateCountdown = () => {
      const tl = calculateTimeLeft(event.date, event.endDate);
      setTimeLeft(tl);

      // If the event has ended, automatically refresh to disappear this event and fetch the next upcoming one
      if (tl.isEnded) {
        fetchNextEvent();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event, fetchNextEvent]);

  if (loading) {
    return (
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-3xl glass p-8 border border-white/10 animate-pulse h-64 flex items-center justify-center">
          <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm">
            <Radio className="h-5 w-5 animate-spin" />
            SYNCHRONIZING NEXT UPCOMING EVENT...
          </div>
        </div>
      </section>
    );
  }

  // If no upcoming events, show an aesthetic standby card
  if (!event) {
    return (
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative rounded-3xl overflow-hidden glass p-8 sm:p-10 border border-slate-200 dark:border-white/10 text-center shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 dark:bg-cyan-400/10 border border-cyan-500/20 dark:border-cyan-400/20 px-3 py-1 text-xs font-mono text-cyan-700 dark:text-cyan-300 mb-4">
            <Radio className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
            LIVE DISPATCH // RADAR ACTIVE
          </div>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            No Upcoming Events Scheduled Right Now
          </h3>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
            All recent sessions have concluded. Our organizers are curating the next AI hackathon, coding sprint, and hands-on workshop!
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 rounded-xl glass px-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition border border-slate-300 dark:border-white/10"
            >
              Browse Event Archives & Past Recordings
              <ArrowRight className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Format event date & time
  const dateObj = new Date(event.date);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Glowing Container Card */}
        <div
          onClick={() => setRegistering(true)}
          className="group relative rounded-3xl overflow-hidden glass border border-pink-400/30 dark:border-cyan-400/30 hover:border-pink-500/60 dark:hover:border-cyan-400/60 p-6 sm:p-10 shadow-xl shadow-pink-500/10 dark:shadow-[0_0_50px_rgba(0,240,255,0.12)] transition-all duration-300 cursor-pointer"
        >
          {/* Top Instagram rainbow bar in light mode */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] opacity-90 dark:opacity-0" />

          {/* Subtle Ambient Background Gradients */}
          <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-pink-500/15 dark:bg-cyan-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-purple-600/15 dark:bg-purple-600/15 blur-3xl" />

          {/* Top Bar: Live Status & Category */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#833ab4]/12 via-[#e1306c]/12 to-[#fcb045]/12 dark:bg-cyan-400/10 border border-[#e1306c]/35 dark:border-cyan-400/30 px-3.5 py-1 text-xs font-mono text-[#c13584] dark:text-cyan-300 shadow-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-500 dark:bg-cyan-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e1306c] dark:bg-cyan-400"></span>
              </span>
              NEXT UPCOMING EVENT
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-3 py-1 text-xs font-mono text-slate-700 dark:text-slate-300">
                {event.category || "Hackathon"}
              </span>
              {event.capacity ? (
                <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-mono text-purple-700 dark:text-purple-300 flex items-center gap-1.5 font-medium">
                  <Users className="h-3 w-3" />
                  {event.registrationCount || 0} / {event.capacity} Registered
                </span>
              ) : null}
            </div>
          </div>

          {/* Main Grid: Info on Left, Live Countdown & Action on Right */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Col: Event Details */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-display text-2xl sm:text-4xl font-black text-slate-900 dark:text-white dark:glow-text leading-tight group-hover:text-[#c13584] dark:group-hover:text-cyan-300 transition-colors">
                {event.title}
              </h3>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                {event.summary || event.description}
              </p>

              {/* Event Metadata Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2 rounded-xl glass-subtle border border-slate-200 dark:border-white/10 px-3.5 py-2">
                  <Calendar className="h-4 w-4 text-[#e1306c] dark:text-cyan-400" />
                  <span>{formattedDate}</span>
                </div>

                <div className="flex items-center gap-2 rounded-xl glass-subtle border border-slate-200 dark:border-white/10 px-3.5 py-2">
                  <Clock className="h-4 w-4 text-[#e1306c] dark:text-cyan-400" />
                  <span>{formattedTime}</span>
                </div>

                <div className="flex items-center gap-2 rounded-xl glass-subtle border border-slate-200 dark:border-white/10 px-3.5 py-2 truncate max-w-xs">
                  <MapPin className="h-4 w-4 text-[#e1306c] dark:text-cyan-400" />
                  <span className="truncate">{event.venue || "Campus AI Lab"}</span>
                </div>
              </div>
            </div>

            {/* Right Col: Live Countdown Box & Register Button */}
            <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
              <div className="w-full max-w-md rounded-2xl glass-subtle border border-pink-400/20 dark:border-white/10 p-5 space-y-5 text-center shadow-lg">
                {/* Countdown Header */}
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#c13584] dark:text-cyan-300 font-bold tracking-wider uppercase">
                  <Flame className="h-4 w-4 text-[#e1306c] dark:text-cyan-400 animate-pulse" />
                  {timeLeft?.isStarted ? "EVENT IS CURRENTLY LIVE!" : "STARTS IN"}
                </div>

                {/* Countdown Clock Digit Boxes */}
                {timeLeft && !timeLeft.isStarted && (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-xl bg-slate-100/90 dark:bg-[#050811]/70 border border-slate-200 dark:border-cyan-400/20 py-2.5 px-1 shadow-sm">
                      <span className="block font-mono text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#833ab4] to-[#e1306c] bg-clip-text text-transparent dark:text-white dark:glow-text">
                        {String(timeLeft.days).padStart(2, "0")}
                      </span>
                      <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase mt-0.5 font-semibold">
                        Days
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-100/90 dark:bg-[#050811]/70 border border-slate-200 dark:border-cyan-400/20 py-2.5 px-1 shadow-sm">
                      <span className="block font-mono text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#833ab4] to-[#e1306c] bg-clip-text text-transparent dark:text-white dark:glow-text">
                        {String(timeLeft.hours).padStart(2, "0")}
                      </span>
                      <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase mt-0.5 font-semibold">
                        Hours
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-100/90 dark:bg-[#050811]/70 border border-slate-200 dark:border-cyan-400/20 py-2.5 px-1 shadow-sm">
                      <span className="block font-mono text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#833ab4] to-[#e1306c] bg-clip-text text-transparent dark:text-white dark:glow-text">
                        {String(timeLeft.minutes).padStart(2, "0")}
                      </span>
                      <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase mt-0.5 font-semibold">
                        Mins
                      </span>
                    </div>

                    <div className="rounded-xl bg-slate-100/90 dark:bg-[#050811]/70 border border-slate-200 dark:border-cyan-400/20 py-2.5 px-1 shadow-sm">
                      <span className="block font-mono text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#e1306c] to-[#f77737] bg-clip-text text-transparent dark:text-cyan-300 dark:glow-text">
                        {String(timeLeft.seconds).padStart(2, "0")}
                      </span>
                      <span className="block text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase mt-0.5 font-semibold">
                        Secs
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2.5 pt-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setRegistering(true)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] dark:from-cyan-500 dark:to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-pink-500/25 dark:shadow-cyan-500/25 transition hover:scale-[1.02] cursor-pointer"
                  >
                    View Agenda & Register
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <Link
                    to="/events"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl glass py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition border border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20"
                  >
                    View All Club Events
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Registration Modal */}
      {registering && (
        <RegistrationModal
          event={event}
          onClose={() => setRegistering(false)}
          onSuccess={() => {
            fetchNextEvent();
          }}
        />
      )}
    </>
  );
}
