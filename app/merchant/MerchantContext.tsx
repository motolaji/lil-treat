'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMerchantsForUser, supabase, Merchant } from '../../lib/supabase';

interface MerchantContextValue {
  merchant: Merchant | null;
  merchants: Merchant[];
  setMerchant: (m: Merchant) => void;
}

const MerchantContext = createContext<MerchantContextValue>({
  merchant: null,
  merchants: [],
  setMerchant: () => {},
});

export function useMerchant() {
  return useContext(MerchantContext);
}

export function MerchantProvider({ children }: { children: ReactNode }) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchant, setMerchantState] = useState<Merchant | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const list = await getMerchantsForUser(session.user.id);
      setMerchants(list);
      if (list.length === 0) return;
      const savedId = localStorage.getItem('stackpot_merchant_id');
      const saved = savedId ? list.find((m) => m.id === savedId) : null;
      setMerchantState(saved ?? list[0]);
    }
    load();
  }, []);

  function setMerchant(m: Merchant) {
    setMerchantState(m);
    localStorage.setItem('stackpot_merchant_id', m.id);
  }

  return (
    <MerchantContext.Provider value={{ merchant, merchants, setMerchant }}>
      {children}
    </MerchantContext.Provider>
  );
}
