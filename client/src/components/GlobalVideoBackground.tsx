import { useRef, useEffect, useCallback, useState } from "react";
import { useLocation } from "react-router-dom";

const TOTAL_FRAMES = 180;
const FRAME_PATH = (i: number) =>
  `/frames/frame_${String(i).padStart(4, "0")}.jpg`;

const MATRIX_CHARS = "0101010101ABCDEF0123456789λ∇θΣ⚡⌘{}</>[]AI_FRONTIER_CORE_SYS_NET_SYNAPSE_TENSOR_NODE";

/**
 * Global Scroll-Driven Video Playback Component with First-Frame Cyber Matrix Rain.
 * On the initial first frame (top of page), renders an energetic cyber hacking code rain.
 * As soon as the user scrolls, the matrix rain smoothly fades out and the video playback takes over.
 */
export default function GlobalVideoBackground() {
  const { pathname } = useLocation();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const currentFrameRef = useRef<number>(0);
  const targetFrameRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const matrixRafRef = useRef<number | null>(null);
  const [matrixOpacity, setMatrixOpacity] = useState(1);

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

  // Butter-smooth video frame lerp loop
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
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-[#050811]">
      {/* Scroll-Driven Video Canvas */}
      <canvas
        ref={canvasRef}
        className="h-full w-full object-cover opacity-100 brightness-110 contrast-105 saturate-110"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Cyber Hacking Rain Overlay (Active on First Frame, Dimmed / Subdued, Fades on Scroll) */}
      {!isAdmin && (
        <canvas
          ref={matrixCanvasRef}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none transition-opacity duration-300"
          style={{
            width: "100%",
            height: "100%",
            opacity: matrixOpacity * 0.42,
          }}
        />
      )}

      {/* Minimal ambient gradient for aesthetic depth & contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050811]/50 via-transparent to-[#050811]/20 pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-[#050811]/30 pointer-events-none" />
    </div>
  );
}

