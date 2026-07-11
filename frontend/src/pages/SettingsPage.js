import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Save, BookOpen, Type, Palette, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const SECTION = ({ title, icon, children, delay }) => (
  <motion.div 
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay }}
    className="glass-panel"
    style={{ padding: '32px', marginBottom: 24 }}
  >
    <h2 style={{
      fontSize: 18, fontWeight: 700, color: 'var(--text-primary)',
      marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'var(--accent-light)', color: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {icon}
      </div>
      {title}
    </h2>
    {children}
  </motion.div>
);

const LABEL = ({ children, hint }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
      {children}
    </label>
    {hint && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</p>}
  </div>
);

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    fontSize: user?.readingProfile?.fontSize || 18,
    lineSpacing: user?.readingProfile?.lineSpacing || 1.8,
    chunkSize: user?.readingProfile?.chunkSize || 600,
    useDyslexicFont: user?.readingProfile?.useDyslexicFont ?? true,
    colorOverlay: user?.readingProfile?.colorOverlay || 'none',
  });

  const set = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(profile);
      toast.success('Settings saved ✅');
    } catch (err) {
      toast.error('Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  const previewStyle = {
    fontSize: profile.fontSize,
    lineHeight: profile.lineSpacing,
    fontFamily: profile.useDyslexicFont
      ? "'OpenDyslexic', 'Lexend', sans-serif"
      : "'Lexend', sans-serif",
    color: 'var(--text-primary)',
    wordSpacing: profile.useDyslexicFont ? '0.12em' : undefined,
    letterSpacing: profile.useDyslexicFont ? '0.05em' : undefined,
    transition: 'all 0.3s ease'
  };

  const getOverlayColor = (key) => {
    const map = {
      yellow: 'var(--overlay-yellow)',
      blue: 'var(--overlay-blue)',
      green: 'var(--overlay-green)',
      pink: 'var(--overlay-pink)',
      peach: 'var(--overlay-peach)',
      none: 'transparent'
    };
    return map[key] || 'transparent';
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>

      <Navbar />
      
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 10 }}>
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}
        >
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.5px' }}>Settings</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>Set your default reading preferences</p>
          </div>
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save changes'}
          </button>
        </motion.div>

        {/* Typography */}
        <SECTION title="Typography" icon={<Type size={18} />} delay={0.1}>
          <div style={{ marginBottom: 32 }}>
            <LABEL hint="Larger text is easier to read for most people with dyslexia">
              Default font size: <strong style={{ color: 'var(--accent)' }}>{profile.fontSize}px</strong>
            </LABEL>
            <input type="range" min={14} max={32} value={profile.fontSize}
              onChange={e => set('fontSize', parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)', height: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              <span>14px (small)</span><span>32px (large)</span>
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <LABEL hint="More spacing between lines helps prevent skipping lines">
              Default line spacing: <strong style={{ color: 'var(--accent)' }}>{profile.lineSpacing}×</strong>
            </LABEL>
            <input type="range" min={1.2} max={3.0} step={0.1} value={profile.lineSpacing}
              onChange={e => set('lineSpacing', parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)', height: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              <span>1.2× (tight)</span><span>3.0× (very spaced)</span>
            </div>
          </div>

          <div>
            <LABEL hint="OpenDyslexic font is specifically designed to reduce reading errors">
              Reading font
            </LABEL>
            <div style={{ display: 'flex', gap: 16 }}>
              {[
                { label: 'OpenDyslexic', value: true, font: "'OpenDyslexic', sans-serif" },
                { label: 'Lexend', value: false, font: "'Lexend', sans-serif" },
              ].map(opt => (
                <button key={opt.label} onClick={() => set('useDyslexicFont', opt.value)} style={{
                  flex: 1, padding: '16px', borderRadius: 12,
                  border: `2px solid ${profile.useDyslexicFont === opt.value ? 'var(--accent)' : 'var(--border)'}`,
                  background: profile.useDyslexicFont === opt.value ? 'var(--accent-light)' : 'var(--bg-secondary)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: profile.useDyslexicFont === opt.value ? '0 4px 12px rgba(79, 70, 229, 0.15)' : 'none'
                }}>
                  <span style={{ fontFamily: opt.font, fontSize: 18, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>
                    Aa Bb Cc
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: profile.useDyslexicFont === opt.value ? 'var(--accent-dark)' : 'var(--text-muted)' }}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </SECTION>

        {/* Reading chunks */}
        <SECTION title="Reading Chunks" icon={<BookOpen size={18} />} delay={0.2}>
          <LABEL hint="Smaller chunks are easier to focus on. Larger chunks mean fewer breaks.">
            Default chunk size: <strong style={{ color: 'var(--accent)' }}>{profile.chunkSize} words</strong>
          </LABEL>
          <input type="range" min={200} max={1000} step={50} value={profile.chunkSize}
            onChange={e => set('chunkSize', parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)', height: 6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
            <span>200 (very short)</span><span>1000 (long)</span>
          </div>
        </SECTION>

        {/* Colour overlay */}
        <SECTION title="Colour Overlay" icon={<Palette size={18} />} delay={0.3}>
          <LABEL hint="Coloured overlays can reduce visual stress for readers with scotopic sensitivity">
            Default background tint
          </LABEL>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { key: 'none', label: 'None', color: 'var(--bg-primary)', border: 'var(--border)' },
              { key: 'yellow', label: 'Yellow', color: '#fef9c3', border: '#eab308' },
              { key: 'blue', label: 'Blue', color: '#dbeafe', border: '#3b82f6' },
              { key: 'green', label: 'Green', color: '#dcfce7', border: '#22c55e' },
              { key: 'pink', label: 'Pink', color: '#fce7f3', border: '#ec4899' },
              { key: 'peach', label: 'Peach', color: '#ffedd5', border: '#f97316' },
            ].map(o => (
              <button key={o.key} onClick={() => set('colorOverlay', o.key)} title={o.label} style={{
                padding: '12px 20px', borderRadius: 12, cursor: 'pointer',
                background: o.color,
                border: `2px solid ${profile.colorOverlay === o.key ? o.border : 'var(--border)'}`,
                fontSize: 14, fontWeight: 600,
                color: '#333',
                transition: 'all 0.2s',
                boxShadow: profile.colorOverlay === o.key ? `0 4px 12px ${o.border}40` : 'none'
              }}>
                {o.label}
              </button>
            ))}
          </div>
        </SECTION>

        {/* Preview */}
        <SECTION title="Preview" icon={<Eye size={18} />} delay={0.4}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
            This is how your text will look with current settings:
          </p>
          <div style={{
            padding: '32px', borderRadius: 16,
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundColor: getOverlayColor(profile.colorOverlay),
              pointerEvents: 'none',
              transition: 'background-color 0.3s ease'
            }} />
            <p style={{...previewStyle, position: 'relative', zIndex: 1}}>
              The sun rose slowly over the mountains, casting long golden shadows across the valley below. Birds began to sing as the world woke up to a new morning full of possibilities.
            </p>
          </div>
        </SECTION>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          <button onClick={handleSave} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: 18 }} disabled={saving}>
            <Save size={20} /> {saving ? 'Saving...' : 'Save settings'}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
