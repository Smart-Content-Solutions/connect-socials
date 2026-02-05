import { createClient } from "@supabase/supabase-js";

// Dedicated Supabase client for AI Video Agent
const supabaseUrl = import.meta.env.VITE_AI_AGENT_SUPABASE_URL || "https://bgwmonmfulmmdwlbdekz.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_AI_AGENT_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnd21vbm1mdWxtbWR3bGJkZWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMjU0NDMsImV4cCI6MjA3ODYwMTQ0M30.5iY9xSK-4n6PA2nkM-9_mDAsIUefUNbpvbQQDUvBi98";

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing AI Agent Supabase environment variables");
}

export const aiAgentSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
    }
});
