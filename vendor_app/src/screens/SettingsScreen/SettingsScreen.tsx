import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useMerchant } from '../../context/MerchantContext';
import LocationCard from '../../components/LocationCard/LocationCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import SectionLabel from '../../components/ui/SectionLabel';
import { color, font } from '../../styles/tokens';
import { inputStyle } from '../../styles/authStyles';
import './SettingsScreen.css';

export default function SettingsScreen() {
  const { merchant, merchants, setMerchant, refreshMerchants } = useMerchant();

  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentEmail(session?.user?.email ?? null);
    });
  }, []);

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(false);
    setEmailSaving(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setEmailSaving(false);
    if (error) {
      setEmailError(error.message);
      return;
    }
    setCurrentEmail(newEmail.trim());
    setNewEmail('');
    setEmailSuccess(true);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentEmail) {
      setPasswordError('Could not verify your account. Try logging out and back in.');
      return;
    }

    setPasswordSaving(true);
    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    });
    if (reAuthError) {
      setPasswordSaving(false);
      setPasswordError('Current password is incorrect.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setPasswordSuccess(true);
  }

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: color.text, fontFamily: font.heading, letterSpacing: '-0.02em' }}>Settings</h1>
      <p style={{ color: color.muted, fontSize: 13, margin: '0 0 20px' }}>
        Manage your locations and account
      </p>

      <div className="settings__sections">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionLabel>Locations</SectionLabel>
          {merchants.map((m) => (
            <LocationCard
              key={m.id}
              merchant={m}
              isCurrent={merchant?.id === m.id}
              canRemove={merchants.length > 1}
              onSetCurrent={setMerchant}
              onUpdated={() => refreshMerchants()}
              onRemoved={() => refreshMerchants()}
            />
          ))}
          <Link to="/locations/add" style={{ color: color.accent, fontWeight: 600, fontSize: 13, textDecoration: 'none', minHeight: 44, display: 'flex', alignItems: 'center' }}>
            + Add another location
          </Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <SectionLabel style={{ marginBottom: 12 }}>Change email</SectionLabel>
            <form onSubmit={handleChangeEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ color: color.muted, fontSize: 13, margin: 0 }}>
                Current: {currentEmail ?? '—'}
              </p>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="New email address"
                required
                style={inputStyle}
              />
              {emailError && <p style={{ color: color.error, fontSize: 13, margin: 0 }}>{emailError}</p>}
              {emailSuccess && <p style={{ color: color.accentText, fontSize: 13, margin: 0 }}>Email updated.</p>}
              <Button type="submit" variant="secondary" disabled={emailSaving} fullWidth>
                {emailSaving ? 'Saving…' : 'Update email'}
              </Button>
            </form>
          </Card>

          <Card>
            <SectionLabel style={{ marginBottom: 12 }}>Change password</SectionLabel>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                required
                style={inputStyle}
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                required
                minLength={6}
                style={inputStyle}
              />
              {passwordError && <p style={{ color: color.error, fontSize: 13, margin: 0 }}>{passwordError}</p>}
              {passwordSuccess && <p style={{ color: color.accentText, fontSize: 13, margin: 0 }}>Password updated.</p>}
              <Button type="submit" variant="secondary" disabled={passwordSaving} fullWidth>
                {passwordSaving ? 'Saving…' : 'Update password'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
