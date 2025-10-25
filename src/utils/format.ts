export function moneyFormat(value: number | string | null | undefined, currency = "$") {
  const n = typeof value === "number" ? value : Number(value || 0);
  if (!Number.isFinite(n)) return `${currency}0.00`;
  return `${currency}${n.toFixed(2)}`;
}

