import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { STREAMS, TARGET_EXAMS as EXAMS } from '../utils/subjects';

const ACHIEVEMENTS = [
  { id: 'first_mistake',    icon: '🌱', label: 'First Step',   desc: 'Logged your first mistake' },
  { id: 'ten_mistakes',     icon: '🔥', label: 'On Fire',      desc: 'Logged 10 mistakes' },
  { id: 'fifty_mistakes',   icon: '⭐', label: 'Star Student', desc: 'Logged 50 mistakes' },
  { id: 'hundred_mistakes', icon: '🏆', label: 'Champion',     desc: 'Logged 100 mistakes' },
  { id: 'all_subjects',     icon: '🌈', label: 'All-Rounder',  desc: 'Logged in 6 different subjects' },
];

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '', mobile: user?.mobile || '',
    currentClass: user?.currentClass || '', stream: user?.stream || '',
    targetExam: user?.targetExam || [],
  });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [showPassSection, setShowPassSection] = useState(false);
  const [showDeleteSection, setShowDeleteSection] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const toggleExam = (exam) => {
    setProfile(p => ({
      ...p,
      targetExam: p.targetExam.includes(exam)
        ? p.targetExam.filter(e => e !== exam)
        : [...p.targetExam, exam],
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', profile);
      await refreshUser();
      toast.success('Profile updated!');
      setEditMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally { setSavingProfile(false); }
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('New passwords do not match!');
    if (passForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters.');
    setSavingPass(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPassSection(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally { setSavingPass(false); }
  };

  // Permanently deletes the user plus every mistake and exam they own.
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!window.confirm('This permanently deletes your account, all mistakes and all exams. This cannot be undone. Continue?')) return;
    setDeleting(true);
    try {
      await api.delete('/auth/account', { data: { password: deletePassword } });
      toast.success('Your account has been deleted.');
      logout();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account.');
    } finally { setDeleting(false); }
  };

  const initial = user?.name?.[0]?.toUpperCase() || '?';
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';
  const unlocked = ACHIEVEMENTS.filter(a => user?.achievements?.includes(a.id)).length;

  return (
    <div className="screen">
      <Navbar />
      <div className="page page-narrow">

        {/* Hero */}
        <div className="card card-pad card-glow profile-hero animate-rise">
          <span className="avatar avatar-lg">{initial}</span>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{user?.name}</h1>
            <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginTop: 5 }}>{user?.email} · {user?.mobile}</p>
            <p style={{ color: 'var(--text-3)', fontSize: '0.79rem', marginTop: 3 }}>
              {user?.currentClass} · {user?.stream} · Joined {joined}
            </p>
          </div>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            {[['🔥', user?.streak || 0, 'Streak'], ['⭐', user?.totalPoints || 0, 'Points'], ['🏅', unlocked, 'Badges']].map(([icon, val, label]) => (
              <div key={label} className="mini-stat">
                <span style={{ fontSize: '1rem' }}>{icon}</span>
                <strong>{val}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div className="card card-pad row-between animate-rise d1" style={{ marginTop: 18 }}>
          <div>
            <h2 className="sec-title">{isDark ? '🌙' : '☀️'} Appearance</h2>
            <p style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginTop: 4 }}>
              Currently using {isDark ? 'dark' : 'light'} mode
            </p>
          </div>
          <button className="btn btn-ghost" onClick={toggleTheme}>
            <i className={`fas fa-${isDark ? 'sun' : 'moon'}`} /> Switch to {isDark ? 'light' : 'dark'}
          </button>
        </div>

        {/* Achievements */}
        <div className="card card-pad animate-rise d2" style={{ marginTop: 18 }}>
          <div className="row-between" style={{ marginBottom: 16 }}>
            <h2 className="sec-title">🏆 Achievements</h2>
            <span className="tag tag-soft">{unlocked}/{ACHIEVEMENTS.length} unlocked</span>
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 11 }}>
            {ACHIEVEMENTS.map(a => {
              const isOn = user?.achievements?.includes(a.id);
              return (
                <div key={a.id} className={`ach-card${isOn ? ' is-on' : ''}`}>
                  <span style={{ fontSize: '1.5rem', filter: isOn ? 'none' : 'grayscale(1)', opacity: isOn ? 1 : 0.5 }}>{a.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{a.label}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{a.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Edit profile */}
        <div className="card card-pad animate-rise d3" style={{ marginTop: 18 }}>
          <div className="row-between" style={{ marginBottom: 18 }}>
            <h2 className="sec-title">✏️ Profile details</h2>
            <button onClick={() => setEditMode(m => !m)} className={`btn btn-sm ${editMode ? 'btn-ghost' : 'btn-primary'}`}>
              {editMode ? 'Cancel' : <><i className="fas fa-pen" /> Edit</>}
            </button>
          </div>

          {!editMode ? (
            <div className="grid grid-2" style={{ gap: 12 }}>
              {[['Name', user?.name], ['Mobile', user?.mobile], ['Class', user?.currentClass], ['Stream', user?.stream]].map(([k, v]) => (
                <div key={k} className="panel">
                  <div className="label" style={{ marginBottom: 5 }}>{k}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v}</div>
                </div>
              ))}
              <div className="panel" style={{ gridColumn: '1/-1' }}>
                <div className="label" style={{ marginBottom: 8 }}>Target exams</div>
                <div className="row" style={{ flexWrap: 'wrap', gap: 7 }}>
                  {user?.targetExam?.map(e => <span key={e} className="tag tag-brand">{e}</span>)}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile}>
              <div className="grid grid-2" style={{ gap: 14 }}>
                <div className="field">
                  <label className="label">Full name</label>
                  <input className="input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required />
                </div>
                <div className="field">
                  <label className="label">Mobile</label>
                  <input className="input" value={profile.mobile} maxLength={10} inputMode="numeric"
                    onChange={e => setProfile({ ...profile, mobile: e.target.value.replace(/\D/g, '') })} />
                </div>
                <div className="field">
                  <label className="label">Class</label>
                  <select className="select" value={profile.currentClass} onChange={e => setProfile({ ...profile, currentClass: e.target.value })}>
                    <option value="11th">Class 11</option>
                    <option value="12th">Class 12</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Stream</label>
                  <select className="select" value={profile.stream} onChange={e => setProfile({ ...profile, stream: e.target.value })}>
                    {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="field">
                <label className="label">Target exams</label>
                <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                  {EXAMS.map(exam => (
                    <button key={exam} type="button" onClick={() => toggleExam(exam)}
                      className={`chip${profile.targetExam.includes(exam) ? ' is-active' : ''}`}>
                      {profile.targetExam.includes(exam) && <i className="fas fa-check" style={{ fontSize: '0.65rem' }} />}
                      {exam}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? <><i className="fas fa-spinner fa-spin" /> Saving…</> : <><i className="fas fa-check" /> Save changes</>}
              </button>
            </form>
          )}
        </div>

        {/* Password */}
        <div className="card card-pad animate-rise d4" style={{ marginTop: 18 }}>
          <div className="row-between" style={{ marginBottom: showPassSection ? 18 : 0 }}>
            <h2 className="sec-title">🔒 Password</h2>
            <button onClick={() => setShowPassSection(s => !s)} className="btn btn-sm btn-ghost">
              {showPassSection ? 'Cancel' : 'Change password'}
            </button>
          </div>
          {showPassSection && (
            <form onSubmit={handleChangePass}>
              {[
                ['currentPassword', 'Current password'],
                ['newPassword', 'New password (min. 6 characters)'],
                ['confirmPassword', 'Confirm new password'],
              ].map(([k, l]) => (
                <div className="field" key={k}>
                  <label className="label">{l}</label>
                  <input type="password" className="input" value={passForm[k]} required
                    onChange={e => setPassForm({ ...passForm, [k]: e.target.value })} />
                </div>
              ))}
              <button type="submit" className="btn btn-primary" disabled={savingPass}>
                {savingPass ? <><i className="fas fa-spinner fa-spin" /> Changing…</> : <><i className="fas fa-key" /> Change password</>}
              </button>
            </form>
          )}
        </div>

        {/* Danger zone */}
        <div className="card card-pad danger-zone animate-rise d5" style={{ marginTop: 18 }}>
          <h2 className="sec-title" style={{ color: 'var(--coral)' }}>⚠️ Danger zone</h2>
          <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', margin: '10px 0 18px' }}>
            Deleting your account permanently erases your profile, every logged mistake and every exam. This cannot be undone.
          </p>

          {!showDeleteSection ? (
            <button onClick={() => setShowDeleteSection(true)} className="btn btn-danger-outline">
              Delete my account
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount}>
              <div className="field" style={{ maxWidth: 340 }}>
                <label className="label">Confirm your password</label>
                <input type="password" className="input" value={deletePassword} placeholder="Enter your password"
                  onChange={e => setDeletePassword(e.target.value)} required />
              </div>
              <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-danger" disabled={deleting}>
                  {deleting ? <><i className="fas fa-spinner fa-spin" /> Deleting…</> : 'Permanently delete account'}
                </button>
                <button type="button" className="btn btn-ghost"
                  onClick={() => { setShowDeleteSection(false); setDeletePassword(''); }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
  .sec-title { font-size: 0.98rem; font-weight: 800; }
  .profile-hero { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }

  .mini-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 76px;
    padding: 11px 15px; border-radius: var(--r-md); background: var(--surface-2); border: 1px solid var(--border); }
  .mini-stat strong { font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; color: var(--amber); }
  .mini-stat span:last-child { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-3); }

  .ach-card { display: flex; align-items: center; gap: 11px; padding: 13px 15px; border-radius: var(--r-md);
    background: var(--surface-2); border: 1px dashed var(--border-strong); color: var(--text-3); transition: all 0.25s var(--ease); }
  .ach-card.is-on { background: var(--grad-hot); border: 1px solid transparent; color: #1a1a2e;
    box-shadow: 0 8px 22px rgba(255,107,107,0.3); }
  .ach-card.is-on:hover { transform: translateY(-3px); }

  .danger-zone { border-color: color-mix(in srgb, var(--coral) 35%, transparent);
    background: color-mix(in srgb, var(--coral) 6%, transparent); }
`;
