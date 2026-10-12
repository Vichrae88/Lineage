// Coin presentation never changes the precise accounts held in a save.
export function gold(n, signed = false) {
  const whole = Math.round(Number(n));
  if (!Number.isFinite(whole)) return '—';
  return (
    (signed && whole > 0 ? '+' : '') +
    (whole === 0 ? 0 : whole).toLocaleString('en-US')
  );
}
export const moneyField = (field) =>
  /^(gold|wealth|income|profit|capital|upkeep|wages|balance|cost|amount)$/.test(
    field,
  );
