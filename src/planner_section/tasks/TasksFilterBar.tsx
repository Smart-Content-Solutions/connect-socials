import { TaskFilters, TASK_STATUSES, TASK_PRIORITIES, ASSIGNEES, TaskStatus, TaskPriority, Assignee } from "../types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface TasksFilterBarProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  showCompletedOnly: boolean;
  onShowCompletedToggle: () => void;
}

export function TasksFilterBar({
  filters,
  onFiltersChange,
  showCompletedOnly,
  onShowCompletedToggle,
}: TasksFilterBarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Assignee Filter */}
      <Select
        value={filters.assignee || "All"}
        onValueChange={(value) => onFiltersChange({ ...filters, assignee: value as Assignee | "All" })}
      >
        <SelectTrigger className="w-[140px] bg-surface border-border/50">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Assignees</SelectItem>
          {ASSIGNEES.map((assignee) => (
            <SelectItem key={assignee} value={assignee}>
              {assignee}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.status || "All"}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value as TaskStatus | "All" })}
      >
        <SelectTrigger className="w-[140px] bg-surface border-border/50">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Statuses</SelectItem>
          {TASK_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select
        value={filters.priority || "All"}
        onValueChange={(value) => onFiltersChange({ ...filters, priority: value as TaskPriority | "All" })}
      >
        <SelectTrigger className="w-[140px] bg-surface border-border/50">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Priorities</SelectItem>
          {TASK_PRIORITIES.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {priority}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Show Completed Toggle */}
      <Button
        variant={showCompletedOnly ? "default" : "outline"}
        size="sm"
        onClick={onShowCompletedToggle}
        className={showCompletedOnly ? "bg-primary text-primary-foreground" : "border-border/50"}
      >
        <CheckCircle2 className="w-4 h-4 mr-2" />
        View Completed
      </Button>
    </div>
  );
}
