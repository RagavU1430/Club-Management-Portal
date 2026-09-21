import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Loader2,
  User,
  Mail,
  Shield,
  Users,
  AlertCircle,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Hash,
  Phone,
  Printer,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { apiFetch } from "../utils/api";

export const DEPARTMENTS = [
  "Artificial Intelligence and Data Science",
  "Bio-Technology",
  "Bio-Medical Engineering",
  "Chemical Engineering",
  "Civil Engineering",
  "Computer and Communication Engineering",
  "Computer Science and Engineering",
  "Computer Science and Business System",
  "Artificial Intelligence and Machine Learning",
  "Electrical and Electronics Engineering",
  "Electronics and Communication Engineering",
  "Information Technology",
  "Mechanical Engineering",
  "Science & Humanities",
];

export const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export interface EventItem {
  id: string | number;
  title: string;
  summary?: string;
  description?: string;
  date: string;
  endDate?: string | null;
  venue?: string;
  image?: string;
  slug?: string;
  registrationLink?: string;
  agendaUrl?: string;
  agenda_url?: string;
  status?: string;
  computedStatus?: string;
  category?: string;
  capacity?: number;
  registrationCount?: number;
  tags?: string | string[];
}

export default function RegistrationModal({
  event,
  onClose,
  onSuccess,
}: {
  event: EventItem;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  // Modal views: 'agenda' (initial view) -> 'register' -> 'lookup'
  const [view, setView] = useState<"agenda" | "register" | "lookup">("agenda");
  
  // Participant details:
  // - One Team Name for both participants
  // - Participant 1: Name, Roll Number, Mail ID
  // - Participant 2: Name, Roll Number, Mail ID
  // - Academic & Contact: Department, Section, Contact Number
  const [form, setForm] = useState({
    teamName: "",
    member1: "",
    member1RollNumber: "",
    member1Email: "",
    member2: "",
    member2RollNumber: "",
    member2Email: "",
    department: "",
    section: "",
    year: "",
    phone: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [error, setError] = useState("");

  // Ticket Lookup State
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupResults, setLookupResults] = useState<any[] | null>(null);
  const [lookupMsg, setLookupMsg] = useState("");

  const isFull = Boolean(event.capacity && event.capacity > 0 && (event.registrationCount || 0) >= event.capacity);
  const isPast = event.computedStatus === "past";

  // Prevent background scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Date & Time formatting
  const dateObj = new Date(event.date);
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : event.date;

  const formattedTime = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "08:30 AM";

  // Parse tags if JSON string or array
  const tagsList: string[] = Array.isArray(event.tags)
    ? event.tags
    : typeof event.tags === "string"
    ? (() => {
        try {
          const parsed = JSON.parse(event.tags);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return event.tags ? event.tags.split(",").map((s) => s.trim()) : [];
        }
      })()
    : [];

  // Parse Agenda lines from event description
  const agendaLines = (event.description || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("•") || line.startsWith("-") || line.startsWith("*"));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: form.teamName,
          member1: form.member1,
          rollNumber: form.member1RollNumber,
          email: form.member1Email,
          member2: form.member2,
          member2RollNumber: form.member2RollNumber,
          member2_roll_number: form.member2RollNumber,
          member2Email: form.member2Email,
          member2_email: form.member2Email,
          name: form.member1,
          department: form.department,
          section: form.section,
          year: form.year,
          phone: form.phone,
        }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || "Registration failed.");
      setSuccessData(d.data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupMsg("");
    setLookingUp(true);
    setLookupResults(null);
    try {
      const trimmed = lookupEmail.trim();
      const res = await apiFetch("/api/events/lookup-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, identifier: trimmed, eventId: event.id }),
      });
      const d = await res.json();
      const list = Array.isArray(d?.data) ? d.data : Array.isArray(d?.tickets) ? d.tickets : [];
      if (d.success) {
        if (list.length > 0) {
          setLookupResults(list);
        } else {
          setLookupMsg(d.message || "No registered tickets found for this query.");
        }
      } else {
        setLookupMsg(d.message || "Lookup failed.");
      }
    } catch (err: any) {
      setLookupMsg(err.message || "Network error. Please try again.");
    } finally {
      setLookingUp(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 dark:bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#070b16] border border-slate-200 dark:border-white/15 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition cursor-pointer"
          title="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ════════════════════════════════════════════════════════════
            VIEW 1: EVENT AGENDA & OVERVIEW (Default initial view)
           ════════════════════════════════════════════════════════════ */}
        {view === "agenda" && !successData && (
          <div className="space-y-6 text-left">
            {/* Top Category Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 dark:bg-cyan-400/10 border border-cyan-500/20 dark:border-cyan-400/20 px-3 py-0.5 text-xs font-mono text-cyan-700 dark:text-cyan-300 font-bold">
                <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
                {event.category || "AI FRONTIER EVENT"}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-mono capitalize ${
                  isPast
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    : isFull
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-bold"
                }`}
              >
                {isPast ? "Concluded" : isFull ? "Capacity Full" : "Seats Open"}
              </span>
            </div>

            {/* Event Title */}
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {event.title}
              </h2>
              {event.summary && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {event.summary}
                </p>
              )}
            </div>

            {/* Event Key Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 text-xs font-mono mb-1 font-semibold">
                  <Calendar className="h-3.5 w-3.5" /> DATE
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>

              <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 text-xs font-mono mb-1 font-semibold">
                  <Clock className="h-3.5 w-3.5" /> TIME
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {formattedTime}
                </div>
              </div>

              <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-mono mb-1 font-semibold">
                  <MapPin className="h-3.5 w-3.5" /> VENUE
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {event.venue || "Campus AI Lab"}
                </div>
              </div>

              <div className="rounded-2xl p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-mono mb-1 font-semibold">
                  <Users className="h-3.5 w-3.5" /> TEAM SIZE
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  2 Members
                </div>
              </div>
            </div>

            {/* Event Description & Agenda */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-transparent border border-slate-200 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300">
                  <BookOpen className="h-4 w-4 text-cyan-500" />
                  EVENT AGENDA & SCHEDULE
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {event.venue || "Campus Lab"}
                </span>
              </div>

              {/* Formatted Agenda Timeline */}
              {agendaLines.length > 0 ? (
                <div className="space-y-3 pt-1">
                  {agendaLines.map((line, idx) => {
                    const cleanLine = line.replace(/^[•\-*]\s*/, "");
                    const parts = cleanLine.split(":");
                    const timePart = parts.length > 1 ? parts[0] : null;
                    const descPart = parts.length > 1 ? parts.slice(1).join(":") : cleanLine;

                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-cyan-500 dark:bg-cyan-400 mt-1.5 shrink-0" />
                        <div className="text-xs leading-relaxed">
                          {timePart && (
                            <span className="font-mono font-bold text-slate-900 dark:text-white mr-1.5">
                              {timePart}:
                            </span>
                          )}
                          <span className="text-slate-600 dark:text-slate-300">
                            {descPart.trim()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p>{event.description || "Interactive event featuring live AI coding, mentoring, and project presentations."}</p>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 grid gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                      <span>Phase 1 : Problem statement release & system architecture</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      <span>Phase 2 : Hands-on model development & prototyping</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>Phase 3 : Live team demo & jury evaluation</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {tagsList.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] font-mono text-slate-500">TAGS:</span>
                  {tagsList.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Capacity / Full Warning */}
            {isFull && (
              <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <strong className="font-bold">Maximum Capacity Reached</strong>
                  <p className="mt-0.5 text-amber-700 dark:text-amber-300/80">
                    All {event.capacity} seats for this gathering are filled. Registration is now closed.
                  </p>
                </div>
              </div>
            )}

            {/* ─── BOTTOM ACTION: REGISTER NOW TO SECURE YOUR SEAT ─── */}
            <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-3">
              {(event.agendaUrl || event.agenda_url) && (
                <a
                  href={event.agendaUrl || event.agenda_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/40 dark:border-cyan-400/40 bg-cyan-500/10 dark:bg-cyan-400/10 py-3 px-6 text-sm font-bold text-cyan-700 dark:text-cyan-300 transition hover:bg-cyan-500/20 dark:hover:bg-cyan-400/20"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>View Full Agenda (opens in new tab)</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              )}
              <button
                type="button"
                disabled={isFull || isPast}
                onClick={() => setView("register")}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 py-3.5 px-6 text-sm sm:text-base font-bold text-white shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFull ? (
                  <span>Registrations Closed (Capacity Full)</span>
                ) : isPast ? (
                  <span>Event Has Concluded</span>
                ) : (
                  <>
                    <span>Register Now to Secure Your Seat</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>⚡ Instant Ticket Pass Generation</span>
                <button
                  type="button"
                  onClick={() => setView("lookup")}
                  className="text-cyan-600 dark:text-cyan-400 hover:underline font-mono cursor-pointer"
                >
                  Already Registered? Find Ticket
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            VIEW 2: REGISTRATION FORM (Participant Details Input)
           ════════════════════════════════════════════════════════════ */}
        {view === "register" && !successData && (
          <div className="space-y-5 text-left">
            {/* Top Navigation Back to Agenda */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setView("agenda")}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 cursor-pointer font-bold"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Event Agenda
              </button>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                2-MEMBER TEAM REGISTRATION
              </span>
            </div>

            <div>
              <span className="rounded-full bg-cyan-500/10 dark:bg-cyan-400/10 border border-cyan-500/20 dark:border-cyan-400/20 px-3 py-0.5 text-xs font-mono text-cyan-700 dark:text-cyan-300 font-bold">
                PARTICIPANT REGISTRATION
              </span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-display mt-2">
                {event.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Please enter your team credentials below to confirm your seats and generate your official pass.
              </p>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-500/30 p-3.5 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Team Name */}
              <div>
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  TEAM NAME *
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500 dark:text-cyan-400" />
                  <input
                    required
                    placeholder="e.g. Neural Pioneers / Frontier AI"
                    value={form.teamName}
                    onChange={(e) => setForm({ ...form, teamName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 2. Participant 1 (Lead) Card */}
              <div className="rounded-2xl p-4 bg-slate-50 dark:bg-white/5 border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    <User className="h-4 w-4" />
                    PARTICIPANT 1 (LEAD)
                  </div>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                    Lead Registrant
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      PARTICIPANT NAME 1 *
                    </label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cyan-500 dark:text-cyan-400" />
                      <input
                        required
                        placeholder="Participant 1 Full Name"
                        value={form.member1}
                        onChange={(e) => setForm({ ...form, member1: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/60 py-2 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      ROLL NUMBER *
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        required
                        placeholder="e.g. 22ADR045"
                        value={form.member1RollNumber}
                        onChange={(e) => setForm({ ...form, member1RollNumber: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/60 py-2 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      MAIL ID *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="lead@university.edu"
                        value={form.member1Email}
                        onChange={(e) => setForm({ ...form, member1Email: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/60 py-2 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Participant 2 Card */}
              <div className="rounded-2xl p-4 bg-slate-50 dark:bg-white/5 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                    <Users className="h-4 w-4" />
                    PARTICIPANT 2
                  </div>
                  <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                    Team Partner
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      PARTICIPANT NAME 2 *
                    </label>
                    <div className="relative">
                      <Users className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-purple-500 dark:text-purple-400" />
                      <input
                        required
                        placeholder="Participant 2 Full Name"
                        value={form.member2}
                        onChange={(e) => setForm({ ...form, member2: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/60 py-2 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      ROLL NUMBER *
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        required
                        placeholder="e.g. 22ADR046"
                        value={form.member2RollNumber}
                        onChange={(e) => setForm({ ...form, member2RollNumber: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/60 py-2 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      MAIL ID *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="member2@university.edu"
                        value={form.member2Email}
                        onChange={(e) => setForm({ ...form, member2Email: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/60 py-2 pl-8 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Academic & Contact Details */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    DEPARTMENT *
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0d1321] py-2.5 px-3 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="" disabled className="bg-white dark:bg-[#0d1321] text-slate-400">
                        Select Department
                      </option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept} className="bg-white dark:bg-[#0d1321] text-slate-900 dark:text-white">
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    SECTION *
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={form.section}
                      onChange={(e) => setForm({ ...form, section: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0d1321] py-2.5 px-3 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="" disabled className="bg-white dark:bg-[#0d1321] text-slate-400">
                        Select Section
                      </option>
                      {SECTIONS.map((sec) => (
                        <option key={sec} value={sec} className="bg-white dark:bg-[#0d1321] text-slate-900 dark:text-white">
                          Section {sec}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    YEAR OF STUDY *
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#0d1321] py-2.5 px-3 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="" disabled className="bg-white dark:bg-[#0d1321] text-slate-400">
                        Select Year
                      </option>
                      {YEARS.map((yr) => (
                        <option key={yr} value={yr} className="bg-white dark:bg-[#0d1321] text-slate-900 dark:text-white">
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    CONTACT NUMBER *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-500 dark:text-emerald-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 py-2.5 pl-8 pr-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setView("agenda")}
                  className="px-5 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || isFull}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 py-3 font-bold text-white transition hover:opacity-95 shadow-md shadow-cyan-500/25 disabled:opacity-50 cursor-pointer text-sm"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Securing Your Seat...
                    </span>
                  ) : (
                    "Confirm Registration & Reserve Seat"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            VIEW 3: SELF-SERVICE TICKET LOOKUP
           ════════════════════════════════════════════════════════════ */}
        {view === "lookup" && !successData && (
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setView("agenda")}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 cursor-pointer font-bold"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Event Agenda
              </button>
            </div>

            <div>
              <span className="rounded-full bg-cyan-500/10 dark:bg-cyan-400/10 border border-cyan-500/20 dark:border-cyan-400/20 px-3 py-0.5 text-xs font-mono text-cyan-700 dark:text-cyan-300">
                SELF-SERVICE LOOKUP
              </span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-display mt-2">
                Find Your Registration Pass
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your registered team email address to retrieve your registration pass and credentials.
              </p>
            </div>

            <form onSubmit={handleLookup} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
                  REGISTERED MAIL ID OR PASS ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter registered email or Reg ID (e.g. ragavkrr14@gmail.com or AIF-7-14)"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={lookingUp}
                className="w-full rounded-xl bg-cyan-500 dark:bg-cyan-400 py-2.5 font-mono text-xs font-bold text-white dark:text-black transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {lookingUp ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Searching Tickets...
                  </span>
                ) : (
                  "Retrieve My Ticket Pass"
                )}
              </button>
            </form>

            {lookupMsg && (
              <div className="rounded-xl bg-slate-100 dark:bg-white/5 p-3 text-xs text-slate-700 dark:text-slate-300 font-mono">
                {lookupMsg}
              </div>
            )}

            {lookupResults && lookupResults.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                  FOUND {lookupResults.length} REGISTRATION PASS:
                </h4>
                {lookupResults.map((t, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-cyan-500/30 text-xs space-y-1 font-mono">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {t.team_name || t.teamName || "Team"}
                      </span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                        {t.registrationId || `AIF-${event.id}-${t.id}`}
                      </span>
                    </div>
                    {t.eventTitle && (
                      <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">
                        Event: {t.eventTitle} {t.venue ? `• Venue: ${t.venue}` : ""}
                      </div>
                    )}
                    <div className="text-slate-600 dark:text-slate-300 space-y-1">
                      <div>
                        Participant 1: <strong className="text-slate-900 dark:text-white">{t.member1 || t.name}</strong> ({t.rollNumber || t.roll_number || "—"}) &bull; {t.email}
                      </div>
                      {t.member2 && (
                        <div>
                          Participant 2: <strong className="text-slate-900 dark:text-white">{t.member2}</strong> ({t.member2RollNumber || t.member2_roll_number || "—"}) &bull; {t.member2Email || t.member2_email || "—"}
                        </div>
                      )}
                    </div>
                    <div className="text-slate-500 pt-1 border-t border-slate-200 dark:border-white/5">
                      {t.department}{t.year ? ` • ${t.year}` : ""} &bull; Section: {t.section || "—"} &bull; Contact: {t.phone || "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            VIEW 4: SUCCESS CONFIRMATION & OFFICIAL TICKET PASS
           ════════════════════════════════════════════════════════════ */}
        {successData && (
          <div className="space-y-6 text-center animate-fadeIn">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-xs font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                SEAT CONFIRMED & RESERVED
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white mt-2">
                You're Officially Registered!
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Official confirmation pass has been dispatched to{" "}
                <strong className="text-slate-900 dark:text-white font-mono">{form.member1Email}</strong>
                {form.member2Email && (
                  <> and <strong className="text-slate-900 dark:text-white font-mono">{form.member2Email}</strong></>
                )}.
              </p>
            </div>

            {/* Official Digital Ticket Card */}
            <div className="relative rounded-3xl p-6 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-transparent border border-cyan-500/40 text-left space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                    AI FRONTIER CLUB &bull; OFFICIAL ENTRY PASS
                  </span>
                  <h4 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                    {event.title}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-500">PASS CODE</span>
                  <div className="text-sm font-mono font-black text-cyan-600 dark:text-cyan-300">
                    {successData.registrationId || `AIF-${event.id}-${successData.id || "001"}`}
                  </div>
                </div>
              </div>

              {/* Team and Academic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px]">TEAM NAME</span>
                  <div className="font-bold text-slate-900 dark:text-white truncate">
                    {form.teamName || "AI Pioneers"}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 text-[10px]">DEPARTMENT &bull; SECTION</span>
                  <div className="font-bold text-slate-900 dark:text-white break-words">
                    {form.department}{form.year ? ` • ${form.year}` : ""} &bull; Section {form.section}
                  </div>
                </div>
              </div>

              {/* Both Participants Detail Cards */}
              <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
                <div className="rounded-xl p-3 bg-cyan-500/5 dark:bg-cyan-400/5 border border-cyan-500/20 text-xs font-mono space-y-1">
                  <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">
                    PARTICIPANT 1 (LEAD)
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white truncate">
                    {form.member1}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    Roll: <span className="font-bold text-slate-900 dark:text-white">{form.member1RollNumber}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {form.member1Email}
                  </div>
                </div>

                <div className="rounded-xl p-3 bg-purple-500/5 dark:bg-purple-400/5 border border-purple-500/20 text-xs font-mono space-y-1">
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                    PARTICIPANT 2
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white truncate">
                    {form.member2}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    Roll: <span className="font-bold text-slate-900 dark:text-white">{form.member2RollNumber}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {form.member2Email}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="h-3.5 w-3.5 text-emerald-500" />
                  {form.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-cyan-500" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-purple-500" />
                  {event.venue || "Campus Lab"}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-white/10 py-3 text-xs font-mono font-bold text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/15 transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                Print / Save Pass
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-cyan-500 dark:bg-cyan-400 py-3 text-xs font-mono font-bold text-white dark:text-black hover:opacity-90 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
