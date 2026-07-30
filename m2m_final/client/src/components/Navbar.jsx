import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/dashboard', icon: 'fas fa-bolt',      label: 'Dashboard' },
  { path: '/journal',   icon: 'fas fa-book-open', label: 'Journal'   },
  { path: '/analytics', icon: 'fas fa-chart-pie', label: 'Analytics' },
  { path: '/ai-coach',  icon: 'fas fa-robot',     label: 'AI Coach'  },
  { path: '/exams',     icon: 'fas fa-hourglass-half', label: 'Exams' },
  { path: '/profile',   icon: 'fas fa-user',      label: 'Profile'   },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [open, setOpen] = useState(false);
  const listRef = useRef(null);
  const [pill, setPill] = useState({ left: 0, width: 0, show: false });

  // Slide the highlight pill under whichever link is active
  useLayoutEffect(() => {
    const move = () => {
      const active = listRef.current?.querySelector('.nav-link.is-active');
      if (!active) return setPill(p => ({ ...p, show: false }));
      setPill({ left: active.offsetLeft, width: active.offsetWidth, show: true });
    };
    move();
    window.addEventListener('resize', move);
    return () => window.removeEventListener('resize', move);
  }, [pathname]);

  // Never leave the drawer hanging open after navigating
  useEffect(() => { setOpen(false); }, [pathname]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out — see you soon!');
    navigate('/');
  };

  const initial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <>
      <nav className="nav">
        <Link to="/dashboard" className="nav-logo">
          <span className="nav-mark">🎯</span>
          <span>M2M</span>
        </Link>

        <div className="nav-links" ref={listRef}>
          {pill.show && (
            <span className="nav-pill" style={{ left: pill.left, width: pill.width }} />
          )}
          {NAV_ITEMS.map(({ path, icon, label }) => (
            <Link key={path} to={path} className={`nav-link${pathname === path ? ' is-active' : ''}`}>
              <i className={icon} style={{ fontSize: '0.75rem' }} />
              {label}
            </Link>
          ))}
        </div>

        <div className="nav-right">
          {(user?.streak || 0) > 0 && (
            <span className="streak-pill" title={`${user.streak}-day streak`}>🔥 {user.streak}</span>
          )}

          <button className="icon-btn" onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle theme">
            <i className={`fas fa-${isDark ? 'sun' : 'moon'}`} />
          </button>

          <Link to="/profile" className="nav-user">
            <span className="nav-name">{user?.name?.split(' ')[0]}</span>
            <span className="avatar">{initial}</span>
          </Link>

          <button className="icon-btn nav-logout-desktop" onClick={handleLogout} title="Logout" aria-label="Logout">
            <i className="fas fa-arrow-right-from-bracket" />
          </button>

          <button className="icon-btn nav-burger" onClick={() => setOpen(o => !o)} aria-label="Menu" aria-expanded={open}>
            <i className={`fas fa-${open ? 'xmark' : 'bars'}`} />
          </button>
        </div>
      </nav>

      {open && (
        <div className="drawer">
          {NAV_ITEMS.map(({ path, icon, label }) => (
            <Link key={path} to={path} className={pathname === path ? 'is-active' : ''}>
              <i className={icon} style={{ width: 18 }} /> {label}
            </Link>
          ))}
          <button className="drawer-logout" onClick={handleLogout}>
            <i className="fas fa-arrow-right-from-bracket" style={{ width: 18 }} /> Logout
          </button>
        </div>
      )}
    </>
  );
}
