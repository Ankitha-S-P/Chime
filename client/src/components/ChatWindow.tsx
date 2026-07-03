import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message, Room } from '../types';
import { getMessages, sendMessage, deleteMessage } from '../api/messages';
import { useWebSocket } from '../hooks/useWebSocket';
import MessageBubble from './MessageBubble';

interface Props { room: Room; }

export default function ChatWindow({ room }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

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
  }, []);

  const { sendTyping } = useWebSocket({
    roomId: room.id,
    onMessage: handleIncomingMessage,
    onTyping: handleTyping,
  });

  useEffect(() => {
    setMessages([]);
    setNextCursor(undefined);
    setHasMore(false);
    loadMessages();
  }, [room.id]);

  const loadMessages = async (cursor?: string) => {
    setLoading(true);
    try {
      const { data } = await getMessages(room.id, cursor);
      const sorted = [...data.messages].reverse();
      setMessages(prev => cursor ? [...sorted, ...prev] : sorted);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor ?? undefined);
      if (!cursor) {
        setTimeout(() => bottomRef.current?.scrollIntoView(), 100);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    sendTyping(false);
    try {
      await sendMessage(room.id, input.trim());
      setInput('');
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    sendTyping(e.target.value.length > 0);
  };

  const typingList = Array.from(typingUsers);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.roomName}>
          {room.type === 'GROUP' ? '# ' : '@ '}{room.name || 'Direct Message'}
        </span>
      </div>

      <div style={styles.messages}>
        {hasMore && (
          <button style={styles.loadMore}
            onClick={() => loadMessages(nextCursor)} disabled={loading}>
            {loading ? 'Loading...' : 'Load older messages'}
          </button>
        )}
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} onDelete={handleDelete} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputArea}>
        {typingList.length > 0 && (
          <p style={styles.typing}>
            {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
          </p>
        )}
        <div style={styles.inputRow}>
          <input style={styles.input}
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={`Message ${room.name || 'this conversation'}...`}
          />
          <button style={styles.sendBtn} onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { flex:1, display:'flex', flexDirection:'column', height:'100vh',
    background:'#0f0f0f' },
  header: { padding:'16px 20px', borderBottom:'1px solid #222', background:'#111' },
  roomName: { color:'#fff', fontWeight:600, fontSize:'16px' },
  messages: { flex:1, overflowY:'auto', padding:'16px 0' },
  loadMore: { display:'block', margin:'0 auto 16px', padding:'8px 16px',
    background:'#2a2a2a', color:'#aaa', border:'none', borderRadius:'6px',
    cursor:'pointer', fontSize:'13px' },
  inputArea: { padding:'12px 16px', borderTop:'1px solid #222', background:'#111' },
  typing: { margin:'0 0 6px', fontSize:'12px', color:'#888', fontStyle:'italic' },
  inputRow: { display:'flex', gap:'8px' },
  input: { flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #333',
    background:'#1a1a1a', color:'#fff', fontSize:'14px' },
  sendBtn: { padding:'12px 20px', borderRadius:'8px', background:'#5865f2',
    color:'#fff', border:'none', cursor:'pointer', fontWeight:600 },
};