import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await register(email, username, password);
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Chime</h1>
        <p style={styles.subtitle}>Create your account</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} type="email" placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={styles.input} placeholder="Username"
            value={username} onChange={e => setUsername(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Password (min 8 chars)"
            value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p style={styles.link}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display:'flex', alignItems:'center', justifyContent:'center',
    height:'100vh', background:'#0f0f0f' },
  card: { background:'#1a1a1a', padding:'40px', borderRadius:'12px',
    width:'360px', border:'1px solid #2a2a2a' },
  title: { color:'#fff', margin:'0 0 4px', fontSize:'28px', fontWeight:700 },
  subtitle: { color:'#888', margin:'0 0 24px' },
  form: { display:'flex', flexDirection:'column', gap:'12px' },
  input: { padding:'12px', borderRadius:'8px', border:'1px solid #333',
    background:'#111', color:'#fff', fontSize:'14px' },
  button: { padding:'12px', borderRadius:'8px', background:'#5865f2',
    color:'#fff', border:'none', cursor:'pointer', fontSize:'15px', fontWeight:600 },
  error: { color:'#f44747', fontSize:'13px', margin:0 },
  link: { color:'#888', textAlign:'center', marginTop:'16px', fontSize:'13px' },
};