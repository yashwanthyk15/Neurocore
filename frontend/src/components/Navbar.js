import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, Settings, BookOpen, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <nav className="glass-panel" style={{
      borderRadius: 0,
      borderTop: 'none', borderLeft: 'none', borderRight: 'none',
      padding: '0 24px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link to="/dashboard" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        textDecoration: 'none',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius)',
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <BookOpen size={18} color="white" />
        </div>
        <span style={{
          fontFamily: 'var(--ui-font)', fontWeight: 700, fontSize: 20,
          color: 'var(--text-primary)', letterSpacing: '-0.5px',
        }}>
          Neuro<span className="text-gradient">Core</span>
        </span>
      </Link>

      {/* Desktop nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {navLinks.map(link => {
          const isActive = location.pathname === link.to;
          return (
            <Link key={link.to} to={link.to} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 'var(--radius)',
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-light)' : 'transparent',
              textDecoration: 'none', fontSize: 14, fontWeight: 500,
              transition: 'all 0.15s ease',
            }}>
              {link.icon}
              {link.label}
            </Link>
          );
        })}

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 8px' }} />

        {/* Theme toggle */}
        <button onClick={toggleTheme} style={{
          width: 36, height: 36, borderRadius: 'var(--radius)',
          background: 'var(--bg-hover)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', transition: 'all 0.15s ease',
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* User info + logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 14, fontWeight: 600,
              boxShadow: 'var(--shadow-sm)'
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <button onClick={handleLogout} style={{
              width: 36, height: 36, borderRadius: 'var(--radius)',
              background: 'transparent', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)', transition: 'all 0.15s ease',
            }}
              onMouseEnter={e => { 
                e.currentTarget.style.color = 'var(--danger)'; 
                e.currentTarget.style.borderColor = 'var(--danger)'; 
                e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.color = 'var(--text-muted)'; 
                e.currentTarget.style.borderColor = 'var(--border)'; 
                e.currentTarget.style.background = 'transparent';
              }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
