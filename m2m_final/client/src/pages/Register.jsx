import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 28, padding: '40px 38px', width: '100%', maxWidth: 500, boxShadow: '0 25px 60px rgba(0,0,0,0.5)' },
  header: { textAlign: 'center', marginBottom: 28 },
  title: { fontSize: '1.55rem', fontWeight: 800, color: '#fff', marginBottom: 6 },
  sub: { color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  group: { marginBottom: 16 },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  wrap: { position: 'relative' },
  icon: { position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' },
  input: { width: '100%', padding: '11px 12px 11px 36px', background: 'rgba(255,255,255,0.09)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 11, color: '#fff', fontSize: '0.88rem', outline: 'none', transition: 'all 0.3s' },
  select: { width: '100%', padding: '11px 12px 11px 36px', background: 'rgba(255,255,255,0.09)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: 11, color: '#fff', fontSize: '0.88rem', outline: 'none', appearance: 'none', cursor: 'pointer' },
  btn: { width: '100%', padding: 13, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 6px 20px rgba(124,58,237,0.45)', marginTop: 8 },
  linkRow: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.83rem', marginTop: 16 },
  linkA: { color: '#a78bfa', fontWeight: 600, textDecoration: 'none' },
  subjectclass: {background:'#1a1a2e'}
};

const STREAMS = ['Science (PCM)', 'Science (PCB)', 'Science (PCMB)'];
const EXAMS = ['Board Exam','JEE Main', 'JEE Advanced', 'NEET', ];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', mobile: '', currentClass: '', stream: 'Science (PCM)', targetExam: ['Board Exam'] });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleExam = (exam) => {
    set('targetExam', form.targetExam.includes(exam)
      ? form.targetExam.filter(e => e !== exam)
      : [...form.targetExam, exam]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentClass) return toast.error('Please select your class');
    if (form.targetExam.length === 0) return toast.error('Select at least one target exam');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setAuth(data.user, data.token);
      toast.success(data.message);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const inputFocus = e => { e.target.style.borderColor = '#a78bfa'; e.target.style.background = 'rgba(255,255,255,0.13)'; };
  const inputBlur = e => { e.target.style.borderColor = 'rgba(255,255,255,0.18)'; e.target.style.background = 'rgba(255,255,255,0.09)'; };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.header}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎯</div>
          <h2 style={S.title}>Create Your Account</h2>
          <p style={S.sub}>Join thousands of students improving their scores</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-row-2">
            <div style={S.group}>
              <label style={S.label}>Full Name</label>
              <div style={S.wrap}><i className="fas fa-user" style={S.icon} />
                <input style={S.input} placeholder="Your Name" value={form.name} onChange={e => set('name', e.target.value)} required onFocus={inputFocus} onBlur={inputBlur} />
              </div>
            </div>
            <div style={S.group}>
              <label style={S.label}>Mobile Number</label>
              <div style={S.wrap}><i className="fas fa-mobile-alt" style={S.icon} />
                <input style={S.input} placeholder="10-digit number" maxLength={10} inputMode="numeric" value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g,''))} required onFocus={inputFocus} onBlur={inputBlur} />
              </div>
            </div>
          </div>

          <div style={S.group}>
            <label style={S.label}>Email Address</label>
            <div style={S.wrap}><i className="fas fa-envelope" style={S.icon} />
              <input type="email" style={S.input} placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} required onFocus={inputFocus} onBlur={inputBlur} />
            </div>
          </div>

          <div style={S.group}>
            <label style={S.label}>Password</label>
            <div style={S.wrap}><i className="fas fa-lock" style={S.icon} />
              <input type={showPass ? 'text' : 'password'} style={{ ...S.input, paddingRight: 40 }} placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} required onFocus={inputFocus} onBlur={inputBlur} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <i className={`fas fa-eye${showPass ? '-slash' : ''}`} />
              </button>
            </div>
          </div>

          <div className="auth-row-2">
            <div style={S.group}>
              <label style={S.label}>Your Class</label>
              <div style={S.wrap}><i className="fas fa-school" style={S.icon} />
                <select style={S.select} value={form.currentClass} onChange={e => set('currentClass', e.target.value)} required onFocus={inputFocus} onBlur={inputBlur}>
                  <option style={S.subjectclass} value="">Select class</option>
                  <option style={S.subjectclass} value="11th">Class 11</option>
                  <option style={S.subjectclass} value="12th">Class 12</option>
                </select>
              </div>
            </div>
            <div style={S.group}>
              <label style={S.label}>Stream</label>
              <div style={S.wrap}><i className="fas fa-book" style={S.icon} />
                <select style={S.select} value={form.stream} onChange={e => set('stream', e.target.value)} onFocus={inputFocus} onBlur={inputBlur}>
                  {STREAMS.map(s => <option key={s} value={s} style={{ background: '#1a1a2e' }}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={S.group}>
            <label style={S.label}>Target Exams (select all that apply)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EXAMS.map(exam => (
                <button key={exam} type="button" onClick={() => toggleExam(exam)}
                  style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    background: form.targetExam.includes(exam) ? 'rgba(167,139,250,0.25)' : 'transparent',
                    borderColor: form.targetExam.includes(exam) ? '#a78bfa' : 'rgba(255,255,255,0.2)',
                    color: form.targetExam.includes(exam) ? '#a78bfa' : 'rgba(255,255,255,0.5)' }}>
                  {exam}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Creating Account...</> : <><i className="fas fa-rocket" style={{ marginRight: 8 }} />Start Learning Free</>}
          </button>
        </form>

        <p style={S.linkRow}>Already have an account? <Link to="/login" style={S.linkA}>Login</Link></p>
        <p style={{ ...S.linkRow, marginTop: 6 }}><Link to="/" style={{ ...S.linkA, color: 'rgba(255,255,255,0.35)' }}>← Back to Home</Link></p>
      </div>
    </div>
  );
}
