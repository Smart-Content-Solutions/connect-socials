import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task, TaskStatus, TaskPriority } from "../types";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortableTaskRow } from "./SortableTaskRow";

interface TasksTableViewProps {
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onSelectTask: (task: Task, fullscreen?: boolean) => void;
  onDeleteTask?: (id: string) => void;
  onReorder?: (orderedIds: string[]) => void;
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

export function TasksTableView({ tasks, onUpdateTask, onSelectTask, onDeleteTask, onReorder }: TasksTableViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorder) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);

      const newOrder = [...tasks];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);

      onReorder(newOrder.map((t) => t.id));
    }
  }, [tasks, onReorder]);

  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-surface hover:bg-surface">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="text-foreground font-medium">Title</TableHead>
              <TableHead className="text-foreground font-medium w-[140px]">Status</TableHead>
              <TableHead className="text-foreground font-medium w-[140px]">Priority</TableHead>
              <TableHead className="text-foreground font-medium w-[130px]">Assignee</TableHead>
              <TableHead className="text-foreground font-medium w-[140px]">Due Date</TableHead>
              <TableHead className="text-foreground font-medium w-[140px]">Completed Date</TableHead>
              <TableHead className="text-foreground font-medium w-[60px]">Files</TableHead>
              <TableHead className="text-foreground font-medium w-[120px]">Updated</TableHead>
              {onDeleteTask && <TableHead className="text-foreground font-medium w-[60px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <td colSpan={onDeleteTask ? 10 : 9} className="text-center py-8 text-muted-foreground">
                  No tasks found
                </td>
              </TableRow>
            ) : (
              <SortableContext
                items={tasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {tasks.map((task) => (
                  <SortableTaskRow
                    key={task.id}
                    task={task}
                    onUpdateTask={onUpdateTask}
                    onSelectTask={onSelectTask}
                    onDeleteTask={onDeleteTask}
                    priorityColors={priorityColors}
                    statusColors={statusColors}
                  />
                ))}
              </SortableContext>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </div>
  );
}