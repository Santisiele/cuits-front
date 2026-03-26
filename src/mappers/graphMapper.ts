import type { GraphEdge, GraphNode } from "../types/graph";

export const mapPathToGraph = (path: any[]) => {
  const nodesMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (let i = 0; i < path.length; i++) {
    const current = path[i];

    if (!nodesMap.has(current.taxId)) {
      nodesMap.set(current.taxId, {
        id: current.taxId,
        label: current.businessName
      });
    }

    if (i > 0) {
      const prev = path[i - 1];

      edges.push({
        source: prev.taxId,
        target: current.taxId,
        label: current.relationshipType
      });
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    edges
  };
};