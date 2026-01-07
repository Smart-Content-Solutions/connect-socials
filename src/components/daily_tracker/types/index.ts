// Task Management Types - aligned with database schema
import { Tables } from "@/integrations/supabase/types";

export type TaskStatus = "To Do" | "In Progress" | "Blocked" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";
export type Assignee = "Sarah" | "Michael" | "Alex" | "Jordan" | "Unassigned";

export const TASK_STATUSES: TaskStatus[] = ["To Do", "In Progress", "Blocked", "Done"];
export const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Critical"];
export const ASSIGNEES: Assignee[] = ["Sarah", "Michael", "Alex", "Jordan", "Unassigned"];

// Database row types
export type DbTask = Tables<"tasks">;
export type DbDailyTaskNote = Tables<"daily_task_notes">;
export type DbDailyTaskNoteAttachment = Tables<"daily_task_note_attachments">;

// App-level Task interface (compatible with both local and DB data)
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: Assignee;
  dueDate?: Date;
  completedDate?: Date;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyTaskNote {
  id: string;
  taskId: string;
  date: string;
  userId?: string;
  notesText: string;
  timeSpentMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyTaskNoteAttachment {
  id: string;
  dailyTaskNoteId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  createdAt: Date;
}

export interface TaskFilters {
  status?: TaskStatus | "All";
  priority?: TaskPriority | "All";
  assignee?: Assignee | "All";
}

// Helper to convert DB row to app Task
export function dbTaskToTask(dbTask: DbTask): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || "",
    status: dbTask.status as TaskStatus,
    priority: dbTask.priority as TaskPriority,
    assignee: dbTask.assignee as Assignee,
    dueDate: dbTask.due_date ? new Date(dbTask.due_date) : undefined,
    completedDate: dbTask.completed_date ? new Date(dbTask.completed_date) : undefined,
    comments: dbTask.comments || undefined,
    createdAt: new Date(dbTask.created_at),
    updatedAt: new Date(dbTask.updated_at),
  };
}
