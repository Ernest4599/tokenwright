import crypto from "crypto";

// Maps Paystack amount (in kobo) to what the buyer gets.
// kobo = Naira x 100. Adjust these if you ever change your prices.
const TIER_MAP = {
  450000: { type: "credits", amount: 2 },      // 2 Generations - ₦4,500
  750000: { type: "credits", amount: 10 },     // 10 Generations - ₦7,500
  1350000: { type: "days", amount: 7 },        // Weekly Unlimited - ₦13,500
  3000000: { type: "days", amount: 30 },       // Monthly Unlimited - ₦30,000
};

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

  // Verify this request genuinely came from Paystack, not an impostor.
  const signature = event.headers["x-paystack-signature"];
  const expectedSignature = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(event.body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return { statusCode: 401, body: "Invalid signature" };
  }

  const payload = JSON.parse(event.body);

  if (payload.event !== "charge.success") {
    // Ignore any other event type Paystack might send.
    return { statusCode: 200, body: "Ignored" };
  }

  const email = payload.data.customer.email;
  const amountPaid = payload.data.amount;
  const tier = TIER_MAP[amountPaid];

  if (!email || !tier) {
    return { statusCode: 200, body: "No matching tier, ignored" };
  }

  const sbHeaders = {
    apikey: SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  const lookupRes = await fetch(
    `${SUPABASE_URL}/rest/v1/credits?email=eq.${encodeURIComponent(email)}`,
    { headers: sbHeaders }
  );
  const rows = await lookupRes.json();
  const existing = rows[0];

  if (tier.type === "credits") {
    const newTotal = (existing?.generations_left || 0) + tier.amount;

    if (existing) {
      await fetch(`${SUPABASE_URL}/rest/v1/credits?email=eq.${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: sbHeaders,
        body: JSON.stringify({ generations_left: newTotal, plan: "credits" }),
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/credits`, {
        method: "POST",
        headers: sbHeaders,
        body: JSON.stringify({ email, generations_left: newTotal, plan: "credits" }),
      });
    }
  } else {
    // Subscription tiers: extend from whichever is later — now, or their current expiry.
    const now = new Date();
    const currentExpiry = existing?.expires_at ? new Date(existing.expires_at) : now;
    const base = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(base.getTime() + tier.amount * 24 * 60 * 60 * 1000);

    if (existing) {
      await fetch(`${SUPABASE_URL}/rest/v1/credits?email=eq.${encodeURIComponent(email)}`, {
        method: "PATCH",
        headers: sbHeaders,
        body: JSON.stringify({ expires_at: newExpiry.toISOString(), plan: "unlimited" }),
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/credits`, {
        method: "POST",
        headers: sbHeaders,
        body: JSON.stringify({
          email,
          generations_left: 0,
          expires_at: newExpiry.toISOString(),
          plan: "unlimited",
        }),
      });
    }
  }

  return { statusCode: 200, body: "OK" };
}
