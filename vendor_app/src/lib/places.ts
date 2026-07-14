// Thin wrapper around Places API (New) — Autocomplete + Place Details.
// Requires VITE_GOOGLE_MAPS_API_KEY (Google Cloud project with "Places API (New)"
// enabled + billing on file). If autocomplete ever proves unreliable over CORS
// with a real key, fall back to a plain Geocoding API call on submit instead of
// live-as-you-type suggestions — not implemented here, just flagging the seam.

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface PlaceSuggestion {
  placeId: string;
  description: string;
}

export interface ResolvedPlace {
  formattedAddress: string;
  lat: number;
  lng: number;
}

export async function autocompleteAddress(input: string): Promise<PlaceSuggestion[]> {
  if (!input.trim() || !KEY) return [];

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': KEY,
    },
    body: JSON.stringify({ input }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suggestions = (data.suggestions ?? []) as any[];

  return suggestions
    .filter((s) => s.placePrediction)
    .map((s) => ({
      placeId: s.placePrediction.placeId as string,
      description: s.placePrediction.text?.text as string,
    }));
}

// Fallback for when the merchant types an address but never clicks an
// autocomplete suggestion (so onResolved never fires) — resolve the typed
// text's top match on blur/submit instead of leaving lat/lng null.
export async function geocodeAddress(input: string): Promise<ResolvedPlace | null> {
  const suggestions = await autocompleteAddress(input);
  const top = suggestions[0];
  if (!top) return null;
  return resolvePlace(top.placeId);
}

export async function resolvePlace(placeId: string): Promise<ResolvedPlace | null> {
  if (!placeId || !KEY) return null;

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': KEY,
      'X-Goog-FieldMask': 'formattedAddress,location',
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (!data.location) return null;

  return {
    formattedAddress: data.formattedAddress,
    lat: data.location.latitude,
    lng: data.location.longitude,
  };
}
