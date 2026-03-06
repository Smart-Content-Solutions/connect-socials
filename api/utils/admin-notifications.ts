import { clerkClient } from "@clerk/clerk-sdk-node";
import type { SupabaseClient } from "@supabase/supabase-js";

type NotificationEntityType = "ticket" | "feedback";

interface AdminNotificationInput {
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  entityType: NotificationEntityType;
  entityId: string;
  metadata?: Record<string, unknown>;
}

interface StaffRecipient {
  userId: string;
  role: "admin" | "staff";
}

interface ClerkUserSummary {
  id: string;
  publicMetadata?: {
    role?: string;
    base_tier?: string;
  };
}

const MAX_CLERK_USERS_TO_SCAN = 200;

export async function getAdminAndStaffRecipients(): Promise<StaffRecipient[]> {
  const usersResponse = await clerkClient.users.getUserList({ limit: MAX_CLERK_USERS_TO_SCAN });
  const users = (
    Array.isArray(usersResponse)
      ? usersResponse
      : ((usersResponse as { data?: ClerkUserSummary[] }).data ?? [])
  ) as ClerkUserSummary[];

  const recipients = users
    .map((u) => {
      const role = u.publicMetadata?.role || null;
      const baseTier = u.publicMetadata?.base_tier || null;

      if (role === "admin" || baseTier === "admin") {
        return { userId: u.id, role: "admin" as const };
      }

      if (role === "staff" || baseTier === "staff") {
        return { userId: u.id, role: "staff" as const };
      }

      return null;
    })
    .filter(Boolean) as StaffRecipient[];

  // Dedupe by userId in case of any upstream duplication.
  return Array.from(new Map(recipients.map((r) => [r.userId, r])).values());
}

export async function createAdminNotification(supabase: SupabaseClient, input: AdminNotificationInput): Promise<void> {
  const { error } = await supabase.from("admin_notifications").insert({
    recipient_user_id: input.recipientUserId,
    type: input.type,
    title: input.title,
    message: input.message,
    entity_type: input.entityType,
    entity_id: input.entityId,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(error.message || "Failed to create admin notification");
  }
}

export async function createNotificationsForAdmins(
  supabase: SupabaseClient,
  input: Omit<AdminNotificationInput, "recipientUserId">,
  options?: { excludeUserId?: string }
): Promise<void> {
  const recipients = await getAdminAndStaffRecipients();
  const rows = recipients
    .filter((recipient) => recipient.userId !== options?.excludeUserId)
    .map((recipient) => ({
      recipient_user_id: recipient.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      entity_type: input.entityType,
      entity_id: input.entityId,
      metadata: input.metadata ?? {},
    }));

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from("admin_notifications").insert(rows);
  if (error) {
    throw new Error(error.message || "Failed to create admin notifications");
  }
}
