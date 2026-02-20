import { useState, useRef, useEffect } from "react";
import type { NodeRendererProps } from "react-arborist";
import type { TreeNode } from "../types";
import type { CustomNode, ModificationStatus } from "./types";
import { useBuilder } from "./context";

interface Props extends NodeRendererProps<TreeNode> {
  onNodeSelect?: (node: TreeNode) => void;
  customTree: CustomNode[];
  modificationMap: Map<string, ModificationStatus>;
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

export function CustomTreeNode({ node, style, onNodeSelect, customTree, modificationMap }: Props) {
  const { dispatch } = useBuilder();
  const data = node.data;
  const isRoot = data.id === "custom-root";
  const customData = isRoot ? null : findCustomNode(customTree, data.id);
  const descendantCount = !node.isLeaf ? countDescendants(data) : 0;
  const paramCount = customData?.metaParameters.length ?? 0;
  const linkCount = customData?.mappingLinks.length ?? 0;
  const isGovernanceFlagged = customData?.governanceFlagged ?? false;
  const modStatus = modificationMap.get(data.id) ?? "original";

  // Inline editing state
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isRoot) return;
    e.stopPropagation();
    setEditValue(data.name);
    setEditing(true);
  };

  const commitEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== data.name) {
      dispatch({ type: "INLINE_EDIT_NODE", id: data.id, field: "name", value: trimmed });
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const modClass = modStatus === "added" ? "node-added" : modStatus === "modified" ? "node-modified" : "";

  return (
    <div
      className={`tree-node builder-tree-node ${node.isSelected ? "selected" : ""} ${modClass}`}
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
      {editing ? (
        <input
          ref={inputRef}
          className="inline-edit-input"
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="node-name" title={data.name} onDoubleClick={handleDoubleClick}>
          {data.name}
        </span>
      )}
      {descendantCount > 0 && (
        <span className="descendant-count" title={`${descendantCount} items underneath`}>
          {descendantCount.toLocaleString()}
        </span>
      )}
      {modStatus === "added" && (
        <span className="modification-badge modification-added">new</span>
      )}
      {modStatus === "modified" && (
        <span className="modification-badge modification-modified">edited</span>
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
          L
        </span>
      )}
    </div>
  );
}
