'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Shell } from '../components/Shell';
import { AnalyticsResponse, StatsResponse, api } from '../lib/api';
import { Donut, EmptyState, LineChart, Spinner, fmtMoney, profMeta } from '../lib/ui';

const REFRESH_MS = 60000;

const GENDER_COLORS: Record<string, string> = {
  Man: '#3b82f6',
  Woman: '#ec4899',
  'Non-binary': '#7c3aed',
  Transgender: '#14b8a6',
  Genderfluid: '#f4a261',
  Other: '#8a94a6'
};

function sum(points: { count: number }[]) {
  return points.reduce((s, p) => s + p.count, 0);
}

export default function OverviewPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([api.stats(), api.analytics(14)]);
      setStats(s);
      setAnalytics(a);
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  if (error) return <Shell title="Overview"><EmptyState emoji="📡" title="Couldn't load" text={error} /></Shell>;
  if (!stats || !analytics) return <Shell title="Overview"><Spinner /></Shell>;

  const s = stats.stats;
  const cards = [
    { label: 'Total Users', value: s.users, icon: '👥', sub: `${s.active} active` },
    { label: 'Pro Members', value: s.pro, icon: '⭐', sub: `${((s.pro / Math.max(s.users, 1)) * 100).toFixed(0)}% of users` },
    { label: 'Matches', value: s.matches, icon: '💞', sub: `${sum(analytics.matches)} in 14d` },
    { label: 'Messages', value: s.messages, icon: '💬', sub: `${sum(analytics.messages)} in 14d` },
    { label: 'Verified', value: s.verified, icon: '🛡️', sub: `${s.deactivated} deactivated` },
    { label: 'Open Reports', value: s.reportsOpen, icon: '🚩', sub: s.reportsOpen ? 'needs review' : 'all clear' }
  ];

  const genderData = analytics.byGender.map((g) => ({
    label: g.gender,
    value: g.count,
    color: GENDER_COLORS[g.gender] || '#8a94a6'
  }));

  const maxProf = Math.max(1, ...stats.byProfession.map((p) => p.count));

  return (
    <Shell
      title="Overview"
      subtitle="A live snapshot of Pro Match"
      actions={
        <span className="live-pill">
          <span className="live-dot" /> Live · {updatedAt}
        </span>
      }
    >
      {/* Stat cards */}
      <div className="stat-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat">
            <div className="stat-top">
              <span className="stat-label">{c.label}</span>
              <span className="stat-icon">{c.icon}</span>
            </div>
            <div className="stat-value">{c.value.toLocaleString()}</div>
            <div className="stat-delta flat">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue band */}
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="stat">
          <div className="stat-top"><span className="stat-label">Est. Revenue</span><span className="stat-icon">💰</span></div>
          <div className="stat-value">{fmtMoney(analytics.revenue.totalInr)}</div>
          <div className="stat-delta flat">estimated · Pro + credits</div>
        </div>
        <div className="stat">
          <div className="stat-top"><span className="stat-label">From Pro</span><span className="stat-icon">⭐</span></div>
          <div className="stat-value">{fmtMoney(analytics.revenue.proInr)}</div>
          <div className="stat-delta flat">{s.pro} subscribers</div>
        </div>
        <div className="stat">
          <div className="stat-top"><span className="stat-label">From Credits</span><span className="stat-icon">🪙</span></div>
          <div className="stat-value">{fmtMoney(analytics.revenue.creditsInr)}</div>
          <div className="stat-delta flat">reveal spends</div>
        </div>
      </div>

      {/* Growth chart */}
      <div className="card card-pad" style={{ marginTop: 16 }}>
        <div className="card-head">
          <div>
            <div className="card-title">Growth · last 14 days</div>
            <div className="card-hint">Daily signups, matches and messages</div>
          </div>
        </div>
        <LineChart
          series={[
            { label: 'Signups', color: '#e76f51', points: analytics.signups },
            { label: 'Matches', color: '#ec4899', points: analytics.matches },
            { label: 'Messages', color: '#3b82f6', points: analytics.messages }
          ]}
        />
      </div>

      {/* Breakdowns */}
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="card card-pad">
          <div className="card-head"><div className="card-title">Gender breakdown</div></div>
          {genderData.length ? <Donut data={genderData} /> : <div className="empty-text">No gender data yet.</div>}
        </div>

        <div className="card card-pad">
          <div className="card-head"><div className="card-title">Users by profession</div></div>
          {stats.byProfession.length === 0 ? (
            <div className="empty-text">No profession data yet.</div>
          ) : (
            stats.byProfession.map((p) => {
              const m = profMeta(p.profession);
              return (
                <div key={p.profession} className="bar-row">
                  <div className="bar-label">{m.emoji} {p.profession}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(p.count / maxProf) * 100}%`, background: m.color }} />
                  </div>
                  <div className="bar-count">{p.count}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Shell>
  );
}
