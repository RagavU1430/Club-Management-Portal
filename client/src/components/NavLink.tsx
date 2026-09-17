import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { GithubIcon, TwitterIcon } from "./SocialIcons";

export default function NavLink({
  to,
  children,
  className,
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} className={className ?? "text-sm text-slate-400 transition hover:text-white"}>
      {children}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-8">
      <div className="mx-auto max-w-6xl px-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-xs text-slate-500">© 2026 AI Frontier Club. Built for innovation.</p>
        <div className="flex items-center gap-4">
          <a href="#" className="text-slate-500 transition hover:text-cyan-400" aria-label="GitHub">
            <GithubIcon className="h-5 w-5" />
          </a>
          <a href="#" className="text-slate-500 transition hover:text-cyan-400" aria-label="Email">
            <Mail className="h-5 w-5" />
          </a>
          <a href="#" className="text-slate-500 transition hover:text-cyan-400" aria-label="Twitter">
            <TwitterIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
