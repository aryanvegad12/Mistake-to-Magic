import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' },
  card: { background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 28, padding: '48px 42px', width: '100%', maxWidth: 440, boxShadow: '0 25px 60px rgba(0,0,0,0.5)' },
  header: { textAlign: 'center', marginBottom: 34 },
  logo: { fontSize: '2.5rem', marginBottom: 10 },
  title: { fontSize: '1.65rem', fontWeight: 800, color: '#fff', marginBottom: 6 },
  sub: { color: 'rgba(255,255,255,0.55)', fontSize: '0.88rem' },
  group: { marginBottom: 20 },
  label: { display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 7 },
  wrap: { position: 'relative' },
  icon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' },
  input: { width: '100%', padding: '13px 14px 13px 38px', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, color: '#fff', fontSize: '0.9rem', outline: 'none', transition: 'all 0.3s' },
  btn: { width: '100%', padding: 14, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: '#fff', border: 'none', borderRadius: 12, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 6px 20px rgba(124,58,237,0.5)', marginTop: 10 },
  link: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginTop: 18 },
  linkA: { color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }
};

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { setAuth } = useAuth();
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
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.header}>
          <div style={S.logo}>🎯</div>
          <h2 style={S.title}>Welcome Back!</h2>
          <p style={S.sub}>Login to continue your learning journey</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={S.group}>
            <label style={S.label}>Email Address</label>
            <div style={S.wrap}>
              <i className="fas fa-envelope" style={S.icon} />
              <input type="email" style={S.input} placeholder="you@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required
                onFocus={e => e.target.style.borderColor='#a78bfa'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.2)'} />
            </div>
          </div>
          <div style={S.group}>
            <label style={S.label}>Password</label>
            <div style={{ ...S.wrap }}>
              <i className="fas fa-lock" style={S.icon} />
              <input type={showPass ? 'text' : 'password'} style={{ ...S.input, paddingRight: 42 }} placeholder="Your password"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required
                onFocus={e => e.target.style.borderColor='#a78bfa'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.2)'} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <i className={`fas fa-eye${showPass ? '-slash' : ''}`} />
              </button>
            </div>
          </div>
          <button type="submit" style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: 8 }} />Logging in...</> : <><i className="fas fa-sign-in-alt" style={{ marginRight: 8 }} />Login</>}
          </button>
        </form>
        <p style={S.link}>Don't have an account? <Link to="/register" style={S.linkA}>Register Free</Link></p>
        <p style={{ ...S.link, marginTop: 8 }}><Link to="/" style={{ ...S.linkA, color: 'rgba(255,255,255,0.4)' }}>← Back to Home</Link></p>
      </div>
    </div>
  );
}
