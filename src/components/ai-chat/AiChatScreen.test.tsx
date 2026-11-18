import { describe, it, expect, beforeEach, vi } from "vitest"
import { act } from "react"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@/tests/render"
import { apiError } from "@/tests/apiError"
import type { AiChat, AiChatMessage, AiChatWithMessages } from "@/types"

const api = {
  list: vi.fn(),
  open: vi.fn(),
  start: vi.fn(),
  ask: vi.fn(),
  message: vi.fn(),
  archive: vi.fn(),
}

vi.mock("@/services/api", () => ({
  AiChatApiService: {
    list: () => api.list(),
    open: (id: string) => api.open(id),
    start: (question: string) => api.start(question),
    ask: (id: string, question: string) => api.ask(id, question),
    message: (id: string) => api.message(id),
    archive: (id: string) => api.archive(id),
  },
}))

vi.mock("@/lib/aiChat", async (original) => ({ ...(await original<typeof import("@/lib/aiChat")>()), POLL_MS: 10 }))

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

const exportNodes = vi.fn()
vi.mock("@/lib/exportTable", () => ({ exportNodes: (...args: unknown[]) => exportNodes(...args) }))

const navigate = vi.fn()
const params: { chatId?: string } = {}
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate, useParams: () => params }))

const { AiChatScreen } = await import("@/components/ai-chat/AiChatScreen")
const { useStore } = await import("@/store/useStore")

const CHAT: AiChat = {
  id: "c1",
  title: "Operadores de bolsa conocidos",
  createdAt: "2026-11-18T12:00:00.000Z",
  updatedAt: "2026-11-18T12:05:00.000Z",
  archivedAt: null,
}

function message(overrides: Partial<AiChatMessage>): AiChatMessage {
  return {
    id: "m",
    chatId: "c1",
    role: "assistant",
    createdAt: "2026-11-18T12:00:00.000Z",
    text: "",
    status: "done",
    sources: [],
    tables: [],
    model: "claude-opus-5-5",
    costUsd: 0,
    webSearches: 0,
    ...overrides,
  }
}

const QUESTION = message({ id: "q1", role: "user", text: "¿Qué operadores de bolsa conozco?" })
const ANSWER = message({
  id: "a1",
  text: "Encontré **2** operadores.",
  costUsd: 0.4321,
  sources: [{ url: "https://boletin.gob.ar/1", title: "Boletín Oficial" }],
  tables: [
    {
      resultId: "r1",
      title: "Operadores",
      columns: ["cuit", "nombre", "fuentes"],
      rows: [
        ["30712345678", "ACME SA", ["Bolsa", "Poseidon"]],
        ["20111111112", "PEREZ JUAN", ["Bolsa"]],
      ],
      truncated: false,
    },
  ],
})

function conversation(...messages: AiChatMessage[]): AiChatWithMessages {
  return { chat: CHAT, messages }
}

async function show(chatId?: string): Promise<void> {
  if (chatId) params.chatId = chatId
  else delete params.chatId
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <AiChatScreen />
    </QueryClientProvider>
  )
  await act(async () => {})
}

describe("AiChatScreen", () => {
  beforeEach(() => {
    for (const fn of Object.values(api)) fn.mockReset()
    api.list.mockResolvedValue([CHAT])
    exportNodes.mockReset()
    navigate.mockReset()
  })

  it("lists the user's chats and opens one", async () => {
    await show()
    expect(await screen.findByText("Operadores de bolsa conocidos")).toBeInTheDocument()
    await userEvent.click(screen.getByText("Operadores de bolsa conocidos"))
    expect(navigate).toHaveBeenCalledWith("/ai-chat/c1")
  })

  it("starts a chat with the trimmed question and goes to it", async () => {
    api.start.mockResolvedValue(conversation(QUESTION, message({ id: "a1", status: "running" })))
    await show()
    await userEvent.type(screen.getByLabelText("Pregunta"), "  ¿Qué operadores de bolsa conozco?  ")
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }))
    expect(api.start).toHaveBeenCalledWith("¿Qué operadores de bolsa conozco?")
    expect(navigate).toHaveBeenCalledWith("/ai-chat/c1")
  })

  it("refuses an empty question without calling the API", async () => {
    await show()
    await userEvent.type(screen.getByLabelText("Pregunta"), "   {Enter}")
    expect(screen.getByText("Escribí una pregunta")).toBeInTheDocument()
    expect(api.start).not.toHaveBeenCalled()
  })

  it("shows the API refusal in Spanish", async () => {
    api.start.mockRejectedValue(apiError("Se alcanzó el tope de gasto del mes"))
    await show()
    await userEvent.type(screen.getByLabelText("Pregunta"), "hola{Enter}")
    expect(await screen.findByText("Se alcanzó el tope de gasto del mes")).toBeInTheDocument()
  })

  it("shows the answer with its table, sources and cost, and exports the table", async () => {
    api.open.mockResolvedValue(conversation(QUESTION, ANSWER))
    await show("c1")
    expect(await screen.findByText("¿Qué operadores de bolsa conozco?")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("ACME SA")).toBeInTheDocument()
    expect(screen.getByText("Bolsa, Poseidon")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Boletín Oficial" })).toHaveAttribute("href", "https://boletin.gob.ar/1")
    expect(screen.getByText("Costo: US$ 0,43")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Excel" }))
    expect(exportNodes).toHaveBeenCalledWith(
      [
        { c0: "30712345678", c1: "ACME SA", c2: "Bolsa, Poseidon" },
        { c0: "20111111112", c1: "PEREZ JUAN", c2: "Bolsa" },
      ],
      [
        { key: "c0", label: "cuit" },
        { key: "c1", label: "nombre" },
        { key: "c2", label: "fuentes" },
      ],
      "operadores",
      "xlsx"
    )
  })

  it("opens the ficha of a CUIT in a table", async () => {
    api.open.mockResolvedValue(conversation(QUESTION, ANSWER))
    await show("c1")
    await userEvent.click(await screen.findByRole("button", { name: "30712345678" }))
    expect(useStore.getState().editTaxId).toBe("30712345678")
    expect(navigate).toHaveBeenCalledWith("/edit")
  })

  it("polls the running answer, blocks new questions meanwhile and then shows it", async () => {
    api.open.mockResolvedValue(conversation(QUESTION, message({ id: "a1", status: "running" })))
    api.message.mockResolvedValueOnce(message({ id: "a1", status: "running" })).mockResolvedValue(ANSWER)
    await show("c1")
    expect(await screen.findByText(/Pensando/)).toBeInTheDocument()
    expect(screen.getByLabelText("Pregunta")).toBeDisabled()
    await waitFor(() => expect(screen.getByText("ACME SA")).toBeInTheDocument())
    expect(api.message).toHaveBeenCalledWith("a1")
    expect(screen.getByLabelText("Pregunta")).not.toBeDisabled()
  })

  it("asks a follow-up in the open chat", async () => {
    api.open.mockResolvedValue(conversation(QUESTION, ANSWER))
    api.ask.mockResolvedValue(
      conversation(QUESTION, ANSWER, message({ id: "q2", role: "user", text: "¿y?" }), message({ id: "a2", status: "running" }))
    )
    api.message.mockResolvedValue(message({ id: "a2", status: "running" }))
    await show("c1")
    await userEvent.type(await screen.findByLabelText("Pregunta"), "¿y?{Enter}")
    expect(api.ask).toHaveBeenCalledWith("c1", "¿y?")
    expect(await screen.findByText(/Pensando/)).toBeInTheDocument()
  })

  it("explains an answer cut by the budget or failed", async () => {
    api.open.mockResolvedValue(
      conversation(QUESTION, message({ id: "a1", status: "budget_exhausted", text: "Llegué a ver la mitad." }))
    )
    await show("c1")
    expect(await screen.findByText("Llegué a ver la mitad.")).toBeInTheDocument()
    expect(screen.getByText(/Se alcanzó el tope de gasto del mes/)).toBeInTheDocument()
  })

  it("archives the chat after confirming", async () => {
    api.open.mockResolvedValue(conversation(QUESTION, ANSWER))
    api.archive.mockResolvedValue({ ...CHAT, archivedAt: "2026-11-18T13:00:00.000Z" })
    await show("c1")
    await userEvent.click(await screen.findByRole("button", { name: "Archivar conversación" }))
    await userEvent.click(screen.getByRole("button", { name: "Archivar" }))
    expect(api.archive).toHaveBeenCalledWith("c1")
    expect(navigate).toHaveBeenCalledWith("/ai-chat")
  })
})
