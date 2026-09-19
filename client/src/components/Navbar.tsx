import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, ChevronRight, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const NAV_ITEMS = [
  { path: "/", label: "Home" },
  { path: "/events", label: "Events" },
  { path: "/team", label: "Coordinators" },
  { path: "/about", label: "About" },
  { path: "/admin", label: "Admin" },
];

export default function Navbar() {
  const location = useLocation();
  const { toggleTheme, isDark } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrolledRef = useRef(false);

  const handleScroll = useCallback(() => {
    const shouldBeScrolled = window.scrollY > 20;
    if (shouldBeScrolled !== scrolledRef.current) {
      scrolledRef.current = shouldBeScrolled;
      setScrolled(shouldBeScrolled);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 dark:bg-[#050811]/95 backdrop-blur-2xl border-b border-[#dbdbdb] dark:border-white/10 shadow-sm dark:shadow-2xl dark:shadow-black/60 py-3"
          : "bg-white/90 dark:bg-[#050811]/85 backdrop-blur-xl border-b border-[#dbdbdb]/60 dark:border-white/5 shadow-none dark:shadow-lg dark:shadow-black/40 py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo / Brand */}
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl p-[2px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] dark:from-cyan-500/30 dark:to-purple-600/30 dark:border dark:border-cyan-400/30 overflow-hidden transition-all duration-300 group-hover:scale-105 shadow-md shadow-pink-500/20 dark:shadow-none">
              <div className="h-full w-full rounded-[9px] bg-white dark:bg-[#050811] overflow-hidden p-0.5">
                <img
                  src="/poster_end.jpg"
                  alt="AI Frontier Emblem"
                  className="h-full w-full object-cover rounded-[7px] scale-110 transition duration-300 group-hover:scale-125"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <span className="font-display text-lg font-black tracking-wider text-[#262626] dark:text-white flex items-center gap-1.5 transition-colors">
                <span className="group-hover:text-[#c13584] dark:group-hover:text-cyan-300 transition-colors">
                  AI FRONTIER
                </span>
                <span className="text-[10px] uppercase font-extrabold tracking-widest px-1.5 py-0.5 rounded bg-gradient-to-r from-[#833ab4]/15 via-[#e1306c]/15 to-[#fcb045]/15 text-[#c13584] border border-[#e1306c]/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-400/20">
                  CLUB
                </span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-[#8e8e8e] dark:text-slate-400 font-mono transition-colors">
                AI & DATA SCIENCE GUILD
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#fafafa]/90 dark:bg-white/[0.03] border border-[#dbdbdb] dark:border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md transition-colors shadow-sm dark:shadow-none">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-1.5 text-sm font-medium transition-colors duration-200 rounded-full ${
                    isActive
                      ? "text-[#c13584] dark:text-cyan-300 font-bold"
                      : "text-slate-600 hover:text-[#262626] dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-[#833ab4]/15 via-[#e1306c]/15 to-[#fcb045]/15 dark:from-cyan-500/20 dark:to-purple-600/20 border border-[#e1306c]/35 dark:border-cyan-400/40 shadow-sm dark:shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions & Status */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-[#dbdbdb] dark:border-white/10 text-slate-700 dark:text-cyan-300 hover:text-[#c13584] dark:hover:text-white hover:border-[#e1306c]/40 transition-all duration-200 shadow-sm cursor-pointer"
              title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="h-4 w-4 text-amber-300" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="h-4 w-4 text-slate-700" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Guild Status Badge */}
            <div className="flex items-center gap-2 text-xs font-mono text-[#8e8e8e] dark:text-slate-400 bg-white dark:bg-white/[0.02] border border-[#dbdbdb] dark:border-white/5 px-3 py-1.5 rounded-full transition-colors shadow-sm dark:shadow-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-500 dark:bg-cyan-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e1306c] dark:bg-cyan-500"></span>
              </span>
              <span>2026 Active</span>
            </div>

            <Link
              to="/events"
              className="relative group inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] dark:from-cyan-500 dark:to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-pink-500/25 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/35 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Join Next Event</span>
            </Link>
          </div>

          {/* Mobile menu & Theme toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
            >
              {isDark ? <Sun className="h-5 w-5 text-amber-300" /> : <Moon className="h-5 w-5 text-slate-700" />}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#050811]/95 backdrop-blur-2xl px-6 py-6 transition-colors shadow-xl"
          >
            <div className="flex flex-col gap-3">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition ${
                      isActive
                        ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-4 w-4 opacity-60" />
                  </Link>
                );
              })}

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 px-2">
                  <span>Guild Network</span>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold">● Online</span>
                  </div>
                </div>
                <Link
                  to="/events"
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-3 font-semibold text-white shadow-md hover:opacity-95 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  Explore Events & Hackathons
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
