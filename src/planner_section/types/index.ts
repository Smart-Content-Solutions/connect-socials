// Shared types for SCS Workspace

export interface DocPage {
  id: string;
  title: string;
  content: string; // HTML content from editor
  tags: DocTag[];
  createdBy: string;
  lastUpdated: Date;
  notes?: string;
}

export type DocTag = "Process" | "Instructions" | "Dev" | "Management" | "Other";

export const DOC_TAGS: DocTag[] = ["Process", "Instructions", "Dev", "Management", "Other"];

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: Assignee;
  dueDate?: Date;
  completedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  comments?: string;
  sortOrder?: number;
}

export type TaskStatus = "To Do" | "In Progress" | "Blocked" | "Done";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";
export type Assignee = "Dominik" | "Jason" | "Sub";

export const TASK_STATUSES: TaskStatus[] = ["To Do", "In Progress", "Blocked", "Done"];
export const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Critical"];
export const ASSIGNEES: Assignee[] = ["Dominik", "Jason", "Sub"];

export interface TaskFilters {
  assignee?: Assignee | "All";
  status?: TaskStatus | "All";
  priority?: TaskPriority | "All";
  showCompleted?: boolean;
}
