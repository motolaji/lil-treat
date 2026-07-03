'use client';

import { useEffect, useState } from 'react';
import { useMerchant } from '../MerchantContext';
import {
  getInventoryItems, upsertInventoryItems, sellOne,
  parseInventoryCsv, inventoryToCsv, InventoryItem,
} from '../../../lib/inventory';

export default function MerchantInventoryPage() {
  const { merchant } = useMerchant();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!merchant) return;
    getInventoryItems(merchant.id).then(setItems);
  }, [merchant?.id]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !merchant) return;

    setUploading(true);
    setUploadError(null);
    try {
      const text = await file.text();
      const rows = parseInventoryCsv(text);
      if (rows.length === 0) {
        setUploadError('No valid rows found. Expect columns: name, sku, stock, price.');
        return;
      }
      const updated = await upsertInventoryItems(merchant.id, rows);
      if (updated.length === 0) {
        setUploadError('Could not save inventory. Check your connection and try again.');
        return;
      }
      const fresh = await getInventoryItems(merchant.id);
      setItems(fresh);
    } finally {
      setUploading(false);
    }
  }

  async function handleSell(item: InventoryItem) {
    if (!merchant || item.stock_qty <= 0) return;
    const newQty = await sellOne(item.id, merchant.id, item.stock_qty);
    if (newQty === null) return;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, stock_qty: newQty } : i)));
  }

  function handleExport() {
    const csv = inventoryToCsv(items);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${merchant?.slug ?? 'inventory'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px', color: '#1C1C1A', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>Inventory</h1>

      <div style={{
        background: '#FFFFFF', border: '1px solid #EBEBE8',
        borderRadius: 20, padding: '20px', marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <p style={{ color: '#AEADA7', fontSize: 12, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
          CSV columns: name, sku, stock, price
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{
            flex: 1, textAlign: 'center', padding: '12px', borderRadius: 12,
            background: '#13B96D', color: '#FFFFFF', fontSize: 14, fontWeight: 600,
            cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.6 : 1,
          }}>
            {uploading ? 'Uploading…' : 'Upload CSV'}
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
          <button
            onClick={handleExport}
            disabled={items.length === 0}
            style={{
              flex: 1, padding: '12px', borderRadius: 12,
              background: '#F7F7F5', color: '#1C1C1A', border: '1px solid #EBEBE8',
              fontSize: 14, fontWeight: 600, cursor: items.length === 0 ? 'default' : 'pointer',
              opacity: items.length === 0 ? 0.5 : 1, fontFamily: 'inherit',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            Export CSV
          </button>
        </div>
        {uploadError && (
          <p style={{ color: '#DC2626', fontSize: 13, margin: '12px 0 0' }}>{uploadError}</p>
        )}
      </div>

      {items.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ color: '#AEADA7', fontSize: 11, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
            {items.length} item{items.length === 1 ? '' : 's'}
          </p>
          {items.map((item) => (
            <div key={item.id} style={{
              background: '#FFFFFF', border: '1px solid #EBEBE8',
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ color: '#1C1C1A', fontWeight: 600, margin: 0, fontSize: 14 }}>{item.name}</p>
                <p style={{ color: '#AEADA7', fontSize: 12, margin: '2px 0 0', fontFamily: "'DM Mono', monospace" }}>
                  {item.sku} · £{item.price.toFixed(2)}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 600,
                  color: item.stock_qty === 0 ? '#DC2626' : '#1C1C1A', minWidth: 24, textAlign: 'right',
                }}>
                  {item.stock_qty}
                </span>
                <button
                  onClick={() => handleSell(item)}
                  disabled={item.stock_qty === 0}
                  style={{
                    padding: '8px 14px', borderRadius: 9999, border: 'none',
                    background: item.stock_qty === 0 ? '#F7F7F5' : '#13B96D',
                    color: item.stock_qty === 0 ? '#AEADA7' : '#FFFFFF',
                    fontSize: 12, fontWeight: 600, cursor: item.stock_qty === 0 ? 'default' : 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
                  }}
                >
                  Sell 1
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', paddingTop: 40 }}>
          <p style={{ color: '#AEADA7', fontSize: 14 }}>No inventory yet — upload a CSV to get started</p>
        </div>
      )}
    </div>
  );
}
