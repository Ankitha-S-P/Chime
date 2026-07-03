import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message, Room } from '../types';
import { getMessages, sendMessage, deleteMessage } from '../api/messages';
import { getMembers } from '../api/rooms';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuthStore } from '../store/authStore';
import MessageBubble from './MessageBubble';
import MembersPanel from './MembersPanel';

interface Props {
  room: Room;
  onLeaveRoom: () => void;
}

export default function ChatWindow({ room, onLeaveRoom }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const currentUser = useAuthStore(s => s.user);

  const handleIncomingMessage = useCallback((msg: Message) => {
    setMessages(prev => {
      if (prev.find(m => m.id === msg.id)) {
        return prev.map(m => m.id === msg.id ? msg : m);
      }
      return [...prev, msg];
    });
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const handleTyping = useCallback((event: any) => {
    if (event.userId === currentUser?.id) return;
    setTypingUsers(prev => {
      const next = new Set(prev);
      if (event.typing) {
        next.add(event.username);
        const existing = typingTimeouts.current.get(event.username);
        if (existing) clearTimeout(existing);
        const timeout = setTimeout(() => {
          setTypingUsers(p => { const s = new Set(p); s.delete(event.username); return s; });
        }, 3500);
        typingTimeouts.current.set(event.username, timeout);
      } else {
        next.delete(event.username);
      }
      return next;
    });
  }, [currentUser?.id]);

  const { sendTyping } = useWebSocket({
    roomId: room.id,
    onMessage: handleIncomingMessage,
    onTyping: handleTyping,
  });

  useEffect(() => {
    setMessages([]);
    setReplyTo(null);
    setNextCursor(undefined);
    setHasMore(false);
    setShowMembers(false);
    loadMessages();
    loadCurrentUserRole();
  }, [room.id]);

  const loadCurrentUserRole = async () => {
    const { data } = await getMembers(room.id);
    const me = data.find(m => m.userId === currentUser?.id);
    setCurrentUserRole(me?.role ?? 'MEMBER');
  };

  const loadMessages = async (cursor?: string) => {
    setLoading(true);
    try {
      const { data } = await getMessages(room.id, cursor);
      const sorted = [...data.messages].reverse();
      setMessages(prev => cursor ? [...sorted, ...prev] : sorted);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor ?? undefined);
      if (!cursor) setTimeout(() => bottomRef.current?.scrollIntoView(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content) return;
    sendTyping(false);
    setInput('');
    setReplyTo(null);
    try {
      await sendMessage(room.id, content, replyTo?.id);
    } catch (err) {
      console.error('Failed to send:', err);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(room.id, messageId);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    sendTyping(e.target.value.length > 0);
  };

  const typingList = Array.from(typingUsers);

  const dmName = room.type === 'DIRECT'
    ? messages.find(m => m.senderId !== currentUser?.id)?.senderUsername || 'Direct Message'
    : room.name;

  return (
    <div style={styles.outer}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.roomIcon}>{room.type === 'GROUP' ? '#' : '@'}</span>
            <span style={styles.roomName}>{dmName}</span>
          </div>
          <button
            style={{ ...styles.membersBtn, background: showMembers ? '#3a3a3a' : 'none' }}
            onClick={() => setShowMembers(s => !s)}
            title="Members"
          >
            👥 {room.type === 'GROUP' ? 'Members' : 'Info'}
          </button>
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {hasMore && (
            <button style={styles.loadMore} onClick={() => loadMessages(nextCursor)} disabled={loading}>
              {loading ? 'Loading...' : '↑ Load older messages'}
            </button>
          )}
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onDelete={handleDelete}
              onReply={handleReply}
              isAdmin={currentUserRole === 'ADMIN'}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={styles.inputArea}>
          {typingList.length > 0 && (
            <p style={styles.typing}>
              {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
            </p>
          )}

          {/* Reply preview */}
          {replyTo && (
            <div style={styles.replyBar}>
              <span style={styles.replyBarText}>
                ↩ Replying to <strong>{replyTo.senderUsername}</strong>: {replyTo.content}
              </span>
              <button style={styles.replyBarClose} onClick={() => setReplyTo(null)}>×</button>
            </div>
          )}

          <div style={styles.inputRow}>
            <input
              ref={inputRef}
              style={styles.input}
              value={input}
              onChange={handleInputChange}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder={`Message ${room.type === 'GROUP' ? '#' + room.name : dmName}...`}
            />
            <button style={styles.sendBtn} onClick={handleSend}>Send</button>
          </div>
        </div>
      </div>

      {/* Members panel */}
      {showMembers && (
        <MembersPanel
          room={room}
          onClose={() => setShowMembers(false)}
          onLeave={() => { setShowMembers(false); onLeaveRoom(); }}
          currentUserRole={currentUserRole}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  outer: { flex: 1, display: 'flex', overflow: 'hidden' },
  container: { flex: 1, display: 'flex', flexDirection: 'column', height: '100vh',
    background: '#0f0f0f', overflow: 'hidden' },
  header: { padding: '12px 20px', borderBottom: '1px solid #222', background: '#111',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  roomIcon: { color: '#888', fontSize: '18px' },
  roomName: { color: '#fff', fontWeight: 600, fontSize: '16px' },
  membersBtn: { border: 'none', color: '#aaa', cursor: 'pointer',
    borderRadius: '6px', padding: '6px 12px', fontSize: '13px' },
  messages: { flex: 1, overflowY: 'auto', paddingBlock: '12px' },
  loadMore: { display: 'block', margin: '0 auto 12px', padding: '6px 16px',
    background: '#2a2a2a', color: '#aaa', border: 'none', borderRadius: '6px',
    cursor: 'pointer', fontSize: '13px' },
  inputArea: { padding: '8px 16px 12px', borderTop: '1px solid #222',
    background: '#111', flexShrink: 0 },
  typing: { margin: '0 0 4px', fontSize: '12px', color: '#888', fontStyle: 'italic' },
  replyBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#1a1a1a', borderLeft: '3px solid #5865f2', padding: '6px 10px',
    borderRadius: '4px', marginBottom: '6px' },
  replyBarText: { color: '#aaa', fontSize: '12px', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' },
  replyBarClose: { background: 'none', border: 'none', color: '#888',
    cursor: 'pointer', fontSize: '16px', lineHeight: 1, flexShrink: 0 },
  inputRow: { display: 'flex', gap: '8px' },
  input: { flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #333',
    background: '#1a1a1a', color: '#fff', fontSize: '14px' },
  sendBtn: { padding: '10px 20px', borderRadius: '8px', background: '#5865f2',
    color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 },
};
