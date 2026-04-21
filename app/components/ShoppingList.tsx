'use client';

import { useState } from 'react';
import { ShoppingItem, ShoppingListRow } from '../../lib/supabase';

interface ShoppingListProps {
  list: ShoppingListRow;
  onToggleItem: (listId: string, itemId: string, checked: boolean) => void;
  onAddItem: (listId: string, name: string) => void;
}

export default function ShoppingList({ list, onToggleItem, onAddItem }: ShoppingListProps) {
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const items = list.items as ShoppingItem[];
  const checkedCount = items.filter((i) => i.checked).length;
  const remaining = items.length - checkedCount;

  const categories = Array.from(new Set(items.map((i) => i.category)));

  function submitAdd(category: string) {
    if (!newItemName.trim()) return;
    onAddItem(list.id, newItemName.trim());
    setNewItemName('');
    setAddingCategory(null);
  }

  const date = new Date(list.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 20,
      overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #EBEBE8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ color: '#1C1C1A', fontWeight: 600, fontSize: 15, margin: 0, fontFamily: "'Syne', sans-serif" }}>
              {list.source_label}
            </p>
            <p style={{ color: '#AEADA7', fontSize: 12, margin: '2px 0 0' }}>{date}</p>
          </div>
          <span style={{
            background: remaining === 0 ? '#DCFCE7' : '#F0FFF4',
            color: remaining === 0 ? '#15803D' : '#AEADA7',
            fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 9999,
            border: `1px solid ${remaining === 0 ? '#BBF7D0' : '#EBEBE8'}`,
          }}>
            {remaining === 0 ? 'Done' : `${remaining} left`}
          </span>
        </div>
        {items.length > 0 && (
          <div style={{ height: 3, background: '#F0EFE9', borderRadius: 9999, marginTop: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: '#13B96D', borderRadius: 9999,
              width: `${(checkedCount / items.length) * 100}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        )}
      </div>

      {/* Items by category */}
      <div style={{ padding: '8px 0' }}>
        {categories.map((category) => {
          const catItems = items.filter((i) => i.category === category);
          const unchecked = catItems.filter((i) => !i.checked);
          const checked = catItems.filter((i) => i.checked);
          const sorted = [...unchecked, ...checked];

          return (
            <div key={category} style={{ marginBottom: 4 }}>
              <p style={{
                color: '#AEADA7', fontSize: 11, fontWeight: 600, margin: 0,
                padding: '6px 20px 2px', textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                {category}
              </p>
              {sorted.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onToggleItem(list.id, item.id, !item.checked)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 20px', background: 'transparent', border: 'none',
                    cursor: 'pointer', touchAction: 'manipulation', textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${item.checked ? '#13B96D' : '#EBEBE8'}`,
                    background: item.checked ? '#13B96D' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {item.checked && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{
                    color: item.checked ? '#AEADA7' : '#1C1C1A',
                    fontSize: 14,
                    textDecoration: item.checked ? 'line-through' : 'none',
                    flex: 1,
                    transition: 'color 0.15s',
                  }}>
                    {item.name}
                  </span>
                  {item.qty > 1 && (
                    <span style={{
                      color: '#AEADA7', fontSize: 12,
                      background: '#F7F7F5', borderRadius: 9999,
                      padding: '2px 8px', flexShrink: 0,
                    }}>
                      ×{item.qty}
                    </span>
                  )}
                </button>
              ))}

              {/* Add item inline */}
              {addingCategory === category ? (
                <div style={{ display: 'flex', gap: 8, padding: '4px 20px 8px', alignItems: 'center' }}>
                  <input
                    autoFocus
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submitAdd(category); if (e.key === 'Escape') setAddingCategory(null); }}
                    placeholder="Item name"
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 14,
                      background: '#F7F7F5', border: '1px solid #EBEBE8', color: '#1C1C1A',
                      outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  <button onClick={() => submitAdd(category)} style={{ ...actionBtn, background: '#13B96D', color: '#FFFFFF' }}>Add</button>
                  <button onClick={() => setAddingCategory(null)} style={{ ...actionBtn, background: '#F7F7F5', color: '#AEADA7' }}>✕</button>
                </div>
              ) : (
                <button
                  onClick={() => { setAddingCategory(category); setNewItemName(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 20px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#AEADA7', fontSize: 13, fontFamily: 'inherit', touchAction: 'manipulation',
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add item
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  padding: '8px 14px', border: 'none', borderRadius: 8, fontSize: 13,
  fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation',
};
