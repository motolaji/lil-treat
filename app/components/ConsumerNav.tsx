'use client';
import { usePathname } from 'next/navigation';

const tabs = [
  { path: '/',      label: 'Wallet', icon: WalletIcon },
  { path: '/cards', label: 'Cards',  icon: CardsIcon },
  { path: '/scan',  label: 'Scan',   icon: ScanIcon },
  { path: '/myqr',  label: 'My QR',  icon: QRIcon },
  { path: '/list',  label: 'Lists',  icon: ListIcon },
];

export default function ConsumerNav() {
  const pathname = usePathname();
  return (
    <nav style={{
      flexShrink: 0,
      background: '#FFFFFF',
      borderTop: '1px solid #EBEBE8',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(({ path, label, icon: Icon }) => {
        const active = pathname === path;
        return (
          <button
            key={path}
            onClick={() => { window.location.href = path; }}
            style={{
              flex: 1, padding: '10px 0 12px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, background: 'transparent', border: 'none',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              color: active ? '#13B96D' : '#AEADA7',
              transition: 'color 0.15s',
            }}
          >
            <Icon active={active} />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: '0.01em' }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function WalletIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="6" width="18" height="13" rx="3" stroke="currentColor" strokeWidth={active ? 2 : 1.5} fill={active ? 'currentColor' : 'none'} fillOpacity={0.1} />
      <path d="M2 10h18" stroke="currentColor" strokeWidth={active ? 2 : 1.5} />
      <rect x="14" y="13" width="4" height="2.5" rx="1.25" fill="currentColor" />
      <path d="M6 3h10" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
    </svg>
  );
}

function CardsIcon({ active }: { active: boolean }) {
  const w = active ? 2 : 1.5;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="5" width="18" height="13" rx="2.5" stroke="currentColor" strokeWidth={w} fill={active ? 'currentColor' : 'none'} fillOpacity={0.1} />
      <path d="M2 9h18" stroke="currentColor" strokeWidth={w} />
      <rect x="4.5" y="12.5" width="5" height="2.5" rx="1" fill="currentColor" />
    </svg>
  );
}

function ScanIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M2 8V4.5A2.5 2.5 0 014.5 2H8" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      <path d="M14 2h3.5A2.5 2.5 0 0120 4.5V8" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      <path d="M20 14v3.5A2.5 2.5 0 0117.5 20H14" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      <path d="M8 20H4.5A2.5 2.5 0 012 17.5V14" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" />
      <path d="M6 11h10" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" />
    </svg>
  );
}

function ListIcon({ active }: { active: boolean }) {
  const w = active ? 2 : 1.5;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M8 6h10M8 11h10M8 16h6" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
      <circle cx="4.5" cy="6" r="1.5" fill="currentColor" />
      <circle cx="4.5" cy="11" r="1.5" fill="currentColor" />
      <circle cx="4.5" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

function QRIcon({ active }: { active: boolean }) {
  const w = active ? 2 : 1.5;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={w} />
      <rect x="4" y="4" width="3" height="3" fill="currentColor" rx="0.5" />
      <rect x="13" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={w} />
      <rect x="15" y="4" width="3" height="3" fill="currentColor" rx="0.5" />
      <rect x="2" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={w} />
      <rect x="4" y="15" width="3" height="3" fill="currentColor" rx="0.5" />
      <path d="M13 13h2v2h-2zM17 13h2v2h-2zM13 17h2v2h-2zM17 17h2v2h-2z" fill="currentColor" />
    </svg>
  );
}
