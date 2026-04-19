// Simple in-memory cache with TTL for API responses
const cache = new Map()

export function clearCache(key) {
  if (key) cache.delete(key)
  else cache.clear()
}

export async function fetchWithCache(key, fetcher, ttl = 1000 * 60 * 2) {
  try {
    const now = Date.now()
    const entry = cache.get(key)
    if (entry && (now - entry.timestamp) < entry.ttl) {
      return entry.data
    }

    const data = await fetcher()
    cache.set(key, { data, timestamp: now, ttl })
    return data
  } catch (err) {
    // On failure, don't poison cache — rethrow so callers can handle
    throw err
  }
}

