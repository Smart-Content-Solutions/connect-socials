import { Task, TaskPriority } from "./types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CompletedTaskRowProps {
  task: Task;
  onSelect: (task: Task, altKey: boolean) => void;
}

const priorityColors: Record<TaskPriority, string> = {
  Low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  Medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  High: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function CompletedTaskRow({ task, onSelect }: CompletedTaskRowProps) {
  const handleClick = (e: React.MouseEvent) => {
    onSelect(task, e.altKey);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start sm:items-center justify-between p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-200",
        "bg-surface/50 hover:bg-surface-hover border border-border/30",
        "hover:border-border/50 hover:shadow-lg hover:shadow-black/10 gap-2 sm:gap-4"
      )}
    >
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm sm:text-base text-foreground line-clamp-2 sm:truncate">{task.title}</h4>
        <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 text-xs sm:text-sm text-muted-foreground">
          <span className="text-foreground/70 truncate max-w-[80px] sm:max-w-none">{task.assignee}</span>
          <span className="text-muted-foreground/50 hidden sm:inline">•</span>
          <span className="hidden sm:inline">Updated {format(new Date(task.updatedAt), "MMM d")}</span>
        </div>
      </div>
      <Badge variant="outline" className={cn("rounded-lg text-xs shrink-0", priorityColors[task.priority])}>
        {task.priority}
      </Badge>
    </div>
  );
}
