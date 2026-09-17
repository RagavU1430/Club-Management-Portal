import { useState, useEffect, useMemo } from "react";
import { Search, Mail, Sparkles, User, Shield, Phone, ExternalLink, Copy, Check, ArrowRight } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "../components/SocialIcons";
import { apiFetch } from "../utils/api";

interface TeamMember {
  id: string | number;
  name: string;
  role: string;
  department?: string;
  bio?: string;
  photo?: string;
  email?: string;
  phone?: string;
  github?: string;
  linkedin?: string;
}

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/team")
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

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (!q) return true;
      const lower = q.toLowerCase();
      return (
        m.name.toLowerCase().includes(lower) ||
        m.role.toLowerCase().includes(lower) ||
        (m.department && m.department.toLowerCase().includes(lower)) ||
        (m.bio && m.bio.toLowerCase().includes(lower))
      );
    });
  }, [members, q]);

  return (
    <main className="relative min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Ambient Lighting */}
      <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 h-96 w-full max-w-4xl bg-gradient-to-b from-purple-500/10 via-cyan-600/10 to-transparent blur-3xl" />

      {/* Header */}
      <div className="relative z-10 text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-400/10 border border-purple-400/30 px-4 py-1.5 text-xs font-mono text-purple-300 mb-4 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          PERSONNEL // CORE ARCHITECTS
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-white glow-purple-text">
          COORDINATORS
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
          Meet the student leaders, mentors, and developers driving artificial intelligence innovation and learning at AI Frontier Club.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative z-10 flex items-center justify-center gap-4 mb-10 pb-6 border-b border-white/10">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            placeholder="Search coordinators by name, department, or skill..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0c1222]/80 backdrop-blur-md py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 shadow-sm transition"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-80 rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="relative z-10 text-center py-20 rounded-2xl glass border border-white/10 p-8 shadow-sm">
          <User className="mx-auto h-12 w-12 text-slate-600 mb-4" />
          <h3 className="font-display text-xl font-bold text-white">
            {members.length === 0 ? "No Coordinators Listed Yet" : "No coordinators matched"}
          </h3>
          <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
            {members.length === 0
              ? "All existing coordinators have been cleared. New coordinators added through the Admin console will appear here."
              : `No profile matches "${q}". Try a different keyword.`}
          </p>
          {q && (
            <button
              onClick={() => setQ("")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-400/20 border border-purple-400/40 px-5 py-2 text-xs font-mono text-purple-300 hover:bg-purple-400 hover:text-black transition cursor-pointer"
            >
              Reset Search
            </button>
          )}
        </div>
      )}

      {/* Team Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {filtered.map((member) => (
            <TeamCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </main>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopyEmail(e: React.MouseEvent) {
    e.stopPropagation();
    if (member.email) {
      navigator.clipboard.writeText(member.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative rounded-3xl glass border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
        isHovered
          ? "-translate-y-1.5 border-cyan-400/50 shadow-[0_20px_45px_-12px_rgba(0,240,255,0.22),0_0_25px_rgba(147,51,234,0.15)]"
          : "border-white/10 shadow-lg shadow-black/40 hover:border-white/20"
      }`}
    >
      {/* Ambient Neon Glows */}
      <div
        className={`pointer-events-none absolute -top-14 -right-14 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl transition-all duration-700 ease-out ${
          isHovered ? "opacity-100 scale-125" : "opacity-25 scale-100"
        }`}
      />
      <div
        className={`pointer-events-none absolute -bottom-14 -left-14 h-48 w-48 rounded-full bg-purple-600/20 blur-3xl transition-all duration-700 ease-out ${
          isHovered ? "opacity-100 scale-125" : "opacity-25 scale-100"
        }`}
      />

      {/* Top Cyber Accent Line */}
      <div
        className={`pointer-events-none absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-opacity duration-500 ease-out ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Card Content Container */}
      <div className="p-6 relative z-10">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/25 px-2.5 py-0.5 text-[10px] font-mono text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {member.department || "Artificial Intelligence & Data Science"}
          </span>
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-cyan-400/80" />
            CORE
          </span>
        </div>

        {/* Profile Avatar, Name & Role */}
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-600/30 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center font-display text-2xl font-bold text-cyan-300 shadow-inner overflow-hidden shrink-0 group-hover:border-cyan-400/60 group-hover:scale-105 transition-all duration-500 ease-out">
            {member.photo ? (
              <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
            ) : (
              member.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="overflow-hidden">
            <h3 className="font-display text-xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300 truncate">
              {member.name}
            </h3>
            <p className="text-xs font-mono text-purple-300 font-semibold truncate mt-0.5">{member.role}</p>
          </div>
        </div>

        {/* Bio Text */}
        <p className="mt-4 text-xs text-slate-300 leading-relaxed">
          {member.bio || "Active coordinator advancing AI research, hackathons, and student initiatives."}
        </p>

        {/* ── Collapsible Resting Bar (When NOT hovered) ── */}
        <div
          className={`grid transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            !isHovered
              ? "grid-rows-[1fr] opacity-100 mt-4 pt-3 border-t border-white/10"
              : "grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t-0 border-transparent"
          }`}
        >
          <div className="overflow-hidden min-h-0">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                {member.email && (
                  <span title="Email available" className="text-cyan-400/80">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                )}
                {member.phone && (
                  <span title="Phone available" className="text-cyan-400/80">
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                )}
                {member.linkedin && (
                  <span title="LinkedIn profile" className="text-cyan-400/80">
                    <LinkedinIcon className="h-3.5 w-3.5" />
                  </span>
                )}
                {member.github && (
                  <span title="GitHub profile" className="text-cyan-400/80">
                    <GithubIcon className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1.5 text-cyan-300 group-hover:text-cyan-200 transition-colors font-semibold">
                <span>Hover for Details</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </div>
          </div>
        </div>

        {/* ── Expandable Details Section (When hovered) ── */}
        <div
          className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isHovered
              ? "grid-rows-[1fr] opacity-100 mt-4 pt-3 border-t border-white/10"
              : "grid-rows-[0fr] opacity-0 mt-0 pt-0 border-t-0 border-transparent"
          }`}
        >
          <div className="overflow-hidden min-h-0">
            <div
              className={`space-y-2.5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isHovered ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
              }`}
            >
              {/* Email Card */}
              <div className="rounded-xl bg-white/5 p-2.5 border border-white/10 hover:border-cyan-400/40 transition-colors duration-300">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                  <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                    <Mail className="h-3 w-3" /> EMAIL
                  </span>
                  {member.email && (
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? "Copied!" : "Copy"}</span>
                    </button>
                  )}
                </div>
                {member.email ? (
                  <a
                    href={`mailto:${member.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-white hover:text-cyan-300 font-mono transition-colors block truncate font-medium"
                  >
                    {member.email}
                  </a>
                ) : (
                  <span className="text-xs text-slate-500 font-mono italic">No email provided</span>
                )}
              </div>

              {/* Phone Card */}
              <div className="rounded-xl bg-white/5 p-2.5 border border-white/10 hover:border-cyan-400/40 transition-colors duration-300">
                <div className="text-[10px] font-mono text-slate-400 mb-1 flex items-center gap-1 text-cyan-300 font-semibold">
                  <Phone className="h-3 w-3" /> PHONE / WHATSAPP
                </div>
                {member.phone ? (
                  <a
                    href={`tel:${member.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-white hover:text-cyan-300 font-mono transition-colors block font-medium"
                  >
                    {member.phone}
                  </a>
                ) : (
                  <span className="text-xs text-slate-500 font-mono italic">No phone provided</span>
                )}
              </div>

              {/* Social Channels & Connect CTA */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-all duration-300 shadow-sm"
                      title="LinkedIn"
                    >
                      <LinkedinIcon className="h-3.5 w-3.5" />
                      <span>LinkedIn</span>
                    </a>
                  )}

                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400/40 text-xs font-mono text-slate-300 hover:text-white transition-all duration-300 shadow-sm"
                      title="GitHub"
                    >
                      <GithubIcon className="h-3.5 w-3.5" />
                      <span>GitHub</span>
                    </a>
                  )}
                </div>

                {member.email ? (
                  <a
                    href={`mailto:${member.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-mono font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer"
                  >
                    <span>Connect</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">AI Frontier Club</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
