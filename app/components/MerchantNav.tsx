'use client';
import { usePathname } from 'next/navigation';

const tabs = [
  { path: '/merchant',            label: 'QR Code',   icon: QRIcon },
  { path: '/merchant/scan',       label: 'Scan',      icon: ScanIcon },
  { path: '/merchant/today',      label: 'Today',     icon: ChartIcon },
  { path: '/merchant/inventory',  label: 'Inventory', icon: InventoryIcon },
];

export default function MerchantNav() {
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

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="12" width="4" height="8" rx="1.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} />
      <rect x="9" y="7" width="4" height="13" rx="1.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} />
      <rect x="15" y="3" width="4" height="17" rx="1.5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.5} />
    </svg>
  );
}

function InventoryIcon({ active }: { active: boolean }) {
  const w = active ? 2 : 1.5;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M2 6.5L11 2l9 4.5-9 4.5-9-4.5z" stroke="currentColor" strokeWidth={w} strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={0.1} />
      <path d="M2 6.5V15l9 4.5 9-4.5V6.5" stroke="currentColor" strokeWidth={w} strokeLinejoin="round" />
      <path d="M11 11v8.5" stroke="currentColor" strokeWidth={w} />
    </svg>
  );
}
