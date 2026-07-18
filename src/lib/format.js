// Sri Lankan Rupee formatting, used everywhere a monetary value is shown.
export function formatLKR(amount) {
  const n = Number(amount ?? 0)
  return 'Rs ' + n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
