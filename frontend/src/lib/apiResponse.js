// ─────────────────────────────────────────────────────────────
//  API Response helpers
//  Handles all common shapes our backend returns:
//    { success, data: { key: [...], pagination: {} } }
//    { success, data: [...] }
//    { success, data: { key: {} } }
// ─────────────────────────────────────────────────────────────

/**
 * Extract an array from an API response.
 * Tries data[key], then data.data[key], then data itself if array.
 */
export const extractList = (response, key) => {
  const d = response?.data;
  if (!d) return [];
  // { data: { categories: [] } }
  if (Array.isArray(d[key]))       return d[key];
  // { data: { data: { categories: [] } } }
  if (Array.isArray(d.data?.[key])) return d.data[key];
  // { data: [] }
  if (Array.isArray(d))            return d;
  // { data: { data: [] } }
  if (Array.isArray(d.data))       return d.data;
  return [];
};

/**
 * Extract a single item from an API response.
 */
export const extractItem = (response, key) => {
  const d = response?.data;
  if (!d) return null;
  if (d[key] !== undefined)        return d[key];
  if (d.data?.[key] !== undefined) return d.data[key];
  if (d.data && typeof d.data === "object" && !Array.isArray(d.data)) return d.data;
  return d;
};

/**
 * Extract pagination from an API response.
 */
export const extractPagination = (response) => {
  const d = response?.data;
  if (!d) return {};
  return d.pagination ?? d.data?.pagination ?? {};
};