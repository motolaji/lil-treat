'use client';

import { useState } from 'react';

interface NfcCaptureProps {
  onResult: (value: string) => void;
  onError?: (error: Error) => void;
}

type NfcState = 'idle' | 'scanning' | 'error';

export default function NfcCapture({ onResult, onError }: NfcCaptureProps) {
  const [state, setState] = useState<NfcState>('idle');

  // NDEFReader.scan() requires transient user activation, so it must be called
  // synchronously inside this button's own click handler — not via an `active`
  // prop consumed in a useEffect (that pattern loses the gesture context).
  async function startScan() {
    setState('scanning');
    try {
      const ndef = new NDEFReader();
      await ndef.scan();

      ndef.onreading = (event) => {
        const record = event.message.records.find(
          (r) => r.recordType === 'text' || r.recordType === 'url',
        );

        let value: string | undefined;
        if (record?.data) {
          try {
            value = new TextDecoder(record.encoding ?? 'utf-8').decode(record.data);
          } catch {
            value = undefined;
          }
        }
        value = value ?? event.serialNumber;

        if (value) onResult(value);
      };

      ndef.onreadingerror = () => {
        setState('error');
        onError?.(new Error("Couldn't read that tag. Try again, or scan the barcode instead."));
      };
    } catch (err) {
      setState('error');
      onError?.(err as Error);
    }
  }

  return (
    <button
      onClick={startScan}
      disabled={state === 'scanning'}
      style={{
        width: '100%', padding: '16px', borderRadius: 16, marginTop: 12,
        background: state === 'scanning' ? '#EBEBE8' : '#FFFFFF',
        border: '1.5px solid #13B96D', color: '#13B96D',
        fontSize: 15, fontWeight: 600, cursor: state === 'scanning' ? 'default' : 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
      }}
    >
      {state === 'scanning' ? 'Hold your card near the phone…' : '📶  Tap to save (NFC)'}
    </button>
  );
}
