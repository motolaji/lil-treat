import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { MerchantProvider } from '../../context/MerchantContext';
import { centeredPage } from '../../styles/authStyles';

export default function AuthGate() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={centeredPage}>
        <p style={{ color: '#AEADA7', fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return (
    <MerchantProvider>
      <Outlet />
    </MerchantProvider>
  );
}
