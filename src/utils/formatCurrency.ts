export function formatCurrency(amount: number, currency?: string) {
  const n = Number(amount || 0);
  const num = n.toFixed(2);
  if (!currency) return num;
  return `${currency}${num}`;
}

export default formatCurrency;

