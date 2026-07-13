import { useEffect, useState } from 'react';
import { useMerchant } from '../../context/MerchantContext';
import { createReward, updateReward, moveReward, getMerchantRewards, Reward } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PillButton from '../../components/ui/PillButton';
import Stepper from '../../components/ui/Stepper';
import InlineEditNumber from '../../components/ui/InlineEditNumber';
import EmptyState from '../../components/ui/EmptyState';
import { color, font } from '../../styles/tokens';
import '../../styles/split-form-layout.css';

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 12, boxSizing: 'border-box',
  background: color.bg, border: `1px solid ${color.border}`,
  color: color.text, fontSize: 15, outline: 'none', fontFamily: 'inherit',
};

export default function RewardsScreen() {
  const { merchant } = useMerchant();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (!merchant) return;
    getMerchantRewards(merchant.id).then(setRewards);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant?.id]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);

    if (!merchant) {
      setAddError('No location selected — try switching locations in Settings, or reload the page.');
      return;
    }

    const parsedCost = parseInt(cost, 10);
    if (!label.trim() || !parsedCost || parsedCost <= 0) {
      setAddError('Enter a reward name and a valid number of stamps.');
      return;
    }

    setSaving(true);
    const { reward: created, error } = await createReward(merchant.id, label.trim(), parsedCost, description.trim() || undefined);
    setSaving(false);

    if (!created) {
      setAddError(error ?? 'Could not save this reward. Check your connection and try again.');
      return;
    }

    setLabel('');
    setDescription('');
    setCost('');
    const fresh = await getMerchantRewards(merchant.id);
    setRewards(fresh);
  }

  async function handleMove(reward: Reward, direction: 'up' | 'down') {
    if (!merchant) return;
    const ok = await moveReward(merchant.id, reward.id, direction);
    if (ok) {
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

  async function saveCost(reward: Reward, newCost: number) {
    const ok = await updateReward(reward.id, { cost: newCost });
    if (ok) {
      setRewards((prev) => prev.map((r) => (r.id === reward.id ? { ...r, cost: newCost } : r)));
    }
    return ok;
  }

  return (
    <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: color.text, fontFamily: font.heading, letterSpacing: '-0.02em' }}>Big Treats</h1>
      <p style={{ color: color.muted, fontSize: 13, margin: '0 0 20px' }}>
        Manage the rewards customers can redeem their small treats for
      </p>

      <div className="split-form-layout">
        <div className="split-form-layout__form">
          <Card>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Reward (e.g. Free cup of coffee)"
                required
                style={fieldStyle}
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                style={{ ...fieldStyle, resize: 'vertical' }}
              />
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="Small treats required (e.g. 100)"
                min={1}
                required
                style={fieldStyle}
              />
              {addError && (
                <p style={{ color: color.error, fontSize: 13, margin: 0 }}>{addError}</p>
              )}
              <Button type="submit" disabled={saving} fullWidth>
                {saving ? 'Adding…' : '+ Add reward'}
              </Button>
            </form>
          </Card>
        </div>

        <div className="split-form-layout__list">
          {rewards.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rewards.map((reward, i) => (
                <Card key={reward.id} padding="14px 16px" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)', display: 'flex', gap: 12 }}>
                  <Stepper
                    orientation="vertical"
                    onUp={() => handleMove(reward, 'up')}
                    onDown={() => handleMove(reward, 'down')}
                    upDisabled={i === 0}
                    downDisabled={i === rewards.length - 1}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: color.text, fontWeight: 600, margin: 0, fontSize: 14 }}>{reward.label}</p>
                        {reward.description && (
                          <p style={{ color: color.muted, fontSize: 13, margin: '4px 0 0' }}>{reward.description}</p>
                        )}
                      </div>
                      {!reward.active && (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 9999,
                          background: color.bg, color: color.muted, flexShrink: 0,
                        }}>
                          Inactive
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 10 }}>
                      <InlineEditNumber
                        value={reward.cost}
                        label={(v) => `${v} small treats`}
                        onSave={(v) => saveCost(reward, v)}
                      />
                      <PillButton
                        intent={reward.active ? 'danger' : 'accent'}
                        onClick={() => toggleActive(reward)}
                      >
                        {reward.active ? 'Deactivate' : 'Activate'}
                      </PillButton>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState message="No rewards yet — add one above" paddingTop={20} />
          )}
        </div>
      </div>
    </div>
  );
}
