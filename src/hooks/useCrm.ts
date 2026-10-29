import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CrmApiService } from "@/services/api"
import type {
  CrmActionInput,
  CrmAgendaItem,
  CrmChange,
  CrmCompany,
  CrmCompanyDetail,
  CrmCompanyInput,
  CrmSource,
  CrmResponsible,
  CrmContactInput,
  CrmTaskInput,
  CrmUser,
  NosisPendingQueue,
} from "@/types"

export const crmKeys = {
  all: () => ["crm"] as const,
  companies: () => ["crm", "companies"] as const,
  company: (taxId: string) => ["crm", "company", taxId] as const,
  agenda: (assignee: string) => ["crm", "agenda", assignee] as const,
  users: () => ["crm", "users"] as const,
  changes: (entityType: string, entityId: string) => ["crm", "changes", entityType, entityId] as const,
  nosisPending: () => ["crm", "nosis-pending"] as const,
  sources: () => ["crm", "sources"] as const,
  responsibles: () => ["crm", "responsibles"] as const,
}

export function useCrmCompanies() {
  return useQuery<CrmCompany[]>({ queryKey: crmKeys.companies(), queryFn: CrmApiService.companies, staleTime: 0 })
}

export function useCrmCompany(taxId: string) {
  return useQuery<CrmCompanyDetail>({
    queryKey: crmKeys.company(taxId),
    queryFn: () => CrmApiService.company(taxId),
    enabled: !!taxId,
    staleTime: 0,
  })
}

export function useCrmAgenda(assignee: string) {
  return useQuery<CrmAgendaItem[]>({
    queryKey: crmKeys.agenda(assignee),
    queryFn: () => CrmApiService.agenda(assignee),
    staleTime: 0,
  })
}

export function useCrmUsers() {
  return useQuery<CrmUser[]>({ queryKey: crmKeys.users(), queryFn: CrmApiService.users })
}

export function useCrmChanges(entityType: string, entityId: string, enabled: boolean) {
  return useQuery<CrmChange[]>({
    queryKey: crmKeys.changes(entityType, entityId),
    queryFn: () => CrmApiService.changes(entityType, entityId),
    enabled,
    staleTime: 0,
  })
}

export function useCrmResponsibles() {
  return useQuery<CrmResponsible[]>({ queryKey: crmKeys.responsibles(), queryFn: CrmApiService.responsibles })
}

export function useResponsibleMutations() {
  const queryClient = useQueryClient()
  const refresh = () => void queryClient.invalidateQueries({ queryKey: crmKeys.all() })
  return {
    create: useMutation({
      mutationFn: (input: { name: string; color: string; users: string[] }) => CrmApiService.createResponsible(input),
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ name, input }: { name: string; input: Partial<CrmResponsible> }) => CrmApiService.updateResponsible(name, input),
      onSuccess: refresh,
    }),
  }
}

export function useCrmSources() {
  return useQuery<CrmSource[]>({ queryKey: crmKeys.sources(), queryFn: CrmApiService.sources })
}

export function useNosisPending() {
  return useQuery<NosisPendingQueue>({ queryKey: crmKeys.nosisPending(), queryFn: CrmApiService.nosisPending, staleTime: 0 })
}

export function useCrmMutations() {
  const queryClient = useQueryClient()
  const refresh = () => void queryClient.invalidateQueries({ queryKey: crmKeys.all() })

  return {
    addCompany: useMutation({ mutationFn: (input: CrmCompanyInput) => CrmApiService.addCompany(input), onSuccess: refresh }),
    updateCompany: useMutation({
      mutationFn: ({ taxId, input }: { taxId: string; input: CrmCompanyInput }) => CrmApiService.updateCompany(taxId, input),
      onSuccess: refresh,
    }),
    closeCompany: useMutation({
      mutationFn: ({ taxId, reason }: { taxId: string; reason: string }) => CrmApiService.closeCompany(taxId, reason),
      onSuccess: refresh,
    }),
    reopenCompany: useMutation({ mutationFn: (taxId: string) => CrmApiService.reopenCompany(taxId), onSuccess: refresh }),
    removeCompany: useMutation({
      mutationFn: ({ taxId, dryRun }: { taxId: string; dryRun: boolean }) => CrmApiService.removeCompany(taxId, dryRun),
      onSuccess: (_result, { dryRun }) => {
        if (!dryRun) refresh()
      },
    }),
    createContact: useMutation({ mutationFn: (input: CrmContactInput) => CrmApiService.createContact(input), onSuccess: refresh }),
    updateContact: useMutation({
      mutationFn: ({ id, input }: { id: string; input: CrmContactInput }) => CrmApiService.updateContact(id, input),
      onSuccess: refresh,
    }),
    archiveContact: useMutation({ mutationFn: (id: string) => CrmApiService.archiveContact(id), onSuccess: refresh }),
    recordAction: useMutation({ mutationFn: (input: CrmActionInput) => CrmApiService.recordAction(input), onSuccess: refresh }),
    archiveAction: useMutation({ mutationFn: (id: string) => CrmApiService.archiveAction(id), onSuccess: refresh }),
    createTask: useMutation({ mutationFn: (input: CrmTaskInput) => CrmApiService.createTask(input), onSuccess: refresh }),
    updateTask: useMutation({
      mutationFn: ({ id, input }: { id: string; input: CrmTaskInput }) => CrmApiService.updateTask(id, input),
      onSuccess: refresh,
    }),
  }
}
