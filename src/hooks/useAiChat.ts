import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AiChatApiService } from "@/services/api"
import { POLL_MS, runningMessage, withMessage } from "@/lib/aiChat"
import { researchKeys } from "@/hooks/useResearch"
import type { AiChat, AiChatMessage, AiChatWithMessages } from "@/types"

export const aiChatKeys = {
  list: () => ["aiChat", "list"] as const,
  chat: (chatId: string) => ["aiChat", "chat", chatId] as const,
  message: (messageId: string) => ["aiChat", "message", messageId] as const,
}

export function useAiChats() {
  return useQuery<AiChat[]>({ queryKey: aiChatKeys.list(), queryFn: AiChatApiService.list, staleTime: 0 })
}

export function useAiChat(chatId: string | undefined) {
  const queryClient = useQueryClient()
  const chat = useQuery<AiChatWithMessages>({
    queryKey: aiChatKeys.chat(chatId ?? ""),
    queryFn: () => AiChatApiService.open(chatId ?? ""),
    enabled: !!chatId,
  })
  const running = chat.data ? runningMessage(chat.data.messages) : undefined

  const poll = useQuery<AiChatMessage>({
    queryKey: aiChatKeys.message(running?.id ?? ""),
    queryFn: () => AiChatApiService.message(running?.id ?? ""),
    enabled: !!running,
    refetchInterval: (query) => (query.state.data && query.state.data.status !== "running" ? false : POLL_MS),
    refetchIntervalInBackground: true,
  })

  const finished = poll.data && poll.data.status !== "running" ? poll.data : undefined
  useEffect(() => {
    if (!finished || !chatId) return
    queryClient.setQueryData<AiChatWithMessages>(aiChatKeys.chat(chatId), (current) =>
      current ? withMessage(current, finished) : current
    )
    void queryClient.invalidateQueries({ queryKey: researchKeys.budget() })
  }, [finished, chatId, queryClient])

  return { ...chat, running: !!running }
}

function useChatMutation<Variables>(send: (variables: Variables) => Promise<AiChatWithMessages>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: send,
    onSuccess: (data) => {
      queryClient.setQueryData(aiChatKeys.chat(data.chat.id), data)
      void queryClient.invalidateQueries({ queryKey: aiChatKeys.list() })
    },
  })
}

export function useStartAiChat() {
  return useChatMutation((question: string) => AiChatApiService.start(question))
}

export function useAskAiChat(chatId: string) {
  return useChatMutation((question: string) => AiChatApiService.ask(chatId, question))
}

export function useArchiveAiChat() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (chatId: string) => AiChatApiService.archive(chatId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: aiChatKeys.list() }),
  })
}
