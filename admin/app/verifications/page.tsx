'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Shell } from '../../components/Shell';
import { AdminVerification, api } from '../../lib/api';
import { Avatar, EmptyState, ProfChip, Spinner, timeAgo } from '../../lib/ui';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' }
];

const STATUS_BADGE: Record<string, string> = {
  pending: 'amber',
  approved: 'green',
  rejected: 'gray'
};

export default function VerificationsPage() {
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; pages: number; requests: AdminVerification[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.verifications({ status, page }));
    } catch {
      setData({ total: 0, pages: 0, requests: [] });
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function review(id: string, action: 'approve' | 'reject') {
    setBusy(id + action);
    try {
      await api.reviewVerification(id, action);
      await load();
    } catch (e: any) {
      alert(e?.message || 'Failed');
    } finally {
      setBusy('');
    }
  }

  return (
    <Shell title="Verifications" subtitle="Approve profession badges — the app's trust anchor">
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
      ) : !data || data.requests.length === 0 ? (
        <EmptyState emoji="🛡️" title="Nothing to review" text="No verification requests in this view." />
      ) : (
        <div className="fade-in" style={{ display: 'grid', gap: 14 }}>
          {data.requests.map((r) => (
            <div key={r.id} className="card card-pad">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <Avatar photo={r.user?.photo} name={r.user?.name} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>
                      {r.user?.name || 'Unknown'}{' '}
                      <span className={`badge ${STATUS_BADGE[r.status] || 'gray'}`} style={{ marginLeft: 6 }}>{r.status}</span>
                      {r.user?.professionVerified ? <span className="badge green" style={{ marginLeft: 6 }}>verified</span> : null}
                    </div>
                    <div style={{ marginTop: 6 }}><ProfChip profession={r.profession || r.user?.profession} /></div>

                    {/* Evidence */}
                    <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                      {r.linkedinUrl ? (
                        <a
                          href={r.linkedinUrl.startsWith('http') ? r.linkedinUrl : `https://${r.linkedinUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="badge"
                          style={{ background: '#0A66C2', color: '#fff', textDecoration: 'none' }}
                        >
                          in · View LinkedIn ↗
                        </a>
                      ) : null}
                      {r.documentUrl ? (
                        <a href={r.documentUrl} target="_blank" rel="noreferrer" title="Open full document">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.documentUrl}
                            alt="proof document"
                            style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)', display: 'block' }}
                          />
                        </a>
                      ) : null}
                      {!r.linkedinUrl && !r.documentUrl ? (
                        <span className="badge amber">no evidence attached</span>
                      ) : null}
                    </div>

                    {r.note ? <div style={{ marginTop: 10, color: 'var(--text-dim)', fontSize: 14 }}>“{r.note}”</div> : null}
                    <div className="u-meta" style={{ marginTop: 10 }}>Requested {timeAgo(r.createdAt)}</div>
                  </div>
                </div>

                {r.status === 'pending' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
                    <button className="btn success sm" disabled={!!busy} onClick={() => review(r.id, 'approve')}>
                      Approve badge
                    </button>
                    <button className="btn ghost sm" disabled={!!busy} onClick={() => review(r.id, 'reject')}>
                      Reject
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
