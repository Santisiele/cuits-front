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
  /**
   * Trust level assigned to this CUIT. See `TRUST_LEVELS` for what each
   * number means; 0 is "Sin nivel", the unclassified default.
   *
   * Optional because responses cached before the field existed will not
   * carry it — treat undefined the same as 0.
   */
  levelOfTrust?: number
  /**
   * Months the node has operations in, as `yyyy-mm`, most recent first.
   *
   * Derived by the backend from the operations its loader recorded, so it is
   * empty for sources that do not track them. Optional because responses
   * cached before the field existed will not carry it.
   */
  activityMonths?: string[]
  /**
   * Date the company was published in the boletín oficial, as `dd/mm/yyyy`.
   *
   * Only "Empresas concursadas" records it, so it arrives empty for every
   * other source. Optional for the same reason as {@link activityMonths}.
   */
  publicationDate?: string
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
  /** Omitting this leaves the stored level alone. Send 0 to clear it. */
  levelOfTrust?: number
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
  /** Trust level for this CUIT. See `TRUST_LEVELS`. */
  levelOfTrust?: number
  relatedSources?: string[]
}

/**
 * A row of the crossing-over table: a node that belongs to every selected
 * source at once.
 *
 * A company can belong to a source without carrying it, by being directly
 * related to a node that does — which is the only way a source made of people
 * ("Residentes Senior Home") ever crosses with a source made of companies.
 */
export interface CrossingNode extends BaseNode {
  /**
   * The selected sources this node reaches only through a related node. Empty
   * for a plain member of all of them.
   */
  indirectSources: string[]
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
  /** Trust level for this CUIT. See `TRUST_LEVELS`. */
  levelOfTrust?: number
  relationshipCount: number
}

/**
 * Response shape for `GET /graph/birthdays`.
 */
export interface BirthdaysResponse {
  count: number
  results: BirthdayNode[]
}

// ─── Name search types ───────────────────────────────────────────────────────

/**
 * A node matched by searching business names.
 *
 * The backend searches the whole graph, so most results are nodes that are NOT
 * in the base — they were discovered through enrichment. `inMyBase` is what
 * lets the list say which is which.
 */
export interface NameSearchResult {
  taxId: string
  businessName: string
  sources: string[]
  inMyBase: boolean
  /** Trust level for this CUIT. See `TRUST_LEVELS`. */
  levelOfTrust?: number
  relationshipCount: number
}

// ─── Source administration types ─────────────────────────────────────────────

/**
 * Category a source belongs to.
 *
 * The backend serialises this as `"known" | "to_know"` (snake_case, its domain
 * type). It is normalised to camelCase in `GraphService.getSources` so the
 * whole frontend speaks one dialect — see the note there before changing this.
 */
export type SourceCategory = "known" | "toKnow"

/**
 * A source as registered in the backend graph, with how many nodes hang off it.
 */
export interface SourceInfo {
  name: string
  category: SourceCategory
  nodeCount: number
}

/**
 * Result of a source admin operation, returned identically by a dry run and by
 * the real execution — `dryRun` is what tells them apart.
 *
 * `message` arrives already written in Spanish and is safe to display as-is.
 */
export interface OperationSummary {
  operation: "rename" | "merge" | "delete" | "add-source" | "move-source"
  affectedNodeCount: number
  removedNodeCount: number
  updatedNodeCount: number
  createdSourceName?: string
  removedSourceName?: string
  dryRun: boolean
  message: string
}

// ─── Trust level types ───────────────────────────────────────────────────────

export type TrustLevelColor =
  | "red"
  | "orange"
  | "amber"
  | "green"
  | "teal"
  | "blue"
  | "violet"
  | "pink"
  | "slate"

export interface TrustLevelInfo {
  value: number
  label: string
  color: TrustLevelColor
  description: string
  nodeCount: number
}

export interface TrustLevelOperationSummary {
  operation: "create-level" | "update-level" | "delete-level"
  value: number
  label: string
  affectedNodeCount: number
  dryRun: boolean
  message: string
}
