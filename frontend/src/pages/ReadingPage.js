import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useReadingSession } from '../hooks/useReadingSession';
import { useEyeTracking } from '../hooks/useEyeTracking';
import VocabTooltip from '../components/VocabTooltip';
import ComprehensionQuiz from '../components/ComprehensionQuiz';
import ReadingControls from '../components/ReadingControls';
import {
  ChevronLeft, ChevronRight, Settings2, Camera, CameraOff,
  ArrowLeft, ThumbsDown, Loader, AlertCircle, CheckCircle2,
  BookOpen, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FONT_CLASS_MAP = {
  dyslexic: 'font-dyslexic',
  lexend: 'font-lexend',
  nunito: 'font-nunito',
  mono: 'font-mono',
};

const OVERLAY_BG = {
  none: 'transparent',
  yellow: 'var(--overlay-yellow)',
  blue: 'var(--overlay-blue)',
  green: 'var(--overlay-green)',
  pink: 'var(--overlay-pink)',
  peach: 'var(--overlay-peach)',
};

function renderTextWithVocab(text, vocabulary) {
  if (!vocabulary || vocabulary.length === 0) return text;
  const vocabMap = {};
  vocabulary.forEach(v => { if (v.word) vocabMap[v.word.toLowerCase()] = v; });
  const words = text.split(/(\s+)/);
  return words.map((token, i) => {
    const clean = token.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (vocabMap[clean]) {
      const v = vocabMap[clean];
      return (
        <VocabTooltip key={i} word={token.trim()} definition={v.definition} example={v.example} />
      );
    }
    return token;
  });
}

export default function ReadingPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [docMeta, setDocMeta] = useState(null);
  const [chunk, setChunk] = useState(null);
  const [chunkLoading, setChunkLoading] = useState(true);
  const [totalChunks, setTotalChunks] = useState(0);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [resimplifying, setResimplifying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [adaptationBanner, setAdaptationBanner] = useState(null);
  const [eyeMode, setEyeMode] = useState('init'); // init | active | manual | error
  const [manualDifficulty, setManualDifficulty] = useState(null);

  const chunkStartTime = useRef(Date.now());
  const manualRereadCount = useRef(0);
  const manualFocusLoss = useRef(0);

  const initialSettings = {
    fontSize: user?.readingProfile?.fontSize || 18,
    lineSpacing: user?.readingProfile?.lineSpacing || 1.8,
    chunkSize: user?.readingProfile?.chunkSize || 600,
    focusMode: false,
    colorOverlay: user?.readingProfile?.colorOverlay || 'none',
    fontKey: user?.readingProfile?.useDyslexicFont ? 'dyslexic' : 'lexend',
    resimplify: false,
  };

  const {
    settings, setSettings,
    currentChunkIndex, setCurrentChunkIndex,
    saveSnapshot, processAdaptation, adaptationReasons
  } = useReadingSession(documentId, initialSettings);

  const eyeTracking = useEyeTracking();

  useEffect(() => {
    if (adaptationReasons.length > 0) {
      setAdaptationBanner(adaptationReasons[0]);
      const t = setTimeout(() => setAdaptationBanner(null), 5000);
      return () => clearTimeout(t);
    }
  }, [adaptationReasons]);

  useEffect(() => {
    api.get(`/documents/${documentId}`)
      .then(res => setDocMeta(res.data.document))
      .catch(() => toast.error('Could not load document'));
  }, [documentId]);

  useEffect(() => {
    loadChunk(currentChunkIndex);
  }, [currentChunkIndex]); // eslint-disable-line

  useEffect(() => {
    eyeTracking.init()
      .then(() => setEyeMode('active'))
      .catch(() => setEyeMode('manual'));
  }, []); // eslint-disable-line

  useEffect(() => {
    if (eyeMode !== 'active') return;
    const interval = setInterval(() => {
      const signals = eyeTracking.getSignals();
      processAdaptation(signals);
    }, 20000);
    return () => clearInterval(interval);
  }, [eyeMode]); // eslint-disable-line

  const loadChunk = async (index) => {
    setChunkLoading(true);
    setShowQuiz(false);
    setQuizDone(false);
    setShowOriginal(false);
    chunkStartTime.current = Date.now();
    manualRereadCount.current = 0;
    if (eyeTracking.resetSignals) eyeTracking.resetSignals();
    try {
      const res = await api.get(`/documents/${documentId}/chunk/${index}`);
      setChunk(res.data.chunk);
      setTotalChunks(res.data.totalChunks);
    } catch (err) {
      toast.error('Could not load this section');
    } finally {
      setChunkLoading(false);
    }
  };

  const handleNext = async () => {
    const timeOnChunk = Math.floor((Date.now() - chunkStartTime.current) / 1000);
    let signals;
    if (eyeMode === 'active') {
      signals = eyeTracking.getSignals();
    } else {
      signals = {
        timeOnChunk,
        rereadCount: manualRereadCount.current,
        focusLossCount: manualFocusLoss.current,
        comprehensionScore: manualDifficulty === 'hard' ? 30 : manualDifficulty === 'ok' ? 65 : 90,
      };
    }
    await processAdaptation(signals);
    await saveSnapshot({ ...signals, chunkIndex: currentChunkIndex, timestamp: new Date() });

    if (currentChunkIndex + 1 >= totalChunks) {
      toast.success('🎉 You finished the document!');
      navigate('/dashboard');
    } else {
      setCurrentChunkIndex(i => i + 1);
      setManualDifficulty(null);
    }
  };

  const handlePrev = () => {
    if (currentChunkIndex > 0) {
      manualRereadCount.current += 1;
      setCurrentChunkIndex(i => i - 1);
    }
  };

  const handleQuizComplete = (score) => {
    setQuizDone(true);
    const signals = {
      timeOnChunk: Math.floor((Date.now() - chunkStartTime.current) / 1000),
      comprehensionScore: score,
      rereadCount: manualRereadCount.current,
      focusLossCount: 0,
    };
    processAdaptation(signals);
  };

  const handleResimplify = async () => {
    setResimplifying(true);
    try {
      const res = await api.post(`/documents/${documentId}/chunk/${currentChunkIndex}/resimplify`);
      setChunk(c => ({ ...c, simplifiedText: res.data.simplifiedText }));
      toast.success('Text has been simplified further ✨');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not re-simplify right now');
    } finally {
      setResimplifying(false);
    }
  };

  const progress = totalChunks > 0 ? ((currentChunkIndex + 1) / totalChunks) * 100 : 0;
  const overlayBg = OVERLAY_BG[settings.colorOverlay] || 'transparent';

  const textStyle = {
    fontSize: settings.fontSize,
    lineHeight: settings.lineSpacing,
    fontFamily: settings.fontKey === 'dyslexic' ? "'OpenDyslexic', 'Lexend', sans-serif"
               : settings.fontKey === 'lexend' ? "'Lexend', sans-serif"
               : settings.fontKey === 'mono' ? "'Space Mono', monospace"
               : "'Nunito', sans-serif",
    color: 'var(--text-primary)',
    wordSpacing: settings.fontKey === 'dyslexic' ? '0.12em' : undefined,
    letterSpacing: settings.fontKey === 'dyslexic' ? '0.05em' : undefined,
    transition: 'all 0.3s ease'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: settings.focusMode ? 'var(--bg-primary)' : 'var(--bg-primary)',
      transition: 'background 0.4s ease',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Top bar */}
      <div className="glass-panel" style={{
        borderRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none',
        background: settings.focusMode ? 'var(--bg-primary)' : 'var(--bg-card)',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', gap: 16,
        position: 'sticky', top: 0, zIndex: 90,
      }}>
        <button onClick={() => navigate('/dashboard')} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', background: 'var(--bg-secondary)',
          color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, fontWeight: 600,
          flexShrink: 0, transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-focus)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
          <ArrowLeft size={16} /> Back
        </button>

        {/* Progress bar */}
        <div style={{ flex: 1, minWidth: 0, margin: '0 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
              {docMeta?.title || 'Loading...'}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>
              Section {currentChunkIndex + 1} of {totalChunks || '?'}
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'var(--accent)',
              borderRadius: 99, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        </div>

        {/* Controls toggle */}
        <button onClick={() => setShowControls(!showControls)} style={{
          width: 40, height: 40, borderRadius: 'var(--radius)',
          border: `1px solid ${showControls ? 'var(--accent)' : 'var(--border)'}`,
          background: showControls ? 'var(--accent-light)' : 'var(--bg-secondary)',
          color: showControls ? 'var(--accent)' : 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          flexShrink: 0, transition: 'all 0.15s ease',
          boxShadow: showControls ? 'var(--shadow-sm)' : 'none'
        }}>
          <Settings2 size={18} />
        </button>

        {/* Eye tracking indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 'var(--radius)',
          background: eyeMode === 'active' ? 'var(--success-light)' : 'var(--bg-hover)',
          border: `1px solid ${eyeMode === 'active' ? 'var(--success)' : 'var(--border)'}`,
          fontSize: 12, fontWeight: 600,
          color: eyeMode === 'active' ? 'var(--success-dark)' : 'var(--text-secondary)',
          flexShrink: 0,
        }}>
          {eyeMode === 'active' ? <Camera size={14} /> : <CameraOff size={14} />}
          {eyeMode === 'active' ? 'Eye tracking active' : 'Manual mode'}
        </div>
      </div>

      {/* Adaptation banner */}
      <AnimatePresence>
        {adaptationBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute', top: 88, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
              background: 'var(--accent)', color: '#fff',
              padding: '10px 20px', borderRadius: 99,
              fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <Sparkles size={14} /> {adaptationBanner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div style={{
        maxWidth: showControls ? 1200 : 860,
        margin: '0 auto',
        padding: '40px 24px',
        display: 'grid',
        gridTemplateColumns: showControls ? '1fr 320px' : '1fr',
        gap: 32,
        transition: 'max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>

        {/* Reading area */}
        <div style={{ minWidth: 0 }}>
          {chunkLoading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="glass-panel skeleton" style={{ height: 32, marginBottom: 24, borderRadius: 'var(--radius)', width: '40%' }} />
              <div className="glass-panel" style={{ padding: '40px' }}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 24, marginBottom: 16, borderRadius: 'var(--radius)', width: `${75 + Math.random() * 25}%` }} />
                ))}
              </div>
            </motion.div>
          ) : chunk ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {/* Chunk header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                    background: 'var(--accent)', color: '#fff',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <BookOpen size={14} /> Section {currentChunkIndex + 1}
                  </div>
                  {chunk.processingError && (
                    <div style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'var(--warning-light)', color: 'var(--warning-dark)', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--warning)' }}>
                      <AlertCircle size={12} /> Original text (AI unavailable)
                    </div>
                  )}
                  {!chunk.processingError && chunk.processed && (
                    <div style={{ padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: 'var(--success-light)', color: 'var(--success-dark)', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--success)' }}>
                      <CheckCircle2 size={12} /> AI simplified
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowOriginal(!showOriginal)} style={{
                    padding: '8px 14px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600,
                    border: `1px solid ${showOriginal ? 'var(--accent)' : 'var(--border)'}`,
                    background: showOriginal ? 'var(--accent-light)' : 'var(--bg-card)',
                    color: showOriginal ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}>
                    {showOriginal ? 'Show simplified' : 'Show original'}
                  </button>
                  <button onClick={handleResimplify} disabled={resimplifying} style={{
                    padding: '8px 14px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                    {resimplifying ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
                    Simplify more
                  </button>
                </div>
              </div>

              {/* Text content */}
              <div className="glass-panel" style={{
                padding: '48px',
                marginBottom: 32,
                position: 'relative',
                overflow: 'hidden',
                background: settings.focusMode ? 'var(--bg-primary)' : 'var(--bg-card)',
              }}>
                {overlayBg !== 'transparent' && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: overlayBg, pointerEvents: 'none',
                    transition: 'background-color 0.3s ease',
                  }} />
                )}
                <p style={{ ...textStyle, margin: 0, position: 'relative', zIndex: 1 }}>
                  {showOriginal
                    ? chunk.originalText
                    : renderTextWithVocab(chunk.simplifiedText || chunk.originalText, chunk.vocabulary)
                  }
                </p>
              </div>

              {/* Vocabulary panel */}
              {chunk.vocabulary && chunk.vocabulary.length > 0 && (
                <div className="glass-panel" style={{ padding: '24px', marginBottom: 32 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    📚 Word Helper ({chunk.vocabulary.length} words)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                    {chunk.vocabulary.map((v, i) => (
                      <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15, display: 'block', marginBottom: 4 }}>
                          {v.word}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, display: 'block' }}>
                          {v.definition}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quiz / Continue */}
              {!showQuiz && !quizDone && chunk.comprehensionQuestions?.length > 0 && (
                <div className="glass-panel" style={{
                  padding: '24px', marginBottom: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
                  borderLeft: '4px solid var(--accent)'
                }}>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                      Quick comprehension check
                    </p>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                      {chunk.comprehensionQuestions.length} short question{chunk.comprehensionQuestions.length > 1 ? 's' : ''} to check your understanding
                    </p>
                  </div>
                  <button onClick={() => setShowQuiz(true)} className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
                    Take quiz
                  </button>
                </div>
              )}

              {showQuiz && (
                <div style={{ marginBottom: 32 }}>
                  <ComprehensionQuiz
                    questions={chunk.comprehensionQuestions}
                    onComplete={(score) => {
                      setShowQuiz(false);
                      setQuizDone(true);
                      handleQuizComplete(score);
                    }}
                  />
                </div>
              )}

              {/* Manual difficulty */}
              {eyeMode === 'manual' && !showQuiz && (
                <div className="glass-panel" style={{ padding: '24px', marginBottom: 32 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
                    How was this section?
                  </p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {['easy', 'ok', 'hard'].map(d => (
                      <button key={d} onClick={() => setManualDifficulty(d)} style={{
                        flex: 1, padding: '12px', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 600,
                        border: `1px solid ${manualDifficulty === d ? 'var(--accent)' : 'var(--border)'}`,
                        background: manualDifficulty === d ? 'var(--accent-light)' : 'var(--bg-secondary)',
                        color: manualDifficulty === d ? 'var(--accent)' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}>
                        <span style={{ fontSize: 18 }}>{d === 'easy' ? '😊' : d === 'ok' ? '😐' : '😓'}</span>
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)', color: 'var(--text-muted)',
                  fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-secondary)' }}
                  onClick={() => toast('Thanks for the feedback! We\'ll review this section.', { icon: '👍' })}
                >
                  <ThumbsDown size={14} /> Not helpful
                </button>
              </div>

              {/* Navigation */}
              <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={handlePrev}
                  disabled={currentChunkIndex === 0}
                  className="btn-primary"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border)', opacity: currentChunkIndex === 0 ? 0.5 : 1, boxShadow: 'none' }}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
                  {Math.round(progress)}% complete
                </span>
                <button
                  onClick={handleNext}
                  className="btn-primary"
                >
                  {currentChunkIndex + 1 >= totalChunks ? 'Finish Document' : 'Next Section'} <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '64px 24px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 16, marginBottom: 16 }}>Could not load this section.</p>
              <button onClick={() => loadChunk(currentChunkIndex)} className="btn-primary">
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Controls panel */}
        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              style={{ position: 'sticky', top: 100, height: 'fit-content' }}
            >
              <ReadingControls settings={settings} onChange={setSettings} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
