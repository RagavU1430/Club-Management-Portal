import { createClient } from "@supabase/supabase-js";

// Production Supabase project defaults (public browser credentials guarded by Row Level Security)
const DEFAULT_SUPABASE_URL = "https://bmgngdolzoiaopyxtcgl.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZ25nZG9sem9pYW9weXh0Y2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzU1MDksImV4cCI6MjEwNTMxMTUwOX0.cfKzBxStTo4eOwnvBY23ctkI0O7s7-RBwP8C-jtlkSg";

const rawUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Fallback to placeholder if somehow both env and default are empty to prevent createClient runtime crash
const supabaseUrl = rawUrl && rawUrl.startsWith("https://") ? rawUrl : (rawUrl || "https://placeholder.supabase.co");
const supabaseAnonKey = rawAnonKey || "placeholder-anon-key";

export const isSupabaseConfigured = Boolean(
  rawUrl && 
  rawAnonKey && 
  rawUrl.startsWith("https://") &&
  !rawUrl.includes("placeholder")
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
