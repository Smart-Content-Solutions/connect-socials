/**
 * LeaveConfirmationDialog Component
 * 
 * A dialog that appears when a user attempts to navigate away from a page
 * with unsaved changes. Provides options to leave, stay, or save as draft.
 */

import React from 'react';
import { AlertTriangle, Loader2, LogOut, Save } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

/**
 * Props for LeaveConfirmationDialog component
 */
export interface LeaveConfirmationDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback to control dialog open state */
    onOpenChange: (open: boolean) => void;
    /** Callback when user confirms leave */
    onLeave: () => void;
    /** Callback when user chooses to stay */
    onStay: () => void;
    /** Callback when user chooses to save draft */
    onSaveDraft: () => Promise<void>;
    /** Whether draft is currently being saved */
    isSaving?: boolean;
    /** Custom title for the dialog */
    title?: string;
    /** Custom description for the dialog */
    description?: string;
}

/**
 * Dialog component for confirming navigation away from unsaved changes
 */
export function LeaveConfirmationDialog({
    open,
    onOpenChange,
    onLeave,
    onStay,
    onSaveDraft,
    isSaving = false,
    title = 'Are you sure you want to leave?',
    description = 'All details will be lost. You can save your progress as a draft to continue later.'
}: LeaveConfirmationDialogProps): JSX.Element {

    const handleSaveDraft = async () => {
        await onSaveDraft();
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-md glass-card-gold border-white/10 p-6">
                <AlertDialogHeader className="gap-3">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
                            <AlertTriangle className="h-6 w-6 text-amber-400" />
                        </div>
                        <div className="flex flex-col gap-1 text-left">
                            <AlertDialogTitle className="text-xl font-semibold text-white">
                                {title}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                                {description}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    {/* Stay Button - Secondary */}
                    <AlertDialogCancel asChild>
                        <Button
                            variant="ghost"
                            className="w-full sm:w-auto text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
                            onClick={onStay}
                            disabled={isSaving}
                        >
                            Stay and Continue Editing
                        </Button>
                    </AlertDialogCancel>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {/* Leave Button - Destructive */}
                        <AlertDialogAction asChild>
                            <Button
                                variant="destructive"
                                className="flex-1 sm:flex-none bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                onClick={onLeave}
                                disabled={isSaving}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Leave
                            </Button>
                        </AlertDialogAction>

                        {/* Save Draft Button - Primary */}
                        <Button
                            variant="default"
                            className="flex-1 sm:flex-none btn-gold text-black hover:opacity-90 border-none"
                            onClick={handleSaveDraft}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save as Draft
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default LeaveConfirmationDialog;