/**
 * useUnsavedChangesWarning Hook
 * 
 * A custom hook for detecting and handling unsaved changes when users
 * attempt to navigate away from a page. Provides protection for both
 * internal React Router navigation and browser navigation events.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Options for useUnsavedChangesWarning hook
 */
export interface UseUnsavedChangesWarningOptions {
    /** Whether there are unsaved changes in the form */
    hasUnsavedChanges: boolean;
    /** Callback when user confirms they want to leave without saving */
    onConfirmLeave?: () => void;
    /** Callback when user chooses to save draft before leaving */
    onSaveDraft?: () => Promise<boolean>;
    /** Callback when user chooses to stay and continue editing */
    onStay?: () => void;
    /** Custom message for browser's beforeunload dialog */
    beforeUnloadMessage?: string;
}

/**
 * Return type for useUnsavedChangesWarning hook
 */
export interface UseUnsavedChangesWarningReturn {
    /** Whether the confirmation dialog should be shown */
    showDialog: boolean;
    /** Function to show the confirmation dialog */
    showConfirmation: () => void;
    /** Function to hide the confirmation dialog */
    hideConfirmation: () => void;
    /** Function to handle user choosing to leave */
    handleLeave: () => void;
    /** Function to handle user choosing to stay */
    handleStay: () => void;
    /** Function to handle user choosing to save draft */
    handleSaveDraft: () => Promise<void>;
    /** Whether a save operation is in progress */
    isSaving: boolean;
    /** Function to programmatically navigate without confirmation */
    navigateWithoutConfirmation: (callback: () => void) => void;
}

/**
 * Hook for handling unsaved changes warnings
 * 
 * This hook provides:
 * 1. Browser beforeunload protection (for tab close, refresh, external navigation)
 * 2. React Router navigation blocking (for internal navigation)
 * 3. State management for showing/hiding confirmation dialogs
 * 
 * @param options - Configuration options
 * @returns Object with dialog state and handlers
 */
export function useUnsavedChangesWarning(
    options: UseUnsavedChangesWarningOptions
): UseUnsavedChangesWarningReturn {
    const {
        hasUnsavedChanges,
        onConfirmLeave,
        onSaveDraft,
        onStay,
        beforeUnloadMessage = 'Are you sure you want to leave? All details will be lost.'
    } = options;

    // State
    const [showDialog, setShowDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmedNavigation, setConfirmedNavigation] = useState(false);

    // Ref to track pending navigation callback
    const pendingNavigationRef = useRef<(() => void) | null>(null);

    // Use React Router's blocker to intercept navigation
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) => {
            // Only block if there are unsaved changes and navigation is to a different location
            return hasUnsavedChanges &&
                !confirmedNavigation &&
                currentLocation.pathname !== nextLocation.pathname;
        }
    );

    /**
     * Show the confirmation dialog
     */
    const showConfirmation = useCallback(() => {
        setShowDialog(true);
    }, []);

    /**
     * Hide the confirmation dialog
     */
    const hideConfirmation = useCallback(() => {
        setShowDialog(false);
    }, []);

    /**
     * Handle user choosing to leave without saving
     */
    const handleLeave = useCallback(() => {
        setConfirmedNavigation(true);
        setShowDialog(false);

        // Call the onConfirmLeave callback if provided
        onConfirmLeave?.();

        // If there's a pending navigation from React Router blocker, proceed with it
        if (blocker.state === 'blocked') {
            blocker.proceed();
        }

        // If there's a pending programmatic navigation, execute it
        if (pendingNavigationRef.current) {
            pendingNavigationRef.current();
            pendingNavigationRef.current = null;
        }
    }, [onConfirmLeave, blocker]);

    /**
     * Handle user choosing to stay and continue editing
     */
    const handleStay = useCallback(() => {
        setShowDialog(false);

        // Reset the blocker if it was blocked
        if (blocker.state === 'blocked') {
            blocker.reset();
        }

        // Call the onStay callback if provided
        onStay?.();
    }, [onStay, blocker]);

    /**
     * Handle user choosing to save draft before leaving
     */
    const handleSaveDraft = useCallback(async () => {
        if (!onSaveDraft) {
            // If no save callback, just proceed with leaving
            handleLeave();
            return;
        }

        setIsSaving(true);

        try {
            const success = await onSaveDraft();

            if (success) {
                // After successful save, proceed with navigation
                setConfirmedNavigation(true);
                setShowDialog(false);

                if (blocker.state === 'blocked') {
                    blocker.proceed();
                }

                if (pendingNavigationRef.current) {
                    pendingNavigationRef.current();
                    pendingNavigationRef.current = null;
                }
            }
            // If save failed, keep the dialog open and let user decide
        } catch (error) {
            console.error('Failed to save draft:', error);
            // Keep dialog open on error
        } finally {
            setIsSaving(false);
        }
    }, [onSaveDraft, handleLeave, blocker]);

    /**
     * Navigate without showing confirmation (for programmatic navigation after save)
     */
    const navigateWithoutConfirmation = useCallback((callback: () => void) => {
        setConfirmedNavigation(true);
        callback();
    }, []);

    // Show dialog when React Router blocks navigation
    useEffect(() => {
        if (blocker.state === 'blocked' && hasUnsavedChanges && !confirmedNavigation) {
            setShowDialog(true);
        }
    }, [blocker.state, hasUnsavedChanges, confirmedNavigation]);

    // Handle browser beforeunload event (for tab close, refresh, external navigation)
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (hasUnsavedChanges && !confirmedNavigation) {
                // Modern browsers require this pattern
                event.preventDefault();
                // Chrome requires returnValue to be set
                event.returnValue = beforeUnloadMessage;
                // Return the message for older browsers
                return beforeUnloadMessage;
            }
        };

        // Add event listener
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedChanges, confirmedNavigation, beforeUnloadMessage]);

    // Reset confirmed navigation when unsaved changes state changes
    useEffect(() => {
        if (!hasUnsavedChanges) {
            setConfirmedNavigation(false);
        }
    }, [hasUnsavedChanges]);

    return {
        showDialog,
        showConfirmation,
        hideConfirmation,
        handleLeave,
        handleStay,
        handleSaveDraft,
        isSaving,
        navigateWithoutConfirmation
    };
}

export default useUnsavedChangesWarning;