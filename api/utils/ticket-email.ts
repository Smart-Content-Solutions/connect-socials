// Server-side utility for sending ticket email notifications via n8n webhook
// This is a fire-and-forget operation - errors should not break ticket operations

type TicketEmailEvent = "ticket_created" | "user_replied" | "admin_replied" | "ticket_assigned" | "ticket_status_updated";

interface TicketEmailPayload {
  event: TicketEmailEvent;
  ticket: {
    id: string;
    subject: string;
    description: string;
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
  // Pre-formatted messages to make n8n setup easier
  email_body_html: string;
  email_subject: string;
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
    const userTicketUrl = `${BASE_URL}/support/${ticket.id}`;
    const adminTicketUrl = `${BASE_URL}/admin/tickets/${ticket.id}`;

    // Generate context-aware email content
    let emailSubject = `Update on Ticket: ${ticket.subject}`;
    let emailBodyHtml = `<p>There is an update on your ticket.</p>`;

    if (event === "ticket_created") {
      emailSubject = `Ticket Received: ${ticket.subject}`;
      emailBodyHtml = `
        <p>Hi ${ticket.created_by_name || 'there'},</p>
        <p>We have received your ticket <strong>"${ticket.subject}"</strong>.</p>
        <p>Our team will review it shortly. You can view the status of your ticket here:</p>
        <p><a href="${userTicketUrl}">View Ticket</a></p>
        <hr />
        <p><strong>Description:</strong></p>
        <p>${ticket.description}</p>
      `;
    } else if (event === "ticket_status_updated") {
      emailSubject = `Ticket Status Updated: ${ticket.subject}`;
      emailBodyHtml = `
        <p>Hi ${ticket.created_by_name || 'there'},</p>
        <p>The status of your ticket <strong>"${ticket.subject}"</strong> has been updated to <strong>${ticket.status.toUpperCase().replace(/_/g, " ")}</strong>.</p>
        <p><a href="${userTicketUrl}">View Ticket</a></p>
      `;
    } else if (event === "admin_replied") {
      emailSubject = `New Reply: ${ticket.subject}`;
      emailBodyHtml = `
        <p>Hi ${ticket.created_by_name || 'there'},</p>
        <p>Support has replied to your ticket:</p>
        <blockquote>${comment?.body || 'New comment'}</blockquote>
        <p><a href="${userTicketUrl}">Click here to reply</a></p>
      `;
    } else if (event === "user_replied") {
      emailSubject = `User Replied: ${ticket.subject}`;
      emailBodyHtml = `
        <p>User <strong>${ticket.created_by_name}</strong> replied:</p>
        <blockquote>${comment?.body || 'New comment'}</blockquote>
        <p><a href="${adminTicketUrl}">View in Admin Dashboard</a></p>
      `;
    }

    const payload: TicketEmailPayload = {
      event,
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
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
      email_body_html: emailBodyHtml,
      email_subject: emailSubject,
      recipients: {
        userEmail: ticket.created_by_email || null,
        supportEmail,
        assignedAdminEmail: ticket.assigned_to_email || null,
      },
      links: {
        userTicketUrl,
        adminTicketUrl,
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
