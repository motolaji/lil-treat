import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMerchantsForUser, supabase, Merchant } from '../lib/supabase';

interface MerchantContextValue {
  merchant: Merchant | null;
  merchants: Merchant[];
  loading: boolean;
  setMerchant: (m: Merchant) => void;
  refreshMerchants: () => Promise<void>;
}

const MerchantContext = createContext<MerchantContextValue>({
  merchant: null,
  merchants: [],
  loading: true,
  setMerchant: () => {},
  refreshMerchants: async () => {},
});

export function useMerchant() {
  return useContext(MerchantContext);
}

export function MerchantProvider({ children }: { children: ReactNode }) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchant, setMerchantState] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMerchants() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return;
    }

    const list = await getMerchantsForUser(session.user.id);
    setMerchants(list);
    if (list.length === 0) {
      setMerchantState(null);
      setLoading(false);
      return;
    }

    setMerchantState((prev) => {
      const stillCurrent = prev ? list.find((m) => m.id === prev.id) : null;
      if (stillCurrent) return stillCurrent;

      // Previously-selected location is gone (e.g. just deactivated in
      // Settings) — fall back to the saved id if still valid, else first.
      const savedId = localStorage.getItem('vendorapp_merchant_id');
      const saved = savedId ? list.find((m) => m.id === savedId) : null;
      const next = saved ?? list[0];
      localStorage.setItem('vendorapp_merchant_id', next.id);
      return next;
    });
    setLoading(false);
  }

  useEffect(() => {
    refreshMerchants();
  }, []);

  function setMerchant(m: Merchant) {
    setMerchantState(m);
    localStorage.setItem('vendorapp_merchant_id', m.id);
  }

  return (
    <MerchantContext.Provider value={{ merchant, merchants, loading, setMerchant, refreshMerchants }}>
      {children}
    </MerchantContext.Provider>
  );
}
