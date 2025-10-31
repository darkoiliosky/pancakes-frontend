export function moneyFormat(value: number | string | null | undefined, _currency?: string) {
  const n = typeof value === "number" ? value : Number(value || 0);
  if (!Number.isFinite(n)) return `MKD 0`;
  const fixed = n.toFixed(2).replace(/\.00$/, "");
  return `MKD ${fixed}`;
}
