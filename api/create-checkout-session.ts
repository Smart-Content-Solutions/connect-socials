import Stripe from "stripe";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_EARLY_ACCESS_PRICE_ID;

    if (!secretKey) {
      return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
    }
    if (!priceId) {
      return res.status(500).json({ error: "Missing STRIPE_EARLY_ACCESS_PRICE_ID" });
    }

    // Safe to log the price id (not secret). This helps confirm Production is reading the right value.
    console.log("Creating checkout session with price:", priceId);

    const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 3 },
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe error:", error);
    return res.status(400).json({ error: error.message });
  }
}
