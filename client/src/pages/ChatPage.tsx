import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getMyRooms, createRoom } from '../api/rooms';
import { logout } from '../api/auth';
import type { Room } from '../types';
import RoomList from '../components/RoomList';
import ChatWindow from '../components/ChatWindow';
import NewDMModal from '../components/NewDMModal';

export default function ChatPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showDMModal, setShowDMModal] = useState(false);
  const { user, refreshToken, logout: clearAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    getMyRooms().then(({ data }) => {
      setRooms(data);
      if (data.length > 0) setSelectedRoom(data[0]);
    });
  }, []);

  const handleCreateGroup = async () => {
    const name = prompt('Channel name:');
    if (!name?.trim()) return;
    const { data } = await createRoom(name.trim(), 'GROUP');
    setRooms(prev => [data, ...prev]);
    setSelectedRoom(data);
  };

  const handleDMCreated = (room: Room) => {
    setRooms(prev => {
      if (prev.find(r => r.id === room.id)) return prev;
      return [room, ...prev];
    });
    setSelectedRoom(room);
  };

  const handleLeaveRoom = () => {
    setRooms(prev => prev.filter(r => r.id !== selectedRoom?.id));
    setSelectedRoom(null);
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
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.appName}>Chime</span>
        </div>

        <RoomList
          rooms={rooms}
          selectedRoomId={selectedRoom?.id ?? null}
          onSelect={setSelectedRoom}
          onCreateGroup={handleCreateGroup}
          onNewDM={() => setShowDMModal(true)}
        />

        <div style={styles.userBar}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>{user?.username?.[0]?.toUpperCase()}</div>
            <span style={styles.username}>{user?.username}</span>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout} title="Logout">
            ⎋
          </button>
        </div>
      </div>

      {/* Main area */}
      {selectedRoom ? (
        <ChatWindow
          key={selectedRoom.id}
          room={selectedRoom}
          onLeaveRoom={handleLeaveRoom}
        />
      ) : (
        <div style={styles.empty}>
          <div style={styles.emptyContent}>
            <p style={styles.emptyTitle}>Welcome to Chime</p>
            <p style={styles.emptySubtitle}>
              Select a channel or start a direct message
            </p>
          </div>
        </div>
      )}

      {showDMModal && (
        <NewDMModal
          onClose={() => setShowDMModal(false)}
          onDMCreated={handleDMCreated}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: { display: 'flex', height: '100vh', background: '#0f0f0f' },
  sidebar: { width: '240px', background: '#111', borderRight: '1px solid #222',
    display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0 },
  sidebarHeader: { padding: '16px', borderBottom: '1px solid #222' },
  appName: { color: '#fff', fontWeight: 700, fontSize: '18px' },
  userBar: { padding: '10px 12px', borderTop: '1px solid #222',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
  userAvatar: { width: '28px', height: '28px', borderRadius: '50%',
    background: '#5865f2', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 600 },
  username: { color: '#ccc', fontSize: '13px', fontWeight: 500 },
  logoutBtn: { background: 'none', border: 'none', color: '#888',
    cursor: 'pointer', fontSize: '16px' },
  empty: { flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#0f0f0f' },
  emptyContent: { textAlign: 'center' },
  emptyTitle: { color: '#fff', fontSize: '20px', fontWeight: 600, marginBottom: '8px' },
  emptySubtitle: { color: '#888', fontSize: '14px' },
};
