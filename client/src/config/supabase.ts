import { createClient } from "@supabase/supabase-js";

// Supabase project config — set via environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
// Do NOT hardcode production credentials here — use .env files or deployment secrets.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith("https://") &&
  !supabaseUrl.includes("placeholder")
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: async (url, options = {}) => {
      let retries = 2;
      let lastErr: any;
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          return await fetch(url, options);
        } catch (err: any) {
          lastErr = err;
          if (attempt === retries) break;
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        }
      }
      throw lastErr;
    },
  },
});
