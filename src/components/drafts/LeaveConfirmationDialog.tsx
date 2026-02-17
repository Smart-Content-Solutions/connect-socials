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
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader className="gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                        <AlertDialogTitle className="text-lg font-semibold">
                            {title}
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-gray-600 text-left">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:gap-2">
                    {/* Stay Button - Secondary */}
                    <AlertDialogCancel asChild>
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={onStay}
                            disabled={isSaving}
                        >
                            Stay and Continue Editing
                        </Button>
                    </AlertDialogCancel>

                    <div className="flex gap-2 w-full sm:w-auto">
                        {/* Save Draft Button - Primary */}
                        <Button
                            variant="default"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
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

                        {/* Leave Button - Destructive */}
                        <AlertDialogAction asChild>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={onLeave}
                                disabled={isSaving}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Leave
                            </Button>
                        </AlertDialogAction>
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default LeaveConfirmationDialog;