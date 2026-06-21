export function formatXrpAmount(drops: string | undefined): string {
  if (!drops) return "—"
  const xrp = parseInt(drops) / 1_000_000
  return `${xrp.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} XRP`
}

export function rippleEpochToDate(rippleDate: number): Date {
  const RIPPLE_EPOCH = 946684800
  return new Date((rippleDate + RIPPLE_EPOCH) * 1000)
}
