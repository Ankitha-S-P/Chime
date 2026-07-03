import type { Message } from '../types';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';

interface Props {
  message: Message;
  onDelete: (id: string) => void;
}

export default function MessageBubble({ message, onDelete }: Props) {
  const currentUser = useAuthStore(s => s.user);
  const isOwn = message.senderId === currentUser?.id;

  return (
    <div style={{ ...styles.wrapper, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
      <div style={{ ...styles.bubble, background: isOwn ? '#5865f2' : '#2a2a2a' }}>
        {!isOwn && <p style={styles.sender}>{message.senderUsername}</p>}
        {message.replyToContent && (
          <div style={styles.reply}>↩ {message.replyToContent}</div>
        )}
        <p style={{ ...styles.content, fontStyle: message.deleted ? 'italic' : 'normal',
          color: message.deleted ? '#888' : '#fff' }}>
          {message.content}
        </p>
        <div style={styles.meta}>
          <span style={styles.time}>
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
          {message.editedAt && <span style={styles.edited}>edited</span>}
          {isOwn && !message.deleted && (
            <button style={styles.deleteBtn} onClick={() => onDelete(message.id)}>×</button>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { display:'flex', marginBottom:'8px', paddingInline:'16px' },
  bubble: { maxWidth:'65%', padding:'10px 14px', borderRadius:'12px' },
  sender: { margin:'0 0 4px', fontSize:'12px', color:'#a0a0a0', fontWeight:600 },
  reply: { background:'rgba(0,0,0,0.2)', padding:'6px 8px', borderRadius:'6px',
    fontSize:'12px', color:'#ccc', marginBottom:'6px', borderLeft:'3px solid #5865f2' },
  content: { margin:0, fontSize:'14px', lineHeight:1.5 },
  meta: { display:'flex', gap:'8px', alignItems:'center', marginTop:'4px' },
  time: { fontSize:'11px', color:'rgba(255,255,255,0.4)' },
  edited: { fontSize:'11px', color:'rgba(255,255,255,0.4)' },
  deleteBtn: { background:'none', border:'none', color:'rgba(255,255,255,0.4)',
    cursor:'pointer', fontSize:'16px', padding:0, lineHeight:1 },
};