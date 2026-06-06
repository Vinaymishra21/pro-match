'use client';

import React, { useEffect, useState } from 'react';
import { Shell } from '../components/Shell';
import { api, StatsResponse } from '../lib/api';
import { EmptyState, Spinner, profMeta } from '../lib/ui';

const CARDS: { key: keyof StatsResponse['stats']; label: string; icon: string; accent: string }[] = [
  { key: 'users', label: 'Total Users', icon: '👥', accent: '#5b8def' },
  { key: 'active', label: 'Active', icon: '✅', accent: '#34d399' },
  { key: 'pro', label: 'Pro Members', icon: '⭐', accent: '#f5c56b' },
  { key: 'verified', label: 'Verified', icon: '🛡️', accent: '#2dd4bf' },
  { key: 'matches', label: 'Matches', icon: '💞', accent: '#ec4899' },
  { key: 'messages', label: 'Messages', icon: '💬', accent: '#8b5cf6' },
  { key: 'reportsOpen', label: 'Open Reports', icon: '🚩', accent: '#f87171' },
  { key: 'deactivated', label: 'Deactivated', icon: '🚫', accent: '#6f7aa8' }
];

export default function OverviewPage() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .stats()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const maxProf = data ? Math.max(1, ...data.byProfession.map((p) => p.count)) : 1;

  return (
    <Shell title="Overview" subtitle="A live snapshot of Pro Match">
      {error ? (
        <EmptyState emoji="📡" title="Couldn't load stats" text={error} />
      ) : !data ? (
        <Spinner />
      ) : (
        <div className="fade-in">
          <div className="stat-grid">
            {CARDS.map((c) => (
              <div key={c.key} className="stat" style={{ ['--accent' as any]: c.accent }}>
                <div className="stat-icon" style={{ ['--accent' as any]: c.accent }}>{c.icon}</div>
                <div className="stat-label">{c.label}</div>
                <div className="stat-value">{data.stats[c.key].toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="card card-pad" style={{ marginTop: 22 }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 17, fontWeight: 800 }}>Users by Profession</h3>
            {data.byProfession.length === 0 ? (
              <div className="empty-text">No profession data yet.</div>
            ) : (
              data.byProfession.map((p) => {
                const m = profMeta(p.profession);
                return (
                  <div key={p.profession} className="bar-row">
                    <div className="bar-label">
                      {m.emoji} {p.profession}
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(p.count / maxProf) * 100}%`, background: m.color }}
                      />
                    </div>
                    <div className="bar-count">{p.count}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}
