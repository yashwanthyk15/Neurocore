import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BookOpen, User, Mail, Lock, Sun, Moon, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

function Field({ label, icon, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', grade: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.grade);
      toast.success('Account created! Let\'s start reading 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', position: 'relative', overflow: 'hidden'
    }}>

      {/* Back to Home */}
      <Link to="/" style={{
        position: 'fixed', top: 24, left: 24, zIndex: 50,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', height: 44, padding: '0 16px',
        display: 'flex', alignItems: 'center', gap: 8,
        color: 'var(--text-secondary)', transition: 'all 0.15s ease',
        boxShadow: 'var(--shadow-sm)', textDecoration: 'none',
        fontSize: 14, fontWeight: 600
      }}>
        <ArrowLeft size={16} /> Home
      </Link>

      <button onClick={toggleTheme} style={{
        position: 'fixed', top: 24, right: 24, zIndex: 50,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-secondary)', transition: 'all 0.15s ease',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-panel"
        style={{
          padding: '40px', width: '100%', maxWidth: 420,
          position: 'relative', zIndex: 10, margin: '24px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius)', margin: '0 auto 16px',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <BookOpen size={24} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.5px' }}>
            Create your account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Free forever — no credit card needed
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Field label="Your name *" icon={<User size={16} />}>
            <input type="text" placeholder="Alex Smith" value={form.name}
              onChange={set('name')} className="input-field" style={{ paddingLeft: 40 }} />
          </Field>

          <Field label="Email address *" icon={<Mail size={16} />}>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={set('email')} className="input-field" style={{ paddingLeft: 40 }} />
          </Field>

          <Field label="Password *" icon={<Lock size={16} />}>
            <input type="password" placeholder="At least 6 characters" value={form.password}
              onChange={set('password')} className="input-field" style={{ paddingLeft: 40 }} />
          </Field>

          <div style={{ marginBottom: 32 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Grade / Year (optional)
            </label>
            <select value={form.grade} onChange={set('grade')}
              className="input-field"
              style={{ appearance: 'none', cursor: 'pointer' }}
            >
              <option value="">Select grade...</option>
              {['Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12','College / University','Adult'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '12px', fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
