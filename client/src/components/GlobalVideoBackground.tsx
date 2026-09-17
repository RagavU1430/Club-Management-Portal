import { useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

const TOTAL_FRAMES = 180;
const FRAME_PATH = (i: number) =>
  `/frames/frame_${String(i).padStart(4, "0")}.jpg`;

/**
 * Global Scroll-Driven Video Playback Component.
 * Smoothly scrubs through frames across all pages (Home, Events, Team, About, etc.)
 * as the user scrolls down each page.
 */
export default function GlobalVideoBackground() {
  const { pathname } = useLocation();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const currentFrameRef = useRef<number>(0);
  const targetFrameRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // Render a specific frame onto the full-screen canvas
  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let img = imagesRef.current[frameIndex];
    if (!img || !img.complete) {
      // Find nearest loaded frame fallback
      for (let offset = 1; offset < 30; offset++) {
        const before = imagesRef.current[Math.max(0, frameIndex - offset)];
        if (before && before.complete) {
          img = before;
          break;
        }
        const after = imagesRef.current[Math.min(TOTAL_FRAMES - 1, frameIndex + offset)];
        if (after && after.complete) {
          img = after;
          break;
        }
      }
    }

    if (!img || !img.complete) return;

    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const iWidth = img.naturalWidth || 960;
    const iHeight = img.naturalHeight || 540;

    // Fullscreen cover aspect ratio scaling
    const scale = Math.max(cWidth / iWidth, cHeight / iHeight);
    const x = (cWidth - iWidth * scale) / 2;
    const y = (cHeight - iHeight * scale) / 2;

    ctx.clearRect(0, 0, cWidth, cHeight);
    ctx.drawImage(img, x, y, iWidth * scale, iHeight * scale);
  }, []);

  // Preload all 180 frames aggressively
  useEffect(() => {
    imagesRef.current = new Array(TOTAL_FRAMES).fill(null);

    const loadSingle = (index: number): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = FRAME_PATH(index + 1);
        img.onload = () => {
          imagesRef.current[index] = img;
          if (index === 0) {
            renderFrame(0);
          }
          resolve();
        };
        img.onerror = () => resolve();
      });
    };

    // Immediate priority chunk: first 35 frames
    const priorityIndices = Array.from({ length: 35 }, (_, i) => i);
    Promise.all(priorityIndices.map(loadSingle)).then(() => {
      // Remaining frames in fast background batches
      const remainingIndices = Array.from(
        { length: TOTAL_FRAMES - 35 },
        (_, i) => i + 35
      );
      remainingIndices.forEach((idx) => {
        loadSingle(idx);
      });
    });
  }, [renderFrame]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvasRef.current.width = window.innerWidth * dpr;
        canvasRef.current.height = window.innerHeight * dpr;
        renderFrame(Math.round(currentFrameRef.current));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderFrame]);

  // Scroll mapping: maps full page scroll depth to video frames (0 to 179)
  useEffect(() => {
    const handleScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const maxScroll = Math.max(window.innerHeight * 0.4, scrollableHeight * 0.9);
      const currentScroll = window.scrollY;
      const progress = Math.max(0, Math.min(1, currentScroll / maxScroll));

      const target = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(progress * (TOTAL_FRAMES - 1)))
      );
      targetFrameRef.current = target;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Trigger on route change
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // Reset scroll & target frame smoothly when changing pages
  useEffect(() => {
    targetFrameRef.current = 0;
  }, [pathname]);

  // Butter-smooth 60-120 FPS lerp interpolation loop
  useEffect(() => {
    let active = true;
    let lastRenderedFrame = -1;

    const renderLoop = () => {
      if (!active) return;

      const diff = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(diff) > 0.01) {
        // High-precision smooth damping
        currentFrameRef.current += diff * 0.22;
        const frameToRender = Math.round(currentFrameRef.current);
        if (frameToRender !== lastRenderedFrame) {
          renderFrame(frameToRender);
          lastRenderedFrame = frameToRender;
        }
      }

      rafRef.current = requestAnimationFrame(renderLoop);
    };

    rafRef.current = requestAnimationFrame(renderLoop);
    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [renderFrame]);

  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-[#050811]">
      <canvas
        ref={canvasRef}
        className="h-full w-full object-cover opacity-80"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Cyberpunk ambient lighting overlays for readability & high contrast across all pages */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-[#050811]/30 to-[#050811]/70 pointer-events-none" />
    </div>
  );
}
