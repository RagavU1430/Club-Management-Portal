import { useState } from "react";
import { X, Loader2, CheckCircle2, User, Mail, Phone, School, Hash, Shield, Users, MessageSquare, Send, Smartphone, ExternalLink, Copy, Check } from "lucide-react";
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
    email: "",
    phone: "",
    member2Phone: "",
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
          ...form,
          name: form.member1,
          member2Phone: form.member2Phone,
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
    if (successData?.invitationMessage) {
      navigator.clipboard.writeText(successData.invitationMessage);
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
                Register your 2-member team. Both participants will receive an automated invitation and confirmation message on their mobile numbers.
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
                      LEAD MOBILE NUMBER *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
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
                      MEMBER 2 MOBILE NUMBER *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543211"
                        value={form.member2Phone}
                        onChange={(e) => setForm({ ...form, member2Phone: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Email & College ── */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    TEAM EMAIL ADDRESS *
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
                    <Loader2 className="h-4 w-4 animate-spin" /> Recording & Dispatching Invitation...
                  </span>
                ) : (
                  "Confirm Registration & Dispatch Mobile Invitation"
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Confirmation Ticket Card with Automated Invitation Status */
          <div className="py-4 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white font-display">
                Registration & Invitation Dispatched!
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                Your team has been officially registered. An automated event invitation confirmation text has been triggered for both participants.
              </p>
            </div>

            {/* Notification Badge */}
            <div className="space-y-1">
              {successData.gatewayResult?.dispatched ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-4 py-1 text-xs text-emerald-300 font-mono">
                  <Send className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Real SMS Dispatched to Mobile Phones via {successData.gatewayResult.provider?.toUpperCase()}!</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 px-4 py-1 text-xs text-cyan-300 font-mono">
                  <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Send Real Confirmation via WhatsApp or Native Device SMS</span>
                </div>
              )}
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
                <span className="text-slate-400 font-mono">PARTICIPANT 1 (LEAD)</span>
                <span className="text-cyan-300 font-medium">{successData.member1 || successData.name} ({successData.phone})</span>
              </div>
              {successData.member2 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-mono">PARTICIPANT 2</span>
                  <span className="text-purple-300 font-medium">{successData.member2} ({successData.member2Phone || "—"})</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">EVENT</span>
                <span className="text-white font-medium truncate max-w-[200px]">{event.title}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">STATUS</span>
                <span className="text-emerald-400 font-semibold">Seat Confirmed ✓</span>
              </div>
            </div>

            {/* Real Message Direct Action Launchers */}
            <div className="max-w-md mx-auto space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-300">
                  REAL MESSAGE DELIVERY TO PARTICIPANTS:
                </span>
                <span className="text-[10px] font-mono text-cyan-400">1-Tap Direct Send</span>
              </div>

              {/* Participant 1 Actions */}
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 space-y-2">
                <div className="text-[11px] font-mono text-cyan-300 font-semibold">
                  Participant 1: {successData.member1 || successData.name} ({successData.phone})
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {successData.member1WhatsappUrl && (
                    <a
                      href={successData.member1WhatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 py-2 px-3 text-xs text-emerald-300 font-mono transition text-center"
                    >
                      <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </a>
                  )}
                  {successData.member1SmsUrl && (
                    <a
                      href={successData.member1SmsUrl}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 hover:bg-blue-500/30 py-2 px-3 text-xs text-blue-300 font-mono transition text-center"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                      <span>Device SMS</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Participant 2 Actions */}
              {successData.member2 && successData.member2Phone && (
                <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-3 space-y-2">
                  <div className="text-[11px] font-mono text-purple-300 font-semibold">
                    Participant 2: {successData.member2} ({successData.member2Phone})
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {successData.member2WhatsappUrl && (
                      <a
                        href={successData.member2WhatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 py-2 px-3 text-xs text-emerald-300 font-mono transition text-center"
                      >
                        <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                        <span>WhatsApp</span>
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </a>
                    )}
                    {successData.member2SmsUrl && (
                      <a
                        href={successData.member2SmsUrl}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-purple-500/20 border border-purple-500/40 hover:bg-purple-500/30 py-2 px-3 text-xs text-purple-300 font-mono transition text-center"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-purple-400" />
                        <span>Device SMS</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Message Preview Accordion */}
            {successData.invitationMessage && (
              <div className="max-w-md mx-auto text-left rounded-xl bg-black/40 border border-white/10 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <MessageSquare className="h-3.5 w-3.5" /> Confirmation Message Preview
                  </span>
                  <button
                    onClick={copyInvitation}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    {copiedMsg ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedMsg ? "Copied" : "Copy Text"}</span>
                  </button>
                </div>
                <div className="text-[11px] text-slate-300 font-mono whitespace-pre-line bg-black/50 p-2.5 rounded-lg border border-white/5 max-h-32 overflow-y-auto leading-relaxed">
                  {successData.invitationMessage}
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
