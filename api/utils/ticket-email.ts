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

  // Specific messages for user vs admin (for when both need to be notified)
  email_body_html_user?: string;
  email_body_html_admin?: string;
  email_subject_user?: string;
  email_subject_admin?: string;

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
const N8N_TIMEOUT_MS = 15000;

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
    console.log(`[Ticket Email] Preparing to send '${event}' event for ticket ${ticket.id}`);
    console.log(`[Ticket Email] Target Webhook URL: ${webhookUrl}`);

    const userTicketUrl = `${BASE_URL}/support/${ticket.id}`;
    const adminTicketUrl = `${BASE_URL}/admin/tickets/${ticket.id}`;

    // Generate context-aware email content
    let emailSubject = `Update on Ticket: ${ticket.subject}`;
    let emailBodyHtml = `<p>There is an update on your ticket.</p>`;

    let emailSubjectUser = emailSubject;
    let emailSubjectAdmin = emailSubject;
    let emailBodyUser = emailBodyHtml;
    let emailBodyAdmin = emailBodyHtml;

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

      emailSubjectUser = emailSubject;
      emailBodyUser = emailBodyHtml;

      emailSubjectAdmin = `New Ticket: ${ticket.subject}`;
      emailBodyAdmin = `
        <p><strong>New Ticket Created</strong></p>
        <p><strong>User:</strong> ${ticket.created_by_name || 'Unknown'} (${ticket.created_by_email || 'No email'})</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>Type:</strong> ${ticket.type} | <strong>Priority:</strong> ${ticket.priority}</p>
        <hr />
        <p><strong>Description:</strong></p>
        <p>${ticket.description}</p>
        <p><a href="${adminTicketUrl}">View in Admin Dashboard</a></p>
      `;

    } else if (event === "ticket_status_updated") {
      emailSubject = `Ticket Status Updated: ${ticket.subject}`;
      emailBodyHtml = `
        <p>Hi ${ticket.created_by_name || 'there'},</p>
        <p>The status of your ticket <strong>"${ticket.subject}"</strong> has been updated to <strong>${ticket.status.toUpperCase().replace(/_/g, " ")}</strong>.</p>
        <p><a href="${userTicketUrl}">View Ticket</a></p>
      `;

      emailSubjectUser = emailSubject;
      emailBodyUser = emailBodyHtml;

      emailSubjectAdmin = `Ticket Status Updated: ${ticket.subject}`;
      emailBodyAdmin = `
        <p>Ticket <strong>"${ticket.subject}"</strong> status changed to <strong>${ticket.status}</strong>.</p>
        <p><a href="${adminTicketUrl}">View in Admin Dashboard</a></p>
      `;

    } else if (event === "admin_replied") {
      // Logic for when ADMIN replies
      emailSubject = `New Reply: ${ticket.subject}`; // Default for user
      emailBodyHtml = `
        <p>Hi ${ticket.created_by_name || 'there'},</p>
        <p>Support has replied to your ticket:</p>
        <blockquote>${comment?.body || 'New comment'}</blockquote>
        <p><a href="${userTicketUrl}">Click here to reply</a></p>
      `;

      emailSubjectUser = emailSubject;
      emailBodyUser = emailBodyHtml;

      // Admin notification (Confirmation)
      emailSubjectAdmin = `Reply Sent: ${ticket.subject}`;
      emailBodyAdmin = `
        <p>A reply was sent to <strong>${ticket.created_by_name}</strong> regarding ticket <strong>"${ticket.subject}"</strong>.</p>
        <blockquote>${comment?.body || 'New comment'}</blockquote>
        <p><a href="${adminTicketUrl}">View in Admin Dashboard</a></p>
      `;

    } else if (event === "user_replied") {
      // Logic for when USER replies
      emailSubject = `User Replied: ${ticket.subject}`; // Default for admin (legacy)

      const adminBody = `
        <p>User <strong>${ticket.created_by_name}</strong> replied:</p>
        <blockquote>${comment?.body || 'New comment'}</blockquote>
        <p><a href="${adminTicketUrl}">View in Admin Dashboard</a></p>
      `;

      emailBodyHtml = adminBody; // Legacy support: Admin alert used this

      emailSubjectAdmin = `User Replied: ${ticket.subject}`;
      emailBodyAdmin = adminBody;

      // User notification (Confirmation)
      emailSubjectUser = `We received your reply: ${ticket.subject}`;
      emailBodyUser = `
        <p>Hi ${ticket.created_by_name || 'there'},</p>
        <p>We received your reply to ticket <strong>"${ticket.subject}"</strong>.</p>
        <blockquote>${comment?.body || 'New comment'}</blockquote>
        <p>Our team will get back to you shortly.</p>
        <p><a href="${userTicketUrl}">View Ticket</a></p>
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
      // New fields
      email_body_html_user: emailBodyUser,
      email_body_html_admin: emailBodyAdmin,
      email_subject_user: emailSubjectUser,
      email_subject_admin: emailSubjectAdmin,

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
      console.log(`[Ticket Email] Sending payload to n8n...`);
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
        console.log(`[Ticket Email] Successfully sent ${event} event. Status: ${response.status}`);
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError") {
        console.log(`[Ticket Email] n8n webhook request timed out (expected - processing in background) for ${event}`);
      } else {
        console.error(`[Ticket Email] Fetch error:`, fetchError);
        throw fetchError;
      }
    }
  } catch (error: any) {
    console.error(`[Ticket Email] Failed to send ${event} event for ticket ${ticket.id}:`, error.message || error);
  }
}
