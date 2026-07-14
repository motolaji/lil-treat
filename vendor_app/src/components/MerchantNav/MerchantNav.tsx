import { useLocation, useNavigate } from 'react-router-dom';
import './MerchantNav.css';
import { supabase } from '../../lib/supabase';
import { color } from '../../styles/tokens';

const tabs = [
  { path: '/',           label: 'POS',       icon: PosIcon },
  { path: '/scan',       label: 'Redeem',    icon: ScanIcon },
  { path: '/my-qr',      label: 'QR Code',   icon: QRIcon },
  { path: '/activity',   label: 'Activity',  icon: ChartIcon },
  { path: '/inventory',  label: 'Inventory', icon: InventoryIcon },
  { path: '/rewards',    label: 'Rewards',   icon: RewardIcon },
  { path: '/promos',     label: 'Promos',    icon: PromosIcon },
  { path: '/settings',   label: 'Settings',  icon: SettingsIcon },
];

export default function MerchantNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="merchant-nav">
      <span className="merchant-nav__wordmark">LilTreat</span>
      {tabs.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            className="merchant-nav__item"
            onClick={() => navigate(path)}
            style={{ color: active ? color.accent : color.muted }}
          >
            <Icon active={active} />
            <span className="merchant-nav__label" style={{ fontWeight: active ? 600 : 400, letterSpacing: '0.01em' }}>{label}</span>
          </button>
        );
      })}
      <button
        className="merchant-nav__item merchant-nav__signout"
        onClick={() => supabase.auth.signOut()}
        style={{ color: color.muted }}
      >
        <SignOutIcon />
        <span className="merchant-nav__label" style={{ letterSpacing: '0.01em' }}>Sign out</span>
      </button>
    </nav>
  );
}

function SignOutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M8 2H5.5A2.5 2.5 0 003 4.5v13A2.5 2.5 0 005.5 20H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 15l5-4-5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 11H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

function PosIcon({ active }: { active: boolean }) {
  const w = active ? 2 : 1.5;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 4h16l-1.5 9.5a2 2 0 01-2 1.7H6.5a2 2 0 01-2-1.7L3 4z" stroke="currentColor" strokeWidth={w} strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={0.1} />
      <path d="M2 4h2M7 8h8M7 11.5h5" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
      <circle cx="8.5" cy="18.5" r="1.4" fill="currentColor" />
      <circle cx="14.5" cy="18.5" r="1.4" fill="currentColor" />
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

function RewardIcon({ active }: { active: boolean }) {
  const w = active ? 2 : 1.5;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="2" y="8" width="18" height="5" rx="1" stroke="currentColor" strokeWidth={w} fill={active ? 'currentColor' : 'none'} fillOpacity={0.1} />
      <path d="M3.5 13h15v5.5a1.5 1.5 0 01-1.5 1.5H5a1.5 1.5 0 01-1.5-1.5V13z" stroke="currentColor" strokeWidth={w} strokeLinejoin="round" />
      <path d="M11 8v12" stroke="currentColor" strokeWidth={w} />
      <path d="M11 8C11 8 7.5 8 6.5 6.2C5.7 4.8 6.8 3 8.4 3C10 3 11 5 11 8z" stroke="currentColor" strokeWidth={w} strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={0.1} />
      <path d="M11 8C11 8 14.5 8 15.5 6.2C16.3 4.8 15.2 3 13.6 3C12 3 11 5 11 8z" stroke="currentColor" strokeWidth={w} strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={0.1} />
    </svg>
  );
}

function PromosIcon({ active }: { active: boolean }) {
  const w = active ? 2 : 1.5;
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 9v4a1.5 1.5 0 001.5 1.5H6l4 4V3.5L6 7.5H4.5A1.5 1.5 0 003 9z" stroke="currentColor" strokeWidth={w} strokeLinejoin="round" fill={active ? 'currentColor' : 'none'} fillOpacity={0.1} />
      <path d="M15 8a3 3 0 010 6" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
      <path d="M17 5.5a6.5 6.5 0 010 11" stroke="currentColor" strokeWidth={w} strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  const w = active ? 2 : 1.5;
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth={w} fill={active ? 'currentColor' : 'none'} fillOpacity={0.15} />
      <path
        d="M10 2v2M10 16v2M18 10h-2M4 10H2M15.66 4.34l-1.42 1.42M5.76 14.24l-1.42 1.42M15.66 15.66l-1.42-1.42M5.76 5.76L4.34 4.34"
        stroke="currentColor"
        strokeWidth={w}
        strokeLinecap="round"
      />
    </svg>
  );
}
