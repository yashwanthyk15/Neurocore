import React from 'react';

const variants = {
  primary: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'var(--bg-hover)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
  },
  danger: {
    background: 'var(--danger)',
    color: '#fff',
    border: 'none',
  },
  success: {
    background: 'var(--success)',
    color: '#fff',
    border: 'none',
  },
};

export default function Button({
  children, variant = 'primary', size = 'md',
  disabled = false, loading = false, onClick, style, fullWidth, icon, type = 'button'
}) {
  const sizeStyles = {
    sm: { padding: '6px 14px', fontSize: '13px', borderRadius: '8px' },
    md: { padding: '10px 20px', fontSize: '15px', borderRadius: '10px' },
    lg: { padding: '14px 28px', fontSize: '16px', borderRadius: '12px' },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...variants[variant],
        ...sizeStyles[size],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        fontFamily: 'var(--ui-font)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: 'all 0.18s ease',
        width: fullWidth ? '100%' : undefined,
        boxShadow: variant === 'primary' ? '0 2px 8px rgba(99,102,241,0.25)' : undefined,
        ...style,
      }}
      onMouseEnter={e => {
        if (!disabled && !loading) {
          e.currentTarget.style.filter = 'brightness(1.08)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.filter = '';
        e.currentTarget.style.transform = '';
      }}
    >
      {loading && (
        <span style={{
          width: 16, height: 16, border: '2px solid currentColor',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite', display: 'inline-block'
        }} />
      )}
      {!loading && icon && icon}
      {children}
    </button>
  );
}
