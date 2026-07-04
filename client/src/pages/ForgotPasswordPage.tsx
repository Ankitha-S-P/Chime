import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api/auth';

type Step = 'email' | 'otp';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep('otp');
    } catch {
      setError('Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, otp, newPassword);
      navigate('/login', { state: { message: 'Password reset! Please sign in.' } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>✦</div>
        <h1 style={styles.title}>Chime</h1>

        {step === 'email' ? (
          <>
            <p style={styles.subtitle}>Reset your password</p>
            <p style={styles.hint}>
              Enter your email and we'll send you a 6-digit code.
            </p>
            <form onSubmit={handleSendOtp} style={styles.form}>
              <input
                style={styles.input}
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
              {error && <p style={styles.error}>{error}</p>}
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p style={styles.subtitle}>Enter your reset code</p>
            <p style={styles.hint}>
              A 6-digit code was sent to <strong style={{ color: '#c4b5fd' }}>{email}</strong>.
              It expires in 10 minutes.
            </p>
            <form onSubmit={handleReset} style={styles.form}>
              <input
                style={{ ...styles.input, ...styles.otpInput }}
                type="text"
                placeholder="6-digit code"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                autoFocus
              />
              <input
                style={styles.input}
                type="password"
                placeholder="New password (min 8 chars)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <input
                style={styles.input}
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              {error && <p style={styles.error}>{error}</p>}
              <button style={styles.button} type="submit" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                type="button"
                style={styles.resendBtn}
                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
              >
                ← Resend code
              </button>
            </form>
          </>
        )}

        <p style={styles.link}>
          <Link to="/login" style={styles.linkAnchor}>← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#07061a' },
  card: { background: '#0e0d24', padding: '40px', borderRadius: '16px',
    width: '380px', border: '1px solid #2e2b56',
    boxShadow: '0 0 40px rgba(124,58,237,0.12)' },
  logo: { color: '#7c3aed', fontSize: '32px', textAlign: 'center', marginBottom: '4px' },
  title: { color: '#ede9fe', margin: '0 0 4px', fontSize: '28px',
    fontWeight: 800, textAlign: 'center' },
  subtitle: { color: '#8b89b0', margin: '0 0 8px', textAlign: 'center', fontSize: '14px' },
  hint: { color: '#6b5fa0', fontSize: '13px', textAlign: 'center',
    marginBottom: '20px', lineHeight: 1.5 },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '12px 14px', borderRadius: '8px', border: '1px solid #2e2b56',
    background: '#13122c', color: '#ede9fe', fontSize: '14px', outline: 'none' },
  otpInput: { fontSize: '24px', textAlign: 'center', letterSpacing: '0.5em',
    fontWeight: 700 },
  button: { padding: '12px', borderRadius: '8px',
    background: 'linear-gradient(135deg, #7c3aed, #9966ff)',
    color: '#fff', border: 'none', cursor: 'pointer',
    fontSize: '15px', fontWeight: 700, marginTop: '4px' },
  resendBtn: { background: 'none', border: 'none', color: '#8b89b0',
    cursor: 'pointer', fontSize: '13px', padding: '4px 0' },
  error: { color: '#f87171', fontSize: '13px', margin: 0 },
  link: { color: '#8b89b0', textAlign: 'center', marginTop: '20px',
    fontSize: '13px', marginBottom: 0 },
  linkAnchor: { color: '#a78bfa', textDecoration: 'none', fontWeight: 600 },
};
