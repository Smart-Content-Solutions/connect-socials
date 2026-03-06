export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType: "ticket" | "feedback";
  entityId: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  targetPath: string;
}

export interface AdminNotificationsResponse {
  notifications: AdminNotification[];
  unreadCount: number;
}
