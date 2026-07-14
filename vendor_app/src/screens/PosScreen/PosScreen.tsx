import { useEffect, useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { getInventoryItems, createInventoryItem, InventoryItem } from '../../lib/inventory';
import { uploadInventoryItemImage } from '../../lib/storage';
import { withExpiry } from '../../lib/qrExpiry';
import QRDisplay from '../../components/QRDisplay/QRDisplay';
import ItemImageUpload from '../../components/ItemImageUpload/ItemImageUpload';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Stepper from '../../components/ui/Stepper';
import SectionLabel from '../../components/ui/SectionLabel';
import EmptyState from '../../components/ui/EmptyState';
import Skeleton from '../../components/ui/Skeleton';
import { color, font } from '../../styles/tokens';
import { inputStyle } from '../../styles/authStyles';
import { formatTreats } from '../../lib/format';
import './PosScreen.css';

interface CartLine {
  inventory_item_id: string;
  name: string;
  qty: number;
  unit_price: number;
  treats_value: number;
}

export default function PosScreen() {
  const { merchant, loading: merchantLoading } = useMerchant();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [dataLoading, setDataLoading] = useState(true);

  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemTreats, setNewItemTreats] = useState('');
  const [newItemImageFile, setNewItemImageFile] = useState<File | null>(null);
  const [creatingItem, setCreatingItem] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [stage, setStage] = useState<'cart' | 'qr'>('cart');
  const [salePayload, setSalePayload] = useState('');
  const [confirmedLines, setConfirmedLines] = useState<CartLine[]>([]);

  useEffect(() => {
    if (!merchant) return;
    setDataLoading(true);
    getInventoryItems(merchant.id).then((loaded) => {
      setItems(loaded);
      setDataLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id]);

  const loading = merchantLoading || dataLoading;

  const cartLines: CartLine[] = items
    .map((item) => ({
      inventory_item_id: item.id,
      name: item.name,
      qty: quantities[item.id] ?? 0,
      unit_price: item.price,
      treats_value: item.treats_value,
    }))
    .filter((line) => line.qty > 0);

  const totalAmount = cartLines.reduce((sum, l) => sum + l.qty * l.unit_price, 0);
  const totalTreats = cartLines.reduce((sum, l) => sum + l.qty * l.treats_value, 0);

  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!merchant) return;

    const price = parseFloat(newItemPrice);
    const treatsValue = parseFloat(newItemTreats);
    if (!newItemName.trim() || Number.isNaN(price) || price < 0 || Number.isNaN(treatsValue) || treatsValue < 0) {
      setCreateError('Enter a name, a valid price, and a valid point value.');
      return;
    }

    setCreateError(null);
    setCreatingItem(true);

    const imageUrl = newItemImageFile ? await uploadInventoryItemImage(merchant.id, newItemImageFile) : null;
    const created = await createInventoryItem(merchant.id, { name: newItemName.trim(), price, treatsValue, imageUrl });
    setCreatingItem(false);

    if (!created) {
      setCreateError('Could not save this item. Try again.');
      return;
    }

    setItems((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setNewItemName('');
    setNewItemPrice('');
    setNewItemTreats('');
    setNewItemImageFile(null);
    setShowNewItemForm(false);
  }

  function generateQr() {
    if (!merchant || cartLines.length === 0) return;
    const payload = withExpiry({
      type: 'sale' as const,
      merchant_id: merchant.id,
      line_items: cartLines,
    });
    setSalePayload(JSON.stringify(payload));
    setConfirmedLines(cartLines);
    setStage('qr');
  }

  function newSale() {
    setQuantities({});
    setSalePayload('');
    setConfirmedLines([]);
    setStage('cart');
  }

  if (loading) {
    return (
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <Skeleton height={200} />
      </div>
    );
  }

  if (stage === 'qr') {
    const confirmedAmount = confirmedLines.reduce((sum, l) => sum + l.qty * l.unit_price, 0);
    const confirmedTreats = confirmedLines.reduce((sum, l) => sum + l.qty * l.treats_value, 0);

    return (
      <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: color.text, fontFamily: font.heading, letterSpacing: '-0.02em' }}>POS</h1>
        <p style={{ color: color.muted, fontSize: 13, margin: '0 0 20px' }}>
          Have the customer scan this to earn their points
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <QRDisplay value={salePayload} size={240} />

          <Card style={{ width: '100%' }}>
            <SectionLabel style={{ marginBottom: 8 }}>Sale summary</SectionLabel>
            {confirmedLines.map((line) => (
              <div key={line.inventory_item_id} className="pos__summary-row">
                <p style={{ color: color.text, fontSize: 14, margin: '4px 0' }}>{line.qty} × {line.name}</p>
                <p style={{ color: color.muted, fontSize: 13, margin: '4px 0' }}>£{(line.qty * line.unit_price).toFixed(2)}</p>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${color.border}`, marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <p style={{ color: color.text, fontWeight: 700, fontSize: 14, margin: 0 }}>Total</p>
              <p style={{ color: color.text, fontWeight: 700, fontSize: 14, margin: 0 }}>£{confirmedAmount.toFixed(2)} · {formatTreats(confirmedTreats)} pts</p>
            </div>
          </Card>

          <Button onClick={newSale} fullWidth>
            New sale
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: color.text, fontFamily: font.heading, letterSpacing: '-0.02em' }}>POS</h1>
      <p style={{ color: color.muted, fontSize: 13, margin: '0 0 20px' }}>
        Tap items to build the sale, then confirm payment
      </p>

      {items.length > 0 ? (
        <div className="pos__grid">
          {items.map((item) => {
            const qty = quantities[item.id] ?? 0;
            const inCart = qty > 0;
            return (
              <Card
                key={item.id}
                padding={0}
                style={{ overflow: 'hidden', border: `${inCart ? 2 : 1}px solid ${inCart ? color.accent : color.border}` }}
              >
                <div className="pos__tile-image">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="pos__tile-img" />
                  ) : (
                    <div className="pos__tile-placeholder" style={{ background: color.bg, color: color.muted }}>
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px 10px 12px' }}>
                  <p style={{ color: color.text, fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>{item.name}</p>
                  <p style={{ color: color.muted, fontSize: 11, margin: '0 0 8px' }}>
                    £{item.price.toFixed(2)} · {formatTreats(item.treats_value)} pts
                  </p>
                  <Stepper
                    orientation="horizontal"
                    value={qty}
                    decrementDisabled={qty === 0}
                    onDecrement={() => setQuantities((q) => ({ ...q, [item.id]: Math.max(0, (q[item.id] ?? 0) - 1) }))}
                    onIncrement={() => setQuantities((q) => ({ ...q, [item.id]: (q[item.id] ?? 0) + 1 }))}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState message="No items yet — add one below" paddingTop={20} />
      )}

      {showNewItemForm ? (
        <Card style={{ marginBottom: 16 }}>
          <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Item name (e.g. Americano)"
              required
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="number"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder="Price (e.g. 2.00)"
                min={0}
                step="0.01"
                required
                style={inputStyle}
              />
              <input
                type="number"
                value={newItemTreats}
                onChange={(e) => setNewItemTreats(e.target.value)}
                placeholder="Points (e.g. 0.5)"
                min={0}
                step="0.1"
                required
                style={inputStyle}
              />
            </div>
            <ItemImageUpload onFileSelected={setNewItemImageFile} disabled={creatingItem} />
            {createError && <p style={{ color: color.error, fontSize: 13, margin: 0 }}>{createError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="button" variant="secondary" onClick={() => setShowNewItemForm(false)} disabled={creatingItem} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button type="submit" disabled={creatingItem} style={{ flex: 2 }}>
                {creatingItem ? 'Adding…' : 'Add item'}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button variant="secondary" onClick={() => setShowNewItemForm(true)} fullWidth style={{ marginBottom: 16 }}>
          + New item
        </Button>
      )}

      <Card>
        <div className="pos__summary">
          <div className="pos__summary-row">
            <p style={{ color: color.muted, fontSize: 13, margin: 0 }}>Total</p>
            <p style={{ color: color.text, fontWeight: 700, fontSize: 16, margin: 0 }}>£{totalAmount.toFixed(2)}</p>
          </div>
          <div className="pos__summary-row">
            <p style={{ color: color.muted, fontSize: 13, margin: 0 }}>Points earned</p>
            <p style={{ color: color.accent, fontWeight: 700, fontSize: 16, margin: 0 }}>{formatTreats(totalTreats)}</p>
          </div>
        </div>
        <Button onClick={generateQr} disabled={cartLines.length === 0} fullWidth>
          Paid
        </Button>
      </Card>
    </div>
  );
}
