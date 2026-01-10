// Shared TypeScript types for tickets feature

export type TicketType = "support" | "bug" | "feature";
export type TicketStatus = "open" | "in_progress" | "waiting_on_customer" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketModule = "wordpress" | "social" | "billing" | "workspace" | "other" | null;

export interface Ticket {
  id: string;
  created_by: string;
  created_by_email: string | null;
  created_by_name: string | null;
  assigned_to_user_id: string | null;
  assigned_to_email: string | null;
  assigned_to_name: string | null;
  assigned_at: string | null;
  type: TicketType;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  module: TicketModule;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}

export interface CreateTicketRequest {
  type: TicketType;
  subject: string;
  description: string;
  priority?: TicketPriority;
  module?: TicketModule;
}

export interface UpdateTicketRequest {
  status?: TicketStatus;
  priority?: TicketPriority;
  module?: TicketModule;
  assignedToUserId?: string | null;
  assignedToEmail?: string | null;
  assignedToName?: string | null;
}

export type TicketCommentAuthorRole = "user" | "admin";

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_user_id: string;
  author_role: TicketCommentAuthorRole;
  body: string;
  created_at: string;
}

export interface CreateCommentRequest {
  body: string;
}

export interface TicketWithComments extends Ticket {
  comments?: TicketComment[];
}
