import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getMyRooms, createRoom } from '../api/rooms';
import { logout } from '../api/auth';
import type { Room } from '../types';
import RoomList from '../components/RoomList';
import ChatWindow from '../components/ChatWindow';

export default function ChatPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const { user, refreshToken, logout: clearAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    getMyRooms().then(({ data }) => {
      setRooms(data);
      if (data.length > 0) setSelectedRoom(data[0]);
    });
  }, []);

  const handleCreateRoom = async () => {
    const name = prompt('Room name:');
    if (!name?.trim()) return;
    const { data } = await createRoom(name.trim(), 'GROUP');
    setRooms(prev => [data, ...prev]);
    setSelectedRoom(data);
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) await logout(refreshToken);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <div style={styles.app}>
      <div style={styles.sidebar}>
        <RoomList
          rooms={rooms}
          selectedRoomId={selectedRoom?.id ?? null}
          onSelect={setSelectedRoom}
          onCreateRoom={handleCreateRoom}
        />
        <div style={styles.userBar}>
          <span style={styles.username}>{user?.username}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {selectedRoom ? (
        <ChatWindow room={selectedRoom} />
      ) : (
        <div style={styles.empty}>
          <p>Select a room or create one to start chatting</p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: { display:'flex', height:'100vh', background:'#0f0f0f' },
  sidebar: { display:'flex', flexDirection:'column', width:'240px' },
  userBar: { padding:'12px 16px', borderTop:'1px solid #222', background:'#111',
    display:'flex', justifyContent:'space-between', alignItems:'center' },
  username: { color:'#ccc', fontSize:'13px', fontWeight:500 },
  logoutBtn: { background:'none', border:'none', color:'#888',
    cursor:'pointer', fontSize:'12px' },
  empty: { flex:1, display:'flex', alignItems:'center', justifyContent:'center',
    color:'#555', fontSize:'16px' },
};