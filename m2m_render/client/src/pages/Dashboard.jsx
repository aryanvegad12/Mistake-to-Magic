import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ── All subjects with their colours & icons ──────────────────────────
const ALL_SUBJECTS = {
  Physics:  { color:'#e74c3c', icon:'⚛️' },
  Chemistry:{ color:'#8e44ad', icon:'🧪' },
  Maths:    { color:'#2980b9', icon:'📐' },
  Biology:  { color:'#27ae60', icon:'🌿' },
  English:  { color:'#d35400', icon:'✍️' },
};

// ── Which subjects show for each stream ──────────────────────────────
const STREAM_SUBJECTS = {
  'Science (PCM)':  ['Physics','Chemistry','Maths','English'],
  'Science (PCB)':  ['Physics','Chemistry','Biology','English'],
  'Science (PCMB)': ['Physics','Chemistry','Maths','Biology','English'],
};

const TYPES      = ['Calculation','Concept','Question Reading','Formula','Language','Silly','Time Management','Other'];
const SEVERITIES = ['Low','Medium','High'];

const ACHIEVEMENTS_DEF = [
  { id:'first_mistake',    icon:'🌱', label:'First Step',   desc:'Log first mistake'       },
  { id:'ten_mistakes',     icon:'🔥', label:'On Fire!',     desc:'Log 10 mistakes'         },
  { id:'fifty_mistakes',   icon:'⭐', label:'Star Student', desc:'Log 50 mistakes'         },
  { id:'hundred_mistakes', icon:'🏆', label:'Champion',     desc:'Log 100 mistakes'        },
  { id:'all_subjects',     icon:'🌈', label:'All-Rounder',  desc:'Log in all 6 subjects'  },
];

// ── Inline responsive CSS ────────────────────────────────────────────
const RESPONSIVE_CSS = `
  .dash-wrap    { padding: 20px 28px; flex: 1; max-width: 1400px; margin: 0 auto; width: 100%; }
  .dash-grid    { display: grid; grid-template-columns: 1fr 360px; gap: 22px; }
  .stats-grid   { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .form-row-2   { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .form-row-3   { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .welcome-bar  { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .welcome-stats{ display: flex; gap: 12px; flex-wrap: wrap; }

  @media (max-width: 1100px) {
    .dash-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 768px) {
    .dash-wrap  { padding: 14px 16px; }
    .form-row-3 { grid-template-columns: 1fr 1fr; }
    .welcome-stats { gap: 8px; }
  }
  @media (max-width: 500px) {
    .dash-wrap  { padding: 10px; }
    .form-row-2 { grid-template-columns: 1fr; }
    .form-row-3 { grid-template-columns: 1fr; }
  }
`;

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const streamSubjects = STREAM_SUBJECTS[user?.stream] || Object.keys(ALL_SUBJECTS);
  const [activeSubject, setActiveSubject] = useState(streamSubjects[0]);
  const [stats,    setStats]   = useState({ total:0, subjectCount:0 });
  const [recent,   setRecent]  = useState([]);
  const [dueCount, setDueCount] = useState(0);
  const [saving,   setSaving]  = useState(false);
  const [form,     setForm]    = useState({
    topic:'', whereHappened:'', mistakeType:'', severity:'Medium',
    whatWentWrong:'', correctMethod:'', howToAvoid:'', tags:''
  });

  // Reset active subject when stream changes
  useEffect(() => {
    const subs = STREAM_SUBJECTS[user?.stream] || Object.keys(ALL_SUBJECTS);
    setActiveSubject(subs[0]);
  }, [user?.stream]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const loadStats = useCallback(async () => {
    try {
      const [allRes, subRes, dueRes] = await Promise.all([
        api.get('/mistakes?limit=6'),
        api.get(`/mistakes?subject=${activeSubject}&limit=1`),
        api.get('/mistakes/due'),
      ]);
      const today = new Date().toDateString();
      const todayCount = allRes.data.mistakes.filter(
        m => new Date(m.createdAt).toDateString() === today
      ).length;
      setStats({ total: allRes.data.total, today: todayCount, subjectCount: subRes.data.total });
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
      const payload = {
        ...form, subject: activeSubject,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      await api.post('/mistakes', payload);
      toast.success(`✅ Logged in ${activeSubject}! +10 pts 🎯`);
      setForm({ topic:'', whereHappened:'', mistakeType:'', severity:'Medium',
                whatWentWrong:'', correctMethod:'', howToAvoid:'', tags:'' });
      loadStats();
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save. Try again.');
    } finally { setSaving(false); }
  };

  const activeColor = ALL_SUBJECTS[activeSubject]?.color || '#a78bfa';
  const activeIcon  = ALL_SUBJECTS[activeSubject]?.icon  || '📚';

  const inp = {
    width:'100%', padding:'10px 12px', border:'1.5px solid #e5e7f0',
    borderRadius:10, fontSize:'0.87rem', fontFamily:'Poppins',
    color:'#1a1a2e', background:'#f8f9ff', outline:'none', transition:'all 0.3s'
  };
  const lbl = { display:'block', fontSize:'0.78rem', fontWeight:700, color:'#6060a0', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.3px' };
  const onFocus = e => { e.target.style.borderColor='#a78bfa'; e.target.style.background='#fff'; };
  const onBlur  = e => { e.target.style.borderColor='#e5e7f0'; e.target.style.background='#f8f9ff'; };

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>
      <div style={{ background:'#f0f2ff', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <Navbar />

        <div className="dash-wrap">

          {/* ── Welcome strip ── */}
          <div style={{ background:'linear-gradient(135deg,#1a1a2e,#302b63)', borderRadius:18, padding:'18px 22px', marginBottom:18 }}>
            <div className="welcome-bar">
              <div>
                <h2 style={{ color:'#fff', fontWeight:800, fontSize:'clamp(1rem,2.5vw,1.2rem)', marginBottom:4 }}>
                  Hello, {user?.name?.split(' ')[0]}! 👋
                </h2>
                <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.82rem' }}>
                  {user?.currentClass} · {user?.stream} · 🎯 {user?.targetExam?.join(', ')}
                </p>
              </div>
              <div className="welcome-stats">
                {[
                  { icon:'🔥', label:'Streak', val:`${user?.streak || 0}d`  },
                  { icon:'⭐', label:'Points', val: user?.totalPoints || 0   },
                  { icon:'📚', label:'Logged', val: stats.total              },
                ].map(({ icon, label, val }) => (
                  <div key={label} style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'8px 14px', textAlign:'center' }}>
                    <div style={{ fontSize:'1.1rem' }}>{icon}</div>
                    <div style={{ color:'#ffd93d', fontWeight:800, fontSize:'0.95rem' }}>{val}</div>
                    <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.65rem' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Revision due alert ── */}
          {dueCount > 0 && (
            <div onClick={() => navigate('/journal?filter=due')}
              style={{ background:'rgba(255,107,107,0.12)', border:'1.5px solid rgba(255,107,107,0.4)', borderRadius:12, padding:'12px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
              <span style={{ fontSize:'1.6rem' }}>🔔</span>
              <div>
                <p style={{ color:'#ff6b6b', fontWeight:700, fontSize:'0.88rem' }}>
                  {dueCount} mistake{dueCount > 1 ? 's' : ''} due for revision today!
                </p>
                <p style={{ color:'#7070a0', fontSize:'0.75rem' }}>Tap to review using spaced repetition →</p>
              </div>
            </div>
          )}

          {/* ── Subject tabs — based on user's stream ── */}
          <div style={{ marginBottom:18 }}>
            <p style={{ fontSize:'0.72rem', fontWeight:700, color:'#8080b0', textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>
              Choose Subject to Log &nbsp;
              <span style={{ color:'#c4b5fd', fontWeight:500, fontSize:'0.7rem', textTransform:'none', letterSpacing:0 }}>
                ({user?.stream})
              </span>
            </p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {streamSubjects.map(sub => {
                const active = activeSubject === sub;
                const { color, icon } = ALL_SUBJECTS[sub] || { color:'#a78bfa', icon:'📚' };
                return (
                  <button key={sub} onClick={() => setActiveSubject(sub)}
                    style={{
                      padding:'8px 16px', borderRadius:30, fontFamily:'Poppins',
                      border:`1.5px solid ${active ? 'transparent' : color+'44'}`,
                      fontSize:'0.8rem', fontWeight:700, cursor:'pointer', transition:'all 0.25s',
                      display:'flex', alignItems:'center', gap:6,
                      background: active ? color : '#fff',
                      color:       active ? '#fff' : color,
                      boxShadow:   active ? `0 6px 18px ${color}55` : 'none',
                      transform:   active ? 'translateY(-2px)' : 'none',
                    }}>
                    {icon} {sub}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Main grid ── */}
          <div className="dash-grid">

            {/* LOG FORM */}
            <div style={{ background:'#fff', borderRadius:20, padding:'clamp(16px,3vw,28px)', boxShadow:'0 4px 20px rgba(0,0,0,0.07)' }}>
              <h3 style={{ fontWeight:800, color:'#1a1a2e', marginBottom:18, display:'flex', alignItems:'center', gap:10, fontSize:'1rem' }}>
                <span style={{ background:`linear-gradient(135deg,${activeColor},${activeColor}99)`, borderRadius:10, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>
                  {activeIcon}
                </span>
                Log Mistake —&nbsp;<span style={{ color:activeColor }}>{activeSubject}</span>
              </h3>

              <form onSubmit={handleSave}>
                <div className="form-row-2">
                  <div>
                    <label style={lbl}>Topic / Chapter</label>
                    <input style={inp} placeholder="e.g. Kinematics, Integration..." value={form.topic} onChange={e => set('topic', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                  <div>
                    <label style={lbl}>Where did it happen? *</label>
                    <input style={inp} placeholder="Chapter test, Practice paper..." value={form.whereHappened} onChange={e => set('whereHappened', e.target.value)} required onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                <div className="form-row-3">
                  <div>
                    <label style={lbl}>Mistake Type *</label>
                    <select style={{ ...inp, cursor:'pointer' }} value={form.mistakeType} onChange={e => set('mistakeType', e.target.value)} required onFocus={onFocus} onBlur={onBlur}>
                      <option value="">Select type</option>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Severity</label>
                    <select style={{ ...inp, cursor:'pointer' }} value={form.severity} onChange={e => set('severity', e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                      {SEVERITIES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Tags (comma separated)</label>
                    <input style={inp} placeholder="formula, sign, unit" value={form.tags} onChange={e => set('tags', e.target.value)} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>

                {[
                  { key:'whatWentWrong', label:'What Went Wrong? *',               placeholder:'Describe the mistake clearly...',       icon:'❌' },
                  { key:'correctMethod', label:'Correct Method / Answer *',          placeholder:'What is the right approach or answer?', icon:'✅' },
                  { key:'howToAvoid',    label:'How Will You Avoid It Next Time? *', placeholder:'My personal prevention strategy...',     icon:'🛡️' },
                ].map(({ key, label, placeholder, icon }) => (
                  <div key={key} style={{ marginBottom:14 }}>
                    <label style={lbl}>{icon} {label}</label>
                    <textarea style={{ ...inp, resize:'vertical', minHeight:68 }} placeholder={placeholder}
                      value={form[key]} onChange={e => set(key, e.target.value)} required onFocus={onFocus} onBlur={onBlur} />
                  </div>
                ))}

                <div style={{ display:'flex', gap:12, marginTop:8 }}>
                  <button type="submit" disabled={saving}
                    style={{ flex:1, padding:'12px', background:'linear-gradient(135deg,#a78bfa,#7c3aed)', color:'#fff', border:'none', borderRadius:11, fontSize:'0.9rem', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 14px rgba(124,58,237,0.4)', opacity: saving ? 0.7 : 1 }}>
                    {saving
                      ? <><i className="fas fa-spinner fa-spin" style={{ marginRight:8 }} />Saving...</>
                      : <><i className="fas fa-save"            style={{ marginRight:8 }} />Save Mistake</>}
                  </button>
                  <button type="button"
                    onClick={() => setForm({ topic:'', whereHappened:'', mistakeType:'', severity:'Medium', whatWentWrong:'', correctMethod:'', howToAvoid:'', tags:'' })}
                    style={{ padding:'12px 18px', background:'#f0f2ff', color:'#7c3aed', border:'1.5px solid #c4b5fd', borderRadius:11, fontSize:'0.88rem', fontWeight:600, cursor:'pointer' }}>
                    <i className="fas fa-eraser" style={{ marginRight:6 }} />Clear
                  </button>
                </div>
              </form>
            </div>

            {/* SIDEBAR */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Stats */}
              <div className="stats-grid">
                {[
                  { label:'Total Logged',  val: stats.total,             grad:'linear-gradient(135deg,#a78bfa,#7c3aed)', shadow:'rgba(124,58,237,0.35)' },
                  { label:'Due Revision',  val: dueCount,                grad:'linear-gradient(135deg,#ff6b6b,#ee5a24)', shadow:'rgba(238,90,36,0.35)'  },
                  { label:'This Subject',  val: stats.subjectCount,      grad:'linear-gradient(135deg,#6bcb77,#27ae60)', shadow:'rgba(39,174,96,0.35)'   },
                  { label:'Streak 🔥',     val:`${user?.streak||0}d`,    grad:'linear-gradient(135deg,#5dade2,#2980b9)', shadow:'rgba(41,128,185,0.35)'  },
                ].map(({ label, val, grad, shadow }) => (
                  <div key={label} style={{ background:grad, borderRadius:14, padding:'16px 12px', color:'#fff', boxShadow:`0 6px 18px ${shadow}`, position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', right:-10, top:-10, width:60, height:60, borderRadius:'50%', background:'rgba(255,255,255,0.12)' }} />
                    <div style={{ fontSize:'1.8rem', fontWeight:900, lineHeight:1 }}>{val}</div>
                    <div style={{ fontSize:'0.68rem', opacity:0.85, marginTop:4 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Achievements */}
              <div style={{ background:'#fff', borderRadius:18, padding:18, boxShadow:'0 4px 14px rgba(0,0,0,0.06)' }}>
                <h4 style={{ fontWeight:800, color:'#1a1a2e', marginBottom:12, fontSize:'0.88rem', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ background:'linear-gradient(135deg,#ffd93d,#f0a85a)', borderRadius:8, padding:'4px 7px', fontSize:'0.8rem' }}>🏆</span>
                  Achievements
                </h4>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                  {ACHIEVEMENTS_DEF.map(a => {
                    const unlocked = user?.achievements?.includes(a.id);
                    return (
                      <div key={a.id} title={a.desc}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:20, fontSize:'0.73rem', fontWeight:600,
                          background: unlocked ? 'linear-gradient(135deg,#ffd93d,#ff6b6b)' : '#f0f2ff',
                          color:      unlocked ? '#fff' : '#a0a0c0',
                          border:     unlocked ? 'none' : '1px dashed #c4b5fd',
                          boxShadow:  unlocked ? '0 4px 12px rgba(255,107,107,0.3)' : 'none' }}>
                        {a.icon} {a.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent mistakes */}
              <div style={{ background:'#fff', borderRadius:18, padding:18, boxShadow:'0 4px 14px rgba(0,0,0,0.06)', flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <h4 style={{ fontWeight:800, color:'#1a1a2e', fontSize:'0.88rem', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ background:'linear-gradient(135deg,#ff6b6b,#ee5a24)', borderRadius:8, padding:'4px 7px', fontSize:'0.8rem' }}>📋</span>
                    Recent Mistakes
                  </h4>
                  <button onClick={() => navigate('/journal')}
                    style={{ background:'none', border:'none', color:'#a78bfa', fontSize:'0.76rem', fontWeight:600, cursor:'pointer' }}>
                    View All →
                  </button>
                </div>

                {recent.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'18px 0', color:'#c0c0d8' }}>
                    <div style={{ fontSize:'2rem', marginBottom:6 }}>📭</div>
                    <p style={{ fontSize:'0.8rem' }}>No mistakes yet.<br />Start logging!</p>
                  </div>
                ) : recent.map(m => {
                  const { color, icon } = ALL_SUBJECTS[m.subject] || { color:'#a78bfa', icon:'📚' };
                  return (
                    <div key={m._id} onClick={() => navigate('/journal')}
                      style={{ background:'#f8f9ff', borderRadius:10, padding:'9px 11px', marginBottom:7, borderLeft:`3px solid ${color}`, cursor:'pointer' }}>
                      <div style={{ fontSize:'0.66rem', fontWeight:700, color, textTransform:'uppercase', letterSpacing:0.5, marginBottom:2 }}>
                        {icon} {m.subject}
                      </div>
                      <div style={{ fontSize:'0.81rem', color:'#1a1a2e', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {m.whatWentWrong}
                      </div>
                      <div style={{ fontSize:'0.66rem', color:'#9090b0', marginTop:2 }}>
                        {new Date(m.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
