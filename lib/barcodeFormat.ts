// Maps zxing's BarcodeFormat enum names (e.g. "EAN_13") to the format strings
// react-barcode/jsbarcode expects. Anything not in this map (QR_CODE, DATA_MATRIX,
// AZTEC, PDF_417, MAXICODE, RSS_*, UPC_EAN_EXTENSION) returns null — the signal
// to fall back to rendering a QR code instead.

const JSBARCODE_FORMAT_MAP: Record<string, string> = {
  CODE_128: 'CODE128',
  CODE_39: 'CODE39',
  CODE_93: 'CODE93',
  EAN_13: 'EAN13',
  EAN_8: 'EAN8',
  UPC_A: 'UPC',
  UPC_E: 'UPCE',
  ITF: 'ITF',
  CODABAR: 'codabar',
};

export function toJsBarcodeFormat(zxingFormat?: string): string | null {
  if (!zxingFormat) return null;
  return JSBARCODE_FORMAT_MAP[zxingFormat] ?? null;
}
