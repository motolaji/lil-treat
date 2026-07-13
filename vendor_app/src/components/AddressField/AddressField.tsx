import { useEffect, useRef, useState } from 'react';
import { autocompleteAddress, resolvePlace, PlaceSuggestion } from '../../lib/places';

interface AddressFieldProps {
  value: string;
  onChange: (address: string) => void;
  onResolved: (place: { formattedAddress: string; lat: number; lng: number }) => void;
  placeholder?: string;
}

export default function AddressField({ value, onChange, onResolved, placeholder }: AddressFieldProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await autocompleteAddress(value);
      setSuggestions(results);
      setOpen(results.length > 0);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  async function handleSelect(suggestion: PlaceSuggestion) {
    setOpen(false);
    onChange(suggestion.description);

    const resolved = await resolvePlace(suggestion.placeId);
    if (resolved) {
      onChange(resolved.formattedAddress);
      onResolved(resolved);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(suggestions.length > 0)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder ?? 'Business address'}
        style={{
          width: '100%', padding: '14px 16px', borderRadius: 14, boxSizing: 'border-box',
          background: '#FFFFFF', border: '1px solid #EBEBE8',
          color: '#1C1C1A', fontSize: 16, outline: 'none', fontFamily: 'inherit',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 20,
          background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 12,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)', overflow: 'hidden',
        }}>
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px',
                background: 'transparent', border: 'none', borderBottom: '1px solid #F7F7F5',
                color: '#1C1C1A', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {s.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
