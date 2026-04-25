import { useNavigate } from 'react-router-dom';

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
    --bg-gray: #f8fafc;
  }

  .auth-scene {
    height: 100vh;
    width: 100vw;
    display: grid;
    grid-template-columns: 50% 50%;
    font-family: 'DM Sans', sans-serif;
    background: var(--white);
    overflow: hidden;
    position: fixed; 
    top: 0; left: 0;
  }

  /* ── LEFT PANEL ── */
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
  }

  .auth-panel-logo {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    overflow: hidden;
    margin-bottom: 24px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    border: 3px solid rgba(255,255,255,0.1);
  }

  .auth-panel-logo img { width: 100%; height: 100%; object-fit: cover; }

  .auth-panel-label {
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
    margin-bottom: 8px;
  }

  .auth-panel-headline {
    font-size: clamp(2rem, 3vw, 3rem);
    font-weight: 800;
    line-height: 1.1;
    color: #fff;
    margin-bottom: 12px;
  }

  .auth-panel-sub {
    font-size: 0.95rem;
    color: rgba(255,255,255,0.5);
    max-width: 240px;
    line-height: 1.5;
  }

  /* ── RIGHT PANEL ── */
  .auth-form-side {
    background: var(--bg-gray); 
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    height: 100%;
    overflow: hidden; 
  }

  .auth-card {
    background: #ffffff;
    width: 100%;
    max-width: 420px;
    max-height: 85vh; 
    padding: 40px;
    border-radius: 20px;
    border: 1px solid var(--border);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    overflow-y: auto; 
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    position: relative; 
    animation: authFadeUp 0.5s ease both;
  }

  /* ── BACK BUTTON STYLE ── */
  .auth-back-btn {
    align-self: flex-start;
    background: none;
    border: none;
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 20px;
    cursor: pointer;
    padding: 0;
    transition: color 0.2s;
    font-family: inherit;
  }

  .auth-back-btn:hover {
    color: var(--blue);
  }

  .auth-card::-webkit-scrollbar { width: 5px; }
  .auth-card::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

  .auth-form-inner { width: 100%; display: flex; flex-direction: column; align-items: center; }

  .auth-title {
    font-family: 'DM Serif Display', serif;
    font-size: 2.2rem;
    color: var(--navy);
    margin-bottom: 8px;
    line-height: 1;
  }

  .auth-sub { font-size: 0.9rem; color: var(--muted); margin-bottom: 24px; }
  .auth-sub a { color: var(--blue); text-decoration: none; font-weight: 600; }

  .auth-field { width: 100%; margin-bottom: 16px; text-align: left; }
  .auth-label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--navy); margin-bottom: 6px; }

  .auth-input {
    width: 100%;
    padding: 12px 16px;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    font-size: 0.95rem;
    transition: all 0.2s;
  }

  .auth-input:focus { border-color: var(--blue); outline: none; box-shadow: 0 0 0 4px rgba(29,78,216,0.08); }

  .auth-password-wrapper {
    position: relative;
    width: 100%;
  }

  .auth-password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    transition: color 0.2s;
  }

  .auth-password-toggle:hover {
    color: var(--blue);
  }

  .auth-btn {
    width: 100%;
    padding: 14px;
    background: var(--blue);
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 8px;
    box-shadow: 0 4px 12px rgba(29,78,216,0.2);
  }

  .auth-footer { text-align: center; margin-top: 20px; font-size: 0.85rem; color: var(--muted); width: 100%; }
  .auth-footer a { color: var(--blue); text-decoration: none; font-weight: 600; }

  @media (max-width: 768px) {
    .auth-scene { 
      grid-template-columns: 1fr; 
      position: relative;
      height: 100vh;
      overflow-y: auto;
    }
    .auth-panel { display: none; }
    .auth-form-side { 
      background: var(--white); 
      height: auto; 
      min-height: 100vh;
      padding: 32px 20px; 
      align-items: flex-start; 
    }
    .auth-card { 
      border: none; 
      box-shadow: none; 
      padding: 0; 
      max-height: none; 
      overflow: visible; 
      animation: none;
    }
    .auth-title { font-size: 1.8rem; }
  }

  @keyframes authFadeUp {
    from { opacity: 0; transform: translateY(20px); }
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
  const navigate = useNavigate();
  const idx = dotActive ?? 0;

  return (
    <>
      <style>{authStyles}</style>
      <div className="auth-scene">
        <div className="auth-panel">
          <div className="auth-panel-inner">
            <div className="auth-panel-logo">
              <img src="/logo.jpg" alt="ALRT" />
            </div>
            <span className="auth-panel-label">{PANEL_LABELS[idx]}</span>
            <div className="auth-panel-headline">
              {PANEL_HEADLINES[idx][0]}<br/>{PANEL_HEADLINES[idx][1]}
            </div>
            <p className="auth-panel-sub">Real-time IoT safety monitoring and door alert systems.</p>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-card">
            {/* BACK BUTTON using useNavigate */}
            <button 
              onClick={() => navigate('/')} 
              className="auth-back-btn"
            >
              ← Back
            </button>
            
            <div className="auth-form-inner">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}