import { useState } from "react";
import { Task, TaskStatus, TaskPriority, TASK_STATUSES } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TasksKanbanViewProps {
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onSelectTask: (task: Task) => void;
}

const priorityColors: Record<TaskPriority, string> = {
  Low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  High: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const columnColors: Record<TaskStatus, string> = {
  "To Do": "border-t-slate-500",
  "In Progress": "border-t-blue-500",
  "Blocked": "border-t-red-500",
  "Done": "border-t-green-500",
};

export function TasksKanbanView({ tasks, onUpdateTask, onSelectTask }: TasksKanbanViewProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const getTasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      onUpdateTask(draggedTask.id, { status });
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  return (
    <div className="grid grid-cols-4 gap-4 h-[calc(100vh-14rem)]">
      {TASK_STATUSES.map((status) => (
        <div
          key={status}
          className={cn(
            "flex flex-col rounded-lg border-t-4 bg-card/50 transition-all",
            columnColors[status],
            dragOverColumn === status && "ring-2 ring-primary/50"
          )}
          onDragOver={(e) => handleDragOver(e, status)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, status)}
        >
          {/* Column Header */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground text-sm">{status}</h3>
              <Badge variant="secondary" className="text-xs">
                {getTasksByStatus(status).length}
              </Badge>
            </div>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {getTasksByStatus(status).map((task) => (
              <Card
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onClick={() => onSelectTask(task)}
                className={cn(
                  "p-3 cursor-grab active:cursor-grabbing bg-surface border-border/50",
                  "hover:border-primary/30 hover:shadow-md transition-all",
                  draggedTask?.id === task.id && "opacity-50"
                )}
              >
                <div className="flex items-start gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground mb-2 line-clamp-2">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0", priorityColors[task.priority])}
                      >
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.dueDate), "MMM d")}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Avatar className="w-5 h-5 border border-border">
                        <AvatarFallback className="text-[10px] bg-muted">
                          {task.assignee[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
