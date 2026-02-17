/**
 * usePostDraft Hook
 * 
 * A custom hook for managing post drafts in Supabase.
 * Provides functionality to save, load, and delete drafts for post creation tools.
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
    UsePostDraftOptions,
    UsePostDraftReturn,
    PostDraftRow
} from '@/types/draft';
import {
    validateDraftSize,
    handleDraftError,
    saveDraftToLocalStorage,
    loadDraftFromLocalStorage,
    clearDraftFromLocalStorage,
    hasDraftContent
} from '@/lib/draft-utils';

/**
 * Hook for managing post drafts
 * 
 * @param options - Configuration options for the hook
 * @returns Object with draft management functions and state
 */
export function usePostDraft(options: UsePostDraftOptions): UsePostDraftReturn {
    const {
        toolType,
        getDraftData,
        setDraftData,
        hasChanges
    } = options;

    const { user, isSignedIn, isLoaded: isUserLoaded } = useUser();

    // State
    const [draftExists, setDraftExists] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);
    const [draftTimestamp, setDraftTimestamp] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    /**
     * Save current form state as a draft
     */
    const saveDraft = useCallback(async (): Promise<boolean> => {
        if (!isSignedIn || !user?.id) {
            toast.error('Please sign in to save drafts');
            return false;
        }

        setError(null);
        setIsSaving(true);

        try {
            const draftData = getDraftData();

            // Check if there's meaningful content to save
            if (!hasDraftContent(draftData)) {
                toast.error('No content to save');
                return false;
            }

            // Validate size
            const sizeValidation = validateDraftSize(draftData);
            if (!sizeValidation.valid) {
                toast.error(sizeValidation.error || 'Draft is too large');
                return false;
            }

            // Prepare payload
            const payload = {
                user_id: user.id,
                tool_type: toolType,
                draft_data: draftData
            };

            // Upsert to database (insert or update if exists)
            const { error: upsertError } = await supabase
                .from('post_drafts')
                .upsert(payload, {
                    onConflict: 'user_id,tool_type',
                    ignoreDuplicates: false
                });

            if (upsertError) {
                throw upsertError;
            }

            // Also save to localStorage as backup
            saveDraftToLocalStorage(user.id, toolType, draftData);

            setDraftExists(true);
            setDraftTimestamp(new Date());

            toast.success('Draft saved successfully');
            return true;
        } catch (err) {
            const result = handleDraftError(err);
            setError(result.error || 'Failed to save draft');
            toast.error(result.error || 'Failed to save draft');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [isSignedIn, user?.id, toolType, getDraftData]);

    /**
     * Load draft from database
     */
    const loadDraft = useCallback(async (): Promise<Record<string, any> | null> => {
        if (!isSignedIn || !user?.id) {
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('post_drafts')
                .select('*')
                .eq('user_id', user.id)
                .eq('tool_type', toolType)
                .maybeSingle();

            if (fetchError) {
                throw fetchError;
            }

            if (!data) {
                // Try localStorage backup
                const localDraft = loadDraftFromLocalStorage(user.id, toolType);
                if (localDraft?.data) {
                    setDraftTimestamp(new Date(localDraft.timestamp));
                    return localDraft.data;
                }
                return null;
            }

            const row = data as PostDraftRow;
            setDraftTimestamp(new Date(row.updated_at));

            return row.draft_data;
        } catch (err) {
            const result = handleDraftError(err);
            setError(result.error || 'Failed to load draft');

            // Try localStorage backup on error
            const localDraft = loadDraftFromLocalStorage(user.id, toolType);
            if (localDraft?.data) {
                setDraftTimestamp(new Date(localDraft.timestamp));
                return localDraft.data;
            }

            return null;
        } finally {
            setIsLoading(false);
        }
    }, [isSignedIn, user?.id, toolType]);

    /**
     * Delete draft from database
     */
    const deleteDraft = useCallback(async (): Promise<boolean> => {
        if (!isSignedIn || !user?.id) {
            return false;
        }

        setError(null);

        try {
            const { error: deleteError } = await supabase
                .from('post_drafts')
                .delete()
                .eq('user_id', user.id)
                .eq('tool_type', toolType);

            if (deleteError) {
                throw deleteError;
            }

            // Also clear localStorage backup
            clearDraftFromLocalStorage(user.id, toolType);

            setDraftExists(false);
            setDraftTimestamp(null);

            return true;
        } catch (err) {
            const result = handleDraftError(err);
            setError(result.error || 'Failed to delete draft');
            return false;
        }
    }, [isSignedIn, user?.id, toolType]);

    /**
     * Check if draft exists in database
     */
    const checkForDraft = useCallback(async (): Promise<boolean> => {
        if (!isSignedIn || !user?.id) {
            return false;
        }

        try {
            const { data, error: fetchError } = await supabase
                .from('post_drafts')
                .select('updated_at')
                .eq('user_id', user.id)
                .eq('tool_type', toolType)
                .maybeSingle();

            if (fetchError) {
                throw fetchError;
            }

            if (data) {
                setDraftExists(true);
                setDraftTimestamp(new Date(data.updated_at));
                return true;
            }

            // Check localStorage backup
            const localDraft = loadDraftFromLocalStorage(user.id, toolType);
            if (localDraft) {
                setDraftExists(true);
                setDraftTimestamp(new Date(localDraft.timestamp));
                return true;
            }

            setDraftExists(false);
            return false;
        } catch (err) {
            console.error('Error checking for draft:', err);

            // Check localStorage backup on error
            const localDraft = loadDraftFromLocalStorage(user.id, toolType);
            if (localDraft) {
                setDraftExists(true);
                setDraftTimestamp(new Date(localDraft.timestamp));
                return true;
            }

            return false;
        }
    }, [isSignedIn, user?.id, toolType]);

    /**
     * Restore draft data into form
     */
    const restoreDraft = useCallback(async (): Promise<boolean> => {
        const draftData = await loadDraft();

        if (!draftData) {
            return false;
        }

        setDraftData(draftData);
        return true;
    }, [loadDraft, setDraftData]);

    /**
     * Clear draft and reset form
     */
    const clearDraftAndForm = useCallback(async (): Promise<boolean> => {
        const success = await deleteDraft();

        if (success) {
            // Reset form to initial state (empty)
            setDraftData({});
            return true;
        }

        return false;
    }, [deleteDraft, setDraftData]);

    // Check for existing draft on mount
    useEffect(() => {
        if (isUserLoaded && isSignedIn && user?.id) {
            checkForDraft().finally(() => {
                setIsLoading(false);
                setIsDraftLoaded(true);
            });
        } else if (isUserLoaded && !isSignedIn) {
            setIsLoading(false);
            setIsDraftLoaded(true);
        }
    }, [isUserLoaded, isSignedIn, user?.id, checkForDraft]);

    return {
        saveDraft,
        loadDraft,
        deleteDraft,
        checkForDraft,
        draftExists,
        isLoading,
        isLoaded: isDraftLoaded,
        draftTimestamp,
        error,
        isSaving
    };
}

export default usePostDraft;