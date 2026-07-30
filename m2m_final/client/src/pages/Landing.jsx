import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const FEATURES = [
  { icon: '📔', title: 'Mistake Journal', text: 'Log what went wrong, the correct method, and how you will avoid it — subject by subject.', color: 'var(--brand)' },
  { icon: '🔔', title: 'Spaced Repetition', text: 'Every mistake comes back on day 1, 3, 7, 14 and 30 — right before your brain drops it.', color: 'var(--coral)' },
  { icon: '📊', title: 'Real Analytics', text: 'See exactly which subject, chapter and mistake type is quietly eating your marks.', color: 'var(--cyan)' },
  { icon: '🤖', title: 'AI Coach', text: 'A concrete action plan built from your own data — not generic study advice.', color: 'var(--amber)' },
  { icon: '⏰', title: 'Exam Countdown', text: 'JEE, NEET and Boards on one screen, so every day has a number attached to it.', color: 'var(--green)' },
  { icon: '🏆', title: 'Streaks & Points', text: 'Turn revision into a daily habit you actually want to keep alive.', color: 'var(--pink)' },
];

const STEPS = [
  { n: '01', title: 'Log the mistake', text: 'Two minutes after a test. Subject, what went wrong, the fix.' },
  { n: '02', title: 'We schedule it', text: 'It returns exactly when you are about to forget it.' },
  { n: '03', title: 'Patterns appear', text: 'After 20 entries you stop guessing what is weak — you know.' },
];

export default function Landing() {
  const canvasRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const palette = ['#8b5cf6', '#22d3ee', '#fbbf24', '#ff6b6b', '#34d399'];
    let particles = [];

    const size = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      const count = window.innerWidth < 700 ? 26 : 52;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 2.4 + 0.8,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: Math.random() * 0.45 + 0.18,
      }));
    };

    size(); seed();

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
        if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;

        // link nearby particles into a faint constellation
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 130) {
            ctx.globalAlpha = (1 - d / 130) * (isDark ? 0.16 : 0.12);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => { size(); seed(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [isDark]);

  return (
    <div className="screen landing">
      <canvas ref={canvasRef} className="landing-canvas" />

      {/* ── Top bar ── */}
      <header className="landing-nav">
        <div className="nav-logo">
          <span className="nav-mark">🎯</span>
          <span>Mistake To Magic</span>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            <i className={`fas fa-${isDark ? 'sun' : 'moon'}`} />
          </button>
          <Link to="/login" className="btn btn-ghost btn-sm landing-login">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Start free</Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="landing-hero">
        <div className="launch-badge animate-rise">
          <span className="launch-dot" />
          Early access — <strong>free for your first 2 months</strong>
        </div>

        <h1 className="hero-title animate-rise d1">
          Every mistake you make<br />
          is <span className="text-grad">a mark you can win back.</span>
        </h1>

        <p className="hero-sub animate-rise d2">
          The mistake tracker built for Class 11 &amp; 12 — Boards, JEE and NEET.
          Log it once, and we bring it back until it stops costing you marks.
        </p>

        <div className="hero-cta animate-rise d3">
          <Link to="/register" className="btn btn-primary btn-lg">
            <i className="fas fa-rocket" /> Get started free
          </Link>
          <Link to="/login" className="btn btn-ghost btn-lg">
            <i className="fas fa-arrow-right-to-bracket" /> I already have an account
          </Link>
        </div>

        <p className="hero-note animate-rise d4">
          No card required · Your data stays private
        </p>

        {/* Floating product preview */}
        <div className="hero-preview animate-rise d5">
          <div className="card card-pad card-glow preview-card">
            <div className="row-between" style={{ marginBottom: 14 }}>
              <span className="tag tag-brand">⚛️ PHYSICS</span>
              <span className="tag tag-hot">🔔 Revise today</span>
            </div>
            <p className="preview-q">Used v² = u² + 2as with the wrong sign for deceleration.</p>
            <div className="preview-line"><span className="preview-k" style={{ color: 'var(--green)' }}>✅ Correct method</span> Take retardation as negative before substituting.</div>
            <div className="preview-line"><span className="preview-k" style={{ color: 'var(--cyan)' }}>🛡️ How to avoid</span> Write the sign convention on top of the rough work.</div>
            <div className="preview-foot">
              <span className="pill-stat">🔥 12 day streak</span>
              <span className="pill-stat">⭐ 340 points</span>
              <span className="pill-stat">📚 47 logged</span>
            </div>
          </div>
        </div>
      </main>

      {/* ── Features ── */}
      <section className="landing-section">
        <p className="eyebrow" style={{ justifyContent: 'center' }}>What you get</p>
        <h2 className="section-title">Built around one habit that actually works</h2>
        <div className="grid grid-3 feature-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`card card-pad card-hover feature-card animate-rise d${(i % 6) + 1}`}>
              <div className="feature-icon" style={{ background: `color-mix(in srgb, ${f.color} 18%, transparent)` }}>{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-text">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing-section">
        <p className="eyebrow" style={{ justifyContent: 'center' }}>How it works</p>
        <h2 className="section-title">Three steps. Two minutes a day.</h2>
        <div className="grid grid-3 feature-grid">
          {STEPS.map((s, i) => (
            <div key={s.n} className={`step-card animate-rise d${i + 1}`}>
              <span className="step-num">{s.n}</span>
              <h3 className="feature-title">{s.title}</h3>
              <p className="feature-text">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="landing-section">
        <div className="cta-band card card-pad">
          <div>
            <h2 className="cta-title">Start turning mistakes into marks</h2>
            <p className="feature-text" style={{ marginTop: 8 }}>
              Free for your first 2 months. Set up your journal in under a minute.
            </p>
          </div>
          <Link to="/register" className="btn btn-hot btn-lg">
            <i className="fas fa-bolt" /> Create my free account
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="row" style={{ gap: 10 }}>
          <span className="nav-mark" style={{ width: 26, height: 26, fontSize: '0.8rem' }}>🎯</span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Mistake To Magic</span>
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>
          Made for Class 11 &amp; 12 students across India
        </p>
      </footer>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
  .landing { position: relative; overflow-x: hidden; }
  .landing-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
  .landing > *:not(.landing-canvas) { position: relative; z-index: 1; }

  .landing-nav { display: flex; align-items: center; justify-content: space-between; gap: 14px;
    padding: 20px clamp(16px, 5vw, 48px); max-width: 1280px; margin: 0 auto; width: 100%; }

  .landing-hero { max-width: 940px; margin: 0 auto; padding: clamp(26px, 6vw, 60px) clamp(16px, 5vw, 24px) 40px; text-align: center; }

  .launch-badge { display: inline-flex; align-items: center; gap: 9px; padding: 8px 18px; border-radius: var(--r-pill);
    background: var(--surface); border: 1px solid var(--border-strong); color: var(--text-2);
    font-size: 0.82rem; font-weight: 600; margin-bottom: 26px; backdrop-filter: blur(10px); }
  .launch-badge strong { color: var(--brand-soft); }
  .launch-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 0 3px rgba(52,211,153,0.22); }

  .hero-title { font-size: clamp(2.1rem, 6.4vw, 4.1rem); font-weight: 800; line-height: 1.08; letter-spacing: -0.035em; margin-bottom: 20px; }
  .hero-sub { font-size: clamp(0.96rem, 2.1vw, 1.14rem); color: var(--text-2); max-width: 640px; margin: 0 auto 34px; line-height: 1.65; }
  .hero-cta { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
  .hero-note { color: var(--text-3); font-size: 0.8rem; margin-top: 18px; }

  .hero-preview { margin-top: 54px; perspective: 1200px; }
  .preview-card { text-align: left; max-width: 560px; margin: 0 auto; transform: rotateX(6deg); box-shadow: var(--shadow-lg); }
  .preview-q { font-size: 1rem; font-weight: 700; line-height: 1.5; margin-bottom: 16px; }
  .preview-line { font-size: 0.85rem; color: var(--text-2); line-height: 1.6; padding-top: 11px; margin-top: 11px; border-top: 1px dashed var(--border); }
  .preview-k { display: block; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 4px; }
  .preview-foot { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border); }

  .landing-section { max-width: 1160px; margin: 0 auto; padding: clamp(40px, 7vw, 80px) clamp(16px, 5vw, 32px) 0; text-align: center; }
  .section-title { font-size: clamp(1.5rem, 3.6vw, 2.3rem); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 38px; }
  .feature-grid { text-align: left; }
  .feature-icon { width: 46px; height: 46px; border-radius: 14px; display: grid; place-items: center; font-size: 1.35rem; margin-bottom: 15px; }
  .feature-title { font-size: 1rem; font-weight: 700; margin-bottom: 8px; }
  .feature-text { font-size: 0.86rem; color: var(--text-3); line-height: 1.65; }

  .step-card { text-align: left; padding: 26px 22px; border-radius: var(--r-lg); border: 1px dashed var(--border-strong); background: var(--surface); }
  .step-num { font-family: var(--font-display); font-size: 2.1rem; font-weight: 800; letter-spacing: -0.04em;
    background: var(--grad-text); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    display: block; margin-bottom: 10px; }

  .cta-band { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap;
    text-align: left; padding: clamp(24px, 4vw, 40px); background: var(--surface-2); border-color: var(--border-strong); }
  .cta-title { font-size: clamp(1.3rem, 3vw, 1.8rem); font-weight: 800; letter-spacing: -0.02em; }

  .landing-footer { max-width: 1160px; margin: 0 auto; width: 100%; margin-top: 70px;
    padding: 26px clamp(16px, 5vw, 32px); border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }

  @media (max-width: 760px) {
    .feature-grid { grid-template-columns: 1fr !important; }
    .preview-card { transform: none; }
    .cta-band { flex-direction: column; align-items: stretch; text-align: center; }
  }
  @media (max-width: 460px) {
    .landing-login { display: none; }
    .hero-cta .btn { width: 100%; }
  }
`;
