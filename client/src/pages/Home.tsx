import { Link } from "react-router-dom";
import {
  ArrowRight,
  Cpu,
  Shield,
  Layers,
  Zap,
} from "lucide-react";
import VideoScrollHero from "../components/VideoScrollHero";
import NextUpcomingEvent from "../components/NextUpcomingEvent";

const TRACKS = [
  {
    icon: Cpu,
    title: "Generative AI & LLMs",
    desc: "Building custom transformer pipelines, prompt engineering workflows, and intelligent multi-agent conversational systems.",
    tags: ["Transformers", "LangChain", "LLMs"],
    glow: "from-indigo-500/10 via-transparent to-transparent dark:from-cyan-500/20",
    border: "hover:border-indigo-400/50 dark:group-hover:border-cyan-400/50",
    iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200/80 dark:bg-white/5 dark:text-cyan-300 dark:border-white/10",
    tagBg: "bg-indigo-50/80 text-indigo-700 border-indigo-200/60 dark:bg-white/5 dark:text-slate-400 dark:border-transparent",
  },
  {
    icon: Layers,
    title: "Computer Vision & Deep Learning",
    desc: "Exploring neural architectures, convolutional networks, real-time object detection, and multimodal vision systems.",
    tags: ["PyTorch", "YOLO", "OpenCV"],
    glow: "from-rose-500/10 via-transparent to-transparent dark:from-purple-500/20",
    border: "hover:border-rose-400/50 dark:group-hover:border-purple-400/50",
    iconBg: "bg-rose-50 text-rose-600 border-rose-200/80 dark:bg-white/5 dark:text-purple-300 dark:border-white/10",
    tagBg: "bg-rose-50/80 text-rose-700 border-rose-200/60 dark:bg-white/5 dark:text-slate-400 dark:border-transparent",
  },
  {
    icon: Shield,
    title: "Data Science & Machine Learning",
    desc: "Analyzing datasets, training predictive algorithms, feature engineering, and deploying scalable machine learning models.",
    tags: ["Scikit-Learn", "Pandas", "Analytics"],
    glow: "from-emerald-500/10 via-transparent to-transparent dark:from-emerald-500/20",
    border: "hover:border-emerald-400/50 dark:group-hover:border-emerald-400/50",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200/80 dark:bg-white/5 dark:text-emerald-300 dark:border-white/10",
    tagBg: "bg-emerald-50/80 text-emerald-700 border-emerald-200/60 dark:bg-white/5 dark:text-slate-400 dark:border-transparent",
  },
  {
    icon: Zap,
    title: "Hackathons, Sprints & Bootcamps",
    desc: "Competing in collegiate hackathons, collaborative 48-hour build sprints, and student-led AI demo days nationwide.",
    tags: ["Hackathons", "Code Sprints", "Live Demos"],
    glow: "from-amber-500/10 via-transparent to-transparent dark:from-amber-500/20",
    border: "hover:border-amber-400/50 dark:group-hover:border-amber-400/50",
    iconBg: "bg-amber-50 text-amber-600 border-amber-200/80 dark:bg-white/5 dark:text-amber-300 dark:border-white/10",
    tagBg: "bg-amber-50/80 text-amber-700 border-amber-200/60 dark:bg-white/5 dark:text-slate-400 dark:border-transparent",
  },
];

export default function Home() {
  return (
    <main className="relative w-full">
      {/* ── 1. Scroll-Driven Video Hero ── */}
      <VideoScrollHero />

      {/* ── 2. Featured Next Upcoming Event (Single Earliest Event) ── */}
      <div className="relative z-10 -mt-10">
        <NextUpcomingEvent />
      </div>

      {/* ── 3. Innovation Tracks / Pillars ── */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col items-center text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#833ab4]/12 via-[#e1306c]/12 to-[#fcb045]/12 dark:bg-cyan-400/10 border border-[#e1306c]/35 dark:border-cyan-400/30 px-3.5 py-1 text-xs font-mono text-[#c13584] dark:text-cyan-300 shadow-sm mb-4 font-bold">
            <span>INNOVATION TRACKS // CORE CURRICULUM</span>
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-black text-slate-900 dark:text-white dark:glow-text">
            What We Learn, Code & Build
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400 max-w-2xl font-normal leading-relaxed">
            AI Frontier Club is the collegiate community where students master machine learning, experiment with deep neural networks, and turn ideas into production code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRACKS.map((track) => {
            const Icon = track.icon;
            return (
              <div
                key={track.title}
                className={`group relative rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-1.5 border border-slate-200/90 dark:border-white/10 hover:border-pink-500/40 dark:hover:border-cyan-400/50 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-pink-500/10 dark:hover:shadow-cyan-950/20`}
              >
                {/* Top Instagram rainbow bar on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Ambient Card Background Gradient */}
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${track.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className={`h-12 w-12 rounded-xl border flex items-center justify-center ${track.iconBg} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <Icon className="h-6 w-6" />
                    </div>

                    <h3 className="mt-5 font-display text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#c13584] dark:group-hover:text-cyan-300 transition-colors">
                      {track.title}
                    </h3>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {track.desc}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-1.5 pt-4 border-t border-slate-200/80 dark:border-white/5">
                    {track.tags.map((t) => (
                      <span
                        key={t}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-mono border ${track.tagBg} transition font-medium`}
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
        <div className="relative rounded-3xl overflow-hidden border border-pink-300/50 dark:border-cyan-400/30 bg-gradient-to-r from-purple-100/70 via-pink-50/85 to-amber-100/70 dark:from-cyan-950/50 dark:via-[#070b16] dark:to-purple-950/50 p-8 sm:p-14 text-center shadow-xl shadow-pink-500/10 dark:shadow-[0_0_80px_rgba(0,240,255,0.15)] backdrop-blur-md">
          {/* Top Instagram rainbow bar in light mode */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] opacity-90 dark:opacity-0" />

          {/* Ambient Lighting */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-pink-500/15 dark:bg-cyan-400/20 blur-3xl" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-block text-xs font-mono text-[#c13584] dark:text-cyan-300 tracking-widest uppercase mb-3 font-bold">
              ZERO ENTRY BARRIER // UNRESTRICTED INNOVATION
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-black text-slate-900 dark:text-white dark:glow-text">
              Ready to{" "}
              <span className="bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] bg-clip-text text-transparent dark:text-white">
                Build the Future
              </span>{" "}
              of AI?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Whether you are writing your first Python script, training deep neural networks, or building LLM applications, AI Frontier Club is where your curiosity becomes real-world impact.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/events"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] dark:from-cyan-500 dark:to-blue-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-pink-500/30 dark:shadow-cyan-500/25 transition hover:scale-105 cursor-pointer"
              >
                Join Next Event
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/team"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-8 py-3.5 font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 hover:text-[#c13584] transition shadow-sm cursor-pointer"
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
