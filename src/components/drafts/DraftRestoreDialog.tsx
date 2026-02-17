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
            <AlertDialogContent className="sm:max-w-[500px] glass-card border-white/10 p-0 overflow-hidden">
                {/* Header with Icon */}
                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 p-6 border-b border-blue-500/20">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/20 border-2 border-blue-500/30">
                            <FileText className="h-6 w-6 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <AlertDialogTitle className="text-xl font-semibold text-white mb-2">
                                {title}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400 text-sm leading-relaxed">
                                {description || defaultDescription}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 bg-gradient-to-br from-[#3B3C3E]/60 to-[#1A1A1C]/80">
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        {/* Start Fresh Button - Secondary */}
                        <AlertDialogCancel asChild>
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto border-white/20 text-gray-300 hover:bg-white/5 hover:text-white hover:border-white/30"
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
                                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-lg shadow-blue-500/25"
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
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default DraftRestoreDialog;