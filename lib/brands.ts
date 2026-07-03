// Curated list of common UK loyalty/membership card brands, shown as color-coded
// tiles in the Add Card brand picker. No logo assets — colors are derived from the
// name so any custom brand a user types gets a consistent-looking tile too.

export const CURATED_BRANDS: string[] = [
  'Tesco Clubcard',
  'Boots Advantage Card',
  'Nectar',
  "Sainsbury's Nectar",
  'Costa Coffee Club',
  'Co-op Membership',
  'Waterstones Plus',
  'Superdrug Beauty Card',
  'WHSmith Rewards',
  'Greggs Rewards',
  'Morrisons More Card',
  'M&S Sparks',
  'IKEA Family',
];

function hashHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

export function brandColor(name: string): string {
  return `hsl(${hashHue(name)}, 62%, 42%)`;
}

export function brandTileColor(name: string): string {
  return `hsl(${hashHue(name)}, 70%, 94%)`;
}
