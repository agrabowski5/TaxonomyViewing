import type { NodeRendererProps } from "react-arborist";
import type { TreeNode } from "../types";
import type { CustomNode } from "./types";

interface Props extends NodeRendererProps<TreeNode> {
  onNodeSelect?: (node: TreeNode) => void;
  customTree: CustomNode[];
}

function findCustomNode(tree: CustomNode[], id: string): CustomNode | null {
  for (const n of tree) {
    if (n.id === id) return n;
    if (n.children.length > 0) {
      const found = findCustomNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function countDescendants(n: TreeNode): number {
  if (!n.children) return 0;
  let count = n.children.length;
  for (const child of n.children) count += countDescendants(child);
  return count;
}

export function CustomTreeNode({ node, style, onNodeSelect, customTree }: Props) {
  const data = node.data;
  const isRoot = data.id === "custom-root";
  const customData = isRoot ? null : findCustomNode(customTree, data.id);
  const descendantCount = !node.isLeaf ? countDescendants(data) : 0;
  const paramCount = customData?.metaParameters.length ?? 0;
  const linkCount = customData?.mappingLinks.length ?? 0;
  const isGovernanceFlagged = customData?.governanceFlagged ?? false;

  return (
    <div
      className={`tree-node builder-tree-node ${node.isSelected ? "selected" : ""}`}
      style={style}
      onClick={(event) => {
        event.stopPropagation();
        node.handleClick(event);
        if (onNodeSelect) onNodeSelect(data);
      }}
    >
      <span
        className="toggle"
        onClick={(event) => {
          event.stopPropagation();
          node.toggle();
        }}
      >
        {node.isLeaf ? (
          <span className="toggle-spacer" />
        ) : node.isOpen ? (
          <span className="toggle-icon">v</span>
        ) : (
          <span className="toggle-icon">{">"}</span>
        )}
      </span>
      <span
        className="node-type-badge"
        style={{ backgroundColor: isRoot ? "#92400e" : "#d97706" }}
      >
        {data.code}
      </span>
      {!isRoot && <span className="builder-custom-marker">✦</span>}
      <span className="node-name" title={data.name}>
        {data.name}
      </span>
      {descendantCount > 0 && (
        <span className="descendant-count" title={`${descendantCount} items underneath`}>
          {descendantCount.toLocaleString()}
        </span>
      )}
      {isGovernanceFlagged && (
        <span className="builder-governance-badge" title="Pending governance review">
          governance
        </span>
      )}
      {paramCount > 0 && (
        <span className="builder-param-badge" title={`${paramCount} meta-parameter${paramCount > 1 ? "s" : ""}`}>
          {paramCount} param{paramCount > 1 ? "s" : ""}
        </span>
      )}
      {linkCount > 0 && (
        <span className="builder-link-icon" title={`${linkCount} cross-taxonomy mapping${linkCount > 1 ? "s" : ""}`}>
          🔗
        </span>
      )}
    </div>
  );
}
