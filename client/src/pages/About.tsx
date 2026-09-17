import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Trophy,
  Users,
  Rocket,
  Quote,
  Sparkles,
  ChevronDown,
  ArrowRight,
  Camera,
  Calendar,
} from "lucide-react";

const ACHIEVEMENTS = [
  { icon: Trophy, label: "12 National Wins", desc: "Championship awards at national collegiate AI & engineering hackathons", color: "text-amber-400" },
  { icon: Users, label: "500+ Alumni", desc: "Active engineers at top AI research labs, startups, and tech firms", color: "text-purple-400" },
  { icon: Rocket, label: "80+ Projects Shipped", desc: "Open-source machine learning models, web apps, and benchmark datasets", color: "text-cyan-400" },
  { icon: Shield, label: "40+ Industry Partners", desc: "Direct mentorship pipelines, guest lectures, and tech collaborations", color: "text-emerald-400" },
];

const TIMELINE = [
  {
    year: "2021",
    title: "The Genesis",
    desc: "Founded by computer science & engineering students passionate about deep learning, neural networks, and open-source AI.",
  },
  {
    year: "2023",
    title: "National Hackathon Dominance",
    desc: "Represented the college at national engineering hackathons, taking top spots in computer vision and NLP tracks.",
  },
  {
    year: "2025",
    title: "Autonomous Systems Laboratory",
    desc: "Formed dedicated project clusters to develop multimodal transformers, robotics pipelines, and generative AI agents.",
  },
  {
    year: "2026",
    title: "The Collegiate Frontier Guild",
    desc: "Expanded across campus with 500+ active members, hands-on bootcamps, and industrial mentorship.",
  },
];

const TESTIMONIALS = [
  {
    quote: "AI Frontier Club was where I transitioned from coding basic tutorials to building actual neural network architectures and deploying real AI web apps.",
    name: "Priya S.",
    role: "ML Engineer, AI Labs",
  },
  {
    quote: "Working on hackathon teams and learning PyTorch with club peers transformed my technical skillset. We build together and win together.",
    name: "Arjun K.",
    role: "Full-Stack AI Developer",
  },
  {
    quote: "The workshops are hands-on, the community is welcoming to beginners, and everyone is excited to explore new AI tools. Best club on campus!",
    name: "Meera T.",
    role: "AI Student Researcher",
  },
];

const FAQS = [
  {
    q: "Do I need prior experience in AI or machine learning to join?",
    a: "Not at all! AI Frontier Club welcomes students of all skill levels. Whether you are learning Python basics or training transformers, we offer beginner bootcamps and advanced tracks.",
  },
  {
    q: "How do I participate in upcoming hackathons?",
    a: "Check the Events page for upcoming registrations. Hackathons are open to students and developers globally, both on-campus and virtually via Discord.",
  },
  {
    q: "Are the tools and models developed open source?",
    a: "Yes. Our core research tools, neural models, and benchmark evaluation suites are released under permissive open-source licenses on GitHub.",
  },
];

export default function About() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activities, setActivities] = useState<any[]>([]);
  const [clubDetails, setClubDetails] = useState<any>(null);

  useEffect(() => {
    fetch("/api/activities")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) setActivities(d.data);
      })
      .catch(() => {});

    fetch("/api/club-details")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setClubDetails(d.data);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="relative min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Ambient Lighting */}
      <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 h-96 w-full max-w-4xl bg-gradient-to-b from-cyan-500/10 via-purple-600/10 to-transparent blur-3xl" />

      {/* Header */}
      <div className="relative z-10 text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 dark:bg-cyan-400/10 border border-cyan-500/30 dark:border-cyan-400/30 px-4 py-1.5 text-xs font-mono text-cyan-700 dark:text-cyan-300 mb-4 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
          {clubDetails?.department || "DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE"}
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-slate-900 dark:text-white glow-text transition-colors">
          {clubDetails?.name || "About AI Frontier"}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed transition-colors">
          {clubDetails?.tagline ||
            "We are the collegiate developer guild exploring, coding, and building the future of artificial intelligence and machine learning."}
        </p>
      </div>

      {/* Origin Story Panel */}
      <section className="relative z-10 rounded-3xl glass p-8 sm:p-12 border border-slate-200/80 dark:border-white/10 mb-20 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="max-w-3xl">
          <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 uppercase tracking-widest font-semibold">
            OUR GENESIS
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white transition-colors">
            Driven by Pure Curiosity & Code
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed transition-colors">
            AI Frontier Club was founded on a simple philosophy: artificial intelligence is best learned by actively building and experimenting. From training convolutional vision networks to fine-tuning modern open-source LLMs, we give students the tools, compute, and collaborative environment to innovate.
          </p>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 leading-relaxed transition-colors">
            Rather than observing from the sidelines, our members code real-world algorithms, develop autonomous agents, organize campus hackathons, and compete in national coding challenges.
          </p>
        </div>
      </section>

      {/* Achievements Matrix */}
      <section className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {ACHIEVEMENTS.map((a) => {
          const Icon = a.icon;
          return (
            <div
              key={a.label}
              className="rounded-2xl glass p-6 border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-400/40 transition flex flex-col justify-between shadow-sm hover:shadow-lg"
            >
              <div className={`p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 w-fit ${a.color} transition-colors`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-6">
                <div className="font-display text-3xl font-black text-slate-900 dark:text-white transition-colors">{a.label}</div>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">{a.desc}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Club Activities Showcase */}
      {activities.length > 0 && (
        <section className="relative z-10 mb-20">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 uppercase tracking-widest flex items-center justify-center gap-1.5 mb-2 font-semibold">
              <Camera className="h-3.5 w-3.5" />
              <span>ACTIVITIES & FIELD DISPATCHES // CAPTURED MOMENTS</span>
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white transition-colors">
              Club Activities & Initiatives
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 transition-colors">
              Snapshots from our hackathons, industrial visits, hands-on workshops, and collaborative build sprints.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((act) => (
              <div
                key={act.id}
                className="group glass rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-400/40 transition-all flex flex-col justify-between shadow-sm hover:shadow-xl"
              >
                <div className="relative h-48 w-full bg-slate-200 dark:bg-slate-900/60 overflow-hidden">
                  {act.photo ? (
                    <img
                      src={act.photo}
                      alt={act.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 bg-gradient-to-br from-purple-100 to-cyan-100 dark:from-purple-950/30 dark:to-cyan-950/30">
                      <Camera className="h-10 w-10 stroke-1 text-slate-400 dark:text-slate-600 mb-1" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-cyan-500 dark:bg-cyan-400 text-white dark:text-black px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider shadow">
                      {act.category || "Workshop"}
                    </span>
                  </div>

                  {act.date && (
                    <div className="absolute bottom-2.5 left-3 text-[11px] font-mono text-cyan-200 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{act.date}</span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-slate-900 dark:text-white text-base group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                      {act.name}
                    </h3>
                    {act.description && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 transition-colors">
                        {act.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Roadmap Timeline */}
      <section className="relative z-10 mb-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-mono text-purple-600 dark:text-purple-400 uppercase tracking-widest font-semibold">CHRONOLOGY</span>
          <h2 className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white transition-colors">Evolution of the Guild</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {TIMELINE.map((item, idx) => (
            <div
              key={item.year}
              className="relative rounded-2xl glass p-6 border border-slate-200/80 dark:border-white/10 hover:border-purple-500/40 dark:hover:border-purple-400/40 transition shadow-sm hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-display text-2xl font-black text-purple-600 dark:text-purple-400">{item.year}</span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-500">STAGE 0{idx + 1}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2 transition-colors">{item.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed transition-colors">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 mb-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 uppercase tracking-widest font-semibold">COMMUNITY VOICES</span>
          <h2 className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white transition-colors">Alumni & Member Impact</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl glass p-6 border border-slate-200/80 dark:border-white/10 flex flex-col justify-between shadow-sm hover:shadow-md transition">
              <Quote className="h-6 w-6 text-cyan-500/50 dark:text-cyan-400/40 mb-4" />
              <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed transition-colors">"{t.quote}"</p>
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-white/5">
                <div className="font-semibold text-slate-900 dark:text-white text-sm transition-colors">{t.name}</div>
                <div className="text-xs text-cyan-700 dark:text-cyan-300 font-mono mt-0.5 transition-colors">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="relative z-10 max-w-3xl mx-auto mb-20">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white transition-colors">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={faq.q}
                className="rounded-xl glass border border-slate-200/80 dark:border-white/10 overflow-hidden transition shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-medium text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-300 transition cursor-pointer"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-cyan-600 dark:text-cyan-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-white/5 transition-colors">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 rounded-3xl overflow-hidden border border-cyan-500/30 dark:border-cyan-400/30 bg-gradient-to-r from-cyan-500/10 via-white/80 to-purple-500/10 dark:from-cyan-950/40 dark:via-[#070b16] dark:to-purple-950/40 p-10 text-center shadow-xl backdrop-blur-md">
        <h2 className="font-display text-2xl sm:text-4xl font-black text-slate-900 dark:text-white glow-text transition-colors">
          Join the Movement
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm max-w-lg mx-auto transition-colors">
          Attend an upcoming workshop, compete in our hackathons, or build open-source AI projects.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            to="/events"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 hover:scale-105 transition"
          >
            Explore Events & Hackathons
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
