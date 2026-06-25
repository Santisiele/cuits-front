import { QueryClient } from "@tanstack/react-query"

// ─── TTL config ───────────────────────────────────────────────────────────────

/**
 * Cache TTL in milliseconds, read from VITE_CACHE_TTL_MS.
 * Defaults to 5 minutes if not set.
 */
const CACHE_TTL_MS = Number(import.meta.env.VITE_CACHE_TTL_MS ?? 300_000)

// ─── Shared QueryClient ───────────────────────────────────────────────────────

/**
 * Singleton QueryClient shared across the app.
 * Exported so it can be used to imperatively clear the cache on logout,
 * and consumed by the QueryProvider that wraps the React tree.
 *
 * Lives in its own file (separated from QueryProvider) so Vite's fast
 * refresh keeps working — the `react-refresh/only-export-components` rule
 * requires component files to export only components.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /** Data is considered fresh for CACHE_TTL_MS — no refetch during this window. */
      staleTime: CACHE_TTL_MS,
      /** Keep unused data in cache for CACHE_TTL_MS after the component unmounts. */
      gcTime: CACHE_TTL_MS,
      /** Don't retry on failure — API errors should surface immediately. */
      retry: false,
      /** Don't refetch when the window regains focus. */
      refetchOnWindowFocus: false,
    },
  },
})