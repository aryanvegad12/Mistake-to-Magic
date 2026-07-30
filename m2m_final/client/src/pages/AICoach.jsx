import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { subjectMeta, SEVERITY_COLORS } from '../utils/subjects';

const QUOTES = [
  'Your mistake log is your personal exam syllabus.',
  "Toppers don't make fewer mistakes — they analyse more.",
  'One logged mistake today = one less wrong answer on exam day.',
  'Pattern found → concept fixed → marks gained.',
];

const SUBJECT_TIPS = {
  Physics: [
    { icon: '⚡', action: 'Right now',   tip: 'Write every formula you used today on one sticky note. Pin it above your desk.' },
    { icon: '📐', action: 'This week',   tip: 'Solve 5 numericals of the type you got wrong — vary only the numbers, not the method.' },
    { icon: '🔁', action: 'Before exam', tip: "Redo every High-severity Physics mistake. If you can't solve it fresh, relearn the concept." },
  ],
  Chemistry: [
    { icon: '🧪', action: 'Right now',   tip: 'Make a reactions table: Reactants → Products → Conditions. One row per missed reaction.' },
    { icon: '📋', action: 'This week',   tip: 'Colour-code organic mechanisms. Same arrow colour = same mechanism type.' },
    { icon: '🔁', action: 'Before exam', tip: 'Read the NCERT examples for every concept mistake — board setters copy from there.' },
  ],
  Maths: [
    { icon: '✏️', action: 'Right now',   tip: 'Redo the exact question you got wrong — same numbers, by hand, without the solution.' },
    { icon: '⏱️', action: 'This week',   tip: 'Solve 3 similar problems daily with a 10-minute timer per problem.' },
    { icon: '📊', action: 'Before exam', tip: 'List every formula error. Derive each formula from scratch once — then it sticks.' },
  ],
  Biology: [
    { icon: '🗺️', action: 'Right now',   tip: 'Draw the diagram or cycle you got wrong — label every single part.' },
    { icon: '📖', action: 'This week',   tip: 'For each concept mistake, read that NCERT paragraph and write a 3-line summary.' },
    { icon: '🔁', action: 'Before exam', tip: 'Make flashcards for every Latin term and definition where you scored zero.' },
  ],
  English: [
    { icon: '✍️', action: 'Right now',   tip: 'Write the correct sentence structure 5 times, immediately after logging it.' },
    { icon: '📚', action: 'This week',   tip: 'Read one editorial daily — circle unfamiliar words and use them in writing practice.' },
    { icon: '📝', action: 'Before exam', tip: 'Practise answer-writing for the exact question types where you lost marks.' },
  ],
  Computer: [
    { icon: '💻', action: 'Right now',   tip: "Re-type the exact code or query you got wrong from scratch — don't copy-paste." },
    { icon: '🐞', action: 'This week',   tip: 'Keep a bug log: the error message and the one-line fix, for every mistake.' },
    { icon: '🔁', action: 'Before exam', tip: 'Trace your buggy logic by hand, line by line, before checking the answer.' },
  ],
  Accountancy: [
    { icon: '🔢', action: 'Right now',   tip: 'Redo the journal entry or ledger with the correct rule written above each line.' },
    { icon: '📊', action: 'This week',   tip: 'Solve 3 full-format questions (Balance Sheet / P&L) from scratch daily.' },
    { icon: '✅', action: 'Before exam', tip: 'List every format rule you break. Write the rule and one example for each.' },
  ],
  Economics: [
    { icon: '📈', action: 'Right now',   tip: 'Redraw the curve or diagram you got wrong — label both axes and every shift.' },
    { icon: '🗂️', action: 'This week',   tip: 'Write a one-line definition for every term you mixed up. Keep them on one page.' },
    { icon: '🔁', action: 'Before exam', tip: 'Practise the numericals and "explain with an example" answers where you lost marks.' },
  ],
};

const DEFAULT_TIPS = [
  { icon: '📝', action: 'Right now',   tip: 'Redo the exact question you got wrong before moving to the next topic.' },
  { icon: '🔁', action: 'This week',   tip: "Revise mistakes from 7 days ago — check whether you'd still make them." },
  { icon: '📊', action: 'Before exam', tip: 'Sort your mistakes by severity. Fix all the High ones first, then Medium.' },
];

const TYPE_FIX = {
  'Calculation':      'Use rough space for every step. Never skip intermediate lines.',
  'Concept':          'Mark the concept in your textbook. Re-read it, then solve 3 examples.',
  'Question Reading': 'Underline the keywords before you write a single number.',
  'Formula':          'Add this formula to your formula sheet. Revise it 3× today.',
  'Language':         'Rewrite the answer in your own words, then compare it line by line with the model answer.',
  'Silly':            'Add a 2-minute end-check to every test: units, signs, decimals.',
  'Time Management':  'Practise this question type with a 5-minute timer daily.',
  'Other':            'Redo the question without looking at your notes.',
};

export default function AICoach() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    api.get('/analytics/summary')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const buildActions = () => {
    if (!data) return [];
    const s = data.summary;
    const actions = [];

    if (s.dueForRevision > 0) {
      actions.push({
        rank: 'Urgent',
        title: `${s.dueForRevision} mistake${s.dueForRevision > 1 ? 's' : ''} pending revision`,
        action: 'Open your journal and clear the due list — each one is +5 points.',
        cta: 'Revise now', path: '/journal?filter=due', color: 'var(--coral)', icon: '🔔',
      });
    }

    if (data.bySubject?.[0]) {
      const { _id: sub, count } = data.bySubject[0];
      actions.push({
        rank: 'High',
        title: `${sub} needs attention — ${count} mistake${count === 1 ? '' : 's'}`,
        action: `Filter the journal by ${sub} and fix the top 3 High-severity ones today.`,
        cta: `Open ${sub}`, path: `/journal?subject=${sub}`, color: 'var(--amber)', icon: '⚠️',
      });
    }

    if (data.byType?.[0]) {
      const t = data.byType[0]._id;
      actions.push({
        rank: 'Medium',
        title: `"${t}" mistakes dominate — ${data.byType[0].count} total`,
        action: TYPE_FIX[t] || TYPE_FIX.Other,
        cta: `Filter by ${t}`, path: `/journal?type=${t}`, color: 'var(--brand-soft)', icon: '🎯',
      });
    }

    if (s.total > 0 && s.thisWeek < 3) {
      actions.push({
        rank: 'Medium',
        title: `Only ${s.thisWeek} mistake${s.thisWeek === 1 ? '' : 's'} logged this week`,
        action: 'Log at least one per study session. 5 minutes of logging beats an hour of re-reading.',
        cta: 'Log a mistake', path: '/dashboard', color: 'var(--green)', icon: '📈',
      });
    }

    return actions;
  };

  const weakestSub = data?.bySubject?.[0]?._id;
  const practicalTips = SUBJECT_TIPS[weakestSub] || DEFAULT_TIPS;
  const actions = buildActions();

  const sev = data?.bySeverity || [];
  const sevCount = (n) => sev.find(x => x._id === n)?.count || 0;
  const sevTotal = Math.max(1, sevCount('High') + sevCount('Medium') + sevCount('Low'));
  const streak = user?.streak || 0;

  return (
    <div className="screen">
      <Navbar />
      <div className="page page-narrow">

        {/* Coach header */}
        <div className="card card-pad card-glow coach-head animate-rise">
          <div className="coach-orb">🤖</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              {user?.name?.split(' ')[0]}'s coach report
            </h1>
            <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginTop: 4 }}>
              Built from {data?.summary?.total || 0} logged mistake{data?.summary?.total === 1 ? '' : 's'} · updates live
            </p>
          </div>
          {data?.summary?.total > 0 && (
            <div className="row" style={{ gap: 9 }}>
              <div className="mini-stat"><strong style={{ color: 'var(--green)' }}>{data.summary.thisWeek}</strong><span>This week</span></div>
              <div className="mini-stat"><strong style={{ color: 'var(--coral)' }}>{data.summary.dueForRevision}</strong><span>Pending</span></div>
            </div>
          )}
        </div>

        <blockquote className="quote animate-rise d1">“{quote}”</blockquote>

        {loading ? (
          <div className="loading-block"><div className="spinner" /></div>
        ) : data?.summary?.total === 0 ? (
          <div className="card card-pad empty animate-rise">
            <div className="empty-emoji">🤖</div>
            <p className="empty-title">Nothing to coach yet</p>
            <p style={{ fontSize: '0.87rem', marginBottom: 22 }}>
              Log your first mistake and I'll build a personalised plan from it.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              <i className="fas fa-bolt" /> Log first mistake
            </button>
          </div>
        ) : (
          <>
            {actions.length > 0 && (
              <section style={{ marginTop: 22 }}>
                <p className="eyebrow">🎯 Do these next</p>
                <div className="stack" style={{ gap: 11 }}>
                  {actions.map((a, i) => (
                    <div key={i} className={`action-card animate-rise d${i + 1}`}
                      style={{ borderColor: `color-mix(in srgb, ${a.color} 40%, transparent)`, background: `color-mix(in srgb, ${a.color} 9%, transparent)` }}>
                      <span className="action-icon">{a.icon}</span>
                      <div style={{ flex: 1, minWidth: 190 }}>
                        <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                          <span className="tag" style={{ background: `color-mix(in srgb, ${a.color} 22%, transparent)`, color: a.color }}>{a.rank}</span>
                        </div>
                        <p style={{ color: a.color, fontWeight: 800, fontSize: '0.9rem', marginBottom: 4 }}>{a.title}</p>
                        <p style={{ color: 'var(--text-2)', fontSize: '0.83rem', lineHeight: 1.6 }}>{a.action}</p>
                      </div>
                      <button onClick={() => navigate(a.path)} className="btn btn-sm"
                        style={{ background: a.color, color: '#12121f', fontWeight: 800 }}>
                        {a.cta} <i className="fas fa-arrow-right" style={{ fontSize: '0.65rem' }} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section style={{ marginTop: 26 }}>
              <p className="eyebrow">📊 Severity breakdown</p>
              <div className="card card-pad stack" style={{ gap: 15 }}>
                {['High', 'Medium', 'Low'].map(name => {
                  const count = sevCount(name);
                  return (
                    <div key={name}>
                      <div className="row-between" style={{ marginBottom: 7 }}>
                        <span style={{ fontSize: '0.83rem', fontWeight: 600 }}>
                          {name}{name === 'High' && <span style={{ color: 'var(--text-3)', fontWeight: 500 }}> — fix these first</span>}
                        </span>
                        <button onClick={() => navigate(`/journal?severity=${name}`)}
                          style={{ color: SEVERITY_COLORS[name], fontSize: '0.83rem', fontWeight: 800 }}>
                          {count} →
                        </button>
                      </div>
                      <div className="progress">
                        <div className="progress-bar" style={{ width: `${(count / sevTotal) * 100}%`, background: SEVERITY_COLORS[name] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section style={{ marginTop: 26 }}>
              <p className="eyebrow">
                ⚡ 3-step plan
                <span style={{ color: weakestSub ? subjectMeta(weakestSub).color : 'var(--brand-soft)', textTransform: 'none', letterSpacing: 0 }}>
                  {weakestSub || 'Your studies'}
                </span>
              </p>
              <div className="grid grid-3">
                {practicalTips.map((tip, i) => (
                  <div key={i} className={`card card-pad card-hover animate-rise d${i + 1}`}>
                    <div className="row" style={{ gap: 9, marginBottom: 11 }}>
                      <span style={{ fontSize: '1.4rem' }}>{tip.icon}</span>
                      <span className="tag tag-brand">{tip.action}</span>
                    </div>
                    <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.65 }}>{tip.tip}</p>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ marginTop: 26 }}>
              <div className="card card-pad row-between" style={{ gap: 16 }}>
                <div className="row" style={{ gap: 14 }}>
                  <span style={{ fontSize: '2.1rem', filter: 'drop-shadow(0 0 14px rgba(255,150,60,0.5))' }}>
                    {streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '🌱'}
                  </span>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '0.93rem' }}>
                      {streak >= 7
                        ? `${streak}-day streak — you're in the top 10% of users!`
                        : streak >= 3
                          ? `${streak}-day streak — keep the habit alive!`
                          : 'Start a daily streak — log one mistake per day'}
                    </p>
                    <p style={{ color: 'var(--text-3)', fontSize: '0.79rem', marginTop: 3 }}>
                      Consistency beats intensity. One entry a day is enough.
                    </p>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                  <i className="fas fa-bolt" /> Log today's mistake
                </button>
              </div>
            </section>
          </>
        )}
      </div>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
  .coach-head { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  .coach-orb { width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; font-size: 1.6rem;
    background: var(--grad-brand); box-shadow: var(--ring-brand); flex-shrink: 0; }

  .quote { margin-top: 16px; padding: 14px 20px; border-left: 3px solid var(--brand);
    border-radius: 0 var(--r-md) var(--r-md) 0; background: color-mix(in srgb, var(--brand) 9%, transparent);
    color: var(--brand-soft); font-size: 0.9rem; font-style: italic; font-weight: 600; }

  .action-card { display: flex; align-items: center; gap: 15px; flex-wrap: wrap;
    padding: 16px 18px; border: 1.5px solid; border-radius: var(--r-md);
    transition: transform 0.22s var(--ease); }
  .action-card:hover { transform: translateX(4px); }
  .action-icon { font-size: 1.5rem; flex-shrink: 0; }

  .mini-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 74px;
    padding: 10px 14px; border-radius: var(--r-md); background: var(--surface-2); border: 1px solid var(--border); }
  .mini-stat strong { font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; }
  .mini-stat span { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-3); }
`;
