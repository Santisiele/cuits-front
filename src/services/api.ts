import type {
  CuitSearchResponse,
  PathResponse,
  NodeData,
  NodeUpdateFields,
  BaseNode,
} from "@/types"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

/**
 * Performs a fetch request and throws an `Error` with the API's message
 * if the response is not OK.
 *
 * @param url - Full URL to fetch
 * @param options - Standard `RequestInit` options
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message ?? `HTTP ${response.status}`)
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

/**
 * Service class encapsulating all graph-related API calls.
 * Centralises the base URL and error handling strategy.
 */
export class GraphService {
  private static base = `${API_URL}/graph`

  /**
   * Searches for a Tax ID in the graph database and returns its connections.
   *
   * @param taxId - The CUIT to search for
   * @param maxDepth - Maximum traversal depth (default: 3)
   */
  static searchCuit(taxId: string, maxDepth = 3): Promise<CuitSearchResponse> {
    return apiFetch(`${this.base}/cuit/${taxId}?maxDepth=${maxDepth}`)
  }

  /**
   * Finds the shortest path between two Tax IDs.
   *
   * @param from - Origin CUIT
   * @param to - Destination CUIT
   * @param maxDepth - Maximum traversal depth (default: 3)
   */
  static findPath(from: string, to: string, maxDepth = 3): Promise<PathResponse> {
    return apiFetch(`${this.base}/path?from=${from}&to=${to}&maxDepth=${maxDepth}`)
  }

  /**
   * Retrieves full detail for a single node.
   *
   * @param taxId - The CUIT of the node to retrieve
   */
  static getNode(taxId: string): Promise<NodeData> {
    return apiFetch(`${this.base}/node/${taxId}`)
  }

  /**
   * Updates editable fields on a node.
   *
   * @param taxId - The CUIT of the node to update
   * @param fields - Fields to update (phone, email, birthday)
   */
  static updateNode(taxId: string, fields: NodeUpdateFields): Promise<void> {
    return apiFetch(`${this.base}/node/${taxId}`, jsonOptions("PATCH", fields))
  }

  /**
   * Returns the graph relationships of a node up to a given depth,
   * normalised into the {@link CuitSearchResponse} shape.
   *
   * @param taxId - The CUIT whose relationships to fetch
   * @param maxDepth - Maximum traversal depth (default: 3)
   */
  static async getNodeRelationships(
    taxId: string,
    maxDepth = 3
  ): Promise<CuitSearchResponse> {
    const data = await apiFetch<{ found: boolean; results: CuitSearchResponse["results"] }>(
      `${this.base}/node/${taxId}/relationships?maxDepth=${maxDepth}`
    )
    return { cuit: taxId, found: data.found, results: data.results }
  }

  /**
   * Retrieves all nodes that belong to "my base" (inMyBase = true).
   */
  static async getMyBaseNodes(): Promise<BaseNode[]> {
    const data = await apiFetch<{ nodes: BaseNode[] }>(`${this.base}/nodes`)
    return data.nodes
  }

  /**
   * Adds a directed relationship between two nodes.
   *
   * @param fromTaxId - Origin CUIT
   * @param toTaxId - Destination CUIT
   * @param relationshipType - Numeric relationship type code
   */
  static addRelationship(
    fromTaxId: string,
    toTaxId: string,
    relationshipType: number
  ): Promise<void> {
    return apiFetch(
      `${this.base}/relationship`,
      jsonOptions("POST", { fromTaxId, toTaxId, relationshipType })
    )
  }

  /**
   * Deletes an existing relationship between two nodes.
   *
   * @param fromTaxId - Origin CUIT
   * @param toTaxId - Destination CUIT
   * @param relationshipType - Numeric relationship type code
   */
  static deleteRelationship(
    fromTaxId: string,
    toTaxId: string,
    relationshipType: number
  ): Promise<void> {
    return apiFetch(
      `${this.base}/relationship`,
      jsonOptions("DELETE", { fromTaxId, toTaxId, relationshipType })
    )
  }
}