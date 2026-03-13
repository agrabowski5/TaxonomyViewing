import type { TreeNode } from "./types";

export interface LayoutNode {
  id: string;
  data: TreeNode;
  x: number;
  y: number;
  parentId: string | null;
  isExpanded: boolean;
  isLeaf: boolean;
  depth: number;
}

export interface LayoutEdge {
  parentId: string;
  childId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  totalWidth: number;
  totalHeight: number;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 44;
const H_GAP = 12;
const V_GAP = 50;

export { NODE_WIDTH, NODE_HEIGHT };

/** Measure how wide a subtree needs to be */
function subtreeWidth(node: TreeNode, expandedIds: Set<string>): number {
  const isLeaf = !node.children || node.children.length === 0;
  const isExpanded = expandedIds.has(node.id);

  if (isLeaf || !isExpanded) {
    return NODE_WIDTH + H_GAP;
  }

  let total = 0;
  for (const child of node.children!) {
    total += subtreeWidth(child, expandedIds);
  }
  return Math.max(total, NODE_WIDTH + H_GAP);
}

/** Position nodes recursively, collecting flat arrays */
function assignPositions(
  node: TreeNode,
  xStart: number,
  depth: number,
  parentId: string | null,
  expandedIds: Set<string>,
  nodes: LayoutNode[],
  edges: LayoutEdge[],
) {
  const isLeaf = !node.children || node.children.length === 0;
  const isExpanded = expandedIds.has(node.id);
  const width = subtreeWidth(node, expandedIds);

  const x = xStart + width / 2 - NODE_WIDTH / 2;
  const y = depth * (NODE_HEIGHT + V_GAP);

  nodes.push({
    id: node.id,
    data: node,
    x,
    y,
    parentId,
    isExpanded,
    isLeaf,
    depth,
  });

  if (parentId) {
    const parentNode = nodes.find((n) => n.id === parentId);
    if (parentNode) {
      edges.push({
        parentId,
        childId: node.id,
        x1: parentNode.x + NODE_WIDTH / 2,
        y1: parentNode.y + NODE_HEIGHT,
        x2: x + NODE_WIDTH / 2,
        y2: y,
      });
    }
  }

  if (!isLeaf && isExpanded) {
    let cursor = xStart;
    for (const child of node.children!) {
      assignPositions(child, cursor, depth + 1, node.id, expandedIds, nodes, edges);
      cursor += subtreeWidth(child, expandedIds);
    }
  }
}

export function computeGraphLayout(
  data: TreeNode[],
  expandedIds: Set<string>,
): LayoutResult {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  // Create a virtual root that holds all top-level nodes
  let cursor = 0;
  for (const root of data) {
    assignPositions(root, cursor, 0, null, expandedIds, nodes, edges);
    cursor += subtreeWidth(root, expandedIds);
  }

  let maxX = 0;
  let maxY = 0;
  for (const n of nodes) {
    if (n.x + NODE_WIDTH > maxX) maxX = n.x + NODE_WIDTH;
    if (n.y + NODE_HEIGHT > maxY) maxY = n.y + NODE_HEIGHT;
  }

  return {
    nodes,
    edges,
    totalWidth: maxX + H_GAP * 2,
    totalHeight: maxY + V_GAP,
  };
}
