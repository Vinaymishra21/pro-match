'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Shell } from '../../components/Shell';
import { AdminMatch, api } from '../../lib/api';
import { EmptyState, ProfChip, Spinner, timeAgo } from '../../lib/ui';
import { ConversationModal } from '../../components/ConversationModal';

const STATUS_BADGE: Record<string, string> = {
  active: 'green',
  unmatched: 'gray',
  blocked: 'red'
};

export default function MatchesPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; pages: number; matches: AdminMatch[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.matches({ page }));
    } catch {
      setData({ total: 0, pages: 0, matches: [] });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Shell title="Matches" subtitle={data ? `${data.total.toLocaleString()} total matches` : 'Investigate conversations'}>
      <div className="card">
        {loading ? (
          <Spinner />
        ) : !data || data.matches.length === 0 ? (
          <EmptyState emoji="💞" title="No matches yet" />
        ) : (
          <div className="table-wrap fade-in">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Messages</th>
                  <th>Last activity</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.matches.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>
                        {m.userA?.name || '—'} <span style={{ color: 'var(--text-mute)' }}>×</span> {m.userB?.name || '—'}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        <ProfChip profession={m.userA?.profession} />
                        <ProfChip profession={m.userB?.profession} />
                      </div>
                    </td>
                    <td>
                      {m.crossProfession ? <span className="badge violet">Cross-profession</span> : <span className="badge blue">Same</span>}
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[m.status] || 'gray'}`}>{m.status}</span></td>
                    <td style={{ fontWeight: 700 }}>{m.messageCount}</td>
                    <td className="u-meta">{timeAgo(m.lastMessageAt || m.createdAt)}</td>
                    <td>
                      <button className="btn sm" disabled={m.messageCount === 0} onClick={() => setOpenId(m.id)}>
                        View chat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && data.pages > 1 ? (
        <div className="pager">
          <div className="pager-info">Page {page} of {data.pages}</div>
          <div className="pager-btns">
            <button className="btn sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
            <button className="btn sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        </div>
      ) : null}

      {openId ? <ConversationModal matchId={openId} onClose={() => setOpenId(null)} /> : null}
    </Shell>
  );
}
