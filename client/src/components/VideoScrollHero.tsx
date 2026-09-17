import { ChevronDown, Sparkles } from "lucide-react";

/**
 * Hero content overlay for the Home page.
 * The video playback is rendered seamlessly in the background by GlobalVideoBackground in Layout.
 */
export default function VideoScrollHero() {
  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight * 0.85, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between items-center text-center px-6 pt-32 pb-16 z-10">
      {/* Top Badge */}
      <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 dark:bg-cyan-400/10 border border-cyan-500/30 dark:border-cyan-400/30 px-4 py-1.5 text-xs font-mono tracking-widest text-cyan-700 dark:text-cyan-300 backdrop-blur-md shadow-sm dark:shadow-[0_0_20px_rgba(0,240,255,0.2)]">
        <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 animate-spin" />
        DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE
      </div>

      {/* Headline & Subtitle with subtle glass backing */}
      <div className="max-w-4xl py-6 px-6 sm:px-10 rounded-3xl glass-subtle border border-slate-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl backdrop-blur-md transition-all duration-300">
        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white glow-text leading-[1.1] transition-colors">
          Learn, Code, and Build the Future with AI.
        </h1>
        <p className="mt-5 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed transition-colors">
          Explore neural networks, build generative AI projects, compete in hackathons, and collaborate with student developers in hands-on machine learning.
        </p>
      </div>

      {/* Scroll down prompt */}
      <button
        onClick={scrollToContent}
        className="flex flex-col items-center gap-2 text-xs font-mono tracking-widest text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition animate-bounce cursor-pointer group"
      >
        <span className="group-hover:text-cyan-600 dark:group-hover:text-cyan-300 font-semibold">SCROLL DOWN TO EXPLORE</span>
        <ChevronDown className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
      </button>
    </div>
  );
}
