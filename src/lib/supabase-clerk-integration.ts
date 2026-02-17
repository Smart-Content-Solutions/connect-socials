/**
 * Supabase + Clerk Integration
 * 
 * This module provides integration between Clerk authentication and Supabase.
 * It ensures that Supabase operations are authenticated with Clerk user tokens.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
}

/**
 * Creates a Supabase client with Clerk authentication
 * 
 * @param clerkToken - JWT token from Clerk (optional)
 * @returns Authenticated Supabase client
 */
export function createAuthenticatedSupabaseClient(clerkToken?: string): SupabaseClient {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: localStorage,
            persistSession: true,
            autoRefreshToken: true,
        },
        global: {
            headers: clerkToken ? {
                Authorization: `Bearer ${clerkToken}`,
            } : {},
        },
    });

    return client;
}

/**
 * Default Supabase client (unauthenticated)
 * Use this for public operations only
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
    }
});
