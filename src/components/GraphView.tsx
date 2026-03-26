import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

type GraphNode = {
  id: string;
  label: string;
};

type GraphEdge = {
  source: string;
  target: string;
  label?: string;
};

type Props = {
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
};

export const GraphView = ({ graph }: Props) => {
  const nodes = graph.nodes.map((node, index) => ({
    id: node.id,
    data: { label: node.label },
    position: {
      x: index * 200,
      y: 100
    }
  }));

  const edges = graph.edges.map((edge, index) => ({
    id: `${edge.source}-${edge.target}-${index}`,
    source: edge.source,
    target: edge.target,
    label: edge.label
  }));

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <ReactFlow nodes={nodes} edges={edges}>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};