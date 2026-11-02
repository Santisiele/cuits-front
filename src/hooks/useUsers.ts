import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { UsersService } from "@/services/api"
import type { AppUser } from "@/types"

export const userKeys = {
  all: () => ["users"] as const,
}

export function useUsersQuery() {
  return useQuery<AppUser[]>({
    queryKey: userKeys.all(),
    queryFn: UsersService.list,
  })
}

export function useUserMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: userKeys.all() })

  const create = useMutation({
    mutationFn: ({ username, password, role }: { username: string; password: string; role: string }) =>
      UsersService.create(username, password, role),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ username, changes }: { username: string; changes: { role?: string; disabled?: boolean; color?: string | null } }) =>
      UsersService.update(username, changes),
    onSuccess: invalidate,
  })

  const resetPassword = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      UsersService.resetPassword(username, password),
  })

  return { create, update, resetPassword }
}
