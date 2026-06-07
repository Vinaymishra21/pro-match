'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shell } from '../../components/Shell';
import { AdminUser, api } from '../../lib/api';
import { Avatar, EmptyState, ProfChip, Spinner, downloadCSV, fmtDate } from '../../lib/ui';
import { UserModal } from '../../components/UserModal';

export default function UsersPage() {
  // useSearchParams must be inside a Suspense boundary for static export.
  return (
    <Suspense fallback={<Shell title="Users"><Spinner /></Shell>}>
      <UsersInner />
    </Suspense>
  );
}

function UsersInner() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; pages: number; users: AdminUser[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  // Deep-link from global search (?focus=<userId>) opens that user.
  useEffect(() => {
    const focus = searchParams.get('focus');
    if (focus) setSelected(focus);
  }, [searchParams]);

  function exportCsv() {
    if (!data) return;
    downloadCSV(
      `promatch-users-page${page}.csv`,
      data.users.map((u) => ({
        name: u.name,
        email: u.email,
        phone: u.phone,
        profession: u.profession,
        gender: u.gender,
        age: u.age ?? '',
        tier: u.tier,
        verified: u.professionVerified,
        deactivated: u.isDeactivated,
        joined: u.createdAt
      }))
    );
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.users({ search, page });
      setData(res);
    } catch {
      setData({ total: 0, pages: 0, users: [] });
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  // Debounce search.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <Shell title="Users" subtitle={data ? `${data.total.toLocaleString()} total members` : 'Manage members'}>
      <div className="toolbar">
        <div className="search-box">
          <span className="s-ic">🔍</span>
          <input
            className="input"
            placeholder="Search name, email, phone, profession…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn sm" onClick={exportCsv} disabled={!data || data.users.length === 0}>
          ⬇ Export CSV
        </button>
      </div>

      <div className="card">
        {loading ? (
          <Spinner />
        ) : !data || data.users.length === 0 ? (
          <EmptyState emoji="🔍" title="No users found" text="Try a different search." />
        ) : (
          <div className="table-wrap fade-in">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Profession</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="u-cell">
                        <Avatar photo={u.photo} name={u.name} />
                        <div>
                          <div className="u-name">
                            {u.name}
                            {u.professionVerified ? <span className="badge teal" style={{ marginLeft: 8 }}>✓ Verified</span> : null}
                            {u.isAdmin ? <span className="badge violet" style={{ marginLeft: 6 }}>Admin</span> : null}
                          </div>
                          <div className="u-meta">{u.email || u.phone || '—'}{u.age ? ` · ${u.age}` : ''}{u.gender ? ` · ${u.gender}` : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td><ProfChip profession={u.profession} /></td>
                    <td>
                      {u.tier === 'pro' ? <span className="badge gold">⭐ Pro</span> : <span className="badge gray">Free</span>}
                    </td>
                    <td>
                      {u.isDeactivated ? <span className="badge red">Deactivated</span> : <span className="badge green">Active</span>}
                    </td>
                    <td className="u-meta">{fmtDate(u.createdAt)}</td>
                    <td>
                      <button className="btn sm" onClick={() => setSelected(u.id)}>View</button>
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

      {selected ? (
        <UserModal
          userId={selected}
          onClose={() => setSelected(null)}
          onChanged={load}
        />
      ) : null}
    </Shell>
  );
}
