export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const form = JSON.parse(event.body);

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

    return {
      statusCode: 200,
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Generation failed" }),
    };
  }
}
