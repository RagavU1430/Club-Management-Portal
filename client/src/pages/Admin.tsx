import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  Lock,
  Loader2,
  Calendar,
  MapPin,
  Users,
  FileSpreadsheet,
  Download,
  Trash2,
  Plus,
  X,
  Search,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  User,
  Phone,
  Briefcase,
  Sparkles,
  Upload,
  Globe,
  Save,
  Info,
  Camera,
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "../components/SocialIcons";

export default function Admin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [auth, setAuth] = useState<{ token: string; user: any } | null>(() => {
    // Initialize from localStorage during render to avoid setState in effect
    const t = localStorage.getItem("aif_token");
    const u = localStorage.getItem("aif_user");
    if (t && u) {
      try {
        return { token: t, user: JSON.parse(u) };
      } catch {
        return null;
      }
    }
    return null;
  });
  const [login, setLogin] = useState({ email: "", password: "" });
  const [loginErr, setLoginErr] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState(params.get("tab") || "events");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.error || d.message || "Sign in failed.");
      localStorage.setItem("aif_token", d.data.token);
      localStorage.setItem("aif_user", JSON.stringify(d.data.user));
      setAuth(d.data);
    } catch (err: any) {
      setLoginErr(err.message);
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("aif_token");
    localStorage.removeItem("aif_user");
    setAuth(null);
    navigate("/admin");
  }

  if (!auth) {
    return (
      <main className="flex min-h-[85vh] items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-mono text-cyan-300 tracking-wider font-semibold">RESTRICTED ACCESS</span>
            </div>
            <h1 className="text-2xl font-bold text-white font-display">Admin Portal</h1>
            <p className="mt-1 text-xs text-slate-400">
              Sign in to manage club events, responses, and members.
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">EMAIL / ID</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={login.email}
                    onChange={(e) => setLogin({ ...login, email: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    placeholder="admin@localhost"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">PASSWORD</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={login.password}
                    onChange={(e) => setLogin({ ...login, password: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {loginErr && (
                <div className="rounded-lg bg-red-950/40 border border-red-500/30 p-3 text-xs text-red-300">
                  {loginErr}
                </div>
              )}

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-semibold text-white transition hover:opacity-95 disabled:opacity-50 shadow-md shadow-cyan-500/25 mt-2 cursor-pointer"
              >
                {loggingIn ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Sign In to Console"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
      {/* Top Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1 font-semibold">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            CONSOLE ACTIVE // {auth.user.role.toUpperCase()}
          </div>
          <h1 className="text-3xl font-black text-white font-display">Club Management</h1>
          <p className="text-sm text-slate-400">Welcome back, {auth.user.name}.</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-xl glass px-4 py-2 text-xs font-mono text-slate-300 transition hover:text-white border border-white/10 hover:border-red-500/40 hover:bg-red-950/20 cursor-pointer"
        >
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex flex-wrap gap-2 border-b border-white/5 pb-3">
        {[
          { id: "events", label: "Events & Registrations", icon: Calendar },
          { id: "team", label: "Coordinators", icon: Users },
          { id: "club", label: "Club & Activities", icon: Sparkles },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                navigate(`/admin?tab=${t.id}`);
              }}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
                tab === t.id
                  ? "bg-cyan-400 text-black font-bold shadow-md shadow-cyan-500/25"
                  : "glass text-slate-300 hover:text-white border border-white/10"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <div className={tab === "events" ? "block" : "hidden"}>
        <EventManager />
      </div>
      <div className={tab === "team" ? "block" : "hidden"}>
        <TeamManager />
      </div>
      <div className={tab === "club" ? "block" : "hidden"}>
        <ClubManager />
      </div>
    </main>
  );
}

const FORM_STORAGE_KEY = "aif_admin_event_draft";
const SHOW_CREATE_KEY = "aif_admin_show_create";

const defaultEventForm = {
  title: "",
  date: "",
  venue: "",
  category: "Hackathon",
  capacity: 100,
  summary: "",
  description: "",
  tags: "AI, Hackathon, Coding",
  webhookUrl: "",
};

/* ── 1. Event Manager with Registration Responses & Excel Export ── */
function EventManager() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEventResponses, setSelectedEventResponses] = useState<any | null>(null);

  const [sheetConfig, setSheetConfig] = useState<any>(null);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [webhookInput, setWebhookInput] = useState("");
  const [spreadsheetInput, setSpreadsheetInput] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingEventId, setSyncingEventId] = useState<number | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [sheetMsg, setSheetMsg] = useState("");

  const [showCreate, setShowCreate] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SHOW_CREATE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem(FORM_STORAGE_KEY);
      if (saved) return { ...defaultEventForm, ...JSON.parse(saved) };
    } catch {}
    return defaultEventForm;
  });

  // Auto-save form draft so switching tabs or browser tabs never loses data
  useEffect(() => {
    try {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  useEffect(() => {
    try {
      localStorage.setItem(SHOW_CREATE_KEY, String(showCreate));
    } catch {}
  }, [showCreate]);

  useEffect(() => {
    load();
    loadSheetConfig();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/events?scope=all");
      const d = await res.json();
      if (d.success) setEvents(d.data);
    } catch {}
    setLoading(false);
  }

  async function loadSheetConfig() {
    try {
      const token = localStorage.getItem("aif_token");
      const res = await fetch("/api/settings/google-sheets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success && d.data) {
        setSheetConfig(d.data);
        setWebhookInput(d.data.webhookUrl || "");
        setSpreadsheetInput(d.data.spreadsheetUrl || "");
      }
    } catch {}
  }

  async function handleSaveSheetConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    setSheetMsg("");
    try {
      const token = localStorage.getItem("aif_token");
      const res = await fetch("/api/settings/google-sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          webhookUrl: webhookInput,
          spreadsheetUrl: spreadsheetInput,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setSheetConfig(d.data);
        setSheetMsg("Configuration saved successfully!");
        setTimeout(() => setSheetMsg(""), 3500);
      } else {
        alert(d.message || "Failed to save settings");
      }
    } catch (e: any) {
      alert(e.message || "Failed to save settings");
    }
    setSavingConfig(false);
  }

  async function handleSyncAll() {
    if (!sheetConfig?.hasWebhook && !webhookInput) {
      setShowSheetModal(true);
      return;
    }
    setSyncingAll(true);
    try {
      const token = localStorage.getItem("aif_token");
      const res = await fetch("/api/settings/google-sheets/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) {
        alert(`Successfully synced ${d.eventsProcessed} events and all responses to Google Sheets!`);
      } else {
        alert(d.message || "Failed to sync to Google Sheets");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    }
    setSyncingAll(false);
  }

  async function handleSyncSingle(eventId: number) {
    if (!sheetConfig?.hasWebhook && !webhookInput) {
      setShowSheetModal(true);
      return;
    }
    setSyncingEventId(eventId);
    try {
      const token = localStorage.getItem("aif_token");
      const res = await fetch(`/api/events/${eventId}/sync-sheet`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) {
        alert(d.message || "Synced to Google Sheets!");
      } else {
        alert(d.message || "Failed to sync event");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    }
    setSyncingEventId(null);
  }

  function handleCopyScript() {
    if (!sheetConfig?.scriptCode) return;
    navigator.clipboard.writeText(sheetConfig.scriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  }

  function handleClearDraft() {
    if (confirm("Clear this event draft?")) {
      setForm(defaultEventForm);
      try {
        localStorage.removeItem(FORM_STORAGE_KEY);
      } catch {}
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("aif_token");
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm(defaultEventForm);
        setShowCreate(false);
        try {
          localStorage.removeItem(FORM_STORAGE_KEY);
          localStorage.removeItem(SHOW_CREATE_KEY);
        } catch {}
        await load();
      } else {
        const err = await res.json();
        alert(err.message || "Failed to create event");
      }
    } catch (e: any) {
      alert(e.message || "Network error");
    }
    setSaving(false);
  }

  async function handleDelete(id: string | number) {
    if (!confirm("Are you sure you want to delete this event and all its registrations?")) return;
    try {
      const token = localStorage.getItem("aif_token");
      await fetch(`/api/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await load();
    } catch {}
  }

  function downloadExcel(eventId: string | number) {
    const token = localStorage.getItem("aif_token");
    window.open(`/api/events/${eventId}/registrations/export.xlsx?token=${token}`, "_blank");
  }

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Active Events</h2>
          <p className="text-xs text-slate-400">
            Create events, review participants, and sync responses directly to your Google Sheet.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-mono font-bold text-black hover:bg-cyan-300 transition shadow-[0_0_20px_rgba(0,240,255,0.3)]"
        >
          {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showCreate ? "Cancel" : "Create New Event"}</span>
        </button>
      </div>

      {/* Connected Google Spreadsheet Live Sync Banner */}
      <div className="glass rounded-2xl p-4 sm:p-5 border border-cyan-400/20 bg-gradient-to-r from-cyan-950/25 via-slate-900/40 to-emerald-950/25 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-white font-display">Connected Google Spreadsheet</h4>
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  sheetConfig?.hasWebhook
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                    : "bg-amber-500/15 text-amber-300 border-amber-400/30"
                }`}
              >
                {sheetConfig?.hasWebhook ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>AUTOMATIC REAL-TIME SYNC ACTIVE</span>
                  </>
                ) : (
                  "○ SYNC SCRIPT PENDING"
                )}
              </span>
            </div>
            <a
              href={sheetConfig?.spreadsheetUrl || "https://docs.google.com/spreadsheets/d/1MUkixf7X2_5cYzZJm1dL1atzRK2sIPxLpgKDGV7rTYk/edit?usp=sharing"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 mt-0.5 font-mono truncate max-w-lg"
            >
              <span>{sheetConfig?.spreadsheetUrl || "https://docs.google.com/spreadsheets/d/1MUkixf7X2_5cYzZJm1dL1atzRK2sIPxLpgKDGV7rTYk/edit?usp=sharing"}</span>
              <ExternalLink className="h-3 w-3 inline shrink-0" />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-end">
          <a
            href={sheetConfig?.spreadsheetUrl || "https://docs.google.com/spreadsheets/d/1MUkixf7X2_5cYzZJm1dL1atzRK2sIPxLpgKDGV7rTYk/edit?usp=sharing"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl glass px-3.5 py-2 text-xs font-mono text-cyan-300 hover:text-white hover:border-cyan-400/40 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Sheet</span>
          </a>

          <button
            onClick={() => setShowSheetModal(true)}
            className="flex items-center gap-1.5 rounded-xl glass px-3.5 py-2 text-xs font-mono text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/30 transition"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Setup Sync Script</span>
          </button>

          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 px-3.5 py-2 text-xs font-mono font-bold text-emerald-300 hover:bg-emerald-500/30 transition disabled:opacity-50"
            title="All new registrations sync automatically! Click here only if you need to force re-send all records."
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncingAll ? "animate-spin" : ""}`} />
            <span>{syncingAll ? "Re-syncing..." : "Re-Sync All"}</span>
          </button>
        </div>
      </div>

      {/* Event Creation Form */}
      {showCreate && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 sm:p-8 border border-cyan-400/30 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="font-display text-lg font-bold text-white">Event & Registration Form Setup</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-emerald-400/90 flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Draft Auto-Saved
              </span>
              {(form.title || form.description || form.venue) && (
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="text-[11px] font-mono text-slate-400 hover:text-red-400 transition underline underline-offset-4"
                >
                  Clear Draft
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-slate-400 mb-1">EVENT TITLE *</label>
              <input
                required
                placeholder="e.g. National Generative AI Hackathon 2026"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">CATEGORY *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#0d1321] px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="Hackathon">Hackathon</option>
                <option value="Workshop">Workshop</option>
                <option value="Keynote">Keynote</option>
                <option value="Competition">Competition</option>
                <option value="Conference">Conference</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">DATE & TIME *</label>
              <input
                type="datetime-local"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">VENUE / LOCATION *</label>
              <input
                required
                placeholder="e.g. AI Frontier Lab / Virtual Discord"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">MAX CAPACITY</label>
              <input
                type="number"
                min="0"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) || 0 })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-mono text-slate-400 mb-1">SHORT SUMMARY</label>
              <input
                placeholder="One-line summary for event cards"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-mono text-slate-400 mb-1">FULL DESCRIPTION *</label>
              <textarea
                required
                rows={3}
                placeholder="Detailed agenda, requirements, and rules..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-mono text-slate-400 mb-1">
                OVERRIDE WEBHOOK URL (OPTIONAL — LEAVE BLANK)
              </label>
              <input
                placeholder="Leave blank to use the connected club Google Sheet automatically"
                value={form.webhookUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes("docs.google.com/spreadsheets")) {
                    alert("Please do not paste your Google Sheet viewer link here. Real-time automatic syncing to your Google Sheet is already enabled globally! This field is only if you want an extra custom webhook (like Zapier).");
                    return;
                  }
                  setForm({ ...form, webhookUrl: val });
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-emerald-400/90 font-mono">
                ✓ Automatic sync is active: every registration is automatically saved into your Google Sheet in real-time. Leave blank.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-xl glass px-5 py-2.5 text-xs font-mono text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-mono font-bold text-black hover:bg-cyan-300 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50"
            >
              {saving ? "Creating Event..." : "Publish Event & Registration Form"}
            </button>
          </div>
        </form>
      )}

      {/* Events List */}
      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
      ) : events.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Calendar className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <p className="text-slate-400 text-sm">No events found. Click "Create New Event" above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => {
            const dateStr = new Date(ev.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            const regCount = ev.registrationCount || 0;

            return (
              <div
                key={ev.id}
                className="glass rounded-2xl p-5 border border-white/10 hover:border-white/20 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                      {ev.category || "Event"}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      {dateStr}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-500" />
                      {ev.venue || "Virtual"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white font-display">{ev.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-1">{ev.summary || ev.description}</p>
                </div>

                {/* Actions & Excel / Response Controls */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* View Responses Button */}
                  <button
                    onClick={() => setSelectedEventResponses(ev)}
                    className="flex items-center gap-1.5 rounded-xl glass px-3.5 py-2 text-xs font-mono text-white hover:border-cyan-400/40 hover:bg-white/10 transition"
                    title="View all registered participants"
                  >
                    <Users className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Responses</span>
                    <span className="ml-1 rounded-md bg-cyan-400/20 text-cyan-300 px-1.5 py-0.2 text-[10px] font-bold">
                      {regCount}
                    </span>
                  </button>

                  {/* Live Google Sheet Actions */}
                  <a
                    href={sheetConfig?.spreadsheetUrl || "https://docs.google.com/spreadsheets/d/1MUkixf7X2_5cYzZJm1dL1atzRK2sIPxLpgKDGV7rTYk/edit?usp=sharing"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl glass px-3 py-2 text-xs font-mono text-cyan-300 hover:text-white hover:border-cyan-400/40 transition"
                    title="Open this event's responses in Google Sheet"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Open Sheet</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <button
                    onClick={() => handleSyncSingle(ev.id)}
                    disabled={syncingEventId === ev.id}
                    className="flex items-center gap-1.5 rounded-xl glass px-3 py-2 text-xs font-mono text-slate-300 hover:text-emerald-300 hover:border-emerald-400/30 transition disabled:opacity-50"
                    title="Push this event and its registrations to Google Sheets tab"
                  >
                    <RefreshCw className={`h-3 w-3 ${syncingEventId === ev.id ? "animate-spin text-emerald-400" : "text-slate-400"}`} />
                    <span>{syncingEventId === ev.id ? "Syncing..." : "Sync"}</span>
                  </button>

                  {/* Direct Excel (.csv) Download */}
                  <button
                    onClick={() => downloadExcel(ev.id)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 px-3.5 py-2 text-xs font-mono text-emerald-300 hover:bg-emerald-500/25 transition"
                    title="Download participant responses directly into an Excel spreadsheet"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Excel</span>
                  </button>

                  {/* Delete Event */}
                  <button
                    onClick={() => handleDelete(ev.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/30 transition"
                    title="Delete event"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Responses Modal */}
      {selectedEventResponses && (
        <ResponsesModal
          event={selectedEventResponses}
          onClose={() => {
            setSelectedEventResponses(null);
            load();
          }}
        />
      )}

      {/* Google Sheet Live Sync Setup Modal */}
      {showSheetModal && (
        <GoogleSheetSetupModal
          config={sheetConfig}
          onClose={() => {
            setShowSheetModal(false);
            loadSheetConfig();
          }}
          onSave={handleSaveSheetConfig}
          webhookInput={webhookInput}
          setWebhookInput={setWebhookInput}
          spreadsheetInput={spreadsheetInput}
          setSpreadsheetInput={setSpreadsheetInput}
          savingConfig={savingConfig}
          sheetMsg={sheetMsg}
          copiedScript={copiedScript}
          onCopyScript={handleCopyScript}
          onSyncAll={handleSyncAll}
          syncingAll={syncingAll}
        />
      )}
    </div>
  );
}

/* ── 2. Modal: View Registered Attendee Responses & Search ── */
function ResponsesModal({ event, onClose }: { event: any; onClose: () => void }) {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("aif_token");
      const res = await fetch(`/api/events/${event.id}/registrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (d.success) setRegistrations(d.data);
    } catch {}
    setLoading(false);
  }, [event.id]);

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect -- Synchronizing with external system (API fetch)
    fetchRegistrations();
  }, [event.id, fetchRegistrations]);

  async function handleDeleteReg(_regId: number) {
    if (!confirm("Remove this attendee?")) return;
    try {
      const token = localStorage.getItem("aif_token");
      await fetch(`/api/events/${event.id}/registrations/${_regId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRegistrations();
    } catch {}
  }

  const filtered = registrations.filter((r) => {
    const q = query.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.college?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q) ||
      r.roll_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl rounded-3xl glass border border-white/15 shadow-2xl p-6 sm:p-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono text-emerald-400">EXCEL SHEET RESPONSES</span>
            </div>
            <h3 className="text-2xl font-bold text-white font-display">{event.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Total Registrations Recorded: <strong className="text-cyan-300">{registrations.length}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Controls & Search */}
        <div className="my-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              placeholder="Search by name, email, college..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              const token = localStorage.getItem("aif_token");
              window.open(`/api/events/${event.id}/registrations/export.xlsx?token=${token}`, "_blank");
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-mono font-bold text-black hover:bg-emerald-400 transition shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Download Excel (.xlsx)</span>
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-auto rounded-xl border border-white/10 bg-black/40">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs font-mono">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-400 mb-2" />
              Loading records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              No registration responses found.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-slate-400 font-mono border-b border-white/10 uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Participant</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">College / Roll No</th>
                  <th className="p-3">Year</th>
                  <th className="p-3">Registered At</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition">
                    <td className="p-3 font-mono text-[11px] text-cyan-400">{r.registrationCode || r.id}</td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{r.name}</div>
                      <div className="text-[11px] text-slate-400">{r.email}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-300">{r.phone || "—"}</td>
                    <td className="p-3">
                      <div className="text-white">{r.college || "—"}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.roll_number || ""}</div>
                    </td>
                    <td className="p-3">{r.year || "—"}</td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteReg(r.id)}
                        className="text-slate-500 hover:text-red-400 transition"
                        title="Remove attendee"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 3. Modal: Google Sheets Live Sync Setup ── */
function GoogleSheetSetupModal({
  config,
  onClose,
  onSave,
  webhookInput,
  setWebhookInput,
  spreadsheetInput,
  setSpreadsheetInput,
  savingConfig,
  sheetMsg,
  copiedScript,
  onCopyScript,
  onSyncAll,
  syncingAll,
}: {
  config: any;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  webhookInput: string;
  setWebhookInput: (v: string) => void;
  spreadsheetInput: string;
  setSpreadsheetInput: (v: string) => void;
  savingConfig: boolean;
  sheetMsg: string;
  copiedScript: boolean;
  onCopyScript: () => void;
  onSyncAll: () => void;
  syncingAll: boolean;
}) {
  const currentUrl = spreadsheetInput || config?.spreadsheetUrl || "https://docs.google.com/spreadsheets/d/1MUkixf7X2_5cYzZJm1dL1atzRK2sIPxLpgKDGV7rTYk/edit?usp=sharing";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl glass border border-white/15 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display">Google Sheets Live Sync</h3>
              <p className="text-xs text-slate-400">
                Automatically create a tab for every event and record registrations in real-time.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Connected Sheet */}
        <div className="rounded-xl p-4 bg-emerald-950/25 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-400 font-bold">CONNECTED SPREADSHEET</span>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-cyan-300 hover:text-white flex items-center gap-1 hover:underline"
            >
              <span>Open in Google Sheets</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-xs text-slate-300 font-mono break-all">{currentUrl}</p>
        </div>

        {/* Step-by-Step Connection Instructions */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-white font-display flex items-center gap-2">
            <span>30-Second Setup Guide</span>
          </h4>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start gap-3 rounded-xl bg-white/5 p-3.5 border border-white/5">
              <span className="h-5 w-5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <div>
                <p className="font-semibold text-white">Open your Google Spreadsheet</p>
                <p className="text-slate-400 mt-0.5">
                  Click the "Open in Google Sheets" link above, then in the top navigation bar click{" "}
                  <strong className="text-cyan-300">Extensions &gt; Apps Script</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-white/5 p-3.5 border border-white/5">
              <span className="h-5 w-5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">Paste the Sync Script</p>
                  <button
                    type="button"
                    onClick={onCopyScript}
                    className="flex items-center gap-1.5 rounded-lg bg-cyan-400/15 border border-cyan-400/30 px-2.5 py-1 text-[11px] font-mono text-cyan-300 hover:bg-cyan-400/25 transition"
                  >
                    {copiedScript ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedScript ? "Copied!" : "Copy Script Code"}</span>
                  </button>
                </div>
                <p className="text-slate-400 mt-1">
                  Replace all existing text in the Apps Script editor with the copied script.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-white/5 p-3.5 border border-white/5">
              <span className="h-5 w-5 rounded-full bg-cyan-400/20 text-cyan-300 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </span>
              <div>
                <p className="font-semibold text-white">Deploy as Web App</p>
                <p className="text-slate-400 mt-0.5">
                  Click <strong className="text-cyan-300">Deploy &gt; New deployment</strong>, select type{" "}
                  <strong className="text-cyan-300">Web app</strong>, set <em>Who has access</em> to{" "}
                  <strong className="text-emerald-300">"Anyone"</strong>, click <strong>Deploy</strong>, and copy the Web App URL.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook URL Form */}
        <form onSubmit={onSave} className="space-y-4 pt-2 border-t border-white/10">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              PASTE GOOGLE APPS SCRIPT WEB APP URL (ENDS IN /exec)
            </label>
            <input
              required
              placeholder="https://script.google.com/macros/s/.../exec"
              value={webhookInput}
              onChange={(e) => setWebhookInput(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">
              CONNECTED SPREADSHEET URL
            </label>
            <input
              required
              value={spreadsheetInput}
              onChange={(e) => setSpreadsheetInput(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono"
            />
          </div>

          {sheetMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-mono text-center">
              {sheetMsg}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onSyncAll}
              disabled={syncingAll || !webhookInput}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl glass px-4 py-2.5 text-xs font-mono text-emerald-300 hover:text-white border border-emerald-400/30 hover:bg-emerald-500/20 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncingAll ? "animate-spin" : ""}`} />
              <span>{syncingAll ? "Syncing All..." : "Sync All Events & Registrations Now"}</span>
            </button>

            <button
              type="submit"
              disabled={savingConfig}
              className="w-full sm:w-auto rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-mono font-bold text-black hover:bg-cyan-300 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50"
            >
              {savingConfig ? "Saving..." : "Save Connection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── 3. Coordinators Manager ── */
function TeamManager() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [q, setQ] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [addForm, setAddForm] = useState({
    name: "",
    role: "Coordinator",
    department: "Artificial Intelligence & Data Science",
    photo: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    bio: "",
  });

  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    role: "Coordinator",
    department: "Artificial Intelligence & Data Science",
    photo: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    bio: "",
  });

  const loadCoordinators = useCallback(() => {
    setLoading(true);
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setMembers(d.data);
        } else {
          setMembers([]);
        }
      })
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCoordinators();
  }, [loadCoordinators]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg("");
    setErrorMsg("");
    try {
      const token = localStorage.getItem("aif_token");
      const res = await fetch("/api/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addForm),
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || d.error || "Failed to add coordinator.");
      setMembers((prev) => [...prev, d.data]);
      setAddForm({
        name: "",
        role: "Coordinator",
        department: "Artificial Intelligence & Data Science",
        photo: "",
        email: "",
        phone: "",
        linkedin: "",
        github: "",
        bio: "",
      });
      setShowAddForm(false);
      setStatusMsg("Coordinator added successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not add coordinator.");
    } finally {
      setSaving(false);
    }
  }

  function handleOpenEdit(member: any) {
    setEditingMember(member);
    setEditForm({
      name: member.name || "",
      role: member.role || "Coordinator",
      department: member.department || "Artificial Intelligence & Data Science",
      photo: member.photo || "",
      email: member.email || "",
      phone: member.phone || "",
      linkedin: member.linkedin || "",
      github: member.github || "",
      bio: member.bio || "",
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMember) return;
    setUpdating(true);
    setStatusMsg("");
    setErrorMsg("");
    try {
      const token = localStorage.getItem("aif_token");
      const res = await fetch(`/api/team/${editingMember.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || d.error || "Failed to update coordinator.");
      setMembers((prev) => prev.map((m) => (m.id === editingMember.id ? d.data : m)));
      setEditingMember(null);
      setStatusMsg("Coordinator updated successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not update coordinator.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Are you sure you want to delete coordinator "${name}"?`)) return;
    setStatusMsg("");
    setErrorMsg("");
    try {
      const token = localStorage.getItem("aif_token");
      const res = await fetch(`/api/team/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || d.error || "Failed to delete coordinator.");
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setStatusMsg(`Coordinator "${name}" removed.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not delete coordinator.");
    }
  }

  async function handleDeleteAll() {
    if (!confirm("Are you sure you want to DELETE ALL coordinators? This will permanently remove all coordinator profiles from the public directory.")) {
      return;
    }
    setStatusMsg("");
    setErrorMsg("");
    try {
      const token = localStorage.getItem("aif_token");
      const res = await fetch("/api/team", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || d.error || "Failed to clear coordinators.");
      setMembers([]);
      setStatusMsg("All coordinators have been cleared.");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not delete all coordinators.");
    }
  }

  const filtered = members.filter((m) => {
    if (!q) return true;
    const query = q.toLowerCase();
    return (
      (m.name && m.name.toLowerCase().includes(query)) ||
      (m.role && m.role.toLowerCase().includes(query)) ||
      (m.department && m.department.toLowerCase().includes(query)) ||
      (m.email && m.email.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Coordinators Directory</h2>
          <p className="text-xs text-slate-400 mt-1">
            Create, update, or remove club coordinators. Changes automatically sync to the public Coordinators page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {members.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/30 px-3.5 py-2 text-xs font-mono text-red-300 hover:bg-red-900/40 hover:text-white transition"
              title="Delete all coordinators"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete All</span>
            </button>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-mono font-bold text-black hover:bg-cyan-300 transition shadow-[0_0_15px_rgba(0,240,255,0.3)]"
          >
            {showAddForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            <span>{showAddForm ? "Cancel" : "Add Coordinator"}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300 font-mono flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg("")} className="text-emerald-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 font-mono flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-red-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Add Coordinator Form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="glass rounded-2xl p-6 border border-cyan-400/30 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="font-display font-semibold text-white text-base">New Coordinator Profile</h3>
            <span className="text-xs font-mono text-cyan-400">INPUT DETAILS</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">FULL NAME *</label>
              <input
                required
                placeholder="e.g. Aarav Mehta"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">ROLE / TITLE *</label>
              <select
                required
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#0c1222] px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="Coordinator">Coordinator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">DEPARTMENT / DIVISION</label>
              <input
                placeholder="e.g. Artificial Intelligence & Data Science"
                value={addForm.department}
                onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="coordinator@aifrontierclub.org"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">PHONE NUMBER</label>
              <input
                placeholder="+1 (555) 000-0000"
                value={addForm.phone}
                onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">LINKEDIN URL</label>
              <input
                placeholder="https://linkedin.com/in/..."
                value={addForm.linkedin}
                onChange={(e) => setAddForm({ ...addForm, linkedin: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">GITHUB URL</label>
              <input
                placeholder="https://github.com/..."
                value={addForm.github}
                onChange={(e) => setAddForm({ ...addForm, github: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">BIO / RESEARCH FOCUS</label>
              <input
                placeholder="Focuses on neural network architectures and generative AI agents."
                value={addForm.bio}
                onChange={(e) => setAddForm({ ...addForm, bio: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl glass px-5 py-2 text-xs font-mono text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-cyan-400 px-6 py-2 text-xs font-mono font-bold text-black hover:bg-cyan-300 transition shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Create Coordinator"}
            </button>
          </div>
        </form>
      )}

      {/* Search Bar & Count Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="search"
            placeholder="Search by name, role, department..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="text-xs font-mono text-slate-400">
          Total Coordinators: <span className="text-cyan-300 font-bold">{members.length}</span>
        </div>
      </div>

      {/* Coordinators Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-cyan-400 mb-2" />
          <p className="text-xs font-mono">Loading coordinators...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl glass border border-white/10 p-8">
          <User className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <h4 className="font-display font-bold text-white text-lg">
            {members.length === 0 ? "No Coordinators in Directory" : "No matching coordinators found"}
          </h4>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {members.length === 0
              ? "All existing coordinators have been cleared. Click 'Add Coordinator' above to create one."
              : `No coordinator matches "${q}".`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="group relative glass rounded-2xl p-5 border border-white/10 hover:border-cyan-400/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                      {m.name}
                    </h4>
                    <span className="inline-block mt-1 rounded-full bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-0.5 text-[11px] font-mono text-cyan-300">
                      {m.role}
                    </span>
                  </div>

                  {/* Actions: Update & Delete controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-400/10 border border-transparent hover:border-cyan-400/30 transition"
                      title="Update coordinator details"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id, m.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-500/30 transition"
                      title="Delete coordinator"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {m.department && (
                  <p className="text-xs font-mono text-purple-300 mt-1 flex items-center gap-1">
                    <Briefcase className="h-3 w-3 inline shrink-0" />
                    {m.department}
                  </p>
                )}

                {m.bio && (
                  <p className="text-xs text-slate-300 mt-2.5 line-clamp-2 leading-relaxed">
                    {m.bio}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="truncate max-w-[160px]">{m.email || "No email"}</span>
                <div className="flex items-center gap-2">
                  {m.phone && (
                    <span title={m.phone} className="hover:text-white">
                      <Phone className="h-3.5 w-3.5" />
                    </span>
                  )}
                  {m.linkedin && (
                    <a
                      href={m.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-cyan-300"
                      title="LinkedIn"
                    >
                      <LinkedinIcon className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {m.github && (
                    <a
                      href={m.github}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white"
                      title="GitHub"
                    >
                      <GithubIcon className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Edit Coordinator Modal ── */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl rounded-3xl glass border border-white/15 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setEditingMember(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6">
              <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-0.5 text-xs font-mono text-cyan-300">
                UPDATE COORDINATOR
              </span>
              <h3 className="text-2xl font-bold text-white font-display mt-2">
                Edit {editingMember.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Modify coordinator credentials, title, department, or contact details.
              </p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-left">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">FULL NAME *</label>
                  <input
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">ROLE / TITLE *</label>
                  <select
                    required
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#0c1222] px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="Coordinator">Coordinator</option>
                    {editForm.role && editForm.role !== "Coordinator" && (
                      <option value={editForm.role}>{editForm.role}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">DEPARTMENT / DIVISION</label>
                  <input
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    placeholder="Artificial Intelligence & Data Science"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">PHONE NUMBER</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">LINKEDIN URL</label>
                  <input
                    value={editForm.linkedin}
                    onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-slate-400 mb-1">GITHUB URL</label>
                  <input
                    value={editForm.github}
                    onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-slate-400 mb-1">BIO / RESEARCH FOCUS</label>
                  <textarea
                    rows={3}
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="rounded-xl glass px-5 py-2.5 text-xs font-mono text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-mono font-bold text-black hover:bg-cyan-300 transition shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50"
                >
                  {updating ? "Saving Changes..." : "Update Coordinator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 4. Club & Activities Manager ── */
const ACTIVITY_CATEGORIES = [
  "Workshop",
  "Hackathon",
  "Seminar",
  "Industrial Visit",
  "Symposium",
  "Guest Lecture",
  "Exhibition",
  "Project Showcase",
  "Meetup",
];

function ClubManager() {
  const [subTab, setSubTab] = useState<"activities" | "details">("activities");

  /* ── State: Club Activities ── */
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activityQuery, setActivityQuery] = useState("");
  const [activityStatus, setActivityStatus] = useState("");
  const [activityError, setActivityError] = useState("");
  const [savingActivity, setSavingActivity] = useState(false);
  const [uploadingAddPhoto, setUploadingAddPhoto] = useState(false);

  const [addActivityForm, setAddActivityForm] = useState({
    name: "",
    photo: "",
    category: "Workshop",
    date: new Date().toISOString().split("T")[0],
    description: "",
  });

  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  const [editActivityForm, setEditActivityForm] = useState({
    name: "",
    photo: "",
    category: "Workshop",
    date: "",
    description: "",
  });
  const [updatingActivity, setUpdatingActivity] = useState(false);
  const [uploadingEditPhoto, setUploadingEditPhoto] = useState(false);

  /* ── State: Basic Club Details ── */
  const [clubDetails, setClubDetails] = useState({
    name: "AI Frontier Club",
    department: "Artificial Intelligence & Data Science",
    tagline: "Where Curious Minds Learn, Code, and Build with AI",
    description: "",
    vision: "",
    mission: "",
    founded_year: "2021",
    email: "",
    phone: "",
    location: "",
    social_links: {
      linkedin: "",
      github: "",
      instagram: "",
      discord: "",
      youtube: "",
    },
  });
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsStatus, setDetailsStatus] = useState("");
  const [detailsError, setDetailsError] = useState("");

  /* ── Fetch Data ── */
  const loadActivities = useCallback(() => {
    setLoadingActivities(true);
    fetch("/api/activities")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setActivities(d.data);
        } else {
          setActivities([]);
        }
      })
      .catch(() => setActivities([]))
      .finally(() => setLoadingActivities(false));
  }, []);

  const loadClubDetails = useCallback(() => {
    setLoadingDetails(true);
    fetch("/api/club-details")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const details = d.data;
          const links = typeof details.social_links === "object" ? details.social_links : {};
          setClubDetails({
            name: details.name || "AI Frontier Club",
            department: details.department || "Artificial Intelligence & Data Science",
            tagline: details.tagline || "",
            description: details.description || "",
            vision: details.vision || "",
            mission: details.mission || "",
            founded_year: details.founded_year || "2021",
            email: details.email || "",
            phone: details.phone || "",
            location: details.location || "",
            social_links: {
              linkedin: links.linkedin || "",
              github: links.github || "",
              instagram: links.instagram || "",
              discord: links.discord || "",
              youtube: links.youtube || "",
            },
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDetails(false));
  }, []);

  useEffect(() => {
    loadActivities();
    loadClubDetails();
  }, [loadActivities, loadClubDetails]);

  /* ── Image File Upload Handler ── */
  async function handleFileUpload(file: File, isEdit = false) {
    if (!file) return;
    if (isEdit) setUploadingEditPhoto(true);
    else setUploadingAddPhoto(true);
    try {
      const token = localStorage.getItem("aif_token");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Image upload failed.");
      if (isEdit) {
        setEditActivityForm((prev) => ({ ...prev, photo: data.url }));
      } else {
        setAddActivityForm((prev) => ({ ...prev, photo: data.url }));
      }
    } catch (err: any) {
      if (isEdit) setActivityError(err.message || "Failed to upload image.");
      else setActivityError(err.message || "Failed to upload image.");
    } finally {
      if (isEdit) setUploadingEditPhoto(false);
      else setUploadingAddPhoto(false);
    }
  }

  /* ── Create Activity ── */
  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    setSavingActivity(true);
    setActivityStatus("");
    setActivityError("");
    try {
      const token = localStorage.getItem("aif_token");
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addActivityForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || "Failed to add activity.");
      setActivities((prev) => [data.data, ...prev]);
      setAddActivityForm({
        name: "",
        photo: "",
        category: "Workshop",
        date: new Date().toISOString().split("T")[0],
        description: "",
      });
      setShowAddModal(false);
      setActivityStatus("Club activity added successfully.");
    } catch (err: any) {
      setActivityError(err.message || "Could not add club activity.");
    } finally {
      setSavingActivity(false);
    }
  }

  /* ── Open Edit Activity Modal ── */
  function handleOpenEditActivity(act: any) {
    setEditingActivity(act);
    setEditActivityForm({
      name: act.name || "",
      photo: act.photo || "",
      category: act.category || "Workshop",
      date: act.date || "",
      description: act.description || "",
    });
  }

  /* ── Update Activity ── */
  async function handleUpdateActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!editingActivity) return;
    setUpdatingActivity(true);
    setActivityStatus("");
    setActivityError("");
    try {
      const token = localStorage.getItem("aif_token");
      const res = await fetch(`/api/activities/${editingActivity.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editActivityForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || "Failed to update activity.");
      setActivities((prev) => prev.map((a) => (a.id === editingActivity.id ? data.data : a)));
      setEditingActivity(null);
      setActivityStatus("Club activity updated successfully.");
    } catch (err: any) {
      setActivityError(err.message || "Could not update club activity.");
    } finally {
      setUpdatingActivity(false);
    }
  }

  /* ── Delete Activity ── */
  async function handleDeleteActivity(id: number, name: string) {
    if (!confirm(`Are you sure you want to delete activity "${name}"?`)) return;
    setActivityStatus("");
    setActivityError("");
    try {
      const token = localStorage.getItem("aif_token");
      const res = await fetch(`/api/activities/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || "Failed to delete activity.");
      setActivities((prev) => prev.filter((a) => a.id !== id));
      setActivityStatus(`Activity "${name}" deleted.`);
    } catch (err: any) {
      setActivityError(err.message || "Could not delete activity.");
    }
  }

  /* ── Save Club Details ── */
  async function handleSaveClubDetails(e: React.FormEvent) {
    e.preventDefault();
    setSavingDetails(true);
    setDetailsStatus("");
    setDetailsError("");
    try {
      const token = localStorage.getItem("aif_token");
      const res = await fetch("/api/club-details", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(clubDetails),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || data.error || "Failed to update club details.");
      setDetailsStatus("Club details saved successfully.");
    } catch (err: any) {
      setDetailsError(err.message || "Could not save club details.");
    } finally {
      setSavingDetails(false);
    }
  }

  const filteredActivities = activities.filter((a) => {
    if (!activityQuery) return true;
    const query = activityQuery.toLowerCase();
    return (
      (a.name && a.name.toLowerCase().includes(query)) ||
      (a.category && a.category.toLowerCase().includes(query)) ||
      (a.description && a.description.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Club Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage photo-documented club activities and foundational details for AI Frontier Club.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setSubTab("activities")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition ${
              subTab === "activities"
                ? "bg-cyan-400 text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Club Activities ({activities.length})</span>
          </button>
          <button
            onClick={() => setSubTab("details")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition ${
              subTab === "details"
                ? "bg-cyan-400 text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Info className="h-3.5 w-3.5" />
            <span>Basic Club Details</span>
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SUBTAB 1: CLUB ACTIVITIES (PHOTO & NAME & DETAILS)         */}
      {/* ──────────────────────────────────────────────────────────── */}
      {subTab === "activities" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="search"
                placeholder="Search activities by name, category..."
                value={activityQuery}
                onChange={(e) => setActivityQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-mono font-bold text-black hover:bg-cyan-300 transition shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Club Activity</span>
            </button>
          </div>

          {activityStatus && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300 font-mono flex items-center justify-between">
              <span>{activityStatus}</span>
              <button onClick={() => setActivityStatus("")} className="text-emerald-400 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {activityError && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 font-mono flex items-center justify-between">
              <span>{activityError}</span>
              <button onClick={() => setActivityError("")} className="text-red-400 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Activities Grid */}
          {loadingActivities ? (
            <div className="py-20 text-center text-slate-400">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-cyan-400 mb-2" />
              <p className="text-xs font-mono">Loading club activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-16 rounded-2xl glass border border-white/10 p-8">
              <Camera className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <h4 className="font-display font-bold text-white text-lg">
                {activities.length === 0 ? "No Club Activities Added Yet" : "No matching activities found"}
              </h4>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                {activities.length === 0
                  ? "Document hackathons, industrial visits, symposiums, or workshops with photos and details."
                  : `No activity matches "${activityQuery}".`}
              </p>
              {activities.length === 0 && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400/20 border border-cyan-400/40 px-4 py-2 text-xs font-mono text-cyan-300 hover:bg-cyan-400 hover:text-black transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add First Activity
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="group relative glass rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-400/40 transition-all flex flex-col justify-between"
                >
                  {/* Activity Photo */}
                  <div className="relative h-48 w-full bg-slate-900/60 overflow-hidden">
                    {act.photo ? (
                      <img
                        src={act.photo}
                        alt={act.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 bg-gradient-to-br from-purple-950/30 to-cyan-950/30">
                        <Camera className="h-10 w-10 stroke-1 text-slate-600 mb-1" />
                        <span className="text-[11px] font-mono">No Photo Uploaded</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                    {/* Category & Date Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-cyan-400/90 text-black px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider shadow">
                        {act.category || "Workshop"}
                      </span>
                    </div>

                    {act.date && (
                      <div className="absolute bottom-2.5 left-3 text-[11px] font-mono text-cyan-200 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{act.date}</span>
                      </div>
                    )}

                    {/* Action buttons on top right */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
                      <button
                        onClick={() => handleOpenEditActivity(act)}
                        className="p-1 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-white/10 transition"
                        title="Edit activity"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(act.id, act.name)}
                        className="p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-white/10 transition"
                        title="Delete activity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-display font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                        {act.name}
                      </h4>
                      {act.description && (
                        <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-3">
                          {act.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>ID: #{act.id}</span>
                      <button
                        onClick={() => handleOpenEditActivity(act)}
                        className="text-cyan-400 hover:text-cyan-300 hover:underline inline-flex items-center gap-1"
                      >
                        <span>Edit Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Add Activity Modal ── */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <div className="relative w-full max-w-xl rounded-3xl glass border border-white/15 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="mb-6 pb-3 border-b border-white/10">
                  <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-0.5 text-xs font-mono text-cyan-300">
                    NEW ACTIVITY
                  </span>
                  <h3 className="text-2xl font-bold text-white font-display mt-2">
                    Add Club Activity
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload an event or project photo with activity name and key details.
                  </p>
                </div>

                <form onSubmit={handleAddActivity} className="space-y-4 text-left">
                  {/* Activity Name */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      ACTIVITY NAME *
                    </label>
                    <input
                      required
                      placeholder="e.g. National Generative AI Hackathon 2026"
                      value={addActivityForm.name}
                      onChange={(e) => setAddActivityForm({ ...addActivityForm, name: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  {/* Category & Date */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">CATEGORY</label>
                      <select
                        value={addActivityForm.category}
                        onChange={(e) => setAddActivityForm({ ...addActivityForm, category: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#0c1222] px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      >
                        {ACTIVITY_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">DATE</label>
                      <input
                        type="date"
                        value={addActivityForm.date}
                        onChange={(e) => setAddActivityForm({ ...addActivityForm, date: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Photo Upload & URL */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      ACTIVITY PHOTO (UPLOAD FILE OR PASTE URL)
                    </label>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        placeholder="https://... or click Upload button"
                        value={addActivityForm.photo}
                        onChange={(e) => setAddActivityForm({ ...addActivityForm, photo: e.target.value })}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                      />

                      <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500/20 border border-purple-400/30 px-4 py-2 text-xs font-mono text-purple-300 hover:bg-purple-500/30 hover:text-white transition">
                        <Upload className="h-3.5 w-3.5" />
                        <span>{uploadingAddPhoto ? "Uploading..." : "Upload File"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingAddPhoto}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0], false);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Live Preview of Photo */}
                    {addActivityForm.photo && (
                      <div className="mt-3 relative rounded-xl overflow-hidden border border-cyan-400/30 w-full h-36 bg-black/40">
                        <img
                          src={addActivityForm.photo}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                        />
                        <button
                          type="button"
                          onClick={() => setAddActivityForm({ ...addActivityForm, photo: "" })}
                          className="absolute top-2 right-2 p-1 rounded-lg bg-black/70 text-red-400 hover:text-white"
                          title="Remove photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      DESCRIPTION / HIGHLIGHTS
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Brief overview of the activity, student attendance, key speakers, or achievements..."
                      value={addActivityForm.description}
                      onChange={(e) => setAddActivityForm({ ...addActivityForm, description: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="rounded-xl glass px-5 py-2.5 text-xs font-mono text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingActivity || uploadingAddPhoto}
                      className="rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-mono font-bold text-black hover:bg-cyan-300 transition shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50"
                    >
                      {savingActivity ? "Saving..." : "Save Activity"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Edit Activity Modal ── */}
          {editingActivity && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <div className="relative w-full max-w-xl rounded-3xl glass border border-white/15 shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
                <button
                  onClick={() => setEditingActivity(null)}
                  className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="mb-6 pb-3 border-b border-white/10">
                  <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-0.5 text-xs font-mono text-cyan-300">
                    UPDATE ACTIVITY
                  </span>
                  <h3 className="text-2xl font-bold text-white font-display mt-2">
                    Edit {editingActivity.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Modify photo, title, event category, or descriptive highlights.
                  </p>
                </div>

                <form onSubmit={handleUpdateActivity} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      ACTIVITY NAME *
                    </label>
                    <input
                      required
                      value={editActivityForm.name}
                      onChange={(e) => setEditActivityForm({ ...editActivityForm, name: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">CATEGORY</label>
                      <select
                        value={editActivityForm.category}
                        onChange={(e) => setEditActivityForm({ ...editActivityForm, category: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#0c1222] px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      >
                        {ACTIVITY_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">DATE</label>
                      <input
                        type="date"
                        value={editActivityForm.date}
                        onChange={(e) => setEditActivityForm({ ...editActivityForm, date: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      ACTIVITY PHOTO (UPLOAD FILE OR PASTE URL)
                    </label>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        placeholder="https://... or click Upload button"
                        value={editActivityForm.photo}
                        onChange={(e) => setEditActivityForm({ ...editActivityForm, photo: e.target.value })}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                      />

                      <label className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500/20 border border-purple-400/30 px-4 py-2 text-xs font-mono text-purple-300 hover:bg-purple-500/30 hover:text-white transition">
                        <Upload className="h-3.5 w-3.5" />
                        <span>{uploadingEditPhoto ? "Uploading..." : "Upload File"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingEditPhoto}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(e.target.files[0], true);
                            }
                          }}
                        />
                      </label>
                    </div>

                    {editActivityForm.photo && (
                      <div className="mt-3 relative rounded-xl overflow-hidden border border-cyan-400/30 w-full h-36 bg-black/40">
                        <img
                          src={editActivityForm.photo}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                        />
                        <button
                          type="button"
                          onClick={() => setEditActivityForm({ ...editActivityForm, photo: "" })}
                          className="absolute top-2 right-2 p-1 rounded-lg bg-black/70 text-red-400 hover:text-white"
                          title="Remove photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">
                      DESCRIPTION / HIGHLIGHTS
                    </label>
                    <textarea
                      rows={3}
                      value={editActivityForm.description}
                      onChange={(e) => setEditActivityForm({ ...editActivityForm, description: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditingActivity(null)}
                      className="rounded-xl glass px-5 py-2.5 text-xs font-mono text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingActivity || uploadingEditPhoto}
                      className="rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-mono font-bold text-black hover:bg-cyan-300 transition shadow-[0_0_20px_rgba(0,240,255,0.3)] disabled:opacity-50"
                    >
                      {updatingActivity ? "Updating..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* SUBTAB 2: BASIC CLUB DETAILS                                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      {subTab === "details" && (
        loadingDetails ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-cyan-400 mb-2" />
            <p className="text-xs font-mono">Loading club details...</p>
          </div>
        ) : (
        <form
          onSubmit={handleSaveClubDetails}
          className="glass rounded-2xl p-6 sm:p-8 border border-white/10 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span className="rounded-full bg-purple-400/10 border border-purple-400/20 px-3 py-0.5 text-xs font-mono text-purple-300">
                GENERAL IDENTITY
              </span>
              <h3 className="text-xl font-bold text-white font-display mt-2">
                Basic Details of the Club
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure primary metadata, department, mission, and contact information.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingDetails}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-mono font-bold text-black hover:bg-cyan-300 transition shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{savingDetails ? "Saving Details..." : "Save Club Details"}</span>
            </button>
          </div>

          {detailsStatus && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300 font-mono flex items-center justify-between">
              <span>{detailsStatus}</span>
              <button onClick={() => setDetailsStatus("")} className="text-emerald-400 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {detailsError && (
            <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300 font-mono flex items-center justify-between">
              <span>{detailsError}</span>
              <button onClick={() => setDetailsError("")} className="text-red-400 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Club Name */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                CLUB NAME *
              </label>
              <input
                required
                value={clubDetails.name}
                onChange={(e) => setClubDetails({ ...clubDetails, name: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder="AI Frontier Club"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                DEPARTMENT / DIVISION *
              </label>
              <input
                required
                value={clubDetails.department}
                onChange={(e) => setClubDetails({ ...clubDetails, department: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder="Artificial Intelligence & Data Science"
              />
            </div>

            {/* Tagline */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                CLUB TAGLINE / MOTTO
              </label>
              <input
                value={clubDetails.tagline}
                onChange={(e) => setClubDetails({ ...clubDetails, tagline: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder="Where Curious Minds Learn, Code, and Build with AI"
              />
            </div>

            {/* Founded Year */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                ESTABLISHED / FOUNDED YEAR
              </label>
              <input
                value={clubDetails.founded_year}
                onChange={(e) => setClubDetails({ ...clubDetails, founded_year: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder="2021"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                CAMPUS LOCATION / ROOM
              </label>
              <input
                value={clubDetails.location}
                onChange={(e) => setClubDetails({ ...clubDetails, location: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder="Center for AI Excellence, Dept of AI & DS"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                OFFICIAL CONTACT EMAIL
              </label>
              <input
                type="email"
                value={clubDetails.email}
                onChange={(e) => setClubDetails({ ...clubDetails, email: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder="contact@aifrontierclub.org"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                CONTACT PHONE NUMBER
              </label>
              <input
                value={clubDetails.phone}
                onChange={(e) => setClubDetails({ ...clubDetails, phone: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder="+91 98765 43210"
              />
            </div>

            {/* About / Overview */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-slate-400 mb-1.5">
                CLUB OVERVIEW & DESCRIPTION
              </label>
              <textarea
                rows={3}
                value={clubDetails.description}
                onChange={(e) => setClubDetails({ ...clubDetails, description: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder="The premier student guild exploring, coding, and building with Artificial Intelligence and Data Science..."
              />
            </div>

            {/* Vision */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">VISION</label>
              <textarea
                rows={3}
                value={clubDetails.vision}
                onChange={(e) => setClubDetails({ ...clubDetails, vision: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder="To pioneer artificial intelligence learning through open-source software, student hackathons, and high-impact projects..."
              />
            </div>

            {/* Mission */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1.5">MISSION</label>
              <textarea
                rows={3}
                value={clubDetails.mission}
                onChange={(e) => setClubDetails({ ...clubDetails, mission: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                placeholder="Empower students to solve real-world problems by mastering machine learning, computer vision, and hands-on system building..."
              />
            </div>
          </div>

          {/* Social Links Sub-Section */}
          <div className="pt-5 border-t border-white/10">
            <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-cyan-400" />
              <span>OFFICIAL SOCIAL MEDIA CHANNELS</span>
            </h4>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">LINKEDIN</label>
                <input
                  placeholder="https://linkedin.com/company/..."
                  value={clubDetails.social_links.linkedin}
                  onChange={(e) =>
                    setClubDetails({
                      ...clubDetails,
                      social_links: { ...clubDetails.social_links, linkedin: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">GITHUB</label>
                <input
                  placeholder="https://github.com/..."
                  value={clubDetails.social_links.github}
                  onChange={(e) =>
                    setClubDetails({
                      ...clubDetails,
                      social_links: { ...clubDetails.social_links, github: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">INSTAGRAM</label>
                <input
                  placeholder="https://instagram.com/..."
                  value={clubDetails.social_links.instagram}
                  onChange={(e) =>
                    setClubDetails({
                      ...clubDetails,
                      social_links: { ...clubDetails.social_links, instagram: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">DISCORD</label>
                <input
                  placeholder="https://discord.gg/..."
                  value={clubDetails.social_links.discord}
                  onChange={(e) =>
                    setClubDetails({
                      ...clubDetails,
                      social_links: { ...clubDetails.social_links, discord: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={savingDetails}
              className="flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-2.5 text-xs font-mono font-bold text-black hover:bg-cyan-300 transition shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{savingDetails ? "Saving Details..." : "Save Club Details"}</span>
            </button>
          </div>
        </form>
        )
      )}
    </div>
  );
}

