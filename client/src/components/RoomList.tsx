import type { Room } from '../types';

interface Props {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelect: (room: Room) => void;
  onCreateGroup: () => void;
  onNewDM: () => void;
}

export default function RoomList({ rooms, selectedRoomId, onSelect, onCreateGroup, onNewDM }: Props) {
  const groups = rooms.filter(r => r.type === 'GROUP');
  const dms = rooms.filter(r => r.type === 'DIRECT');

  const RoomItem = ({ room }: { room: Room }) => (
    <div
      style={{
        ...styles.item,
        background: room.id === selectedRoomId ? '#3a3a3a' : 'transparent',
      }}
      onClick={() => onSelect(room)}
    >
      <div style={styles.roomIcon}>
        {room.type === 'GROUP' ? '#' : '@'}
      </div>
      <p style={styles.roomName}>
        {room.type === 'DIRECT' ? (room.otherUsername ?? room.name ?? 'Direct Message') : room.name}
      </p>
    </div>
  );

  return (
    <div style={styles.sidebar}>
      {/* Groups */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>Channels</span>
          <button style={styles.addBtn} onClick={onCreateGroup} title="New Group">+</button>
        </div>
        {groups.length === 0 && <p style={styles.empty}>No channels yet</p>}
        {groups.map(room => <RoomItem key={room.id} room={room} />)}
      </div>

      {/* Direct Messages */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>Direct Messages</span>
          <button style={styles.addBtn} onClick={onNewDM} title="New DM">+</button>
        </div>
        {dms.length === 0 && <p style={styles.empty}>No DMs yet</p>}
        {dms.map(room => <RoomItem key={room.id} room={room} />)}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  section: { marginBottom: '8px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '8px 12px 4px' },
  sectionLabel: { color: '#888', fontSize: '11px', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.5px' },
  addBtn: { background: 'none', border: 'none', color: '#888',
    cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 2px' },
  item: { display: 'flex', alignItems: 'center', gap: '8px',
    padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
    margin: '1px 8px' },
  roomIcon: { width: '28px', height: '28px', background: '#2a2a2a',
    borderRadius: '6px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#888', fontSize: '14px', flexShrink: 0 },
  roomName: { margin: 0, color: '#ccc', fontSize: '14px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  empty: { color: '#555', fontSize: '12px', padding: '4px 12px' },
};
