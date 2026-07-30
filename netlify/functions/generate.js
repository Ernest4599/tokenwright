export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const body = JSON.parse(event.body);
  const { email, ...form } = body;

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: "Email required" }) };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

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
  const record = rows[0];

  const now = new Date();
  const hasActiveSubscription =
    record && record.expires_at && new Date(record.expires_at) > now;
  const hasCredits = record && record.generations_left > 0;

  if (!record || (!hasActiveSubscription && !hasCredits)) {
    return { statusCode: 402, body: JSON.stringify({ error: "no_credits" }) };
  }

  const prompt = `You are a senior product designer creating a design system.

Product name: ${form.productName || "Untitled product"}
Description: ${form.description || "Not provided"}
Industry: ${form.industry}
Desired mood/vibe: ${form.moods.join(", ")}
${
  form.useAiColor
    ? "Brand color: choose one that fits the mood and industry."
    : `Brand color: ${form.brandColor} (use this as the primary color)`
}
Components needed: ${form.components.join(", ")}

Respond with ONLY a JSON object, no markdown fences, no preamble, matching exactly this shape:

{
  "rationale": "one sentence explaining the design direction",
  "palette": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "surface": "#hex",
    "textPrimary": "#hex",
    "textMuted": "#hex",
    "border": "#hex",
    "success": "#hex",
    "danger": "#hex"
  },
  "typography": {
    "displayFont": "a real Google Font name suited to the mood",
    "bodyFont": "a real Google Font name that pairs well with the display font",
    "baseSize": 16,
    "scaleRatio": 1.25
  },
  "radius": "value in px, e.g. 6px",
  "spacingUnit": 4
}

Pick colors with sufficient contrast for text readability. Make choices specific to the described product, not generic defaults.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const raw = data.content.map((b) => b.text || "").join("");
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!hasActiveSubscription) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/credits?email=eq.${encodeURIComponent(email)}`,
        {
          method: "PATCH",
          headers: sbHeaders,
          body: JSON.stringify({ generations_left: record.generations_left - 1 }),
        }
      );
    }

    return { statusCode: 200, body: JSON.stringify(parsed) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Generation failed" }) };
  }
    }
