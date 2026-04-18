'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface QRScannerProps {
  onResult: (text: string) => void;
  onError?: (error: Error) => void;
  active: boolean;
}

type CameraState = 'idle' | 'requesting' | 'active' | 'denied' | 'not-found' | 'error';

export default function QRScanner({ onResult, onError, active }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const startingRef = useRef(false);
  const [cameraState, setCameraState] = useState<CameraState>('idle');

  function stopScanner() {
    startingRef.current = false;
    controlsRef.current?.stop();
    controlsRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState('idle');
  }

  useEffect(() => {
    if (!active) {
      stopScanner();
      return;
    }

    if (startingRef.current || controlsRef.current) return;

    let cancelled = false;
    startingRef.current = true;

    async function startScanner() {
      if (!videoRef.current) return;
      setCameraState('requesting');

      try {
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current,
          (result, error) => {
            if (cancelled) return;
            if (result) {
              onResult(result.getText());
            }
            if (error && error.name !== 'NotFoundException' && error.name !== 'AbortError') {
              onError?.(error as Error);
            }
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        startingRef.current = false;
        setCameraState('active');
      } catch (err) {
        startingRef.current = false;
        if (cancelled) return;
        const error = err as Error;
        if (error.name === 'AbortError') return;
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraState('denied');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setCameraState('not-found');
        } else {
          setCameraState('error');
        }
        onError?.(error);
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (cameraState === 'denied') {
    return (
      <div style={overlayStyle}>
        <div style={iconStyle}>🚫</div>
        <p style={titleStyle}>Camera access denied</p>
        <p style={bodyStyle}>
          Camera access is needed to scan stamps. Please allow camera access in your browser settings and refresh.
        </p>
      </div>
    );
  }

  if (cameraState === 'not-found') {
    return (
      <div style={overlayStyle}>
        <div style={iconStyle}>📷</div>
        <p style={titleStyle}>No camera found</p>
        <p style={bodyStyle}>No camera was detected on this device.</p>
      </div>
    );
  }

  if (cameraState === 'error') {
    return (
      <div style={overlayStyle}>
        <div style={iconStyle}>⚠️</div>
        <p style={titleStyle}>Camera error</p>
        <p style={bodyStyle}>Something went wrong starting the camera. Try refreshing.</p>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '1',
      background: '#000', borderRadius: 16, overflow: 'hidden',
    }}>
      <video
        ref={videoRef}
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {/* Scan guide */}
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <div style={{
          width: '60%', aspectRatio: '1',
          border: '2px solid #6ee7b7', borderRadius: 12,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
        }} />
      </div>
      {cameraState === 'requesting' && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', background: '#0a0a0f',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Starting camera…</p>
        </div>
      )}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  gap: 12, padding: 32, textAlign: 'center',
  background: '#14141c', borderRadius: 16, minHeight: 240,
};
const iconStyle: React.CSSProperties = { fontSize: 40 };
const titleStyle: React.CSSProperties = { color: '#f0ede8', fontSize: 18, fontWeight: 600, margin: 0 };
const bodyStyle: React.CSSProperties = { color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0, lineHeight: 1.5 };
