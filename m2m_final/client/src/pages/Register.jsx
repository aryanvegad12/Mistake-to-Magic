import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import celebrate from '../utils/celebrate';
import { STREAMS, TARGET_EXAMS } from '../utils/subjects';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', mobile: '',
    currentClass: '', stream: 'Science (PCM)', targetExam: ['Board Exam'],
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { setAuth } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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
      celebrate({ points: 0 });
      toast.success(data.message);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <button className="icon-btn auth-theme" onClick={toggleTheme} aria-label="Toggle theme">
        <i className={`fas fa-${isDark ? 'sun' : 'moon'}`} />
      </button>

      <div className="auth-card auth-card-wide">
        <div className="auth-head">
          <div className="auth-mark">🎯</div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">Free for your first 2 months — no card needed</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="reg-row">
            <div className="field">
              <label className="label">Full name</label>
              <div className="input-icon">
                <i className="fas fa-user" />
                <input className="input" placeholder="Your name" value={form.name}
                  onChange={e => set('name', e.target.value)} required />
              </div>
            </div>
            <div className="field">
              <label className="label">Mobile number</label>
              <div className="input-icon">
                <i className="fas fa-mobile-screen" />
                <input className="input" placeholder="10-digit number" maxLength={10} inputMode="numeric"
                  value={form.mobile} onChange={e => set('mobile', e.target.value.replace(/\D/g, ''))} required />
              </div>
            </div>
          </div>

          <div className="field">
            <label className="label">Email address</label>
            <div className="input-icon">
              <i className="fas fa-envelope" />
              <input type="email" className="input" placeholder="you@email.com" value={form.email}
                onChange={e => set('email', e.target.value)} required />
            </div>
          </div>

          <div className="field">
            <label className="label">Password</label>
            <div className="input-icon">
              <i className="fas fa-lock" />
              <input type={showPass ? 'text' : 'password'} className="input" placeholder="Min. 6 characters" style={{ paddingRight: 46 }}
                value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
              <button type="button" className="input-affix" onClick={() => setShowPass(s => !s)} aria-label="Show password">
                <i className={`fas fa-eye${showPass ? '-slash' : ''}`} />
              </button>
            </div>
          </div>

          <div className="reg-row">
            <div className="field">
              <label className="label">Your class</label>
              <select className="select" value={form.currentClass} onChange={e => set('currentClass', e.target.value)} required>
                <option value="">Select class</option>
                <option value="11th">Class 11</option>
                <option value="12th">Class 12</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Stream</label>
              <select className="select" value={form.stream} onChange={e => set('stream', e.target.value)}>
                {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="field" style={{ marginBottom: 24 }}>
            <label className="label">Target exams — pick all that apply</label>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              {TARGET_EXAMS.map(exam => (
                <button key={exam} type="button" onClick={() => toggleExam(exam)}
                  className={`chip${form.targetExam.includes(exam) ? ' is-active' : ''}`}>
                  {form.targetExam.includes(exam) && <i className="fas fa-check" style={{ fontSize: '0.65rem' }} />}
                  {exam}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading
              ? <><i className="fas fa-spinner fa-spin" /> Creating account…</>
              : <><i className="fas fa-rocket" /> Start learning free</>}
          </button>
        </form>

        <p className="auth-foot">Already have an account? <Link to="/login">Login</Link></p>
        <p className="auth-foot" style={{ marginTop: 8 }}>
          <Link to="/" style={{ color: 'var(--text-3)', fontWeight: 500 }}>← Back to home</Link>
        </p>
      </div>

      <style>{`
        .auth-theme { position: fixed; top: 20px; right: 20px; z-index: 5; }
        .reg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 520px) { .reg-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
