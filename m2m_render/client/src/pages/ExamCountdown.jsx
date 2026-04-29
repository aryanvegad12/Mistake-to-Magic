import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PRESET_EXAMS = ['JEE Main','JEE Advanced','NEET UG','Board Exam (12th)','Board Exam (11th)','CUET','CAT','Other'];
const COLORS = ['#a78bfa','#ff6b6b','#ffd93d','#6bcb77','#5dade2','#f0a85a','#48c9b0'];

export default function ExamCountdown() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', examDate: '', notes: '', color: '#a78bfa' });
  const [, setTick] = useState(0);

  const fetchExams = useCallback(async () => {
    try { const { data } = await api.get('/exams'); setExams(data.exams); }
    catch { toast.error('Failed to load exams.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchExams(); }, [fetchExams]);
  useEffect(() => { const t = setInterval(() => setTick(p => p+1), 60000); return () => clearInterval(t); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Enter exam name');
    if (!form.examDate) return toast.error('Select exam date');
    if (new Date(form.examDate) <= new Date()) return toast.error('Please select a future date');
    try {
      await api.post('/exams', form);
      toast.success(`📅 ${form.name} added!`);
      setForm({ name:'', examDate:'', notes:'', color:'#a78bfa' });
      fetchExams();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add exam.'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
    try { await api.delete(`/exams/${id}`); toast.success('Exam removed.'); fetchExams(); }
    catch { toast.error('Failed to delete.'); }
  };

  const getDaysLeft = (dateStr) => {
    const now = new Date(); now.setHours(0,0,0,0);
    const exam = new Date(dateStr); exam.setHours(0,0,0,0);
    return Math.ceil((exam - now) / 86400000);
  };

  const getCardStyle = (days) => {
    if (days <= 0) return { bg:'linear-gradient(135deg,#636e72,#2d3436)', shadow:'rgba(45,52,54,0.4)', label:'Completed' };
    if (days <= 14) return { bg:'linear-gradient(135deg,#ff6b6b,#c0392b)', shadow:'rgba(192,57,43,0.5)' };
    if (days <= 30) return { bg:'linear-gradient(135deg,#f0a85a,#d35400)', shadow:'rgba(211,84,0,0.4)' };
    return { bg:'linear-gradient(135deg,#27ae60,#16a085)', shadow:'rgba(39,174,96,0.4)' };
  };

  const upcomingExams = exams.filter(e => getDaysLeft(e.examDate) > 0);
  const completedExams = exams.filter(e => getDaysLeft(e.examDate) <= 0);

  const inputStyle = { padding:'11px 13px', background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.2)', borderRadius:10, color:'#fff', fontSize:'0.88rem', fontFamily:'Poppins', outline:'none' };

  return (
    <div style={{ background:'linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%)', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <Navbar />
      <div className="page-wrap">
        <div style={{ marginBottom:24 }}>
          <h2 style={{ fontSize:'1.5rem', fontWeight:900, color:'#fff' }}>⏰ Exam Countdown</h2>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.85rem', marginTop:2 }}>Track all your upcoming exams and stay focused</p>
        </div>

        {/* Add form */}
        <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, padding:24, marginBottom:28 }}>
          <h3 style={{ color:'#ffd93d', fontSize:'1rem', fontWeight:700, marginBottom:18 }}>➕ Add New Exam</h3>
          <form onSubmit={handleAdd}>
            <div className="auth-row-2" style={{ marginBottom:14 }}>
              <div>
                <label style={{ display:'block', color:'rgba(255,255,255,0.6)', fontSize:'0.78rem', fontWeight:600, marginBottom:6 }}>Exam Name</label>
                <div style={{ position:'relative' }}>
                  <input style={{ ...inputStyle, width:'100%' }} list="exam-presets" placeholder="e.g. JEE Main 2025" value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
                  <datalist id="exam-presets">{PRESET_EXAMS.map(p => <option key={p} value={p} />)}</datalist>
                </div>
              </div>
              <div>
                <label style={{ display:'block', color:'rgba(255,255,255,0.6)', fontSize:'0.78rem', fontWeight:600, marginBottom:6 }}>Exam Date</label>
                <input type="date" style={{ ...inputStyle, width:'100%', colorScheme:'dark' }} value={form.examDate} onChange={e => setForm({...form, examDate:e.target.value})} required />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:14, alignItems:'end' }}>
              <div>
                <label style={{ display:'block', color:'rgba(255,255,255,0.6)', fontSize:'0.78rem', fontWeight:600, marginBottom:6 }}>Notes (optional)</label>
                <input style={{ ...inputStyle, width:'100%' }} placeholder="e.g. Mock test every Sunday before this" value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} />
              </div>
              <div>
                <label style={{ display:'block', color:'rgba(255,255,255,0.6)', fontSize:'0.78rem', fontWeight:600, marginBottom:6 }}>Color</label>
                <div style={{ display:'flex', gap:6 }}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({...form, color:c})}
                      style={{ width:26, height:26, borderRadius:'50%', background:c, border: form.color===c ? '3px solid #fff' : '2px solid transparent', cursor:'pointer' }} />
                  ))}
                </div>
              </div>
              <button type="submit" style={{ padding:'11px 24px', background:'linear-gradient(135deg,#ffd93d,#f0a85a)', color:'#1a1a2e', border:'none', borderRadius:10, fontSize:'0.9rem', fontWeight:800, cursor:'pointer' }}>
                Add Exam
              </button>
            </div>
          </form>
        </div>

        {loading ? <div style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ borderTopColor:'#a78bfa' }} /></div> : (
          <>
            {/* Upcoming */}
            {upcomingExams.length === 0 && completedExams.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 20px', color:'rgba(255,255,255,0.35)' }}>
                <div style={{ fontSize:'3.5rem', marginBottom:14 }}>📅</div>
                <p style={{ fontSize:'1rem', fontWeight:600 }}>No exams added yet.</p>
                <p style={{ fontSize:'0.85rem', marginTop:6 }}>Add your upcoming exams above to stay focused!</p>
              </div>
            ) : (
              <>
                {upcomingExams.length > 0 && (
                  <>
                    <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:14 }}>Upcoming Exams</p>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:18, marginBottom:28 }}>
                      {upcomingExams.map(exam => {
                        const days = getDaysLeft(exam.examDate);
                        const cs = getCardStyle(days);
                        const isUrgent = days <= 14;
                        return (
                          <div key={exam._id} style={{ background:cs.bg, borderRadius:18, padding:24, color:'#fff', position:'relative', overflow:'hidden', boxShadow:`0 8px 24px ${cs.shadow}`, animation: isUrgent ? 'pulse 2s ease-in-out infinite' : 'none' }}>
                            <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.01)}}`}</style>
                            <button onClick={() => handleDelete(exam._id, exam.name)} style={{ position:'absolute', top:12, right:14, background:'rgba(0,0,0,0.2)', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', borderRadius:'50%', width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem' }}>
                              <i className="fas fa-times" />
                            </button>
                            <div style={{ fontSize:'1.1rem', fontWeight:800, marginBottom:10 }}>📋 {exam.name}</div>
                            <div style={{ fontSize:'3.5rem', fontWeight:900, lineHeight:1 }}>{days}</div>
                            <div style={{ fontSize:'0.85rem', opacity:0.85, marginTop:4 }}>days remaining</div>
                            <div style={{ fontSize:'0.75rem', opacity:0.7, marginTop:10 }}>
                              📅 {new Date(exam.examDate).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}
                            </div>
                            {exam.notes && <div style={{ fontSize:'0.75rem', opacity:0.65, marginTop:6, fontStyle:'italic' }}>{exam.notes}</div>}
                            {days <= 30 && <div style={{ marginTop:12, background:'rgba(0,0,0,0.2)', borderRadius:6, height:6 }}>
                              <div style={{ height:6, borderRadius:6, background:'rgba(255,255,255,0.6)', width:`${Math.min(100,((30-days)/30)*100)}%`, transition:'width 1s' }} />
                            </div>}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {completedExams.length > 0 && (
                  <>
                    <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:12 }}>Past Exams</p>
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                      {completedExams.map(exam => (
                        <div key={exam._id} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 18px', color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center', gap:12 }}>
                          <span style={{ fontSize:'0.85rem', fontWeight:600 }}>✓ {exam.name}</span>
                          <button onClick={() => handleDelete(exam._id, exam.name)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:'0.75rem' }}>
                            <i className="fas fa-times" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
