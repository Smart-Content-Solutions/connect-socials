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
            <AlertDialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-0 overflow-hidden">
                {/* Header with Icon */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-6 border-b border-amber-100 dark:border-amber-900/30">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <AlertDialogTitle className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                {title}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                {description}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 bg-white dark:bg-gray-900">
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        {/* Stay Button - Secondary */}
                        <AlertDialogCancel asChild>
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                                    className="flex-1 sm:flex-none border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50"
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
                                className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-amber-500/25"
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