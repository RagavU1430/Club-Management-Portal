import { useState, useEffect } from "react";
import { Calendar, Users, Trophy, Rocket } from "lucide-react";
import { apiFetch } from "../utils/api";

export default function StatsRibbon() {
  const [stats, setStats] = useState({
    upcoming: 3,
    past: 18,
    members: 520,
    projects: 84,
  });

  useEffect(() => {
    apiFetch("/api/events/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setStats((prev) => ({
            ...prev,
            upcoming: d.data.upcoming ?? prev.upcoming,
            past: d.data.past ?? prev.past,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const items = [
    {
      label: "Upcoming Summits",
      value: `${stats.upcoming}+`,
      sub: "Workshops & hackathons this term",
      icon: Calendar,
      color: "text-cyan-400",
      border: "hover:border-cyan-400/40",
      glow: "group-hover:shadow-[0_0_30px_rgba(0,240,255,0.2)]",
    },
    {
      label: "Alumni & Active Members",
      value: `${stats.members}+`,
      sub: "Across leading AI labs & tech firms",
      icon: Users,
      color: "text-purple-400",
      border: "hover:border-purple-400/40",
      glow: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]",
    },
    {
      label: "National Championship Wins",
      value: "12",
      sub: "In national hackathons & AI challenges",
      icon: Trophy,
      color: "text-amber-400",
      border: "hover:border-amber-400/40",
      glow: "group-hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]",
    },
    {
      label: "Shipped Codebases",
      value: `${stats.projects}+`,
      sub: "Production tools & research models",
      icon: Rocket,
      color: "text-emerald-400",
      border: "hover:border-emerald-400/40",
      glow: "group-hover:shadow-[0_0_30px_rgba(52,211,153,0.2)]",
    },
  ];

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`group relative rounded-2xl glass p-6 transition-all duration-300 border border-white/10 ${item.border} ${item.glow}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400 uppercase tracking-wider font-medium">
                  {item.label}
                </span>
                <div className={`p-2 rounded-xl bg-white/5 border border-white/10 ${item.color} transition-colors`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-4xl sm:text-5xl font-black tracking-tight text-white transition-colors">
                  {item.value}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-400 transition-colors">{item.sub}</p>

              {/* Top gradient highlight line */}
              <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
