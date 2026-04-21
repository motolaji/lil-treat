'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConsumerNav from '../components/ConsumerNav';
import ShoppingList from '../components/ShoppingList';
import {
  getOrCreateUser,
  getShoppingLists,
  updateListItem,
  addItemToList,
  ShoppingListRow,
  ShoppingItem,
} from '../../lib/supabase';

export default function ListPage() {
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingListRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const u = await getOrCreateUser();
      if (!u) return;
      setUserId(u.id);
      const l = await getShoppingLists(u.id);
      setLists(l);
      setLoading(false);
    }
    load();
  }, []);

  async function handleToggleItem(listId: string, itemId: string, checked: boolean) {
    await updateListItem(listId, itemId, checked);
    setLists((prev) =>
      prev.map((l) =>
        l.id !== listId ? l : {
          ...l,
          items: (l.items as ShoppingItem[]).map((i) =>
            i.id === itemId ? { ...i, checked } : i,
          ),
        },
      ),
    );
  }

  async function handleAddItem(listId: string, name: string) {
    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name,
      qty: 1,
      category: 'Other',
      checked: false,
    };
    await addItemToList(listId, newItem);
    setLists((prev) =>
      prev.map((l) =>
        l.id !== listId ? l : { ...l, items: [...(l.items as ShoppingItem[]), newItem] },
      ),
    );
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#F7F7F5' }}>
      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
        <div style={{ paddingTop: 'env(safe-area-inset-top)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#1C1C1A', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>Lists</h1>
            <p style={{ color: '#AEADA7', fontSize: 13, margin: '2px 0 0' }}>Your shopping lists</p>
          </div>
          <button
            onClick={() => router.push('/scan?mode=receipt')}
            style={{
              background: '#13B96D', color: '#FFFFFF', border: 'none',
              borderRadius: 9999, padding: '9px 18px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation',
            }}
          >
            + New list
          </button>
        </div>

        {loading ? (
          <div style={{ paddingTop: 60, textAlign: 'center' }}>
            <p style={{ color: '#AEADA7', fontSize: 14 }}>Loading…</p>
          </div>
        ) : lists.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 80, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🧾</div>
            <p style={{ color: '#1C1C1A', fontSize: 17, fontWeight: 600, margin: '8px 0 0', fontFamily: "'Syne', sans-serif" }}>No lists yet</p>
            <p style={{ color: '#AEADA7', fontSize: 14, margin: 0 }}>Scan a receipt to build your first shopping list</p>
            <button
              onClick={() => router.push('/scan?mode=receipt')}
              style={{
                marginTop: 12, background: '#13B96D', color: '#FFFFFF', border: 'none',
                borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation',
              }}
            >
              Scan a receipt
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lists.map((list) => (
              <ShoppingList
                key={list.id}
                list={list}
                onToggleItem={handleToggleItem}
                onAddItem={handleAddItem}
              />
            ))}
          </div>
        )}
      </main>

      <ConsumerNav />
    </div>
  );
}
