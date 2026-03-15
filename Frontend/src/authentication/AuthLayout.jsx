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
    grid-template-columns: 55% 45%;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── LEFT PANEL — just the logo ── */
  .auth-panel {
    position: relative;
    overflow: hidden;
    background: var(--navy);
  }

  .auth-panel img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
  }

  /* ── RIGHT SIDE — plain white, NO card ── */
  .auth-form-side {
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 52px;
    position: relative;
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
  }

  /* ── SHARED FORM STYLES ── */
  .auth-eyebrow {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--blue);
    margin-bottom: 8px;
  }

  .auth-title {
    font-family: 'DM Serif Display', serif;
    font-size: 2.1rem;
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

  @media (max-width: 768px) {
    .auth-scene { grid-template-columns: 1fr; }
    .auth-panel  { display: none; }
    .auth-form-side { padding: 48px 28px; }
  }

  @keyframes authFadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

export default function AuthLayout({ children, dotActive }) {
  return (
    <>
      <style>{authStyles}</style>
      <div className="auth-scene">

        {/* ── LEFT — full logo image ── */}
        <div className="auth-panel">
          <img src="/logo.jpg" alt="Smart Alert" />
        </div>

        {/* ── RIGHT — plain white, no card ── */}
        <div className="auth-form-side">
          <div className="auth-form-inner">
            {children}
          </div>
        </div>

      </div>
    </>
  );
}