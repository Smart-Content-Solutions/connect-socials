/**
 * DraftRestoreDialog Component
 * 
 * A dialog that appears when a user returns to a tool and has a saved draft.
 * Provides options to continue with the draft or start fresh.
 */

import React from 'react';
import { FileText, Loader2, RotateCcw, Trash2 } from 'lucide-react';
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
import { formatDraftTimestamp } from '@/lib/draft-utils';

/**
 * Props for DraftRestoreDialog component
 */
export interface DraftRestoreDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback to control dialog open state */
    onOpenChange: (open: boolean) => void;
    /** Callback when user chooses to continue with draft */
    onContinue: () => void;
    /** Callback when user chooses to start fresh */
    onStartFresh: () => void;
    /** Timestamp of when the draft was last saved */
    draftTimestamp?: Date | null;
    /** Whether the draft is currently being loaded */
    isLoading?: boolean;
    /** Custom title for the dialog */
    title?: string;
    /** Custom description for the dialog */
    description?: string;
}

/**
 * Dialog component for restoring a saved draft
 */
export function DraftRestoreDialog({
    open,
    onOpenChange,
    onContinue,
    onStartFresh,
    draftTimestamp,
    isLoading = false,
    title = 'Continue where you left off?',
    description
}: DraftRestoreDialogProps): JSX.Element {

    const formattedTime = formatDraftTimestamp(draftTimestamp);

    const defaultDescription = `You have a saved draft from ${formattedTime}. Would you like to continue with your previous work or start fresh?`;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader className="gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <AlertDialogTitle className="text-lg font-semibold">
                            {title}
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-gray-600 text-left">
                        {description || defaultDescription}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:gap-2">
                    {/* Start Fresh Button - Secondary */}
                    <AlertDialogCancel asChild>
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={onStartFresh}
                            disabled={isLoading}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Start Fresh
                        </Button>
                    </AlertDialogCancel>

                    {/* Continue Button - Primary */}
                    <AlertDialogAction asChild>
                        <Button
                            variant="default"
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                            onClick={onContinue}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Continue
                                </>
                            )}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default DraftRestoreDialog;