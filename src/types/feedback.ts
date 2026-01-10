// Shared TypeScript types for feedback feature

export type FeedbackCategory = "General" | "Bug" | "Feature" | "Billing";
export type FeedbackStatus = "new" | "reviewed" | "actioned";

export interface Feedback {
  id: string;
  created_at: string;
  rating: number;
  category: FeedbackCategory;
  message: string;
  page_url: string | null;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  status: FeedbackStatus;
  admin_notes: string | null;
}

export interface CreateFeedbackRequest {
  rating: number;
  category: FeedbackCategory;
  message: string;
  pageUrl?: string;
}

export interface UpdateFeedbackRequest {
  status?: FeedbackStatus;
  adminNotes?: string;
}

// Legacy localStorage type (for fallback compatibility)
export interface FeedbackSubmission {
  id: string;
  createdAt: string;
  rating: number;
  category: FeedbackCategory;
  message: string;
  pageUrl: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
}
