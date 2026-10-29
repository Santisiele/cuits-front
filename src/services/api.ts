import type {
  CuitSearchResponse,
  PathResponse,
  NodeData,
  NodeUpdateFields,
  BaseNode,
  CrossingNode,
  BirthdaysResponse,
  BirthdayNode,
  NameSearchResult,
  SourceInfo,
  TrustLevelInfo,
  TrustLevelColor,
  TrustLevelMembersResponse,
  TrustLevelOperationSummary,
  SourceCategory,
  OperationSummary,
  AppUser,
  WebResearch,
  RecentWebResearch,
  ArchivedWebResearch,
  ResearchBudget,
  BirthdayProgress,
  CrmAction,
  CrmActionInput,
  CrmAgendaItem,
  CrmChange,
  CrmCompany,
  CrmCompanyDetail,
  CrmCompanyInput,
  CrmContact,
  CrmContactInput,
  CrmRemovalResult,
  CrmTask,
  CrmTaskInput,
  CrmUser,
  NosisPendingQueue
} from "@/types"
import { useAuthStore } from "@/store/useAuthStore"
import { translateApiFailure } from "@/lib/errors"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

/**
 * An error the API answered with, carrying both what the user reads and what
 * the server actually said.
 *
 * The API answers in English and the Spanish lives in the frontend, so the
 * translation happens here, at the single boundary every call goes through —
 * translating at each screen instead is what left half the app showing raw
 * English. `rawMessage` keeps the original for the few places that branch on
 * which error it was rather than displaying it.
 */
export class ApiError extends Error {
  readonly rawMessage: string
  readonly code: string | undefined

  constructor(rawMessage: string, code?: string, status?: number) {
    super(translateApiFailure(code, rawMessage, status))
    this.name = "ApiError"
    this.rawMessage = rawMessage
    this.code = code
  }
}

/**
 * Wrapper around `fetch` that:
 *   - Injects the JWT from the auth store as a Bearer token
 *   - Handles 401 responses centrally
 *   - Throws typed errors from the response body when available
 *
 * `keepSessionOn401` opts out of the global logout. Source admin operations
 * re-verify the user's password in the request body, and a wrong password
 * answers 401 — the session is still perfectly valid, so logging the user out
 * over a typo would be wrong. Only those calls set it.
 */
async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  keepSessionOn401 = false
): Promise<T> {
  const token = useAuthStore.getState().token
  const headers = new Headers(options.headers)
  if (options.body != null) headers.set("Content-Type", "application/json")
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  let response: Response
  try {
    response = await fetch(url, { ...options, headers })
  } catch {
    throw new ApiError("Network error", "network_error")
  }
  if (!response.ok) {
    /**
     * Only tear down the session this request was actually made under.
     *
     * Screens with auto-firing queries have requests in flight while the user
     * is logging in. Those went out unauthenticated and answer 401 afterwards;
     * without this check they clear the session that was just created, and the
     * login silently fails to stick — which is why logging in used to work
     * only on the one screen that fetches nothing on mount.
     */
    if (response.status === 401 && !keepSessionOn401) {
      if (useAuthStore.getState().token === token) {
        useAuthStore.getState().clearAuth()
      }
    }
    const error = await response.json().catch(() => ({ error: "Request failed" })) as { error?: string; message?: string }
    throw new ApiError(error.message || error.error || "Request failed", error.error, response.status)
  }
  return response.json()
}

// ─── Graph API ────────────────────────────────────────────────────────────────

/**
 * Object-oriented namespace bundling every /graph/* endpoint the frontend
 * needs to talk to. Each method builds the full URL from API_BASE_URL and
 * delegates the fetch to `apiFetch` for auth + error handling.
 */
export const GraphService = {
  searchCuit: (taxId: string, maxDepth: number) =>
    apiFetch<CuitSearchResponse>(`${API_BASE_URL}/graph/cuit/${taxId}?maxDepth=${maxDepth}`),

  findPath: (from: string, to: string, maxDepth: number) =>
    apiFetch<PathResponse>(`${API_BASE_URL}/graph/path?from=${from}&to=${to}&maxDepth=${maxDepth}`),

  addRelationship: (fromTaxId: string, toTaxId: string, relationshipType: number) =>
    apiFetch(`${API_BASE_URL}/graph/relationship`, {
      method: "POST",
      body: JSON.stringify({ fromTaxId, toTaxId, relationshipType }),
    }),

  deleteRelationship: (fromTaxId: string, toTaxId: string, relationshipType: number) =>
    apiFetch(`${API_BASE_URL}/graph/relationship`, {
      method: "DELETE",
      body: JSON.stringify({ fromTaxId, toTaxId, relationshipType }),
    }),

  getMyBaseNodes: () =>
    apiFetch<{nodes: BaseNode[]}>(`${API_BASE_URL}/graph/nodes`).then(res => res.nodes),

  getCompanyNodes: () =>
    apiFetch<{nodes: BaseNode[]}>(`${API_BASE_URL}/graph/companies`).then(res => res.nodes),

  getToKnowNodes: () =>
    apiFetch<{nodes: BaseNode[]}>(`${API_BASE_URL}/graph/to-know`).then(res => res.nodes),

  /**
   * Union of "conocidos" (isKnown) and "por conocer" (isToKnow) nodes.
   * Corresponds to GET /graph/base-full on the backend.
   */
  getFullBaseNodes: (source: string) =>
    apiFetch<{nodes: BaseNode[]}>(
      `${API_BASE_URL}/graph/base-full?source=${encodeURIComponent(source)}`
    ).then(res => res.nodes),

  /**
   * Nodes belonging to every source in `sources` at once, resolved server-side.
   *
   * The intersection cannot be computed here: it counts companies that reach a
   * source through a related node, and no list endpoint carries relationships.
   *
   * @param sources At least two source names.
   */
  getCrossingNodes: (sources: string[]) => {
    const params = new URLSearchParams()
    for (const source of sources) params.append("sources", source)
    return apiFetch<{nodes: CrossingNode[]}>(
      `${API_BASE_URL}/graph/crossing?${params.toString()}`
    ).then(res => res.nodes)
  },

  getNode: (taxId: string) =>
    apiFetch<NodeData>(`${API_BASE_URL}/graph/node/${taxId}`),

  updateNode: (taxId: string, fields: NodeUpdateFields) =>
    apiFetch<{ message: string }>(`${API_BASE_URL}/graph/node/${taxId}`, {
      method: "PATCH",
      body: JSON.stringify(fields),
    }),

  getNodeRelationships: (taxId: string, maxDepth: number) =>
    apiFetch<CuitSearchResponse>(`${API_BASE_URL}/graph/node/${taxId}/relationships?maxDepth=${maxDepth}`),

  /**
   * Fetches inMyBase nodes whose birthday falls in [from, to].
   * @param from dd/mm/yyyy (year ignored)
   * @param to   dd/mm/yyyy (year ignored)
   */
  getBirthdays: async (from: string, to: string): Promise<BirthdayNode[]> => {
    const params = new URLSearchParams({ from, to })
    const data = await apiFetch<BirthdaysResponse>(
      `${API_BASE_URL}/graph/birthdays?${params.toString()}`
    )
    return data.results
  },

  /**
   * Searches nodes by business name across the whole graph.
   * The backend rejects anything shorter than 3 characters.
   */
  searchByName: async (query: string, limit = 50): Promise<NameSearchResult[]> => {
    const params = new URLSearchParams({ q: query, limit: String(limit) })
    const data = await apiFetch<{ count: number; results: NameSearchResult[] }>(
      `${API_BASE_URL}/graph/search-by-name?${params.toString()}`
    )
    return data.results
  },

  // ─── Trust levels ──────────────────────────────────────────────────────────

  getTrustLevels: (): Promise<TrustLevelInfo[]> =>
    apiFetch<{ levels: TrustLevelInfo[] }>(`${API_BASE_URL}/trust-levels`).then((res) => res.levels),

  getTrustLevelMembers: (value: number): Promise<TrustLevelMembersResponse> =>
    apiFetch<TrustLevelMembersResponse>(`${API_BASE_URL}/trust-levels/nodes?level=${value}`),

  createTrustLevel: (
    label: string,
    color: TrustLevelColor,
    description: string,
    password: string | null,
    dryRun: boolean
  ): Promise<TrustLevelOperationSummary> =>
    apiFetch(
      `${API_BASE_URL}/trust-levels?dryRun=${dryRun}`,
      {
        method: "POST",
        body: JSON.stringify(dryRun ? { label, color, description } : { label, color, description, password }),
      },
      true
    ),

  updateTrustLevel: (
    value: number,
    label: string,
    color: TrustLevelColor,
    description: string,
    password: string | null,
    dryRun: boolean
  ): Promise<TrustLevelOperationSummary> =>
    apiFetch(
      `${API_BASE_URL}/trust-levels/${value}?dryRun=${dryRun}`,
      {
        method: "PATCH",
        body: JSON.stringify(dryRun ? { label, color, description } : { label, color, description, password }),
      },
      true
    ),

  deleteTrustLevel: (
    value: number,
    password: string | null,
    dryRun: boolean
  ): Promise<TrustLevelOperationSummary> =>
    apiFetch(
      `${API_BASE_URL}/trust-levels/${value}?dryRun=${dryRun}`,
      { method: "DELETE", body: JSON.stringify(dryRun ? {} : { password }) },
      true
    ),

  // ─── Source administration ─────────────────────────────────────────────────

  /**
   * Lists every source with its category and node count.
   *
   * The backend speaks `"known" | "to_know"`; the category is normalised to
   * camelCase here so the rest of the app only ever handles `SourceCategory`.
   * Doing it at this boundary is deliberate: comparisons against `"toKnow"`
   * elsewhere would otherwise fail silently rather than raise anything.
   */
  getSources: (): Promise<SourceInfo[]> =>
    apiFetch<{ sources: { name: string; category: string; nodeCount: number }[] }>(
      `${API_BASE_URL}/sources`
    ).then((res) =>
      res.sources.map((source) => ({
        name: source.name,
        category: (source.category === "to_know" ? "toKnow" : "known") as SourceCategory,
        nodeCount: source.nodeCount,
      }))
    ),

  /**
   * Renames a source. With `dryRun` the backend only reports what would happen
   * and needs no password; the real call requires one.
   */
  renameSource: (
    currentName: string,
    newName: string,
    password: string | null,
    dryRun: boolean
  ): Promise<OperationSummary> =>
    apiFetch(
      `${API_BASE_URL}/sources/${encodeURIComponent(currentName)}?dryRun=${dryRun}`,
      {
        method: "PATCH",
        body: JSON.stringify(dryRun ? { newName } : { newName, password }),
      },
      true
    ),

  /** Merges `sourceToDrop` into `sourceToKeep`. Both must share a category. */
  mergeSources: (
    sourceToKeep: string,
    sourceToDrop: string,
    password: string | null,
    dryRun: boolean
  ): Promise<OperationSummary> =>
    apiFetch(
      `${API_BASE_URL}/sources/merge?dryRun=${dryRun}`,
      {
        method: "POST",
        body: JSON.stringify(
          dryRun ? { sourceToKeep, sourceToDrop } : { sourceToKeep, sourceToDrop, password }
        ),
      },
      true
    ),

  /**
   * Deletes a source. Nodes left without any source are removed too — the dry
   * run reports how many in `removedNodeCount`.
   */
  deleteSource: (
    name: string,
    password: string | null,
    dryRun: boolean
  ): Promise<OperationSummary> =>
    apiFetch(
      `${API_BASE_URL}/sources/${encodeURIComponent(name)}?dryRun=${dryRun}`,
      {
        method: "DELETE",
        body: JSON.stringify(dryRun ? {} : { password }),
      },
      true
    ),

  /** Adds a source to a single node, or moves it from one source to another. */
  changeNodeSource: (
    taxId: string,
    sourceName: string,
    mode: "add" | "move",
    fromSource: string | null,
    password: string | null,
    dryRun: boolean
  ): Promise<OperationSummary> =>
    apiFetch(
      `${API_BASE_URL}/nodes/${encodeURIComponent(taxId)}/sources?dryRun=${dryRun}`,
      {
        method: "POST",
        body: JSON.stringify({
          sourceName,
          mode,
          ...(fromSource ? { fromSource } : {}),
          ...(dryRun ? {} : { password }),
        }),
      },
      true
    ),

}

// ─── Auth API ─────────────────────────────────────────────────────────────────

interface LoginResponse {
  token: string
  username: string
  role: string
}

interface MeResponse {
  username: string
  role: string
}

interface LoginErrorResponse {
  message: string
}

/**
 * Authentication-related endpoints. Kept separate from GraphService so
 * that consumers can import just what they need.
 */
export const AuthApiService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    let response: Response
    try {
      response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
    } catch {
      throw new ApiError("Network error", "network_error")
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null) as LoginErrorResponse | null
      throw new ApiError(errorData?.message || "Login failed", undefined, response.status)
    }

    return response.json()
  },

  me: () => apiFetch<MeResponse>(`${API_BASE_URL}/auth/me`),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ message: string }>(`${API_BASE_URL}/auth/password`, {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  logout: async (): Promise<void> => {
    try {
      const token = useAuthStore.getState().token
      if (!token) return
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })
    } finally {
      useAuthStore.getState().clearAuth()
    }
  }
}
export const UsersService = {
  list: () => apiFetch<{ users: AppUser[] }>(`${API_BASE_URL}/users`).then((res) => res.users),

  create: (username: string, password: string, role: string) =>
    apiFetch<AppUser>(`${API_BASE_URL}/users`, {
      method: "POST",
      body: JSON.stringify({ username, password, role }),
    }),

  update: (username: string, changes: { role?: string; disabled?: boolean; color?: string | null }) =>
    apiFetch<AppUser>(`${API_BASE_URL}/users/${encodeURIComponent(username)}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    }),

  resetPassword: (username: string, password: string) =>
    apiFetch<{ message: string }>(`${API_BASE_URL}/users/${encodeURIComponent(username)}/password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
}

export const ResearchService = {
  run: (taxId: string) =>
    apiFetch<WebResearch>(`${API_BASE_URL}/research/${encodeURIComponent(taxId)}`, { method: "POST" }),

  history: (taxId: string) =>
    apiFetch<{ research: WebResearch[] }>(`${API_BASE_URL}/research/${encodeURIComponent(taxId)}`).then(
      (res) => res.research
    ),

  recent: () =>
    apiFetch<{ research: RecentWebResearch[] }>(`${API_BASE_URL}/research/recent`).then((res) => res.research),

  archived: () =>
    apiFetch<{ research: ArchivedWebResearch[] }>(`${API_BASE_URL}/research/archived`).then((res) => res.research),

  archive: (id: string) =>
    apiFetch<WebResearch>(`${API_BASE_URL}/research/${encodeURIComponent(id)}/archive`, { method: "POST" }),

  restore: (id: string) =>
    apiFetch<WebResearch>(`${API_BASE_URL}/research/${encodeURIComponent(id)}/restore`, { method: "POST" }),

  budget: () => apiFetch<ResearchBudget>(`${API_BASE_URL}/research/budget`),

  setLimit: (monthlyLimitUsd: number) =>
    apiFetch<ResearchBudget>(`${API_BASE_URL}/research/budget`, {
      method: "PATCH",
      body: JSON.stringify({ monthlyLimitUsd }),
    }),
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})

export const CrmApiService = {
  companies: () =>
    apiFetch<{ companies: CrmCompany[] }>(`${API_BASE_URL}/crm/companies`).then((res) => res.companies),

  company: (taxId: string) =>
    apiFetch<CrmCompanyDetail>(`${API_BASE_URL}/crm/companies/${encodeURIComponent(taxId)}`),

  addCompany: (input: CrmCompanyInput) =>
    apiFetch<{ taxId: string; created: boolean; restored: boolean; nosisPending: boolean }>(
      `${API_BASE_URL}/crm/companies`,
      json("POST", input)
    ),

  updateCompany: (taxId: string, input: CrmCompanyInput) =>
    apiFetch<CrmCompany>(`${API_BASE_URL}/crm/companies/${encodeURIComponent(taxId)}`, json("PATCH", input)),

  removeCompany: (taxId: string, dryRun: boolean) =>
    apiFetch<CrmRemovalResult>(
      `${API_BASE_URL}/crm/companies/${encodeURIComponent(taxId)}?dryRun=${dryRun}`,
      json("DELETE")
    ),

  createContact: (input: CrmContactInput) =>
    apiFetch<CrmContact>(`${API_BASE_URL}/crm/contacts`, json("POST", input)),

  updateContact: (id: string, input: CrmContactInput) =>
    apiFetch<CrmContact>(`${API_BASE_URL}/crm/contacts/${encodeURIComponent(id)}`, json("PATCH", input)),

  archiveContact: (id: string) =>
    apiFetch<CrmContact>(`${API_BASE_URL}/crm/contacts/${encodeURIComponent(id)}`, json("DELETE")),

  recordAction: (input: CrmActionInput) =>
    apiFetch<{ action: CrmAction; closedTasks: CrmTask[]; nextTask: CrmTask | null }>(
      `${API_BASE_URL}/crm/actions`,
      json("POST", input)
    ),

  archiveAction: (id: string) =>
    apiFetch<CrmAction>(`${API_BASE_URL}/crm/actions/${encodeURIComponent(id)}`, json("DELETE")),

  createTask: (input: CrmTaskInput) => apiFetch<CrmTask>(`${API_BASE_URL}/crm/tasks`, json("POST", input)),

  updateTask: (id: string, input: CrmTaskInput) =>
    apiFetch<CrmTask>(`${API_BASE_URL}/crm/tasks/${encodeURIComponent(id)}`, json("PATCH", input)),

  agenda: (assignee: string) =>
    apiFetch<{ tasks: CrmAgendaItem[] }>(`${API_BASE_URL}/crm/agenda?assignee=${encodeURIComponent(assignee)}`).then(
      (res) => res.tasks
    ),

  users: () => apiFetch<{ users: CrmUser[] }>(`${API_BASE_URL}/crm/users`).then((res) => res.users),

  nosisPending: () => apiFetch<NosisPendingQueue>(`${API_BASE_URL}/crm/nosis-pending`),

  changes: (entityType: string, entityId: string) =>
    apiFetch<{ changes: CrmChange[] }>(
      `${API_BASE_URL}/crm/changes?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`
    ).then((res) => res.changes),
}

export const BirthdayProgressService = {
  get: () => apiFetch<BirthdayProgress>(`${API_BASE_URL}/birthdays/progress`),
}
