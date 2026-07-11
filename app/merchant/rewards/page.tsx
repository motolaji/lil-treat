'use client';

import { useEffect, useState } from 'react';
import { useMerchant } from '../MerchantContext';
import { createReward, updateReward, getMerchantRewards, Reward } from '../../../lib/supabase';

export default function MerchantRewardsPage() {
  const { merchant } = useMerchant();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState('');

  useEffect(() => {
    if (!merchant) return;
    getMerchantRewards(merchant.id).then(setRewards);
  }, [merchant?.id]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const parsedCost = parseInt(cost, 10);
    if (!merchant || !label.trim() || !parsedCost || parsedCost <= 0) return;

    setSaving(true);
    const created = await createReward(merchant.id, label.trim(), parsedCost, description.trim() || undefined);
    setSaving(false);

    if (created) {
      setLabel('');
      setDescription('');
      setCost('');
      const fresh = await getMerchantRewards(merchant.id);
      setRewards(fresh);
    }
  }

  async function toggleActive(reward: Reward) {
    const ok = await updateReward(reward.id, { active: !reward.active });
    if (ok) {
      setRewards((prev) => prev.map((r) => (r.id === reward.id ? { ...r, active: !r.active } : r)));
    }
  }

  function startEditCost(reward: Reward) {
    setEditingId(reward.id);
    setEditCost(String(reward.cost));
  }

  async function saveEditCost(reward: Reward) {
    const parsed = parseInt(editCost, 10);
    if (!parsed || parsed <= 0) return;
    const ok = await updateReward(reward.id, { cost: parsed });
    if (ok) {
      setRewards((prev) => prev.map((r) => (r.id === reward.id ? { ...r, cost: parsed } : r)));
      setEditingId(null);
    }
  }

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#1C1C1A', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>Big Treats</h1>
      <p style={{ color: '#AEADA7', fontSize: 13, margin: '0 0 20px' }}>
        Manage the rewards customers can redeem their small treats for
      </p>

      <form onSubmit={handleAdd} style={{
        background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 20,
        padding: '20px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Reward (e.g. Free cup of coffee)"
          required
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
            background: '#F7F7F5', border: '1px solid #EBEBE8',
            color: '#1C1C1A', fontSize: 15, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
            background: '#F7F7F5', border: '1px solid #EBEBE8',
            color: '#1C1C1A', fontSize: 15, outline: 'none', fontFamily: 'inherit', resize: 'vertical',
          }}
        />
        <input
          type="number"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="Small treats required (e.g. 100)"
          min={1}
          required
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
            background: '#F7F7F5', border: '1px solid #EBEBE8',
            color: '#1C1C1A', fontSize: 15, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '13px', background: '#13B96D', color: '#FFFFFF', border: 'none', borderRadius: 14,
            fontSize: 15, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
            fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {saving ? 'Adding…' : '+ Add reward'}
        </button>
      </form>

      {rewards.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rewards.map((reward) => (
            <div key={reward.id} style={{
              background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 14,
              padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: '#1C1C1A', fontWeight: 600, margin: 0, fontSize: 14 }}>{reward.label}</p>
                  {reward.description && (
                    <p style={{ color: '#AEADA7', fontSize: 13, margin: '4px 0 0' }}>{reward.description}</p>
                  )}
                </div>
                {!reward.active && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 9999,
                    background: '#F7F7F5', color: '#AEADA7', flexShrink: 0,
                  }}>
                    Inactive
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 10 }}>
                {editingId === reward.id ? (
                  <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                    <input
                      type="number"
                      value={editCost}
                      onChange={(e) => setEditCost(e.target.value)}
                      min={1}
                      autoFocus
                      style={{
                        flex: 1, padding: '8px 10px', borderRadius: 8, boxSizing: 'border-box',
                        background: '#F7F7F5', border: '1px solid #EBEBE8',
                        color: '#1C1C1A', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                    <button
                      onClick={() => saveEditCost(reward)}
                      style={{ padding: '8px 14px', background: '#13B96D', color: '#FFFFFF', border: 'none', borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditCost(reward)}
                    style={{ background: 'transparent', border: 'none', color: '#1C1C1A', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                  >
                    {reward.cost} small treats
                  </button>
                )}
                <button
                  onClick={() => toggleActive(reward)}
                  style={{
                    padding: '8px 14px', borderRadius: 9999, border: '1px solid #EBEBE8',
                    background: '#FFFFFF', color: reward.active ? '#DC2626' : '#13B96D',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                  }}
                >
                  {reward.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', paddingTop: 20 }}>
          <p style={{ color: '#AEADA7', fontSize: 14 }}>No rewards yet — add one above</p>
        </div>
      )}
    </div>
  );
}
