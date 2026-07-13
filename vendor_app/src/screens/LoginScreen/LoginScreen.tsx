import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { centeredPage, inputStyle } from '../../styles/authStyles';
import Button from '../../components/ui/Button';
import { color, font } from '../../styles/tokens';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <div style={centeredPage}>
      <div style={{ width: '100%', maxWidth: 360, padding: '0 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: color.text, margin: '0 0 6px', fontFamily: font.heading, letterSpacing: '-0.03em' }}>Stackpot</h1>
          <p style={{ color: color.muted, fontSize: 14, margin: 0 }}>Sign in to your vendor account</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required style={inputStyle} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required style={inputStyle} />

          {error && (
            <div style={{ background: color.errorBg, border: `1px solid ${color.errorBorder}`, borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ color: color.error, fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}

          <Button type="submit" disabled={submitting} fullWidth style={{ marginTop: 4 }}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: color.muted }}>
          New here?{' '}
          <Link to="/signup" style={{ color: color.accent, fontWeight: 600, textDecoration: 'none' }}>
            Sign up your business
          </Link>
        </p>
      </div>
    </div>
  );
}
