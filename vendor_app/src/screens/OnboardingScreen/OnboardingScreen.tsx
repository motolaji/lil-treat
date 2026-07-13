import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, createMerchantAccount, createReward, type Merchant } from '../../lib/supabase';
import { uploadMerchantLogo } from '../../lib/storage';
import AddressField from '../../components/AddressField/AddressField';
import LogoUpload from '../../components/LogoUpload/LogoUpload';
import QRDisplay from '../../components/QRDisplay/QRDisplay';
import Button from '../../components/ui/Button';
import { centeredPage, inputStyle } from '../../styles/authStyles';
import '../../styles/AuthLayout.css';
import { color, font } from '../../styles/tokens';
import './OnboardingScreen.css';

const CATEGORIES = ['drinks', 'food', 'retail', 'other'] as const;
const STEP_LABELS = ['Business basics', 'Create your account', 'Your first reward', "You're all set"];
const TOTAL_STEPS = STEP_LABELS.length;

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1 — business basics (local only, nothing saved until account creation)
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<string>('drinks');
  const [address, setAddress] = useState('');
  const [resolvedLatLng, setResolvedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Step 2 — account + merchant creation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  // Step 3 — first reward
  const [rewardLabel, setRewardLabel] = useState('');
  const [rewardCost, setRewardCost] = useState('');
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [rewardSubmitting, setRewardSubmitting] = useState(false);

  function handleStep1Next(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) {
      setStep1Error('Business name is required.');
      return;
    }
    setStep1Error(null);
    setStep(2);
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setAccountError(null);
    setAccountSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError || !data.user) {
      setAccountError(signUpError?.message ?? 'Could not create account. Try again.');
      setAccountSubmitting(false);
      return;
    }

    if (!data.session) {
      setAccountError('Account created, but email confirmation is still required — disable "Confirm email" in Supabase (Authentication → Providers → Email) and try again.');
      setAccountSubmitting(false);
      return;
    }

    const logoUrl = logoFile ? await uploadMerchantLogo(data.user.id, logoFile) : null;

    const { merchant: created, error: merchantError } = await createMerchantAccount(
      businessName.trim(),
      data.user.id,
      undefined,
      undefined,
      {
        category,
        address: address.trim() || undefined,
        lat: resolvedLatLng?.lat,
        lng: resolvedLatLng?.lng,
        logo_url: logoUrl ?? undefined,
      },
    );

    setAccountSubmitting(false);
    if (!created) {
      setAccountError(merchantError ?? 'Could not set up your business. Try again.');
      return;
    }

    setMerchant(created);
    setStep(3);
  }

  async function handleCreateReward(e: React.FormEvent) {
    e.preventDefault();
    if (!merchant) return;

    const parsedCost = parseInt(rewardCost, 10);
    if (!rewardLabel.trim() || !parsedCost || parsedCost <= 0) {
      setRewardError('Enter a reward name and a valid number of stamps.');
      return;
    }

    setRewardError(null);
    setRewardSubmitting(true);
    const { reward: created, error } = await createReward(merchant.id, rewardLabel.trim(), parsedCost);
    setRewardSubmitting(false);

    if (!created) {
      setRewardError(error ?? 'Could not save this reward — you can add it later from Rewards.');
      return;
    }
    setStep(4);
  }

  const merchantQR = merchant ? JSON.stringify({ type: 'merchant', merchant_id: merchant.id }) : '';

  return (
    <div style={centeredPage}>
      <div className="auth-card">
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: color.text, margin: '0 0 6px', fontFamily: font.heading, letterSpacing: '-0.03em' }}>Stackpot</h1>
          <p style={{ color: color.muted, fontSize: 14, margin: 0 }}>{STEP_LABELS[step - 1]}</p>
        </div>

        <div className="onboarding-progress">
          {STEP_LABELS.map((label, i) => (
            <span
              key={label}
              className={`onboarding-progress__dot${i + 1 <= step ? ' onboarding-progress__dot--filled' : ''}`}
            />
          ))}
        </div>

        {step === 1 && (
          <form onSubmit={handleStep1Next} className="auth-grid">
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Business name"
              required
              style={inputStyle}
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
              ))}
            </select>

            <div className="field--full">
              <AddressField
                value={address}
                onChange={setAddress}
                onResolved={(place) => setResolvedLatLng({ lat: place.lat, lng: place.lng })}
                placeholder="Business address (optional)"
              />
            </div>
            <div className="field--full">
              <LogoUpload onFileSelected={setLogoFile} />
            </div>

            {step1Error && (
              <div className="field--full" style={{ background: color.errorBg, border: `1px solid ${color.errorBorder}`, borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ color: color.error, fontSize: 13, margin: 0 }}>{step1Error}</p>
              </div>
            )}

            <div className="field--full">
              <Button type="submit" fullWidth style={{ marginTop: 4 }}>
                Continue
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              style={inputStyle}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              style={inputStyle}
            />

            {accountError && (
              <div style={{ background: color.errorBg, border: `1px solid ${color.errorBorder}`, borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ color: color.error, fontSize: 13, margin: 0 }}>{accountError}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={accountSubmitting} style={{ flex: 1 }}>
                Back
              </Button>
              <Button type="submit" disabled={accountSubmitting} style={{ flex: 2 }}>
                {accountSubmitting ? 'Creating…' : 'Create account'}
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleCreateReward} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ color: color.muted, fontSize: 13, margin: 0 }}>
              What can a customer redeem once they've collected enough small treats?
            </p>
            <input
              type="text"
              value={rewardLabel}
              onChange={(e) => setRewardLabel(e.target.value)}
              placeholder="Reward (e.g. Free cup of coffee)"
              style={inputStyle}
            />
            <input
              type="number"
              value={rewardCost}
              onChange={(e) => setRewardCost(e.target.value)}
              placeholder="Small treats required (e.g. 9)"
              min={1}
              style={inputStyle}
            />

            {rewardError && (
              <div style={{ background: color.errorBg, border: `1px solid ${color.errorBorder}`, borderRadius: 10, padding: '10px 14px' }}>
                <p style={{ color: color.error, fontSize: 13, margin: 0 }}>{rewardError}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="button" variant="secondary" onClick={() => setStep(4)} disabled={rewardSubmitting} style={{ flex: 1 }}>
                Skip for now
              </Button>
              <Button type="submit" disabled={rewardSubmitting} style={{ flex: 2 }}>
                {rewardSubmitting ? 'Saving…' : 'Add reward'}
              </Button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <p style={{ color: color.text, fontSize: 15, textAlign: 'center', margin: 0 }}>
              {businessName} is ready to go. Place this QR code on the counter — customers scan it to start earning.
            </p>
            {merchantQR && <QRDisplay value={merchantQR} size={220} />}
            <div style={{ textAlign: 'left', width: '100%' }}>
              <p style={{ color: color.muted, fontSize: 12, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
                A few things worth doing next
              </p>
              <ul style={{ color: color.text, fontSize: 13, margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
                <li>Add your menu items in <strong>Inventory</strong> so Scan can award treats per item</li>
                <li>Send your first update to customers from <strong>Promos</strong></li>
                <li>Fine-tune your profile any time in <strong>Settings</strong></li>
              </ul>
            </div>
            <Button onClick={() => navigate('/')} fullWidth>
              Go to dashboard
            </Button>
          </div>
        )}

        {step < TOTAL_STEPS && (
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: color.muted }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: color.accent, fontWeight: 600, textDecoration: 'none' }}>
              Log in instead
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
