import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import GlobalVideoBackground from "./GlobalVideoBackground";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#050811] text-slate-100 selection:bg-cyan-400 selection:text-black">
      {/* Background Video Playback (Active on all pages EXCEPT /admin) */}
      <GlobalVideoBackground />

      {/* Global Navbar */}
      <Navbar />

      {/* Main Content Viewport */}
      <div className="flex-1 w-full relative z-10">{children}</div>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
