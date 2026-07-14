import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, createMerchantAccount } from '../../lib/supabase';
import { uploadMerchantLogo } from '../../lib/storage';
import { geocodeAddress } from '../../lib/places';
import AddressField from '../../components/AddressField/AddressField';
import LogoUpload from '../../components/LogoUpload/LogoUpload';
import { inputStyle } from '../../styles/authStyles';
import '../../styles/AuthLayout.css';
import Button from '../../components/ui/Button';
import { color, font } from '../../styles/tokens';

const CATEGORIES = ['drinks', 'food', 'retail', 'other'] as const;

export default function AddLocationScreen() {
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<string>('drinks');
  const [address, setAddress] = useState('');
  const [resolvedLatLng, setResolvedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError('You need to be logged in to add a location.');
      setSubmitting(false);
      return;
    }

    const logoUrl = logoFile ? await uploadMerchantLogo(session.user.id, logoFile) : null;

    // Merchant may have typed an address without clicking an autocomplete
    // suggestion — resolve it now rather than saving with lat/lng left null.
    const trimmedAddress = address.trim();
    const latLng = resolvedLatLng ?? (trimmedAddress ? await geocodeAddress(trimmedAddress) : null);

    const { merchant, error: createError } = await createMerchantAccount(
      businessName.trim(),
      session.user.id,
      undefined,
      undefined,
      {
        category,
        address: trimmedAddress || undefined,
        lat: latLng?.lat,
        lng: latLng?.lng,
        logo_url: logoUrl ?? undefined,
      },
    );

    if (!merchant) {
      setError(createError ?? 'Could not create this location. Try again.');
      setSubmitting(false);
      return;
    }

    // Select the new location before reloading, otherwise MerchantProvider
    // would default back to the previously-selected one via localStorage.
    localStorage.setItem('vendorapp_merchant_id', merchant.id);

    // Full reload so MerchantProvider remounts and refetches the now-larger list.
    // No reward exists yet for this location — land on Rewards to set one up.
    window.location.href = '/rewards';
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <Link
        to="/"
        style={{
          color: color.muted, fontSize: 13, textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', minHeight: 44,
        }}
      >
        ‹ Back
      </Link>

      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '4px 0 4px', color: color.text, fontFamily: font.heading, letterSpacing: '-0.02em' }}>
        Add another location
      </h1>
      <p style={{ color: color.muted, fontSize: 13, margin: '0 0 20px' }}>
        Creates a new business under your existing login — you'll add its first reward next
      </p>

      <form onSubmit={handleSubmit} className="auth-grid">
        <input
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business name"
          required
          style={inputStyle}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={inputStyle}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
          ))}
        </select>

        <div className="field--full">
          <AddressField
            value={address}
            onChange={setAddress}
            onResolved={(place) => setResolvedLatLng({ lat: place.lat, lng: place.lng })}
            placeholder="Business address"
          />
        </div>
        <div className="field--full">
          <LogoUpload onFileSelected={setLogoFile} disabled={submitting} />
        </div>

        {error && (
          <div className="field--full" style={{ background: color.errorBg, border: `1px solid ${color.errorBorder}`, borderRadius: 10, padding: '10px 14px' }}>
            <p style={{ color: color.error, fontSize: 13, margin: 0 }}>{error}</p>
          </div>
        )}

        <div className="field--full">
          <Button type="submit" disabled={submitting} fullWidth style={{ marginTop: 4 }}>
            {submitting ? 'Creating…' : 'Add location'}
          </Button>
        </div>
      </form>
    </div>
  );
}
