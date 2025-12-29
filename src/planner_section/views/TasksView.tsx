import { useState, useMemo } from "react";
import { useTasks } from "../store/DataProvider";
import { Task, TaskFilters, TaskStatus, TaskPriority, Assignee } from "../types";
import { TasksFilterBar } from "../tasks/TasksFilterBar";
import { TasksTableView } from "../tasks/TasksTableView";
import { TasksKanbanView } from "../tasks/TasksKanbanView";
import { TaskDetailDrawer } from "../tasks/TaskDetailDrawer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, LayoutList, Kanban, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_PRIORITIES, ASSIGNEES } from "@/types";

type ViewMode = "table" | "kanban";

export function TasksView() {
  const { tasks, isLoading, updateTask, createTask, deleteTask, reorderTasks, searchQuery } = useTasks();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [filters, setFilters] = useState<TaskFilters>({});
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openFullscreen, setOpenFullscreen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "Medium" as TaskPriority,
    assignee: "Dominik" as Assignee,
  });

  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Apply global search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.assignee.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    if (showCompletedOnly) {
      result = result.filter((t) => t.status === "Done");
    }

    if (filters.assignee && filters.assignee !== "All") {
      result = result.filter((t) => t.assignee === filters.assignee);
    }
    if (filters.status && filters.status !== "All") {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters.priority && filters.priority !== "All") {
      result = result.filter((t) => t.priority === filters.priority);
    }

    return result;
  }, [tasks, filters, showCompletedOnly, searchQuery]);

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    await updateTask(id, updates);
    if (selectedTask?.id === id) {
      setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
    if (selectedTask?.id === id) {
      setSelectedTask(null);
      setIsDrawerOpen(false);
    }
  };

  const handleSelectTask = (task: Task, fullscreen = false) => {
    setSelectedTask(task);
    setOpenFullscreen(fullscreen);
    setIsDrawerOpen(true);
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    await createTask({
      title: newTask.title,
      description: newTask.description,
      status: "To Do",
      priority: newTask.priority,
      assignee: newTask.assignee,
    });
    setNewTask({
      title: "",
      description: "",
      priority: "Medium",
      assignee: "Dominik",
    });
    setIsNewTaskOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">Track and manage your team's work.</p>
        </div>
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gold-glow">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label className="text-foreground">Title</Label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Task title"
                  className="bg-surface border-border/50 mt-1"
                />
              </div>
              <div>
                <Label className="text-foreground">Description</Label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Task description"
                  className="bg-surface border-border/50 mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask((prev) => ({ ...prev, priority: value as TaskPriority }))}
                  >
                    <SelectTrigger className="bg-surface border-border/50 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground">Assignee</Label>
                  <Select
                    value={newTask.assignee}
                    onValueChange={(value) => setNewTask((prev) => ({ ...prev, assignee: value as Assignee }))}
                  >
                    <SelectTrigger className="bg-surface border-border/50 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNEES.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreateTask} className="w-full bg-primary text-primary-foreground">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Switcher & Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <TasksFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          showCompletedOnly={showCompletedOnly}
          onShowCompletedToggle={() => setShowCompletedOnly(!showCompletedOnly)}
        />
        <div className="flex items-center gap-1 bg-surface rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("table")}
            className={cn(
              "h-8",
              viewMode === "table" && "bg-primary/20 text-primary"
            )}
          >
            <LayoutList className="w-4 h-4 mr-2" />
            Table
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("kanban")}
            className={cn(
              "h-8",
              viewMode === "kanban" && "bg-primary/20 text-primary"
            )}
          >
            <Kanban className="w-4 h-4 mr-2" />
            Kanban
          </Button>
        </div>
      </div>

      {/* Views */}
      {viewMode === "table" ? (
        <TasksTableView
          tasks={filteredTasks}
          onUpdateTask={handleUpdateTask}
          onSelectTask={handleSelectTask}
          onDeleteTask={handleDeleteTask}
          onReorder={reorderTasks}
        />
      ) : (
        <TasksKanbanView
          tasks={filteredTasks}
          onUpdateTask={handleUpdateTask}
          onSelectTask={handleSelectTask}
        />
      )}

      {/* Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setOpenFullscreen(false);
        }}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        initialFullscreen={openFullscreen}
      />
    </div>
  );
}
