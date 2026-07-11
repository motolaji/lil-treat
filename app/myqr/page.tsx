'use client';

import { useEffect, useState } from 'react';
import QRDisplay from '../components/QRDisplay';
import ConsumerNav from '../components/ConsumerNav';
import { getOrCreateUser, UserRow } from '../../lib/supabase';
import { withExpiry } from '../../lib/qrExpiry';

export default function MyQRPage() {
  const [user, setUser] = useState<UserRow | null>(null);
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    getOrCreateUser().then((u) => { if (u) setUser(u); });
  }, []);

  // Regenerate periodically so a live view never goes stale — only a
  // screenshotted/exported copy expires (see lib/qrExpiry.ts).
  useEffect(() => {
    if (!user) return;

    function refresh() {
      setQrValue(JSON.stringify(withExpiry({ type: 'consumer', user_handle: user!.handle, user_id: user!.id })));
    }

    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#F7F7F5' }}>
      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
        <div style={{ paddingTop: 'env(safe-area-inset-top)', marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#1C1C1A', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>My QR</h1>
          <p style={{ color: '#AEADA7', fontSize: 13, margin: 0 }}>
            Show this to the merchant to earn a stamp
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {qrValue ? (
            <QRDisplay value={qrValue} size={260} />
          ) : (
            <div style={{ width: 300, height: 300, background: '#FFFFFF', borderRadius: 20, border: '1px solid #EBEBE8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#AEADA7', fontSize: 13 }}>Loading…</p>
            </div>
          )}
          {user && (
            <p style={{ color: '#AEADA7', fontSize: 13, fontFamily: "'DM Mono', monospace", margin: 0 }}>
              {user.handle}
            </p>
          )}
        </div>
      </main>

      <ConsumerNav />
    </div>
  );
}
