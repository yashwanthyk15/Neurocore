import React from 'react';
import { Sun, Moon, ZoomIn, ZoomOut, AlignJustify, Eye, EyeOff, Type } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const OVERLAYS = [
  { key: 'none', label: 'None', color: 'transparent', border: 'var(--border)' },
  { key: 'yellow', label: 'Yellow', color: '#fef9c3', border: '#eab308' },
  { key: 'blue', label: 'Blue', color: '#dbeafe', border: '#3b82f6' },
  { key: 'green', label: 'Green', color: '#dcfce7', border: '#22c55e' },
  { key: 'pink', label: 'Pink', color: '#fce7f3', border: '#ec4899' },
  { key: 'peach', label: 'Peach', color: '#ffedd5', border: '#f97316' },
];

const FONTS = [
  { key: 'dyslexic', label: 'OpenDyslexic', className: 'font-dyslexic' },
  { key: 'lexend', label: 'Lexend', className: 'font-lexend' },
  { key: 'nunito', label: 'Nunito', className: 'font-nunito' },
  { key: 'mono', label: 'Mono', className: 'font-mono' },
];

export default function ReadingControls({ settings, onChange }) {
  const { theme, toggleTheme } = useTheme();

  const set = (key, val) => onChange({ ...settings, [key]: val });

  return (
    <div className="glass-panel" style={{
      padding: '24px 20px', display: 'flex',
      flexDirection: 'column', gap: 24,
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
        Reading Settings
      </h3>

      {/* Font size */}
      <div>
        <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Type size={16} />Font Size</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{settings.fontSize}px</span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => set('fontSize', Math.max(14, settings.fontSize - 1))} style={iconBtnStyle}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <ZoomOut size={18} />
          </button>
          <input type="range" min={14} max={32} value={settings.fontSize}
            onChange={e => set('fontSize', parseInt(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--accent)', height: 6 }} />
          <button onClick={() => set('fontSize', Math.min(32, settings.fontSize + 1))} style={iconBtnStyle}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      {/* Line spacing */}
      <div>
        <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlignJustify size={16} />Line Spacing</span>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{settings.lineSpacing}×</span>
        </label>
        <input type="range" min={1.2} max={3.0} step={0.1} value={settings.lineSpacing}
          onChange={e => set('lineSpacing', parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent)', height: 6 }} />
      </div>

      {/* Font family */}
      <div>
        <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, display: 'block' }}>
          Font Style
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {FONTS.map(f => (
            <button key={f.key} onClick={() => set('fontKey', f.key)}
              className={f.className}
              style={{
                padding: '10px 8px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: `2px solid ${settings.fontKey === f.key ? 'var(--accent)' : 'var(--border)'}`,
                background: settings.fontKey === f.key ? 'var(--accent-light)' : 'var(--bg-secondary)',
                color: settings.fontKey === f.key ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: settings.fontKey === f.key ? '0 2px 8px rgba(79, 70, 229, 0.15)' : 'none'
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Color overlay */}
      <div>
        <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, display: 'block' }}>
          Colour Overlay
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {OVERLAYS.map(o => (
            <button key={o.key} onClick={() => set('colorOverlay', o.key)} title={o.label}
              style={{
                width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
                background: o.color,
                border: `2px solid ${settings.colorOverlay === o.key ? o.border : 'var(--border)'}`,
                outline: settings.colorOverlay === o.key ? `2px solid ${o.border}` : 'none',
                outlineOffset: 2,
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: '#333'
              }}>
              {o.key === 'none' ? '✕' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Focus mode */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {settings.focusMode ? <Eye size={16} /> : <EyeOff size={16} />} Focus Mode
        </span>
        <button onClick={() => set('focusMode', !settings.focusMode)} style={{
          width: 48, height: 26, borderRadius: 99,
          background: settings.focusMode ? 'var(--accent)' : 'var(--border)',
          border: 'none', cursor: 'pointer', position: 'relative',
          transition: 'background 0.3s ease',
        }}>
          <span style={{
            width: 20, height: 20, borderRadius: '50%', background: '#fff',
            position: 'absolute', top: 3,
            left: settings.focusMode ? 25 : 3,
            transition: 'left 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }} />
        </button>
      </div>

      {/* Theme toggle */}
      <button onClick={toggleTheme} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px',
        borderRadius: 12, border: '1px solid var(--border)',
        background: 'var(--bg-secondary)', color: 'var(--text-primary)',
        fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}>
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      </button>
    </div>
  );
}

const iconBtnStyle = {
  width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)',
  background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s',
};
