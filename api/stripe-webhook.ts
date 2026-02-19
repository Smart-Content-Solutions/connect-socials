import Stripe from "stripe";
import { createClerkClient } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { getSubscriptionConfirmationEmail } from "./emails/subscription-confirmation.js";
import { getSubscriptionCancellationEmail } from "./emails/subscription-cancellation.js";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Supabase client for token credit operations
const supabaseUrl = process.env.SUPABASE_SCS_URL || "https://bgwmonmfulmmdwlbdekz.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SCS_SERVICE_ROLE_KEY || "";

function getScsSupabase() {
  if (!supabaseServiceKey) {
    throw new Error("Missing SUPABASE_SCS_SERVICE_ROLE_KEY");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

async function handleTokenPurchase(session: Stripe.Checkout.Session): Promise<boolean> {
  // Check if this is a token purchase
  if (session.metadata?.type !== "token_purchase") {
    return false; // Not a token purchase, let other handlers process
  }

  const clerkUserId = session.metadata?.clerkUserId || session.client_reference_id;
  const tokenAmount = parseInt(session.metadata?.tokenAmount || "0", 10);

  if (!clerkUserId || !tokenAmount) {
    console.warn("Token purchase webhook: missing clerkUserId or tokenAmount");
    return true; // Consumed the event, just malformed
  }

  console.log(`Processing token purchase: ${tokenAmount} tokens for user ${clerkUserId}`);

  const supabase = getScsSupabase();

  // Upsert user_credits — add tokens to balance
  const { data: existing } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", clerkUserId)
    .single();

  if (existing) {
    await supabase
      .from("user_credits")
      .update({ balance: existing.balance + tokenAmount })
      .eq("user_id", clerkUserId);
  } else {
    await supabase
      .from("user_credits")
      .insert({ user_id: clerkUserId, balance: tokenAmount });
  }

  // Record purchase transaction
  await supabase
    .from("credit_transactions")
    .insert({
      user_id: clerkUserId,
      amount: tokenAmount,
      type: "purchase",
      description: `Purchased ${tokenAmount} tokens`,
      metadata: {
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        amount_total: session.amount_total,
      },
    });

  console.log(`✅ Credited ${tokenAmount} tokens to user ${clerkUserId}`);
  return true; // Consumed the event
}

// Helper function to create email transporter only when needed
function getEmailTransporter() {
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: smtpPort,
    secure: smtpPort === 465, // true for port 465 (SSL)
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

      // Handle token purchases separately
      try {
        const wasTokenPurchase = await handleTokenPurchase(session);
        if (wasTokenPurchase) {
          return res.status(200).json({ received: true });
        }
      } catch (tokenErr: any) {
        console.error("Token purchase handling error:", tokenErr);
        // Don't fail the webhook — log and continue
      }

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
            hasUsedTrial: true, // Mark trial as used once they successfully subscribe
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
