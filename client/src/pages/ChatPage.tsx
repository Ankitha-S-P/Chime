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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const { user, refreshToken, logout: clearAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    getMyRooms().then(({ data }) => {
      setRooms(data);
      if (data.length > 0 && !isMobile) setSelectedRoom(data[0]);
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

  // On mobile: show sidebar OR chat, never both
  const showSidebar = !isMobile || selectedRoom === null;
  const showChat = !isMobile || selectedRoom !== null;

  return (
    <div style={styles.app}>
      {/* Sidebar */}
      {showSidebar && (
        <div style={{ ...styles.sidebar, ...(isMobile ? styles.sidebarMobile : {}) }}>
          <div style={styles.sidebarHeader}>
            <span style={styles.appName}>✦ Chime</span>
          </div>

          <RoomList
            rooms={rooms}
            selectedRoomId={selectedRoom?.id ?? null}
            onSelect={room => setSelectedRoom(room)}
            onCreateGroup={handleCreateGroup}
            onNewDM={() => setShowDMModal(true)}
          />

          <div style={styles.userBar}>
            <div style={styles.userInfo}>
              <div style={styles.userAvatar}>{user?.username?.[0]?.toUpperCase()}</div>
              <span style={styles.username}>{user?.username}</span>
            </div>
            <button style={styles.logoutBtn} onClick={handleLogout} title="Logout">⎋</button>
          </div>
        </div>
      )}

      {/* Main area */}
      {showChat && (
        selectedRoom ? (
          <ChatWindow
            key={selectedRoom.id}
            room={selectedRoom}
            onLeaveRoom={handleLeaveRoom}
            onBack={isMobile ? () => setSelectedRoom(null) : undefined}
          />
        ) : (
          <div style={styles.empty}>
            <div style={styles.emptyContent}>
              <div style={styles.emptyIcon}>✦</div>
              <p style={styles.emptyTitle}>Welcome to Chime</p>
              <p style={styles.emptySubtitle}>Select a channel or start a direct message</p>
            </div>
          </div>
        )
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
  app: { display: 'flex', height: '100vh', background: '#07061a', overflow: 'hidden' },
  sidebar: {
    width: '240px', background: '#0e0d24',
    borderRight: '1px solid #2e2b56',
    display: 'flex', flexDirection: 'column', height: '100vh', flexShrink: 0,
  },
  sidebarMobile: { width: '100%' },
  sidebarHeader: {
    padding: '18px 16px', borderBottom: '1px solid #2e2b56',
    background: 'linear-gradient(135deg, #13122c 0%, #0e0d24 100%)',
  },
  appName: {
    color: '#c4b5fd', fontWeight: 800, fontSize: '18px',
    letterSpacing: '0.5px',
  },
  userBar: {
    padding: '10px 12px', borderTop: '1px solid #2e2b56',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#0b0a20',
  },
  userInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
  userAvatar: {
    width: '28px', height: '28px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #9966ff)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700,
  },
  username: { color: '#c4b5fd', fontSize: '13px', fontWeight: 500 },
  logoutBtn: {
    background: 'none', border: 'none', color: '#8b89b0',
    cursor: 'pointer', fontSize: '16px',
  },
  empty: {
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#07061a',
  },
  emptyContent: { textAlign: 'center' },
  emptyIcon: { fontSize: '48px', color: '#3d3660', marginBottom: '16px' },
  emptyTitle: { color: '#ede9fe', fontSize: '20px', fontWeight: 600, marginBottom: '8px' },
  emptySubtitle: { color: '#8b89b0', fontSize: '14px' },
};
