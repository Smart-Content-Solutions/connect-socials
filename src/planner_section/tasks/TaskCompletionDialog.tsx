import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface TaskCompletionDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (completedDate: Date) => void;
    taskTitle: string;
}

export function TaskCompletionDialog({
    open,
    onClose,
    onConfirm,
    taskTitle,
}: TaskCompletionDialogProps) {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showCalendar, setShowCalendar] = useState(false);

    const handleConfirm = () => {
        onConfirm(selectedDate);
        setShowCalendar(false);
        onClose();
    };

    const handleSelectToday = () => {
        setSelectedDate(new Date());
        onConfirm(new Date());
        setShowCalendar(false);
        onClose();
    };

    const handleCancel = () => {
        setShowCalendar(false);
        setSelectedDate(new Date());
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleCancel}>
            <DialogContent className="planner-theme bg-card border-border sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Task Completed!</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        When did you complete "{taskTitle}"?
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {!showCalendar ? (
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleSelectToday}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                Today ({format(new Date(), "MMM d, yyyy")})
                            </Button>
                            <Button
                                onClick={() => setShowCalendar(true)}
                                variant="outline"
                                className="w-full bg-surface border-border/50 hover:bg-surface-hover"
                            >
                                Choose Date
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                initialFocus
                                className="rounded-md border border-border"
                                disabled={(date) => date > new Date()}
                            />
                            <div className="mt-4 w-full flex gap-2">
                                <Button
                                    onClick={() => setShowCalendar(false)}
                                    variant="outline"
                                    className="flex-1 bg-surface border-border/50"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleConfirm}
                                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    Confirm ({format(selectedDate, "MMM d")})
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {!showCalendar && (
                    <DialogFooter>
                        <Button
                            onClick={handleCancel}
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
