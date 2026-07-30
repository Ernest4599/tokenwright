export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  const sbHeaders = {
    apikey: SUPABASE_SECRET_KEY,
    Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  const body = JSON.parse(event.body);
  const { action, email, code } = body;

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: "Email required" }) };
  }

  if (action === "send") {
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Upsert: overwrite any existing pending code for this email.
    await fetch(`${SUPABASE_URL}/rest/v1/verification_codes`, {
      method: "POST",
      headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        email,
        code: generatedCode,
        verified: false,
        expires_at: expiresAt,
      }),
    });

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tokenwright <onboarding@resend.dev>",
        to: email,
        subject: `Your Tokenwright code: ${generatedCode}`,
        text: `Your verification code is ${generatedCode}. It expires in 10 minutes.`,
      }),
    });

    return { statusCode: 200, body: JSON.stringify({ sent: true }) };
  }

  if (action === "verify") {
    const lookupRes = await fetch(
      `${SUPABASE_URL}/rest/v1/verification_codes?email=eq.${encodeURIComponent(email)}`,
      { headers: sbHeaders }
    );
    const rows = await lookupRes.json();
    const record = rows[0];

    if (!record) {
      return { statusCode: 400, body: JSON.stringify({ error: "No code found, request a new one" }) };
    }

    if (new Date(record.expires_at) < new Date()) {
      return { statusCode: 400, body: JSON.stringify({ error: "Code expired, request a new one" }) };
    }

    if (record.code !== code) {
      return { statusCode: 400, body: JSON.stringify({ error: "Incorrect code" }) };
    }

    await fetch(`${SUPABASE_URL}/rest/v1/verification_codes?email=eq.${encodeURIComponent(email)}`, {
      method: "PATCH",
      headers: sbHeaders,
      body: JSON.stringify({ verified: true }),
    });

    return { statusCode: 200, body: JSON.stringify({ verified: true }) };
  }

  return { statusCode: 400, body: JSON.stringify({ error: "Unknown action" }) };
}
