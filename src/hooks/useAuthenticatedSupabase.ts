/**
 * useAuthenticatedSupabase Hook
 * 
 * Provides a Supabase client authenticated with the current Clerk user's JWT token.
 * This ensures RLS policies work correctly with Clerk authentication.
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAuthenticatedSupabaseClient, supabase } from '@/lib/supabase-clerk-integration';

/**
 * Hook that returns a Supabase client authenticated with Clerk
 * 
 * @returns Authenticated Supabase client
 */
export function useAuthenticatedSupabase(): SupabaseClient {
    const { getToken, isSignedIn } = useAuth();
    const [client, setClient] = useState<SupabaseClient>(supabase);

    useEffect(() => {
        const setupClient = async () => {
            if (isSignedIn) {
                try {
                    // Get Clerk JWT token with Supabase template
                    const token = await getToken({ template: 'supabase' });

                    if (token) {
                        const authenticatedClient = createAuthenticatedSupabaseClient(token);
                        setClient(authenticatedClient);
                    } else {
                        // Fallback to unauthenticated client
                        setClient(supabase);
                    }
                } catch (error) {
                    console.error('Error getting Clerk token for Supabase:', error);
                    setClient(supabase);
                }
            } else {
                // User not signed in, use unauthenticated client
                setClient(supabase);
            }
        };

        setupClient();
    }, [getToken, isSignedIn]);

    return client;
}
