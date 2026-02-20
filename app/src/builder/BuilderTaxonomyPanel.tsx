import { useMemo } from "react";
import { Tree } from "react-arborist";
import { useContainerSize } from "../useContainerSize";
import { useBuilder } from "./context";
import { CustomTreeNode } from "./CustomTreeNode";
import type { TreeNode } from "../types";
import type { CustomNode, ModificationStatus } from "./types";

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

interface BuilderTaxonomyPanelProps {
  onShowBaseTaxonomyDialog?: () => void;
}

export function BuilderTaxonomyPanel({ onShowBaseTaxonomyDialog }: BuilderTaxonomyPanelProps) {
  const { state, dispatch } = useBuilder();
  const container = useContainerSize();

  const treeData = useMemo<TreeNode[]>(() => {
    const root: TreeNode = {
      id: "custom-root",
      code: "ROOT",
      name: state.rootName,
      type: "internal",
      children: state.customTree.map(customNodeToTreeNode),
    };
    return [root];
  }, [state.customTree, state.rootName]);

  const modificationMap = useMemo(
    () => buildModificationMap(state.customTree),
    [state.customTree]
  );

  const handleNodeSelect = (node: TreeNode) => {
    if (node.id === "custom-root") {
      dispatch({ type: "SELECT_CUSTOM_NODE", id: null });
    } else {
      dispatch({ type: "SELECT_CUSTOM_NODE", id: node.id });
    }
  };

  return (
    <div className="tree-panel builder-tree-panel">
      <div className="builder-tree-actions">
        <button
          className="builder-add-node-btn"
          onClick={() => {
            dispatch({ type: "WIZARD_START", parentNodeId: state.selectedCustomNodeId });
            if (!state.guideSidebarOpen) {
              dispatch({ type: "TOGGLE_GUIDE_SIDEBAR" });
            }
          }}
        >
          + Add Node
        </button>
        <button
          className="builder-quick-add-btn"
          onClick={() => {
            dispatch({ type: "QUICK_ADD_START", parentNodeId: state.selectedCustomNodeId });
          }}
        >
          + Quick Add
        </button>
        {state.selectedCustomNodeId && (
          <button
            className="builder-add-child-btn"
            onClick={() => {
              dispatch({ type: "WIZARD_START", parentNodeId: state.selectedCustomNodeId });
              if (!state.guideSidebarOpen) {
                dispatch({ type: "TOGGLE_GUIDE_SIDEBAR" });
              }
            }}
          >
            + Add Child
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
            initialData={treeData}
            width={container.width}
            height={container.height - 40}
            rowHeight={32}
            indent={20}
            openByDefault={state.customTree.length < 200}
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
              />
            )}
          </Tree>
        )}
      </div>
    </div>
  );
}
