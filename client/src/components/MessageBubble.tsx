import { useState } from 'react';
import type { Message } from '../types';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';

interface Props {
  message: Message;
  onDelete: (id: string) => void;
  onReply: (message: Message) => void;
  isAdmin: boolean;
}

export default function MessageBubble({ message, onDelete, onReply, isAdmin }: Props) {
  const currentUser = useAuthStore(s => s.user);
  const isOwn = message.senderId === currentUser?.id;
  const [hovered, setHovered] = useState(false);
  const canDelete = (isOwn || isAdmin) && !message.deleted;

  return (
    <div
      style={{ ...styles.wrapper, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Action buttons — appear on hover */}
      {hovered && !message.deleted && (
        <div style={{
          ...styles.actions,
          order: isOwn ? 0 : 1,
          marginRight: isOwn ? '8px' : 0,
          marginLeft: isOwn ? 0 : '8px',
        }}>
          <button style={styles.actionBtn} onClick={() => onReply(message)} title="Reply">
            ↩
          </button>
          {canDelete && (
            <button style={{ ...styles.actionBtn, color: '#f44747' }}
              onClick={() => onDelete(message.id)} title="Delete">
              ✕
            </button>
          )}
        </div>
      )}

      <div style={{ order: isOwn ? 1 : 0 }}>
        {/* Reply preview */}
        {message.replyToContent && !message.deleted && (
          <div style={{ ...styles.replyPreview, alignSelf: isOwn ? 'flex-end' : 'flex-start' }}>
            <span style={styles.replyIcon}>↩</span>
            <span style={styles.replyText}>{message.replyToContent}</span>
          </div>
        )}

        <div style={{
          ...styles.bubble,
          background: isOwn ? '#5865f2' : '#2a2a2a',
          borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        }}>
          {!isOwn && !message.deleted && (
            <p style={styles.sender}>{message.senderUsername}</p>
          )}

          <p style={{
            ...styles.content,
            fontStyle: message.deleted ? 'italic' : 'normal',
            color: message.deleted ? 'rgba(255,255,255,0.4)' : '#fff',
          }}>
            {message.content}
          </p>

          <div style={styles.meta}>
            <span style={styles.time}>
              {format(new Date(message.createdAt), 'HH:mm')}
            </span>
            {message.editedAt && <span style={styles.edited}>edited</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', alignItems: 'flex-end', marginBottom: '4px',
    paddingInline: '16px' },
  actions: { display: 'flex', gap: '4px', alignItems: 'center' },
  actionBtn: { background: '#2a2a2a', border: 'none', color: '#aaa',
    cursor: 'pointer', borderRadius: '6px', padding: '4px 8px',
    fontSize: '14px', lineHeight: 1 },
  replyPreview: { display: 'flex', alignItems: 'center', gap: '4px',
    marginBottom: '2px', maxWidth: '280px' },
  replyIcon: { color: '#888', fontSize: '12px' },
  replyText: { color: '#888', fontSize: '12px', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' },
  bubble: { maxWidth: '320px', padding: '8px 12px' },
  sender: { margin: '0 0 2px', fontSize: '12px', color: '#a0a0a0', fontWeight: 600 },
  content: { margin: 0, fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word' },
  meta: { display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px',
    justifyContent: 'flex-end' },
  time: { fontSize: '11px', color: 'rgba(255,255,255,0.35)' },
  edited: { fontSize: '11px', color: 'rgba(255,255,255,0.35)' },
};
