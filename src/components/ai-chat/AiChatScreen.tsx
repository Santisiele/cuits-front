import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Archive, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChatMessageView } from "@/components/ai-chat/ChatMessageView"
import { useAiChat, useAiChats, useArchiveAiChat, useAskAiChat, useStartAiChat } from "@/hooks/useAiChat"
import { QUESTION_MAX, questionError } from "@/lib/aiChat"
import { formatIsoDateTime } from "@/lib/dates"
import { getErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"

function ChatList({ selectedId, onNew }: { selectedId: string | undefined; onNew: () => void }) {
  const chats = useAiChats()
  const navigate = useNavigate()
  const list = chats.data ?? []

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" onClick={onNew} className="justify-start">
        <Plus className="size-4" /> Nueva conversación
      </Button>
      {chats.isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : chats.error ? (
        <p className="text-destructive text-sm">{getErrorMessage(chats.error)}</p>
      ) : list.length === 0 ? (
        <p className="text-muted-foreground text-sm">Todavía no hay conversaciones.</p>
      ) : (
        <ul className="flex flex-col max-h-48 md:max-h-[70dvh] overflow-y-auto">
          {list.map((chat) => (
            <li key={chat.id}>
              <button
                type="button"
                onClick={() => void navigate(`/ai-chat/${chat.id}`)}
                className={cn(
                  "w-full text-left px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors",
                  chat.id === selectedId && "bg-accent"
                )}
              >
                <span className="block truncate">{chat.title}</span>
                <span className="block text-xs text-muted-foreground">{formatIsoDateTime(chat.updatedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ArchiveChatDialog({ chatId, onClose }: { chatId: string; onClose: () => void }) {
  const archive = useArchiveAiChat()
  const navigate = useNavigate()
  const [error, setError] = useState("")

  async function handleArchive(): Promise<void> {
    setError("")
    try {
      await archive.mutateAsync(chatId)
      toast.success("Conversación archivada")
      onClose()
      void navigate("/ai-chat")
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>¿Archivar esta conversación?</DialogTitle>
          <DialogDescription>Deja de verse en la lista. Lo que gastó sigue contando en el mes.</DialogDescription>
        </DialogHeader>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={archive.isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => void handleArchive()} disabled={archive.isPending}>
            {archive.isPending ? "Archivando..." : "Archivar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Composer({ chatId, busy }: { chatId: string | undefined; busy: boolean }) {
  const start = useStartAiChat()
  const ask = useAskAiChat(chatId ?? "")
  const navigate = useNavigate()
  const [text, setText] = useState("")
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState("")

  const problem = questionError(text)
  const sending = start.isPending || ask.isPending

  async function send(): Promise<void> {
    setTouched(true)
    if (problem || busy || sending) return
    setError("")
    try {
      const question = text.trim()
      if (chatId) {
        await ask.mutateAsync(question)
      } else {
        const created = await start.mutateAsync(question)
        void navigate(`/ai-chat/${created.chat.id}`)
      }
      setText("")
      setTouched(false)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void send()
      }}
      className="space-y-2"
    >
      <Textarea
        aria-label="Pregunta"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            void send()
          }
        }}
        placeholder="Por ejemplo: ¿qué operadores de la Bolsa tienen relación con algún conocido?"
        disabled={busy}
        rows={3}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {text.trim().length}/{QUESTION_MAX} · Enter envía, Shift+Enter baja de línea
        </p>
        <Button type="submit" disabled={busy || sending || (touched && !!problem)}>
          {sending ? "Enviando..." : busy ? "Esperando respuesta..." : "Enviar"}
        </Button>
      </div>
      {touched && problem && <p className="text-destructive text-sm">{problem}</p>}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </form>
  )
}

function Conversation({ chatId }: { chatId: string }) {
  const chat = useAiChat(chatId)
  const [archiving, setArchiving] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const count = chat.data?.messages.length ?? 0
  const lastStatus = chat.data?.messages[count - 1]?.status

  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "end" })
  }, [count, lastStatus])

  if (chat.isLoading) return <p className="text-muted-foreground text-sm">Cargando...</p>
  if (chat.error || !chat.data) {
    return <p className="text-destructive text-sm">{getErrorMessage(chat.error, "No se pudo abrir la conversación")}</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold break-words">{chat.data.chat.title}</h2>
        <Button size="sm" variant="ghost" onClick={() => setArchiving(true)} aria-label="Archivar conversación">
          <Archive className="size-4" />
        </Button>
      </div>
      <div className="flex flex-col gap-5">
        {chat.data.messages.map((message) => (
          <ChatMessageView key={message.id} message={message} />
        ))}
      </div>
      <div ref={end} />
      <Composer chatId={chatId} busy={chat.running} />
      {archiving && <ArchiveChatDialog chatId={chatId} onClose={() => setArchiving(false)} />}
    </div>
  )
}

export function AiChatScreen() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asistente IA</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 grid-cols-[minmax(0,1fr)] md:grid-cols-[16rem_minmax(0,1fr)]">
        <ChatList selectedId={chatId} onNew={() => void navigate("/ai-chat")} />
        <div className="min-w-0">
          {chatId ? (
            <Conversation key={chatId} chatId={chatId} />
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Preguntá sobre tu base: armá listados, buscá relaciones entre conocidos y por conocer, o pedí que
                complete con información pública de la web. Cada respuesta descuenta de Créditos IA.
              </p>
              <Composer chatId={undefined} busy={false} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
