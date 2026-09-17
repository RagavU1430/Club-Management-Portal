import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import GlobalVideoBackground from "./GlobalVideoBackground";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col bg-[#050811] text-slate-100 selection:bg-cyan-400 selection:text-black overflow-x-hidden">
      {/* Ambient Cyber Grid Background (Permanent across site) */}
      <div className="pointer-events-none fixed inset-0 z-0 cyber-grid opacity-35" />
      
      {/* Ambient Neon Lighting Orbs */}
      <div className="pointer-events-none fixed -top-20 right-1/4 h-[450px] w-[450px] rounded-full bg-cyan-500/10 blur-[130px] z-0" />
      <div className="pointer-events-none fixed bottom-1/4 -left-20 h-[450px] w-[450px] rounded-full bg-purple-600/10 blur-[130px] z-0" />

      {/* Hero Video Canvas (Strictly active on home page) */}
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
