import Stripe from "stripe";
import { createClerkClient } from "@clerk/backend";
import nodemailer from "nodemailer";
import { getSubscriptionConfirmationEmail } from "./emails/subscription-confirmation.js";
import { getSubscriptionCancellationEmail } from "./emails/subscription-cancellation.js";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Helper function to create email transporter only when needed
function getEmailTransporter() {
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// IMPORTANT: Stripe webhook signature verification needs the RAW body
export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function neverDowngradeAdmin(currentRole?: string) {
  return currentRole === "admin";
}

export default async function handler(req: any, res: any) {
  // Browser visits are GET — webhook must be POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey) return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
  if (!webhookSecret) return res.status(500).json({ error: "Missing STRIPE_WEBHOOK_SECRET" });

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

  let event: Stripe.Event;

  try {
    const rawBody = await readRawBody(req);
    const sig = req.headers["stripe-signature"];

    if (!sig || typeof sig !== "string") {
      return res.status(400).json({ error: "Missing Stripe-Signature header" });
    }

    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err?.message || err);
    return res.status(400).send(`Webhook Error: ${err?.message || "Invalid signature"}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const clerkUserId =
        (session.metadata?.clerkUserId as string | undefined) ||
        (session.client_reference_id as string | undefined);

      if (!clerkUserId) {
        console.warn("checkout.session.completed: missing clerkUserId");
        return res.status(200).json({ received: true });
      }

      const user = await clerkClient.users.getUser(clerkUserId);
      const currentRole = (user.publicMetadata as any)?.role as string | undefined;

      if (!neverDowngradeAdmin(currentRole)) {
        await clerkClient.users.updateUser(clerkUserId, {
          publicMetadata: {
            ...(user.publicMetadata || {}),
            role: "early_access",
            stripeCustomerId: session.customer as string,
            subscriptionId: session.subscription as string,
            planName: session.metadata?.planName || "Early Access",
            subscriptionStatus: "active",
          },
        });
        console.log(`Granted early_access to ${clerkUserId}`);

        // Send confirmation email (only if SMTP is configured)
        try {
          if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            const userEmail = user.emailAddresses.find((e: any) => e.id === user.primaryEmailAddressId)?.emailAddress;

            if (userEmail) {
              const emailData = getSubscriptionConfirmationEmail({
                userName: user.firstName || user.username || 'there',
                planName: session.metadata?.planName || "Early Access Plan",
                trialDays: session.mode === 'subscription' && session.payment_status === 'no_payment_required' ? 3 : undefined,
              });

              const transporter = getEmailTransporter();
              await transporter.sendMail({
                from: process.env.SMTP_FROM || 'Smart Content Solutions <noreply@smartcontentsolutions.co.uk>',
                to: userEmail,
                subject: emailData.subject,
                html: emailData.html,
              });

              console.log(`Confirmation email sent to ${userEmail}`);
            }
          } else {
            console.log('[Webhook] SMTP not configured, skipping confirmation email');
          }
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
          // Don't fail the webhook if email fails
        }
      }

      return res.status(200).json({ received: true });
    }

    if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const clerkUserId = (sub.metadata?.clerkUserId as string | undefined) || undefined;

      if (!clerkUserId) {
        console.warn("customer.subscription.deleted: missing clerkUserId");
        return res.status(200).json({ received: true });
      }

      const user = await clerkClient.users.getUser(clerkUserId);
      const currentRole = (user.publicMetadata as any)?.role as string | undefined;

      if (!neverDowngradeAdmin(currentRole)) {
        await clerkClient.users.updateUser(clerkUserId, {
          publicMetadata: {
            ...(user.publicMetadata || {}),
            role: "user",
          },
        });
        console.log(`Revoked early_access for ${clerkUserId}`);

        // Send cancellation email (only if SMTP is configured)
        try {
          if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            const userEmail = user.emailAddresses.find((e: any) => e.id === user.primaryEmailAddressId)?.emailAddress;

            if (userEmail) {
              const emailData = getSubscriptionCancellationEmail({
                userName: user.firstName || user.username || 'there',
                planName: (user.publicMetadata as any)?.planName || "Early Access Plan",
              });

              const transporter = getEmailTransporter();
              await transporter.sendMail({
                from: process.env.SMTP_FROM || 'Smart Content Solutions <noreply@smartcontentsolutions.co.uk>',
                to: userEmail,
                subject: emailData.subject,
                html: emailData.html,
              });

              console.log(`Cancellation email sent to ${userEmail}`);
            }
          } else {
            console.log('[Webhook] SMTP not configured, skipping cancellation email');
          }
        } catch (emailError) {
          console.error('Failed to send cancellation email:', emailError);
          // Don't fail the webhook if email fails
        }
      }

      return res.status(200).json({ received: true });
    }

    if (event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const clerkUserId = (sub.metadata?.clerkUserId as string | undefined) || undefined;
      if (!clerkUserId) return res.status(200).json({ received: true });

      const status = sub.status; // active, trialing, past_due, unpaid, canceled, etc.
      const shouldHaveAccess = status === "active" || status === "trialing";
      const desiredRole = shouldHaveAccess ? "early_access" : "user";

      const user = await clerkClient.users.getUser(clerkUserId);
      const currentRole = (user.publicMetadata as any)?.role as string | undefined;

      if (!neverDowngradeAdmin(currentRole)) {
        await clerkClient.users.updateUser(clerkUserId, {
          publicMetadata: {
            ...(user.publicMetadata || {}),
            role: desiredRole,
            stripeCustomerId: sub.customer as string,
            subscriptionId: sub.id,
            subscriptionStatus: status,
          },
        });
        console.log(`Role sync ${clerkUserId}: ${currentRole} -> ${desiredRole} (status=${status})`);
      }

      return res.status(200).json({ received: true });
    }

    // Ignore all other events
    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler error:", err?.message || err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}
