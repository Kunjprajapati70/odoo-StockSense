export function roundQty(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return NaN;
  return Math.round(number * 1000) / 1000;
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
