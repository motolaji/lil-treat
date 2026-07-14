const CUSTOMER_APP_URL = import.meta.env.VITE_CUSTOMER_APP_URL ?? '';

export function vendorLandingUrl(merchantId: string): string {
  return `${CUSTOMER_APP_URL}/vendor/${merchantId}`;
}
