import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path:'/dashboard', icon:'fas fa-home',     label:'Dashboard' },
  { path:'/journal',   icon:'fas fa-book-open',label:'Journal'   },
  { path:'/analytics', icon:'fas fa-chart-bar',label:'Analytics' },
  { path:'/ai-coach',  icon:'fas fa-robot',    label:'AI Coach'  },
  { path:'/exams',     icon:'fas fa-clock',    label:'Exams'     },
  { path:'/profile',   icon:'fas fa-user',     label:'Profile'   },
];

const CSS = `
  .navbar { background: linear-gradient(135deg,#1a1a2e,#302b63); padding: 0 24px; display: flex; align-items: center; justify-content: space-between; min-height: 62px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); position: sticky; top: 0; z-index: 1000; }
  .nav-links { display: flex; gap: 2px; flex-wrap: wrap; }
  .nav-right  { display: flex; align-items: center; gap: 10px; }
  .hamburger  { display: none; background: none; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); border-radius: 8px; padding: 7px 10px; cursor: pointer; font-size: 1rem; }
  .mobile-menu { display: none; }

  @media (max-width: 900px) {
    .nav-links   { display: none; }
    .hamburger   { display: flex; align-items: center; justify-content: center; }
    .mobile-menu {
      display: flex; flex-direction: column; gap: 4px;
      background: linear-gradient(135deg,#1a1a2e,#302b63);
      padding: 12px 16px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 8px 20px rgba(0,0,0,0.4);
    }
    .mobile-menu a, .mobile-menu button {
      display: flex; align-items: center; gap: 12px;
      padding: 11px 14px; border-radius: 10px;
      color: rgba(255,255,255,0.75); font-size: 0.88rem; font-weight: 600;
      text-decoration: none; border: none; cursor: pointer;
      font-family: Poppins; background: transparent; width: 100%; text-align: left;
      transition: all 0.2s;
    }
    .mobile-menu a:hover, .mobile-menu button:hover { background: rgba(255,255,255,0.1); color: #fff; }
    .mobile-menu a.active-link { background: rgba(167,139,250,0.2); color: #a78bfa; }
  }
  @media (max-width: 480px) {
    .navbar { padding: 0 14px; }
    .nav-user-name { display: none; }
  }
`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const [open, setOpen]  = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out!');
    navigate('/');
    setOpen(false);
  };

  const navLink = (path, active) => ({
    padding:'7px 13px', borderRadius:20, border:'none',
    fontSize:'0.8rem', fontWeight:600, cursor:'pointer',
    display:'flex', alignItems:'center', gap:6, transition:'all 0.2s',
    fontFamily:'Poppins', textDecoration:'none',
    background: active ? 'rgba(167,139,250,0.25)' : 'transparent',
    color:      active ? '#a78bfa' : 'rgba(255,255,255,0.65)',
  });

  return (
    <>
      <style>{CSS}</style>
      <nav className="navbar">
        {/* Logo */}
        <Link to="/dashboard" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
          <span style={{ fontSize:'1.3rem', filter:'drop-shadow(0 0 6px rgba(255,200,50,0.7))' }}>🎯</span>
          <span style={{ fontSize:'1.15rem', fontWeight:900, color:'#ffd93d', letterSpacing:1 }}>M2M</span>
        </Link>

        {/* Desktop links */}
        <div className="nav-links">
          {NAV_ITEMS.map(({ path, icon, label }) => (
            <Link key={path} to={path} style={navLink(path, location.pathname === path)}>
              <i className={icon} style={{ fontSize:'0.76rem' }} />
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="nav-right">
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span className="nav-user-name" style={{ color:'rgba(255,255,255,0.75)', fontSize:'0.82rem', fontWeight:600 }}>
              {user?.name?.split(' ')[0]}
            </span>
            {(user?.streak || 0) > 0 && (
              <span style={{ background:'linear-gradient(135deg,#ff6b6b,#ffd93d)', borderRadius:12, padding:'2px 8px', fontSize:'0.7rem', fontWeight:700, color:'#1a1a2e' }}>
                🔥{user.streak}
              </span>
            )}
          </div>
          {/* Desktop logout */}
          <button onClick={handleLogout}
            style={{ padding:'7px 12px', borderRadius:20, border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:'0.78rem', fontFamily:'Poppins', display:'flex', alignItems:'center', gap:5 }}
            className="nav-logout-desktop">
            <i className="fas fa-sign-out-alt" />
          </button>
          {/* Hamburger */}
          <button className="hamburger" onClick={() => setOpen(o => !o)}>
            <i className={`fas fa-${open ? 'times' : 'bars'}`} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="mobile-menu">
          {NAV_ITEMS.map(({ path, icon, label }) => (
            <Link key={path} to={path} className={location.pathname === path ? 'active-link' : ''}
              onClick={() => setOpen(false)}>
              <i className={icon} /> {label}
            </Link>
          ))}
          <button onClick={handleLogout} style={{ color:'#ff6b6b !important', marginTop:4, borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:12 }}>
            <i className="fas fa-sign-out-alt" /> Logout
          </button>
        </div>
      )}
    </>
  );
}
