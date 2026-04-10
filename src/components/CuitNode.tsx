import { Handle, Position, type NodeProps } from "@xyflow/react"

interface CuitNodeData {
  label: string
  nodeStyle: React.CSSProperties
}

/**
 * Custom React Flow node that renders a CUIT with its display style.
 *
 * Accepts both a `target` handle (top) and a `source` handle (bottom)
 * to support directed edges in the graph.
 */
export function CuitNode({ data }: NodeProps) {
  const { label, nodeStyle } = data as unknown as CuitNodeData

  return (
    <div style={nodeStyle}>
      <Handle type="target" position={Position.Top} />
      <div>{String(label)}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}