import type { Room } from '../types';

interface Props {
  rooms: Room[];
  selectedRoomId: string | null;
  onSelect: (room: Room) => void;
  onCreateRoom: () => void;
}

export default function RoomList({ rooms, selectedRoomId, onSelect, onCreateRoom }: Props) {
  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <span style={styles.title}>Chime</span>
        <button style={styles.newBtn} onClick={onCreateRoom}>+</button>
      </div>
      <div style={styles.list}>
        {rooms.length === 0 && (
          <p style={styles.empty}>No rooms yet. Create one!</p>
        )}
        {rooms.map(room => (
          <div key={room.id}
            style={{ ...styles.item,
              background: room.id === selectedRoomId ? '#3a3a3a' : 'transparent' }}
            onClick={() => onSelect(room)}>
            <div style={styles.roomIcon}>
              {room.type === 'GROUP' ? '#' : '@'}
            </div>
            <div>
              <p style={styles.roomName}>{room.name || 'Direct Message'}</p>
              <p style={styles.roomType}>{room.type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: { width:'240px', background:'#111', borderRight:'1px solid #222',
    display:'flex', flexDirection:'column', height:'100vh' },
  header: { padding:'16px', display:'flex', justifyContent:'space-between',
    alignItems:'center', borderBottom:'1px solid #222' },
  title: { color:'#fff', fontWeight:700, fontSize:'18px' },
  newBtn: { background:'#5865f2', color:'#fff', border:'none', borderRadius:'6px',
    width:'28px', height:'28px', cursor:'pointer', fontSize:'18px', lineHeight:'1' },
  list: { flex:1, overflowY:'auto', padding:'8px' },
  item: { display:'flex', alignItems:'center', gap:'10px', padding:'10px',
    borderRadius:'8px', cursor:'pointer', marginBottom:'2px' },
  roomIcon: { width:'36px', height:'36px', background:'#2a2a2a', borderRadius:'8px',
    display:'flex', alignItems:'center', justifyContent:'center',
    color:'#888', fontSize:'18px', flexShrink:0 },
  roomName: { margin:0, color:'#fff', fontSize:'14px', fontWeight:500 },
  roomType: { margin:0, color:'#888', fontSize:'11px' },
  empty: { color:'#555', fontSize:'13px', textAlign:'center', marginTop:'20px' },
};