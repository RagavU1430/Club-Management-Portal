import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight, Sun, Moon, UserPlus, Loader2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import RegistrationModal, { EventItem } from "./RegistrationModal";
import { apiFetch } from "../utils/api";

const NAV_ITEMS = [
  { path: "/", label: "Home" },
  { path: "/events", label: "Events" },
  { path: "/team", label: "Coordinators" },
  { path: "/about", label: "About" },
  { path: "/admin", label: "Admin" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [registerEvent, setRegisterEvent] = useState<EventItem | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showNoEvent, setShowNoEvent] = useState(false);
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

  // Open registration popup for the next upcoming event.
  // Shows a warm "stay tuned" message when nothing is scheduled yet.
  const handleRegisterNow = useCallback(async () => {
    if (registerEvent) return;
    setRegisterLoading(true);
    try {
      const res = await apiFetch("/api/events?scope=upcoming&limit=1");
      const d = await res.json();
      if (d.success && Array.isArray(d.data) && d.data.length > 0) {
        setRegisterEvent(d.data[0]);
      } else {
        setShowNoEvent(true);
      }
    } catch {
      setShowNoEvent(true);
    } finally {
      setRegisterLoading(false);
    }
  }, [registerEvent]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 dark:bg-[#050811]/95 backdrop-blur-2xl border-b border-[#dbdbdb] dark:border-white/10 shadow-sm dark:shadow-2xl dark:shadow-black/60 py-3"
          : "bg-white/90 dark:bg-[#050811]/85 backdrop-blur-xl border-b border-[#dbdbdb]/60 dark:border-white/5 shadow-none dark:shadow-lg dark:shadow-black/40 py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          {/* Logo / Brand - College */}
          <Link to="/" className="group flex min-w-0 items-center gap-2.5">
            <div className="relative flex h-10 w-10 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-full bg-white p-0.5 shadow-md shadow-slate-300/50 dark:shadow-black/50 border border-slate-200 dark:border-white/15 overflow-hidden transition-all duration-300 group-hover:scale-105">
              <img
                src="/college-logo.jpg"
                alt="VSB Engineering College Logo"
                className="h-full w-full object-cover rounded-full"
              />
            </div>

            <div className="flex min-w-0 flex-col">
              <span className="college-brand whitespace-nowrap text-base sm:text-lg xl:text-xl">
                VSB Engineering College, Karur
              </span>
              <span className="truncate text-[9px] md:text-[10px] tracking-[0.18em] uppercase text-[#8e8e8e] dark:text-slate-400 font-mono transition-colors">
                AI Frontier Club • AI & Data Science Guild
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden shrink-0 lg:flex items-center gap-0.5 bg-[#fafafa]/90 dark:bg-white/[0.03] border border-[#dbdbdb] dark:border-white/10 rounded-full px-2 py-1.5 backdrop-blur-md transition-colors shadow-sm dark:shadow-none">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 rounded-full ${
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
          <div className="hidden shrink-0 md:flex items-center gap-2">
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

            {/* Join CTA */}            <button
              type="button"
              onClick={handleRegisterNow}
              disabled={registerLoading}
              className="relative group inline-flex whitespace-nowrap items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] dark:from-cyan-500 dark:to-blue-600 px-5 py-2.5 text-sm font-extrabold tracking-wide text-white shadow-lg shadow-pink-500/30 ring-2 ring-pink-500/20 dark:ring-cyan-400/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-pink-500/40 disabled:opacity-70 cursor-pointer"
            >
              {registerLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              <span>{registerLoading ? "Loading..." : "Register Now"}</span>
            </button>
          </div>

          {/* Mobile menu & Theme toggle */}
          <div className="flex shrink-0 lg:hidden items-center gap-2">
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
            className="lg:hidden border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#050811]/95 backdrop-blur-2xl px-6 py-6 transition-colors shadow-xl"
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
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleRegisterNow();
                  }}
                  disabled={registerLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] px-4 py-3.5 text-base font-extrabold text-white shadow-lg hover:opacity-95 transition disabled:opacity-70"
                >
                  {registerLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Register Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming-event registration popup */}
      {registerEvent && (
        <RegistrationModal
          event={registerEvent}
          onClose={() => setRegisterEvent(null)}
        />
      )}

      {/* Warm "stay tuned" popup when no event is scheduled yet */}
      {createPortal(
        <AnimatePresence>
        {showNoEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowNoEvent(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-white/10 shadow-2xl p-8 text-center"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888]" />

              <button
                onClick={() => setShowNoEvent(false)}
                aria-label="Close"
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] shadow-lg shadow-pink-500/30 text-3xl">
                🎉
              </div>

              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                We love your enthusiasm!
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Thank you for your eagerness to join us! There are no open
                registrations right now — our team is preparing something
                exciting. Please check back soon, the next event will be
                announced shortly.
              </p>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setShowNoEvent(false);
                    navigate("/events");
                  }}
                  className="w-full rounded-xl bg-gradient-to-r from-[#833ab4] via-[#e1306c] to-[#f77737] dark:from-cyan-500 dark:to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-95 cursor-pointer"
                >
                  Browse Past Events
                </button>
                <button
                  onClick={() => setShowNoEvent(false)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                >
                  Got it, thanks!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
}
