import { useEffect, useState } from 'react';

const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

interface LogoUploadProps {
  onFileSelected: (file: File | null) => void;
  disabled?: boolean;
  /** An already-saved logo to show before the user picks a new file (e.g. Settings editing an existing business). */
  currentUrl?: string | null;
  /** Fired only when the user removes `currentUrl` itself (not a freshly-picked file) — lets the caller distinguish "no change" from "clear the saved logo". */
  onRemoveExisting?: () => void;
}

export default function LogoUpload({ onFileSelected, disabled, currentUrl = null, onRemoveExisting }: LogoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingCleared, setExistingCleared] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showingExisting = !previewUrl && !existingCleared && !!currentUrl;
  const displayUrl = previewUrl ?? (showingExisting ? currentUrl : null);

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
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      onFileSelected(null);
    } else if (showingExisting) {
      setExistingCleared(true);
      onRemoveExisting?.();
    }
    setError(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {displayUrl && (
          <img
            src={displayUrl}
            alt="Logo preview"
            style={{
              width: 48, height: 48, borderRadius: 12, objectFit: 'cover',
              border: '1px solid #EBEBE8', flexShrink: 0,
            }}
          />
        )}
        <label style={{
          flex: 1, textAlign: 'center', padding: '14px', borderRadius: 14, boxSizing: 'border-box',
          background: '#FFFFFF', border: '1px solid #EBEBE8',
          color: '#1C1C1A', fontSize: 15, fontWeight: 500,
          cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.6 : 1,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}>
          {displayUrl ? 'Change logo' : 'Upload logo (optional)'}
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            disabled={disabled}
            style={{ display: 'none' }}
          />
        </label>
        {displayUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            style={{
              background: 'transparent', border: 'none', color: '#AEADA7',
              fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            }}
          >
            Remove
          </button>
        )}
      </div>
      {error && (
        <p style={{ color: '#DC2626', fontSize: 12, margin: '6px 0 0' }}>{error}</p>
      )}
    </div>
  );
}
