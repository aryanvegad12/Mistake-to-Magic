import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1 = verify identity, 2 = set new password
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [identity, setIdentity] = useState({ email: '', mobile: '' });
  const [resetToken, setResetToken] = useState('');
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password/verify', identity);
      setResetToken(data.resetToken);
      toast.success(data.message);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not verify your details.');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error("Passwords don't match.");
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password/reset', {
        resetToken,
        newPassword: pwForm.newPassword,
      });
      toast.success(data.message);
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrap">
      <button className="icon-btn auth-theme" onClick={toggleTheme} aria-label="Toggle theme">
        <i className={`fas fa-${isDark ? 'sun' : 'moon'}`} />
      </button>

      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-mark">🔑</div>
          <h1 className="auth-title">{step === 1 ? 'Forgot password?' : 'Set a new password'}</h1>
          <p className="auth-sub">
            {step === 1
              ? 'Confirm your email and registered mobile to continue'
              : 'Choose something you will actually remember'}
          </p>
        </div>

        <div className="steps">
          <span className={`step-dot${step >= 1 ? ' is-on' : ''}`}>1</span>
          <span className={`step-line${step >= 2 ? ' is-on' : ''}`} />
          <span className={`step-dot${step >= 2 ? ' is-on' : ''}`}>2</span>
        </div>

        {step === 1 ? (
          <form onSubmit={handleVerify}>
            <div className="field">
              <label className="label">Email address</label>
              <div className="input-icon">
                <i className="fas fa-envelope" />
                <input type="email" className="input" placeholder="you@email.com" value={identity.email}
                  onChange={e => setIdentity({ ...identity, email: e.target.value })} required />
              </div>
            </div>

            <div className="field" style={{ marginBottom: 24 }}>
              <label className="label">Registered mobile number</label>
              <div className="input-icon">
                <i className="fas fa-mobile-screen" />
                <input type="tel" className="input" placeholder="10-digit mobile number" value={identity.mobile}
                  inputMode="numeric"
                  onChange={e => setIdentity({ ...identity, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading
                ? <><i className="fas fa-spinner fa-spin" /> Verifying…</>
                : <><i className="fas fa-circle-check" /> Verify identity</>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <div className="field">
              <label className="label">New password</label>
              <div className="input-icon">
                <i className="fas fa-lock" />
                <input type={showPass ? 'text' : 'password'} className="input" placeholder="At least 6 characters" style={{ paddingRight: 46 }}
                  value={pwForm.newPassword} onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={6} />
                <button type="button" className="input-affix" onClick={() => setShowPass(s => !s)} aria-label="Show password">
                  <i className={`fas fa-eye${showPass ? '-slash' : ''}`} />
                </button>
              </div>
            </div>

            <div className="field" style={{ marginBottom: 24 }}>
              <label className="label">Confirm new password</label>
              <div className="input-icon">
                <i className="fas fa-lock" />
                <input type={showPass ? 'text' : 'password'} className="input" placeholder="Re-enter new password"
                  value={pwForm.confirmPassword} onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })} required minLength={6} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading
                ? <><i className="fas fa-spinner fa-spin" /> Resetting…</>
                : <><i className="fas fa-key" /> Reset password</>}
            </button>
          </form>
        )}

        <p className="auth-foot">Remembered it? <Link to="/login">Back to login</Link></p>
      </div>

      <style>{`.auth-theme { position: fixed; top: 20px; right: 20px; z-index: 5; }`}</style>
    </div>
  );
}
