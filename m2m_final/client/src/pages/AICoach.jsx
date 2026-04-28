import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const QUOTES = [
  '"Your mistake log is your personal exam syllabus." — M2M',
  '"Toppers don\'t make fewer mistakes — they analyse more." — M2M',
  '"One logged mistake today = one less wrong answer on exam day." — M2M',
  '"Pattern found → concept fixed → marks gained." — M2M',
];

// Subject-specific quick fix tips (very practical)
const SUBJECT_TIPS = {
  Physics: [
    { icon:'⚡', action:'Right now', tip:'Write every formula used today on one sticky note. Pin it on your desk.' },
    { icon:'📐', action:'This week',  tip:'Solve 5 numerical of the same type where you went wrong — vary only numbers, not method.' },
    { icon:'🔁', action:'Before exam', tip:'Redo every High-severity Physics mistake. If you can\'t solve it fresh, re-learn that concept.' },
  ],
  Chemistry: [
    { icon:'🧪', action:'Right now', tip:'Make a reactions table: Reactants → Products → Conditions. One row per missed reaction.' },
    { icon:'📋', action:'This week',  tip:'Colour-code organic mechanisms. Same arrow colour = same mechanism type.' },
    { icon:'🔁', action:'Before exam', tip:'Read NCERT examples for every concept mistake — board setters copy from there directly.' },
  ],
  Maths: [
    { icon:'✏️', action:'Right now', tip:'Redo the exact question you got wrong — same numbers, by hand, without looking at solution.' },
    { icon:'⏱️', action:'This week',  tip:'Solve 3 similar problems daily with a 10-min timer per problem.' },
    { icon:'📊', action:'Before exam', tip:'List all formula errors. Derive each formula from scratch once — never forget it again.' },
  ],
  Biology: [
    { icon:'🗺️', action:'Right now', tip:'Draw the diagram/cycle where you made the mistake — label every part.' },
    { icon:'📖', action:'This week',  tip:'For every concept mistake, read that NCERT paragraph and write a 3-line summary.' },
    { icon:'🔁', action:'Before exam', tip:'Make flashcards for all Latin terms and definitions where you scored zero.' },
  ],
  English: [
    { icon:'✍️', action:'Right now', tip:'Write the correct sentence structure 5 times immediately after logging the mistake.' },
    { icon:'📚', action:'This week',  tip:'Read 1 editorial daily — circle unfamiliar words and use them in writing practice.' },
    { icon:'📝', action:'Before exam', tip:'Practice answer-writing for the exact question types where you lost marks.' },
  ],
  Accountancy: [
    { icon:'🔢', action:'Right now', tip:'Re-do the journal entry or ledger with correct rules written above each line.' },
    { icon:'📊', action:'This week',  tip:'Solve 3 full format questions (Balance Sheet / P&L) from scratch daily.' },
    { icon:'✅', action:'Before exam', tip:'List every format rule you break. Write the rule and an example for each.' },
  ],
};

const DEFAULT_TIPS = [
  { icon:'📝', action:'Right now',   tip:'Redo the exact question you got wrong before moving to the next topic.' },
  { icon:'🔁', action:'This week',   tip:'Revise mistakes from 7 days ago — check if you\'d still make them.' },
  { icon:'📊', action:'Before exam', tip:'Sort your mistakes by severity. Fix all High ones first, then Medium.' },
];

export default function AICoach() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [quote]               = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    api.get('/analytics/summary')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(()  => setLoading(false));
  }, []);

  // ── Build data-driven action cards ──────────────────────────────────
  const buildActions = () => {
    if (!data) return [];
    const s       = data.summary;
    const actions = [];

    // 1. Revision due — most urgent
    if (s.dueForRevision > 0) {
      actions.push({
        priority: 'urgent',
        title:    `${s.dueForRevision} mistake${s.dueForRevision > 1 ? 's' : ''} pending revision`,
        action:   'Open Journal → Due Only and revise them now.',
        cta:      'Go to Journal',
        ctaPath:  '/journal',
        color:    '#ff6b6b',
        bg:       'rgba(255,107,107,0.1)',
        border:   'rgba(255,107,107,0.35)',
        icon:     '🔔',
      });
    }

    // 2. Weakest subject
    if (data.bySubject?.[0]) {
      const sub   = data.bySubject[0]._id;
      const count = data.bySubject[0].count;
      actions.push({
        priority: 'high',
        title:    `${sub} needs attention — ${count} mistakes`,
        action:   `Filter Journal by ${sub}. Fix top 3 High-severity ones today.`,
        cta:      `Open ${sub} mistakes`,
        ctaPath:  `/journal?subject=${sub}`,
        color:    '#ffd93d',
        bg:       'rgba(255,217,61,0.08)',
        border:   'rgba(255,217,61,0.35)',
        icon:     '⚠️',
      });
    }

    // 3. Most repeated mistake type
    if (data.byType?.[0]) {
      const TYPE_FIX = {
        'Calculation':       'Use rough space for every step. Never skip intermediate lines.',
        'Concept':           'Mark the concept in your textbook. Re-read + solve 3 examples.',
        'Question Reading':  'Underline keywords before you write a single number.',
        'Formula':           'Add this formula to your formula sheet. Revise it 3× today.',
        'Silly':             'Add a 2-minute end-check to every test: units, signs, decimal.',
        'Time Management':   'Practice this question type with a 5-min timer daily.',
        'Other':             'Re-do the question without looking at your notes.',
      };
      const t = data.byType[0]._id;
      actions.push({
        priority: 'medium',
        title:    `"${t}" mistakes dominate — ${data.byType[0].count} total`,
        action:   TYPE_FIX[t] || TYPE_FIX['Other'],
        cta:      `Filter by ${t}`,
        ctaPath:  `/journal?type=${t}`,
        color:    '#a78bfa',
        bg:       'rgba(167,139,250,0.08)',
        border:   'rgba(167,139,250,0.3)',
        icon:     '🎯',
      });
    }

    // 4. Low activity this week
    if (s.total > 0 && s.thisWeek < 3) {
      actions.push({
        priority: 'medium',
        title:    `Only ${s.thisWeek} mistake${s.thisWeek !== 1 ? 's' : ''} logged this week`,
        action:   'Log at least 1 mistake per study session. 5 mins of logging = hours of exam prep.',
        cta:      'Log a Mistake',
        ctaPath:  '/dashboard',
        color:    '#6bcb77',
        bg:       'rgba(107,203,119,0.08)',
        border:   'rgba(107,203,119,0.3)',
        icon:     '📈',
      });
    }

    return actions;
  };

  // ── Subject-specific tips based on weakest subject ───────────────────
  const weakestSub = data?.bySubject?.[0]?._id;
  const practicalTips = SUBJECT_TIPS[weakestSub] || DEFAULT_TIPS;

  const actions = buildActions();

  // Severity breakdown for progress bars
  const sevData  = data?.bySeverity || [];
  const highCount   = sevData.find(s => s._id === 'High')?.count   || 0;
  const medCount    = sevData.find(s => s._id === 'Medium')?.count  || 0;
  const lowCount    = sevData.find(s => s._id === 'Low')?.count     || 0;
  const totalSev    = highCount + medCount + lowCount || 1;

  return (
    <div style={{ background:'linear-gradient(135deg,#0f0c29 0%,#1e1b4b 50%,#1a1a2e 100%)', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <Navbar />

      <div style={{ padding:'clamp(14px,3vw,24px) clamp(14px,4vw,28px)', flex:1, maxWidth:1100, margin:'0 auto', width:'100%', display:'flex', flexDirection:'column', gap:16 }}>

        {/* Quote strip */}
        <div style={{ borderLeft:'4px solid #a78bfa', borderRadius:'0 10px 10px 0', padding:'12px 18px', background:'rgba(167,139,250,0.08)' }}>
          <p style={{ color:'#c5b8ff', fontSize:'0.9rem', fontStyle:'italic', fontWeight:600 }}>{quote}</p>
        </div>

        {/* Header row */}
        <div style={{ display:'flex', alignItems:'center', gap:14, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'16px 20px' }}>
          <div style={{ width:48, height:48, background:'linear-gradient(135deg,#a78bfa,#7c3aed)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0, boxShadow:'0 0 18px rgba(167,139,250,0.5)' }}>🤖</div>
          <div>
            <h3 style={{ color:'#fff', fontSize:'0.95rem', fontWeight:700, marginBottom:3 }}>
              {user?.name?.split(' ')[0]}'s AI Coach Report
            </h3>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.8rem' }}>
              Based on {data?.summary?.total || 0} logged mistakes · Updated live
            </p>
          </div>
          {data?.summary?.total > 0 && (
            <div style={{ marginLeft:'auto', display:'flex', gap:10, flexWrap:'wrap' }}>
              {[
                { label:'This Week', val: data.summary.thisWeek,      color:'#6bcb77' },
                { label:'Pending',   val: data.summary.dueForRevision, color:'#ff6b6b' },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ textAlign:'center', background:'rgba(255,255,255,0.06)', borderRadius:10, padding:'8px 14px' }}>
                  <div style={{ color, fontWeight:900, fontSize:'1.2rem' }}>{val}</div>
                  <div style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.68rem' }}>{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ borderTopColor:'#a78bfa' }} /></div>
        ) : data?.summary?.total === 0 ? (
          /* ── Empty state ── */
          <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'32px 24px', textAlign:'center' }}>
            <div style={{ fontSize:'3rem', marginBottom:12 }}>📭</div>
            <h3 style={{ color:'#fff', fontWeight:700, marginBottom:8 }}>No data yet</h3>
            <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.88rem', marginBottom:20 }}>
              Log your first mistake to unlock personalised AI coaching.
            </p>
            <button onClick={() => navigate('/dashboard')}
              style={{ padding:'10px 28px', background:'linear-gradient(135deg,#a78bfa,#7c3aed)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontFamily:'Poppins', cursor:'pointer', fontSize:'0.9rem' }}>
              Log First Mistake →
            </button>
          </div>
        ) : (
          <>
            {/* ── Action cards ── */}
            {actions.length > 0 && (
              <div>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>
                  🎯 Actions for You Right Now
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {actions.map((a, i) => (
                    <div key={i} style={{ background:a.bg, border:`1.5px solid ${a.border}`, borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                      <span style={{ fontSize:'1.4rem', flexShrink:0 }}>{a.icon}</span>
                      <div style={{ flex:1, minWidth:180 }}>
                        <p style={{ color:a.color, fontWeight:700, fontSize:'0.88rem', marginBottom:3 }}>{a.title}</p>
                        <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.82rem' }}>{a.action}</p>
                      </div>
                      <button onClick={() => navigate(a.ctaPath)}
                        style={{ padding:'8px 16px', background:a.color, color:'#1a1a2e', border:'none', borderRadius:8, fontWeight:700, fontFamily:'Poppins', cursor:'pointer', fontSize:'0.78rem', whiteSpace:'nowrap', flexShrink:0 }}>
                        {a.cta} →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Severity breakdown ── */}
            <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'18px 20px' }}>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:14 }}>
                📊 Mistake Severity Breakdown
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { label:'High — Fix these first', count:highCount, color:'#ff6b6b', path:'/journal?severity=High' },
                  { label:'Medium',                  count:medCount,  color:'#ffd93d', path:'/journal?severity=Medium' },
                  { label:'Low',                     count:lowCount,  color:'#6bcb77', path:'/journal?severity=Low' },
                ].map(({ label, count, color, path }) => (
                  <div key={label}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ color:'rgba(255,255,255,0.75)', fontSize:'0.82rem' }}>{label}</span>
                      <button onClick={() => navigate(path)} style={{ background:'none', border:'none', color, fontSize:'0.82rem', fontWeight:700, cursor:'pointer', fontFamily:'Poppins' }}>
                        {count} →
                      </button>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:6, height:8, overflow:'hidden' }}>
                      <div style={{ width:`${(count/totalSev)*100}%`, height:'100%', background:color, borderRadius:6, transition:'width 1s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Practical action plan for weakest subject ── */}
            <div>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:10 }}>
                ⚡ 3-Step Action Plan — {weakestSub || 'Your Studies'}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
                {practicalTips.map((tip, i) => (
                  <div key={i} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:14, padding:'16px 18px', transition:'all 0.25s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.11)'; e.currentTarget.style.transform='translateY(-3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.transform=''; }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <span style={{ fontSize:'1.4rem' }}>{tip.icon}</span>
                      <span style={{ background:'rgba(167,139,250,0.2)', color:'#a78bfa', borderRadius:20, padding:'2px 10px', fontSize:'0.7rem', fontWeight:700 }}>{tip.action}</span>
                    </div>
                    <p style={{ color:'rgba(255,255,255,0.82)', fontSize:'0.83rem', lineHeight:1.6 }}>{tip.tip}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Streak & momentum ── */}
            <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div style={{ display:'flex', align:'center', gap:12 }}>
                <span style={{ fontSize:'2rem' }}>
                  {(user?.streak || 0) >= 7 ? '🔥' : (user?.streak || 0) >= 3 ? '⚡' : '🌱'}
                </span>
                <div>
                  <p style={{ color:'#fff', fontWeight:700, fontSize:'0.9rem' }}>
                    {(user?.streak || 0) >= 7
                      ? `${user.streak}-day streak — you're in the top 10% of users!`
                      : (user?.streak || 0) >= 3
                        ? `${user.streak}-day streak — keep the habit alive!`
                        : 'Start a daily streak — log 1 mistake per day'}
                  </p>
                  <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.78rem', marginTop:2 }}>
                    Students with 7+ day streaks score 22% higher on average.
                  </p>
                </div>
              </div>
              <button onClick={() => navigate('/dashboard')}
                style={{ padding:'9px 20px', background:'linear-gradient(135deg,#a78bfa,#7c3aed)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontFamily:'Poppins', cursor:'pointer', fontSize:'0.82rem' }}>
                Log Today's Mistake →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
