import React, { useState } from 'react';

export default function VocabTooltip({ word, definition, example }) {
  const [open, setOpen] = useState(false);

  return (
    <span style={{ position: 'relative', display: 'inline' }}>
      <span
        onClick={() => setOpen(!open)}
        style={{
          borderBottom: '2px dotted var(--accent)',
          color: 'var(--accent)',
          cursor: 'pointer',
          fontWeight: 600,
          padding: '0 1px',
          transition: 'background 0.15s',
          borderRadius: 3,
          background: open ? 'var(--accent-light)' : 'transparent',
        }}
      >
        {word}
      </span>
      {open && (
        <span style={{
          position: 'absolute', bottom: '130%', left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-card)',
          border: '1.5px solid var(--accent)',
          borderRadius: 12, padding: '12px 14px',
          minWidth: 200, maxWidth: 280,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 50,
          display: 'block',
          animation: 'fadeIn 0.15s ease',
        }}>
          <span style={{
            fontSize: 12, fontWeight: 700, color: 'var(--accent)',
            textTransform: 'uppercase', letterSpacing: '0.5px',
            display: 'block', marginBottom: 4, fontFamily: 'var(--ui-font)',
          }}>
            {word}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, display: 'block', marginBottom: example ? 6 : 0, fontFamily: 'var(--ui-font)' }}>
            {definition}
          </span>
          {example && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', display: 'block', fontFamily: 'var(--ui-font)' }}>
              "{example}"
            </span>
          )}
          {/* Arrow */}
          <span style={{
            position: 'absolute', bottom: -7, left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 12, height: 12,
            background: 'var(--bg-card)', border: '1.5px solid var(--accent)',
            borderTop: 'none', borderLeft: 'none',
          }} />
        </span>
      )}
    </span>
  );
}
