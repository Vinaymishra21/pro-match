'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Shell } from '../../components/Shell';
import { AdminReport, api } from '../../lib/api';
import { Avatar, EmptyState, ProfChip, Spinner, timeAgo } from '../../lib/ui';

const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'dismissed', label: 'Dismissed' },
  { key: '', label: 'All' }
];

const STATUS_BADGE: Record<string, string> = {
  open: 'red',
  reviewing: 'amber',
  resolved: 'green',
  dismissed: 'gray'
};

export default function ReportsPage() {
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; pages: number; reports: AdminReport[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.reports({ status, page }));
    } catch {
      setData({ total: 0, pages: 0, reports: [] });
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function resolve(id: string, newStatus: string, banUser = false) {
    setBusy(id + newStatus);
    try {
      await api.updateReport(id, { status: newStatus, banUser });
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed');
    } finally {
      setBusy('');
    }
  }

  return (
    <Shell title="Reports" subtitle="Moderation queue — keep the community safe">
      <div className="toolbar">
        <div className="seg">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={status === t.key ? 'on' : ''}
              onClick={() => {
                setPage(1);
                setStatus(t.key);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : !data || data.reports.length === 0 ? (
        <EmptyState emoji="🎉" title="Nothing to review" text="No reports in this view." />
      ) : (
        <div className="fade-in" style={{ display: 'grid', gap: 14 }}>
          {data.reports.map((r) => (
            <div key={r.id} className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <Avatar photo={r.reportedUser?.photo} name={r.reportedUser?.name} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>
                      {r.reportedUser?.name || 'Unknown'}{' '}
                      <span className={`badge ${STATUS_BADGE[r.status] || 'gray'}`} style={{ marginLeft: 6 }}>{r.status}</span>
                      {r.reportedUser?.isDeactivated ? <span className="badge red" style={{ marginLeft: 6 }}>Banned</span> : null}
                    </div>
                    <div style={{ marginTop: 6 }}><ProfChip profession={r.reportedUser?.profession} /></div>
                    <div style={{ marginTop: 10 }}>
                      <span className="badge amber">{r.reason}</span>
                      {r.alsoBlocked ? <span className="badge gray" style={{ marginLeft: 6 }}>reporter blocked them</span> : null}
                    </div>
                    {r.note ? <div style={{ marginTop: 10, color: 'var(--text-dim)', fontSize: 14 }}>“{r.note}”</div> : null}
                    <div className="u-meta" style={{ marginTop: 10 }}>
                      Reported by {r.reporter?.name || 'someone'} · {timeAgo(r.createdAt)}
                    </div>
                  </div>
                </div>

                {r.status === 'open' || r.status === 'reviewing' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
                    <button className="btn danger sm" disabled={!!busy} onClick={() => resolve(r.id, 'resolved', true)}>
                      Ban & resolve
                    </button>
                    <button className="btn success sm" disabled={!!busy} onClick={() => resolve(r.id, 'resolved', false)}>
                      Resolve only
                    </button>
                    <button className="btn ghost sm" disabled={!!busy} onClick={() => resolve(r.id, 'dismissed', false)}>
                      Dismiss
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && data.pages > 1 ? (
        <div className="pager">
          <div className="pager-info">Page {page} of {data.pages}</div>
          <div className="pager-btns">
            <button className="btn sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
            <button className="btn sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
