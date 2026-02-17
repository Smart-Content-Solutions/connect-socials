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
            <AlertDialogContent className="sm:max-w-[500px] glass-card border-white/10 p-0 overflow-hidden">
                {/* Header with Icon */}
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-6 border-b border-amber-500/20">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/20 border-2 border-amber-500/30">
                            <AlertTriangle className="h-6 w-6 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <AlertDialogTitle className="text-xl font-semibold text-white mb-2">
                                {title}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400 text-sm leading-relaxed">
                                {description}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 bg-gradient-to-br from-[#3B3C3E]/60 to-[#1A1A1C]/80">
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        {/* Stay Button - Secondary */}
                        <AlertDialogCancel asChild>
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto border-white/20 text-gray-300 hover:bg-white/5 hover:text-white hover:border-white/30"
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
                                    variant="outline"
                                    className="flex-1 sm:flex-none border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
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
                                className="flex-1 sm:flex-none btn-gold hover:opacity-90 border-0 shadow-lg shadow-amber-500/25"
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
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default LeaveConfirmationDialog;