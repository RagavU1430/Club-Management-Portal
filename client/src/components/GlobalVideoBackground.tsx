import { useRef, useEffect, useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const TOTAL_FRAMES = 180;
const FRAME_PATH = (i: number) =>
  `/frames/frame_${String(i).padStart(4, "0")}.jpg`;
const WHITE_FRAME_PATH = (i: number) =>
  `/white_frames/frame_${String(i).padStart(4, "0")}.jpg`;

const MATRIX_CHARS = "0101010101ABCDEF0123456789λ∇θΣ⚡⌘{}</>[]AI_FRONTIER_CORE_SYS_NET_SYNAPSE_TENSOR_NODE";

/**
 * Global Scroll-Driven Video Playback Component with First-Frame Cyber Matrix Rain.
 * Uses hardware-accelerated Canvas image frame rendering for both Dark and Light themes
 * to guarantee ultra-smooth 60-120 FPS scroll scrub without any browser video seek lag.
 */
export default function GlobalVideoBackground() {
  const { pathname } = useLocation();
  const { isDark } = useTheme();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const whiteImagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const currentFrameRef = useRef<number>(0);
  const targetFrameRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const matrixRafRef = useRef<number | null>(null);
  const [matrixOpacity, setMatrixOpacity] = useState(1);

  const isDarkRef = useRef(isDark);
  useEffect(() => {
    isDarkRef.current = isDark;
    renderFrame(Math.round(currentFrameRef.current));
  }, [isDark]);

  // Render a specific frame onto the full-screen canvas (selects dark or white cache)
  const renderFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cache = isDarkRef.current ? imagesRef.current : whiteImagesRef.current;
    let img = cache[frameIndex];
    if (!img || !img.complete) {
      // Find nearest loaded frame fallback
      for (let offset = 1; offset < 30; offset++) {
        const before = cache[Math.max(0, frameIndex - offset)];
        if (before && before.complete) {
          img = before;
          break;
        }
        const after = cache[Math.min(TOTAL_FRAMES - 1, frameIndex + offset)];
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

  // Preload all 180 frames for both themes aggressively
  useEffect(() => {
    imagesRef.current = new Array(TOTAL_FRAMES).fill(null);
    whiteImagesRef.current = new Array(TOTAL_FRAMES).fill(null);

    const loadSingleDark = (index: number): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = FRAME_PATH(index + 1);
        img.onload = () => {
          imagesRef.current[index] = img;
          if (index === 0 && isDarkRef.current) {
            renderFrame(0);
          }
          resolve();
        };
        img.onerror = () => resolve();
      });
    };

    const loadSingleWhite = (index: number): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = WHITE_FRAME_PATH(index + 1);
        img.onload = () => {
          whiteImagesRef.current[index] = img;
          if (index === 0 && !isDarkRef.current) {
            renderFrame(0);
          }
          resolve();
        };
        img.onerror = () => resolve();
      });
    };

    // Immediate priority chunk: first 35 frames for both themes
    const priorityIndices = Array.from({ length: 35 }, (_, i) => i);
    Promise.all([
      ...priorityIndices.map(loadSingleDark),
      ...priorityIndices.map(loadSingleWhite),
    ]).then(() => {
      // Remaining frames in fast background batches
      const remainingIndices = Array.from(
        { length: TOTAL_FRAMES - 35 },
        (_, i) => i + 35
      );
      remainingIndices.forEach((idx) => {
        loadSingleDark(idx);
        loadSingleWhite(idx);
      });
    });
  }, [renderFrame]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth * dpr;
        canvasRef.current.height = window.innerHeight * dpr;
        renderFrame(Math.round(currentFrameRef.current));
      }
      if (matrixCanvasRef.current) {
        matrixCanvasRef.current.width = window.innerWidth * dpr;
        matrixCanvasRef.current.height = window.innerHeight * dpr;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderFrame]);

  const isAdmin = pathname.startsWith("/admin");

  // Scroll mapping: maps scroll depth to video frames & fades matrix rain on first frame
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const maxScroll = Math.max(window.innerHeight * 0.4, scrollableHeight * 0.9);
      const progress = Math.max(0, Math.min(1, scrollY / maxScroll));

      const target = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(progress * (TOTAL_FRAMES - 1)))
      );
      targetFrameRef.current = target;

      // Matrix rain is only active on non-admin pages on first frame (scrollY = 0)
      if (isAdmin) {
        setMatrixOpacity(0);
      } else {
        const fade = Math.max(0, 1 - scrollY / 120);
        setMatrixOpacity(fade);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, isAdmin]);

  // Reset scroll & target frame smoothly when changing pages
  useEffect(() => {
    targetFrameRef.current = 0;
    setMatrixOpacity(isAdmin ? 0 : 1);
  }, [pathname, isAdmin]);

  // Butter-smooth video frame lerp loop (hardware-accelerated canvas for 60-120 FPS on both themes)
  useEffect(() => {
    let active = true;
    let lastRenderedFrame = -1;

    const renderLoop = () => {
      if (!active) return;

      const diff = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(diff) > 0.01) {
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

  // Cyber Matrix Rain Animation Loop (Active on First Frame, Full-Width Edge-to-Edge, skipped on Admin)
  useEffect(() => {
    if (isAdmin) return;

    const canvas = matrixCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let active = true;
    let lastTime = performance.now();
    let drops: number[] = [];
    let speeds: number[] = [];
    let fontSize = 16;

    const updateDimensions = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth * dpr;
      const h = window.innerHeight * dpr;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      fontSize = Math.max(14, Math.round(16 * dpr));
      const neededCols = Math.ceil(canvas.width / fontSize) + 4;

      // Expand drops array if new columns are needed (e.g. wide screens or right-side coverage)
      while (drops.length < neededCols) {
        drops.push(Math.floor(Math.random() * (canvas.height / fontSize)));
        speeds.push(0.75 + Math.random() * 1.25);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    const drawMatrix = (currentTime: number) => {
      if (!active) return;

      const elapsed = currentTime - lastTime;
      if (elapsed > 33) { // ~30 FPS terminal cadence
        lastTime = currentTime;

        // Ensure canvas width & columns stay synchronized to the full viewport
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth * dpr;
        if (canvas.width !== w) {
          updateDimensions();
        }

        // Semi-transparent fade background for phosphorescent trailing glow
        ctx.fillStyle = "rgba(5, 8, 17, 0.24)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace, monospace`;

        const totalCols = Math.ceil(canvas.width / fontSize);

        for (let i = 0; i < totalCols; i++) {
          if (drops[i] === undefined) {
            drops[i] = Math.floor(Math.random() * (canvas.height / fontSize));
            speeds[i] = 0.75 + Math.random() * 1.25;
          }

          const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          // Softer, balanced leading glyph
          ctx.fillStyle = "rgba(220, 245, 255, 0.75)";
          ctx.shadowBlur = 4;
          ctx.shadowColor = "rgba(0, 240, 255, 0.35)";
          ctx.fillText(char, x, y);

          // Subtle ambient trailing glyphs without harsh glare
          ctx.fillStyle = i % 3 === 0
            ? "rgba(0, 220, 255, 0.4)"
            : i % 5 === 0
            ? "rgba(168, 85, 247, 0.35)"
            : "rgba(16, 185, 129, 0.4)";
          ctx.shadowBlur = 0;
          ctx.fillText(char, x, y - fontSize);

          // Reset drop once it crosses the bottom of the screen
          if (y > canvas.height && Math.random() > 0.972) {
            drops[i] = 0;
            speeds[i] = 0.75 + Math.random() * 1.25;
          }

          drops[i] += speeds[i];
        }
      }

      matrixRafRef.current = requestAnimationFrame(drawMatrix);
    };

    matrixRafRef.current = requestAnimationFrame(drawMatrix);

    return () => {
      active = false;
      window.removeEventListener("resize", updateDimensions);
      if (matrixRafRef.current) cancelAnimationFrame(matrixRafRef.current);
    };
  }, [isAdmin]);

  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: isDark ? "#050811" : "#f6f8fa" }}
    >
      {/* ── Dark & Light Mode: Unified Scroll-Driven Canvas Frames (Fluid 60-120 FPS) ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none transition-opacity duration-300"
        style={{
          width: "100%",
          height: "100%",
          opacity: isDark ? 1 : 0.95,
        }}
      />

      {/* ── Dark Mode: Cyber Matrix Rain Overlay ── */}
      {!isAdmin && (
        <canvas
          ref={matrixCanvasRef}
          className="absolute inset-0 h-full w-full pointer-events-none transition-opacity duration-500"
          style={{
            width: "100%",
            height: "100%",
            opacity: isDark ? matrixOpacity * 0.42 : 0,
          }}
        />
      )}

      {/* ── Light Mode: Vibrant Instagram Colorful Atmosphere & Gradient Depth ── */}
      {/* 1. Multi-chromatic Instagram sunset ambient orbs (Violet, Magenta, Coral, Amber) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          opacity: isDark ? 0 : 1,
          background: `
            radial-gradient(ellipse 65% 55% at 88% 18%, rgba(225, 48, 108, 0.22) 0%, rgba(193, 53, 132, 0.12) 45%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 12% 25%, rgba(131, 58, 180, 0.18) 0%, rgba(114, 9, 183, 0.08) 50%, transparent 70%),
            radial-gradient(ellipse 70% 50% at 50% 50%, rgba(252, 175, 69, 0.16) 0%, rgba(247, 119, 55, 0.09) 45%, transparent 75%),
            radial-gradient(ellipse 75% 55% at 18% 85%, rgba(253, 29, 29, 0.18) 0%, rgba(225, 48, 108, 0.10) 45%, transparent 70%),
            radial-gradient(ellipse 65% 50% at 85% 82%, rgba(131, 58, 180, 0.20) 0%, rgba(76, 0, 112, 0.08) 50%, transparent 70%)
          `,
        }}
      />

      {/* 2. Top-to-bottom soft readability scrim (allows video to shine in hero, ensures crystal readability below) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isDark ? 0 : 1,
          background: "linear-gradient(180deg, rgba(246,248,250,0.05) 0%, rgba(246,248,250,0.45) 30%, rgba(246,248,250,0.85) 65%, #f6f8fa 100%)",
        }}
      />

      {/* 3. Iconic Instagram rainbow accent line at the absolute top of the viewport */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] pointer-events-none transition-opacity duration-500 z-20"
        style={{
          opacity: isDark ? 0 : 1,
          background: "linear-gradient(90deg, #f09433 0%, #e6683c 20%, #dc2743 40%, #cc2366 60%, #bc1888 80%, #833ab4 100%)",
        }}
      />

      {/* ── Dark Mode: Ambient depth gradient ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isDark ? 1 : 0,
          background: "linear-gradient(to top, rgba(5,8,17,0.5) 0%, transparent 50%, rgba(5,8,17,0.2) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isDark ? 1 : 0,
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(5,8,17,0.3) 100%)",
        }}
      />
    </div>
  );
}
