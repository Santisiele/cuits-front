import { useEffect, useMemo } from "react"
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
import type { CuitSearchResponse, PathResponse } from "../types"
import { getRelationshipLabel } from "../utils/relationshipLabels"

const NODE_WIDTH = 200
const NODE_HEIGHT = 60

type NodeRole = "start" | "end" | "startInBase" | "endInBase" | "inMyBase" | "default"

/**
 * Returns node style based on its role in the graph
 * - start: cyan (the node being searched / first in path)
 * - end: green (last node in path)
 * - inMyBase: purple (belongs to user's base)
 * - default: dark (external node)
 */
function nodeStyle(role: NodeRole) {
  const styles: Record<NodeRole, object> = {
    startInBase: {
      background: "#0891b2",
      color: "#fff",
      border: "3px solid #818cf8",
      borderRadius: "8px",
      padding: "10px",
      minWidth: `${NODE_WIDTH}px`,
      textAlign: "center" as const,
    },
    endInBase: {
      background: "#16a34a",
      color: "#fff",
      border: "3px solid #818cf8",
      borderRadius: "8px",
      padding: "10px",
      minWidth: `${NODE_WIDTH}px`,
      textAlign: "center" as const,
    },
    start: {
      background: "#0891b2",
      color: "#fff",
      border: "2px solid #22d3ee",
      borderRadius: "8px",
      padding: "10px",
      minWidth: `${NODE_WIDTH}px`,
      textAlign: "center" as const,
    },
    end: {
      background: "#16a34a",
      color: "#fff",
      border: "2px solid #4ade80",
      borderRadius: "8px",
      padding: "10px",
      minWidth: `${NODE_WIDTH}px`,
      textAlign: "center" as const,
    },
    inMyBase: {
      background: "#6366f1",
      color: "#fff",
      border: "2px solid #818cf8",
      borderRadius: "8px",
      padding: "10px",
      minWidth: `${NODE_WIDTH}px`,
      textAlign: "center" as const,
    },
    default: {
      background: "#1e293b",
      color: "#cbd5e1",
      border: "1px solid #475569",
      borderRadius: "8px",
      padding: "10px",
      minWidth: `${NODE_WIDTH}px`,
      textAlign: "center" as const,
    },
  }
  return styles[role]
}

function getRole(inMyBase: boolean, isStart: boolean, isEnd: boolean): NodeRole {
  if (isStart) return inMyBase ? "startInBase" : "start"
  if (isEnd) return inMyBase ? "endInBase" : "end"
  if (inMyBase) return "inMyBase"
  return "default"
}

function applyLayout(nodes: Node[], edges: Edge[]): Node[] {
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
    return {
      ...node,
      position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
    }
  })
}

interface GraphViewProps {
  cuitResult?: CuitSearchResponse | null
  pathResult?: PathResponse | null
}

function buildGraph(
  cuitResult?: CuitSearchResponse | null,
  pathResult?: PathResponse | null
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const addedNodes = new Set<string>()
  const addedEdges = new Set<string>()

  function addNode(id: string, label: string, role: NodeRole) {
    if (addedNodes.has(id)) {
      if (role === "inMyBase") {
        const existing = nodes.find((n) => n.id === id)
        if (existing) existing.style = nodeStyle("inMyBase")
      }
      return
    }
    addedNodes.add(id)
    nodes.push({
      id,
      data: { label },
      position: { x: 0, y: 0 },
      style: nodeStyle(role),
    })
  }

  function addEdge(source: string, target: string, label: string) {
    const edgeId = `${source}-${target}`
    if (addedEdges.has(edgeId)) return
    addedEdges.add(edgeId)
    edges.push({
      id: edgeId,
      source,
      target,
      label: getRelationshipLabel(label),
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#475569",
      },
      style: { stroke: "#475569" },
      labelStyle: { fill: "#94a3b8", fontSize: 11 },
      labelBgStyle: { fill: "#0f172a", opacity: 0.8 },
    })
  }

  // CUIT search result
  if (cuitResult?.results) {
    for (const result of cuitResult.results) {
      if (result.data.inMyBase) {
        addNode(cuitResult.cuit, result.data.businessName ?? cuitResult.cuit, "start")
      } else if (result.data.pathToBase) {
        const path = result.data.pathToBase
        addNode(cuitResult.cuit, result.data.businessName ?? cuitResult.cuit, "start")

        for (let i = 0; i < path.length; i++) {
          const node = path[i]
          if (!node) continue
          const isLast = i === path.length - 1
          addNode(node.taxId, node.businessName, isLast ? "end" : node.inMyBase ? "inMyBase" : "default")

          if (i === 0) {
            addEdge(cuitResult.cuit, node.taxId, node.relationshipType)
          } else {
            const prev = path[i - 1]
            if (prev) addEdge(prev.taxId, node.taxId, node.relationshipType)
          }
        }
      }
    }
  }

  if (pathResult?.path) {
    const path = pathResult.path
    const lastIndex = path.length - 1

    for (let i = 0; i < path.length; i++) {
      const node = path[i]
      if (!node) continue
      const role = getRole(node.inMyBase, i === 0, i === lastIndex)
      console.log(node.businessName, "inMyBase:", node.inMyBase, "role:", role)
      addNode(node.taxId, node.businessName, role)

      if (i > 0) {
        const prev = path[i - 1]
        if (prev) addEdge(prev.taxId, node.taxId, prev.relationshipType)
      }
    }
  }

  const layoutedNodes = applyLayout(nodes, edges)
  return { nodes: layoutedNodes, edges }
}

/**
 * Interactive graph visualization using React Flow
 * Color legend:
 * - Cyan: start node (searched or first in path)
 * - Green: end node (last in path)
 * - Purple: inMyBase node
 * - Dark: external node
 */
export function GraphView({ cuitResult, pathResult }: GraphViewProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(cuitResult, pathResult),
    [cuitResult, pathResult]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildGraph(cuitResult, pathResult)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [cuitResult, pathResult, setNodes, setEdges])

  if (!cuitResult && !pathResult) return null

  return (
    <div className="space-y-2">
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

      <div style={{ height: "500px" }} className="rounded-lg border border-slate-700 overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.3 }}
        >
          <Background color="#1e293b" />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const bg = node.style?.background
              if (bg === "#0891b2") return "#0891b2"
              if (bg === "#16a34a") return "#16a34a"
              if (bg === "#6366f1") return "#6366f1"
              return "#334155"
            }}
          />
        </ReactFlow>
      </div>
    </div>
  )
}