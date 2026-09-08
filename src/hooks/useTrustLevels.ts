import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { GraphService } from "@/services/api"
import { NO_LEVEL_LABEL, NO_LEVEL_VALUE, paletteFor } from "@/lib/trustLevels"
import type { TrustLevelInfo } from "@/types"

export const trustLevelKeys = {
  all: () => ["trustLevels"] as const,
}

export function useTrustLevelsQuery() {
  return useQuery<TrustLevelInfo[]>({
    queryKey: trustLevelKeys.all(),
    queryFn: GraphService.getTrustLevels,
    staleTime: 5 * 60 * 1000,
  })
}

export interface TrustLevelLookup {
  levels: TrustLevelInfo[]
  labelFor: (value: number | undefined) => string
  badgeClassFor: (value: number | undefined) => string | null
  rowClassFor: (value: number | undefined) => string
}

export function useTrustLevels(): TrustLevelLookup {
  const { data } = useTrustLevelsQuery()

  return useMemo(() => {
    const levels = data ?? []
    const byValue = new Map(levels.map((level) => [level.value, level]))

    const resolve = (value: number | undefined) =>
      value === undefined || value === NO_LEVEL_VALUE ? undefined : byValue.get(value)

    return {
      levels,
      labelFor: (value) => {
        if (value === undefined || value === NO_LEVEL_VALUE) return NO_LEVEL_LABEL
        return resolve(value)?.label ?? `Nivel ${value}`
      },
      badgeClassFor: (value) => {
        if (value === undefined || value === NO_LEVEL_VALUE) return null
        return paletteFor(resolve(value)?.color).badge
      },
      rowClassFor: (value) => {
        const level = resolve(value)
        return level ? paletteFor(level.color).row : ""
      },
    }
  }, [data])
}

function useInvalidateTrustLevels() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: trustLevelKeys.all() })
    void queryClient.invalidateQueries({ queryKey: ["myBase"] })
    void queryClient.invalidateQueries({ queryKey: ["toKnow"] })
    void queryClient.invalidateQueries({ queryKey: ["fullBase"] })
    void queryClient.invalidateQueries({ queryKey: ["crossing"] })
    void queryClient.invalidateQueries({ queryKey: ["companyNodes"] })
    void queryClient.invalidateQueries({ queryKey: ["birthdays"] })
    void queryClient.invalidateQueries({ queryKey: ["node"] })
  }
}

export function useTrustLevelMutations() {
  const invalidate = useInvalidateTrustLevels()

  const onSettled = (dryRun: boolean) => {
    if (!dryRun) invalidate()
  }

  const create = useMutation({
    mutationFn: (vars: Parameters<typeof GraphService.createTrustLevel>) =>
      GraphService.createTrustLevel(...vars),
    onSuccess: (summary) => onSettled(summary.dryRun),
  })

  const update = useMutation({
    mutationFn: (vars: Parameters<typeof GraphService.updateTrustLevel>) =>
      GraphService.updateTrustLevel(...vars),
    onSuccess: (summary) => onSettled(summary.dryRun),
  })

  const remove = useMutation({
    mutationFn: (vars: Parameters<typeof GraphService.deleteTrustLevel>) =>
      GraphService.deleteTrustLevel(...vars),
    onSuccess: (summary) => onSettled(summary.dryRun),
  })

  return { create, update, remove }
}
