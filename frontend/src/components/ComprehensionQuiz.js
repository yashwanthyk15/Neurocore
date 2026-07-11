import React, { useState } from 'react';
import Button from './Button';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';

export default function ComprehensionQuiz({ questions, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!questions || questions.length === 0) {
    onComplete(100);
    return null;
  }

  const q = questions[current];
  const isCorrect = submitted && selected === q.correctIndex;
  const isWrong = submitted && selected !== null && selected !== q.correctIndex;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === q.correctIndex) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      const finalScore = Math.round(((score + (selected === q.correctIndex ? 1 : 0)) / questions.length) * 100);
      setDone(true);
      onComplete(finalScore);
    } else {
      setCurrent(c => c + 1);
      setSelected(null);
      setSubmitted(false);
    }
  };

  if (done) return null;

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1.5px solid var(--border)',
      borderRadius: 16, padding: '24px',
      animation: 'fadeIn 0.3s ease',
      boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: 'var(--accent)',
          textTransform: 'uppercase', letterSpacing: '0.5px',
        }}>
          Quick check — {current + 1} of {questions.length}
        </span>
        <div style={{
          height: 5, flex: 1, maxWidth: 100, marginLeft: 12,
          background: 'var(--border)', borderRadius: 99, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${((current + 1) / questions.length) * 100}%`,
            background: 'var(--accent)', borderRadius: 99, transition: 'width 0.3s',
          }} />
        </div>
      </div>

      <p style={{
        fontSize: 16, fontWeight: 600, color: 'var(--text-primary)',
        marginBottom: 18, lineHeight: 1.5, fontFamily: 'var(--ui-font)',
      }}>
        {q.question}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {q.options?.map((opt, idx) => {
          let bg = 'var(--bg-primary)';
          let border = 'var(--border)';
          let color = 'var(--text-primary)';
          if (submitted) {
            if (idx === q.correctIndex) { bg = '#dcfce7'; border = 'var(--success)'; color = '#166534'; }
            else if (idx === selected) { bg = '#fee2e2'; border = 'var(--danger)'; color = '#991b1b'; }
          } else if (idx === selected) {
            bg = 'var(--accent-light)'; border = 'var(--accent)'; color = 'var(--accent)';
          }
          return (
            <button key={idx} onClick={() => !submitted && setSelected(idx)} style={{
              padding: '12px 16px', borderRadius: 10,
              border: `1.5px solid ${border}`, background: bg, color,
              textAlign: 'left', fontSize: 14, fontWeight: 500,
              fontFamily: 'var(--ui-font)', cursor: submitted ? 'default' : 'pointer',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', border: `2px solid ${border}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, flexShrink: 0, color,
              }}>
                {submitted && idx === q.correctIndex ? <CheckCircle size={14} /> :
                 submitted && idx === selected && idx !== q.correctIndex ? <XCircle size={14} /> :
                 String.fromCharCode(65 + idx)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {submitted && (
        <div style={{
          padding: '10px 14px', borderRadius: 9, marginBottom: 16,
          background: isCorrect ? '#dcfce7' : '#fee2e2',
          color: isCorrect ? '#166534' : '#991b1b',
          fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {isCorrect ? 'Correct! Great work.' : `Not quite — the correct answer was: ${q.options?.[q.correctIndex]}`}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        {!submitted ? (
          <Button onClick={handleSubmit} disabled={selected === null} fullWidth>
            Check answer
          </Button>
        ) : (
          <Button onClick={handleNext} fullWidth icon={<ChevronRight size={16} />}>
            {current + 1 >= questions.length ? 'Continue reading' : 'Next question'}
          </Button>
        )}
      </div>
    </div>
  );
}
