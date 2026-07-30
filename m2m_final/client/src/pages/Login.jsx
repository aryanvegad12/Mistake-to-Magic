import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { setAuth } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.user, data.token);
      toast.success(data.message);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <button className="icon-btn auth-theme" onClick={toggleTheme} aria-label="Toggle theme">
        <i className={`fas fa-${isDark ? 'sun' : 'moon'}`} />
      </button>

      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-mark">🎯</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Your streak is waiting for you</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">Email address</label>
            <div className="input-icon">
              <i className="fas fa-envelope" />
              <input type="email" className="input" placeholder="you@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required autoComplete="email" />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 10 }}>
            <label className="label">Password</label>
            <div className="input-icon">
              <i className="fas fa-lock" />
              <input type={showPass ? 'text' : 'password'} className="input" placeholder="Your password" style={{ paddingRight: 46 }}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required autoComplete="current-password" />
              <button type="button" className="input-affix" onClick={() => setShowPass(s => !s)} aria-label="Show password">
                <i className={`fas fa-eye${showPass ? '-slash' : ''}`} />
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 22 }}>
            <Link to="/forgot-password" style={{ color: 'var(--brand-soft)', fontSize: '0.81rem', fontWeight: 600 }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading
              ? <><i className="fas fa-spinner fa-spin" /> Logging in…</>
              : <><i className="fas fa-arrow-right-to-bracket" /> Login</>}
          </button>
        </form>

        <p className="auth-foot">
          New here? <Link to="/register">Create a free account</Link>
        </p>
        <p className="auth-foot" style={{ marginTop: 8 }}>
          <Link to="/" style={{ color: 'var(--text-3)', fontWeight: 500 }}>← Back to home</Link>
        </p>
      </div>

      <style>{`.auth-theme { position: fixed; top: 20px; right: 20px; z-index: 5; }`}</style>
    </div>
  );
}
