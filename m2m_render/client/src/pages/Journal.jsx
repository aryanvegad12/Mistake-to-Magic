import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SUBJECTS = ['All','Physics','Chemistry','Maths','Biology','English','Computer'];
const TYPES = ['All','Calculation','Concept','Question Reading','Formula','Language','Silly','Time Management','Other'];
const SEVERITIES = ['All','Low','Medium','High'];
const SUB_COLORS = { Physics:'#e74c3c', Chemistry:'#8e44ad', Maths:'#2980b9', Biology:'#27ae60', English:'#d35400', Computer:'#16a085'};
const SUB_ICONS = { Physics:'⚛️', Chemistry:'🧪', Maths:'📐', Biology:'🌿', English:'✍️', Computer:'💻'};
const SEV_COLORS = { Low:'#6bcb77', Medium:'#ffd93d', High:'#ff6b6b' };

export default function Journal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All');
  const [type, setType] = useState('All');
  const [severity, setSeverity] = useState('All');
  const [dueOnly, setDueOnly] = useState(searchParams.get('filter') === 'due');
  const [expandedId, setExpandedId] = useState(null);

  const fetchMistakes = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.set('search', search);
      if (subject !== 'All') params.set('subject', subject);
      if (type !== 'All') params.set('type', type);
      if (severity !== 'All') params.set('severity', severity);
      if (dueOnly) params.set('dueOnly', 'true');
      const { data } = await api.get(`/mistakes?${params}`);
      setMistakes(data.mistakes);
      setTotal(data.total);
      setPages(data.pages);
      setCurrentPage(page);
    } catch { toast.error('Failed to load mistakes.'); }
    finally { setLoading(false); }
  }, [search, subject, type, severity, dueOnly]);

  useEffect(() => { fetchMistakes(1); }, [fetchMistakes]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this mistake? This cannot be undone.')) return;
    try {
      await api.delete(`/mistakes/${id}`);
      toast.success('Mistake deleted.');
      fetchMistakes(currentPage);
    } catch { toast.error('Failed to delete.'); }
  };

  const handleRevise = async (id) => {
    try {
      await api.put(`/mistakes/${id}/revise`);
      toast.success('Revision marked! +5 points ✅');
      fetchMistakes(currentPage);
    } catch { toast.error('Failed to mark revision.'); }
  };

  const handleFavorite = async (id, current) => {
    try {
      await api.put(`/mistakes/${id}`, { isFavorite: !current });
      setMistakes(prev => prev.map(m => m._id === id ? { ...m, isFavorite: !current } : m));
    } catch { toast.error('Failed to update.'); }
  };

  const exportCSV = () => {
    if (!mistakes.length) return toast.error('No data to export.');
    const headers = ['Subject','Topic','Where Happened','Type','Severity','What Went Wrong','Correct Method','How to Avoid','Date'];
    const rows = mistakes.map(m => [
      m.subject, m.topic || '', m.whereHappened, m.mistakeType, m.severity,
      m.whatWentWrong, m.correctMethod, m.howToAvoid,
      new Date(m.createdAt).toLocaleDateString('en-IN')
    ].map(c => `"${(c||'').replace(/"/g,'""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'mistake-journal.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded!');
  };

  const filterStyle = { padding:'9px 12px', border:'1.5px solid #e0e0f0', borderRadius:10, background:'#fff', fontSize:'0.82rem', fontFamily:'Poppins', color:'#1a1a2e', outline:'none', cursor:'pointer' };
  const isDue = (m) => m.nextRevisionDate && new Date(m.nextRevisionDate) <= new Date();

  return (
    <div style={{ background:'#f0f2ff', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <Navbar />
      <div className="page-wrap">

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
          <div>
            <h2 style={{ fontSize:'1.5rem', fontWeight:900, color:'#1a1a2e' }}>📔 Mistake Journal</h2>
            <p style={{ color:'#8080a0', fontSize:'0.85rem', marginTop:2 }}>{total} total mistakes logged</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={exportCSV} style={{ padding:'9px 18px', background:'linear-gradient(135deg,#6bcb77,#27ae60)', color:'#fff', border:'none', borderRadius:10, fontSize:'0.82rem', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
              <i className="fas fa-download" /> Export CSV
            </button>
            <button onClick={() => navigate('/dashboard')} style={{ padding:'9px 18px', background:'#fff', color:'#7c3aed', border:'1.5px solid #c4b5fd', borderRadius:10, fontSize:'0.82rem', fontWeight:600, cursor:'pointer' }}>
              + Log New
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="filter-bar" style={{ background:'#fff', borderRadius:14, padding:'16px 18px', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ position:'relative', flex:1, minWidth:180 }}>
            <i className="fas fa-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#b0b0c8', fontSize:'0.82rem' }} />
            <input style={{ ...filterStyle, width:'100%', paddingLeft:34 }} placeholder="Search mistakes..." value={search}
              onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && fetchMistakes(1)} />
          </div>
          <select style={filterStyle} value={subject} onChange={e => setSubject(e.target.value)}>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select style={filterStyle} value={type} onChange={e => setType(e.target.value)}>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select style={filterStyle} value={severity} onChange={e => setSeverity(e.target.value)}>
            {SEVERITIES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={() => setDueOnly(!dueOnly)} style={{ padding:'9px 14px', borderRadius:10, border:`1.5px solid ${dueOnly ? '#ff6b6b' : '#e0e0f0'}`, background: dueOnly ? 'rgba(255,107,107,0.1)' : '#fff', color: dueOnly ? '#ff6b6b' : '#7070a0', fontSize:'0.8rem', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
            🔔 Due Only {dueOnly && '✓'}
          </button>
          <button onClick={() => fetchMistakes(1)} style={{ padding:'9px 16px', background:'linear-gradient(135deg,#a78bfa,#7c3aed)', color:'#fff', border:'none', borderRadius:10, fontSize:'0.82rem', fontWeight:700, cursor:'pointer' }}>
            <i className="fas fa-search" />
          </button>
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}><div className="spinner" /></div>
        ) : mistakes.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'#b0b0c8' }}>
            <div style={{ fontSize:'3.5rem', marginBottom:14 }}>📭</div>
            <p style={{ fontSize:'1rem', fontWeight:600 }}>No mistakes found for this filter.</p>
            <p style={{ fontSize:'0.85rem', marginTop:6 }}>Try a different filter or <span style={{ color:'#a78bfa', cursor:'pointer', fontWeight:600 }} onClick={() => navigate('/dashboard')}>log a new mistake</span>.</p>
          </div>
        ) : (
          <div className="journal-grid">
            {mistakes.map(m => {
              const expanded = expandedId === m._id;
              const color = SUB_COLORS[m.subject] || '#a78bfa';
              const due = isDue(m);
              return (
                <div key={m._id} style={{ background:'#fff', borderRadius:16, boxShadow:'0 4px 14px rgba(0,0,0,0.06)', borderTop:`4px solid ${color}`, transition:'transform 0.2s,box-shadow 0.2s', overflow:'hidden' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 28px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 14px rgba(0,0,0,0.06)'; }}>
                  <div style={{ padding:'16px 16px 0' }}>
                    {/* Card header */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <span style={{ background:`${color}20`, color, padding:'3px 10px', borderRadius:20, fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase' }}>
                          {SUB_ICONS[m.subject]} {m.subject}
                        </span>
                        <span style={{ background:'#f0f2ff', color:'#7070a0', padding:'3px 10px', borderRadius:20, fontSize:'0.7rem', fontWeight:600 }}>{m.mistakeType}</span>
                        {m.severity && <span style={{ background:`${SEV_COLORS[m.severity]}20`, color:SEV_COLORS[m.severity], padding:'3px 10px', borderRadius:20, fontSize:'0.68rem', fontWeight:700 }}>{m.severity}</span>}
                        {due && <span style={{ background:'linear-gradient(135deg,#ffd93d,#ff6b6b)', color:'#fff', padding:'3px 10px', borderRadius:20, fontSize:'0.65rem', fontWeight:700 }}>🔔 Revise Today</span>}
                      </div>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => handleFavorite(m._id, m.isFavorite)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'1rem', opacity: m.isFavorite ? 1 : 0.35 }}>⭐</button>
                        <button onClick={() => handleDelete(m._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ccc', fontSize:'0.85rem', transition:'color 0.2s' }}
                          onMouseEnter={e => e.target.style.color='#e74c3c'} onMouseLeave={e => e.target.style.color='#ccc'}>
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize:'0.75rem', color:'#a0a0c0', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
                      <i className="fas fa-map-marker-alt" style={{ color:'#ff6b6b' }} /> {m.whereHappened}
                      {m.topic && <><span style={{ margin:'0 4px' }}>·</span> {m.topic}</>}
                    </div>

                    <p style={{ fontSize:'0.88rem', fontWeight:600, color:'#1a1a2e', lineHeight:1.55, marginBottom:10 }}>{m.whatWentWrong}</p>

                    {expanded && (
                      <>
                        <div style={{ borderTop:'1px dashed #eee', paddingTop:10, marginBottom:8 }}>
                          <p style={{ fontSize:'0.7rem', fontWeight:700, color:'#27ae60', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>✅ Correct Method</p>
                          <p style={{ fontSize:'0.83rem', color:'#3a3a5c', lineHeight:1.6 }}>{m.correctMethod}</p>
                        </div>
                        <div style={{ borderTop:'1px dashed #eee', paddingTop:10, marginBottom:8 }}>
                          <p style={{ fontSize:'0.7rem', fontWeight:700, color:'#2980b9', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>🛡️ How to Avoid</p>
                          <p style={{ fontSize:'0.83rem', color:'#3a3a5c', lineHeight:1.6 }}>{m.howToAvoid}</p>
                        </div>
                        {m.tags?.length > 0 && (
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
                            {m.tags.map(t => <span key={t} style={{ background:'#f0f2ff', color:'#7c3aed', padding:'2px 9px', borderRadius:20, fontSize:'0.7rem', fontWeight:600 }}>#{t}</span>)}
                          </div>
                        )}
                        <p style={{ fontSize:'0.7rem', color:'#b0b0c8', marginBottom:4 }}>
                          Revised {m.revisionCount}x · Next: {m.nextRevisionDate ? new Date(m.nextRevisionDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : 'N/A'}
                        </p>
                      </>
                    )}
                  </div>

                  <div style={{ padding:'10px 16px 14px', display:'flex', gap:8, borderTop:'1px solid #f5f5f5', marginTop:10 }}>
                    <button onClick={() => setExpandedId(expanded ? null : m._id)} style={{ flex:1, padding:'7px', background:'#f0f2ff', color:'#7c3aed', border:'none', borderRadius:8, fontSize:'0.78rem', fontWeight:600, cursor:'pointer' }}>
                      {expanded ? 'Show Less ↑' : 'Show More ↓'}
                    </button>
                    {due && (
                      <button onClick={() => handleRevise(m._id)} style={{ flex:1, padding:'7px', background:'linear-gradient(135deg,#6bcb77,#27ae60)', color:'#fff', border:'none', borderRadius:8, fontSize:'0.78rem', fontWeight:700, cursor:'pointer' }}>
                        ✓ Mark Revised
                      </button>
                    )}
                    <p style={{ fontSize:'0.68rem', color:'#c0c0d0', alignSelf:'center', marginLeft:'auto', whiteSpace:'nowrap' }}>
                      {new Date(m.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:28 }}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => fetchMistakes(p)}
                style={{ width:36, height:36, borderRadius:10, border:'1.5px solid', fontSize:'0.85rem', fontWeight:700, cursor:'pointer',
                  background: p === currentPage ? 'linear-gradient(135deg,#a78bfa,#7c3aed)' : '#fff',
                  color: p === currentPage ? '#fff' : '#7c3aed',
                  borderColor: p === currentPage ? 'transparent' : '#c4b5fd' }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
