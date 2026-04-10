import { useEffect, useMemo, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import dagre from "@dagrejs/dagre"
import { CuitNode } from "@/components/CuitNode"
import { GraphService } from "@/services/api"
import { getRelationshipLabel } from "@/utils/relationshipLabels"
import type { CuitSearchResponse, PathResponse } from "@/types"

const NODE_TYPES = { cuitNode: CuitNode }

const NODE_WIDTH = 200
const NODE_HEIGHT = 60

/**
 * Visual role of a node in the graph — determines its color and border.
 */
type NodeRole = "start" | "end" | "startInBase" | "endInBase" | "inMyBase" | "default"

const NODE_STYLES: Record<NodeRole, React.CSSProperties> = {
  startInBase: {
    background: "#0891b2",
    color: "#fff",
    border: "3px solid #818cf8",
    borderRadius: "8px",
    padding: "10px",
    minWidth: `${NODE_WIDTH}px`,
    textAlign: "center",
  },
  endInBase: {
    background: "#16a34a",
    color: "#fff",
    border: "3px solid #818cf8",
    borderRadius: "8px",
    padding: "10px",
    minWidth: `${NODE_WIDTH}px`,
    textAlign: "center",
  },
  start: {
    background: "#0891b2",
    color: "#fff",
    border: "2px solid #22d3ee",
    borderRadius: "8px",
    padding: "10px",
    minWidth: `${NODE_WIDTH}px`,
    textAlign: "center",
  },
  end: {
    background: "#16a34a",
    color: "#fff",
    border: "2px solid #4ade80",
    borderRadius: "8px",
    padding: "10px",
    minWidth: `${NODE_WIDTH}px`,
    textAlign: "center",
  },
  inMyBase: {
    background: "#6366f1",
    color: "#fff",
    border: "2px solid #818cf8",
    borderRadius: "8px",
    padding: "10px",
    minWidth: `${NODE_WIDTH}px`,
    textAlign: "center",
  },
  default: {
    background: "#1e293b",
    color: "#cbd5e1",
    border: "1px solid #475569",
    borderRadius: "8px",
    padding: "10px",
    minWidth: `${NODE_WIDTH}px`,
    textAlign: "center",
  },
}

/**
 * Determines the {@link NodeRole} of a node based on its position in the graph.
 * Nodes that are both a path endpoint AND inMyBase get the combined role
 * (e.g. "startInBase") which renders with both the endpoint color and the
 * indigo border to signal base membership.
 */
function getRole(inMyBase: boolean, isStart: boolean, isEnd: boolean): NodeRole {
  if (isStart) return inMyBase ? "startInBase" : "start"
  if (isEnd) return inMyBase ? "endInBase" : "end"
  if (inMyBase) return "inMyBase"
  return "default"
}

/**
 * Applies a top-to-bottom Dagre layout to a set of React Flow nodes and edges.
 * Returns a new nodes array with updated `position` values.
 */
function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 60 })

  for (const node of nodes) {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  return nodes.map((node) => {
    const { x, y } = graph.node(node.id)
    return { ...node, position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 } }
  })
}

/**
 * Builds the React Flow `nodes` and `edges` arrays from the three possible
 * result types (CUIT search, path search, node relationships).
 */
class GraphBuilder {
  private nodes: Node[] = []
  private edges: Edge[] = []
  private nodeIds = new Set<string>()
  private edgeIds = new Set<string>()

  /** Adds a node, skipping duplicates. Upgrades the style if the new role is "inMyBase". */
  private addNode(id: string, label: string, role: NodeRole): void {
    if (this.nodeIds.has(id)) {
      if (role === "inMyBase") {
        const existing = this.nodes.find((n) => n.id === id)
        if (existing) {
          existing.data = { ...existing.data, nodeStyle: NODE_STYLES.inMyBase }
        }
      }
      return
    }
    this.nodeIds.add(id)
    this.nodes.push({
      id,
      type: "cuitNode",
      data: { label, role, nodeStyle: NODE_STYLES[role] },
      position: { x: 0, y: 0 },
    })
  }

  /**
   * Adds a directed edge between two nodes, skipping self-loops and duplicates.
   * @param label - Already-translated display label (use getRelationshipLabel before calling)
   */
  private addEdge(source: string, target: string, label: string): void {
    if (source === target) return
    const edgeId = `${source}-${target}-${label}`
    if (this.edgeIds.has(edgeId)) return
    this.edgeIds.add(edgeId)
    this.edges.push({
      id: edgeId,
      source,
      target,
      label,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#475569" },
      style: { stroke: "#475569" },
      labelStyle: { fill: "#94a3b8", fontSize: 11 },
      labelBgStyle: { fill: "#0f172a", opacity: 0.8 },
    })
  }

  /** Populates the graph from a CUIT search result.
   *
   * The API may return multiple results for the same CUIT when there are
   * multiple relationship types between the same pair of nodes (e.g. a person
   * who is both Director and President of the same company). Each result shares
   * the same pathToBase structure but differs in relationshipType per hop.
   *
   * To avoid duplicate overlapping edges, we first collect all relationship
   * labels per (source, target) pair across all results, then emit a single
   * combined edge per pair — matching the behaviour of buildFromPathResult.
   */
  private buildFromCuitResult(result: CuitSearchResponse): void {
    const edgeLabels = new Map<string, Set<string>>()

    for (const item of result.results) {
      if (item.data.inMyBase) {
        this.addNode(result.cuit, item.data.businessName ?? result.cuit, "start")
        continue
      }

      const path = item.data.pathToBase
      if (!path) continue

      this.addNode(result.cuit, item.data.businessName ?? result.cuit, "start")

      for (let i = 0; i < path.length; i++) {
        const node = path[i]
        if (!node) continue

        const isLast = i === path.length - 1
        const role = getRole(node.inMyBase, false, isLast)
        this.addNode(node.taxId, node.businessName, role)

        const prevId = i === 0 ? result.cuit : path[i - 1]?.taxId
        if (!prevId || !node.relationshipType) continue

        const key = `${prevId}→${node.taxId}`
        if (!edgeLabels.has(key)) edgeLabels.set(key, new Set())
        edgeLabels.get(key)!.add(node.relationshipType)
      }
    }

    for (const [key, labels] of edgeLabels) {
      const [source, target] = key.split("→") as [string, string]
      const combinedLabel = [...labels].map((r) => getRelationshipLabel(r)).join(" / ")
      this.addEdge(source, target, combinedLabel)
    }
  }

  /** Populates the graph from a path search result. */
  private buildFromPathResult(result: PathResponse): void {
    const firstFrom = result.path[0]?.from.taxId
    const lastTo = result.path[result.path.length - 1]?.to.taxId

    for (const segment of result.path) {
      const isFirst = segment.from.taxId === firstFrom
      const isLast = segment.to.taxId === lastTo

      this.addNode(segment.from.taxId, segment.from.businessName, getRole(segment.from.inMyBase, isFirst, false))
      this.addNode(segment.to.taxId, segment.to.businessName, getRole(segment.to.inMyBase, false, isLast))

      const combinedLabel = segment.relationships
        .map((r) => getRelationshipLabel(r))
        .join(" / ")
      this.addEdge(segment.from.taxId, segment.to.taxId, combinedLabel)
    }
  }

  /** Populates the graph from a node relationships result. */
  private buildFromNodeResult(result: CuitSearchResponse): void {
    const firstPath = result.results[0]?.data.pathToBase
    const rootName = firstPath?.[0]?.businessName ?? result.cuit
    this.addNode(result.cuit, rootName, "start")

    for (const item of result.results) {
      const path = item.data.pathToBase
      if (!path) continue

      for (let i = 0; i < path.length; i++) {
        const node = path[i]
        if (!node) continue

        this.addNode(node.taxId, node.businessName, node.inMyBase ? "inMyBase" : "default")

        const prevId = i === 0 ? result.cuit : path[i - 1]?.taxId
        if (prevId) this.addEdge(prevId, node.taxId, getRelationshipLabel(node.relationshipType))
      }
    }
  }

  /**
   * Builds and lays out the full graph from the provided data sources.
   *
   * @param cuitResult - Result from a CUIT search
   * @param pathResult - Result from a path search
   * @param nodeResult - Result from a node relationship query
   */
  build(
    cuitResult?: CuitSearchResponse | null,
    pathResult?: PathResponse | null,
    nodeResult?: CuitSearchResponse | null,
  ): { nodes: Node[]; edges: Edge[] } {
    if (cuitResult?.results) this.buildFromCuitResult(cuitResult)
    if (pathResult?.path) this.buildFromPathResult(pathResult)
    if (nodeResult?.results) this.buildFromNodeResult(nodeResult)

    return {
      nodes: applyDagreLayout(this.nodes, this.edges),
      edges: this.edges,
    }
  }
}

interface TooltipState {
  nodeId: string
  info: Record<string, string | boolean | null> | null
  loading: boolean
}

interface NodeTooltipProps {
  tooltip: TooltipState
}

/** Overlay shown when hovering over a graph node. */
function NodeTooltip({ tooltip }: NodeTooltipProps) {
  return (
    <div
      className="absolute top-3 right-3 z-50 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs shadow-xl pointer-events-none"
      style={{ minWidth: "200px" }}
    >
      {tooltip.loading ? (
        <p className="text-slate-400">Cargando...</p>
      ) : tooltip.info ? (
        <div className="space-y-1">
          <p className="font-medium text-white mb-2">
            {String(tooltip.info["businessName"] ?? tooltip.nodeId)}
          </p>
          {tooltip.info["phone"] && (
            <p><span className="text-slate-400">Tel:</span> {String(tooltip.info["phone"])}</p>
          )}
          {tooltip.info["email"] && (
            <p><span className="text-slate-400">Email:</span> {String(tooltip.info["email"])}</p>
          )}
          {tooltip.info["birthday"] && (
            <p><span className="text-slate-400">Nacimiento:</span> {String(tooltip.info["birthday"])}</p>
          )}
          <p>
            <span className="text-slate-400">Base:</span>{" "}
            <span className={tooltip.info["inMyBase"] ? "text-indigo-400" : "text-slate-400"}>
              {tooltip.info["inMyBase"] ? "En mi base" : "Externo"}
            </span>
          </p>
          {tooltip.info["source"] && (
            <p><span className="text-slate-400">Fuente:</span> {String(tooltip.info["source"])}</p>
          )}
        </div>
      ) : (
        <p className="text-slate-400">Sin información adicional</p>
      )}
    </div>
  )
}

/** Returns the background color for a node in the MiniMap. */
function miniMapNodeColor(node: Node): string {
  const bg = (node.data as { nodeStyle?: { background?: string } }).nodeStyle?.background
  if (bg === "#0891b2") return "#0891b2"
  if (bg === "#16a34a") return "#16a34a"
  if (bg === "#6366f1") return "#6366f1"
  return "#334155"
}

interface GraphViewProps {
  /** Result from a CUIT search. */
  cuitResult?: CuitSearchResponse | null
  /** Result from a path search. */
  pathResult?: PathResponse | null
  /** Result from a node relationship query (used in the Edit Node tab). */
  nodeResult?: CuitSearchResponse | null
}

/**
 * Interactive graph visualisation powered by React Flow.
 *
 * Accepts results from any combination of the three search modes and
 * renders them as a directed, auto-laid-out graph. Hovering over a
 * node fetches and displays additional details in a tooltip.
 */
export function GraphView({ cuitResult, pathResult, nodeResult }: GraphViewProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => new GraphBuilder().build(cuitResult, pathResult, nodeResult),
    [cuitResult, pathResult, nodeResult]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = new GraphBuilder().build(cuitResult, pathResult, nodeResult)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [cuitResult, pathResult, nodeResult, setNodes, setEdges])

  async function handleNodeMouseEnter(_: React.MouseEvent, node: Node): Promise<void> {
    setTooltip({ nodeId: node.id, info: null, loading: true })
    try {
      const info = await GraphService.getNode(node.id) as unknown as Record<string, string | boolean | null>
      setTooltip((prev) => prev ? { ...prev, info, loading: false } : null)
    } catch {
      setTooltip((prev) => prev ? { ...prev, loading: false } : null)
    }
  }

  function handleNodeMouseLeave(): void {
    setTooltip(null)
  }

  if (!cuitResult && !pathResult && !nodeResult) return null

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2" style={{ minHeight: 0 }}>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-cyan-600 inline-block" /> Inicio
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> Fin
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> En base propia
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-slate-700 inline-block" /> Externo
        </span>
      </div>

      {/* Graph canvas */}
      <div className="relative rounded-lg border border-slate-700 overflow-hidden bg-slate-950" style={{ flex: "1 1 0", minHeight: "300px", height: "100%" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeMouseEnter={handleNodeMouseEnter}
          onNodeMouseLeave={handleNodeMouseLeave}
          fitView
          fitViewOptions={{ padding: 0.3 }}
        >
          <Background color="#1e293b" />
          <Controls />
          <div className="hidden sm:block">
            <MiniMap nodeColor={miniMapNodeColor} />
          </div>
        </ReactFlow>

        {tooltip && <NodeTooltip tooltip={tooltip} />}
      </div>
    </div>
  )
}