export function formatCurrency(amount: number, _currency?: string) {
  const n = Number(amount || 0);
  const fixed = n.toFixed(2).replace(/\.00$/, "");
  return `MKD ${fixed}`;
}

export default formatCurrency;
