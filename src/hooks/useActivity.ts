import { useInfiniteQuery } from "@tanstack/react-query"
import { ActivityService } from "@/services/api"
import { activityCursor, type ActivityCursor } from "@/lib/activity"
import type { ActivityPage } from "@/types"

export function useActivity(filters: { username: string; event: string }) {
  return useInfiniteQuery<ActivityPage, Error, { pages: ActivityPage[] }, readonly unknown[], ActivityCursor | undefined>({
    queryKey: ["activity", filters],
    queryFn: ({ pageParam }) => ActivityService.read({ ...filters, ...pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (last, pages) => (last.hasMore ? activityCursor(pages.flatMap((page) => page.entries)) : undefined),
    staleTime: 0,
  })
}
