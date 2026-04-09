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
import type { CuitSearchResponse, PathResponse } from "../types"
import { getRelationshipLabel } from "../utils/relationshipLabels"
import { CuitNode } from "./CuitNode"
import { getNode } from "../services/api"

const nodeTypes = { cuitNode: CuitNode }

const NODE_WIDTH = 200
const NODE_HEIGHT = 60

type NodeRole = "start" | "end" | "startInBase" | "endInBase" | "inMyBase" | "default"

function nodeStyle(role: NodeRole): React.CSSProperties {
  const styles: Record<NodeRole, React.CSSProperties> = {
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
    return { ...node, position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 } }
  })
}

interface GraphViewProps {
  cuitResult?: CuitSearchResponse | null
  pathResult?: PathResponse | null
  nodeResult?: CuitSearchResponse | null
}

interface TooltipState {
  nodeId: string
  info: Record<string, string | boolean | null> | null
  loading: boolean
}

function buildGraph(
  cuitResult?: CuitSearchResponse | null,
  pathResult?: PathResponse | null,
  nodeResult?: CuitSearchResponse | null,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const addedNodes = new Set<string>()
  const addedEdges = new Set<string>()

  function addNode(id: string, label: string, role: NodeRole) {
    if (addedNodes.has(id)) {
      if (role === "inMyBase") {
        const existing = nodes.find((n) => n.id === id)
        if (existing) existing.data = { ...existing.data, nodeStyle: nodeStyle("inMyBase") }
      }
      return
    }
    addedNodes.add(id)
    nodes.push({
      id,
      type: "cuitNode",
      data: { label, role, nodeStyle: nodeStyle(role) },
      position: { x: 0, y: 0 },
    })
  }

  function addEdge(source: string, target: string, label: string) {
    if (source === target) return
    const edgeId = `${source}-${target}-${label}`
    if (addedEdges.has(edgeId)) return
    addedEdges.add(edgeId)
    edges.push({
      id: edgeId,
      source,
      target,
      label: getRelationshipLabel(label),
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#475569" },
      style: { stroke: "#475569" },
      labelStyle: { fill: "#94a3b8", fontSize: 11 },
      labelBgStyle: { fill: "#0f172a", opacity: 0.8 },
    })
  }

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
    for (const segment of pathResult.path) {
      const isFirst = pathResult.path[0]?.from.taxId === segment.from.taxId
      const isLast = pathResult.path[pathResult.path.length - 1]?.to.taxId === segment.to.taxId

      addNode(segment.from.taxId, segment.from.businessName, getRole(segment.from.inMyBase, isFirst, false))
      addNode(segment.to.taxId, segment.to.businessName, getRole(segment.to.inMyBase, false, isLast))

      const combinedLabel = segment.relationships.map(r => getRelationshipLabel(r)).join(" / ")
      addEdge(segment.from.taxId, segment.to.taxId, combinedLabel)
    }
  }

  if (nodeResult?.results) {
    const firstPath = nodeResult.results[0]?.data.pathToBase
    const rootName = firstPath?.[0]?.businessName ?? nodeResult.cuit
    addNode(nodeResult.cuit, rootName, "start")

    for (const result of nodeResult.results) {
      if (result.data.pathToBase) {
        const path = result.data.pathToBase

        for (let i = 0; i < path.length; i++) {
          const node = path[i]
          if (!node) continue

          addNode(node.taxId, node.businessName, node.inMyBase ? "inMyBase" : "default")

          if (i === 0) {
            addEdge(nodeResult.cuit, node.taxId, node.relationshipType)
          } else {
            const prev = path[i - 1]
            if (prev) addEdge(prev.taxId, node.taxId, node.relationshipType)
          }
        }
      }
    }
  }

  return { nodes: applyLayout(nodes, edges), edges }
}

/**
 * Interactive graph visualization using React Flow
 */
export function GraphView({ cuitResult, pathResult, nodeResult }: GraphViewProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(cuitResult, pathResult, nodeResult),
    [cuitResult, pathResult, nodeResult]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = buildGraph(cuitResult, pathResult, nodeResult)
    setNodes(newNodes)
    setEdges(newEdges)
  }, [cuitResult, pathResult, nodeResult, setNodes, setEdges])

  async function handleNodeMouseEnter(_: React.MouseEvent, node: Node) {
    setTooltip({ nodeId: node.id, info: null, loading: true })
    try {
      const info = await getNode(node.id) as Record<string, string | boolean | null>
      setTooltip(prev => prev ? { ...prev, info, loading: false } : null)
    } catch {
      setTooltip(prev => prev ? { ...prev, loading: false } : null)
    }
  }

  function handleNodeMouseLeave() {
    setTooltip(null)
  }

  if (!cuitResult && !pathResult && !nodeResult) return null

  return (
    <div className="space-y-2">
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

      <div style={{ height: "500px" }} className="relative rounded-lg border border-slate-700 overflow-hidden bg-slate-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeMouseEnter={handleNodeMouseEnter}
          onNodeMouseLeave={handleNodeMouseLeave}
          fitView
          fitViewOptions={{ padding: 0.3 }}
        >
          <Background color="#1e293b" />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as { nodeStyle?: { background?: string } }
              const bg = data.nodeStyle?.background
              if (bg === "#0891b2") return "#0891b2"
              if (bg === "#16a34a") return "#16a34a"
              if (bg === "#6366f1") return "#6366f1"
              return "#334155"
            }}
          />
        </ReactFlow>

        {/* Tooltip */}
        {tooltip && (
          <div className="absolute top-3 right-3 z-50 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs shadow-xl pointer-events-none"
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
        )}
      </div>
    </div>
  )
}