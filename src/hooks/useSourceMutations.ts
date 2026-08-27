import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"
import { GraphService } from "@/services/api"
import { queryKeys } from "@/hooks/useGraphQueries"
import type { OperationSummary } from "@/types"

// ─── Cache invalidation ───────────────────────────────────────────────────────

/**
 * Invalidates every cached list a source operation can change.
 *
 * Renaming, merging or deleting a source rewrites the `sources` array of the
 * affected nodes and can flip their isKnown/isToKnow flags, so every node list
 * is potentially stale — not just the source list. The birthdays key is
 * parameterised by date range, so it is matched by prefix rather than by an
 * exact key.
 */
function invalidateAllSourceRelated(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ["sources"] })
  void queryClient.invalidateQueries({ queryKey: queryKeys.myBase() })
  void queryClient.invalidateQueries({ queryKey: queryKeys.toKnow() })
  void queryClient.invalidateQueries({ queryKey: queryKeys.fullBase() })
  void queryClient.invalidateQueries({ queryKey: ["companyNodes"] })
  void queryClient.invalidateQueries({ queryKey: ["birthdays"] })
  void queryClient.invalidateQueries({ queryKey: ["node"] })
}

/**
 * A dry run reports what would happen without touching anything, so its result
 * must never invalidate the cache.
 */
function invalidateUnlessDryRun(queryClient: QueryClient, summary: OperationSummary): void {
  if (!summary.dryRun) invalidateAllSourceRelated(queryClient)
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Renames a source. `password` is ignored by the backend on a dry run. */
export function useRenameSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      currentName: string
      newName: string
      password: string | null
      dryRun: boolean
    }) =>
      GraphService.renameSource(
        params.currentName,
        params.newName,
        params.password,
        params.dryRun
      ),
    onSuccess: (summary) => invalidateUnlessDryRun(queryClient, summary),
  })
}

/** Merges one source into another. Both must share a category. */
export function useMergeSources() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      sourceToKeep: string
      sourceToDrop: string
      password: string | null
      dryRun: boolean
    }) =>
      GraphService.mergeSources(
        params.sourceToKeep,
        params.sourceToDrop,
        params.password,
        params.dryRun
      ),
    onSuccess: (summary) => invalidateUnlessDryRun(queryClient, summary),
  })
}

/** Deletes a source, along with any node left without one. */
export function useDeleteSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { name: string; password: string | null; dryRun: boolean }) =>
      GraphService.deleteSource(params.name, params.password, params.dryRun),
    onSuccess: (summary) => invalidateUnlessDryRun(queryClient, summary),
  })
}

/** Adds a source to one node, or moves that node between two sources. */
export function useChangeNodeSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: {
      taxId: string
      sourceName: string
      mode: "add" | "move"
      fromSource: string | null
      password: string | null
      dryRun: boolean
    }) =>
      GraphService.changeNodeSource(
        params.taxId,
        params.sourceName,
        params.mode,
        params.fromSource,
        params.password,
        params.dryRun
      ),
    onSuccess: (summary) => invalidateUnlessDryRun(queryClient, summary),
  })
}
