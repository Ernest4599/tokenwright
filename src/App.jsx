import { useState } from "react";

const MOODS = ["Minimal", "Bold", "Playful", "Corporate", "Luxury", "Technical"];
const INDUSTRIES = [
  "SaaS / Productivity",
  "E-commerce",
  "Consumer app",
  "Fintech",
  "Health & wellness",
  "Creative / portfolio",
  "Other",
];
const COMPONENT_OPTIONS = ["Buttons", "Forms & inputs", "Cards", "Navigation", "Modals", "Tables"];

const TIERS = [
  {
    name: "2 Generations",
    price: "$3",
    sub: "one-time",
    badge: null,
    link: "https://paystack.shop/pay/8i8j1n55dn",
  },
  {
    name: "10 Generations",
    price: "$5",
    sub: "one-time",
    badge: "Save 67% per generation",
    link: "https://paystack.shop/pay/vijeb7gv8r",
  },
  {
    name: "Weekly Unlimited",
    price: "$9",
    sub: "per week",
    badge: "Most flexible",
    link: "https://paystack.shop/pay/1e2c9hi8od",
  },
  {
    name: "Monthly Unlimited",
    price: "$20",
    sub: "per month",
    badge: "Save 37% vs weekly",
    link: "https://paystack.shop/pay/0gtg4xl49j",
  },
];

export default function App() {
  const [screen, setScreen] = useState("start"); // start | form | loading | result | error | no_credits
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({
    productName: "",
    description: "",
    industry: INDUSTRIES[0],
    moods: ["Minimal"],
    useAiColor: true,
    brandColor: "#4F46E5",
    components: ["Buttons", "Forms & inputs", "Cards"],
  });
  const [tokens, setTokens] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  function toggle(list, value, max) {
    if (list.includes(value)) return list.filter((v) => v !== value);
    if (max && list.length >= max) return list;
    return [...list, value];
  }

  async function generate() {
    setScreen("loading");
    setErrorMsg("");

    try {
      const response = await fetch("/.netlify/functions/generate", {
        method: "POST",
        body: JSON.stringify({ email, ...form }),
      });

      if (response.status === 402) {
        setScreen("no_credits");
        return;
      }

      if (!response.ok) throw new Error("Request failed");

      const parsed = await response.json();
      setTokens(parsed);
      setScreen("result");
    } catch (err) {
      setErrorMsg("Something went wrong generating your design system. Let's try again.");
      setScreen("error");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#23262B",
        color: "#EDEAE3",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        input[type="text"], input[type="email"], textarea, select {
          background: #2E323A;
          border: 1px solid #3C4048;
          color: #EDEAE3;
          border-radius: 6px;
          padding: 10px 12px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          width: 100%;
          outline: none;
        }
        input:focus, textarea:focus, select:focus {
          border-color: #C98A3E;
        }
        ::placeholder { color: #6B6F78; }
      `}</style>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: "#C98A3E",
              letterSpacing: "0.08em",
            }}
          >
            TOKENWRIGHT
          </span>
          <span style={{ fontSize: 12, color: "#6B6F78" }}>/ design system generator</span>
        </div>
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 32,
            margin: "0 0 32px",
          }}
        >
          Forge a design system
        </h1>

        {screen === "start" && (
          <StartView email={email} setEmail={setEmail} onContinue={() => setScreen("form")} />
        )}

        {screen === "form" && (
          <FormView form={form} setForm={setForm} toggle={toggle} onSubmit={generate} onBack={() => setScreen("start")} />
        )}

        {screen === "loading" && <LoadingView />}

        {screen === "no_credits" && (
          <div>
            <p style={{ color: "#EDEAE3", marginBottom: 24, lineHeight: 1.5 }}>
              You're out of generations for <strong>{email}</strong>. Pick a plan below, then come back and hit Generate again with the same email.
            </p>
            <PricingCards />
            <button onClick={() => setScreen("form")} style={{ ...secondaryBtnStyle, marginTop: 24 }}>
              ← Back
            </button>
          </div>
        )}

        {screen === "error" && (
          <div>
            <p style={{ color: "#E8897A", marginBottom: 16 }}>{errorMsg}</p>
            <button onClick={() => setScreen("form")} style={secondaryBtnStyle}>
              Back to form
            </button>
          </div>
        )}

        {screen === "result" && tokens && (
          <ResultView tokens={tokens} onStartOver={() => setScreen("form")} />
        )}
      </div>
    </div>
  );
}

function StartView({ email, setEmail, onContinue }) {
  return (
    <div>
      <p style={{ color: "#9CA0A8", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
        Enter your email, pick a plan, then generate your design system.
      </p>

      <Field label="Your email">
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <div style={{ marginTop: 32, marginBottom: 32 }}>
        <SectionLabel>Plans</SectionLabel>
        <PricingCards />
      </div>

      <button
        onClick={onContinue}
        disabled={!email}
        style={{ ...primaryBtnStyle, opacity: email ? 1 : 0.5 }}
      >
        Continue →
      </button>
    </div>
  );
}

function PricingCards() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {TIERS.map((tier) => (
        <a
          key={tier.name}
          href={tier.link}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#2E323A",
            border: "1px solid #3C4048",
            borderRadius: 8,
            padding: "14px 16px",
            textDecoration: "none",
            color: "#EDEAE3",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{tier.name}</div>
            {tier.badge && (
              <div
                style={{
                  fontSize: 11,
                  color: "#C98A3E",
                  marginTop: 2,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {tier.badge}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{tier.price}</div>
            <div style={{ fontSize: 11, color: "#9CA0A8" }}>{tier.sub}</div>
          </div>
        </a>
      ))}
    </div>
  );
}

function FormView({ form, setForm, toggle, onSubmit, onBack }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Field label="Product name">
        <input
          type="text"
          placeholder="e.g. Lighthouse"
          value={form.productName}
          onChange={(e) => setForm({ ...form, productName: e.target.value })}
        />
      </Field>

      <Field label="What does it do? (one sentence)">
        <textarea
          rows={2}
          placeholder="e.g. A tool that helps freelancers track invoices and get paid faster"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </Field>

      <Field label="Industry">
        <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Mood (pick up to 2)">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {MOODS.map((m) => {
            const active = form.moods.includes(m);
            return (
              <button
                key={m}
                onClick={() => setForm({ ...form, moods: toggle(form.moods, m, 2) })}
                style={{
                  ...chipStyle,
                  background: active ? "#C98A3E" : "#2E323A",
                  color: active ? "#23262B" : "#EDEAE3",
                  borderColor: active ? "#C98A3E" : "#3C4048",
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Brand color">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#9CA0A8" }}>
            <input
              type="checkbox"
              checked={form.useAiColor}
              onChange={(e) => setForm({ ...form, useAiColor: e.target.checked })}
            />
            Let AI choose
          </label>
          {!form.useAiColor && (
            <input
              type="color"
              value={form.brandColor}
              onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
              style={{ width: 44, height: 32, border: "none", background: "none", cursor: "pointer" }}
            />
          )}
        </div>
      </Field>

      <Field label="Components to generate">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {COMPONENT_OPTIONS.map((c) => {
            const active = form.components.includes(c);
            return (
              <button
                key={c}
                onClick={() => setForm({ ...form, components: toggle(form.components, c) })}
                style={{
                  ...chipStyle,
                  background: active ? "#3C4048" : "#2E323A",
                  color: active ? "#EDEAE3" : "#9CA0A8",
                  borderColor: active ? "#C98A3E" : "#3C4048",
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </Field>

      <button onClick={onSubmit} style={primaryBtnStyle}>
        Generate design system →
      </button>
    </div>
  );
}

function LoadingView() {
  return (
    <div style={{ padding: "60px 0", textAlign: "center" }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#C98A3E", letterSpacing: "0.05em" }}>
        forging palette · setting type · tuning spacing…
      </div>
    </div>
  );
}

function ResultView({ tokens, onStartOver }) {
  const { palette, typography, radius, rationale } = tokens;

  return (
    <div>
      <p style={{ color: "#9CA0A8", fontSize: 14, marginBottom: 32, lineHeight: 1.5 }}>{rationale}</p>

      <SectionLabel>Palette</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 40 }}>
        {Object.entries(palette).map(([name, hex]) => (
          <div key={name} style={{ width: 96 }}>
            <div style={{ height: 64, borderRadius: 6, background: hex, border: "1px solid #3C4048", marginBottom: 6 }} />
            <div style={{ fontSize: 11, color: "#9CA0A8" }}>{name}</div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#6B6F78" }}>{hex}</div>
          </div>
        ))}
      </div>

      <SectionLabel>Typography</SectionLabel>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: `'${typography.displayFont}', sans-serif`, fontSize: 28, marginBottom: 8 }}>
          {typography.displayFont} — Display
        </div>
        <div style={{ fontFamily: `'${typography.bodyFont}', sans-serif`, fontSize: 15, color: "#9CA0A8" }}>
          {typography.bodyFont} — Body text sits here, comfortable at {typography.baseSize}px with a {typography.scaleRatio}x scale ratio.
        </div>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=${typography.displayFont.replace(
          / /g,
          "+"
        )}:wght@700&family=${typography.bodyFont.replace(/ /g, "+")}:wght@400;600&display=swap');`}</style>
      </div>

      <SectionLabel>Live preview</SectionLabel>
      <div style={{ background: palette.background, border: `1px solid ${palette.border}`, borderRadius: 12, padding: 32, marginBottom: 32 }}>
        <div style={{ fontFamily: `'${typography.displayFont}', sans-serif`, fontSize: 22, color: palette.textPrimary, marginBottom: 16 }}>
          Sample card
        </div>
        <p style={{ fontFamily: `'${typography.bodyFont}', sans-serif`, fontSize: 14, color: palette.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
          This is how body text looks using the generated system.
        </p>
        <input
          type="text"
          placeholder="Input field"
          style={{
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            color: palette.textPrimary,
            borderRadius: radius,
            padding: "10px 14px",
            fontSize: 14,
            width: "100%",
            marginBottom: 16,
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 12 }}>
          <button
            style={{
              background: palette.primary,
              color: palette.background,
              border: "none",
              borderRadius: radius,
              padding: "10px 20px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Primary action
          </button>
          <button
            style={{
              background: "transparent",
              color: palette.textPrimary,
              border: `1px solid ${palette.border}`,
              borderRadius: radius,
              padding: "10px 20px",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Secondary
          </button>
        </div>
      </div>

      <button onClick={onStartOver} style={secondaryBtnStyle}>
        ← Start over
      </button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: "#9CA0A8", marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        color: "#C98A3E",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: 14,
        borderBottom: "1px solid #3C4048",
        paddingBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

const chipStyle = {
  border: "1px solid",
  borderRadius: 20,
  padding: "6px 14px",
  fontSize: 13,
  cursor: "pointer",
};

const primaryBtnStyle = {
  background: "#C98A3E",
  color: "#23262B",
  border: "none",
  borderRadius: 6,
  padding: "12px 24px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  alignSelf: "flex-start",
};

const secondaryBtnStyle = {
  background: "transparent",
  color: "#EDEAE3",
  border: "1px solid #3C4048",
  borderRadius: 6,
  padding: "10px 20px",
  fontSize: 14,
  cursor: "pointer",
};
