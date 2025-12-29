import { useState, useEffect } from "react";
import { Task, TaskStatus, TaskPriority, Assignee, TASK_STATUSES, TASK_PRIORITIES, ASSIGNEES } from "../types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Clock, User, Trash2, Paperclip, Maximize2, Minimize2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TaskRichEditor } from "./TaskRichEditor";
import { TaskAttachments } from "./TaskAttachments";

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask?: (id: string) => void;
  initialFullscreen?: boolean;
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

export function TaskDetailDrawer({ task, open, onClose, onUpdateTask, onDeleteTask, initialFullscreen = false }: TaskDetailDrawerProps) {
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);

  useEffect(() => {
    setIsFullscreen(initialFullscreen);
  }, [initialFullscreen]);

  if (!task) return null;

  const handleDelete = () => {
    if (onDeleteTask) {
      onDeleteTask(task.id);
    }
  };

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
        <Input
          value={task.title}
          onChange={(e) => onUpdateTask(task.id, { title: e.target.value })}
          className="bg-surface border-border/50"
        />
      </div>

      {/* Rich Description */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-2 block">
          Description
          <span className="text-xs text-muted-foreground ml-2">(supports checklists, toggles, code)</span>
        </Label>
        <TaskRichEditor
          value={task.description}
          onChange={(value) => onUpdateTask(task.id, { description: value })}
          placeholder="Add description with rich formatting..."
        />
      </div>

      <Separator className="bg-border/50" />

      {/* Status & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">Status</Label>
          <Select
            value={task.status}
            onValueChange={(value) => onUpdateTask(task.id, { status: value as TaskStatus })}
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
        </div>
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">Priority</Label>
          <Select
            value={task.priority}
            onValueChange={(value) => onUpdateTask(task.id, { priority: value as TaskPriority })}
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
        </div>
      </div>

      {/* Assignee & Due Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            <User className="w-4 h-4 inline mr-1" />
            Assignee
          </Label>
          <Select
            value={task.assignee}
            onValueChange={(value) => onUpdateTask(task.id, { assignee: value as Assignee })}
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
        </div>
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            <CalendarIcon className="w-4 h-4 inline mr-1" />
            Due Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal bg-surface border-border/50"
              >
                {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "Set date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.dueDate ? new Date(task.dueDate) : undefined}
                onSelect={(date) => onUpdateTask(task.id, { dueDate: date })}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Attachments */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-2 block">
          <Paperclip className="w-4 h-4 inline mr-1" />
          Attachments
        </Label>
        <TaskAttachments taskId={task.id} />
      </div>

      <Separator className="bg-border/50" />

      {/* Comments */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-2 block">Comments / Notes</Label>
        <Textarea
          value={task.comments || ""}
          onChange={(e) => onUpdateTask(task.id, { comments: e.target.value })}
          placeholder="Add internal notes about this task..."
          className="bg-surface border-border/50 min-h-[100px] resize-none"
        />
      </div>

      <Separator className="bg-border/50" />

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

      {onDeleteTask && (
        <>
          <Separator className="bg-border/50" />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Task
          </Button>
        </>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
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
      <SheetContent className="w-[500px] sm:w-[550px] bg-card border-border overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>{headerContent}</SheetTitle>
        </SheetHeader>
        {formContent}
      </SheetContent>
    </Sheet>
  );
}