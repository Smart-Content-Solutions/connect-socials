import { TaskFilters, TASK_STATUSES, TASK_PRIORITIES, ASSIGNEES, TaskStatus, TaskPriority, Assignee } from "../types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LayoutGrid, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskViewTab = "all" | "completed";

interface TasksFilterBarProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  activeTab: TaskViewTab;
  onTabChange: (tab: TaskViewTab) => void;
}

export function TasksFilterBar({
  filters,
  onFiltersChange,
  activeTab,
  onTabChange,
}: TasksFilterBarProps) {
  // Get available statuses based on active tab
  const availableStatuses = activeTab === "completed"
    ? ["Done" as TaskStatus]
    : TASK_STATUSES.filter(s => s !== "Done");

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Notion-style Tab Switcher */}
      <div className="flex items-center bg-surface rounded-lg p-1 border border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTabChange("all")}
          className={cn(
            "h-8 px-4 rounded-md transition-all duration-200",
            activeTab === "all"
              ? "bg-gradient-to-r from-amber-400/20 to-yellow-500/20 text-amber-400 font-medium shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid className="w-4 h-4 mr-2" />
          All Tasks
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTabChange("completed")}
          className={cn(
            "h-8 px-4 rounded-md transition-all duration-200",
            activeTab === "completed"
              ? "bg-gradient-to-r from-green-400/20 to-emerald-500/20 text-green-400 font-medium shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Completed Tasks
        </Button>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border/50" />

      {/* Assignee Filter */}
      <Select
        value={filters.assignee || "All"}
        onValueChange={(value) => onFiltersChange({ ...filters, assignee: value as Assignee | "All" })}
      >
        <SelectTrigger className="w-[140px] bg-surface border-border/50">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent className="planner-theme">
          <SelectItem value="All">All Assignees</SelectItem>
          {ASSIGNEES.map((assignee) => (
            <SelectItem key={assignee} value={assignee}>
              {assignee}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter - Only show non-Done statuses in "All Tasks" tab */}
      {activeTab === "all" && (
        <Select
          value={filters.status || "All"}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value as TaskStatus | "All" })}
        >
          <SelectTrigger className="w-[140px] bg-surface border-border/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="planner-theme">
            <SelectItem value="All">All Statuses</SelectItem>
            {availableStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Priority Filter */}
      <Select
        value={filters.priority || "All"}
        onValueChange={(value) => onFiltersChange({ ...filters, priority: value as TaskPriority | "All" })}
      >
        <SelectTrigger className="w-[140px] bg-surface border-border/50">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent className="planner-theme">
          <SelectItem value="All">All Priorities</SelectItem>
          {TASK_PRIORITIES.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {priority}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
