import { useState } from 'react';
import { searchUsers, getOrCreateDirect } from '../api/rooms';
import type { Room } from '../types';

interface Props {
  onClose: () => void;
  onDMCreated: (room: Room) => void;
}

export default function NewDMModal({ onClose, onDMCreated }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    const { data } = await searchUsers(q);
    setResults(data);
  };

  const handleStart = async (userId: string) => {
    setLoading(true);
    try {
      const { data } = await getOrCreateDirect(userId);
      onDMCreated(data);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>New Direct Message</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <input
          style={styles.input}
          placeholder="Search username..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
          autoFocus
        />

        <div style={styles.results}>
          {results.length === 0 && query.length >= 2 && (
            <p style={styles.empty}>No users found</p>
          )}
          {results.map((user: any) => (
            <div key={user.id} style={styles.userRow}>
              <div style={styles.avatar}>{user.username[0].toUpperCase()}</div>
              <div style={styles.userInfo}>
                <span style={styles.username}>{user.username}</span>
                <span style={styles.email}>{user.email}</span>
              </div>
              <button
                style={styles.startBtn}
                onClick={() => handleStart(user.id)}
                disabled={loading}
              >
                Message
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { background: '#1a1a1a', borderRadius: '12px', width: '400px',
    maxHeight: '500px', display: 'flex', flexDirection: 'column',
    border: '1px solid #2a2a2a', overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid #2a2a2a' },
  title: { color: '#fff', margin: 0, fontSize: '16px' },
  closeBtn: { background: 'none', border: 'none', color: '#888',
    cursor: 'pointer', fontSize: '22px', lineHeight: 1 },
  input: { margin: '12px 16px', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid #333', background: '#111', color: '#fff', fontSize: '14px' },
  results: { flex: 1, overflowY: 'auto', padding: '0 16px 16px' },
  empty: { color: '#555', textAlign: 'center', marginTop: '20px' },
  userRow: { display: 'flex', alignItems: 'center', gap: '12px',
    padding: '10px 0', borderBottom: '1px solid #222' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#5865f2',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 600, flexShrink: 0 },
  userInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  username: { color: '#fff', fontSize: '14px', fontWeight: 500 },
  email: { color: '#888', fontSize: '12px' },
  startBtn: { background: '#5865f2', border: 'none', color: '#fff',
    borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' },
};
