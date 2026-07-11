'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRScanner from '../components/QRScanner';
import ReceiptScanner from '../components/ReceiptScanner';
import ConsumerNav from '../components/ConsumerNav';
import {
  getOrCreateUser, getOrCreateCard, issueStamp, saveShoppingList, getMerchantRewards,
  supabase, LoyaltyCard, UserRow, Reward,
} from '../../lib/supabase';
import { processReceipt, generateShoppingList } from '../../lib/receipt';
import { cheapestActiveCost } from '../../lib/rewards';
import { getDeferredInstallPrompt, clearDeferredInstallPrompt } from '../../lib/pwaInstall';

interface QRPayload {
  type: 'merchant' | 'consumer';
  merchant_id?: string;
}

type ScanMode = 'stamps' | 'receipt';
type ReceiptState = 'idle' | 'capturing' | 'ocr' | 'ai' | 'saving' | 'done';
type NudgeStep = 'none' | 'login' | 'pwa';

export default function ScanPage() {
  const router = useRouter();
  const [scanMode, setScanMode] = useState<ScanMode>('stamps');
  const [user, setUser] = useState<UserRow | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [stampState, setStampState] = useState<'idle' | 'scanning' | 'success' | 'reward'>('idle');
  const [stampedCard, setStampedCard] = useState<LoyaltyCard | null>(null);
  const [newStampCount, setNewStampCount] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [flashVisible, setFlashVisible] = useState(false);
  const [receiptState, setReceiptState] = useState<ReceiptState>('idle');
  const [receiptStatusMsg, setReceiptStatusMsg] = useState('');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [nudgeStep, setNudgeStep] = useState<NudgeStep>('none');
  const [pwaKind, setPwaKind] = useState<'android' | 'ios' | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'receipt') setScanMode('receipt');
    getOrCreateUser().then((u) => { if (u) setUser(u); });
  }, []);

  // Reset camera when switching scan modes
  function switchMode(mode: ScanMode) {
    setScanMode(mode);
    setCameraStarted(false);
    setScanError(null);
    setReceiptState('idle');
  }

  async function handleScanResult(text: string) {
    if (stampState !== 'idle') return;
    setScanError(null);

    let payload: QRPayload;
    try {
      payload = JSON.parse(text);
    } catch {
      setScanError('Unrecognised QR code. Point at a Stackpot merchant QR.');
      return;
    }

    if (payload.type !== 'merchant' || !payload.merchant_id) {
      setScanError("Not a merchant QR. Point at the QR on the merchant's screen.");
      return;
    }
    if (!user) {
      setScanError('Still loading your account. Try again in a moment.');
      return;
    }

    setStampState('scanning');

    const card = await getOrCreateCard(user.id, payload.merchant_id);
    if (!card) {
      setScanError('Could not connect to server. Check your connection.');
      setStampState('idle');
      return;
    }

    const result = await issueStamp(card.id, card.stamps_current, payload.merchant_id, user.id);
    if (result === null) {
      setScanError('Failed to record treat. Try again.');
      setStampState('idle');
      return;
    }

    const merchantRewards = await getMerchantRewards(payload.merchant_id, true);
    setRewards(merchantRewards);

    const updatedCard: LoyaltyCard = { ...card, stamps_current: result.newCount };
    setStampedCard(updatedCard);
    setNewStampCount(result.newCount);

    setFlashVisible(true);
    setTimeout(() => setFlashVisible(false), 150);

    setTimeout(() => {
      const target = cheapestActiveCost(merchantRewards, card.merchants?.stamp_target ?? 9);
      const isReward = result.newCount >= target;
      setStampState(isReward ? 'reward' : 'success');
      if (!isReward) {
        dismissTimer.current = setTimeout(() => proceedAfterEarn(), 2500);
      }
    }, 150);
  }

  async function proceedAfterEarn() {
    if (!localStorage.getItem('stackpot_login_nudge_seen_at')) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.is_anonymous) {
        setNudgeStep('login');
        return;
      }
    }
    showPwaNudgeOrHome();
  }

  function showPwaNudgeOrHome() {
    if (localStorage.getItem('stackpot_pwa_nudge_seen_at')) {
      router.push('/');
      return;
    }

    const standalone = typeof window !== 'undefined'
      && window.matchMedia('(display-mode: standalone)').matches;
    if (standalone) {
      router.push('/');
      return;
    }

    const ua = navigator.userAgent;
    const isIOSSafari = /iP(hone|od|ad)/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);

    if (getDeferredInstallPrompt()) {
      setPwaKind('android');
      setNudgeStep('pwa');
    } else if (isIOSSafari) {
      setPwaKind('ios');
      setNudgeStep('pwa');
    } else {
      // No real install path on this device/browser — skip without burning the
      // one-time flag, so it's still offered later on a device that can act on it.
      router.push('/');
    }
  }

  function dismissLoginNudge() {
    localStorage.setItem('stackpot_login_nudge_seen_at', new Date().toISOString());
    setNudgeStep('none');
    showPwaNudgeOrHome();
  }

  function dismissPwaNudge() {
    localStorage.setItem('stackpot_pwa_nudge_seen_at', new Date().toISOString());
    setNudgeStep('none');
    router.push('/');
  }

  async function handleInstallPwa() {
    const prompt = getDeferredInstallPrompt();
    if (!prompt) return;
    await prompt.prompt();
    clearDeferredInstallPrompt();
    dismissPwaNudge();
  }

  function dismiss() {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    proceedAfterEarn();
  }

  async function handleReceiptCapture(imageBase64: string) {
    if (!user) return;
    setReceiptState('ocr');
    setReceiptStatusMsg('Reading receipt…');

    const receipt = await processReceipt(imageBase64);

    setReceiptState('ai');
    setReceiptStatusMsg('Building your list…');

    const items = await generateShoppingList(receipt);

    setReceiptState('saving');
    const label = `${receipt.merchant} · ${receipt.date}`;
    await saveShoppingList(user.id, label, items);

    setReceiptState('done');
    setTimeout(() => router.push('/list'), 800);
  }

  const scanActive = cameraStarted && stampState === 'idle';

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#F7F7F5' }}>
      {flashVisible && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 100, pointerEvents: 'none' }} />
      )}

      {(stampState === 'success' || stampState === 'reward') && stampedCard && nudgeStep === 'none' && (
        <SuccessOverlay
          card={stampedCard}
          newCount={newStampCount}
          isReward={stampState === 'reward'}
          rewards={rewards}
          onDismiss={dismiss}
        />
      )}

      {nudgeStep === 'login' && (
        <LoginNudgeOverlay onSkip={dismissLoginNudge} onLogin={() => router.push('/account')} />
      )}

      {nudgeStep === 'pwa' && (
        <PwaNudgeOverlay kind={pwaKind} onSkip={dismissPwaNudge} onInstall={handleInstallPwa} />
      )}

      <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}>
        <div style={{ paddingTop: 'env(safe-area-inset-top)', marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 14px', color: '#1C1C1A', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em' }}>Scan</h1>

          {/* Segmented control */}
          <div style={{
            display: 'flex', background: '#EBEBE8', borderRadius: 12, padding: 3, gap: 2,
          }}>
            {(['stamps', 'receipt'] as ScanMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => switchMode(mode)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 9, border: 'none',
                  background: scanMode === mode ? '#FFFFFF' : 'transparent',
                  color: scanMode === mode ? '#1C1C1A' : '#AEADA7',
                  fontWeight: scanMode === mode ? 600 : 400,
                  fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                  touchAction: 'manipulation',
                  boxShadow: scanMode === mode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {mode === 'stamps' ? 'Earn treats' : 'Scan receipt'}
              </button>
            ))}
          </div>
        </div>

        {scanMode === 'stamps' ? (
          <>
            <p style={{ color: '#AEADA7', fontSize: 14, margin: '0 0 16px' }}>
              Point at the merchant's QR code to earn a treat
            </p>

            {!cameraStarted ? (
              <button
                onClick={() => setCameraStarted(true)}
                style={{
                  width: '100%', padding: '20px', borderRadius: 16,
                  background: '#13B96D', color: '#FFFFFF',
                  fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  fontFamily: 'inherit',
                }}
              >
                Start camera
              </button>
            ) : (
              <QRScanner active={scanActive} onResult={handleScanResult} onError={(e) => setScanError(e.message)} />
            )}

            {scanError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', marginTop: 16 }}>
                <p style={{ color: '#DC2626', fontSize: 14, margin: 0 }}>{scanError}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {receiptState === 'idle' && (
              <>
                <p style={{ color: '#AEADA7', fontSize: 14, margin: '0 0 16px' }}>
                  Frame your receipt and tap the capture button
                </p>
                <ReceiptScanner
                  onCapture={handleReceiptCapture}
                  onCancel={() => switchMode('stamps')}
                />
              </>
            )}

            {(receiptState === 'ocr' || receiptState === 'ai' || receiptState === 'saving') && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 16, paddingTop: 80, textAlign: 'center',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, background: '#DCFCE7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                }}>🧾</div>
                <p style={{ color: '#1C1C1A', fontSize: 17, fontWeight: 600, margin: 0, fontFamily: "'Syne', sans-serif" }}>
                  {receiptStatusMsg}
                </p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#13B96D',
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            {receiptState === 'done' && (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 12, paddingTop: 80, textAlign: 'center',
              }}>
                <div style={{ fontSize: 48 }}>✅</div>
                <p style={{ color: '#1C1C1A', fontSize: 17, fontWeight: 600, margin: 0, fontFamily: "'Syne', sans-serif" }}>
                  List saved!
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <ConsumerNav />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function SuccessOverlay({
  card, newCount, isReward, rewards, onDismiss,
}: {
  card: LoyaltyCard;
  newCount: number;
  isReward: boolean;
  rewards: Reward[];
  onDismiss: () => void;
}) {
  const target = cheapestActiveCost(rewards, card.merchants?.stamp_target ?? 9);
  const toGo = Math.max(0, target - newCount);
  const rewardLabel = rewards.find((r) => r.active && r.cost === target)?.label ?? card.merchants?.reward_label ?? 'Reward';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(28,28,26,0.5)', backdropFilter: 'blur(6px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px',
      }}
      onClick={isReward ? undefined : onDismiss}
    >
      {/* Stamp drop animation */}
      {!isReward && (
        <div style={{ marginBottom: 32, animation: 'stampDrop 500ms cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: '#13B96D',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(19,185,109,0.4)',
          }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M10 24l10 10 18-18" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      )}

      {isReward && (
        <div style={{ marginBottom: 28, animation: 'rewardPop 600ms cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
          <div style={{
            width: 110, height: 110, borderRadius: 28,
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(217,119,6,0.45)',
            fontSize: 52,
          }}>
            🎉
          </div>
        </div>
      )}

      {/* Stamp grid — shows progress */}
      <div
        style={{
          background: '#FFFFFF', borderRadius: 24, padding: 24,
          width: '100%', maxWidth: 380,
          boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          animation: 'slideUp 350ms 150ms cubic-bezier(0.34,1.2,0.64,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1A', margin: '0 0 4px', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em', textAlign: 'center' }}>
          {isReward ? 'Reward unlocked!' : 'Treat earned!'}
        </p>
        <p style={{ color: '#AEADA7', fontSize: 14, margin: '0 0 20px', textAlign: 'center' }}>
          {card.merchants?.name}
        </p>

        {/* Stamp grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(34px, 1fr))',
          gap: 7, marginBottom: 20,
        }}>
          {Array.from({ length: target }).map((_, i) => {
            const filled = i < newCount;
            const isNew = i === newCount - 1;
            return (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: '50%',
                background: filled ? (isReward ? '#FEF3C7' : '#DCFCE7') : '#F7F7F5',
                border: `1.5px solid ${filled ? (isReward ? '#FCD34D' : '#13B96D') : '#EBEBE8'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: isNew ? 'newStamp 400ms 400ms cubic-bezier(0.34,1.56,0.64,1) both' : undefined,
                transform: isNew ? 'scale(0)' : undefined,
              }}>
                {filled && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3 3L11.5 4" stroke={isReward ? '#D97706' : '#13B96D'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>

        {isReward ? (
          <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '14px 18px', marginBottom: 16, textAlign: 'center', border: '1px solid #FCD34D' }}>
            <p style={{ color: '#D97706', fontWeight: 600, margin: 0, fontSize: 15 }}>{rewardLabel}</p>
            <p style={{ color: '#AEADA7', fontSize: 13, margin: '4px 0 0' }}>Tap your card in the wallet to redeem</p>
          </div>
        ) : (
          <p style={{ color: '#AEADA7', fontSize: 13, textAlign: 'center', margin: '0 0 16px' }}>
            {newCount} of {target} · {toGo} more to go
          </p>
        )}

        <button onClick={onDismiss} style={{
          width: '100%', padding: '14px', borderRadius: 14,
          background: isReward ? '#D97706' : '#13B96D',
          color: '#FFFFFF', fontWeight: 600, fontSize: 16,
          border: 'none', cursor: 'pointer', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
        }}>
          {isReward ? 'Got it' : 'Done'}
        </button>
      </div>

      <style>{`
        @keyframes stampDrop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes rewardPop {
          0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes newStamp {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function NudgeShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(28,28,26,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px',
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: 24, padding: 24,
        width: '100%', maxWidth: 380, boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
        animation: 'slideUp 350ms cubic-bezier(0.34,1.2,0.64,1) both',
      }}>
        {children}
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function LoginNudgeOverlay({ onSkip, onLogin }: { onSkip: () => void; onLogin: () => void }) {
  return (
    <NudgeShell>
      <p style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1A', margin: '0 0 10px', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em', textAlign: 'center' }}>
        Avoid losing treats
      </p>
      <p style={{ color: '#AEADA7', fontSize: 14, margin: '0 0 20px', textAlign: 'center', lineHeight: 1.5 }}>
        By default we store your collected treats directly in your browser. Your phone can clear those at any
        time — save an email and password so your treats are never lost.
      </p>
      <button onClick={onLogin} style={{
        width: '100%', padding: '14px', borderRadius: 14, background: '#13B96D', color: '#FFFFFF',
        fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer', touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit', marginBottom: 10,
      }}>
        Save my account
      </button>
      <button onClick={onSkip} style={{
        width: '100%', padding: '14px', borderRadius: 14, background: 'transparent', color: '#AEADA7',
        fontWeight: 500, fontSize: 14, border: 'none', cursor: 'pointer', touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
      }}>
        Maybe later
      </button>
    </NudgeShell>
  );
}

function PwaNudgeOverlay({ kind, onSkip, onInstall }: {
  kind: 'android' | 'ios' | null;
  onSkip: () => void;
  onInstall: () => void;
}) {
  return (
    <NudgeShell>
      <p style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1A', margin: '0 0 10px', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.02em', textAlign: 'center' }}>
        Add Stackpot to your home screen
      </p>
      {kind === 'ios' ? (
        <p style={{ color: '#AEADA7', fontSize: 14, margin: '0 0 20px', textAlign: 'center', lineHeight: 1.5 }}>
          Tap the Share icon <span style={{ fontWeight: 700 }}>􀈂</span> in Safari, then choose
          <span style={{ fontWeight: 700 }}> &quot;Add to Home Screen&quot;</span> so you can get back here in one tap.
        </p>
      ) : (
        <p style={{ color: '#AEADA7', fontSize: 14, margin: '0 0 20px', textAlign: 'center', lineHeight: 1.5 }}>
          Install Stackpot for quicker access to your treats — no app store needed.
        </p>
      )}
      {kind === 'android' && (
        <button onClick={onInstall} style={{
          width: '100%', padding: '14px', borderRadius: 14, background: '#13B96D', color: '#FFFFFF',
          fontWeight: 600, fontSize: 16, border: 'none', cursor: 'pointer', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit', marginBottom: 10,
        }}>
          Add to Home Screen
        </button>
      )}
      <button onClick={onSkip} style={{
        width: '100%', padding: '14px', borderRadius: 14,
        background: kind === 'android' ? 'transparent' : '#13B96D',
        color: kind === 'android' ? '#AEADA7' : '#FFFFFF',
        fontWeight: kind === 'android' ? 500 : 600, fontSize: kind === 'android' ? 14 : 16,
        border: 'none', cursor: 'pointer', touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
      }}>
        {kind === 'android' ? 'Skip for now' : 'Done'}
      </button>
    </NudgeShell>
  );
}
