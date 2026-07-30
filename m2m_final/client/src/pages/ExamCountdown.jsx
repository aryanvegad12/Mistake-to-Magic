import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PRESET_EXAMS = ['JEE Main', 'JEE Advanced', 'NEET UG', 'Board Exam (12th)', 'Board Exam (11th)', 'CUET', 'CAT', 'Other'];
const COLORS = ['#8b5cf6', '#ff6b6b', '#fbbf24', '#34d399', '#22d3ee', '#f472b6', '#6366f1'];

const EMPTY = { name: '', examDate: '', notes: '', color: '#8b5cf6' };

export default function ExamCountdown() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [, setTick] = useState(0);

  const fetchExams = useCallback(async () => {
    try {
      const { data } = await api.get('/exams');
      setExams(data.exams);
    } catch { toast.error('Failed to load exams.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchExams(); }, [fetchExams]);
  // keep the day counters honest across midnight
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Enter an exam name');
    if (!form.examDate) return toast.error('Select an exam date');
    if (new Date(form.examDate) <= new Date()) return toast.error('Please select a future date');
    setSaving(true);
    try {
      await api.post('/exams', form);
      toast.success(`${form.name} added to your countdown 📅`);
      setForm(EMPTY);
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add exam.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
    try {
      await api.delete(`/exams/${id}`);
      toast.success('Exam removed.');
      fetchExams();
    } catch { toast.error('Failed to delete.'); }
  };

  const daysLeft = (dateStr) => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const exam = new Date(dateStr); exam.setHours(0, 0, 0, 0);
    return Math.ceil((exam - now) / 86400000);
  };

  const urgency = (days) => {
    if (days <= 14) return { grad: 'linear-gradient(135deg,#ff6b6b,#c0392b)', label: 'Final stretch' };
    if (days <= 30) return { grad: 'linear-gradient(135deg,#fbbf24,#d35400)', label: 'One month out' };
    if (days <= 90) return { grad: 'linear-gradient(135deg,#8b5cf6,#6366f1)', label: 'Build phase' };
    return { grad: 'linear-gradient(135deg,#34d399,#10b981)', label: 'Plenty of runway' };
  };

  const upcoming = exams.filter(e => daysLeft(e.examDate) > 0);
  const past = exams.filter(e => daysLeft(e.examDate) <= 0);
  const nearest = upcoming.length ? Math.min(...upcoming.map(e => daysLeft(e.examDate))) : null;

  return (
    <div className="screen">
      <Navbar />
      <div className="page">

        <div className="page-head">
          <div>
            <h1 className="page-title">⏰ Exam Countdown</h1>
            <p className="page-sub">
              {nearest !== null
                ? `Your next exam is ${nearest} day${nearest === 1 ? '' : 's'} away`
                : 'Track every exam that matters'}
            </p>
          </div>
          {upcoming.length > 0 && <span className="pill-stat">📅 {upcoming.length} upcoming</span>}
        </div>

        {/* Add form */}
        <div className="card card-pad card-glow animate-rise" style={{ marginBottom: 26 }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 18 }}>➕ Add an exam</h2>
          <form onSubmit={handleAdd}>
            <div className="exam-row-2">
              <div className="field">
                <label className="label">Exam name</label>
                <input className="input" list="exam-presets" placeholder="e.g. JEE Main 2026"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                <datalist id="exam-presets">
                  {PRESET_EXAMS.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>
              <div className="field">
                <label className="label">Exam date</label>
                <input type="date" className="input" value={form.examDate}
                  onChange={e => setForm({ ...form, examDate: e.target.value })} required />
              </div>
            </div>

            <div className="exam-row-3">
              <div className="field">
                <label className="label">Notes (optional)</label>
                <input className="input" placeholder="e.g. mock test every Sunday before this"
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="field">
                <label className="label">Colour</label>
                <div className="row" style={{ gap: 7, paddingTop: 4 }}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={`swatch${form.color === c ? ' is-on' : ''}`} style={{ background: c }}
                      aria-label={`Colour ${c}`} />
                  ))}
                </div>
              </div>
              <div className="field" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary btn-block" disabled={saving} style={{ height: 46 }}>
                  {saving ? <><i className="fas fa-spinner fa-spin" /> Adding…</> : <><i className="fas fa-plus" /> Add exam</>}
                </button>
              </div>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="grid grid-auto">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 200 }} />)}
          </div>
        ) : exams.length === 0 ? (
          <div className="empty">
            <div className="empty-emoji">📅</div>
            <p className="empty-title">No exams added yet</p>
            <p style={{ fontSize: '0.86rem' }}>Add your board, JEE or NEET dates above to start the countdown.</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <p className="eyebrow">Upcoming</p>
                <div className="grid grid-auto" style={{ marginBottom: 30 }}>
                  {upcoming.map((exam, i) => {
                    const days = daysLeft(exam.examDate);
                    const u = urgency(days);
                    const progress = Math.max(0, Math.min(100, ((90 - days) / 90) * 100));
                    return (
                      <div key={exam._id} className={`exam-card animate-rise d${(i % 6) + 1}`} style={{ background: u.grad }}>
                        <button onClick={() => handleDelete(exam._id, exam.name)} className="exam-x" aria-label="Remove exam">
                          <i className="fas fa-xmark" />
                        </button>
                        <span className="exam-tag">{u.label}</span>
                        <h3 className="exam-name">{exam.name}</h3>
                        <div className="exam-days">{days}</div>
                        <div className="exam-days-cap">day{days === 1 ? '' : 's'} remaining</div>
                        <div className="exam-date">
                          📅 {new Date(exam.examDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                        {exam.notes && <p className="exam-note">{exam.notes}</p>}
                        {days <= 90 && (
                          <div className="exam-progress">
                            <div style={{ width: `${progress}%` }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {past.length > 0 && (
              <>
                <p className="eyebrow">Done</p>
                <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
                  {past.map(exam => (
                    <div key={exam._id} className="past-chip">
                      <span>✓ {exam.name}</span>
                      <button onClick={() => handleDelete(exam._id, exam.name)} aria-label="Remove exam">
                        <i className="fas fa-xmark" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
  .exam-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .exam-row-3 { display: grid; grid-template-columns: 1fr auto auto; gap: 14px; align-items: start; }

  .swatch { width: 27px; height: 27px; border-radius: 50%; border: 2px solid transparent; transition: transform 0.2s var(--ease), box-shadow 0.2s; }
  .swatch:hover { transform: scale(1.14); }
  .swatch.is-on { border-color: var(--text); box-shadow: 0 0 0 3px var(--surface-3); transform: scale(1.14); }

  .exam-card { position: relative; overflow: hidden; padding: 24px; border-radius: var(--r-lg); color: #fff;
    box-shadow: var(--shadow-md); transition: transform 0.28s var(--ease), box-shadow 0.28s; }
  .exam-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
  .exam-card::after { content: ''; position: absolute; right: -34px; top: -34px; width: 120px; height: 120px;
    border-radius: 50%; background: rgba(255,255,255,0.13); }

  .exam-x { position: absolute; top: 14px; right: 14px; width: 27px; height: 27px; border-radius: 50%;
    background: rgba(0,0,0,0.22); color: rgba(255,255,255,0.8); display: grid; place-items: center;
    font-size: 0.72rem; z-index: 1; transition: background 0.2s; }
  .exam-x:hover { background: rgba(0,0,0,0.42); color: #fff; }

  .exam-tag { position: relative; z-index: 1; display: inline-block; padding: 3px 11px; border-radius: var(--r-pill);
    background: rgba(255,255,255,0.2); font-size: 0.64rem; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; }
  .exam-name { position: relative; z-index: 1; font-size: 1.05rem; font-weight: 800; margin: 12px 0 14px; }
  .exam-days { font-family: var(--font-display); font-size: 3.4rem; font-weight: 800; line-height: 1; letter-spacing: -0.05em; }
  .exam-days-cap { font-size: 0.84rem; opacity: 0.85; margin-top: 4px; }
  .exam-date { font-size: 0.74rem; opacity: 0.8; margin-top: 12px; }
  .exam-note { font-size: 0.74rem; opacity: 0.75; margin-top: 6px; font-style: italic; }
  .exam-progress { margin-top: 14px; height: 6px; border-radius: var(--r-pill); background: rgba(0,0,0,0.22); overflow: hidden; }
  .exam-progress > div { height: 100%; border-radius: var(--r-pill); background: rgba(255,255,255,0.75); transition: width 1s var(--ease); }

  .past-chip { display: flex; align-items: center; gap: 11px; padding: 10px 16px; border-radius: var(--r-pill);
    background: var(--surface-2); border: 1px solid var(--border); color: var(--text-3); font-size: 0.83rem; font-weight: 600; }
  .past-chip button { color: var(--text-3); font-size: 0.72rem; transition: color 0.2s; }
  .past-chip button:hover { color: var(--coral); }

  @media (max-width: 780px) {
    .exam-row-3 { grid-template-columns: 1fr; }
  }
  @media (max-width: 520px) {
    .exam-row-2 { grid-template-columns: 1fr; }
  }
`;
