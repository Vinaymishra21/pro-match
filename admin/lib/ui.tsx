'use client';

import React from 'react';

// Profession → emoji + accent, mirrors the mobile app's PRISM identity.
const PROF: Record<string, { emoji: string; color: string }> = {
  'Software Engineer': { emoji: '💻', color: '#5b8def' },
  Doctor: { emoji: '🩺', color: '#2dd4bf' },
  Teacher: { emoji: '📚', color: '#f4a261' },
  Lawyer: { emoji: '⚖️', color: '#8b5cf6' },
  Designer: { emoji: '🎨', color: '#ec4899' },
  'Marketing Specialist': { emoji: '📣', color: '#fbbf24' },
  Entrepreneur: { emoji: '🚀', color: '#e76f51' },
  'Finance Analyst': { emoji: '📈', color: '#34d399' }
};

export function profMeta(p?: string) {
  return PROF[p || ''] || { emoji: '🧑‍💼', color: '#6f7aa8' };
}

export function ProfChip({ profession }: { profession?: string }) {
  if (!profession) return <span className="u-meta">—</span>;
  const m = profMeta(profession);
  return (
    <span className="chip-prof" style={{ boxShadow: `inset 0 0 0 1px ${m.color}44` }}>
      <span>{m.emoji}</span>
      {profession}
    </span>
  );
}

export function Avatar({ photo, name }: { photo?: string; name?: string }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="u-avatar" src={photo} alt={name || ''} />;
  }
  return <div className="u-avatar">{(name || '?').charAt(0).toUpperCase()}</div>;
}

export function Spinner() {
  return (
    <div className="center-state">
      <div className="spinner" />
    </div>
  );
}

export function EmptyState({ emoji, title, text }: { emoji: string; title: string; text?: string }) {
  return (
    <div className="center-state fade-in">
      <div>
        <div className="empty-emoji">{emoji}</div>
        <div className="empty-title">{title}</div>
        {text ? <div className="empty-text">{text}</div> : null}
      </div>
    </div>
  );
}

export function timeAgo(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '—';
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
