import { useQuery } from "@tanstack/react-query"
import { BirthdayProgressService } from "@/services/api"
import type { BirthdayProgress } from "@/types"

export function useBirthdayProgress() {
  return useQuery<BirthdayProgress>({
    queryKey: ["birthdays", "progress"],
    queryFn: BirthdayProgressService.get,
    staleTime: 0,
  })
}
