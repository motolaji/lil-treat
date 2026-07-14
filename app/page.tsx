import Image from 'next/image';
import styles from './landing.module.css';

const color = {
  bg: '#F7F7F5',
  card: '#FFFFFF',
  border: '#EBEBE8',
  text: '#1C1C1A',
  muted: '#6B6B65',
  accent: '#13B96D',
  accentBg: '#DCFCE7',
} as const;

const font = {
  heading: "'Syne', sans-serif",
} as const;

const customerAppUrl = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ?? '#';
const vendorAppUrl = process.env.NEXT_PUBLIC_VENDOR_APP_URL ?? '#';

const steps = [
  { label: 'Shop', copy: 'Buy from any LilTreat vendor near you, just like normal.' },
  { label: 'Scan', copy: 'Scan a QR code at checkout to collect treats on the spot.' },
  { label: 'Redeem', copy: 'Cash in treats for free items and rewards at that vendor.' },
];

export default function LandingPage() {
  return (
    <main style={{ minHeight: '100%', background: color.bg }}>
      <header style={{
        maxWidth: 1040, margin: '0 auto', padding: '28px 24px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: font.heading, fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: color.text }}>
          LilTreat
        </span>
      </header>

      <section style={{
        maxWidth: 720, margin: '0 auto', padding: '48px 24px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>
        <Image
          src="/brand/liltreat-mascot.png"
          alt="LilTreat mascot"
          width={168}
          height={114}
          priority
          style={{ height: 'auto', marginBottom: 24 }}
        />

        <h1 style={{
          fontFamily: font.heading, fontWeight: 800, fontSize: 'clamp(28px, 5vw, 44px)',
          lineHeight: 1.1, letterSpacing: '-0.02em', color: color.text, margin: '0 0 16px',
        }}>
          Loyalty treats for local shops
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.5, color: color.muted, maxWidth: 520, margin: '0 0 32px' }}>
          Skip the punch cards. Every purchase earns real treats, redeemable right where you shop &mdash; no app to remember, just scan and go.
        </p>

        <div className={styles.ctaRow}>
          <a
            href={customerAppUrl}
            className={styles.ctaPrimary}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 52, padding: '0 28px', borderRadius: 999,
              background: color.accent, color: '#FFFFFF', fontWeight: 700, fontSize: 15,
            }}
          >
            I&apos;m a customer
          </a>
          <a
            href={vendorAppUrl}
            className={styles.ctaSecondary}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 52, padding: '0 28px', borderRadius: 999,
              background: color.card, color: color.text, fontWeight: 700, fontSize: 15,
              border: `1.5px solid ${color.border}`,
            }}
          >
            I&apos;m a merchant
          </a>
        </div>
      </section>

      <section style={{ maxWidth: 900, margin: '0 auto', padding: '8px 24px 72px' }}>
        <div className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <div
              key={step.label}
              style={{
                background: color.card, border: `1px solid ${color.border}`, borderRadius: 20,
                padding: '24px 22px', textAlign: 'left',
              }}
            >
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30, borderRadius: '50%', background: color.accentBg,
                color: color.accent, fontWeight: 700, fontSize: 14, marginBottom: 14,
              }}>
                {index + 1}
              </span>
              <p style={{ fontFamily: font.heading, fontWeight: 700, fontSize: 16, color: color.text, margin: '0 0 6px' }}>
                {step.label}
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: color.muted, margin: 0 }}>
                {step.copy}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ padding: '0 24px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: color.muted, margin: 0 }}>&copy; {new Date().getFullYear()} LilTreat</p>
      </footer>
    </main>
  );
}
