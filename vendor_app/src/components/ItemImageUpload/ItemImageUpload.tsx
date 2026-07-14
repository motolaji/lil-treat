import { useEffect, useState } from 'react';
import { color, radius } from '../../styles/tokens';

const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

interface ItemImageUploadProps {
  onFileSelected: (file: File | null) => void;
  disabled?: boolean;
}

export default function ItemImageUpload({ onFileSelected, disabled }: ItemImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      onFileSelected(null);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image is too large — please choose one under 3MB.');
      onFileSelected(null);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    onFileSelected(file);
  }

  function handleRemove() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    onFileSelected(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Item preview"
            style={{ width: 44, height: 44, borderRadius: radius.sm, objectFit: 'cover', border: `1px solid ${color.border}`, flexShrink: 0 }}
          />
        )}
        <label
          style={{
            flex: 1, textAlign: 'center', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: radius.md, boxSizing: 'border-box',
            background: color.card, border: `1px solid ${color.border}`,
            color: color.text, fontSize: 14, fontWeight: 500,
            cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1,
          }}
        >
          {previewUrl ? 'Change photo' : 'Add photo (optional)'}
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            disabled={disabled}
            style={{ display: 'none' }}
          />
        </label>
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            style={{ background: 'transparent', border: 'none', color: color.muted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
          >
            Remove
          </button>
        )}
      </div>
      {error && (
        <p style={{ color: color.error, fontSize: 12, margin: '6px 0 0' }}>{error}</p>
      )}
    </div>
  );
}
