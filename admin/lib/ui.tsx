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

// ---------- Charts (hand-rolled SVG, no chart lib) ----------

type Series = { label: string; color: string; points: { day: string; count: number }[] };

// Multi-line area chart over a shared day axis.
export function LineChart({ series, height = 220 }: { series: Series[]; height?: number }) {
  const W = 760;
  const H = height;
  const pad = { l: 34, r: 14, t: 14, b: 24 };
  const n = series[0]?.points.length || 0;
  const allVals = series.flatMap((s) => s.points.map((p) => p.count));
  const max = Math.max(1, ...allVals);
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const x = (i: number) => pad.l + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.t + innerH - (v / max) * innerH;

  const linePath = (pts: { count: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.count).toFixed(1)}`).join(' ');
  const areaPath = (pts: { count: number }[]) =>
    `${linePath(pts)} L ${x(n - 1).toFixed(1)} ${y(0)} L ${x(0).toFixed(1)} ${y(0)} Z`;

  // ~5 gridlines
  const ticks = 4;
  const gridVals = Array.from({ length: ticks + 1 }, (_, i) => Math.round((max / ticks) * i));

  const labelEvery = Math.ceil(n / 7);

  return (
    <div className="chart-area">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMid meet">
        {gridVals.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#eceff4" strokeWidth={1} />
            <text x={pad.l - 8} y={y(v) + 3} fontSize={10} fill="#8a94a6" textAnchor="end">{v}</text>
          </g>
        ))}
        {series.map((s, si) => (
          <g key={si}>
            <path d={areaPath(s.points)} fill={s.color} opacity={0.08} />
            <path d={linePath(s.points)} fill="none" stroke={s.color} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ))}
        {series[0]?.points.map((p, i) =>
          i % labelEvery === 0 ? (
            <text key={i} x={x(i)} y={H - 6} fontSize={10} fill="#8a94a6" textAnchor="middle">
              {p.day.slice(5)}
            </text>
          ) : null
        )}
      </svg>
      <div className="legend">
        {series.map((s) => (
          <div key={s.label} className="legend-item">
            <span className="legend-dot" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// Donut chart for categorical breakdowns.
export function Donut({ data, size = 150 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eceff4" strokeWidth={14} />
        {data.map((d, i) => {
          const frac = d.value / total;
          const dash = frac * circ;
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={d.color}
              strokeWidth={14}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy - 2} fontSize={22} fontWeight={800} fill="#0f1729" textAnchor="middle">{total}</text>
        <text x={cx} y={cy + 16} fontSize={10} fill="#8a94a6" textAnchor="middle">TOTAL</text>
      </svg>
      <div className="legend" style={{ flexDirection: 'column', gap: 8 }}>
        {data.map((d) => (
          <div key={d.label} className="legend-item">
            <span className="legend-dot" style={{ background: d.color }} />
            {d.label} · <strong style={{ color: '#0f1729' }}>{d.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// Trigger a CSV download from an array of objects.
export function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function fmtMoney(inr: number) {
  return '₹' + inr.toLocaleString('en-IN');
}
