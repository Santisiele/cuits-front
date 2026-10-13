import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { ResearchService } from "@/services/api"
import type { RecentWebResearch, ResearchBudget, WebResearch } from "@/types"

export const researchKeys = {
  history: (taxId: string) => ["research", "history", taxId] as const,
  recent: () => ["research", "recent"] as const,
  budget: () => ["research", "budget"] as const,
  allHistories: () => ["research", "history"] as const,
  archived: () => ["research", "archived"] as const,
}

function refreshResearchLists(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: researchKeys.allHistories() })
  void queryClient.invalidateQueries({ queryKey: researchKeys.recent() })
  void queryClient.invalidateQueries({ queryKey: researchKeys.archived() })
}

export function useArchiveResearch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ResearchService.archive(id),
    onSuccess: () => refreshResearchLists(queryClient),
  })
}

export function useResearchHistory(taxId: string) {
  return useQuery<WebResearch[]>({
    queryKey: researchKeys.history(taxId),
    queryFn: () => ResearchService.history(taxId),
    enabled: !!taxId,
  })
}

export function useRunResearch(taxId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => ResearchService.run(taxId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: researchKeys.history(taxId) })
      void queryClient.invalidateQueries({ queryKey: researchKeys.recent() })
      void queryClient.invalidateQueries({ queryKey: researchKeys.budget() })
    },
  })
}

export function useResearchBudget() {
  return useQuery<ResearchBudget>({
    queryKey: researchKeys.budget(),
    queryFn: ResearchService.budget,
    staleTime: 0,
  })
}

export function useRecentResearch() {
  return useQuery<RecentWebResearch[]>({
    queryKey: researchKeys.recent(),
    queryFn: ResearchService.recent,
    staleTime: 0,
  })
}

export function useUpdateResearchLimit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (monthlyLimitUsd: number) => ResearchService.setLimit(monthlyLimitUsd),
    onSuccess: (budget) => queryClient.setQueryData(researchKeys.budget(), budget),
  })
}
