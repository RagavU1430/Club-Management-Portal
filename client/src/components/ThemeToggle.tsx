import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative group inline-flex items-center gap-2 rounded-full p-1.5 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer ${
        isDark
          ? "bg-white/[0.05] border border-white/10 hover:border-cyan-400/50 hover:bg-white/10 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
          : "bg-slate-200/80 border border-slate-300 hover:border-cyan-500/60 hover:bg-slate-100 text-amber-600 shadow-sm"
      } ${className}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <div className="relative flex h-7 w-7 items-center justify-center rounded-full overflow-hidden">
        <motion.div
          key={theme}
          initial={{ y: -20, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, rotate: 90 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="h-4 w-4 text-cyan-300 transition-transform duration-300 group-hover:scale-110" />
          ) : (
            <Sun className="h-4 w-4 text-amber-500 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-45" />
          )}
        </motion.div>
      </div>

      {showLabel && (
        <span className="pr-2 text-xs font-mono font-medium tracking-wide">
          {isDark ? "Dark Theme" : "Light Theme"}
        </span>
      )}
    </button>
  );
}
