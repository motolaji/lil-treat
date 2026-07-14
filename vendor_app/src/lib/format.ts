// Points-like values (treats_value, stamps_current, reward cost) are stored
// as numeric/decimal in Postgres to support fractional points (e.g. 0.5),
// but whole-number values should still read as "9", not "9.00".
export function formatTreats(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
