import { useMemo, useCallback } from "react";
import { Tree } from "react-arborist";
import { useContainerSize } from "../useContainerSize";
import { useBuilder } from "./context";
import { saveToLibrary } from "./persistence";
import { CustomTreeNode } from "./CustomTreeNode";
import type { TreeNode } from "../types";
import type { CustomNode, ModificationStatus } from "./types";

const SECTION_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#a855f7",
  "#d946ef", "#f59e0b", "#10b981", "#0891b2", "#7c3aed",
  "#db2777", "#dc2626",
];

function customNodeToTreeNode(node: CustomNode): TreeNode {
  return {
    id: node.id,
    code: node.code,
    name: node.name,
    type: node.type,
    children: node.children.length > 0
      ? node.children.map(customNodeToTreeNode)
      : undefined,
  };
}

/** Walk custom tree and collect modification status for each node */
function buildModificationMap(nodes: CustomNode[]): Map<string, ModificationStatus> {
  const map = new Map<string, ModificationStatus>();
  function walk(list: CustomNode[]) {
    for (const n of list) {
      map.set(n.id, n.modificationStatus);
      if (n.children.length > 0) walk(n.children);
    }
  }
  walk(nodes);
  return map;
}

/** Build section-based color map (same palette as standard taxonomies) */
function buildColorMap(tree: CustomNode[]): Record<string, string> {
  const colorMap: Record<string, string> = {};
  tree.forEach((section, index) => {
    const color = SECTION_COLORS[index % SECTION_COLORS.length];
    const assignColor = (node: CustomNode) => {
      colorMap[node.id] = color;
      if (node.children.length > 0) node.children.forEach(assignColor);
    };
    assignColor(section);
  });
  return colorMap;
}

/** Filter tree nodes by search term, keeping matching nodes + ancestors */
function filterTreeNodes(tree: TreeNode[], term: string): TreeNode[] {
  if (!term.trim()) return tree;
  const lower = term.trim().toLowerCase();

  function matches(node: TreeNode): boolean {
    return node.code.toLowerCase().includes(lower) || node.name.toLowerCase().includes(lower);
  }

  function filter(nodes: TreeNode[]): TreeNode[] {
    const result: TreeNode[] = [];
    for (const node of nodes) {
      if (matches(node)) {
        result.push(node);
      } else if (node.children) {
        const filtered = filter(node.children);
        if (filtered.length > 0) {
          result.push({ ...node, children: filtered });
        }
      }
    }
    return result;
  }

  return filter(tree);
}

interface BuilderTaxonomyPanelProps {
  onShowBaseTaxonomyDialog?: () => void;
  onShowLibrary?: () => void;
  searchTerm?: string;
  onNodeSelect?: (node: TreeNode) => void;
}

export function BuilderTaxonomyPanel({ onShowBaseTaxonomyDialog, onShowLibrary, searchTerm = "", onNodeSelect }: BuilderTaxonomyPanelProps) {
  const { state, dispatch } = useBuilder();
  const container = useContainerSize();

  const isSearching = searchTerm.trim().length > 0;

  const treeData = useMemo<TreeNode[]>(() => {
    const children = state.customTree.map(customNodeToTreeNode);
    const root: TreeNode = {
      id: "custom-root",
      code: "ROOT",
      name: state.rootName,
      type: "internal",
      children: isSearching ? filterTreeNodes(children, searchTerm) : children,
    };
    return [root];
  }, [state.customTree, state.rootName, searchTerm, isSearching]);

  const modificationMap = useMemo(
    () => buildModificationMap(state.customTree),
    [state.customTree]
  );

  const colorMap = useMemo(
    () => buildColorMap(state.customTree),
    [state.customTree]
  );

  const handleNodeSelect = (node: TreeNode) => {
    if (node.id === "custom-root") {
      dispatch({ type: "SELECT_CUSTOM_NODE", id: null });
    } else {
      dispatch({ type: "SELECT_CUSTOM_NODE", id: node.id });
    }
    if (onNodeSelect) onNodeSelect(node);
  };

  const handleQuickSave = useCallback(() => {
    if (state.customTree.length === 0) return;
    const name = `${state.rootName} — ${new Date().toLocaleDateString()}`;
    saveToLibrary(name, state);
    dispatch({ type: "MARK_SAVED" });
  }, [state, dispatch]);

  return (
    <div className="tree-panel builder-tree-panel">
      <div className="builder-tree-actions">
        <button
          className="builder-quick-add-btn"
          onClick={() => {
            dispatch({ type: "QUICK_ADD_START", parentNodeId: state.selectedCustomNodeId });
          }}
        >
          + Quick Add
        </button>
        <span className="builder-actions-spacer" />
        {state.customTree.length > 0 && (
          <button className="builder-save-btn" onClick={handleQuickSave}>
            Save
          </button>
        )}
        {onShowLibrary && (
          <button className="builder-library-btn" onClick={onShowLibrary}>
            Library
          </button>
        )}
      </div>
      <div className="tree-container" ref={container.ref}>
        {state.customTree.length === 0 ? (
          <div className="builder-empty-state">
            <div className="builder-empty-icon">+</div>
            <h3>{state.rootName}</h3>
            <p>Your custom taxonomy is empty.</p>
            <p>Click "Add Node" or use the Node Creation Guide to get started.</p>
            {onShowBaseTaxonomyDialog && (
              <button
                className="builder-use-base-btn"
                onClick={onShowBaseTaxonomyDialog}
              >
                Use Existing Taxonomy as Base
              </button>
            )}
          </div>
        ) : (
          <Tree<TreeNode>
            key={`builder-${searchTerm}`}
            initialData={treeData}
            width={container.width}
            height={container.height - 40}
            rowHeight={32}
            indent={20}
            openByDefault={isSearching}
            disableDrag
            disableDrop
            disableEdit
          >
            {(props) => (
              <CustomTreeNode
                {...props}
                onNodeSelect={handleNodeSelect}
                customTree={state.customTree}
                modificationMap={modificationMap}
                colorMap={colorMap}
              />
            )}
          </Tree>
        )}
      </div>
    </div>
  );
}
