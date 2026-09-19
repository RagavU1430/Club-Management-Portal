import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Mail,
  Sparkles,
  User,
  Shield,
  Phone,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  GraduationCap,
  Crown,
  Compass,
  Palette,
  Users,
} from "lucide-react";
import { GithubIcon, LinkedinIcon, WhatsappIcon } from "../components/SocialIcons";
import { apiFetch } from "../utils/api";

export type TeamCategory = "all" | "hod" | "overall" | "student" | "digital";

export interface TeamMember {
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
  order?: number;
}

export function getTeamCategory(role: string, department?: string): "hod" | "overall" | "student" | "digital" {
  const r = (role || "").toLowerCase();
  const d = (department || "").toLowerCase();
  if (
    r.includes("hod") ||
    r.includes("head") ||
    r.includes("assistant coordinator") ||
    r.includes("faculty") ||
    r.includes("professor") ||
    r.includes("ap/") ||
    r.includes("ap /") ||
    r.includes("advisor") ||
    d.includes("hod") ||
    d.includes("ap/") ||
    d.includes("ap /") ||
    (r === "coordinator" && !r.includes("student") && !r.includes("year"))
  ) {
    return "hod";
  }
  if (r.includes("overall") || r.includes("president") || r.includes("chief")) {
    return "overall";
  }
  if (r.includes("digital") || r.includes("media") || r.includes("design") || r.includes("web") || r.includes("social") || r.includes("tech lead")) {
    return "digital";
  }
  return "student";
}

export const CATEGORY_DETAILS: Record<
  "hod" | "overall" | "student" | "digital",
  {
    title: string;
    label: string;
    subtitle: string;
    badge: string;
    icon: typeof GraduationCap;
    accentClass: string;
    badgeClass: string;
    glowBorder: string;
    cardTopAccent: string;
    avatarBorder: string;
  }
> = {
  hod: {
    title: "Faculty Coordinators & HOD",
    label: "Faculty & HOD",
    subtitle: "Department leadership and faculty mentors guiding academic research and club excellence.",
    badge: "FACULTY LEAD // HOD",
    icon: GraduationCap,
    accentClass: "text-amber-500 dark:text-amber-400",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    glowBorder: "hover:border-amber-500/60 dark:hover:border-amber-400/50 shadow-[0_20px_45px_-12px_rgba(245,158,11,0.25)]",
    cardTopAccent: "via-amber-500 dark:via-amber-400",
    avatarBorder: "border-amber-400/40 text-amber-600 dark:text-amber-300 bg-amber-500/10",
  },
  overall: {
    title: "Students Overall Coordinators",
    label: "Overall Coordinators",
    subtitle: "Executive student leaders driving strategic vision, cross-department initiatives, and operations.",
    badge: "OVERALL LEAD",
    icon: Crown,
    accentClass: "text-purple-600 dark:text-purple-400",
    badgeClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
    glowBorder: "hover:border-purple-500/60 dark:hover:border-purple-400/50 shadow-[0_20px_45px_-12px_rgba(168,85,247,0.25)]",
    cardTopAccent: "via-purple-500 dark:via-purple-400",
    avatarBorder: "border-purple-400/40 text-purple-600 dark:text-purple-300 bg-purple-500/10",
  },
  student: {
    title: "Student Coordinators",
    label: "Student Coordinators",
    subtitle: "Third year, second year, and first year student coordinators running technical events, workshops, and student learning.",
    badge: "STUDENT LEAD",
    icon: Compass,
    accentClass: "text-cyan-600 dark:text-cyan-400",
    badgeClass: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    glowBorder: "hover:border-cyan-500/60 dark:hover:border-cyan-400/50 shadow-[0_20px_45px_-12px_rgba(2,132,199,0.22)]",
    cardTopAccent: "via-cyan-500 dark:via-cyan-400",
    avatarBorder: "border-cyan-400/40 text-cyan-700 dark:text-cyan-300 bg-cyan-500/10",
  },
  digital: {
    title: "Digital Team of Club",
    label: "Digital Team of Club",
    subtitle: "Creative engineers and designers developing digital platforms, visual media, and brand identity.",
    badge: "DIGITAL TEAM",
    icon: Palette,
    accentClass: "text-emerald-600 dark:text-emerald-400",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    glowBorder: "hover:border-emerald-500/60 dark:hover:border-emerald-400/50 shadow-[0_20px_45px_-12px_rgba(16,185,129,0.25)]",
    cardTopAccent: "via-emerald-500 dark:via-emerald-400",
    avatarBorder: "border-emerald-400/40 text-emerald-600 dark:text-emerald-300 bg-emerald-500/10",
  },
};

const CATEGORY_ORDER: Array<"hod" | "overall" | "student" | "digital"> = [
  "hod",
  "overall",
  "student",
  "digital",
];

function getWhatsAppUrl(phone?: string, name?: string) {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const fullPhone = digits.length === 10 ? `91${digits}` : digits;
  const msg = encodeURIComponent(`Hi ${name || "Coordinator"}, I would like to connect regarding the AI Frontier Club.`);
  return `https://wa.me/${fullPhone}?text=${msg}`;
}

export default function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activeCategory, setActiveCategory] = useState<TeamCategory>("all");
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

  // Category counts
  const counts = useMemo(() => {
    const res = {
      all: members.length,
      hod: 0,
      overall: 0,
      student: 0,
      digital: 0,
    };
    for (const m of members) {
      const cat = getTeamCategory(m.role, m.department);
      res[cat] = (res[cat] || 0) + 1;
    }
    return res;
  }, [members]);

  // Filtered members by search query
  const searchFiltered = useMemo(() => {
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

  // Tabs for the pill filter bar
  const filterTabs = [
    { id: "all" as TeamCategory, label: "All Members", icon: Users, count: counts.all },
    { id: "hod" as TeamCategory, label: "Faculty & HOD", icon: GraduationCap, count: counts.hod },
    { id: "overall" as TeamCategory, label: "Overall Coordinators", icon: Crown, count: counts.overall },
    { id: "student" as TeamCategory, label: "Student Coordinators", icon: Compass, count: counts.student },
    { id: "digital" as TeamCategory, label: "Digital Team of Club", icon: Palette, count: counts.digital },
  ];

  return (
    <main className="relative min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Ambient Lighting */}
      <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 h-96 w-full max-w-4xl bg-gradient-to-b from-purple-500/10 via-cyan-600/10 to-transparent blur-3xl" />

      {/* Header */}
      <div className="relative z-10 text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#833ab4]/12 via-[#e1306c]/12 to-[#fcb045]/12 dark:bg-purple-500/10 border border-[#e1306c]/35 dark:border-purple-500/30 px-4 py-1.5 text-xs font-mono text-[#c13584] dark:text-purple-300 mb-4 shadow-sm font-bold">
          <Sparkles className="h-3.5 w-3.5 text-[#e1306c] dark:text-purple-400" />
          PERSONNEL // CORE ARCHITECTS
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-slate-900 dark:text-white glow-purple-text tracking-tight">
          COORDINATORS
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          Meet the faculty mentors, overall leaders, student coordinators, and digital team driving AI innovation at AI Frontier Club.
        </p>
      </div>

      {/* Category Pills & Search Controls */}
      <div className="relative z-10 max-w-4xl mx-auto mb-12 space-y-5">
        {/* Search Bar */}
        <div className="relative w-full max-w-lg mx-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, role, department..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#070d1e] backdrop-blur-xl py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#e1306c] dark:focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-[#e1306c] shadow-md shadow-slate-200/30 dark:shadow-black/50 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold shadow-lg shadow-black/10 dark:shadow-white/10 scale-105"
                    : "bg-white dark:bg-[#070d1e] backdrop-blur-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-pink-500/40 hover:text-[#c13584] dark:hover:border-cyan-500/40 dark:hover:text-white shadow-sm"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white dark:text-black" : "text-[#e1306c] dark:text-cyan-400"}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-white/25 dark:bg-black/20 text-white dark:text-black"
                      : "bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-80 rounded-3xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && searchFiltered.length === 0 && (
        <div className="relative z-10 text-center py-20 rounded-3xl bg-white dark:bg-[#070d1e] backdrop-blur-xl border border-slate-200 dark:border-white/10 p-8 shadow-sm max-w-xl mx-auto">
          <User className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600 mb-4" />
          <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            {members.length === 0 ? "No Coordinators Listed Yet" : "No coordinators match your search"}
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {members.length === 0
              ? "All existing coordinators have been cleared. New coordinators added through the Admin console will appear here."
              : `No profile matches "${q}". Try clearing your search keyword.`}
          </p>
          {(q || activeCategory !== "all") && (
            <button
              onClick={() => {
                setQ("");
                setActiveCategory("all");
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 px-5 py-2 text-xs font-mono text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500 hover:text-white transition cursor-pointer"
            >
              Reset Filters & Search
            </button>
          )}
        </div>
      )}

      {/* Structured Sections (HOD, Overall, Student, Digital Team) */}
      {!loading && searchFiltered.length > 0 && (
        <div className="space-y-16">
          {CATEGORY_ORDER.map((catKey) => {
            // Check if this category should be rendered
            if (activeCategory !== "all" && activeCategory !== catKey) {
              return null;
            }

            const catConfig = CATEGORY_DETAILS[catKey];
            const catMembers = searchFiltered
              .filter((m) => getTeamCategory(m.role, m.department) === catKey)
              .sort((a, b) => {
                if (catKey === "hod") {
                  const getHodRank = (name: string) => {
                    const n = (name || "").toLowerCase();
                    if (n.includes("manivannan")) return 1;
                    if (n.includes("kavitha")) return 2;
                    if (n.includes("bharathi")) return 3;
                    return 99;
                  };

                  const rankA = getHodRank(a.name);
                  const rankB = getHodRank(b.name);
                  if (rankA !== rankB) return rankA - rankB;
                }

                const orderA = typeof a.order === "number" ? a.order : 999;
                const orderB = typeof b.order === "number" ? b.order : 999;
                if (orderA !== orderB) return orderA - orderB;
                return 0;
              });

            if (catMembers.length === 0) {
              return null;
            }

            const SectionIcon = catConfig.icon;

            return (
              <section key={catKey} className="relative z-10 space-y-6">
                {/* Section Header with solid high opacity backdrop */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#070d1e] backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 gap-3 shadow-md shadow-slate-200/40 dark:shadow-black/60">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl border ${catConfig.badgeClass}`}>
                      <SectionIcon className={`h-5 w-5 ${catConfig.accentClass}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                          {catConfig.title}
                        </h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${catConfig.badgeClass}`}>
                          {catMembers.length} {catMembers.length === 1 ? "Member" : "Members"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                        {catConfig.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                  {catMembers.map((member) => (
                    <TeamCard key={member.id} member={member} category={catKey} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

function TeamCard({
  member,
  category,
}: {
  member: TeamMember;
  category?: "hod" | "overall" | "student" | "digital";
}) {
  const [copied, setCopied] = useState(false);

  const catKey = category || getTeamCategory(member.role, member.department);
  const catConfig = CATEGORY_DETAILS[catKey];

  function handleCopyEmail(e: React.MouseEvent) {
    e.stopPropagation();
    if (member.email) {
      navigator.clipboard.writeText(member.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const whatsappUrl = getWhatsAppUrl(member.phone, member.name);
  const connectHref = whatsappUrl || (member.email ? `mailto:${member.email}` : undefined);

  return (
    <div
      className={`group relative rounded-3xl bg-white dark:bg-[#070d1e] backdrop-blur-2xl border border-slate-200/90 dark:border-white/10 ${catConfig.glowBorder}
        transform-gpu transition-[transform,box-shadow,border-color,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:-translate-y-2 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-black/70 will-change-transform cursor-pointer`}
      style={{ backfaceVisibility: "hidden" }}
    >
      {/* Hit-area extension buffer below to completely eliminate hover fluttering */}
      <div className="absolute -bottom-4 left-0 right-0 h-4 pointer-events-auto" />

      {/* Ambient Neon Glows (Ultra-smooth GPU opacity & scale interpolation) */}
      <div
        className="pointer-events-none absolute -top-14 -right-14 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl transition-all duration-700 ease-out opacity-25 scale-100 group-hover:opacity-100 group-hover:scale-125 will-change-[transform,opacity]"
      />
      <div
        className="pointer-events-none absolute -bottom-14 -left-14 h-48 w-48 rounded-full bg-purple-600/15 blur-3xl transition-all duration-700 ease-out opacity-25 scale-100 group-hover:opacity-100 group-hover:scale-125 will-change-[transform,opacity]"
      />

      {/* Top Cyber Accent Line */}
      <div
        className={`pointer-events-none absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${catConfig.cardTopAccent} to-transparent transition-opacity duration-500 ease-out opacity-0 group-hover:opacity-100`}
      />

      {/* Card Content Container */}
      <div className="p-6 relative z-10">
        {/* Top Badges */}
        <div className="flex items-center justify-end mb-4">
          <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${catConfig.badgeClass}`}>
            <Shield className="h-3 w-3" />
            {catConfig.badge}
          </span>
        </div>

        {/* Profile Avatar, Name & Role */}
        <div className="flex items-center gap-4">
          <div className="p-[2.5px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] dark:p-0 dark:bg-none rounded-2xl shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-md shadow-pink-500/15 dark:shadow-none">
            <div
              className={`relative h-16 w-16 rounded-[14px] bg-white dark:bg-[#050811] flex items-center justify-center font-display text-2xl font-bold shadow-inner overflow-hidden ${catConfig.avatarBorder}`}
            >
              {member.photo ? (
                <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
              ) : (
                member.name.charAt(0).toUpperCase()
              )}
            </div>
          </div>

          <div className="overflow-hidden">
            <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#c13584] dark:group-hover:text-cyan-300 transition-colors duration-300 truncate">
              {member.name}
            </h3>
            <p className="text-xs font-mono text-[#c13584] dark:text-purple-300 font-semibold truncate mt-0.5">
              {member.role}
            </p>
          </div>
        </div>

        {/* Bio Text */}
        <p className="mt-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[36px] line-clamp-2">
          {member.bio || "Leading AI innovation, research projects, and student learning at AI Frontier Club."}
        </p>

        {/* ── Collapsible Resting Hint (Fades out when hovered) ── */}
        <div className="grid grid-rows-[1fr] group-hover:grid-rows-[0fr] transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-0">
          <div className="overflow-hidden min-h-0">
            <div className="pt-3 mt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                {member.email && (
                  <span title="Email available" className="text-cyan-600 dark:text-cyan-400/80">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                )}
                {member.phone && (
                  <span title="Phone available" className="text-cyan-600 dark:text-cyan-400/80">
                    <Phone className="h-3.5 w-3.5" />
                  </span>
                )}
                {member.linkedin && (
                  <span title="LinkedIn profile" className="text-cyan-600 dark:text-cyan-400/80">
                    <LinkedinIcon className="h-3.5 w-3.5" />
                  </span>
                )}
                {member.github && (
                  <span title="GitHub profile" className="text-cyan-600 dark:text-cyan-400/80">
                    <GithubIcon className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
              <span className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-200 transition-colors font-semibold">
                <span>Hover for Details</span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-1.5 transition-transform duration-300" />
              </span>
            </div>
          </div>
        </div>

        {/* ── Ultra-Smooth Accordion Details Drawer (Expands smoothly on hover) ── */}
        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <div className="overflow-hidden min-h-0">
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-400 delay-75 space-y-2.5">
              {/* Email Card */}
              <div className="rounded-xl bg-slate-100 dark:bg-[#0c1324] p-2.5 border border-slate-200 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-400/40 transition-colors duration-300">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                  <span className="flex items-center gap-1 text-cyan-700 dark:text-cyan-300 font-semibold">
                    <Mail className="h-3 w-3" /> EMAIL
                  </span>
                  {member.email && (
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="flex items-center gap-1 text-[10px] font-mono text-cyan-700 dark:text-cyan-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? "Copied!" : "Copy"}</span>
                    </button>
                  )}
                </div>
                {member.email ? (
                  <a
                    href={`mailto:${member.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-300 font-mono transition-colors block truncate font-medium"
                  >
                    {member.email}
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono italic">No email provided</span>
                )}
              </div>

              {/* Phone / WhatsApp Card */}
              <div className="rounded-xl bg-slate-100 dark:bg-[#0c1324] p-2.5 border border-slate-200 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-400/40 transition-colors duration-300">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                  <span className="flex items-center gap-1 text-cyan-700 dark:text-cyan-300 font-semibold">
                    <Phone className="h-3 w-3" /> PHONE / WHATSAPP
                  </span>
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors cursor-pointer"
                    >
                      <WhatsappIcon className="h-3 w-3" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                </div>
                {member.phone ? (
                  <a
                    href={whatsappUrl || `tel:${member.phone}`}
                    target={whatsappUrl ? "_blank" : undefined}
                    rel={whatsappUrl ? "noopener noreferrer" : undefined}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-300 font-mono transition-colors block font-medium"
                  >
                    {member.phone}
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono italic">No phone provided</span>
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0c1324] hover:bg-cyan-500/15 dark:hover:bg-cyan-500/20 border border-slate-200 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-400/40 text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 transition-all duration-300 shadow-sm cursor-pointer"
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0c1324] hover:bg-cyan-500/15 dark:hover:bg-cyan-500/20 border border-slate-200 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-400/40 text-xs font-mono text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 shadow-sm cursor-pointer"
                      title="GitHub"
                    >
                      <GithubIcon className="h-3.5 w-3.5" />
                      <span>GitHub</span>
                    </a>
                  )}
                </div>

                {connectHref ? (
                  <a
                    href={connectHref}
                    target={whatsappUrl ? "_blank" : undefined}
                    rel={whatsappUrl ? "noopener noreferrer" : undefined}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black text-xs font-mono font-bold shadow-md hover:shadow-cyan-500/20 hover:scale-105 transition-all duration-300 cursor-pointer"
                    title={whatsappUrl ? `Message ${member.name} on WhatsApp` : `Email ${member.name}`}
                  >
                    {whatsappUrl ? <WhatsappIcon className="h-3.5 w-3.5 fill-black" /> : null}
                    <span>Connect</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">AI Frontier Club</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
