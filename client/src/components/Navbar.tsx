import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, ChevronRight } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", label: "Home" },
  { path: "/events", label: "Events" },
  { path: "/team", label: "Coordinators" },
  { path: "/about", label: "About" },
  { path: "/admin", label: "Admin" },
];

export default function Navbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrolledRef = useRef(false);

  const handleScroll = useCallback(() => {
    const shouldBeScrolled = window.scrollY > 20;
    if (shouldBeScrolled !== scrolledRef.current) {
      scrolledRef.current = shouldBeScrolled;
      // eslint-disable-next-line react/set-state-in-effect -- Synchronizing with external system (window scroll)
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
          ? "bg-[#050811]/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl shadow-black/60 py-3"
          : "bg-[#050811]/85 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/40 py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo / Brand */}
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-400/30 p-0.5 overflow-hidden transition duration-300 group-hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] shadow-sm">
              <img
                src="/poster_end.jpg"
                alt="AI Frontier Emblem"
                className="h-full w-full object-cover rounded-[10px] scale-110 transition duration-300 group-hover:scale-125"
              />
              <div className="absolute inset-0 bg-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex flex-col">
              <span className="font-display text-lg font-extrabold tracking-wider text-white flex items-center gap-1.5 transition-colors">
                AI FRONTIER
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-400/20">
                  CLUB
                </span>
              </span>
              <span className="text-[10px] tracking-widest uppercase text-slate-400 font-mono transition-colors">
                AI & DATA SCIENCE GUILD
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md transition-colors">
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
                      ? "text-cyan-300 font-semibold"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions & Status */}
          <div className="hidden md:flex items-center gap-3">
            {/* Guild Status Badge */}
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-full transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span>2026 Active</span>
            </div>

            <Link
              to="/events"
              className="relative group inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 p-[1px] font-medium text-white transition focus:outline-none shadow-sm"
            >
              <span className="flex items-center gap-1.5 rounded-[11px] bg-[#050811] px-4 py-2 text-xs font-semibold tracking-wide text-cyan-300 transition duration-300 group-hover:bg-transparent group-hover:text-white">
                <Sparkles className="h-3.5 w-3.5" />
                Join Next Event
              </span>
            </Link>
          </div>

          {/* Mobile menu */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white focus:outline-none"
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
            className="md:hidden border-b border-white/10 bg-[#050811]/95 backdrop-blur-2xl px-6 py-6 transition-colors shadow-xl"
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
                        ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold"
                        : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-4 w-4 opacity-60" />
                  </Link>
                );
              })}

              <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-2">
                  <span>Guild Network</span>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-semibold">● Online</span>
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
