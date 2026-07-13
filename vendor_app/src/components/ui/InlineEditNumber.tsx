import { useState } from 'react';
import { color, radius } from '../../styles/tokens';

interface InlineEditNumberProps {
  value: number;
  label: (value: number) => string;
  onSave: (value: number) => Promise<boolean> | boolean;
}

export default function InlineEditNumber({ value, label, onSave }: InlineEditNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  function startEdit() {
    setDraft(String(value));
    setEditing(true);
  }

  async function save() {
    const parsed = parseInt(draft, 10);
    if (!parsed || parsed <= 0) return;
    const ok = await onSave(parsed);
    if (ok) setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEdit}
        style={{ background: 'transparent', border: 'none', color: color.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0, minHeight: 44 }}
      >
        {label(value)}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, flex: 1 }}>
      <input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        min={1}
        autoFocus
        style={{
          flex: 1, padding: '8px 10px', borderRadius: radius.sm, boxSizing: 'border-box',
          background: color.bg, border: `1px solid ${color.border}`,
          color: color.text, fontSize: 13, outline: 'none', fontFamily: 'inherit',
          minHeight: 44,
        }}
      />
      <button
        type="button"
        onClick={save}
        style={{
          padding: '0 16px', minHeight: 44, background: color.accent, color: color.card,
          border: 'none', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        Save
      </button>
    </div>
  );
}
