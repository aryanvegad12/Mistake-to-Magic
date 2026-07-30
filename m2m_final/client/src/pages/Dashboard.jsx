import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import celebrate from '../utils/celebrate';
import { subjectMeta, subjectsForStream, MISTAKE_TYPES, SEVERITIES } from '../utils/subjects';

const ACHIEVEMENTS = [
  { id: 'first_mistake',    icon: '🌱', label: 'First Step',   desc: 'Log your first mistake' },
  { id: 'ten_mistakes',     icon: '🔥', label: 'On Fire',      desc: 'Log 10 mistakes' },
  { id: 'fifty_mistakes',   icon: '⭐', label: 'Star Student', desc: 'Log 50 mistakes' },
  { id: 'hundred_mistakes', icon: '🏆', label: 'Champion',     desc: 'Log 100 mistakes' },
  { id: 'all_subjects',     icon: '🌈', label: 'All-Rounder',  desc: 'Log in 6 different subjects' },
];

const MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365];
const nextMilestone = (streak) => MILESTONES.find(m => m > streak) || null;

const SEVERITY_HINT = { Low: 'Minor slip', Medium: 'Worth revising', High: 'Fix this first' };

const EMPTY_FORM = {
  topic: '', whereHappened: '', mistakeType: '', severity: 'Medium',
  whatWentWrong: '', correctMethod: '', howToAvoid: '', tags: '',
};

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const streamSubjects = subjectsForStream(user?.stream);
  const [activeSubject, setActiveSubject] = useState(streamSubjects[0]);
  const [stats, setStats] = useState({ total: 0, today: 0, subjectCount: 0 });
  const [recent, setRecent] = useState([]);
  const [dueCount, setDueCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setActiveSubject(subjectsForStream(user?.stream)[0]);
  }, [user?.stream]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadStats = useCallback(async () => {
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [allRes, subRes, dueRes, todayRes] = await Promise.all([
        api.get('/mistakes?limit=6'),
        api.get(`/mistakes?subject=${activeSubject}&limit=1`),
        api.get('/mistakes/due'),
        api.get(`/mistakes?limit=1&from=${startOfToday.toISOString()}`),
      ]);
      setStats({ total: allRes.data.total, today: todayRes.data.total, subjectCount: subRes.data.total });
      setRecent(allRes.data.mistakes.slice(0, 6));
      setDueCount(dueRes.data.count);
    } catch {}
  }, [activeSubject]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.whereHappened.trim()) return toast.error('Where did the mistake happen?');
    if (!form.mistakeType)          return toast.error('Please select a mistake type');
    if (!form.whatWentWrong.trim()) return toast.error('Describe what went wrong');
    if (!form.correctMethod.trim()) return toast.error('Add the correct method');
    if (!form.howToAvoid.trim())    return toast.error('How will you avoid it next time?');

    setSaving(true);
    try {
      await api.post('/mistakes', {
        ...form,
        subject: activeSubject,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      celebrate({ points: 10 });
      toast.success(`Logged in ${activeSubject}! Keep the streak alive 🔥`);
      setForm(EMPTY_FORM);
      loadStats();
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save. Try again.');
    } finally { setSaving(false); }
  };

  const { color: activeColor, icon: activeIcon } = subjectMeta(activeSubject);
  const streak = user?.streak || 0;
  const goal = nextMilestone(streak);
  const prevGoal = [...MILESTONES].reverse().find(m => m <= streak) || 0;
  const streakPct = goal ? Math.min(100, ((streak - prevGoal) / (goal - prevGoal)) * 100) : 100;
  const unlockedCount = ACHIEVEMENTS.filter(a => user?.achievements?.includes(a.id)).length;

  return (
    <div className="screen">
      <Navbar />
      <div className="page">

        {/* ── Streak hero ── */}
        <section className="hero-band card card-pad card-glow animate-rise">
          <div className="hero-band-main">
            <div className="streak-flame">
              <span className="flame-emoji">{streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '🌱'}</span>
              <div>
                <div className="streak-num">{streak}<span className="streak-unit">day{streak === 1 ? '' : 's'}</span></div>
                <div className="streak-cap">current streak</div>
              </div>
            </div>

            <div className="streak-track">
              <div className="row-between" style={{ marginBottom: 8, gap: 8 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  Hey {user?.name?.split(' ')[0]} 👋
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-3)', fontWeight: 600 }}>
                  {goal ? `${goal - streak} day${goal - streak === 1 ? '' : 's'} to your ${goal}-day badge` : 'Legend status 🏆'}
                </span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${streakPct}%`, background: 'var(--grad-hot)' }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 9 }}>
                {user?.currentClass} · {user?.stream} · 🎯 {user?.targetExam?.join(', ')}
              </p>
            </div>
          </div>

          <div className="hero-band-stats">
            {[
              { icon: '⭐', label: 'Points', val: user?.totalPoints || 0 },
              { icon: '📝', label: 'Today',  val: stats.today },
              { icon: '📚', label: 'Logged', val: stats.total },
              { icon: '🏅', label: 'Badges', val: `${unlockedCount}/${ACHIEVEMENTS.length}` },
            ].map(({ icon, label, val }) => (
              <div key={label} className="mini-stat">
                <span style={{ fontSize: '0.95rem' }}>{icon}</span>
                <strong>{val}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Revision due ── */}
        {dueCount > 0 && (
          <button onClick={() => navigate('/journal?filter=due')} className="due-alert pulse-alert animate-rise d1">
            <span style={{ fontSize: '1.5rem' }}>🔔</span>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <p style={{ color: 'var(--coral)', fontWeight: 800, fontSize: '0.9rem' }}>
                {dueCount} mistake{dueCount > 1 ? 's' : ''} due for revision today
              </p>
              <p style={{ color: 'var(--text-3)', fontSize: '0.78rem', marginTop: 2 }}>
                Revise now and earn +5 points each
              </p>
            </div>
            <i className="fas fa-arrow-right" style={{ color: 'var(--coral)' }} />
          </button>
        )}

        {/* ── Subject picker ── */}
        <div className="animate-rise d2" style={{ margin: '22px 0 18px' }}>
          <p className="eyebrow">
            Choose subject
            <span style={{ color: 'var(--brand-soft)', textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>
              {user?.stream}
            </span>
          </p>
          <div className="row" style={{ flexWrap: 'wrap', gap: 9 }}>
            {streamSubjects.map(sub => {
              const active = activeSubject === sub;
              const { color, icon } = subjectMeta(sub);
              return (
                <button key={sub} onClick={() => setActiveSubject(sub)}
                  className="chip"
                  style={active ? {
                    background: color, borderColor: 'transparent', color: '#fff',
                    boxShadow: `0 8px 22px ${color}59`, transform: 'translateY(-2px)',
                  } : { color }}>
                  {icon} {sub}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="dash-grid">

          {/* Log form */}
          <div className="card card-pad animate-rise d3">
            <div className="row" style={{ marginBottom: 22, gap: 12 }}>
              <span className="form-mark" style={{ background: `linear-gradient(135deg, ${activeColor}, ${activeColor}aa)` }}>
                {activeIcon}
              </span>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                  Log a mistake — <span style={{ color: activeColor }}>{activeSubject}</span>
                </h2>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-3)', marginTop: 2 }}>
                  Two minutes now saves marks later · +10 points
                </p>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-row-2">
                <div className="field">
                  <label className="label">Topic / chapter</label>
                  <input className="input" placeholder="e.g. Kinematics, Integration…"
                    value={form.topic} onChange={e => set('topic', e.target.value)} />
                </div>
                <div className="field">
                  <label className="label">Where did it happen? *</label>
                  <input className="input" placeholder="Chapter test, mock paper…"
                    value={form.whereHappened} onChange={e => set('whereHappened', e.target.value)} required />
                </div>
              </div>

              <div className="form-row-3">
                <div className="field">
                  <label className="label">Mistake type *</label>
                  <select className="select" value={form.mistakeType} onChange={e => set('mistakeType', e.target.value)} required>
                    <option value="">Select type</option>
                    {MISTAKE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="label">Severity</label>
                  <div className="seg">
                    {SEVERITIES.map(s => (
                      <button key={s} type="button" onClick={() => set('severity', s)}
                        title={SEVERITY_HINT[s]}
                        className={`seg-btn${form.severity === s ? ' is-on' : ''}`}
                        data-sev={s}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label className="label">Tags</label>
                  <input className="input" placeholder="formula, sign, unit"
                    value={form.tags} onChange={e => set('tags', e.target.value)} />
                </div>
              </div>

              {[
                { key: 'whatWentWrong', label: 'What went wrong? *',                 ph: 'Describe the mistake clearly…',        icon: '❌', color: 'var(--coral)' },
                { key: 'correctMethod', label: 'Correct method / answer *',           ph: 'What is the right approach?',          icon: '✅', color: 'var(--green)' },
                { key: 'howToAvoid',    label: 'How will you avoid it next time? *',  ph: 'Your personal prevention strategy…',   icon: '🛡️', color: 'var(--cyan)' },
              ].map(({ key, label, ph, icon, color }) => (
                <div className="field" key={key}>
                  <label className="label" style={{ color }}>{icon} {label}</label>
                  <textarea className="textarea" placeholder={ph}
                    value={form[key]} onChange={e => set(key, e.target.value)} required />
                </div>
              ))}

              <div className="row" style={{ gap: 12, marginTop: 6 }}>
                <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={saving}>
                  {saving
                    ? <><i className="fas fa-spinner fa-spin" /> Saving…</>
                    : <><i className="fas fa-bolt" /> Save mistake · +10</>}
                </button>
                <button type="button" className="btn btn-ghost btn-lg" onClick={() => setForm(EMPTY_FORM)}>
                  <i className="fas fa-eraser" /> Clear
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <aside className="stack animate-rise d4">
            <div className="grid grid-2" style={{ gap: 12 }}>
              {[
                { label: 'Total logged', val: stats.total,        grad: 'var(--grad-brand)', icon: '📚' },
                { label: 'Due revision', val: dueCount,           grad: 'var(--grad-hot)',   icon: '🔔' },
                { label: activeSubject,  val: stats.subjectCount, grad: 'var(--grad-green)', icon: activeIcon },
                { label: 'Streak',       val: `${streak}d`,       grad: 'var(--grad-cool)',  icon: '🔥' },
              ].map(({ label, val, grad, icon }) => (
                <div key={label} className="stat" style={{ background: grad }}>
                  <div className="stat-icon">{icon}</div>
                  <div className="stat-value">{val}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))}
            </div>

            {/* Achievements */}
            <div className="card card-pad">
              <div className="row-between" style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800 }}>🏆 Achievements</h3>
                <span className="tag tag-soft">{unlockedCount}/{ACHIEVEMENTS.length}</span>
              </div>
              <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                {ACHIEVEMENTS.map(a => {
                  const unlocked = user?.achievements?.includes(a.id);
                  return (
                    <div key={a.id} title={a.desc} className={`badge-chip${unlocked ? ' is-unlocked' : ''}`}>
                      <span style={{ fontSize: '0.95rem', filter: unlocked ? 'none' : 'grayscale(1)' }}>{a.icon}</span>
                      {a.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent */}
            <div className="card card-pad" style={{ flex: 1 }}>
              <div className="row-between" style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800 }}>📋 Recent mistakes</h3>
                <button className="btn btn-sm btn-ghost" onClick={() => navigate('/journal')}>View all</button>
              </div>

              {recent.length === 0 ? (
                <div className="empty" style={{ padding: '26px 0' }}>
                  <div className="empty-emoji" style={{ fontSize: '2.4rem' }}>📭</div>
                  <p style={{ fontSize: '0.84rem' }}>Nothing logged yet.<br />Your first entry starts the streak.</p>
                </div>
              ) : (
                <div className="stack" style={{ gap: 9 }}>
                  {recent.map(m => {
                    const { color, icon } = subjectMeta(m.subject);
                    return (
                      <button key={m._id} onClick={() => navigate('/journal')} className="recent-item" style={{ borderLeftColor: color }}>
                        <span className="recent-sub" style={{ color }}>{icon} {m.subject}</span>
                        <span className="recent-text">{m.whatWentWrong}</span>
                        <span className="recent-date">
                          {new Date(m.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
  .hero-band { display: flex; align-items: center; justify-content: space-between; gap: 26px; flex-wrap: wrap; }
  .hero-band-main { display: flex; align-items: center; gap: 24px; flex: 1; min-width: 280px; flex-wrap: wrap; }
  .streak-flame { display: flex; align-items: center; gap: 13px; }
  .flame-emoji { font-size: 2.6rem; filter: drop-shadow(0 0 16px rgba(255,150,60,0.55)); }
  .streak-num { font-family: var(--font-display); font-size: 2.5rem; font-weight: 800; line-height: 1; letter-spacing: -0.04em; }
  .streak-unit { font-size: 0.9rem; font-weight: 700; color: var(--text-3); margin-left: 7px; }
  .streak-cap { font-size: 0.68rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-3); margin-top: 4px; }
  .streak-track { flex: 1; min-width: 230px; }

  .hero-band-stats { display: flex; gap: 10px; flex-wrap: wrap; }
  .mini-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 74px;
    padding: 11px 14px; border-radius: var(--r-md); background: var(--surface-2); border: 1px solid var(--border); }
  .mini-stat strong { font-family: var(--font-display); font-size: 1.05rem; font-weight: 800; color: var(--amber); }
  .mini-stat span:last-child { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-3); }

  .due-alert { display: flex; align-items: center; gap: 14px; width: 100%; margin-top: 16px;
    padding: 14px 18px; border-radius: var(--r-md);
    background: color-mix(in srgb, var(--coral) 12%, transparent);
    border: 1.5px solid color-mix(in srgb, var(--coral) 40%, transparent);
    transition: transform 0.22s var(--ease); }
  .due-alert:hover { transform: translateX(4px); }

  .dash-grid { display: grid; grid-template-columns: minmax(0,1fr) 350px; gap: 20px; align-items: start; }
  .form-mark { width: 42px; height: 42px; border-radius: 13px; display: grid; place-items: center; font-size: 1.15rem; flex-shrink: 0; }
  .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }

  .seg { display: flex; gap: 4px; padding: 4px; border-radius: var(--r-sm); background: var(--input-bg); border: 1.5px solid var(--border); }
  .seg-btn { flex: 1; padding: 7px 4px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; color: var(--text-3); transition: all 0.2s; }
  .seg-btn:hover { color: var(--text); }
  .seg-btn.is-on[data-sev="Low"]    { background: var(--green); color: #04231a; }
  .seg-btn.is-on[data-sev="Medium"] { background: var(--amber); color: #2a1c00; }
  .seg-btn.is-on[data-sev="High"]   { background: var(--coral); color: #fff; }

  .badge-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: var(--r-pill);
    font-size: 0.75rem; font-weight: 700; background: var(--surface-2); border: 1px dashed var(--border-strong); color: var(--text-3); }
  .badge-chip.is-unlocked { background: var(--grad-hot); border: 1px solid transparent; color: #1a1a2e;
    box-shadow: 0 6px 18px rgba(255,107,107,0.32); animation: pop 0.4s var(--ease) both; }

  .recent-item { display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; width: 100%; text-align: left;
    padding: 10px 13px; border-radius: var(--r-sm); background: var(--surface-2); border-left: 3px solid;
    transition: transform 0.2s var(--ease), background 0.2s; }
  .recent-item:hover { transform: translateX(3px); background: var(--surface-3); }
  .recent-sub { font-size: 0.64rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
  .recent-date { font-size: 0.66rem; color: var(--text-3); grid-row: 1; grid-column: 2; align-self: center; }
  .recent-text { grid-column: 1 / -1; font-size: 0.83rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  @media (max-width: 1080px) { .dash-grid { grid-template-columns: 1fr; } }
  @media (max-width: 720px) {
    .form-row-3 { grid-template-columns: 1fr 1fr; }
    .hero-band-stats { width: 100%; }
    .mini-stat { flex: 1; }
  }
  @media (max-width: 520px) {
    .form-row-2, .form-row-3 { grid-template-columns: 1fr; }
    .streak-num { font-size: 2.1rem; }
  }
`;
