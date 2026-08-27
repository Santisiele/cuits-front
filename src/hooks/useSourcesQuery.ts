import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { GraphService } from "@/services/api"
import type { SourceInfo, SourceCategory } from "@/types"

/**
 * Fetches the list of sources from the backend.
 *
 * Sources change only when someone runs an admin operation, so a long
 * staleTime is safe — every mutation invalidates this key explicitly.
 * Consumed by SourcesTable, FullBaseTable and EditNodeSourcesDialog.
 */
export function useSourcesQuery() {
  return useQuery<SourceInfo[]>({
    queryKey: ["sources"],
    queryFn: GraphService.getSources,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Source name to category, for tables that group nodes by category.
 *
 * Returns an empty map while loading or on error. Callers decide what an
 * unknown source means: falling back to "known" keeps the UI usable, but it
 * also hides a genuinely missing source, so a caller that can tell the
 * difference should say so in the UI instead.
 */
export function useSourceCategoryMap(): Record<string, SourceCategory> {
  const { data } = useSourcesQuery()

  return useMemo(() => {
    if (!data) return {}
    return Object.fromEntries(data.map((source) => [source.name, source.category]))
  }, [data])
}
