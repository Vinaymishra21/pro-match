'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Avatar, ProfChip, fmtDate } from '../lib/ui';

// Full user detail + moderation actions.
export function UserModal({ userId, onClose, onChanged }: { userId: string; onClose: () => void; onChanged: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    api.user(userId).then((r) => setUser(r.user)).catch(() => onClose());
  }, [userId, onClose]);

  async function act(action: string) {
    setBusy(action);
    try {
      const r = await api.userAction(userId, action);
      setUser(r.user);
      onChanged();
    } catch (e: any) {
      alert(e?.message || 'Action failed');
    } finally {
      setBusy('');
    }
  }

  const photos: string[] = user?.photos || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Member details</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {!user ? (
            <div className="center-state"><div className="spinner" /></div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                <div style={{ width: 64, height: 64 }}>
                  <Avatar photo={photos[0]} name={user.name} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>
                    {user.name}{user.age ? `, ${user.age}` : ''}
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <ProfChip profession={user.profession} />
                    {user.professionVerified ? <span className="badge teal">✓ Verified</span> : <span className="badge gray">Unverified</span>}
                    {user.tier === 'pro' ? <span className="badge gold">⭐ Pro</span> : null}
                    {user.isDeactivated ? <span className="badge red">Deactivated</span> : <span className="badge green">Active</span>}
                  </div>
                </div>
              </div>

              {photos.length > 1 ? (
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto' }}>
                  {photos.map((p, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={p} alt="" style={{ width: 72, height: 90, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                  ))}
                </div>
              ) : null}

              <dl className="kv">
                <dt>Email</dt><dd>{user.email || '—'}</dd>
                <dt>Phone</dt><dd>{user.phone || '—'}</dd>
                <dt>Gender</dt><dd>{user.gender || '—'}</dd>
                <dt>Location</dt><dd>{user.location || '—'}</dd>
                <dt>Height</dt><dd>{user.height || '—'}</dd>
                <dt>Religion</dt><dd>{user.religion || '—'}</dd>
                <dt>Languages</dt><dd>{(user.languages || []).join(', ') || '—'}</dd>
                <dt>Looking for</dt><dd>{user.lookingFor || '—'}</dd>
                <dt>Credits</dt><dd>{user.credits ?? 0}</dd>
                <dt>Headline</dt><dd>{user.headline || '—'}</dd>
                <dt>Bio</dt><dd>{user.bio || '—'}</dd>
                <dt>Joined</dt><dd>{fmtDate(user.createdAt)}</dd>
              </dl>

              <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                {user.isDeactivated ? (
                  <button className="btn success" disabled={!!busy} onClick={() => act('reactivate')}>
                    {busy === 'reactivate' ? '…' : 'Reactivate'}
                  </button>
                ) : (
                  <button className="btn danger" disabled={!!busy} onClick={() => act('deactivate')}>
                    {busy === 'deactivate' ? '…' : 'Ban (deactivate)'}
                  </button>
                )}
                {user.professionVerified ? (
                  <button className="btn" disabled={!!busy} onClick={() => act('unverify')}>
                    {busy === 'unverify' ? '…' : 'Remove verification'}
                  </button>
                ) : (
                  <button className="btn success" disabled={!!busy} onClick={() => act('verify')}>
                    {busy === 'verify' ? '…' : 'Verify profession'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
