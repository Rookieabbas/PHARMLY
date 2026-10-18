import { api } from "./api";

let memoryCache = null;
let lastFetched = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches real medicines from MongoDB backend and caches them in memory.
 */
export async function getMedicines(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && memoryCache && now - lastFetched < CACHE_TTL_MS) {
    return memoryCache;
  }

  try {
    const data = await api.get("/medicines");
    if (Array.isArray(data)) {
      memoryCache = data;
      lastFetched = now;
      return memoryCache;
    }
  } catch (error) {
    console.error("Failed to fetch medicines for voice cache:", error);
    // Return stale cache if available
    if (memoryCache) return memoryCache;
  }

  return memoryCache || [];
}

/**
 * Returns currently cached medicines synchronously without network request.
 */
export function getLoadedMedicines() {
  return memoryCache || [];
}

/**
 * Invalidates cache so the next call to getMedicines will pull latest MongoDB data.
 */
export function invalidateMedicineCache() {
  memoryCache = null;
  lastFetched = 0;
}
