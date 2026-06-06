'use client';

import React, { useEffect, useState } from 'react';
import { ConversationResponse, api } from '../lib/api';

// Read-only conversation viewer for abuse investigation.
export function ConversationModal({ matchId, onClose }: { matchId: string; onClose: () => void }) {
  const [data, setData] = useState<ConversationResponse | null>(null);

  useEffect(() => {
    api.conversation(matchId).then(setData).catch(() => onClose());
  }, [matchId, onClose]);

  const aId = data?.match.userA?.id;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">
            {data ? `${data.match.userA?.name || '—'} × ${data.match.userB?.name || '—'}` : 'Conversation'}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {!data ? (
            <div className="center-state"><div className="spinner" /></div>
          ) : data.messages.length === 0 ? (
            <div className="empty-text">No messages.</div>
          ) : (
            <div className="chat-log">
              {data.messages.map((m) => {
                const fromA = m.senderId === aId;
                return (
                  <div key={m.id} className={`msg ${fromA ? 'a' : 'b'}`}>
                    {m.text}
                    <span className="msg-time">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
