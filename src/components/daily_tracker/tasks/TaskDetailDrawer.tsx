import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { Task, TaskStatus, TaskPriority, TASK_STATUSES, TASK_PRIORITIES, ASSIGNEES, Assignee } from "../types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, User, Maximize2, Minimize2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DailyNotesSection } from "../DailyNotesSection";

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUpdateTask?: (id: string, updates: Partial<Task>) => void;
  initialFullscreen?: boolean;
  readOnly?: boolean;
  // New: for Daily Tracker context
  selectedDate?: Date;
  showDailyNotes?: boolean;
}

const priorityColors: Record<TaskPriority, string> = {
  Low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  High: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusColors: Record<TaskStatus, string> = {
  "To Do": "bg-slate-500/20 text-slate-400 border-slate-500/30",
  "In Progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Blocked": "bg-red-500/20 text-red-400 border-red-500/30",
  "Done": "bg-green-500/20 text-green-400 border-green-500/30",
};

export function TaskDetailDrawer({
  task,
  open,
  onClose,
  onUpdateTask,
  initialFullscreen = false,
  readOnly = false,
  selectedDate,
  showDailyNotes = false,
}: TaskDetailDrawerProps) {
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);

  useEffect(() => {
    setIsFullscreen(initialFullscreen);
  }, [initialFullscreen]);

  if (!task) return null;

  const handleClose = () => {
    setIsFullscreen(false);
    onClose();
  };

  const headerContent = (
    <div className="flex items-center justify-between w-full">
      <span className="text-foreground">Task Details</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="h-8 w-8"
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  const formContent = (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-2 block">Title</Label>
        <div className="bg-surface border border-border/50 rounded-md px-3 py-2 text-foreground">
          {task.title}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">Description</Label>
          <div
            className="bg-surface border border-border/50 rounded-md px-3 py-2 text-foreground min-h-[80px] prose prose-invert max-w-none prose-sm overflow-hidden"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(task.description) }}
          />
        </div>
      )}

      <Separator className="bg-border/50" />

      {/* Status & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">Status</Label>
          {readOnly ? (
            <Badge variant="outline" className={cn(statusColors[task.status])}>
              {task.status}
            </Badge>
          ) : (
            <Select
              value={task.status}
              onValueChange={(value) => onUpdateTask?.(task.id, { status: value as TaskStatus })}
            >
              <SelectTrigger className="bg-surface border-border/50">
                <Badge variant="outline" className={cn(statusColors[task.status])}>
                  {task.status}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">Priority</Label>
          {readOnly ? (
            <Badge variant="outline" className={cn(priorityColors[task.priority])}>
              {task.priority}
            </Badge>
          ) : (
            <Select
              value={task.priority}
              onValueChange={(value) => onUpdateTask?.(task.id, { priority: value as TaskPriority })}
            >
              <SelectTrigger className="bg-surface border-border/50">
                <Badge variant="outline" className={cn(priorityColors[task.priority])}>
                  {task.priority}
                </Badge>
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Assignee & Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            <User className="w-4 h-4 inline mr-1" />
            Assignee
          </Label>
          {readOnly ? (
            <div className="bg-surface border border-border/50 rounded-md px-3 py-2 text-foreground text-sm">
              {task.assignee}
            </div>
          ) : (
            <Select
              value={task.assignee}
              onValueChange={(value) => onUpdateTask?.(task.id, { assignee: value as Assignee })}
            >
              <SelectTrigger className="bg-surface border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNEES.map((assignee) => (
                  <SelectItem key={assignee} value={assignee}>
                    {assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            <CalendarIcon className="w-4 h-4 inline mr-1" />
            Completed Date
          </Label>
          <div className="bg-surface border border-border/50 rounded-md px-3 py-2 text-foreground text-sm">
            {task.completedDate ? format(new Date(task.completedDate), "MMM d, yyyy") : "Not completed"}
          </div>
        </div>
      </div>

      {task.dueDate && (
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            <CalendarIcon className="w-4 h-4 inline mr-1" />
            Due Date
          </Label>
          <div className="bg-surface border border-border/50 rounded-md px-3 py-2 text-foreground text-sm">
            {format(new Date(task.dueDate), "MMM d, yyyy")}
          </div>
        </div>
      )}

      <Separator className="bg-border/50" />

      {/* Comments */}
      {task.comments && (
        <>
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">Comments / Notes</Label>
            <div
              className="bg-surface border border-border/50 rounded-md px-3 py-2 text-foreground min-h-[60px] prose prose-invert max-w-none prose-sm overflow-hidden"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(task.comments) }}
            />
          </div>
          <Separator className="bg-border/50" />
        </>
      )}

      {/* Timestamps */}
      <div className="text-sm text-muted-foreground space-y-1">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Created: {format(new Date(task.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Updated: {format(new Date(task.updatedAt), "MMM d, yyyy 'at' h:mm a")}</span>
        </div>
      </div>

      {/* Daily Notes Section - Only shown when opened from Daily Tracker */}
      {showDailyNotes && selectedDate && (
        <>
          <Separator className="bg-border/50" />
          <div className="pt-2">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-400 mb-4">
                📅 Completed Notes for {format(selectedDate, "MMMM d, yyyy")}
              </h3>
              <DailyNotesSection taskId={task.id} selectedDate={selectedDate} />
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[hsl(240,5%,10%)] border-[hsl(240,5%,18%)] text-[hsl(0,0%,95%)] planner-theme">
          <DialogHeader className="pb-4">
            <DialogTitle>{headerContent}</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-[500px] sm:w-[600px] bg-[hsl(240,5%,10%)] border-[hsl(240,5%,18%)] text-[hsl(0,0%,95%)] overflow-y-auto planner-theme">
        <SheetHeader className="pb-4">
          <SheetTitle>{headerContent}</SheetTitle>
        </SheetHeader>
        {formContent}
      </SheetContent>
    </Sheet>
  );
}
