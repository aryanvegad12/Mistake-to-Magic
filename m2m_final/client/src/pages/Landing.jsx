import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#0f0c29 0%,#302b63 40%,#24243e 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 48px', position: 'relative', zIndex: 10 },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 10 },
  logoText: { fontSize: '1.5rem', fontWeight: 900, background: 'linear-gradient(90deg,#ff6b6b,#ffd93d,#6bcb77,#4d96ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: 1, textTransform: 'uppercase' },
  navLinks: { display: 'flex', gap: 10 },
  navLink: { color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '7px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)', background: 'none', transition: 'all 0.3s', textDecoration: 'none' },
  hero: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 24px 60px', position: 'relative', zIndex: 10 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 50, padding: '8px 20px', color: '#ffd93d', fontSize: '0.85rem', fontWeight: 600, marginBottom: 28 },
  h1: { fontSize: 'clamp(2rem,5.5vw,4rem)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 20 },
  highlight: { background: 'linear-gradient(90deg,#ff6b6b,#ffd93d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  sub: { fontSize: 'clamp(1rem,2.5vw,1.25rem)', color: '#c5b8ff', marginBottom: 36, fontStyle: 'italic' },
  featureList: { listStyle: 'none', marginBottom: 48, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 580, textAlign: 'left' },
  featureItem: { display: 'flex', alignItems: 'flex-start', gap: 12, color: '#e0e0ff', fontSize: '0.95rem', lineHeight: 1.6 },
  tick: { width: 26, height: 26, minWidth: 26, background: 'linear-gradient(135deg,#6bcb77,#4d96ff)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff', fontWeight: 700 },
  btnRow: { display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 12, padding: '16px 42px', background: 'linear-gradient(135deg,#ff6b6b,#ffd93d)', color: '#1a1a2e', fontSize: '1rem', fontWeight: 800, border: 'none', borderRadius: 60, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 8px 30px rgba(255,107,107,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, textDecoration: 'none' },
  btnSecondary: { display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', background: 'transparent', color: '#fff', fontSize: '0.95rem', fontWeight: 700, border: '2px solid rgba(255,255,255,0.3)', borderRadius: 60, cursor: 'pointer', transition: 'all 0.3s', textDecoration: 'none' },
  footer: { display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap', padding: '24px 40px', background: 'rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 10 },
  statItem: { textAlign: 'center' },
  statNum: { fontSize: '1.7rem', fontWeight: 800, color: '#ffd93d' },
  statLabel: { fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }
};

const FEATURES = [
  'Log mistakes subject-wise — Physics, Chemistry, Maths, Biology, English & Computer',
  'AI-powered insights reveal your weak areas and study patterns instantly',
  'Full analytics with charts — see exactly where you need to improve',
];

export default function Landing() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 3 + 1, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      color: ['#a78bfa','#ff6b6b','#ffd93d','#6bcb77','#5dade2'][Math.floor(Math.random()*5)],
      opacity: Math.random() * 0.5 + 0.2
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2,'0');
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div style={S.page}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      <nav style={S.nav}>
        <div style={S.logoWrap}>
          <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 8px rgba(255,200,50,0.8))' }}>🎯</span>
          <span style={S.logoText}>Mistake To Magic</span>
        </div>
        <div className="landing-nav-links">
          <Link to="/login" style={S.navLink}>Login</Link>
          <Link to="/register" style={{ ...S.navLink, background: 'rgba(167,139,250,0.2)', borderColor: '#a78bfa', color: '#a78bfa' }}>Register Free</Link>
        </div>
      </nav>

      <main style={S.hero}>
        <div style={S.badge}><i className="fas fa-graduation-cap" /> For Class 11 &amp; 12 — Board, JEE &amp; NEET</div>
        <h1 style={S.h1}>Track. Analyse.<br /><span style={S.highlight}>Master Every Mistake.</span></h1>
        <p style={S.sub}>"Turn every exam mistake into your next biggest strength."</p>
        <ul style={S.featureList}>
          {FEATURES.map((f, i) => (
            <li key={i} style={S.featureItem}>
              <span style={S.tick}><i className="fas fa-check" /></span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div style={S.btnRow}>
          <Link to="/register" style={S.btnPrimary}><i className="fas fa-rocket" /> Get Started Free</Link>
          <Link to="/login" style={S.btnSecondary}><i className="fas fa-sign-in-alt" /> Login</Link>
        </div>
      </main>

      <footer style={S.footer}>
        {[['6','SUBJECTS'],['∞','MISTAKES TRACKED'],['100%','FREE & PRIVATE'],['Cloud','SECURED DATA']].map(([n,l]) => (
          <div key={l} style={S.statItem}><div style={S.statNum}>{n}</div><div style={S.statLabel}>{l}</div></div>
        ))}
      </footer>
    </div>
  );
}
