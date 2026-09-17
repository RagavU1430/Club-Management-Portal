/**
 * Resilient API fetcher.
 * Automatically tries relative path (Vite proxy). If Vite proxy returns HTML fallback,
 * it retries directly against http://localhost:4000.
 */
export const BACKEND_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:4000"
    : "");

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const isRelative = input.startsWith("/api") || input.startsWith("/uploads");
  
  try {
    const res = await fetch(input, init);
    const contentType = res.headers.get("content-type") || "";

    // If Vite dev server returned SPA fallback index.html instead of proxying to Express
    if (isRelative && contentType.includes("text/html") && BACKEND_URL) {
      const fallbackUrl = `${BACKEND_URL}${input}`;
      return await fetch(fallbackUrl, {
        ...init,
        credentials: "include",
      });
    }

    return res;
  } catch (err) {
    if (isRelative && BACKEND_URL) {
      const fallbackUrl = `${BACKEND_URL}${input}`;
      return await fetch(fallbackUrl, {
        ...init,
        credentials: "include",
      });
    }
    throw err;
  }
}
