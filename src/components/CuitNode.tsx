import { Handle, Position, type NodeProps } from "@xyflow/react"

interface CuitNodeData {
  label: string
  nodeStyle: React.CSSProperties
}

/**
 * Custom React Flow node
 */
export function CuitNode({ data }: NodeProps) {
  const nodeData = data as unknown as CuitNodeData

  return (
    <div style={nodeData.nodeStyle}>
      <Handle type="target" position={Position.Top} />
      <div>{String(nodeData.label)}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}