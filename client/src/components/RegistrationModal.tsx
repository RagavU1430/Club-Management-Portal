import { useState } from "react";
import { X, Loader2, User, Mail, GraduationCap, Shield, Users, MailCheck, Search, Ticket, AlertCircle } from "lucide-react";
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
  status?: string;
  computedStatus?: string;
  category?: string;
  capacity?: number;
  registrationCount?: number;
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
  const [mode, setMode] = useState<"register" | "lookup">("register");
  const [form, setForm] = useState({
    teamName: "",
    member1: "",
    member2: "",
    email: "",        // Member 1 (Lead) email — confirmation pass goes here
    member2Email: "", // Member 2 email
    department: "Artificial Intelligence and Data Science",
    year: "3rd Year",
    notes: "",
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
          member2: form.member2,
          name: form.member1,
          email: form.email,
          member2_phone: form.member2Email, // store member2 email
          department: form.department,
          year: form.year,
          notes: form.notes,
        }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || "Registration failed.");
      setSuccessData(d.data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "An error occurred.");
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
      const res = await apiFetch("/api/events/lookup-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: lookupEmail, eventId: event.id }),
      });
      const d = await res.json();
      if (d.success) {
        if (d.found && d.data?.length > 0) {
          setLookupResults(d.data);
        } else {
          setLookupMsg(d.message || "No registered tickets found for this email.");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#070b16] border border-white/15 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Mode Switcher */}
        {!successData && (
          <div className="flex gap-2 mb-6 border-b border-white/10 pb-3">
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono transition cursor-pointer ${
                mode === "register"
                  ? "bg-cyan-400 text-black font-bold shadow-md shadow-cyan-500/20"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Ticket className="h-3.5 w-3.5" />
              <span>Register Team</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("lookup")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono transition cursor-pointer ${
                mode === "lookup"
                  ? "bg-cyan-400 text-black font-bold shadow-md shadow-cyan-500/20"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              <span>Find My Ticket</span>
            </button>
          </div>
        )}

        {!successData ? (
          mode === "register" ? (
            <div>
              <div className="mb-6">
                <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-0.5 text-xs font-mono text-cyan-300">
                  OFFICIAL REGISTRATION
                </span>
                <h3 className="text-2xl font-bold text-white font-display mt-2">
                  {event.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Register your 2-member team. Your registration will be confirmed instantly.
                </p>
              </div>

              {isFull && (
                <div className="mb-4 rounded-xl bg-amber-950/40 border border-amber-500/30 p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <div>
                    <strong className="font-bold">Maximum Capacity Reached!</strong>
                    <p className="mt-0.5 text-amber-300/80">
                      All {event.capacity} seats for this event are filled. New registrations are closed.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 rounded-xl bg-red-950/40 border border-red-500/30 p-3 text-xs text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* ── Team Name ── */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  TEAM NAME *
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                  <input
                    required
                    placeholder="e.g. Neural Knights / Frontier AI"
                    value={form.teamName}
                    onChange={(e) => setForm({ ...form, teamName: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* ── Member 1 (Lead) Details ── */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-cyan-300">PARTICIPANT 1 (TEAM LEAD)</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      LEAD FULL NAME *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                      <input
                        required
                        placeholder="Lead full name"
                        value={form.member1}
                        onChange={(e) => setForm({ ...form, member1: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      LEAD EMAIL ADDRESS *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                      <input
                        type="email"
                        required
                        placeholder="lead@university.edu"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-cyan-400/70 font-mono">
                      ✉ Confirmation pass will be sent here
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Member 2 Details ── */}
              <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-purple-300">PARTICIPANT 2</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      MEMBER 2 FULL NAME *
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
                      <input
                        required
                        placeholder="Member 2 full name"
                        value={form.member2}
                        onChange={(e) => setForm({ ...form, member2: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      MEMBER 2 EMAIL ADDRESS
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
                      <input
                        type="email"
                        placeholder="member2@university.edu"
                        value={form.member2Email}
                        onChange={(e) => setForm({ ...form, member2Email: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Department & Year of Study ── */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    DEPARTMENT *
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                    <select
                      required
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#0d1321] py-2.5 pl-10 pr-4 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept} className="bg-[#0d1321] text-white">
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    YEAR OF STUDY *
                  </label>
                  <select
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#0d1321] py-2.5 px-4 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  ADDITIONAL NOTES / SKILLS (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  placeholder="Any special requirements, GitHub links, etc..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || isFull}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-bold text-white transition hover:opacity-95 shadow-md shadow-cyan-500/25 mt-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Confirming Registration...
                  </span>
                ) : isFull ? (
                  "Event Full — Registrations Closed"
                ) : (
                  "Confirm Registration"
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Ticket Lookup View */
          <div className="space-y-4 text-left">
            <div>
              <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-0.5 text-xs font-mono text-cyan-300">
                SELF-SERVICE LOOKUP
              </span>
              <h3 className="text-2xl font-bold text-white font-display mt-2">
                Find Your Registration Pass
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your registered team email address to retrieve your registration pass and details.
              </p>
            </div>

            <form onSubmit={handleLookup} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  ENTER REGISTERED EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. lead@university.edu"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={lookingUp}
                className="w-full rounded-xl bg-cyan-400 py-2.5 font-bold text-black hover:bg-cyan-300 transition shadow-md cursor-pointer text-xs font-mono disabled:opacity-50"
              >
                {lookingUp ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Searching Records...
                  </span>
                ) : (
                  "Retrieve My Pass"
                )}
              </button>
            </form>

            {lookupMsg && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 font-mono">
                {lookupMsg}
              </div>
            )}

            {lookupResults && lookupResults.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-mono text-emerald-400 font-bold">
                  ✓ Found {lookupResults.length} Registered Ticket(s):
                </div>
                {lookupResults.map((t) => (
                  <div key={t.id} className="rounded-2xl glass p-4 border border-cyan-400/30 text-left space-y-2 shadow-lg">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-mono">REGISTRATION ID</span>
                      <span className="font-mono font-bold text-cyan-300">{t.registrationId}</span>
                    </div>
                    {t.teamName && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-mono">TEAM NAME</span>
                        <span className="text-white font-bold">{t.teamName}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-mono">LEAD / M1</span>
                      <span className="text-cyan-300 font-medium">{t.member1}</span>
                    </div>
                    {t.member2 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-mono">MEMBER 2</span>
                        <span className="text-purple-300 font-medium">{t.member2}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-mono">DEPARTMENT</span>
                      <span className="text-white font-medium">{t.department}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-mono">YEAR</span>
                      <span className="text-white font-medium">{t.year}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-mono">EVENT</span>
                      <span className="text-white font-medium">{t.eventTitle}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      ) : (
          /* Confirmation Ticket Card */
          <div className="py-4 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <MailCheck className="h-9 w-9" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white font-display">
                Registration Confirmed!
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                Your team registration has been confirmed.
              </p>
            </div>

            {/* Ticket Info Box */}
            <div className="rounded-2xl glass p-5 border border-cyan-400/30 text-left space-y-2.5 max-w-md mx-auto my-3 shadow-xl">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">REGISTRATION ID</span>
                <span className="font-mono font-bold text-cyan-300">{successData.registrationId}</span>
              </div>
              {successData.teamName && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono">TEAM NAME</span>
                  <span className="text-white font-bold">{successData.teamName}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">TEAM LEAD (M1)</span>
                <span className="text-cyan-300 font-medium">{successData.member1 || successData.name}</span>
              </div>
              {successData.member2 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono">MEMBER 2</span>
                  <span className="text-purple-300 font-medium">{successData.member2}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">EMAIL</span>
                <span className="text-white font-medium truncate max-w-[200px]">{successData.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">EVENT</span>
                <span className="text-white font-medium truncate max-w-[200px]">{event.title}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">STATUS</span>
                <span className="text-emerald-400 font-semibold">Seat Confirmed ✓</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl bg-cyan-400 px-8 py-2.5 text-xs font-mono font-bold text-black hover:opacity-95 transition shadow-md cursor-pointer mt-2"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
