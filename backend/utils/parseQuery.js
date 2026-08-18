// backend/utils/parseQuery.js
// Coerce numeric query params before passing to services.
// Express query strings are always strings — Prisma requires Int for skip/take.
export const parseQuery = (q = {}) => ({
  ...q,
  ...(q.page  !== undefined && { page:  parseInt(q.page,  10) || 1  }),
  ...(q.limit !== undefined && { limit: parseInt(q.limit, 10) || 20 }),
});
