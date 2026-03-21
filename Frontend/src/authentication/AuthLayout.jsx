const authStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:   #0c2340;
    --blue:   #1d4ed8;
    --glow:   #3b82f6;
    --muted:  #64748b;
    --border: #e2e8f0;
    --white:  #ffffff;
  }

  .auth-scene {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 70% 30%;
    font-family: 'DM Sans', sans-serif;
  }

  .auth-panel {
    position: relative;
    overflow: hidden;
    background: var(--navy);
  }

  .auth-panel-inner {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 32px;
    pointer-events: none;
    text-align: center;
    gap: 0;
  }

  .auth-panel-logo {
    width: 110px;
    height: 110px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 28px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    border: 3px solid rgba(255,255,255,0.12);
  }

  .auth-panel-logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .auth-panel-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    margin-bottom: 10px;
  }

  .auth-panel-headline {
    font-family: 'DM Sans', sans-serif;
    font-size: clamp(2.4rem, 3.5vw, 3.4rem);
    font-weight: 800;
    line-height: 1.2;
    color: #fff;
    letter-spacing: -0.02em;
    margin-bottom: 10px;
  }

  .auth-panel-sub {
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem;
    color: rgba(255,255,255,0.5);
    font-weight: 400;
    line-height: 1.6;
    max-width: 200px;
  }

  .auth-form-side {
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 44px;
    position: relative;
    overflow-y: auto;
  }

  .auth-form-side::before {
    content: '';
    position: absolute;
    top: 10%; left: 0;
    width: 1px;
    height: 80%;
    background: linear-gradient(to bottom, transparent, var(--border), transparent);
  }

  .auth-form-inner {
    width: 100%;
    max-width: 340px;
    animation: authFadeUp 0.4s ease both;
    padding: 16px 0;
  }

  .auth-eyebrow {
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--blue);
    margin-bottom: 8px;
  }

  .auth-title {
    font-family: 'DM Serif Display', serif;
    font-size: 2.4rem;
    color: var(--navy);
    margin-bottom: 6px;
  }

  .auth-sub {
    font-size: 1rem;
    color: var(--muted);
    margin-bottom: 20px;
    font-weight: 300;
  }

  .auth-sub a {
    color: var(--blue);
    text-decoration: none;
    font-weight: 500;
  }

  .auth-field { margin-bottom: 10px; }

  .auth-label {
    display: block;
    font-size: 0.88rem;
    font-weight: 500;
    color: var(--navy);
    margin-bottom: 6px;
    letter-spacing: 0.02em;
  }

  .auth-input {
    width: 100%;
    padding: 11px 15px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    font-size: 0.95rem;
    font-family: 'DM Sans', sans-serif;
    color: var(--navy);
    background: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .auth-input::placeholder { color: #b0bec5; }

  .auth-input:focus {
    border-color: var(--blue);
    box-shadow: 0 0 0 3px rgba(29,78,216,0.1);
  }

  .auth-input--error {
    border-color: #ef4444;
  }

  .auth-error {
    color: #ef4444;
    font-size: 0.75rem;
    margin-top: 3px;
    display: block;
  }

  .auth-btn {
    width: 100%;
    padding: 12px;
    background: var(--blue);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    margin-top: 4px;
    letter-spacing: 0.03em;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 16px rgba(29,78,216,0.28);
  }

  .auth-btn:hover {
    background: #1e40af;
    transform: translateY(-1px);
    box-shadow: 0 6px 22px rgba(29,78,216,0.35);
  }

  .auth-btn:active { transform: translateY(0); }

  .auth-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .auth-footer {
    display: block;
    text-align: center;
    margin-top: 10px;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .auth-footer a {
    color: var(--blue);
    text-decoration: none;
    font-weight: 500;
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .auth-scene {
      grid-template-columns: 55% 45%;
    }
    .auth-form-side {
      padding: 32px 28px;
    }
  }

  @media (max-width: 768px) {
    .auth-scene {
      grid-template-columns: 1fr;
      min-height: 100vh;
    }
    .auth-panel {
      display: none;
    }
    .auth-form-side {
      padding: 40px 24px;
      min-height: 100vh;
      align-items: flex-start;
      padding-top: 48px;
    }
    .auth-form-side::before {
      display: none;
    }
    .auth-form-inner {
      max-width: 100%;
    }
    .auth-title {
      font-size: 2rem;
    }
  }

  @media (max-width: 480px) {
    .auth-form-side {
      padding: 32px 20px;
    }
    .auth-title {
      font-size: 1.8rem;
    }
  }

  @keyframes authFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const PANEL_LABELS = ["Welcome Back", "Get Started", "Account Recovery"];
const PANEL_HEADLINES = [
  ["Stay ALERT,", "Stay ALRIGHT."],
  ["Stay ALERT,", "Stay ALRIGHT."],
  ["Stay ALERT,", "Stay ALRIGHT."],
];

export default function AuthLayout({ children, dotActive }) {
  const idx = dotActive ?? 0;

  return (
    <>
      <style>{authStyles}</style>
      <div className="auth-scene">

        {/* LEFT — solid navy background */}
        <div className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-panel-logo">
              <img src="/logo.jpg" alt="ALRT" />
            </div>
            <span className="auth-panel-label">{PANEL_LABELS[idx]}</span>
            <div className="auth-panel-headline">{PANEL_HEADLINES[idx][0]}<br/>{PANEL_HEADLINES[idx][1]}</div>
            <p className="auth-panel-sub">Real-time IoT safety monitoring.</p>
          </div>
        </div>

        {/* RIGHT — plain white */}
        <div className="auth-form-side">
          <div className="auth-form-inner">
            {children}
          </div>
        </div>

      </div>
    </>
  );
}