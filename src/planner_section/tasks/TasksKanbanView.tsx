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
    <div className="grid grid-cols-4 gap-4 h-[calc(100vh-16rem)] min-h-[500px]">
      {TASK_STATUSES.map((status) => (
        <div
          key={status}
          className={cn(
            "flex flex-col rounded-xl border border-border/50 bg-card/30 transition-all overflow-hidden",
            dragOverColumn === status && "ring-2 ring-primary/50 bg-primary/5"
          )}
          onDragOver={(e) => handleDragOver(e, status)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, status)}
        >
          {/* Sticky Column Header */}
          <div className={cn(
            "p-3 border-b border-border sticky top-0 z-10 bg-card/90 backdrop-blur-md flex-shrink-0",
            "border-t-4",
            columnColors[status]
          )}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                {status}
                <span className="text-[10px] py-0.5 px-1.5 rounded-full bg-muted text-muted-foreground font-normal">
                  {getTasksByStatus(status).length}
                </span>
              </h3>
            </div>
          </div>

          {/* Scrollable Container for Cards */}
          <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
            {getTasksByStatus(status).map((task) => (
              <Card
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onClick={() => onSelectTask(task)}
                className={cn(
                  "p-3 cursor-grab active:cursor-grabbing bg-surface border-border/50",
                  "hover:border-primary/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200",
                  draggedTask?.id === task.id && "opacity-30 grayscale-[50%]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    <GripVertical className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground mb-2 leading-snug break-words">
                      {task.title}
                    </h4>
                    
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-2 py-0 border font-medium", priorityColors[task.priority])}
                      >
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(task.dueDate), "MMM d")}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-border/30 pt-2 mt-2">
                      <Avatar className="w-6 h-6 border border-border/50 shadow-sm">
                        <AvatarFallback className="text-[10px] bg-muted font-bold text-muted-foreground">
                          {task.assignee ? task.assignee[0] : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex -space-x-1">
                        <span className="text-[10px] text-muted-foreground italic opacity-30">#SCS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            {/* Empty state visual */}
            {getTasksByStatus(status).length === 0 && (
              <div className="h-20 border-2 border-dashed border-border/20 rounded-lg flex items-center justify-center m-1">
                <p className="text-xs text-muted-foreground/40 italic">Drop tasks here</p>
              </div>
            )}
            
            {/* Bottom Spacer to ensure full scrollability visibility */}
            <div className="h-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

