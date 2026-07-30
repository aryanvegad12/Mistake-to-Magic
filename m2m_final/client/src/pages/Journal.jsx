import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import toast from 'react-hot-toast';
import celebrate from '../utils/celebrate';
import { subjectMeta, SUBJECT_NAMES, MISTAKE_TYPES, SEVERITIES as SEVERITY_NAMES, SEVERITY_COLORS } from '../utils/subjects';

const SUBJECTS = ['All', ...SUBJECT_NAMES];
const TYPES = ['All', ...MISTAKE_TYPES];
const SEVERITIES = ['All', ...SEVERITY_NAMES];

// AI Coach and Analytics deep-link here as /journal?subject=Physics, ?type=Formula,
// ?severity=High — only honour values we actually offer in the filter bar.
const fromParams = (params, key, allowed) => {
  const value = params.get(key);
  return value && allowed.includes(value) ? value : 'All';
};

export default function Journal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [subject, setSubject] = useState(() => fromParams(searchParams, 'subject', SUBJECTS));
  const [type, setType] = useState(() => fromParams(searchParams, 'type', TYPES));
  const [severity, setSeverity] = useState(() => fromParams(searchParams, 'severity', SEVERITIES));
  const [dueOnly, setDueOnly] = useState(searchParams.get('filter') === 'due');
  const [expandedId, setExpandedId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const buildParams = useCallback((page, limit) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (subject !== 'All') params.set('subject', subject);
    if (type !== 'All') params.set('type', type);
    if (severity !== 'All') params.set('severity', severity);
    if (dueOnly) params.set('dueOnly', 'true');
    return params;
  }, [search, subject, type, severity, dueOnly]);

  const fetchMistakes = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/mistakes?${buildParams(page, 12)}`);
      setMistakes(data.mistakes);
      setTotal(data.total);
      setPages(data.pages);
      setCurrentPage(page);
    } catch { toast.error('Failed to load mistakes.'); }
    finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => { fetchMistakes(1); }, [fetchMistakes]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this mistake? This cannot be undone.')) return;
    try {
      await api.delete(`/mistakes/${id}`);
      toast.success('Mistake deleted.');
      fetchMistakes(currentPage);
    } catch { toast.error('Failed to delete.'); }
  };

  const handleRevise = async (id, e) => {
    try {
      await api.put(`/mistakes/${id}/revise`);
      celebrate({ points: 5, event: e });
      toast.success('Revision marked! Next one is scheduled ✅');
      fetchMistakes(currentPage);
    } catch { toast.error('Failed to mark revision.'); }
  };

  const handleFavorite = async (id, current) => {
    try {
      await api.put(`/mistakes/${id}`, { isFavorite: !current });
      setMistakes(prev => prev.map(m => (m._id === id ? { ...m, isFavorite: !current } : m)));
    } catch { toast.error('Failed to update.'); }
  };

  // Exports every mistake matching the current filters — not just the page on screen.
  const exportCSV = async () => {
    setExporting(true);
    try {
      const { data } = await api.get(`/mistakes?${buildParams(1, 5000)}`);
      const all = data.mistakes || [];
      if (!all.length) return toast.error('No data to export.');

      const headers = ['Subject','Topic','Where Happened','Type','Severity','What Went Wrong','Correct Method','How to Avoid','Tags','Times Revised','Date'];
      const rows = all.map(m => [
        m.subject, m.topic || '', m.whereHappened, m.mistakeType, m.severity,
        m.whatWentWrong, m.correctMethod, m.howToAvoid,
        (m.tags || []).join(' | '), m.revisionCount ?? 0,
        new Date(m.createdAt).toLocaleDateString('en-IN'),
      ].map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','));

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'mistake-journal.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${all.length} mistake${all.length > 1 ? 's' : ''}!`);
    } catch {
      toast.error('Failed to export.');
    } finally { setExporting(false); }
  };

  const resetFilters = () => {
    setSearch(''); setSubject('All'); setType('All'); setSeverity('All'); setDueOnly(false);
  };
  const filtersActive = search || subject !== 'All' || type !== 'All' || severity !== 'All' || dueOnly;

  const isDue = (m) => m.nextRevisionDate && new Date(m.nextRevisionDate) <= new Date();

  return (
    <div className="screen">
      <Navbar />
      <div className="page">

        <div className="page-head">
          <div>
            <h1 className="page-title">📔 Mistake Journal</h1>
            <p className="page-sub">
              {loading ? 'Loading…' : `${total} mistake${total === 1 ? '' : 's'} logged${filtersActive ? ' for this filter' : ''}`}
            </p>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button onClick={exportCSV} className="btn btn-green btn-sm" disabled={exporting}>
              <i className={`fas fa-${exporting ? 'spinner fa-spin' : 'file-arrow-down'}`} />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary btn-sm">
              <i className="fas fa-plus" /> Log new
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card card-pad filter-bar animate-rise" style={{ padding: 16 }}>
          <div className="input-icon" style={{ flex: 1, minWidth: 190 }}>
            <i className="fas fa-magnifying-glass" />
            <input className="input" placeholder="Search your mistakes…" value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchMistakes(1)} />
          </div>
          <select className="select filter-select" value={subject} onChange={e => setSubject(e.target.value)}>
            {SUBJECTS.map(s => <option key={s}>{s === 'All' ? 'All subjects' : s}</option>)}
          </select>
          <select className="select filter-select" value={type} onChange={e => setType(e.target.value)}>
            {TYPES.map(t => <option key={t}>{t === 'All' ? 'All types' : t}</option>)}
          </select>
          <select className="select filter-select" value={severity} onChange={e => setSeverity(e.target.value)}>
            {SEVERITIES.map(s => <option key={s}>{s === 'All' ? 'Any severity' : s}</option>)}
          </select>
          <button onClick={() => setDueOnly(d => !d)} className={`chip${dueOnly ? ' is-active' : ''}`}
            style={dueOnly ? { background: 'var(--grad-hot)', color: '#1a1a2e', boxShadow: '0 6px 18px rgba(255,107,107,0.35)' } : undefined}>
            🔔 Due only
          </button>
          {filtersActive && (
            <button onClick={resetFilters} className="btn btn-ghost btn-sm">
              <i className="fas fa-rotate-left" /> Reset
            </button>
          )}
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-auto" style={{ marginTop: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 210 }} />)}
          </div>
        ) : mistakes.length === 0 ? (
          <div className="empty">
            <div className="empty-emoji">📭</div>
            <p className="empty-title">No mistakes found</p>
            <p style={{ fontSize: '0.86rem' }}>
              {filtersActive
                ? <>Nothing matches this filter. <button onClick={resetFilters} style={{ color: 'var(--brand-soft)', fontWeight: 700 }}>Clear filters</button></>
                : <>Your journal is empty. <button onClick={() => navigate('/dashboard')} style={{ color: 'var(--brand-soft)', fontWeight: 700 }}>Log your first mistake</button></>}
            </p>
          </div>
        ) : (
          <div className="grid grid-auto" style={{ marginTop: 20 }}>
            {mistakes.map((m, i) => {
              const expanded = expandedId === m._id;
              const { color, icon } = subjectMeta(m.subject);
              const due = isDue(m);
              return (
                <article key={m._id} className={`card card-hover mistake-card animate-rise d${(i % 6) + 1}`} style={{ borderTopColor: color }}>
                  <div style={{ padding: '18px 18px 0' }}>
                    <div className="row-between" style={{ alignItems: 'flex-start', marginBottom: 12 }}>
                      <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                        <span className="tag" style={{ background: `${color}24`, color }}>{icon} {m.subject}</span>
                        <span className="tag tag-soft">{m.mistakeType}</span>
                        {m.severity && (
                          <span className="tag" style={{ background: `${SEVERITY_COLORS[m.severity]}24`, color: SEVERITY_COLORS[m.severity] }}>
                            {m.severity}
                          </span>
                        )}
                        {due && <span className="tag tag-hot">🔔 Revise today</span>}
                      </div>
                      <div className="row" style={{ gap: 2 }}>
                        <button onClick={() => handleFavorite(m._id, m.isFavorite)} className="card-act"
                          title="Favourite" style={{ opacity: m.isFavorite ? 1 : 0.4 }}>⭐</button>
                        <button onClick={() => handleDelete(m._id)} className="card-act card-act-danger" title="Delete">
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </div>

                    <p className="mistake-meta">
                      <i className="fas fa-location-dot" style={{ color: 'var(--coral)' }} /> {m.whereHappened}
                      {m.topic && <> · {m.topic}</>}
                    </p>

                    <p className="mistake-q">{m.whatWentWrong}</p>

                    {expanded && (
                      <div className="animate-rise">
                        <div className="mistake-block">
                          <span className="mistake-k" style={{ color: 'var(--green)' }}>✅ Correct method</span>
                          <p>{m.correctMethod}</p>
                        </div>
                        <div className="mistake-block">
                          <span className="mistake-k" style={{ color: 'var(--cyan)' }}>🛡️ How to avoid</span>
                          <p>{m.howToAvoid}</p>
                        </div>
                        {m.tags?.length > 0 && (
                          <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                            {m.tags.map(t => <span key={t} className="tag tag-brand">#{t}</span>)}
                          </div>
                        )}
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 12 }}>
                          Revised {m.revisionCount}× · Next:{' '}
                          {m.nextRevisionDate
                            ? new Date(m.nextRevisionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                            : 'N/A'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mistake-foot">
                    <button onClick={() => setExpandedId(expanded ? null : m._id)} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                      {expanded ? 'Show less' : 'Show more'}
                      <i className={`fas fa-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: '0.62rem' }} />
                    </button>
                    {due && (
                      <button onClick={(e) => handleRevise(m._id, e)} className="btn btn-green btn-sm" style={{ flex: 1 }}>
                        <i className="fas fa-check" /> Revised · +5
                      </button>
                    )}
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                      {new Date(m.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="row" style={{ justifyContent: 'center', gap: 7, marginTop: 32, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-icon" disabled={currentPage === 1}
              onClick={() => fetchMistakes(currentPage - 1)} aria-label="Previous page">
              <i className="fas fa-chevron-left" />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => fetchMistakes(p)}
                className={`btn btn-icon ${p === currentPage ? 'btn-primary' : 'btn-ghost'}`}>
                {p}
              </button>
            ))}
            <button className="btn btn-ghost btn-icon" disabled={currentPage === pages}
              onClick={() => fetchMistakes(currentPage + 1)} aria-label="Next page">
              <i className="fas fa-chevron-right" />
            </button>
          </div>
        )}
      </div>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
  .filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
  .filter-select { width: auto; min-width: 130px; flex: 0 1 auto; }

  .mistake-card { border-top: 3px solid; display: flex; flex-direction: column; overflow: hidden; }
  .card-act { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center;
    font-size: 0.85rem; color: var(--text-3); transition: all 0.2s; }
  .card-act:hover { background: var(--surface-3); color: var(--text); }
  .card-act-danger:hover { background: color-mix(in srgb, var(--coral) 18%, transparent); color: var(--coral); }

  .mistake-meta { font-size: 0.74rem; color: var(--text-3); margin-bottom: 10px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .mistake-q { font-size: 0.9rem; font-weight: 600; line-height: 1.55; margin-bottom: 12px; }
  .mistake-block { border-top: 1px dashed var(--border); padding-top: 11px; margin-top: 11px; }
  .mistake-block p { font-size: 0.83rem; color: var(--text-2); line-height: 1.65; }
  .mistake-k { display: block; font-size: 0.66rem; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; margin-bottom: 5px; }

  .mistake-foot { display: flex; align-items: center; gap: 8px; padding: 13px 18px;
    margin-top: auto; border-top: 1px solid var(--border); }

  @media (max-width: 560px) {
    .filter-select { flex: 1 1 100%; width: 100%; }
  }
`;
