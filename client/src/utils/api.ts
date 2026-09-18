/**
 * Resilient API fetcher.
 * In development (localhost): Uses relative path with Vite proxy.
 * In production: Directly targets BACKEND_URL to avoid round-trip HTML rewrites and CORS mismatch.
 */
export const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:4000"
    : "");

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const isRelative = input.startsWith("/api") || input.startsWith("/uploads");
  const isLocalDev = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  // In production, route directly to BACKEND_URL when available
  const initialUrl = isRelative && BACKEND_URL && !isLocalDev
    ? `${BACKEND_URL.replace(/\/$/, "")}${input}`
    : input;

  try {
    const res = await fetch(initialUrl, {
      ...init,
      credentials: "include",
    });
    const contentType = res.headers.get("content-type") || "";

    // Fallback: If dev server returned SPA fallback index.html instead of proxying to Express
    if (isRelative && contentType.includes("text/html") && BACKEND_URL && initialUrl !== `${BACKEND_URL.replace(/\/$/, "")}${input}`) {
      const fallbackUrl = `${BACKEND_URL.replace(/\/$/, "")}${input}`;
      return await fetch(fallbackUrl, {
        ...init,
        credentials: "include",
      });
    }

    return res;
  } catch (err) {
    if (isRelative && BACKEND_URL && initialUrl !== `${BACKEND_URL.replace(/\/$/, "")}${input}`) {
      const fallbackUrl = `${BACKEND_URL.replace(/\/$/, "")}${input}`;
      return await fetch(fallbackUrl, {
        ...init,
        credentials: "include",
      });
    }
    throw err;
  }
}
