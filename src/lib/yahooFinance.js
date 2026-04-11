const EXCHANGE_SUFFIXES = ['', '.AS', '.DE', '.L', '.MI', '.PA', '.BR', '.SW', '.F']
const PROXIES = [
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  url => `https://thingproxy.freeboard.io/fetch/${url}`,
  url => url, // direct last (usually blocked but worth trying)
]

async function fetchUrl(url) {
  for (const proxy of PROXIES) {
    try {
      const res = await fetch(proxy(url), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const json = await res.json()
      if (json?.chart?.result?.[0]) return json
    } catch {}
  }
  return null
}

function extractPrice(json, targetTs = null) {
  const result = json?.chart?.result?.[0]
  if (!result) return null
  const name = result.meta?.longName ?? result.meta?.shortName ?? null

  // For historical queries, find the close price nearest to the target timestamp
  if (targetTs != null) {
    const timestamps = result.timestamp ?? []
    const closes     = result.indicators?.quote?.[0]?.close ?? []
    let bestIdx = -1, bestDiff = Infinity
    timestamps.forEach((ts, i) => {
      if (closes[i] == null) return
      const diff = Math.abs(ts - targetTs)
      if (diff < bestDiff) { bestDiff = diff; bestIdx = i }
    })
    if (bestIdx !== -1) return { price: closes[bestIdx], name }
  }

  // Live price fallback
  const price = result.meta?.regularMarketPrice
    ?? result.indicators?.quote?.[0]?.close?.findLast(v => v != null)
  return price != null ? { price, name } : null
}

async function tryTicker(ticker, params, targetTs = null) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?${params}`
  const json = await fetchUrl(url)
  if (!json) return null
  const extracted = extractPrice(json, targetTs)
  if (!extracted) return null
  return { resolvedTicker: ticker, ...extracted }
}

export async function fetchLivePrice(ticker) {
  const base = ticker.toUpperCase()
  const suffixes = base.includes('.') ? [''] : EXCHANGE_SUFFIXES
  for (const suffix of suffixes) {
    const result = await tryTicker(base + suffix, 'interval=1d&range=1d')
    if (result) return result
  }
  return null
}

export async function fetchHistoricalPrice(ticker, dateStr) {
  const base = ticker.toUpperCase()
  const d  = new Date(dateStr + 'T12:00:00Z')
  const targetTs = Math.floor(d.getTime() / 1000)
  const p1 = targetTs - 86400 * 4
  const p2 = targetTs + 86400 * 4
  const params = `interval=1d&period1=${p1}&period2=${p2}`
  const suffixes = base.includes('.') ? [''] : EXCHANGE_SUFFIXES
  for (const suffix of suffixes) {
    const result = await tryTicker(base + suffix, params, targetTs)
    if (result) return result
  }
  return null
}
