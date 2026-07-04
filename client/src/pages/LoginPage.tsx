import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
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
      const { data } = await login(email, password);
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>✦</div>
        <h1 style={styles.title}>Chime</h1>
        <p style={styles.subtitle}>Sign in to your account</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} type="email" placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={styles.link}>
          Don't have an account? <Link to="/register" style={styles.linkAnchor}>Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#07061a' },
  card: { background: '#0e0d24', padding: '40px', borderRadius: '16px',
    width: '360px', border: '1px solid #2e2b56',
    boxShadow: '0 0 40px rgba(124,58,237,0.12)' },
  logo: { color: '#7c3aed', fontSize: '32px', textAlign: 'center', marginBottom: '4px' },
  title: { color: '#ede9fe', margin: '0 0 4px', fontSize: '28px',
    fontWeight: 800, textAlign: 'center' },
  subtitle: { color: '#8b89b0', margin: '0 0 28px', textAlign: 'center', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '12px 14px', borderRadius: '8px', border: '1px solid #2e2b56',
    background: '#13122c', color: '#ede9fe', fontSize: '14px', outline: 'none' },
  button: { padding: '12px', borderRadius: '8px',
    background: 'linear-gradient(135deg, #7c3aed, #9966ff)',
    color: '#fff', border: 'none', cursor: 'pointer', fontSize: '15px',
    fontWeight: 700, marginTop: '4px' },
  error: { color: '#f87171', fontSize: '13px', margin: 0 },
  link: { color: '#8b89b0', textAlign: 'center', marginTop: '20px',
    fontSize: '13px', marginBottom: 0 },
  linkAnchor: { color: '#a78bfa', textDecoration: 'none', fontWeight: 600 },
};
