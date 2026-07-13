import { useState } from 'react';
import {
  supabase, updateMerchant, DAYS_OF_WEEK,
  type BusinessHours, type DayOfWeek, type Merchant,
} from '../../lib/supabase';
import { uploadMerchantLogo } from '../../lib/storage';
import AddressField from '../AddressField/AddressField';
import LogoUpload from '../LogoUpload/LogoUpload';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PillButton from '../ui/PillButton';
import { color, font } from '../../styles/tokens';
import { inputStyle } from '../../styles/authStyles';

const CATEGORIES = ['drinks', 'food', 'retail', 'other'] as const;

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

function defaultBusinessHours(): BusinessHours {
  return DAYS_OF_WEEK.reduce((acc, day) => {
    acc[day] = { closed: false, open: '09:00', close: '17:00' };
    return acc;
  }, {} as BusinessHours);
}

interface LocationCardProps {
  merchant: Merchant;
  isCurrent: boolean;
  canRemove: boolean;
  onSetCurrent: (m: Merchant) => void;
  onUpdated: () => void;
  onRemoved: () => void;
}

export default function LocationCard({ merchant, isCurrent, canRemove, onSetCurrent, onUpdated, onRemoved }: LocationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const [name, setName] = useState(merchant.name);
  const [category, setCategory] = useState(merchant.category ?? 'drinks');
  const [address, setAddress] = useState(merchant.address ?? '');
  const [resolvedLatLng, setResolvedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [stampTarget, setStampTarget] = useState(String(merchant.stamp_target));
  const [businessHours, setBusinessHours] = useState<BusinessHours>(merchant.business_hours ?? defaultBusinessHours());

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removeSaving, setRemoveSaving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  function startEdit() {
    setName(merchant.name);
    setCategory(merchant.category ?? 'drinks');
    setAddress(merchant.address ?? '');
    setResolvedLatLng(null);
    setLogoFile(null);
    setLogoRemoved(false);
    setStampTarget(String(merchant.stamp_target));
    setBusinessHours(merchant.business_hours ?? defaultBusinessHours());
    setError(null);
    setExpanded(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    let logoUrl = merchant.logo_url;
    if (logoFile) {
      const { data: { session } } = await supabase.auth.getSession();
      const uploaded = session?.user ? await uploadMerchantLogo(session.user.id, logoFile) : null;
      if (uploaded) logoUrl = uploaded;
    } else if (logoRemoved) {
      logoUrl = null;
    }

    const parsedStampTarget = parseInt(stampTarget, 10);

    const { merchant: updated, error: updateError } = await updateMerchant(merchant.id, {
      name: name.trim(),
      category,
      address: address.trim() || null,
      lat: resolvedLatLng?.lat ?? merchant.lat,
      lng: resolvedLatLng?.lng ?? merchant.lng,
      logo_url: logoUrl,
      stamp_target: parsedStampTarget > 0 ? parsedStampTarget : merchant.stamp_target,
      business_hours: businessHours,
    });

    setSaving(false);
    if (!updated) {
      setError(updateError ?? 'Could not save changes.');
      return;
    }
    setExpanded(false);
    onUpdated();
  }

  async function handleConfirmRemove() {
    setRemoveError(null);
    setRemoveSaving(true);
    const { merchant: updated, error: removeErr } = await updateMerchant(merchant.id, { active: false });
    setRemoveSaving(false);
    if (!updated) {
      setRemoveError(removeErr ?? 'Could not remove this location.');
      return;
    }
    onRemoved();
  }

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: color.text, fontWeight: 600, fontSize: 15, margin: 0 }}>
            {merchant.name}
            {isCurrent && <span style={{ color: color.accent, fontWeight: 600 }}> · Current</span>}
          </p>
          {merchant.address && <p style={{ color: color.muted, fontSize: 12, margin: '2px 0 0' }}>{merchant.address}</p>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {!isCurrent && (
            <PillButton onClick={() => onSetCurrent(merchant)}>Set as current</PillButton>
          )}
          <PillButton onClick={() => (expanded ? setExpanded(false) : startEdit())}>
            {expanded ? 'Close' : 'Edit'}
          </PillButton>
          {confirmingRemove ? (
            <>
              <PillButton onClick={() => setConfirmingRemove(false)} disabled={removeSaving}>Cancel</PillButton>
              <PillButton intent="danger" onClick={handleConfirmRemove} disabled={removeSaving}>
                {removeSaving ? 'Removing…' : 'Confirm'}
              </PillButton>
            </>
          ) : (
            <PillButton intent="danger" onClick={() => setConfirmingRemove(true)} disabled={!canRemove}>
              Remove
            </PillButton>
          )}
        </div>
      </div>

      {!canRemove && (
        <p style={{ color: color.muted, fontSize: 12, margin: 0 }}>
          Add another location before you can remove this one.
        </p>
      )}
      {removeError && <p style={{ color: color.error, fontSize: 13, margin: 0 }}>{removeError}</p>}

      {expanded && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: `1px solid ${color.border}`, paddingTop: 12 }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Business name"
            required
            style={inputStyle}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <AddressField
            value={address}
            onChange={setAddress}
            onResolved={(place) => setResolvedLatLng({ lat: place.lat, lng: place.lng })}
            placeholder="Business address"
          />
          <LogoUpload
            onFileSelected={setLogoFile}
            disabled={saving}
            currentUrl={merchant.logo_url}
            onRemoveExisting={() => setLogoRemoved(true)}
          />

          <div>
            <label style={{ display: 'block', color: color.muted, fontSize: 12, margin: '0 0 6px', fontWeight: 500 }}>
              Fallback stamps needed
            </label>
            <input
              type="number"
              value={stampTarget}
              onChange={(e) => setStampTarget(e.target.value)}
              min={1}
              style={inputStyle}
            />
            <p style={{ color: color.muted, fontSize: 12, margin: '4px 0 0' }}>
              Only used before this location has any Big Treats set up in Rewards.
            </p>
          </div>

          <div>
            <p style={{ color: color.muted, fontSize: 12, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
              Business hours
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DAYS_OF_WEEK.map((day) => {
                const hours = businessHours[day];
                return (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ color: color.text, fontSize: 13, fontWeight: 500, width: 90, flexShrink: 0 }}>
                      {DAY_LABELS[day]}
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: color.muted, minHeight: 44 }}>
                      <input
                        type="checkbox"
                        checked={hours.closed}
                        onChange={(e) => setBusinessHours((prev) => ({ ...prev, [day]: { ...prev[day], closed: e.target.checked } }))}
                      />
                      Closed
                    </label>
                    {!hours.closed && (
                      <>
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => setBusinessHours((prev) => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}
                          style={{ ...inputStyle, width: 110, padding: '8px 10px', minHeight: 44 }}
                        />
                        <span style={{ color: color.muted, fontSize: 12 }}>to</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => setBusinessHours((prev) => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                          style={{ ...inputStyle, width: 110, padding: '8px 10px', minHeight: 44 }}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {error && <p style={{ color: color.error, fontSize: 13, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="button" variant="secondary" onClick={() => setExpanded(false)} disabled={saving} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} style={{ flex: 2 }}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>

          <p style={{ color: color.muted, fontSize: 11, margin: 0, fontFamily: font.mono }}>
            Business ID: {merchant.slug}
          </p>
        </form>
      )}
    </Card>
  );
}
