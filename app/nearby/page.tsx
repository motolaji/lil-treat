'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import VendorListItem from '../components/VendorListItem';
import { getOrCreateUser, getOrCreateCard, getMerchants, Merchant, UserRow } from '../../lib/supabase';
import { getCurrentPosition, haversineDistanceKm, Coordinates } from '../../lib/geo';

export default function NearbyPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserRow | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [search, setSearch] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [u, allMerchants] = await Promise.all([getOrCreateUser(), getMerchants()]);
      setUser(u);
      setMerchants(allMerchants);

      try {
        const pos = await getCurrentPosition();
        setCoords(pos);
      } catch {
        setLocationDenied(true);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleTap(merchant: Merchant) {
    if (!user || joiningId) return;
    setJoiningId(merchant.id);
    await getOrCreateCard(user.id, merchant.id);
    router.push('/');
  }

  const filtered = merchants.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const withDistance = filtered
    .filter((m) => m.lat != null && m.lng != null)
    .map((m) => ({ merchant: m, distanceKm: haversineDistanceKm(coords!, { lat: m.lat!, lng: m.lng! }) }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const withoutDistance = filtered.filter((m) => m.lat == null || m.lng == null);

  return (
    <div style={{ minHeight: '100dvh', background: '#F7F7F5', padding: '16px' }}>
      <div style={{ paddingTop: 'env(safe-area-inset-top)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={backBtnStyle}>‹</button>
        <h1 style={titleStyle}>Nearby vendors</h1>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors"
          style={{
            flex: 1, padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
            background: '#FFFFFF', border: '1px solid #EBEBE8',
            color: '#1C1C1A', fontSize: 15, outline: 'none',
          }}
        />
        <button
          onClick={() => {}}
          style={{
            padding: '0 18px', borderRadius: 12, background: '#1C1C1A', color: '#FFFFFF',
            border: 'none', fontSize: 13, fontWeight: 600, cursor: 'default',
            fontFamily: 'inherit', touchAction: 'manipulation',
          }}
        >
          Treat Jar
        </button>
      </div>

      {locationDenied && !loading && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
          <p style={{ color: '#D97706', fontSize: 13, margin: 0 }}>Enable location to see nearby vendors — showing all vendors instead.</p>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#AEADA7', fontSize: 14, textAlign: 'center', paddingTop: 40 }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <p style={{ color: '#AEADA7', fontSize: 14 }}>No vendors found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {coords && withDistance.map(({ merchant, distanceKm }) => (
            <VendorListItem
              key={merchant.id}
              merchant={merchant}
              distanceKm={distanceKm}
              disabled={joiningId !== null}
              onTap={() => handleTap(merchant)}
            />
          ))}

          {withoutDistance.length > 0 && (
            <>
              {coords && withDistance.length > 0 && (
                <p style={{ color: '#AEADA7', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, margin: '8px 0 0' }}>
                  Other vendors
                </p>
              )}
              {withoutDistance.map((merchant) => (
                <VendorListItem
                  key={merchant.id}
                  merchant={merchant}
                  distanceKm={null}
                  disabled={joiningId !== null}
                  onTap={() => handleTap(merchant)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  fontSize: 22, fontWeight: 700, margin: 0, color: '#1C1C1A',
  fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em',
};

const backBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: '50%', background: '#FFFFFF', border: '1px solid #EBEBE8',
  color: '#1C1C1A', fontSize: 20, lineHeight: 1, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
};
