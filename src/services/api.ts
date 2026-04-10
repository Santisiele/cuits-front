import type {
  CuitSearchResponse,
  PathResponse,
  NodeData,
  NodeUpdateFields,
  BaseNode,
} from "@/types"
import { useAuthStore } from "@/store/useAuthStore"
import { translateApiError } from "@/lib/errors"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the Authorization header with the current JWT token.
 * Throws if no token is available (should not happen in normal flow).
 */
function authHeader(): Record<string, string> {
  const token = useAuthStore.getState().token
  if (!token) throw new Error("Not authenticated")
  return { Authorization: `Bearer ${token}` }
}

/**
 * Performs a fetch request with the JWT token attached.
 * Throws an `Error` with the API's message if the response is not OK.
 * Clears auth and redirects to login on 401.
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      ...authHeader(),
    },
  })

  if (response.status === 401) {
    useAuthStore.getState().clearAuth()
    window.location.href = "/login"
    throw new Error("Session expired")
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(translateApiError(body.message ?? `HTTP ${response.status}`))
  }

  return response.json() as Promise<T>
}

/** Shorthand for JSON POST/PATCH/DELETE requests. */
function jsonOptions(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }
}

// ─── Auth service (logout) ───────────────────────────────────────────────────

export class AuthApiService {
  static async login(username: string, password: string): Promise<{ token: string; username: string }> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(translateApiError(body.message ?? "Login failed"))
    }
    return response.json()
  }

  /** Notifies the server of logout so it can log the event. */
  static async logout(): Promise<void> {
    const token = useAuthStore.getState().token
    if (!token) return
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {}) // Fire and forget — don't block the UI
    useAuthStore.getState().clearAuth()
  }
}

// ─── Graph service ────────────────────────────────────────────────────────────

/**
 * Service class encapsulating all graph-related API calls.
 * All methods include the JWT token in the Authorization header.
 */
export class GraphService {
  private static base = `${API_URL}/graph`

  static searchCuit(taxId: string, maxDepth = 3): Promise<CuitSearchResponse> {
    return apiFetch(`${this.base}/cuit/${taxId}?maxDepth=${maxDepth}`)
  }

  static findPath(from: string, to: string, maxDepth = 3): Promise<PathResponse> {
    return apiFetch(`${this.base}/path?from=${from}&to=${to}&maxDepth=${maxDepth}`)
  }

  static getNode(taxId: string): Promise<NodeData> {
    return apiFetch(`${this.base}/node/${taxId}`)
  }

  static updateNode(taxId: string, fields: NodeUpdateFields): Promise<void> {
    return apiFetch(`${this.base}/node/${taxId}`, jsonOptions("PATCH", fields))
  }

  static async getNodeRelationships(taxId: string, maxDepth = 3): Promise<CuitSearchResponse> {
    const data = await apiFetch<{ found: boolean; results: CuitSearchResponse["results"] }>(
      `${this.base}/node/${taxId}/relationships?maxDepth=${maxDepth}`
    )
    return { cuit: taxId, found: data.found, results: data.results }
  }

  static async getMyBaseNodes(): Promise<BaseNode[]> {
    const data = await apiFetch<{ nodes: BaseNode[] }>(`${this.base}/nodes`)
    return data.nodes
  }

  static addRelationship(fromTaxId: string, toTaxId: string, relationshipType: number): Promise<void> {
    return apiFetch(
      `${this.base}/relationship`,
      jsonOptions("POST", { fromTaxId, toTaxId, relationshipType })
    )
  }

  static deleteRelationship(fromTaxId: string, toTaxId: string, relationshipType: number): Promise<void> {
    return apiFetch(
      `${this.base}/relationship`,
      jsonOptions("DELETE", { fromTaxId, toTaxId, relationshipType })
    )
  }
}