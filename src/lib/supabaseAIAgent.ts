import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_AI_AGENT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_AI_AGENT_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing AI Agent Supabase environment variables");
}

export const supabaseAI = createClient(supabaseUrl, supabaseAnonKey);
