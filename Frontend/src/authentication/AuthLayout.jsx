const authStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:   #0c2340;
    --blue:   #1d4ed8;
    --glow:   #3b82f6;
    --soft:   #eff6ff;
    --muted:  #64748b;
    --border: #e2e8f0;
    --white:  #ffffff;
  }

  .auth-scene {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 420px 1fr;
    font-family: 'DM Sans', sans-serif;
  }

  .auth-panel {
    background: var(--navy);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 44px;
  }

  .auth-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 110% -10%, rgba(29,78,216,0.45) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at -20% 110%, rgba(59,130,246,0.25) 0%, transparent 55%);
    pointer-events: none;
  }

  .auth-panel-logo {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .auth-panel-logo-icon {
    width: 36px; height: 36px;
    border-radius: 9px;
    background: rgba(59,130,246,0.25);
    border: 1.5px solid rgba(255,255,255,0.2);
    display: grid;
    place-items: center;
  }

  .auth-panel-logo-icon span {
    width: 14px; height: 14px;
    border-radius: 3px;
    background: var(--glow);
    display: block;
  }

  .auth-panel-logo-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(255,255,255,0.7);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .auth-panel-body {
    position: relative;
    z-index: 1;
  }

  .auth-panel-heading {
    font-family: 'DM Serif Display', serif;
    font-size: 2.6rem;
    line-height: 1.2;
    color: #fff;
    margin-bottom: 16px;
  }

  .auth-panel-heading em {
    font-style: italic;
    color: var(--glow);
  }

  .auth-panel-desc {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.45);
    line-height: 1.75;
    max-width: 260px;
  }

  .auth-panel-dots {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 7px;
  }

  .auth-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: rgba(255,255,255,0.18);
    transition: background 0.25s;
  }

  .auth-dot.active { background: var(--glow); }

  .auth-form-side {
    background: var(--soft);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 32px;
  }

  .auth-form-card {
    width: 100%;
    max-width: 400px;
    background: var(--white);
    border-radius: 20px;
    border: 1px solid var(--border);
    padding: 44px 40px;
    box-shadow: 0 8px 40px rgba(12,35,64,0.07);
    animation: authFadeUp 0.4s ease both;
  }

  .auth-eyebrow {
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--blue);
    margin-bottom: 8px;
  }

  .auth-title {
    font-family: 'DM Serif Display', serif;
    font-size: 1.9rem;
    color: var(--navy);
    margin-bottom: 6px;
  }

  .auth-sub {
    font-size: 0.85rem;
    color: var(--muted);
    margin-bottom: 32px;
    font-weight: 300;
  }

  .auth-sub a {
    color: var(--blue);
    text-decoration: none;
    font-weight: 500;
  }

  .auth-field { margin-bottom: 14px; }

  .auth-label {
    display: block;
    font-size: 0.78rem;
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
    font-size: 0.88rem;
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

  .auth-btn {
    width: 100%;
    padding: 12px;
    background: var(--blue);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    margin-top: 6px;
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

  .auth-footer {
    display: block;
    text-align: center;
    margin-top: 16px;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .auth-footer a {
    color: var(--blue);
    text-decoration: none;
    font-weight: 500;
  }

  @media (max-width: 720px) {
    .auth-scene { grid-template-columns: 1fr; }
    .auth-panel  { display: none; }
    .auth-form-side { padding: 24px 16px; }
    .auth-form-card { padding: 32px 24px; }
  }

  @keyframes authFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

const PANEL_DATA = [
  {
    heading: (
      <>
        <em>Simple.</em><br />Secure.<br />Yours.
      </>
    ),
    desc: "A secure space built for clarity, privacy, and simplicity."
  },
  {
    heading: (
      <>
        <em>Join</em><br />something<br />bigger.
      </>
    ),
    desc: "Create an account and get started in seconds."
  },
  {
    heading: (
      <>
        Forgot?<br /><em>No worries.</em><br />We've got you.
      </>
    ),
    desc: "Enter your email and we'll send you instructions to reset your password."
  }
];

export default function AuthLayout({ children, dotActive }) {
  const panel = PANEL_DATA[dotActive];
  return (
    <>
      <style>{authStyles}</style>
      <div className="auth-scene">

        <div className="auth-panel">
          <div className="auth-panel-logo">
            <div className="auth-panel-logo-icon"><span /></div>
            <span className="auth-panel-logo-name">SmartDoor</span>
          </div>
          <div className="auth-panel-body">
            <h1 className="auth-panel-heading">{panel.heading}</h1>
            <p className="auth-panel-desc">{panel.desc}</p>
          </div>
          <div className="auth-panel-dots">
            {[0, 1, 2].map(i => (
              <div key={i} className={`auth-dot${i === dotActive ? " active" : ""}`} />
            ))}
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-form-card">
            {children}
          </div>
        </div>

      </div>
    </>
  );
}