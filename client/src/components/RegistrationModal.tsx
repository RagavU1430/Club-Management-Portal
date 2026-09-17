import { useState } from "react";
import { X, Loader2, CheckCircle2, User, Mail, Phone, School, Hash } from "lucide-react";
import { apiFetch } from "../utils/api";

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
      const res = await apiFetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#070b16] border border-white/15 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {!successData ? (
          <div>
            <div className="mb-6">
              <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-0.5 text-xs font-mono text-cyan-300">
                OFFICIAL REGISTRATION
              </span>
              <h3 className="text-2xl font-bold text-white font-display mt-2">
                {event.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Fill in your details to secure your spot. Responses are recorded in the event roster and synced with the organizer Excel sheet.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-950/40 border border-red-500/30 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  FULL NAME *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    placeholder="e.g. Alex Rivera"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
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
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
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
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    COLLEGE / INSTITUTION *
                  </label>
                  <div className="relative">
                    <School className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      placeholder="e.g. Stanford / MIT / IIT"
                      value={form.college}
                      onChange={(e) => setForm({ ...form, college: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    ROLL NO. / REG. ID
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      placeholder="e.g. 21CS084"
                      value={form.rollNumber}
                      onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  YEAR OF STUDY / ROLE
                </label>
                <select
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-[#0d1321] py-2.5 px-4 text-sm text-white focus:border-cyan-400 focus:outline-none"
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
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  ADDITIONAL NOTES / TEAM MEMBERS (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  placeholder="Team name, GitHub profile, or specific requirements..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 px-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
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
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <h3 className="text-2xl font-black text-white font-display">
              Registration Confirmed!
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Your registration has been successfully recorded in the database and added to the official attendee roster.
            </p>

            <div className="rounded-2xl glass p-5 border border-cyan-400/30 text-left space-y-2.5 max-w-md mx-auto my-4 shadow-xl">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">REGISTRATION ID</span>
                <span className="font-mono font-bold text-cyan-300">{successData.registrationId}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">PARTICIPANT</span>
                <span className="text-white font-medium">{successData.name}</span>
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
              className="rounded-xl bg-cyan-400 px-8 py-2.5 text-xs font-mono font-bold text-black hover:opacity-95 transition shadow-md cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
