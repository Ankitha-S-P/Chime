import { useState, useEffect } from 'react';
import type { RoomMember, Room } from '../types';
import { getMembers, getOnlineMembers, removeMember, inviteMember, searchUsers, updateRoom } from '../api/rooms';
import { useAuthStore } from '../store/authStore';

interface Props {
  room: Room;
  onClose: () => void;
  onLeave: () => void;
  currentUserRole: 'ADMIN' | 'MEMBER';
}

export default function MembersPanel({ room, onClose, onLeave, currentUserRole }: Props) {
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(room.name || '');
  const currentUser = useAuthStore(s => s.user);

  useEffect(() => {
    loadMembers();
    const interval = setInterval(loadOnline, 15000);
    return () => clearInterval(interval);
  }, [room.id]);

  const loadMembers = async () => {
    const [membersResult, onlineResult] = await Promise.allSettled([
      getMembers(room.id),
      getOnlineMembers(room.id),
    ]);
    if (membersResult.status === 'fulfilled') {
      console.log('[MembersPanel] members loaded:', membersResult.value.data);
      setMembers(membersResult.value.data);
    } else {
      console.error('[MembersPanel] getMembers failed:', membersResult.reason);
    }
    if (onlineResult.status === 'fulfilled') {
      setOnlineIds(new Set(onlineResult.value.data));
    } else {
      console.warn('[MembersPanel] getOnlineMembers failed (non-critical):', onlineResult.reason);
    }
  };

  const loadOnline = async () => {
    try {
      const { data } = await getOnlineMembers(room.id);
      setOnlineIds(new Set(data));
    } catch {
      // presence is best-effort — don't crash if Redis is unavailable
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('Remove this member?')) return;
    await removeMember(room.id, userId);
    setMembers(prev => prev.filter(m => m.userId !== userId));
  };

  const handleLeave = async () => {
    if (!confirm('Leave this room?')) return;
    await removeMember(room.id, currentUser!.id);
    onLeave();
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    const { data } = await searchUsers(q);
    const memberIds = new Set(members.map(m => m.userId));
    setSearchResults(data.filter((u: any) => !memberIds.has(u.id)));
  };

  const handleInvite = async (userId: string) => {
    await inviteMember(room.id, userId);
    setSearchQuery('');
    setSearchResults([]);
    loadMembers();
  };

  const handleRename = async () => {
    if (!newName.trim()) return;
    await updateRoom(room.id, newName.trim());
    setEditingName(false);
    room.name = newName.trim();
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>
          {room.type === 'GROUP' ? '# ' : '@ '}
          {editingName && currentUserRole === 'ADMIN' ? (
            <input
              style={styles.nameInput}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRename()}
              onBlur={handleRename}
              autoFocus
            />
          ) : (
            <span
              onClick={() => currentUserRole === 'ADMIN' && setEditingName(true)}
              style={{ cursor: currentUserRole === 'ADMIN' ? 'pointer' : 'default' }}
              title={currentUserRole === 'ADMIN' ? 'Click to rename' : ''}
            >
              {room.name || 'Direct Message'}
              {currentUserRole === 'ADMIN' && room.type === 'GROUP' && (
                <span style={styles.editHint}> ✎</span>
              )}
            </span>
          )}
        </span>
        <button style={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      {room.type === 'GROUP' && currentUserRole === 'ADMIN' && (
        <div style={styles.section}>
          <p style={styles.sectionLabel}>Invite Members</p>
          <input
            style={styles.searchInput}
            placeholder="Search username..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
          />
          {searchResults.map((u: any) => (
            <div key={u.id} style={styles.searchResult}>
              <span style={styles.memberName}>{u.username}</span>
              <button style={styles.inviteBtn} onClick={() => handleInvite(u.id)}>+ Invite</button>
            </div>
          ))}
        </div>
      )}

      <div style={styles.section}>
        <p style={styles.sectionLabel}>Members — {members.length}</p>
        {members.map(member => {
          const isOnline = onlineIds.has(member.userId);
          const isCurrentUser = member.userId === currentUser?.id;
          return (
            <div key={member.userId} style={styles.memberRow}>
              <div style={styles.avatarWrap}>
                <div style={styles.avatar}>
                  {member.username[0].toUpperCase()}
                </div>
                <div style={{
                  ...styles.onlineDot,
                  background: isOnline ? '#3ba55c' : '#747f8d'
                }} />
              </div>
              <div style={styles.memberInfo}>
                <span style={styles.memberName}>
                  {member.username} {isCurrentUser && <span style={styles.you}>(you)</span>}
                </span>
                <span style={styles.memberRole}>{member.role}</span>
              </div>
              {!isCurrentUser && currentUserRole === 'ADMIN' && room.type === 'GROUP' && (
                <button style={styles.removeBtn} onClick={() => handleRemove(member.userId)}>
                  Remove
                </button>
              )}
            </div>
          );
        })}
      </div>

      {room.type === 'GROUP' && (
        <div style={styles.footer}>
          <button style={styles.leaveBtn} onClick={handleLeave}>
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: { width: '240px', background: '#111', borderLeft: '1px solid #222',
    display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' },
  header: { padding: '16px', borderBottom: '1px solid #222',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#fff', fontWeight: 600, fontSize: '14px', flex: 1 },
  nameInput: { background: '#2a2a2a', border: '1px solid #5865f2', borderRadius: '4px',
    color: '#fff', padding: '2px 6px', fontSize: '14px', width: '140px' },
  editHint: { color: '#888', fontSize: '12px' },
  closeBtn: { background: 'none', border: 'none', color: '#888',
    cursor: 'pointer', fontSize: '20px', lineHeight: 1 },
  section: { padding: '12px 16px', borderBottom: '1px solid #1a1a1a' },
  sectionLabel: { color: '#888', fontSize: '11px', fontWeight: 700,
    textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' },
  searchInput: { width: '100%', padding: '8px', background: '#1a1a1a',
    border: '1px solid #333', borderRadius: '6px', color: '#fff',
    fontSize: '13px', marginBottom: '6px' },
  searchResult: { display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '6px 0' },
  inviteBtn: { background: '#5865f2', border: 'none', color: '#fff',
    borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' },
  memberRow: { display: 'flex', alignItems: 'center', gap: '10px',
    padding: '6px 0', position: 'relative' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: { width: '32px', height: '32px', borderRadius: '50%',
    background: '#5865f2', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 600 },
  onlineDot: { width: '10px', height: '10px', borderRadius: '50%',
    border: '2px solid #111', position: 'absolute', bottom: 0, right: 0 },
  memberInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  memberName: { color: '#ddd', fontSize: '13px', fontWeight: 500 },
  memberRole: { color: '#888', fontSize: '11px' },
  you: { color: '#888', fontWeight: 400 },
  removeBtn: { background: 'none', border: 'none', color: '#f44747',
    cursor: 'pointer', fontSize: '11px', padding: '2px 4px' },
  footer: { padding: '16px', marginTop: 'auto' },
  leaveBtn: { width: '100%', padding: '10px', background: 'transparent',
    border: '1px solid #f44747', color: '#f44747', borderRadius: '6px',
    cursor: 'pointer', fontSize: '13px' },
};
