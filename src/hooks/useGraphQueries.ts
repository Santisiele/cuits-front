import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { GraphService } from "@/services/api"

// ─── Query keys ───────────────────────────────────────────────────────────────

/**
 * Centralised query key factory.
 * Using structured keys makes targeted cache invalidation easy.
 */
export const queryKeys = {
  myBase: () => ["myBase"] as const,
  cuitSearch: (taxId: string, maxDepth: number) => ["cuitSearch", taxId, maxDepth] as const,
  pathSearch: (from: string, to: string, maxDepth: number) => ["pathSearch", from, to, maxDepth] as const,
  node: (taxId: string) => ["node", taxId] as const,
  nodeRelationships: (taxId: string, maxDepth: number) => ["nodeRelationships", taxId, maxDepth] as const,
}

// ─── My base ─────────────────────────────────────────────────────────────────

/**
 * Fetches and caches all nodes in "my base".
 * Cache is shared — navigating away and back won't re-fetch within the TTL.
 */
export function useMyBaseNodes() {
  return useQuery({
    queryKey: queryKeys.myBase(),
    queryFn: () => GraphService.getMyBaseNodes(),
  })
}

// ─── CUIT search ─────────────────────────────────────────────────────────────

/**
 * Searches for a CUIT in the graph.
 * Results are cached per (taxId, maxDepth) combination.
 * Only runs when `enabled` is true (i.e. when the user submits a search).
 */
export function useCuitSearch(taxId: string, maxDepth: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.cuitSearch(taxId, maxDepth),
    queryFn: () => GraphService.searchCuit(taxId, maxDepth),
    enabled: enabled && !!taxId,
  })
}

// ─── Path search ─────────────────────────────────────────────────────────────

/**
 * Finds the shortest path between two CUITs.
 * Results are cached per (from, to, maxDepth) combination.
 */
export function usePathSearch(from: string, to: string, maxDepth: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.pathSearch(from, to, maxDepth),
    queryFn: () => GraphService.findPath(from, to, maxDepth),
    enabled: enabled && !!from && !!to,
  })
}

// ─── Node detail ─────────────────────────────────────────────────────────────

/**
 * Fetches full node detail by Tax ID.
 * Cached per taxId — hovering tooltips and edit views share the same cache entry.
 */
export function useNode(taxId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.node(taxId),
    queryFn: () => GraphService.getNode(taxId),
    enabled: enabled && !!taxId,
  })
}

// ─── Node relationships ───────────────────────────────────────────────────────

/**
 * Fetches all relationships of a node up to a given depth.
 * Cached per (taxId, maxDepth) combination.
 */
export function useNodeRelationships(taxId: string, maxDepth: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.nodeRelationships(taxId, maxDepth),
    queryFn: () => GraphService.getNodeRelationships(taxId, maxDepth),
    enabled: enabled && !!taxId,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Adds a relationship and invalidates the my-base cache.
 */
export function useAddRelationship() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fromTaxId, toTaxId, relationshipType }: {
      fromTaxId: string
      toTaxId: string
      relationshipType: number
    }) => GraphService.addRelationship(fromTaxId, toTaxId, relationshipType),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myBase() })
    },
  })
}

/**
 * Deletes a relationship and invalidates the my-base cache.
 */
export function useDeleteRelationship() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ fromTaxId, toTaxId, relationshipType }: {
      fromTaxId: string
      toTaxId: string
      relationshipType: number
    }) => GraphService.deleteRelationship(fromTaxId, toTaxId, relationshipType),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.myBase() })
    },
  })
}

/**
 * Updates a node and invalidates its cached detail.
 */
export function useUpdateNode(taxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fields: { phone?: string; email?: string; birthday?: string }) =>
      GraphService.updateNode(taxId, fields),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.node(taxId) })
    },
  })
}