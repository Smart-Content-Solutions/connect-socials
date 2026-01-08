import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, TaskStatus, TaskPriority, Assignee, TASK_STATUSES, TASK_PRIORITIES, ASSIGNEES } from "../types";
import { TableCell, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Trash2, GripVertical, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { TaskAttachments } from "../tasks/TaskAttachments";

interface SortableTaskRowProps {
  task: Task;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onSelectTask: (task: Task, fullscreen?: boolean) => void;
  onDeleteTask?: (id: string) => void;
  priorityColors: Record<TaskPriority, string>;
  statusColors: Record<TaskStatus, string>;
}

export function SortableTaskRow({
  task,
  onUpdateTask,
  onSelectTask,
  onDeleteTask,
  priorityColors,
  statusColors,
}: SortableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer hover:bg-surface-hover transition-colors",
        isDragging && "bg-surface-hover shadow-lg"
      )}
      onClick={(e) => onSelectTask(task, e.altKey)}
    >
      {/* Drag handle */}
      <TableCell className="w-[40px] p-2" onClick={(e) => e.stopPropagation()}>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-surface rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>

      <TableCell className="font-medium text-foreground">{task.title}</TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <Select
          value={task.status}
          onValueChange={(value) => onUpdateTask(task.id, { status: value as TaskStatus })}
        >
          <SelectTrigger className="h-8 bg-transparent border-0 p-0">
            <Badge variant="outline" className={cn("cursor-pointer", statusColors[task.status])}>
              {task.status}
            </Badge>
          </SelectTrigger>
          <SelectContent className="planner-theme">
            {TASK_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <Select
          value={task.priority}
          onValueChange={(value) => onUpdateTask(task.id, { priority: value as TaskPriority })}
        >
          <SelectTrigger className="h-8 bg-transparent border-0 p-0">
            <Badge variant="outline" className={cn("cursor-pointer", priorityColors[task.priority])}>
              {task.priority}
            </Badge>
          </SelectTrigger>
          <SelectContent className="planner-theme">
            {TASK_PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {priority}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <Select
          value={task.assignee}
          onValueChange={(value) => onUpdateTask(task.id, { assignee: value as Assignee })}
        >
          <SelectTrigger className="h-8 w-[110px] bg-surface border-border/50 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="planner-theme">
            {ASSIGNEES.map((assignee) => (
              <SelectItem key={assignee} value={assignee}>
                {assignee}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full justify-start text-left font-normal bg-surface border-border/50 text-xs"
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "Set date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="planner-theme w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={task.dueDate ? new Date(task.dueDate) : undefined}
              onSelect={(date) => onUpdateTask(task.id, { dueDate: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 w-full justify-start text-left font-normal bg-surface border-border/50 text-xs",
                task.status !== "Done" && "opacity-50 cursor-not-allowed"
              )}
              disabled={task.status !== "Done"}
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {task.completedDate ? format(new Date(task.completedDate), "MMM d, yyyy") : "Not set"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={task.completedDate ? new Date(task.completedDate) : undefined}
              onSelect={(date) => onUpdateTask(task.id, { completedDate: date })}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <TaskAttachments taskId={task.id} compact />
      </TableCell>

      <TableCell className="text-muted-foreground text-sm">
        {format(new Date(task.updatedAt), "MMM d")}
      </TableCell>

      {onDeleteTask && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteTask(task.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}