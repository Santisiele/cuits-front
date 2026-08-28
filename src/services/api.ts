import type {
  CuitSearchResponse,
  PathResponse,
  NodeData,
  NodeUpdateFields,
  BaseNode,
  BirthdaysResponse,
  BirthdayNode,
  NameSearchResult,
  SourceInfo,
  SourceCategory,
  OperationSummary
} from "@/types"
import { useAuthStore } from "@/store/useAuthStore"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

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
  headers.set("Content-Type", "application/json")
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  const response = await fetch(url, { ...options, headers })
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
    throw new Error(error.message || error.error || "Request failed")
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
  getFullBaseNodes: () =>
    apiFetch<{nodes: BaseNode[]}>(`${API_BASE_URL}/graph/base-full`).then(res => res.nodes),

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
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null) as LoginErrorResponse | null
      throw new Error(errorData?.message || "Login failed")
    }

    return response.json()
  },

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