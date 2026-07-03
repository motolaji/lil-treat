import { brandColor } from './brands';

const STORAGE_KEY = 'stackpot_saved_cards';

export interface SavedCard {
  id: string;
  name: string;
  brand: string;
  color: string;
  barcode: string;
  barcodeFormat?: string;
  captureMethod: 'camera' | 'nfc';
}

// Old, pre-Cards-tab shape — kept only to detect and migrate legacy entries.
interface LegacySavedCard {
  id: string;
  name: string;
  barcode: string;
}

function isLegacy(card: Partial<SavedCard> & LegacySavedCard): card is LegacySavedCard {
  return !card.brand;
}

function readRaw(): (SavedCard | LegacySavedCard)[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function write(cards: SavedCard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function getSavedCards(): SavedCard[] {
  const raw = readRaw();
  let migrated = false;

  const cards = raw.map((card): SavedCard => {
    if (isLegacy(card)) {
      migrated = true;
      return {
        id: card.id,
        name: card.name,
        brand: card.name,
        color: brandColor(card.name),
        barcode: card.barcode,
        captureMethod: 'camera',
      };
    }
    return card;
  });

  if (migrated) write(cards);
  return cards;
}

export function addSavedCard(card: Omit<SavedCard, 'id'>): SavedCard {
  const newCard: SavedCard = { ...card, id: crypto.randomUUID() };
  write([...getSavedCards(), newCard]);
  return newCard;
}

export function deleteSavedCard(id: string): void {
  write(getSavedCards().filter((c) => c.id !== id));
}
