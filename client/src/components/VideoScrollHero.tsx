import { ChevronDown, Cpu } from "lucide-react";

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
      <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#833ab4]/12 via-[#e1306c]/12 to-[#fcb045]/12 dark:bg-cyan-400/10 border border-[#e1306c]/35 dark:border-cyan-400/30 px-4 py-1.5 text-xs font-mono tracking-widest text-[#c13584] dark:text-cyan-300 backdrop-blur-md shadow-sm dark:shadow-[0_0_20px_rgba(0,240,255,0.2)] font-semibold">
        <Cpu className="h-3.5 w-3.5 text-[#e1306c] dark:text-cyan-400" />
        DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE
      </div>

      {/* Headline & Subtitle with refined frosted glass backing and Instagram top accent */}
      <div className="relative max-w-4xl py-7 sm:py-9 px-6 sm:px-10 rounded-3xl bg-white/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 shadow-2xl shadow-pink-500/10 dark:shadow-black/50 backdrop-blur-2xl transition-all duration-300 overflow-hidden">
        {/* Top vibrant Instagram rainbow line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] opacity-80 dark:opacity-0" />

        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white dark:glow-text leading-[1.1]">
          Learn, Code, and{" "}
          <span className="bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] bg-clip-text text-transparent dark:text-white font-black">
            Build the Future
          </span>{" "}
          with AI.
        </h1>
        <p className="mt-5 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Explore neural networks, build generative AI projects, compete in hackathons, and collaborate with student developers in hands-on machine learning.
        </p>
      </div>

      {/* Scroll down prompt */}
      <button
        onClick={scrollToContent}
        className="flex flex-col items-center gap-2 text-xs font-mono tracking-widest text-slate-500 dark:text-slate-400 hover:text-[#c13584] dark:hover:text-cyan-400 transition animate-bounce cursor-pointer group"
      >
        <span className="group-hover:text-[#c13584] dark:group-hover:text-cyan-300 font-bold">SCROLL DOWN TO EXPLORE</span>
        <ChevronDown className="h-4 w-4 text-[#e1306c] dark:text-cyan-400" />
      </button>
    </div>
  );
}
