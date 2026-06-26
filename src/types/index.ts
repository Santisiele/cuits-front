// ─── Graph API types ────────────────────────────────────────────────────────

/**
 * A single node along the path from a searched CUIT to a base node.
 * Used inside {@link SearchResult}.
 */
export interface PathNode {
  taxId: string
  businessName: string
  relationshipType: string
  inMyBase: boolean
}

/**
 * A single result returned by the CUIT search endpoint.
 * Each result represents one source file / database that matched the query.
 */
export interface SearchResult {
  cuit: string
  source: string
  file: string
  data: {
    businessName?: string
    inMyBase?: boolean
    pathToBase?: PathNode[]
    [key: string]: unknown
  }
}

/**
 * Response shape for `GET /graph/cuit/:taxId`.
 */
export interface CuitSearchResponse {
  cuit: string
  found: boolean
  results: SearchResult[]
}

// ─── Path types ─────────────────────────────────────────────────────────────

/**
 * Minimal node information used inside a {@link PathSegment}.
 */
export interface PathNodeInfo {
  taxId: string
  businessName: string
  inMyBase: boolean
}

/**
 * A directed segment between two consecutive nodes in a path,
 * including all relationship types connecting them.
 */
export interface PathSegment {
  from: PathNodeInfo
  to: PathNodeInfo
  relationships: string[]
}

/**
 * Response shape for `GET /graph/path`.
 */
export interface PathResponse {
  found: boolean
  path: PathSegment[]
}

// ─── Graph visualization types ───────────────────────────────────────────────

/**
 * A node in the React Flow graph visualization.
 */
export interface GraphNode {
  id: string
  label: string
  inMyBase: boolean
}

/**
 * An edge in the React Flow graph visualization.
 */
export interface GraphEdge {
  id: string
  source: string
  target: string
  label: string
}

// ─── Node detail types ───────────────────────────────────────────────────────

/**
 * Full detail of a single node as returned by `GET /graph/node/:taxId`.
 */
export interface NodeData {
  taxId: string
  businessName: string | null
  phone: string | null
  email: string | null
  birthday: string | null
  inMyBase: boolean
  entryDate: string | null
  exitDate: string | null
  loadedAt: string | null
  /** All sources that contributed this node (e.g. ["poseidon", "seniorHome"]). */
  sources: string[]
}

/**
 * Fields that can be updated via `PATCH /graph/node/:taxId`.
 */
export interface NodeUpdateFields {
  phone?: string
  email?: string
  birthday?: string,
  entryDate?: string,
  exitDate?: string,
  loadedAt?: string
}

/**
 * A node listed in the "my base" table.
 */
export interface BaseNode {
  taxId: string
  businessName: string
  /** All sources that contributed this node. */
  sources: string[]
  relationshipCount: number
  relatedSources?: string[]
}

// ─── Birthday types ─────────────────────────────────────────────────────────

/**
 * A row in the birthdays list.
 * `birthday` is stored as dd/mm/yyyy on the backend; the relationship
 * count is fetched separately (the backend returns it alongside the node).
 */
export interface BirthdayNode {
  taxId: string
  businessName: string
  /** dd/mm/yyyy */
  birthday: string
  sources: string[]
  relationshipCount: number
}

/**
 * Response shape for `GET /graph/birthdays`.
 */
export interface BirthdaysResponse {
  count: number
  results: BirthdayNode[]
}