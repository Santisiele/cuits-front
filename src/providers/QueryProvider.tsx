import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { queryClient } from "@/lib/queryClient"

// ─── Provider ─────────────────────────────────────────────────────────────────

interface QueryProviderProps {
  children: ReactNode
}

/**
 * Wraps the app with the TanStack Query context.
 * Place this at the root level in main.tsx.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}