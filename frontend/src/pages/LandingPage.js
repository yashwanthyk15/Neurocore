import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Eye, Zap, Brain, Sun, Moon, ArrowRight, CheckCircle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const features = [
    { icon: <Brain size={24} />, title: 'AI Simplification', desc: 'Powered by Gemini AI — every chunk is rewritten in clear, accessible language.' },
    { icon: <Eye size={24} />, title: 'Eye Tracking', desc: 'WebGazer monitors where you look and detects when you lose focus or reread.' },
    { icon: <Zap size={24} />, title: 'Auto-Adaptive', desc: 'Font size, line spacing and chunk size all adjust automatically as you read.' },
    { icon: <BookOpen size={24} />, title: 'Dyslexia-Friendly', desc: 'OpenDyslexic font, colour overlays and focus mode built in by default.' },
  ];

  const benefits = [
    'Upload PDF, Word or TXT documents',
    'Vocabulary tooltips for hard words',
    'Comprehension checks after every chunk',
    'Dark & light theme with colour overlays',
    'No eye-tracking data ever leaves your browser',
    'Works without a webcam in manual mode',
  ];

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>

      {/* Nav */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 5%', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius)',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={20} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.5px' }}>
            Neuro<span className="text-gradient">Core</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={toggleTheme} style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', transition: 'all 0.15s ease',
          }}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          {user ? (
            <>
              <Link to="/dashboard" className="btn-primary">Dashboard</Link>
              <button onClick={handleLogout} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px' }}>
                <LogOut size={16} /> Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Log in</Link>
              <Link to="/register" className="btn-primary">Get started</Link>
            </>
          )}
        </div>
      </motion.header>

      {/* Hero */}
      <section style={{
        textAlign: 'center', padding: '100px 24px 80px',
        maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10
      }}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--accent-light)', color: 'var(--accent)',
            borderRadius: 'var(--radius-full)', padding: '6px 16px', fontSize: 13,
            fontWeight: 600, marginBottom: 32, border: '1px solid var(--accent-light)',
          }}>
          <Zap size={14} /> AI-powered reading for every learner
        </motion.div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            fontSize: 'clamp(40px, 6vw, 64px)', fontWeight: 800,
            lineHeight: 1.15, color: 'var(--text-primary)', marginBottom: 24,
            letterSpacing: '-1.5px',
          }}>
          Reading that <br/>
          <span className="text-gradient">adapts to you</span>
        </motion.h1>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6,
            marginBottom: 40, maxWidth: 640, margin: '0 auto 40px',
          }}>
          NeuroCore watches how you read and adjusts everything — font, spacing, chunk size — automatically. Built for students with dyslexia, ADHD, or any reading challenge.
        </motion.p>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {user ? (
            <Link to="/dashboard" className="btn-primary" style={{ fontSize: 16, padding: '14px 28px', borderRadius: 'var(--radius-full)' }}>
              Go to Dashboard <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn-primary" style={{ fontSize: 16, padding: '14px 28px', borderRadius: 'var(--radius-full)' }}>
                Start reading free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-secondary" style={{ fontSize: 16, padding: '14px 24px', borderRadius: 'var(--radius-full)' }}>
                I already have an account
              </Link>
            </>
          )}
        </motion.div>
      </section>

      {/* Features */}
      <section style={{
        maxWidth: 1100, margin: '0 auto', padding: '60px 24px 100px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 24, position: 'relative', zIndex: 10
      }}>
        {features.map((f, i) => (
          <motion.div 
            key={i} 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="glass-panel"
            style={{ padding: '32px 24px' }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius)',
              background: 'var(--bg-primary)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, border: '1px solid var(--border)'
            }}>
              {f.icon}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>{f.title}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Benefits list */}
      <section className="glass-panel" style={{
        borderRadius: 0, borderLeft: 'none', borderRight: 'none',
        padding: '80px 24px', background: 'var(--bg-secondary)'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            style={{ fontSize: 32, fontWeight: 700, marginBottom: 40, letterSpacing: '-0.5px' }}>
            Everything a student needs
          </motion.h2>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16, textAlign: 'left',
          }}>
            {benefits.map((b, i) => (
              <motion.div 
                key={i} 
                initial={{ x: -10, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                style={{ 
                  display: 'flex', gap: 12, alignItems: 'center', 
                  padding: '16px', background: 'var(--bg-primary)', 
                  borderRadius: 'var(--radius)', border: '1px solid var(--border)' 
                }}>
                <CheckCircle size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>{b}</span>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {user ? (
              <Link to="/dashboard" className="btn-primary" style={{ marginTop: 48, fontSize: 16 }}>
                Go to Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/register" className="btn-primary" style={{ marginTop: 48, fontSize: 16 }}>
                Create free account <ArrowRight size={16} />
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      <footer style={{
        textAlign: 'center', padding: '32px 24px',
        color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, background: 'var(--bg-primary)'
      }}>
        © {new Date().getFullYear()} NeuroCore · Built for students who learn differently
      </footer>
    </div>
  );
}
