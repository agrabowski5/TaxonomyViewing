import { useMemo } from "react";
import { Tree } from "react-arborist";
import { useContainerSize } from "../useContainerSize";
import { useBuilder } from "./context";
import { CustomTreeNode } from "./CustomTreeNode";
import { MetaParameterLayer } from "./MetaParameterModal";
import type { TreeNode } from "../types";
import type { CustomNode } from "./types";

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

  const handleNodeSelect = (node: TreeNode) => {
    if (node.id === "custom-root") {
      dispatch({ type: "SELECT_CUSTOM_NODE", id: null });
    } else {
      dispatch({ type: "SELECT_CUSTOM_NODE", id: node.id });
    }
  };

  return (
    <div className="tree-panel builder-tree-panel">
      <div className="panel-header">
        <h2>
          <span className="taxonomy-label custom">CUSTOM</span>
          Custom Taxonomy (Builder)
        </h2>
        <div className="panel-legend">Build your own classification hierarchy</div>
      </div>
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
            <div className="builder-empty-icon">✦</div>
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
            height={container.height - 72}
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
              />
            )}
          </Tree>
        )}
      </div>
      <MetaParameterLayer />
    </div>
  );
}
