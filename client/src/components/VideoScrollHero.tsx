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
      {/* Top Badge: Highlighted in both Light (Instagram gradient & white glass) and Dark (Cyber cyan neon glow) */}
      <div className="relative group inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-xs font-mono tracking-widest font-extrabold backdrop-blur-xl transition-all duration-300 hover:scale-[1.03]
        bg-white/95 text-slate-900 border border-[#e1306c]/50 shadow-[0_4px_20px_rgba(225,48,108,0.25)] hover:shadow-[0_6px_25px_rgba(225,48,108,0.35)]
        dark:bg-[#060c1b]/95 dark:border-cyan-400/80 dark:shadow-[0_0_25px_rgba(0,240,255,0.4),inset_0_0_12px_rgba(0,240,255,0.12)] dark:hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] cursor-default"
      >
        {/* Pulsing Live Beacon */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e1306c] dark:bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e1306c] dark:bg-cyan-400"></span>
        </span>

        {/* CPU Hardware Icon */}
        <Cpu className="h-4 w-4 text-[#e1306c] dark:text-cyan-300 shrink-0 transition-transform duration-300 group-hover:rotate-12" />

        {/* Text with high contrast in Light and Neon Glow in Dark */}
        <span className="bg-gradient-to-r from-[#7b1fa2] via-[#e91e63] to-[#e65100] bg-clip-text text-transparent font-black tracking-wider sm:tracking-widest dark:bg-none dark:text-cyan-200 dark:drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]">
          DEPARTMENT OF ARTIFICIAL INTELLIGENCE & DATA SCIENCE
        </span>
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
        <span className="group-hover:text-[#c13584] dark:group-hover:text-cyan-300 font-bold">SCROLL DOWN TO REGISTER</span>
        <ChevronDown className="h-4 w-4 text-[#e1306c] dark:text-cyan-400" />
      </button>
    </div>
  );
}
