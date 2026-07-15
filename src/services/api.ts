import type {
  CuitSearchResponse,
  PathResponse,
  NodeData,
  NodeUpdateFields,
  BaseNode,
  BirthdaysResponse,
  BirthdayNode
} from "@/types"
import { useAuthStore } from "@/store/useAuthStore"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

/**
 * Wrapper around `fetch` that:
 *   - Injects the JWT from the auth store as a Bearer token
 *   - Handles 401 responses centrally
 *   - Throws typed errors from the response body when available
 */
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token
  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  const response = await fetch(url, { ...options, headers })
  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().clearAuth()
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