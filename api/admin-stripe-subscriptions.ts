import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const priceId = process.env.STRIPE_EARLY_ACCESS_PRICE_ID;
if (!process.env.STRIPE_SECRET_KEY) {
  return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
}
if (!priceId) {
  return res.status(500).json({ error: "Missing STRIPE_EARLY_ACCESS_PRICE_ID" });
}

    // List subscriptions for this price (Early Access plan)
    const subscriptions = await stripe.subscriptions.list({
      status: "all",          // active, trialing, canceled, etc.
      price: priceId || undefined,
      limit: 100,
      expand: ["data.customer"],
    });

    // Basic stats for the dashboard
    const stats = {
      total: subscriptions.data.length,
      active: subscriptions.data.filter((s) => s.status === "active").length,
      trialing: subscriptions.data.filter((s) => s.status === "trialing").length,
      canceled: subscriptions.data.filter(
        (s) => s.status === "canceled" || s.cancel_at_period_end
      ).length,
    };

    // Map to a safe, frontend-friendly shape
    const mapped = subscriptions.data.map((s) => {
      const firstItem = s.items.data[0];
      const customer =
        typeof s.customer === "string" ? null : s.customer || null;

      return {
        id: s.id,
        status: s.status,
        created: s.created,
        trial_end: s.trial_end,
        current_period_end: s.current_period_end,
        cancel_at_period_end: s.cancel_at_period_end,
        price_id: firstItem?.price?.id ?? null,
        amount: firstItem?.price?.unit_amount ?? null,
        currency: firstItem?.price?.currency ?? null,
        customer_email: customer?.email ?? null,
        customer_name: customer?.name ?? null,
      };
    });

    return res.status(200).json({
      stats,
      subscriptions: mapped,
    });
  } catch (error: any) {
    console.error("Stripe admin subscriptions error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to load Stripe subscriptions",
    });
  }
}
