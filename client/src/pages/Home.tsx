import { Link } from "react-router-dom";
import {
  ArrowRight,
  Cpu,
  Shield,
  Layers,
  Zap,
} from "lucide-react";
import VideoScrollHero from "../components/VideoScrollHero";
import StatsRibbon from "../components/StatsRibbon";
import NextUpcomingEvent from "../components/NextUpcomingEvent";

const TRACKS = [
  {
    icon: Cpu,
    title: "Generative AI & LLMs",
    desc: "Building custom transformer pipelines, prompt engineering workflows, and intelligent multi-agent conversational systems.",
    tags: ["Transformers", "LangChain", "LLMs"],
    glow: "from-cyan-500/20 via-transparent to-transparent",
    border: "group-hover:border-cyan-400/50",
  },
  {
    icon: Layers,
    title: "Computer Vision & Deep Learning",
    desc: "Exploring neural architectures, convolutional networks, real-time object detection, and multimodal vision systems.",
    tags: ["PyTorch", "YOLO", "OpenCV"],
    glow: "from-purple-500/20 via-transparent to-transparent",
    border: "group-hover:border-purple-400/50",
  },
  {
    icon: Shield,
    title: "Data Science & Machine Learning",
    desc: "Analyzing datasets, training predictive algorithms, feature engineering, and deploying scalable machine learning models.",
    tags: ["Scikit-Learn", "Pandas", "Analytics"],
    glow: "from-emerald-500/20 via-transparent to-transparent",
    border: "group-hover:border-emerald-400/50",
  },
  {
    icon: Zap,
    title: "Hackathons, Sprints & Bootcamps",
    desc: "Competing in collegiate hackathons, collaborative 48-hour build sprints, and student-led AI demo days nationwide.",
    tags: ["Hackathons", "Code Sprints", "Live Demos"],
    glow: "from-amber-500/20 via-transparent to-transparent",
    border: "group-hover:border-amber-400/50",
  },
];

export default function Home() {
  return (
    <main className="relative w-full">
      {/* ── 1. Scroll-Driven Video Hero ── */}
      <VideoScrollHero />

      {/* ── 2. Live Holographic Stats Ribbon ── */}
      <div className="relative z-10 -mt-8">
        <StatsRibbon />
      </div>

      {/* ── 2.5. Featured Next Upcoming Event (Single Earliest Event) ── */}
      <NextUpcomingEvent />

      {/* ── 3. Innovation Tracks / Pillars ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col items-center text-center mb-14">
          <h2 className="font-display text-3xl sm:text-5xl font-black text-white glow-text">
            What We Learn, Code & Build
          </h2>
          <p className="mt-4 text-base text-slate-400 max-w-2xl">
            AI Frontier Club is the collegiate community where students master machine learning, experiment with deep neural networks, and turn ideas into production code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRACKS.map((track) => {
            const Icon = track.icon;
            return (
              <div
                key={track.title}
                className={`group relative rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-1.5 border border-white/10 ${track.border} overflow-hidden shadow-sm hover:shadow-xl`}
              >
                {/* Ambient Card Background Gradient */}
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${track.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-300 group-hover:scale-110 group-hover:border-cyan-400/40 transition-transform duration-300">
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="mt-5 font-display text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {track.title}
                    </h3>
                    <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                      {track.desc}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-1.5 pt-4 border-t border-white/5">
                    {track.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-mono text-slate-400 group-hover:text-slate-200 transition"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5. High-Impact Call to Action Banner ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative rounded-3xl overflow-hidden border border-cyan-400/30 bg-gradient-to-r from-cyan-950/50 via-[#070b16] to-purple-950/50 p-8 sm:p-14 text-center shadow-[0_0_80px_rgba(0,240,255,0.15)] backdrop-blur-md">
          {/* Ambient Lighting */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-cyan-400/20 blur-3xl" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-block text-xs font-mono text-cyan-300 tracking-widest uppercase mb-3 font-semibold">
              ZERO ENTRY BARRIER // UNRESTRICTED INNOVATION
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-black text-white glow-text">
              Ready to Build the Future of AI?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-300">
              Whether you are writing your first Python script, training deep neural networks, or building LLM applications, AI Frontier Club is where your curiosity becomes real-world impact.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/events"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:scale-105"
              >
                Join Next Event
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/team"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl glass px-8 py-3.5 font-bold text-white hover:bg-white/10 transition shadow-sm"
              >
                Meet the Leadership
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
