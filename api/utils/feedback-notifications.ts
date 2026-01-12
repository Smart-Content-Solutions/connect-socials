// Server-side utility for sending feedback notifications via n8n webhook
// This is a fire-and-forget operation - errors should not break feedback operations

type FeedbackEvent = "feedback_submitted";

interface FeedbackPayload {
  event: FeedbackEvent;
  feedback: {
    id: string;
    rating: number;
    category: string;
    message: string;
    page_url: string | null;
    user_id: string;
    user_email: string | null;
    user_name: string | null;
    created_at: string;
  };
  recipients: {
    supportEmail: string;
  };
  links: {
    adminFeedbackUrl: string;
  };
}

const BASE_URL = "https://www.smartcontentsolutions.co.uk";
const N8N_TIMEOUT_MS = 5000;

export async function sendFeedbackNotification(
  feedback: any
): Promise<void> {
  const webhookUrl = process.env.N8N_FEEDBACK_WEBHOOK_URL;
  const supportEmail = process.env.SUPPORT_INBOX_EMAIL || "support@smartcontentsolutions.co.uk";

  if (!webhookUrl) {
    console.warn("[Feedback Notification] N8N_FEEDBACK_WEBHOOK_URL not configured, skipping notification");
    return;
  }

  try {
    const payload: FeedbackPayload = {
      event: "feedback_submitted",
      feedback: {
        id: feedback.id,
        rating: feedback.rating,
        category: feedback.category,
        message: feedback.message,
        page_url: feedback.page_url,
        user_id: feedback.user_id,
        user_email: feedback.user_email,
        user_name: feedback.user_name,
        created_at: feedback.created_at,
      },
      recipients: {
        supportEmail,
      },
      links: {
        adminFeedbackUrl: `${BASE_URL}/admin/feedback`,
      },
    };

    // Fire and forget with timeout
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
        console.error(`[Feedback Notification] n8n webhook returned ${response.status}: ${responseText}`);
      } else {
        console.log(`[Feedback Notification] Successfully sent feedback notification for ${feedback.id}`);
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === "AbortError") {
        console.log(`[Feedback Notification] n8n webhook request timed out (expected - processing in background)`);
      } else {
        throw fetchError;
      }
    }
  } catch (error: any) {
    console.error(`[Feedback Notification] Failed to send notification for ${feedback.id}:`, error.message || error);
  }
}
