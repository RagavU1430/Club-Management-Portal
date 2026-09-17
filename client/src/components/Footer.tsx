import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { GithubIcon, LinkedinIcon, TwitterIcon } from "./SocialIcons";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setEmail("");
      setSubscribed(false);
    }, 4000);
  };

  return (
    <footer className="relative border-t border-white/10 bg-[#04070e] pt-16 pb-12 overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-[350px] w-[700px] bg-gradient-to-t from-cyan-900/15 via-purple-900/10 to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-white/10">
          {/* Brand Col */}
          <div className="md:col-span-4 flex flex-col items-start">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-400/30 overflow-hidden shadow-sm">
                <img src="/poster_end.jpg" alt="Logo" className="h-full w-full object-cover scale-110" />
              </div>
              <span className="font-display text-lg font-extrabold tracking-wider text-white">
                AI FRONTIER <span className="text-cyan-400">CLUB</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-sm">
              The premier collegiate guild for exploring, learning, and building with Artificial Intelligence and Data Science. Creating open-source models, hands-on hackathons, and next-gen AI tools.
            </p>

            <div className="mt-6 flex items-center gap-3 text-slate-400">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:text-cyan-300 transition shadow-sm"
                aria-label="GitHub"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:text-cyan-300 transition shadow-sm"
                aria-label="LinkedIn"
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:text-cyan-300 transition shadow-sm"
                aria-label="Twitter"
              >
                <TwitterIcon className="h-4 w-4" />
              </a>
              <a
                href="mailto:contact@aifrontierclub.org"
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:text-cyan-300 transition shadow-sm"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-2">
            <h3 className="text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase">
              Navigation
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-white transition">Home</Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-white transition">Events & Hackathons</Link>
              </li>
              <li>
                <Link to="/team" className="hover:text-white transition">Coordinators</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition">Our Story & Mission</Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-cyan-300 transition flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Focus Areas */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-mono font-semibold tracking-wider text-purple-400 uppercase">
              Innovation Tracks
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Generative AI & Transformer Models
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                Computer Vision & Neural Networks
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Data Science & Predictive Analytics
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                Robotics & Autonomous AI Agents
              </li>
            </ul>
          </div>

          {/* Newsletter / Dispatch */}
          <div className="md:col-span-3">
            <h3 className="text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase">
              Stay Informed
            </h3>
            <p className="mt-4 text-xs text-slate-400 leading-relaxed">
              Subscribe to the Frontier Dispatch for invitations to private hackathons and tech talks.
            </p>

            {subscribed ? (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 p-3 text-xs text-cyan-300">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <span>You're on the list! Welcome aboard.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-4 flex flex-col gap-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-3.5 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none shadow-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-cyan-400 text-[#050811] text-xs font-bold hover:bg-cyan-300 transition flex items-center cursor-pointer shadow-sm"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-500">No spam. Only high-signal dispatches.</span>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} AI Frontier Club. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer transition">Constitution</span>
            <span className="hover:text-slate-400 cursor-pointer transition">Code of Conduct</span>
            <span className="hover:text-slate-400 cursor-pointer transition">Security Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
