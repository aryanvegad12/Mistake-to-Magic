import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STREAMS = ['Science (PCM)', 'Science (PCB)', 'Science (PCMB)'];
const EXAMS = ['JEE Main', 'JEE Advanced', 'NEET', 'Board Exam', 'Other'];
const ACHIEVEMENTS_DEF = [
  { id:'first_mistake', icon:'🌱', label:'First Step', desc:'Logged your first mistake' },
  { id:'ten_mistakes', icon:'🔥', label:'On Fire!', desc:'Logged 10 mistakes' },
  { id:'fifty_mistakes', icon:'⭐', label:'Star Student', desc:'Logged 50 mistakes' },
  { id:'hundred_mistakes', icon:'🏆', label:'Champion', desc:'Logged 100 mistakes' },
  { id:'all_subjects', icon:'🌈', label:'All-Rounder', desc:'Logged in all 6 subjects' },
];

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({ name: user?.name || '', mobile: user?.mobile || '', currentClass: user?.currentClass || '', stream: user?.stream || '', targetExam: user?.targetExam || [] });
  const [passForm, setPassForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [showPassSection, setShowPassSection] = useState(false);

  const toggleExam = (exam) => {
    setProfile(p => ({ ...p, targetExam: p.targetExam.includes(exam) ? p.targetExam.filter(e => e !== exam) : [...p.targetExam, exam] }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/auth/profile', profile);
      await refreshUser();
      toast.success('Profile updated!');
      setEditMode(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update profile.'); }
    finally { setSavingProfile(false); }
  };

  const handleChangePass = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('New passwords do not match!');
    if (passForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters.');
    setSavingPass(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed successfully!');
      setPassForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
      setShowPassSection(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password.'); }
    finally { setSavingPass(false); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? All data will be permanently lost!')) return;
    if (!window.confirm('This action cannot be undone. Type OK to confirm.')) return;
    try {
      await api.delete('/mistakes');
      logout();
      toast.success('Account data deleted.');
    } catch { toast.error('Failed to delete account.'); }
  };

  const cardStyle = { background:'#fff', borderRadius:20, padding:28, boxShadow:'0 4px 20px rgba(0,0,0,0.07)', marginBottom:20 };
  const inputStyle = { width:'100%', padding:'10px 13px', border:'1.5px solid #e5e7f0', borderRadius:10, fontSize:'0.88rem', fontFamily:'Poppins', color:'#1a1a2e', background:'#f8f9ff', outline:'none', transition:'all 0.3s' };
  const labelStyle = { display:'block', fontSize:'0.78rem', fontWeight:700, color:'#6060a0', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.3px' };
  const inFocus = e => e.target.style.borderColor = '#a78bfa';
  const outFocus = e => e.target.style.borderColor = '#e5e7f0';

  const avatarLetter = user?.name?.[0]?.toUpperCase() || '?';
  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}) : '';

  return (
    <div style={{ background:'#f0f2ff', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <Navbar />
      <div className="page-wrap" style={{ maxWidth:900 }}>

        {/* Profile hero */}
        <div style={{ background:'linear-gradient(135deg,#1a1a2e,#302b63)', borderRadius:20, padding:'28px 32px', marginBottom:22, display:'flex', alignItems:'center', gap:22, flexWrap:'wrap' }}>
          <div style={{ width:80, height:80, background:'linear-gradient(135deg,#a78bfa,#7c3aed)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', fontWeight:900, color:'#fff', flexShrink:0, boxShadow:'0 0 24px rgba(167,139,250,0.6)' }}>
            {avatarLetter}
          </div>
          <div style={{ flex:1 }}>
            <h2 style={{ color:'#fff', fontWeight:900, fontSize:'1.4rem', marginBottom:4 }}>{user?.name}</h2>
            <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.85rem' }}>{user?.email} · {user?.mobile}</p>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.8rem', marginTop:2 }}>{user?.currentClass} · {user?.stream} · Joined {joinDate}</p>
          </div>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            {[['🔥', user?.streak || 0, 'Day Streak'],['⭐', user?.totalPoints || 0, 'Points'],['🏅', user?.achievements?.length || 0, 'Badges']].map(([icon, val, label]) => (
              <div key={label} style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'12px 16px', textAlign:'center' }}>
                <div style={{ fontSize:'1.2rem' }}>{icon}</div>
                <div style={{ color:'#ffd93d', fontWeight:900, fontSize:'1.1rem' }}>{val}</div>
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.68rem' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div style={cardStyle}>
          <h3 style={{ fontWeight:800, color:'#1a1a2e', marginBottom:16, fontSize:'1rem' }}>🏆 Achievements</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {ACHIEVEMENTS_DEF.map(a => {
              const unlocked = user?.achievements?.includes(a.id);
              return (
                <div key={a.id} title={a.desc} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderRadius:20, fontSize:'0.82rem', fontWeight:600, cursor:'default',
                  background: unlocked ? 'linear-gradient(135deg,#ffd93d,#ff6b6b)' : '#f0f2ff',
                  color: unlocked ? '#fff' : '#b0b0c8',
                  border: unlocked ? 'none' : '1px dashed #c4b5fd',
                  boxShadow: unlocked ? '0 4px 14px rgba(255,107,107,0.3)' : 'none',
                  opacity: unlocked ? 1 : 0.65 }}>
                  <span style={{ fontSize:'1.1rem' }}>{a.icon}</span>
                  <div>
                    <div>{a.label}</div>
                    <div style={{ fontSize:'0.68rem', opacity:0.8 }}>{a.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Edit Profile */}
        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <h3 style={{ fontWeight:800, color:'#1a1a2e', fontSize:'1rem' }}>✏️ Edit Profile</h3>
            <button onClick={() => setEditMode(!editMode)} style={{ padding:'7px 16px', background: editMode ? '#f0f2ff' : 'linear-gradient(135deg,#a78bfa,#7c3aed)', color: editMode ? '#7c3aed' : '#fff', border: editMode ? '1.5px solid #c4b5fd' : 'none', borderRadius:20, fontSize:'0.82rem', fontWeight:700, cursor:'pointer' }}>
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {!editMode ? (
            <div className="profile-info-grid">
              {[['Name', user?.name],['Mobile', user?.mobile],['Class', user?.currentClass],['Stream', user?.stream]].map(([k,v]) => (
                <div key={k} style={{ background:'#f8f9ff', borderRadius:10, padding:'12px 16px' }}>
                  <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9090b0', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>{k}</div>
                  <div style={{ fontWeight:600, color:'#1a1a2e', fontSize:'0.9rem' }}>{v}</div>
                </div>
              ))}
              <div style={{ background:'#f8f9ff', borderRadius:10, padding:'12px 16px', gridColumn:'1/-1' }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#9090b0', textTransform:'uppercase', letterSpacing:0.5, marginBottom:4 }}>Target Exams</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {user?.targetExam?.map(e => <span key={e} style={{ background:'rgba(167,139,250,0.15)', color:'#7c3aed', padding:'3px 12px', borderRadius:20, fontSize:'0.8rem', fontWeight:600 }}>{e}</span>)}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                <div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={profile.name} onChange={e => setProfile({...profile, name:e.target.value})} onFocus={inFocus} onBlur={outFocus} required /></div>
                <div><label style={labelStyle}>Mobile</label><input style={inputStyle} value={profile.mobile} maxLength={10} onChange={e => setProfile({...profile, mobile:e.target.value.replace(/\D/,'')})} onFocus={inFocus} onBlur={outFocus} /></div>
                <div><label style={labelStyle}>Class</label><select style={{ ...inputStyle, cursor:'pointer' }} value={profile.currentClass} onChange={e => setProfile({...profile, currentClass:e.target.value})} onFocus={inFocus} onBlur={outFocus}><option value="11th">Class 11</option><option value="12th">Class 12</option></select></div>
                <div><label style={labelStyle}>Stream</label><select style={{ ...inputStyle, cursor:'pointer' }} value={profile.stream} onChange={e => setProfile({...profile, stream:e.target.value})} onFocus={inFocus} onBlur={outFocus}>{STREAMS.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
              <div style={{ marginBottom:18 }}>
                <label style={labelStyle}>Target Exams</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {EXAMS.map(exam => (
                    <button key={exam} type="button" onClick={() => toggleExam(exam)}
                      style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid', fontSize:'0.78rem', fontWeight:600, cursor:'pointer',
                        background: profile.targetExam.includes(exam) ? 'rgba(167,139,250,0.15)' : 'transparent',
                        borderColor: profile.targetExam.includes(exam) ? '#a78bfa' : '#e0e0f0',
                        color: profile.targetExam.includes(exam) ? '#7c3aed' : '#9090b0' }}>
                      {exam}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={savingProfile} style={{ padding:'11px 28px', background:'linear-gradient(135deg,#a78bfa,#7c3aed)', color:'#fff', border:'none', borderRadius:11, fontSize:'0.9rem', fontWeight:700, cursor:'pointer' }}>
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>

        {/* Change Password */}
        <div style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: showPassSection ? 20 : 0 }}>
            <h3 style={{ fontWeight:800, color:'#1a1a2e', fontSize:'1rem' }}>🔒 Change Password</h3>
            <button onClick={() => setShowPassSection(!showPassSection)} style={{ padding:'7px 16px', background:'#f0f2ff', color:'#7c3aed', border:'1.5px solid #c4b5fd', borderRadius:20, fontSize:'0.82rem', fontWeight:700, cursor:'pointer' }}>
              {showPassSection ? 'Cancel' : 'Change Password'}
            </button>
          </div>
          {showPassSection && (
            <form onSubmit={handleChangePass}>
              {[['currentPassword','Current Password'],['newPassword','New Password (min. 6 chars)'],['confirmPassword','Confirm New Password']].map(([k,l]) => (
                <div key={k} style={{ marginBottom:14 }}>
                  <label style={labelStyle}>{l}</label>
                  <input type="password" style={inputStyle} value={passForm[k]} onChange={e => setPassForm({...passForm, [k]:e.target.value})} required onFocus={inFocus} onBlur={outFocus} />
                </div>
              ))}
              <button type="submit" disabled={savingPass} style={{ padding:'11px 28px', background:'linear-gradient(135deg,#ff6b6b,#ee5a24)', color:'#fff', border:'none', borderRadius:11, fontSize:'0.9rem', fontWeight:700, cursor:'pointer' }}>
                {savingPass ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>

        {/* Danger zone */}
        <div style={{ ...cardStyle, border:'1.5px solid rgba(231,76,60,0.3)', background:'rgba(231,76,60,0.03)' }}>
          <h3 style={{ fontWeight:800, color:'#e74c3c', marginBottom:10, fontSize:'1rem' }}>⚠️ Danger Zone</h3>
          <p style={{ color:'#7070a0', fontSize:'0.85rem', marginBottom:16 }}>Deleting your account will permanently erase all your mistake data. This cannot be undone.</p>
          <button onClick={handleDeleteAccount} style={{ padding:'10px 22px', background:'transparent', color:'#e74c3c', border:'1.5px solid #e74c3c', borderRadius:10, fontSize:'0.85rem', fontWeight:700, cursor:'pointer' }}>
            Delete All My Data
          </button>
        </div>
      </div>
    </div>
  );
}
