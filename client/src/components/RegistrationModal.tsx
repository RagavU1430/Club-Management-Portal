import { useState } from "react";
import { X, Loader2, User, Mail, School, Hash, Shield, Users, MailCheck, Send, ExternalLink, Copy, Check } from "lucide-react";
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
    teamName: "",
    member1: "",
    member2: "",
    email: "",        // Member 1 (Lead) email — confirmation pass goes here
    member2Email: "", // Member 2 email
    college: "",
    rollNumber: "",
    year: "3rd Year",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [copiedMsg, setCopiedMsg] = useState(false);

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
          member2_phone: form.member2Email, // reuse member2_phone column to store member2 email
          college: form.college,
          rollNumber: form.rollNumber,
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

  function copyInvitation() {
    const textToCopy = successData?.emailText || successData?.invitationMessage;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2000);
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
                Register your 2-member team. An official confirmation pass will be delivered directly to your team email via Gmail.
              </p>
            </div>

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

              {/* ── College ── */}
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

              <div className="grid gap-4 sm:grid-cols-2">
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

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    YEAR OF STUDY
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
                disabled={submitting}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-bold text-white transition hover:opacity-95 shadow-md shadow-cyan-500/25 mt-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Recording & Sending Confirmation Email...
                  </span>
                ) : (
                  "Confirm Registration & Dispatch Email Pass"
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Confirmation Ticket Card with Gmail Notification Status */
          <div className="py-4 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <MailCheck className="h-9 w-9" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white font-display">
                Registration Confirmed!
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                Your team registration has been officially recorded. A confirmation email with your digital pass has been dispatched to{" "}
                <strong className="text-cyan-300">{successData.email}</strong>.
              </p>
            </div>

            {/* Notification Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 text-xs text-emerald-300 font-mono">
              <Send className="h-3.5 w-3.5 text-emerald-400" />
              <span>Official Event Pass Dispatched to {successData.email}</span>
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

            {/* Open in Gmail CTA Button */}
            <div className="max-w-md mx-auto space-y-2">
              <a
                href={successData.gmailUrl || `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(event.title)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500/20 via-rose-500/20 to-red-500/20 border border-red-500/40 hover:bg-red-500/30 py-3 px-4 text-xs font-mono font-bold text-white shadow-lg transition cursor-pointer"
              >
                <Mail className="h-4 w-4 text-red-400" />
                <span>Open Confirmation in Gmail</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>
            </div>

            {/* Email Text Preview Box */}
            {(successData.emailText || successData.invitationMessage) && (
              <div className="max-w-md mx-auto text-left rounded-xl bg-black/40 border border-white/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Mail className="h-3.5 w-3.5" /> Confirmation Email Preview
                  </span>
                  <button
                    onClick={copyInvitation}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    {copiedMsg ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedMsg ? "Copied" : "Copy Email"}</span>
                  </button>
                </div>
                <div className="text-[11px] text-slate-300 font-mono whitespace-pre-line bg-black/50 p-2.5 rounded-lg border border-white/5 max-h-36 overflow-y-auto leading-relaxed">
                  {successData.emailText || successData.invitationMessage}
                </div>
              </div>
            )}

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
