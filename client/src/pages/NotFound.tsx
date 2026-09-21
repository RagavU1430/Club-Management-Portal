import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, CalendarSearch, Ghost } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[85vh] items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl glass border border-slate-200/80 dark:border-white/10 shadow-2xl p-8 sm:p-10 text-center"
      >
        {/* Top vibrant accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]" />

        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] dark:from-cyan-500 dark:to-blue-600 shadow-lg shadow-pink-500/30">
          <Ghost className="h-8 w-8 text-white" />
        </div>

        <span className="font-display text-7xl sm:text-8xl font-black bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] bg-clip-text text-transparent dark:text-white">
          404
        </span>

        <h1 className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-white">
          Lost in the neural network?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          The page you are looking for does not exist or may have been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row gap-2.5 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] dark:from-cyan-500 dark:to-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-95"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            to="/events"
            className="inline-flex items-center justify-center gap-2 rounded-xl glass px-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-white/10 transition"
          >
            <CalendarSearch className="h-4 w-4" />
            Browse Events
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
