/**
 * Represents a single search result from the API
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
 * Represents the response from GET /graph/cuit/:taxId
 */
export interface CuitSearchResponse {
  cuit: string
  found: boolean
  results: SearchResult[]
}

/**
 * Represents a single node in a graph path (used in cuit search)
 */
export interface PathNode {
  taxId: string
  businessName: string
  relationshipType: string
  inMyBase: boolean
}

/**
 * Represents a node in a path segment
 */
export interface PathNodeInfo {
  taxId: string
  businessName: string
  inMyBase: boolean
}

/**
 * Represents a segment between two nodes with all their relationships
 */
export interface PathSegment {
  from: PathNodeInfo
  to: PathNodeInfo
  relationships: string[]
}

/**
 * Represents the response from GET /graph/path
 */
export interface PathResponse {
  found: boolean
  path: PathSegment[]
}

/**
 * Represents a node in the graph visualization
 */
export interface GraphNode {
  id: string
  label: string
  inMyBase: boolean
}

/**
 * Represents an edge in the graph visualization
 */
export interface GraphEdge {
  id: string
  source: string
  target: string
  label: string
}