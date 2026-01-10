// Server-side utility for sending ticket email notifications via n8n webhook
// This is a fire-and-forget operation - errors should not break ticket operations

type TicketEmailEvent = "ticket_created" | "user_replied" | "admin_replied" | "ticket_assigned";

interface TicketEmailPayload {
  event: TicketEmailEvent;
  ticket: {
    id: string;
    subject: string;
    type: string;
    status: string;
    priority: string;
    module: string | null;
    created_at: string;
    created_by: string;
    created_by_email: string | null;
    created_by_name: string | null;
    assigned_to_user_id: string | null;
    assigned_to_email: string | null;
    assigned_to_name: string | null;
  };
  comment?: {
    id: string;
    body: string;
    author_role: string;
    created_at: string;
  };
  recipients: {
    userEmail: string | null;
    supportEmail: string;
    assignedAdminEmail: string | null;
  };
  links: {
    userTicketUrl: string;
    adminTicketUrl: string;
  };
}

const BASE_URL = "https://www.smartcontentsolutions.co.uk";
const N8N_TIMEOUT_MS = 5000;

export async function sendTicketEmailEvent(
  event: TicketEmailEvent,
  ticket: any,
  comment?: any
): Promise<void> {
  const webhookUrl = process.env.N8N_TICKETS_WEBHOOK_URL;
  const supportEmail = process.env.SUPPORT_INBOX_EMAIL || "support@smartcontentsolutions.co.uk";

  if (!webhookUrl) {
    console.warn("[Ticket Email] N8N_TICKETS_WEBHOOK_URL not configured, skipping email notification");
    return;
  }

  try {
    const payload: TicketEmailPayload = {
      event,
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        type: ticket.type,
        status: ticket.status,
        priority: ticket.priority,
        module: ticket.module,
        created_at: ticket.created_at,
        created_by: ticket.created_by,
        created_by_email: ticket.created_by_email || null,
        created_by_name: ticket.created_by_name || null,
        assigned_to_user_id: ticket.assigned_to_user_id || null,
        assigned_to_email: ticket.assigned_to_email || null,
        assigned_to_name: ticket.assigned_to_name || null,
      },
      recipients: {
        userEmail: ticket.created_by_email || null,
        supportEmail,
        assignedAdminEmail: ticket.assigned_to_email || null,
      },
      links: {
        userTicketUrl: `${BASE_URL}/support/${ticket.id}`,
        adminTicketUrl: `${BASE_URL}/admin/tickets/${ticket.id}`,
      },
    };

    if (comment) {
      payload.comment = {
        id: comment.id,
        body: comment.body,
        author_role: comment.author_role,
        created_at: comment.created_at,
      };
    }

    // Fire and forget with timeout - don't block ticket operations
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const responseText = await response.text();
        console.error(`[Ticket Email] n8n webhook returned ${response.status}: ${responseText}`);
      } else {
        console.log(`[Ticket Email] Successfully sent ${event} event for ticket ${ticket.id}`);
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError") {
        // Timeout is OK - n8n received the request and is processing
        console.log(`[Ticket Email] n8n webhook request timed out (expected - processing in background) for ${event}`);
      } else {
        throw fetchError;
      }
    }
  } catch (error: any) {
    // Log error but don't throw - email failures should not break ticket operations
    console.error(`[Ticket Email] Failed to send ${event} event for ticket ${ticket.id}:`, error.message || error);
  }
}
