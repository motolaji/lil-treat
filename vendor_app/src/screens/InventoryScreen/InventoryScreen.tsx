import { useEffect, useMemo, useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import {
  getInventoryItems, upsertInventoryItems, sellOne, updateItemTreatsValue,
  parseInventoryCsv, inventoryToCsv, InventoryItem,
} from '../../lib/inventory';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PillButton from '../../components/ui/PillButton';
import SectionLabel from '../../components/ui/SectionLabel';
import InlineEditNumber from '../../components/ui/InlineEditNumber';
import EmptyState from '../../components/ui/EmptyState';
import { color, font } from '../../styles/tokens';
import { formatTreats } from '../../lib/format';
import './InventoryScreen.css';

export default function InventoryScreen() {
  const { merchant } = useMerchant();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!merchant) return;
    getInventoryItems(merchant.id).then(setItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id]);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
  }, [items, search]);

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
        setUploadError('No valid rows found. Expect columns: name, sku, stock, price, treats.');
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

  async function saveTreatsValue(item: InventoryItem, newValue: number) {
    if (!merchant) return false;
    const ok = await updateItemTreatsValue(item.id, merchant.id, newValue);
    if (ok) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, treats_value: newValue } : i)));
    }
    return ok;
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
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 20px', color: color.text, fontFamily: font.heading, letterSpacing: '-0.02em' }}>Inventory</h1>

      <Card style={{ marginBottom: 16 }}>
        <p style={{ color: color.muted, fontSize: 12, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
          CSV columns: name, sku, stock, price, treats
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <label style={{
            flex: '1 1 160px', textAlign: 'center', padding: '0 12px', minHeight: 44, borderRadius: 12,
            background: color.accent, color: color.card, fontSize: 14, fontWeight: 600,
            cursor: uploading ? 'default' : 'pointer', opacity: uploading ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
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
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={items.length === 0}
            style={{ flex: '1 1 160px' }}
          >
            Export CSV
          </Button>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU"
            style={{
              flex: '2 1 220px', minHeight: 44, padding: '0 14px', borderRadius: 12, boxSizing: 'border-box',
              background: color.bg, border: `1px solid ${color.border}`,
              color: color.text, fontSize: 14, outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
        {uploadError && (
          <p style={{ color: color.error, fontSize: 13, margin: '12px 0 0' }}>{uploadError}</p>
        )}
      </Card>

      {visibleItems.length > 0 ? (
        <>
          <SectionLabel>{visibleItems.length} item{visibleItems.length === 1 ? '' : 's'}</SectionLabel>
          <div className="inventory__list">
            {visibleItems.map((item) => (
              <Card key={item.id} padding="14px 16px" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: color.text, fontWeight: 600, margin: 0, fontSize: 14 }}>{item.name}</p>
                  <p style={{ color: color.muted, fontSize: 12, margin: '2px 0 0', fontFamily: font.mono }}>
                    {item.sku} · £{item.price.toFixed(2)}
                  </p>
                  <div style={{ marginTop: 4 }}>
                    <InlineEditNumber
                      value={item.treats_value}
                      label={(v) => `${formatTreats(v)} treats each`}
                      onSave={(v) => saveTreatsValue(item, v)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{
                    fontFamily: font.mono, fontSize: 14, fontWeight: 600,
                    color: item.stock_qty === 0 ? color.error : color.text, minWidth: 24, textAlign: 'right',
                  }}>
                    {item.stock_qty}
                  </span>
                  <PillButton
                    intent={item.stock_qty === 0 ? 'neutral' : 'accent'}
                    onClick={() => handleSell(item)}
                    disabled={item.stock_qty === 0}
                  >
                    Sell 1
                  </PillButton>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <EmptyState message={items.length === 0 ? 'No inventory yet — upload a CSV to get started' : 'No items match your search'} />
      )}
    </div>
  );
}
