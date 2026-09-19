import { createClient } from "@supabase/supabase-js";

// Production Supabase project defaults (guarded by Row Level Security)
const DEFAULT_SUPABASE_URL = "https://bmgngdolzoiaopyxtcgl.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZ25nZG9sem9pYW9weXh0Y2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MzU1MDksImV4cCI6MjEwNTMxMTUwOX0.cfKzBxStTo4eOwnvBY23ctkI0O7s7-RBwP8C-jtlkSg";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

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
