'use client';

import { useEffect, useRef, useState } from 'react';

interface ReceiptScannerProps {
  onCapture: (imageBase64: string) => void;
  onCancel: () => void;
}

type CameraState = 'requesting' | 'active' | 'denied' | 'not-found' | 'error';

export default function ReceiptScanner({ onCapture, onCancel }: ReceiptScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<CameraState>('requesting');

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('error');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraState('active');
      } catch (err) {
        if (cancelled) return;
        const e = err as Error;
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setCameraState('denied');
        } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
          setCameraState('not-found');
        } else {
          setCameraState('error');
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onCapture(base64);
  }

  if (cameraState === 'denied') {
    return (
      <div style={errorBox}>
        <p style={errorTitle}>Camera access denied</p>
        <p style={errorBody}>Allow camera access in your browser settings, then refresh.</p>
        <button onClick={onCancel} style={cancelBtn}>Go back</button>
      </div>
    );
  }
  if (cameraState === 'not-found') {
    return (
      <div style={errorBox}>
        <p style={errorTitle}>No camera found</p>
        <p style={errorBody}>No camera was detected on this device.</p>
        <button onClick={onCancel} style={cancelBtn}>Go back</button>
      </div>
    );
  }
  if (cameraState === 'error') {
    return (
      <div style={errorBox}>
        <p style={errorTitle}>Camera unavailable</p>
        <p style={errorBody}>Camera requires HTTPS. Open the app via a secure URL.</p>
        <button onClick={onCancel} style={cancelBtn}>Go back</button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 16, overflow: 'hidden', background: '#000', aspectRatio: '3/4' }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Receipt corner guides */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: '10% 8%', border: '2px solid rgba(255,255,255,0.25)', borderRadius: 8 }} />
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => {
          const isTop = corner.includes('top');
          const isLeft = corner.includes('left');
          return (
            <div key={corner} style={{
              position: 'absolute',
              top: isTop ? '10%' : undefined,
              bottom: !isTop ? '10%' : undefined,
              left: isLeft ? '8%' : undefined,
              right: !isLeft ? '8%' : undefined,
              width: 20, height: 20,
              borderTop: isTop ? '3px solid #13B96D' : undefined,
              borderBottom: !isTop ? '3px solid #13B96D' : undefined,
              borderLeft: isLeft ? '3px solid #13B96D' : undefined,
              borderRight: !isLeft ? '3px solid #13B96D' : undefined,
              borderTopLeftRadius: corner === 'top-left' ? 4 : undefined,
              borderTopRightRadius: corner === 'top-right' ? 4 : undefined,
              borderBottomLeftRadius: corner === 'bottom-left' ? 4 : undefined,
              borderBottomRightRadius: corner === 'bottom-right' ? 4 : undefined,
            }} />
          );
        })}
        <p style={{ position: 'absolute', top: 'calc(10% - 28px)', left: '8%', color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>
          Frame the receipt
        </p>
      </div>

      {cameraState === 'requesting' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1C1C1A' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Starting camera…</p>
        </div>
      )}

      {/* Controls */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '20px 20px 24px',
        background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
      }}>
        <button onClick={onCancel} style={{
          background: 'rgba(255,255,255,0.15)', color: '#FFFFFF', border: 'none',
          borderRadius: 9999, padding: '10px 20px', fontSize: 14,
          cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation',
        }}>
          Cancel
        </button>
        <button
          onClick={capture}
          disabled={cameraState !== 'active'}
          style={{
            width: 64, height: 64, borderRadius: '50%',
            background: cameraState === 'active' ? '#13B96D' : 'rgba(255,255,255,0.3)',
            border: '3px solid rgba(255,255,255,0.8)',
            cursor: cameraState === 'active' ? 'pointer' : 'default',
            touchAction: 'manipulation', flexShrink: 0,
          }}
        />
        <div style={{ width: 80 }} />
      </div>
    </div>
  );
}

const errorBox: React.CSSProperties = {
  background: '#FFFFFF', border: '1px solid #EBEBE8', borderRadius: 16,
  padding: '28px 20px', textAlign: 'center', display: 'flex',
  flexDirection: 'column', gap: 8, alignItems: 'center',
};
const errorTitle: React.CSSProperties = { color: '#1C1C1A', fontWeight: 600, fontSize: 16, margin: 0 };
const errorBody: React.CSSProperties = { color: '#AEADA7', fontSize: 14, margin: 0, lineHeight: 1.5 };
const cancelBtn: React.CSSProperties = {
  marginTop: 8, background: '#F7F7F5', color: '#1C1C1A', border: '1px solid #EBEBE8',
  borderRadius: 9999, padding: '10px 24px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
};
